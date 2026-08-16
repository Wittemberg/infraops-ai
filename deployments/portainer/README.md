# Deploy Portainer — InfraOps AI

Guia de implantação da aplicação InfraOps AI via Portainer / Docker Swarm conectada à infraestrutura existente (Postgres, Redis, MinIO, Traefik) através da rede `interna`.

## Domínio Principal
- **App & API:** `infraopsai.awecloudsolution.com`
- **Frontend URL:** `https://infraopsai.awecloudsolution.com`
- **Backend API URL:** `https://infraopsai.awecloudsolution.com/api`

## Pré-requisitos (Stacks em operação)
1. **Rede overlay `interna`:** ativa no Swarm.
2. **Postgres:** em execução na rede `interna` (acessível via `postgres:5432`).
3. **Redis:** em execução na rede `interna` (acessível via `redis:6379`).
4. **MinIO:** em execução na rede `interna` (acessível via `minio:9000`).
5. **Traefik 2.x:** gerenciando o roteamento SSL/TLS com o certresolver `letsencryptresolver`.

## Serviços da Stack (`infraops-ai`)
A stack do projeto contém unicamente os serviços da aplicação:
- `frontend` (`infraops-web`)
- `backend` (`infraops-api`)
- `worker` (`infraops-worker`)

## Implantação no Portainer
1. Acesse o Portainer -> **Stacks** -> **Add stack**.
2. Nome da Stack: `infraops-ai`.
3. Cole ou vincule o conteúdo de [`docker-stack.yml`](file:///c:/Users/witte/OneDrive/Área%20de%20Trabalho/Trabalho/0000%20WR%20Tecnologia/Projeto%20InfraOps%20AI/deployments/portainer/docker-stack.yml).
4. Informe as variáveis de ambiente (`DATABASE_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, etc.).
5. Clique em **Deploy the stack**.
