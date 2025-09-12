# build stage
FROM node:16.20.2-buster-slim AS build

WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker cache
COPY package*.json ./

# Install dependencies (dev deps needed for build)
RUN npm ci

# Copy rest of source
COPY . .

# If .env.example exists, copy to .env (safe, non-failing)
# Use sh -c so the build won't fail if the file is absent
RUN sh -c 'if [ -f .env.example ]; then cp .env.example .env; fi'

# Build the client for production
RUN npm run build

# production stage (nginx)
FROM nginx:alpine AS production

# Remove default nginx static files (optional)
RUN rm -rf /usr/share/nginx/html/*

# Copy built artifacts
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
# Note: we copy to /etc/nginx/conf.d/default.conf (common pattern)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port expected by your platform (8080 here)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]