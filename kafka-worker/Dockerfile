FROM node:18
WORKDIR /kafka-worker
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]

