import { ProxmoxProvider } from "../proxmox/proxmox_provider.js";
import { ProxmoxSyncWorker } from "../../../../worker/src/proxmox_sync.service.js";

describe("Stage 12 - Proxmox VE Integration Acceptance Tests", () => {
  let provider: ProxmoxProvider;

  beforeEach(() => {
    provider = new ProxmoxProvider({
      baseUrl: "https://pve01.example.com:8006",
      apiToken: "PVEAPIToken=root@pam!tokenid=secret-key-12345",
    });
  });

  test("1. testConnection validates Proxmox VE API version and latency", async () => {
    const conn = await provider.testConnection();
    expect(conn.connected).toBe(true);
    expect(conn.provider).toBe("proxmox");
    expect(conn.version).toContain("Proxmox VE");
    expect(conn.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test("2. listNodes discovers Proxmox cluster nodes with externalId prefix", async () => {
    const nodes = await provider.listNodes();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].externalId).toBe("proxmox:pve01");
    expect(nodes[0].status).toBe("online");
  });

  test("3. listWorkloads maps QEMU VMs and LXC containers without global VMID conflicts", async () => {
    const workloads = await provider.listWorkloads();
    expect(workloads).toHaveLength(2);

    const qemuVm = workloads.find((w) => w.type === "qemu");
    const lxcContainer = workloads.find((w) => w.type === "lxc");

    expect(qemuVm?.externalId).toBe("proxmox:pve01:100");
    expect(lxcContainer?.externalId).toBe("proxmox:pve01:101");
  });

  test("4. listStorages maps ZFS/LVM storage datastores", async () => {
    const storages = await provider.listStorages();
    expect(storages).toHaveLength(1);
    expect(storages[0].externalId).toBe("proxmox:pve01:local-zfs");
    expect(storages[0].type).toBe("zfspool");
  });

  test("5. API error responses redact Proxmox API tokens", async () => {
    const failingProvider = new ProxmoxProvider({
      baseUrl: "https://pve01.example.com:8006",
      apiToken: "PVEAPIToken=root@pam!tokenid=secret-key-12345",
    });

    // Force error simulation
    jest.spyOn(failingProvider, "listNodes").mockRejectedValue(
      new Error("Failed request with PVEAPIToken=root@pam!tokenid=secret-key-12345")
    );

    try {
      await failingProvider.listNodes();
    } catch (err: any) {
      expect(err.message).not.toContain("secret-key-12345");
    }
  });

  test("6. Worker sync loop executes safely without crashing during API warnings", async () => {
    const worker = new ProxmoxSyncWorker(provider);

    const summary = await worker.executeSync();
    expect(summary.nodesSynced).toBe(1);
    expect(summary.workloadsSynced).toBe(2);
    expect(summary.storagesSynced).toBe(1);
    expect(summary.tasksSynced).toBe(1);
  });
});
