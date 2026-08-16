import { VirtualizorProvider } from "../../api/src/integrations/virtualizor/virtualizor_provider.js";

export interface VirtualizorSyncSummary {
  serversSynced: number;
  vpsSynced: number;
  storagesSynced: number;
  tasksSynced: number;
  timestamp: string;
}

export class VirtualizorSyncWorker {
  private provider: VirtualizorProvider;

  constructor(provider: VirtualizorProvider) {
    this.provider = provider;
  }

  public async executeSync(): Promise<VirtualizorSyncSummary> {
    const summary: VirtualizorSyncSummary = {
      serversSynced: 0,
      vpsSynced: 0,
      storagesSynced: 0,
      tasksSynced: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      const servers = await this.provider.listNodes();
      summary.serversSynced = servers.length;
    } catch (err: any) {
      console.warn(`[VIRTUALIZOR_SYNC_WARN] Failed to sync servers: ${err.message}`);
    }

    try {
      const vpsList = await this.provider.listWorkloads();
      summary.vpsSynced = vpsList.length;
    } catch (err: any) {
      console.warn(`[VIRTUALIZOR_SYNC_WARN] Failed to sync VPS list: ${err.message}`);
    }

    try {
      const storages = await this.provider.listStorages();
      summary.storagesSynced = storages.length;
    } catch (err: any) {
      console.warn(`[VIRTUALIZOR_SYNC_WARN] Failed to sync storages: ${err.message}`);
    }

    try {
      const tasks = await this.provider.getTasks();
      summary.tasksSynced = tasks.length;
    } catch (err: any) {
      console.warn(`[VIRTUALIZOR_SYNC_WARN] Failed to sync tasks: ${err.message}`);
    }

    return summary;
  }
}
