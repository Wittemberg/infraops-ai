import {
  NetworkDeviceProfile,
  WanLink,
  NetworkChangeSnapshot,
  NetworkActionRun,
} from "../types";
import { NetworkDeviceService, NetworkDeviceStoreData } from "../networkDeviceService";
import crypto from "crypto";

export interface ExecuteWanActionParams {
  actionKey:
    | "network.set_primary_wan"
    | "network.set_wan_failover"
    | "network.set_wan_balance"
    | "network.enable_wan"
    | "network.disable_wan"
    | "network.rollback_wan_change";
  deviceId: string;
  tenantId: string;
  targetWanId?: string;
  secondaryWanId?: string;
  weights?: Record<string, number>;
  snapshotId?: string;
  requestedBy: string;
  reason?: string;
}

export interface WanActionExecutionResult {
  success: boolean;
  actionRun: NetworkActionRun;
  message: string;
  error?: string;
  rolledBack?: boolean;
}

export class WanActionManager {
  static async executeAction(
    store: NetworkDeviceStoreData,
    params: ExecuteWanActionParams
  ): Promise<WanActionExecutionResult> {
    const { actionKey, deviceId, tenantId, targetWanId, requestedBy } = params;

    const device = NetworkDeviceService.getDeviceById(store, tenantId, deviceId);
    if (!device) {
      throw new Error(`Dispositivo de rede '${deviceId}' não encontrado para o tenant.`);
    }

    const allWans = NetworkDeviceService.getWanLinks(store, tenantId, deviceId);
    const driver = NetworkDeviceService.getDriver(device.vendor);

    // 1. PRECHECK
    const precheckResults: Array<{ name: string; status: "pass" | "fail"; details: string }> = [];
    let precheckPassed = true;

    // Check device reachable
    const isOnline = device.status !== "unreachable" && device.status !== "offline";
    precheckResults.push({
      name: "Conectividade de Gerência do Roteador",
      status: isOnline ? "pass" : "fail",
      details: isOnline ? `Equipamento online via ${device.ipAddress}:${device.managementPort}` : "Dispositivo inacessível",
    });
    if (!isOnline) precheckPassed = false;

    // If setting primary WAN, check target link
    if (actionKey === "network.set_primary_wan" && targetWanId) {
      const targetWan = allWans.find((w) => w.id === targetWanId);
      if (!targetWan) {
        precheckResults.push({
          name: "Existência do Link WAN Destino",
          status: "fail",
          details: `Link '${targetWanId}' não existe no equipamento`,
        });
        precheckPassed = false;
      } else {
        const isUp = targetWan.status !== "down" && targetWan.status !== "disabled";
        precheckResults.push({
          name: `Status da Interface WAN (${targetWan.name})`,
          status: isUp ? "pass" : "fail",
          details: isUp ? `Interface ${targetWan.interfaceName} está UP` : "Interface está DOWN ou desabilitada",
        });
        if (!isUp) precheckPassed = false;

        const lossOk = targetWan.packetLossPercent < 25;
        precheckResults.push({
          name: "Integridade de Pacotes do Link Destino",
          status: lossOk ? "pass" : "fail",
          details: `Perda de pacotes atual: ${targetWan.packetLossPercent}% (tolerância < 25%)`,
        });
        if (!lossOk) precheckPassed = false;
      }
    }

    if (!precheckPassed) {
      const failedRun: NetworkActionRun = {
        id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        deviceId,
        tenantId,
        actionKey,
        requestedBy,
        executedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "failed",
        snapshotId: "",
        precheck: { passed: false, checks: precheckResults },
        eventHash: crypto.createHash("sha256").update(`${deviceId}:${actionKey}:PRECHECK_FAILED:${Date.now()}`).digest("hex"),
      };
      if (!store.networkActionRuns) store.networkActionRuns = [];
      store.networkActionRuns.unshift(failedRun);
      return {
        success: false,
        actionRun: failedRun,
        message: "Falha na pré-checagem de segurança (Precheck). Nenhuma alteração foi realizada.",
        error: "PRECHECK_FAILED",
      };
    }

    // 2. CAPTURE SNAPSHOT BEFORE MUTATION
    const snapshot = NetworkDeviceService.captureSnapshot(store, tenantId, deviceId, actionKey);

    // 3. DRIVER EXECUTION
    let driverResult: { success: boolean; message: string; error?: string };

    try {
      if (actionKey === "network.set_primary_wan" && targetWanId) {
        driverResult = await driver.setPrimaryWan(device, targetWanId, allWans);
      } else if (actionKey === "network.set_wan_failover" && targetWanId && params.secondaryWanId) {
        driverResult = await driver.setWanFailover(device, targetWanId, params.secondaryWanId, allWans);
      } else if (actionKey === "network.set_wan_balance" && params.weights) {
        driverResult = await driver.setWanBalance(device, params.weights, allWans);
      } else if (actionKey === "network.enable_wan" && targetWanId) {
        driverResult = await driver.enableWan(device, targetWanId, allWans);
      } else if (actionKey === "network.disable_wan" && targetWanId) {
        driverResult = await driver.disableWan(device, targetWanId, allWans);
      } else if (actionKey === "network.rollback_wan_change") {
        const snap = store.networkSnapshots.find((s) => s.id === params.snapshotId) || snapshot;
        driverResult = await driver.rollbackWanChange(device, snap, allWans);
      } else {
        driverResult = { success: false, message: "Ação não suportada ou parâmetros incompletos.", error: "INVALID_ACTION" };
      }
    } catch (err: any) {
      driverResult = { success: false, message: `Erro na execução do driver: ${err.message}`, error: err.message };
    }

    if (!driverResult.success) {
      const failedRun: NetworkActionRun = {
        id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        deviceId,
        tenantId,
        actionKey,
        requestedBy,
        executedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "failed",
        snapshotId: snapshot.id,
        precheck: { passed: true, checks: precheckResults },
        eventHash: crypto.createHash("sha256").update(`${deviceId}:${actionKey}:EXEC_FAILED:${Date.now()}`).digest("hex"),
      };
      if (!store.networkActionRuns) store.networkActionRuns = [];
      store.networkActionRuns.unshift(failedRun);
      return {
        success: false,
        actionRun: failedRun,
        message: driverResult.message,
        error: driverResult.error,
      };
    }

    // 4. POSTCHECK
    const targetWan = allWans.find((w) => w.id === targetWanId) || allWans.find((w) => w.isPrimary) || allWans[0];
    const postcheck = await driver.validatePostChange(device, targetWan, allWans);

    if (!postcheck.passed) {
      // POSTCHECK FAILED: TRIGGER DETERMINISTIC ROLLBACK
      const rollbackResult = await driver.rollbackWanChange(device, snapshot, allWans);

      const rolledBackRun: NetworkActionRun = {
        id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        deviceId,
        tenantId,
        actionKey,
        requestedBy,
        executedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "rolled_back",
        snapshotId: snapshot.id,
        precheck: { passed: true, checks: precheckResults },
        postcheck: { passed: false, checks: postcheck.checks },
        rollbackDetails: {
          triggeredAt: new Date().toISOString(),
          success: rollbackResult.success,
          error: rollbackResult.error,
        },
        eventHash: crypto.createHash("sha256").update(`${deviceId}:${actionKey}:ROLLED_BACK:${Date.now()}`).digest("hex"),
      };

      if (!store.networkActionRuns) store.networkActionRuns = [];
      store.networkActionRuns.unshift(rolledBackRun);

      return {
        success: false,
        rolledBack: true,
        actionRun: rolledBackRun,
        message: `⚠️ Postcheck falhou! Rollback automático executado com sucesso para proteger o tráfego do cliente. (${rollbackResult.message})`,
      };
    }

    // 5. SUCCESS
    const successRun: NetworkActionRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId,
      tenantId,
      actionKey,
      requestedBy,
      executedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "success",
      snapshotId: snapshot.id,
      precheck: { passed: true, checks: precheckResults },
      postcheck: { passed: true, checks: postcheck.checks },
      eventHash: crypto.createHash("sha256").update(`${deviceId}:${actionKey}:SUCCESS:${Date.now()}`).digest("hex"),
    };

    if (!store.networkActionRuns) store.networkActionRuns = [];
    store.networkActionRuns.unshift(successRun);
    if (store.networkActionRuns.length > 50) store.networkActionRuns.pop();

    return {
      success: true,
      actionRun: successRun,
      message: driverResult.message,
    };
  }
}
