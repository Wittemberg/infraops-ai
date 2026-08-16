export interface ActionToolPayload {
  actionKey: string;
  target: {
    type: "node" | "vm" | "storage" | "service";
    id: string;
  };
  parameters: Record<string, unknown>;
}

export interface LlmToolCall {
  id: string;
  name: string; // e.g. "requestAction", "getNode", "getBackups"
  arguments: Record<string, unknown>;
}

export interface LlmResponse {
  message: string;
  toolCalls?: LlmToolCall[];
}

export interface LlmProvider {
  name: string; // "gemini", "claude", "openai", "ollama"
  generateResponse(prompt: string, context?: Record<string, unknown>): Promise<LlmResponse>;
}
