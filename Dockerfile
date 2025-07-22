# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S autojobr -u 1001

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=autojobr:nodejs /app/dist ./dist
COPY --from=builder --chown=autojobr:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=autojobr:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown autojobr:nodejs logs

# Switch to non-root user
USER autojobr

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]