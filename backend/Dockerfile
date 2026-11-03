FROM node:20-alpine

WORKDIR /app

# Install dependencies from the lockfile for reproducible production builds
COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npx prisma generate
RUN npm run build

# Compile the seed script to JavaScript to avoid ts-node runtime overhead
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --module commonjs --target es2022 --skipLibCheck

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# db push keeps the container's schema in sync, the seed is idempotent.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/prisma/seed.js && node dist/index.js"]
