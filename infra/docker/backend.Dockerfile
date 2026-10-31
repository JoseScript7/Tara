FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Use legacy-peer-deps to avoid the ts-jest typescript conflict during install
RUN npm install --legacy-peer-deps

COPY . .

# Expose port
EXPOSE 3001

# In production, we'd compile to JS and run node dist/index.js.
# For this demo environment, we can just run tsx
CMD ["npm", "run", "dev"]
