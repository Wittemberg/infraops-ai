import { LlmProvider, LlmResponse, AppError } from "@infraops/shared";
import { evaluateJobPolicy, ActorType, Role, Permission, PolicyDecision } from "@infraops/policy-engine";
import { actionCatalog } from "../action/action_registry.service.js";
import { createAuditEvent } from "@infraops/audit";

export interface AiOrchestratorContext {
  tenantId: string;
  userId: string;
  userRole: Role;
}

export interface AiOrchestratorResult {
  reply: string;
  actionRequested?: string;
  policyDecision?: PolicyDecision;
  jobId?: string;
  approvalId?: string;
  auditEventId: string;
}

export class MockLlmProvider implements LlmProvider {
  public name = "mock-llm";

  public async generateResponse(prompt: string): Promise<LlmResponse> {
    if (prompt.includes("restart nginx")) {
      return {
        message: "I will request a service restart for nginx on node-101.",
        toolCalls: [
          {
            id: "tc-1",
            name: "requestAction",
            arguments: {
              actionKey: "service.restart",
              target: { type: "service", id: "nginx" },
              parameters: { serviceName: "nginx", nodeId: "node-101" },
            },
          },
        ],
      };
    }

    if (prompt.includes("run shell rm -rf")) {
      return {
        message: "I can run shell commands directly.",
        toolCalls: [
          {
            id: "tc-2",
            name: "requestAction",
            arguments: {
              actionKey: "raw_shell_exec", // Invalid action!
              target: { type: "node", id: "node-101" },
              parameters: { cmd: "rm -rf /" },
            },
          },
        ],
      };
    }

    return {
      message: "Infrastructure state is healthy and operational.",
    };
  }
}

export class AiOrchestratorService {
  private llmProvider: LlmProvider;

  constructor(llmProvider?: LlmProvider) {
    this.llmProvider = llmProvider || new MockLlmProvider();
  }

  public sanitizeUntrustedData(input: string): string {
    // Escapes prompt injection markers and wraps in untrusted_data tag
    const sanitized = input.replace(/<\/?system_instructions?>/gi, "[REDACTED_TAG]");
    return `<untrusted_data>\n${sanitized}\n</untrusted_data>`;
  }

  public async processUserRequest(
    userPrompt: string,
    ctx: AiOrchestratorContext
  ): Promise<AiOrchestratorResult> {
    // 1. Sanitize input prompt
    const safePrompt = this.sanitizeUntrustedData(userPrompt);

    // 2. Call decoupled LLM provider
    const llmRes = await this.llmProvider.generateResponse(safePrompt);

    let actionKeyRequested: string | undefined;
    let policyDecision: PolicyDecision | undefined;
    let jobId: string | undefined;
    let approvalId: string | undefined;

    // 3. Process structured tool calls
    if (llmRes.toolCalls && llmRes.toolCalls.length > 0) {
      for (const call of llmRes.toolCalls) {
        if (call.name === "requestAction") {
          const actionKey = call.arguments.actionKey as string;
          actionKeyRequested = actionKey;

          // 3a. Validate action against registered Action Catalog (Reject raw shell!)
          const actionDef = actionCatalog.get(actionKey);
          if (!actionDef) {
            throw new AppError(
              "AI_ACTION_NOT_ALLOWED",
              `AI model attempted to invoke unregistered or prohibited action '${actionKey}'. Execution blocked.`,
              400
            );
          }

          // 3b. Evaluate Policy Engine for AI Actor
          const policyEval = evaluateJobPolicy({
            tenantId: ctx.tenantId,
            actorType: ActorType.AI,
            actorId: `ai-model-${this.llmProvider.name}`,
            userRole: ctx.userRole,
            requestedPermission: actionDef.requiredPermission as Permission,
            actionRisk: actionDef.riskLevel,
            approvalPolicy: "default",
            nodeId: (call.arguments.parameters?.nodeId as string) || "node-101",
          });

          policyDecision = policyEval.decision;

          if (policyDecision === PolicyDecision.DENY) {
            throw new AppError(
              "POLICY_DENIED",
              `AI Action '${actionKey}' blocked by Policy Engine: ${policyEval.reason}`,
              403
            );
          }

          if (policyDecision === PolicyDecision.REQUIRES_APPROVAL) {
            approvalId = `appr-${Math.random().toString(36).substring(2, 10)}`;
          } else {
            jobId = `job-${Math.random().toString(36).substring(2, 10)}`;
          }
        }
      }
    }

    // 4. Emit Audit Event for AI Execution
    const auditEvent = createAuditEvent(
      `audit-ai-${Math.random().toString(36).substring(2, 10)}`,
      ctx.tenantId,
      "ai",
      `ai-model-${this.llmProvider.name}`,
      "ai.interpretation",
      {
        userPrompt,
        llmProvider: this.llmProvider.name,
        actionRequested: actionKeyRequested,
        policyDecision,
        jobId,
        approvalId,
      }
    );

    return {
      reply: llmRes.message,
      actionRequested: actionKeyRequested,
      policyDecision,
      jobId,
      approvalId,
      auditEventId: auditEvent.id,
    };
  }
}
