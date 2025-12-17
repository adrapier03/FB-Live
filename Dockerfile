FROM node:18-alpine

# Install dependencies needed for system and prisma
RUN apk add --no-cache ffmpeg openssl

WORKDIR /app

# Install dependencies based on package.json
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
