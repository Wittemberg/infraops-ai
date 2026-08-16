import { VirtualizorProvider } from "../virtualizor/virtualizor_provider.js";
import { VirtualizorSyncWorker } from "../../../../worker/src/virtualizor_sync.service.js";

describe("Stage 13 - Virtualizor Integration Acceptance Tests", () => {
  let provider: VirtualizorProvider;

  beforeEach(() => {
    provider = new VirtualizorProvider({
      baseUrl: "https://virtualizor.example.com:4085",
      apiKey: "VIRTUALIZOR_API_KEY_12345",
      apiPass: "VIRTUALIZOR_API_PASS_SECRET6789",
    });
  });

  test("1. testConnection validates Virtualizor Admin API status and version", async () => {
    const conn = await provider.testConnection();
    expect(conn.connected).toBe(true);
    expect(conn.provider).toBe("virtualizor");
    expect(conn.version).toContain("Virtualizor");
    expect(conn.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test("2. listNodes discovers Master and Slave Virtualizor servers", async () => {
    const nodes = await provider.listNodes();
    expect(nodes).toHaveLength(2);
    expect(nodes[0].externalId).toBe("virtualizor:server:0");
    expect(nodes[1].externalId).toBe("virtualizor:server:1");
  });

  test("3. listWorkloads normalizes VPS list into unified WorkloadDto format", async () => {
    const workloads = await provider.listWorkloads();
    expect(workloads).toHaveLength(2);
    expect(workloads[0].externalId).toBe("virtualizor:0:101");
    expect(workloads[1].externalId).toBe("virtualizor:1:202");
    expect(workloads[0].name).toBe("vps-client-alpha");
  });

  test("4. listStorages maps Virtualizor LVM pools and backup servers", async () => {
    const storages = await provider.listStorages();
    expect(storages).toHaveLength(2);
    expect(storages[0].externalId).toBe("virtualizor:storage:1");
    expect(storages[1].externalId).toBe("virtualizor:backup_server:101");
  });

  test("5. Error responses sanitize API key and password from logs/messages", async () => {
    const failingProvider = new VirtualizorProvider({
      baseUrl: "https://virtualizor.example.com:4085",
      apiKey: "VIRTUALIZOR_API_KEY_12345",
      apiPass: "VIRTUALIZOR_API_PASS_SECRET6789",
    });

    jest.spyOn(failingProvider, "listNodes").mockRejectedValue(
      new Error("API Failed for api_key=VIRTUALIZOR_API_KEY_12345&api_pass=VIRTUALIZOR_API_PASS_SECRET6789")
    );

    try {
      await failingProvider.listNodes();
    } catch (err: any) {
      expect(err.message).not.toContain("VIRTUALIZOR_API_KEY_12345");
      expect(err.message).not.toContain("VIRTUALIZOR_API_PASS_SECRET6789");
      expect(err.message).toContain("api_key=[REDACTED]");
    }
  });

  test("6. VirtualizorSyncWorker handles background discovery cleanly", async () => {
    const worker = new VirtualizorSyncWorker(provider);
    const summary = await worker.executeSync();

    expect(summary.serversSynced).toBe(2);
    expect(summary.vpsSynced).toBe(2);
    expect(summary.storagesSynced).toBe(2);
    expect(summary.tasksSynced).toBe(1);
  });
});
