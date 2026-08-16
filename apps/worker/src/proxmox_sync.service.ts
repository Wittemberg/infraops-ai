import { ProxmoxProvider } from "../../api/src/integrations/proxmox/proxmox_provider.js";

export interface SyncSummary {
  nodesSynced: number;
  workloadsSynced: number;
  storagesSynced: number;
  tasksSynced: number;
  timestamp: string;
}

export class ProxmoxSyncWorker {
  private provider: ProxmoxProvider;

  constructor(provider: ProxmoxProvider) {
    this.provider = provider;
  }

  public async executeSync(): Promise<SyncSummary> {
    const summary: SyncSummary = {
      nodesSynced: 0,
      workloadsSynced: 0,
      storagesSynced: 0,
      tasksSynced: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      const nodes = await this.provider.listNodes();
      summary.nodesSynced = nodes.length;
    } catch (err: any) {
      console.warn(`[PROXMOX_SYNC_WARN] Failed to sync nodes: ${err.message}`);
    }

    try {
      const workloads = await this.provider.listWorkloads();
      summary.workloadsSynced = workloads.length;
    } catch (err: any) {
      console.warn(`[PROXMOX_SYNC_WARN] Failed to sync workloads: ${err.message}`);
    }

    try {
      const storages = await this.provider.listStorages();
      summary.storagesSynced = storages.length;
    } catch (err: any) {
      console.warn(`[PROXMOX_SYNC_WARN] Failed to sync storages: ${err.message}`);
    }

    try {
      const tasks = await this.provider.getTasks();
      summary.tasksSynced = tasks.length;
    } catch (err: any) {
      console.warn(`[PROXMOX_SYNC_WARN] Failed to sync tasks: ${err.message}`);
    }

    return summary;
  }
}
