FROM node:24-slim

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm --prefix backend ci --omit=dev

COPY frontend/package*.json ./frontend/
RUN npm --prefix frontend ci

COPY frontend/ ./frontend/
RUN npm --prefix frontend run build

COPY backend/ ./backend/

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "backend/src/server.js"]
