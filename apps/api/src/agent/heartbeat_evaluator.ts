import { NodeStatus } from "@infraops/shared";

export interface NodeHealthState {
  nodeId: string;
  lastSeenAt?: Date;
  isMaintenanceMode?: boolean;
}

export function evaluateNodeStatus(node: NodeHealthState, now: Date = new Date()): NodeStatus {
  if (node.isMaintenanceMode) {
    return NodeStatus.MAINTENANCE;
  }

  if (!node.lastSeenAt) {
    return NodeStatus.OFFLINE;
  }

  const secondsSinceLastSeen = (now.getTime() - node.lastSeenAt.getTime()) / 1000;

  if (secondsSinceLastSeen <= 90) {
    return NodeStatus.ONLINE;
  }

  if (secondsSinceLastSeen <= 180) {
    return NodeStatus.DEGRADED;
  }

  return NodeStatus.OFFLINE;
}
