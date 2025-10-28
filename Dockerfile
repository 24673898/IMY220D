FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package.json and install root dependencies
COPY package*.json ./
RUN npm install

# Copy backend package.json and install backend dependencies
COPY backend/package.json ./backend/
RUN cd backend && npm install

# Copy all source code
COPY . .

# Build frontend with webpack
RUN npm run build:frontend

# Create uploads directory structure
RUN mkdir -p backend/uploads/profile-images backend/uploads/project-images

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the backend server directly
CMD ["node", "backend/server.js"]