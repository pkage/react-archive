FROM node:15.0.1-alpine

WORKDIR /app

RUN apk add --no-cache python make g++

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "node", "server.js" ]
