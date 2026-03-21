FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Uses the "start" script defined in your package.json (node server.js)
CMD ["npm", "start"]