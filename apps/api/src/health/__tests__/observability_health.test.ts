import { handleLiveness, handleReadiness, handleMetricsScrape, globalMetrics } from "../health.controller.js";
import { MetricsRegistry, createTraceContext } from "@infraops/observability";

describe("Stage 11 - Observability & Health Endpoints Acceptance Tests", () => {
  test("1. /health/live returns 200 OK status", () => {
    const res = handleLiveness();
    expect(res.status).toBe("ok");
    expect(res.service).toBe("infraops-api");
  });

  test("2. /health/ready evaluates PostgreSQL and Redis connectivity", () => {
    const healthy = handleReadiness(true, true);
    expect(healthy.statusCode).toBe(200);
    expect(healthy.body.status).toBe("ok");

    const degraded = handleReadiness(false, true); // DB down
    expect(degraded.statusCode).toBe(503);
    expect(degraded.body.status).toBe("degraded");
    expect(degraded.body.checks?.postgresql.status).toBe("error");
  });

  test("3. Prometheus /metrics exports valid OpenMetrics format", () => {
    globalMetrics.incCounter("http_requests_total", "Total HTTP requests", { method: "POST", route: "/api/v1/agent/heartbeat", status_code: "200" });

    const metricsStr = handleMetricsScrape();
    expect(metricsStr).toContain("# HELP http_requests_total");
    expect(metricsStr).toContain('http_requests_total{method="POST",route="/api/v1/agent/heartbeat",status_code="200"} 1');
  });

  test("4. High-cardinality labels (jobId, userId, token) are rejected by metrics registry", () => {
    const reg = new MetricsRegistry();

    expect(() => reg.incCounter("test_counter", "Test", { jobId: "job-123" })).toThrow("[OBSERVE_FATAL] High cardinality or sensitive label 'jobId' is forbidden");

    expect(() => reg.incCounter("test_counter", "Test", { user_id: "user-99" })).toThrow("[OBSERVE_FATAL] High cardinality or sensitive label 'user_id' is forbidden");
  });

  test("5. OpenTelemetry trace context correlates traceId, requestId, and jobId", () => {
    const traceCtx = createTraceContext("req-abc", "job-xyz", "tenant-101");

    expect(traceCtx.traceId).toHaveLength(32);
    expect(traceCtx.spanId).toHaveLength(16);
    expect(traceCtx.requestId).toBe("req-abc");
    expect(traceCtx.jobId).toBe("job-xyz");
  });
});
