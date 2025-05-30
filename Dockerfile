FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only necessary files from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/.env.example ./.env.example 

# Install only production dependencies
RUN npm install --omit=dev

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable (can be overridden)
ENV NODE_ENV production
ENV PORT 3000
# DB env vars will be set by the hosting platform

# Run the app when the container launches
CMD ["node", "dist/server.js"]