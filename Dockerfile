FROM node:18-alpine AS appbuild
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY ./@types ./@types
COPY ./src ./src

RUN npm run build

# Build Stage 2
# This build takes the production build from staging build

FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY --from=appbuild /app/out ./out
EXPOSE 3030
CMD npm start