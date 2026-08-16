import { createHash } from "crypto";
import { MaintenanceWindow, isWithinMaintenanceWindow } from "@infraops/policy-engine";

export type AlertSeverity = "info" | "warning" | "high" | "critical";
export type AlertStatus = "active" | "silenced_maintenance" | "resolved";

export interface AlertRecord {
  id: string;
  fingerprint: string;
  tenantId: string;
  targetId: string;
  alertType: string;
  dimension: string;
  severity: AlertSeverity;
  status: AlertStatus;
  summary: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  occurrenceCount: number;
}

export interface IncidentRecord {
  id: string;
  tenantId: string;
  title: string;
  severity: AlertSeverity;
  status: "open" | "investigating" | "resolved";
  alertFingerprints: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class AlertEngineService {
  private alertsStore: Map<string, AlertRecord> = new Map();
  private incidentsStore: Map<string, IncidentRecord> = new Map();

  public computeFingerprint(tenantId: string, targetId: string, alertType: string, dimension = "default"): string {
    const raw = `${tenantId}:${targetId}:${alertType}:${dimension}`;
    return createHash("sha256").update(raw, "utf8").digest("hex");
  }

  public processAlert(
    alertData: {
      tenantId: string;
      targetId: string;
      alertType: string;
      dimension?: string;
      severity: AlertSeverity;
      summary: string;
    },
    maintenanceWindow?: MaintenanceWindow,
    now: Date = new Date()
  ): { alert: AlertRecord; isNew: boolean } {
    const dimension = alertData.dimension || "default";
    const fingerprint = this.computeFingerprint(alertData.tenantId, alertData.targetId, alertData.alertType, dimension);

    let status: AlertStatus = "active";
    if (maintenanceWindow && isWithinMaintenanceWindow(maintenanceWindow, now)) {
      status = "silenced_maintenance";
    }

    const existing = this.alertsStore.get(fingerprint);

    if (existing && existing.status !== "resolved") {
      existing.lastSeenAt = now;
      existing.occurrenceCount += 1;
      existing.summary = alertData.summary;
      // Maintain silenced status if inside window
      if (status === "silenced_maintenance") {
        existing.status = "silenced_maintenance";
      }
      return { alert: existing, isNew: false };
    }

    const alertId = `alt-${Math.random().toString(36).substring(2, 10)}`;
    const newAlert: AlertRecord = {
      id: alertId,
      fingerprint,
      tenantId: alertData.tenantId,
      targetId: alertData.targetId,
      alertType: alertData.alertType,
      dimension,
      severity: alertData.severity,
      status,
      summary: alertData.summary,
      firstSeenAt: now,
      lastSeenAt: now,
      occurrenceCount: 1,
    };

    this.alertsStore.set(fingerprint, newAlert);
    return { alert: newAlert, isNew: true };
  }

  public correlateAlertsToIncident(tenantId: string): IncidentRecord[] {
    const tenantAlerts = Array.from(this.alertsStore.values()).filter(
      (a) => a.tenantId === tenantId && a.status === "active"
    );

    // Group alerts by targetId
    const groupedByTarget: Record<string, AlertRecord[]> = {};
    for (const alert of tenantAlerts) {
      if (!groupedByTarget[alert.targetId]) groupedByTarget[alert.targetId] = [];
      groupedByTarget[alert.targetId].push(alert);
    }

    const createdIncidents: IncidentRecord[] = [];

    for (const [targetId, alerts] of Object.entries(groupedByTarget)) {
      const hasBackupFail = alerts.some((a) => a.alertType.includes("backup"));
      const hasStoragePressure = alerts.some((a) => a.alertType.includes("storage"));

      if (alerts.length >= 2 || (hasBackupFail && hasStoragePressure)) {
        const incidentId = `inc-${Math.random().toString(36).substring(2, 10)}`;
        const incident: IncidentRecord = {
          id: incidentId,
          tenantId,
          title: `Multiple operational issues on target '${targetId}' (${alerts.map((a) => a.alertType).join(", ")})`,
          severity: alerts.some((a) => a.severity === "critical") ? "critical" : "high",
          status: "open",
          alertFingerprints: alerts.map((a) => a.fingerprint),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.incidentsStore.set(incidentId, incident);
        createdIncidents.push(incident);
      }
    }

    return createdIncidents;
  }

  public resolveAlert(fingerprint: string): AlertRecord | undefined {
    const alert = this.alertsStore.get(fingerprint);
    if (alert) {
      alert.status = "resolved";
    }
    return alert;
  }

  public getAlert(fingerprint: string): AlertRecord | undefined {
    return this.alertsStore.get(fingerprint);
  }
}
