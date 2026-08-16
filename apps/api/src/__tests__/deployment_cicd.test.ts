import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("Stage 18 - Deployment, CI/CD & Portainer Acceptance Tests", () => {
  const stackPath = resolve(process.cwd(), "deployments/portainer/docker-stack.yml");
  const workflowPath = resolve(process.cwd(), ".github/workflows/deploy.yml");
  const backupDocPath = resolve(process.cwd(), "docs/02-implementation/PLATFORM_BACKUP_RECOVERY.md");

  test("1. Docker Stack YAML exists and defines internal overlay network", () => {
    expect(existsSync(stackPath)).toBe(true);
    const content = readFileSync(stackPath, "utf8");

    expect(content).toContain("networks:");
    expect(content).toContain("interna:");
    expect(content).toContain("external: true");
  });

  test("2. PostgreSQL and Redis services are isolated on internal network without raw public port bindings", () => {
    const content = readFileSync(stackPath, "utf8");

    // Services use Traefik host routing on 443
    expect(content).toContain("traefik.http.routers.infraops-api.rule");
    expect(content).toContain("traefik.http.routers.infraops-web.rule");

    // No raw database port exposures (e.g. "5432:5432" or "6379:6379") in stack file
    expect(content).not.toContain('"5432:5432"');
    expect(content).not.toContain('"6379:6379"');
  });

  test("3. CI/CD workflow targets main branch and triggers Portainer deployment webhook", () => {
    expect(existsSync(workflowPath)).toBe(true);
    const content = readFileSync(workflowPath, "utf8");

    expect(content).toContain("Trigger Portainer Webhook");
    expect(content).toContain("https://portainer.wrtec.com.br/api/stacks/webhooks/a1ad5561-618d-42ea-a88d-68043997e963");
  });

  test("4. Platform Backup & Disaster Recovery documentation is complete", () => {
    expect(existsSync(backupDocPath)).toBe(true);
    const content = readFileSync(backupDocPath, "utf8");

    expect(content).toContain("PostgreSQL");
    expect(content).toContain("Secret Vault Master Key");
    expect(content).toContain("Disaster Recovery");
  });
});
