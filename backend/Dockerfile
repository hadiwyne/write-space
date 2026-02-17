# Base image
FROM node:18-alpine As development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY prisma ./prisma/

# Install app dependencies
RUN npm ci

# Bundle app source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the app to the /dist folder
RUN npm run build

# Production image
FROM node:18-alpine As production

WORKDIR /usr/src/app

COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/package*.json ./
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/prisma ./prisma

# Add strict host checking for sensitive environment variables if needed
# ENV NODE_ENV production

# HF Spaces documentation recommends creating a user with ID 1000
RUN adduser -D -u 1000 user
USER user

# Expose port (Hugging Face uses 7860 by default)
EXPOSE 7860
ENV PORT=7860

# Start the server using the production build
CMD ["npm", "run", "start:prod"]
