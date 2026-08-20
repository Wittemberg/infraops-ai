import { WanFailoverPolicy, WanLink } from "../types";
import { NetworkDeviceStoreData } from "../networkDeviceService";
import { WanActionManager } from "../actions/wanActions";

export interface FailoverEvaluationResult {
  triggered: boolean;
  policyId: string;
  reason?: string;
  actionTaken?: string;
  flappingBlocked?: boolean;
}

export class WanSelfHealingEngine {
  static getPolicies(store: { wanFailoverPolicies?: WanFailoverPolicy[] }, tenantId: string, deviceId?: string): WanFailoverPolicy[] {
    let list = (store.wanFailoverPolicies || []).filter((p) => p.tenantId === tenantId);
    if (deviceId) {
      list = list.filter((p) => p.deviceId === deviceId);
    }
    return list;
  }

  static createDefaultPoliciesForDevice(
    store: { wanFailoverPolicies?: WanFailoverPolicy[] },
    tenantId: string,
    deviceId: string
  ): WanFailoverPolicy[] {
    if (!store.wanFailoverPolicies) store.wanFailoverPolicies = [];

    const defaultPolicy: WanFailoverPolicy = {
      id: `pol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId,
      tenantId,
      name: "🛡️ Auto-Failover com Anti-Flapping (Perda > 15% ou Queda)",
      enabled: true,
      triggerType: "combined",
      maxPacketLossPercent: 15,
      maxLatencyMs: 250,
      debounceSeconds: 60, // Link must stay bad for 60s
      hysteresisSeconds: 120, // Must be stable for 120s
      cooldownMinutes: 15, // Max 1 trigger every 15 min
      circuitBreakerMaxPerHour: 3, // Max 3 switches per hour
      autoReturnToPrimary: true,
      minPrimaryHealthyMinutes: 10,
      switchesLastHour: 0,
    };

    store.wanFailoverPolicies.push(defaultPolicy);
    return [defaultPolicy];
  }

  static async evaluateDeviceWanHealth(
    store: NetworkDeviceStoreData & { wanFailoverPolicies?: WanFailoverPolicy[] },
    tenantId: string,
    deviceId: string
  ): Promise<FailoverEvaluationResult[]> {
    const policies = this.getPolicies(store, tenantId, deviceId).filter((p) => p.enabled);
    const wanLinks = (store.wanLinks || []).filter((w) => w.deviceId === deviceId && w.tenantId === tenantId);
    const primaryWan = wanLinks.find((w) => w.isPrimary);
    const backupWan = wanLinks.find((w) => !w.isPrimary && w.status !== "down" && w.status !== "disabled");

    const results: FailoverEvaluationResult[] = [];

    if (!primaryWan || !backupWan) {
      return results;
    }

    for (const policy of policies) {
      // Check Circuit Breaker (Anti-Flapping)
      if (policy.switchesLastHour >= policy.circuitBreakerMaxPerHour) {
        results.push({
          triggered: false,
          policyId: policy.id,
          flappingBlocked: true,
          reason: `⚠️ Circuit Breaker Ativo: Limite de ${policy.circuitBreakerMaxPerHour} trocas/hora atingido. Comutação bloqueada para evitar instabilidade.`,
        });
        continue;
      }

      // Check Cooldown
      if (policy.lastTriggeredAt) {
        const minutesSinceLast = (Date.now() - new Date(policy.lastTriggeredAt).getTime()) / (1000 * 60);
        if (minutesSinceLast < policy.cooldownMinutes) {
          results.push({
            triggered: false,
            policyId: policy.id,
            reason: `Em período de cooldown (${minutesSinceLast.toFixed(0)}m / ${policy.cooldownMinutes}m).`,
          });
          continue;
        }
      }

      // Trigger condition check
      let shouldSwitch = false;
      let triggerReason = "";

      if (primaryWan.status === "down") {
        shouldSwitch = true;
        triggerReason = `Link primário '${primaryWan.name}' está DOWN`;
      } else if (policy.triggerType === "loss" || policy.triggerType === "combined") {
        if (primaryWan.packetLossPercent >= policy.maxPacketLossPercent) {
          shouldSwitch = true;
          triggerReason = `Perda de pacotes do link primário atingiu ${primaryWan.packetLossPercent}% (limite: ${policy.maxPacketLossPercent}%)`;
        }
      } else if (policy.triggerType === "latency" || policy.triggerType === "combined") {
        if (primaryWan.latencyMs >= policy.maxLatencyMs) {
          shouldSwitch = true;
          triggerReason = `Latência do link primário atingiu ${primaryWan.latencyMs}ms (limite: ${policy.maxLatencyMs}ms)`;
        }
      }

      if (shouldSwitch) {
        // Execute Governed Action
        const actionResult = await WanActionManager.executeAction(store, {
          actionKey: "network.set_primary_wan",
          deviceId,
          tenantId,
          targetWanId: backupWan.id,
          requestedBy: `Auto-Remediation Policy: ${policy.name}`,
          reason: triggerReason,
        });

        if (actionResult.success) {
          policy.lastTriggeredAt = new Date().toISOString();
          policy.switchesLastHour = (policy.switchesLastHour || 0) + 1;
        }

        results.push({
          triggered: true,
          policyId: policy.id,
          reason: triggerReason,
          actionTaken: actionResult.message,
        });
      }
    }

    return results;
  }
}
