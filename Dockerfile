FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.js ./
COPY src ./src
COPY shared ./shared
COPY scripts ./scripts
COPY seed ./seed

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]
