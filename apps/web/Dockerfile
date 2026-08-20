FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN npm install -g pnpm@9 && pnpm install --no-frozen-lockfile
RUN pnpm --filter @infraops/web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g serve
COPY --from=builder /app/apps/web/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
