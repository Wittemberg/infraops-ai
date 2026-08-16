import { AlertEngineService } from "../alert_engine.service.js";
import { NotificationService } from "../notification.service.js";

describe("Stage 17 - Alerts, Incidents & Notifications Acceptance Tests", () => {
  let alertEngine: AlertEngineService;
  let notificationService: NotificationService;

  beforeEach(() => {
    alertEngine = new AlertEngineService();
    notificationService = new NotificationService();
  });

  test("1. Alert deduplication updates lastSeenAt and occurrenceCount for matching fingerprint", () => {
    const data = {
      tenantId: "tenant-A",
      targetId: "node-101",
      alertType: "storage_pressure",
      summary: "Storage usage > 90%",
      severity: "high" as const,
    };

    const first = alertEngine.processAlert(data);
    expect(first.isNew).toBe(true);
    expect(first.alert.occurrenceCount).toBe(1);

    const second = alertEngine.processAlert(data);
    expect(second.isNew).toBe(false);
    expect(second.alert.occurrenceCount).toBe(2);
  });

  test("2. Maintenance window silences notifications while preserving alert history", () => {
    const window = { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startHour: 0, endHour: 24 }; // Always in window

    const res = alertEngine.processAlert(
      {
        tenantId: "tenant-A",
        targetId: "node-pve02",
        alertType: "host_rebooting",
        summary: "Planned reboot",
        severity: "critical",
      },
      window
    );

    expect(res.alert.status).toBe("silenced_maintenance");

    const notifications = notificationService.dispatchNotification(res.alert, "https://example.com/webhook", "admin@example.com");
    expect(notifications).toHaveLength(0); // Notification silenced!
  });

  test("3. Incident correlation groups related alerts into an Incident", () => {
    alertEngine.processAlert({
      tenantId: "tenant-A",
      targetId: "node-101",
      alertType: "backup_failed",
      summary: "Vzdump backup failed",
      severity: "critical",
    });

    alertEngine.processAlert({
      tenantId: "tenant-A",
      targetId: "node-101",
      alertType: "storage_pressure",
      summary: "Local zfs pool full",
      severity: "high",
    });

    const incidents = alertEngine.correlateAlertsToIncident("tenant-A");
    expect(incidents).toHaveLength(1);
    expect(incidents[0].title).toContain("Multiple operational issues on target 'node-101'");
    expect(incidents[0].severity).toBe("critical");
  });

  test("4. Alertmanager webhook receiver ingests external alert items", () => {
    const body = {
      alerts: [
        {
          labels: { alertname: "HostDown", instance: "pve01.local" },
          annotations: { summary: "Node pve01 unreachable for > 3 minutes" },
        },
      ],
    };

    const parsed = notificationService.handleAlertmanagerWebhook(body);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].alertType).toBe("HostDown");
    expect(parsed[0].targetId).toBe("pve01.local");
  });

  test("5. Alert resolution state transitions to 'resolved'", () => {
    const res = alertEngine.processAlert({
      tenantId: "tenant-A",
      targetId: "node-101",
      alertType: "cpu_high",
      summary: "CPU > 95%",
      severity: "warning",
    });

    const resolved = alertEngine.resolveAlert(res.alert.fingerprint);
    expect(resolved?.status).toBe("resolved");
  });
});
