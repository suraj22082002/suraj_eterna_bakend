FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# We will use a simple static server for the build or just run dev for now
# For a prototype, running vite dev is fine and allows easier exploration
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
