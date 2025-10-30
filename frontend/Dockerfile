# Stage 1: Build the Angular application
# FROM node:20-alpine as builder
# WORKDIR /usr/src/app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:alpine
# COPY --from=builder /usr/src/app/dist/posts-wall/browser /usr/share/nginx/html
COPY dist/posts-wall/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
