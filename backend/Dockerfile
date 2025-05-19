# backend/Dockerfile
FROM node:18-alpine

# Подеси радни фолдер
WORKDIR /app

# Копирај само package файлове и инсталирај зависности
COPY package.json package-lock.json ./
# брже и поузданије од npm install --production
RUN npm ci --omit=dev        
RUN mkdir -p uploads
# Копирај остатак кода
COPY . .

# Експонирај порт који користиш у Express
EXPOSE 4000

# Покрени сервер
CMD ["node", "src/index.js"]
