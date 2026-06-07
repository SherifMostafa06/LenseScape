# Start with a lightweight Node.js environment
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all remaining project files
COPY . .

# Expose the default port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]