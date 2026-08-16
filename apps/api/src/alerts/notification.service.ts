import { AlertRecord } from "./alert_engine.service.js";

export interface NotificationPayload {
  channel: "webhook" | "email";
  destination: string;
  subject: string;
  body: string;
  sentAt: Date;
}

export class NotificationService {
  private dispatchedNotifications: NotificationPayload[] = [];

  public dispatchNotification(alert: AlertRecord, webhookUrl?: string, emailAddress?: string): NotificationPayload[] {
    if (alert.status === "silenced_maintenance") {
      // Silenced during maintenance window -> no notifications sent
      return [];
    }

    const results: NotificationPayload[] = [];

    // Critical & High severity trigger immediate webhook & email
    if ((alert.severity === "critical" || alert.severity === "high") && webhookUrl) {
      const payload: NotificationPayload = {
        channel: "webhook",
        destination: webhookUrl,
        subject: `[CRITICAL ALERT] ${alert.alertType} on ${alert.targetId}`,
        body: alert.summary,
        sentAt: new Date(),
      };
      this.dispatchedNotifications.push(payload);
      results.push(payload);
    }

    if (alert.severity === "critical" && emailAddress) {
      const payload: NotificationPayload = {
        channel: "email",
        destination: emailAddress,
        subject: `URGENT: ${alert.alertType} - ${alert.targetId}`,
        body: alert.summary,
        sentAt: new Date(),
      };
      this.dispatchedNotifications.push(payload);
      results.push(payload);
    }

    return results;
  }

  public handleAlertmanagerWebhook(body: any): Array<{ alertType: string; targetId: string; summary: string }> {
    if (!body || !Array.isArray(body.alerts)) {
      return [];
    }

    return body.alerts.map((item: any) => ({
      alertType: item.labels?.alertname || "prometheus_alert",
      targetId: item.labels?.instance || item.labels?.node || "unknown-target",
      summary: item.annotations?.summary || item.annotations?.description || "Prometheus metric threshold exceeded",
    }));
  }

  public getDispatchedHistory(): NotificationPayload[] {
    return this.dispatchedNotifications;
  }
}
