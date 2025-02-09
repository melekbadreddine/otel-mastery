# Stage 1: Build the Angular application
FROM node:16 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --prod

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/store-ui /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

