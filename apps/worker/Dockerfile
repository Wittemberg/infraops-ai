FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
RUN npm install -g tsx
EXPOSE 3000
CMD ["npx", "tsx", "apps/worker/src/server.ts"]
