FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install a simple web server to serve the build
RUN npm install -g serve

EXPOSE 3000

# Serve the 'dist' folder created by 'npm run build'
CMD ["serve", "-s", "dist", "-l", "3000"]