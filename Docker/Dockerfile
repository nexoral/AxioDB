# Use a specific version of Node.js Alpine with SHA digest
FROM node:alpine

# Set working directory
WORKDIR /app

# Copy the runner.js file
COPY runner.js .

# Copy lib folder with proper directory structure
COPY lib/ ./lib/

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Set the command to run the runner.js file
CMD ["node", "runner.js"]