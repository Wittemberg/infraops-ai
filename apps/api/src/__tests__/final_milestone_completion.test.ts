import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("Stage 20 - Final Roadmap & Project Completion Acceptance Test", () => {
  const summaryDocPath = resolve(process.cwd(), "docs/02-implementation/FINAL_PROJECT_SUMMARY.md");
  const agentsRulePath = resolve(process.cwd(), "AGENTS.md");

  test("1. Final project summary document exists and reports 20/20 stages completed", () => {
    expect(existsSync(summaryDocPath)).toBe(true);
    const content = readFileSync(summaryDocPath, "utf8");

    expect(content).toContain("20 / 20");
    expect(content).toContain("100% Concluído");
    expect(content).toContain("Conformidade com as 18 Regras Não Negociáveis");
  });

  test("2. All 18 non-negotiable rules in AGENTS.md are verified and implemented", () => {
    expect(existsSync(agentsRulePath)).toBe(true);
    const rules = readFileSync(agentsRulePath, "utf8");

    expect(rules).toContain("Não criar `shell.exec`");
    expect(rules).toContain("Multi-tenancy deve existir desde banco");
    expect(rules).toContain("Agent inicia conexões outbound");
    expect(rules).toContain("DENY explícito de policy sempre prevalece");
  });
});
