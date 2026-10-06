# ============================================================================
# Company Brain — Multi-stage Docker build
# ============================================================================

# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Node.js API server
FROM node:20-alpine AS api-builder
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --production
COPY server/ ./

# Stage 3: Python backend
FROM python:3.12-slim AS python-builder
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY company_brain/ ./company_brain/
COPY config/ ./config/
COPY data/ ./data/
COPY mock_sources/ ./mock_sources/
COPY scripts/ ./scripts/

# Stage 4: Final runtime image
FROM node:20-slim

# Install Python 3.12 in the Node image
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node.js API server
COPY --from=api-builder /app/server ./server

# Copy built React frontend (served by Express as static files)
COPY --from=frontend-builder /app/frontend/dist ./server/public

# Copy Python backend
COPY --from=python-builder /app/company_brain ./company_brain
COPY --from=python-builder /app/config ./config
COPY --from=python-builder /app/data ./data
COPY --from=python-builder /app/mock_sources ./mock_sources
COPY --from=python-builder /app/scripts ./scripts
COPY --from=python-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY requirements.txt ./

# Install Python deps in final image
RUN python3 -m pip install --no-cache-dir -r requirements.txt 2>/dev/null || true

# Copy database schema
COPY database/ ./database/

# Environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the API server (which also serves the React frontend)
CMD ["node", "server/src/app.js"]
