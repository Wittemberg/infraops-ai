export interface MetricValue {
  name: string;
  help: string;
  type: "counter" | "gauge" | "histogram";
  labels: Record<string, string>;
  value: number;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  requestId?: string;
  jobId?: string;
  tenantId?: string;
}

export class MetricsRegistry {
  private metrics: Map<string, MetricValue> = new Map();

  // Low cardinality label validator
  private validateLabels(labels: Record<string, string>): void {
    const forbidden = ["jobid", "job_id", "userid", "user_id", "token", "secret", "password"];
    for (const key of Object.keys(labels)) {
      if (forbidden.includes(key.toLowerCase())) {
        throw new Error(`[OBSERVE_FATAL] High cardinality or sensitive label '${key}' is forbidden in Prometheus metrics`);
      }
    }
  }

  public incCounter(name: string, help: string, labels: Record<string, string> = {}, value = 1): void {
    this.validateLabels(labels);
    const key = `${name}:${JSON.stringify(labels)}`;
    const existing = this.metrics.get(key);

    if (existing) {
      existing.value += value;
    } else {
      this.metrics.set(key, { name, help, type: "counter", labels, value });
    }
  }

  public setGauge(name: string, help: string, labels: Record<string, string> = {}, value: number): void {
    this.validateLabels(labels);
    const key = `${name}:${JSON.stringify(labels)}`;
    this.metrics.set(key, { name, help, type: "gauge", labels, value });
  }

  public exportPrometheusFormat(): string {
    const lines: string[] = [];
    const grouped: Record<string, MetricValue[]> = {};

    for (const m of this.metrics.values()) {
      if (!grouped[m.name]) grouped[m.name] = [];
      grouped[m.name].push(m);
    }

    for (const [name, list] of Object.entries(grouped)) {
      if (list.length > 0) {
        lines.push(`# HELP ${name} ${list[0].help}`);
        lines.push(`# TYPE ${name} ${list[0].type}`);

        for (const item of list) {
          const labelPairs = Object.entries(item.labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(",");
          const labelStr = labelPairs ? `{${labelPairs}}` : "";
          lines.push(`${name}${labelStr} ${item.value}`);
        }
      }
    }

    return lines.join("\n") + "\n";
  }
}

export function createTraceContext(requestId?: string, jobId?: string, tenantId?: string): TraceContext {
  const generateHex = (len: number) => {
    let result = "";
    for (let i = 0; i < len; i++) {
      result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
  };

  return {
    traceId: generateHex(32),
    spanId: generateHex(16),
    requestId,
    jobId,
    tenantId,
  };
}
