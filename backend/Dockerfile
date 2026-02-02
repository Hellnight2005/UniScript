# Use official Node.js lightweight image
FROM node:20-slim

# Install system dependencies
# We install ffmpeg at OS level just in case, though the app uses @ffmpeg-installer
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source
COPY . .

# Create necessary directories
RUN mkdir -p uploads processed

# Expose the API port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
