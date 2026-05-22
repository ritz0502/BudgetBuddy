# Use a small, official Node 20 Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (layer-caching: npm install only re-runs when deps change)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for nodemon hot-reload)
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port the Express server listens on
EXPOSE 5000

# Start the server with hot-reload (nodemon)
CMD ["npm", "run", "dev"]
