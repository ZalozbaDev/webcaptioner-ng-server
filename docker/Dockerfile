########### build container
FROM node:24 AS backendbuild
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
ADD src/ ./src/
RUN npm run build
# RUN ls -l

########### deployment container
FROM node:24
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=1000:1000 --from=backendbuild /app/dist ./dist

USER 1000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
