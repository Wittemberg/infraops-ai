export interface PfSenseTelemetryDiagnosticReport {
  timestamp: string;
  deviceId: string;
  firmwareVersion?: string;
  login: {
    initialStatus?: number;
    postStatus?: number;
    authenticated: boolean;
    csrfDetected: boolean;
    sessionCookieDetected: boolean;
    errorDetails?: string;
  };
  getStats: {
    statusCode?: number;
    contentType?: string;
    responseFormat: "PIPE" | "JSON" | "HTML" | "EMPTY" | "UNKNOWN";
    fieldCount: number;
    payloadLength: number;
    samplePayload?: string;
  };
  dashboard: {
    statusCode?: number;
    payloadLength: number;
    cpuMarkerDetected: boolean;
    memoryMarkerDetected: boolean;
    ptBrLabelsDetected: boolean;
    enLabelsDetected: boolean;
  };
  telemetry: {
    cpuFound: boolean;
    memoryFound: boolean;
    swapFound?: boolean;
    storageFound?: boolean;
    cpuValue: number | null;
    memoryValue: number | null;
    swapValue?: number | null;
    storageValue?: number | null;
    cpuSource?: string;
    memorySource?: string;
    swapSource?: string;
    storageSource?: string;
    status: string;
  };
  errorCode?: string;
}
