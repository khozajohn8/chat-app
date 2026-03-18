# client/Dockerfile - Multi-stage build

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps --force \
    npm install react-dev-utils --save-dev --force

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ARG REACT_APP_SERVER_URL
ENV REACT_APP_SERVER_URL=$REACT_APP_SERVER_URL

# Build the React app

RUN echo "Building with server URL: $REACT_APP_SERVER_URL" && \
    npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/build ./build

# Copy the simple server file
COPY server.js ./

# Install only express for serving
RUN npm install express

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the server
CMD ["node", "server.js"]