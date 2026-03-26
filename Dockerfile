# API image (monorepo root context: docker build -f Dockerfile .)
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps apps
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter @lms/api run build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
