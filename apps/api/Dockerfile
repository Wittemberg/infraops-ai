FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY docs ./docs
COPY docs/00-project/development-control /app/development-control
RUN npm install -g pnpm@9 && pnpm install --no-frozen-lockfile

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
RUN npm install -g tsx
EXPOSE 3000
CMD ["npx", "tsx", "apps/api/src/server.ts"]
