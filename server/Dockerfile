# Minimal production image for the API server
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package.json ./
RUN npm install --omit=dev

# Copy application source
COPY src ./src
COPY seed.js ./seed.js

# Expose API port
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]
