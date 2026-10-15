FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

# Compile the seed script to JavaScript to avoid ts-node runtime overhead
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --module commonjs --target es2022 --skipLibCheck

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node dist/prisma/seed.js && node dist/index.js"]
