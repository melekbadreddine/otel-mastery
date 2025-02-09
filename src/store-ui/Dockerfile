# Build stage
FROM node:18 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Serve stage
FROM node:18-slim

WORKDIR /app

# Install serve package globally
RUN npm install -g serve

# Copy built files from build stage
COPY --from=build /app/dist/store-ui /app

# Expose port 4200
EXPOSE 4200

# Start the application using serve
CMD ["serve", "-s", ".", "-l", "4200"]