# Base image
FROM node:18.20.5-bullseye-slim AS base

# Set environment variables
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    NX_DAEMON=false

# Install common dependencies in a single layer with cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
      openssh-client \
      python3 \
      g++ \
      build-essential \
      git \
      poppler-utils \
      poppler-data \
      procps \
      locales \
      locales-all \
      libcap-dev \
      nginx \
      gettext && \
    yarn config set python /usr/bin/python3 && \
    npm install -g node-gyp && \
    npm i -g npm@9.9.3 pnpm@9.15.0 && \
    rm -rf /var/lib/apt/lists/*

# Install isolated-vm in global scope
RUN cd /usr/src && npm i isolated-vm@5.0.1

# Pre-fetch key TS deps to leverage Docker layer cache
RUN pnpm fetch @tsconfig/node18@1.0.0 \
               @types/node@18.17.1 \
               typescript@4.9.4

# =====================
# Build stage
# =====================
FROM base AS build
WORKDIR /usr/src/app

COPY .npmrc package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nx run-many --target=build --projects=server-api --configuration production
RUN npx nx run-many --target=build --projects=react-ui

# Install backend prod deps
RUN cd dist/packages/server/api && npm install --production --force

# =====================
# Final runtime stage
# =====================
FROM base AS run
WORKDIR /usr/src/app

COPY packages/server/api/src/assets/default.cf /usr/local/etc/isolate

# Nginx configuration
COPY nginx.react.conf /etc/nginx/nginx.conf

# App metadata
COPY --from=build /usr/src/app/LICENSE ./

# Ensure folders exist
RUN mkdir -p /usr/src/app/dist/packages/{server,engine,shared}

# Copy build artifacts
COPY --from=build /usr/src/app/dist/packages/engine/ /usr/src/app/dist/packages/engine/
COPY --from=build /usr/src/app/dist/packages/server/ /usr/src/app/dist/packages/server/
COPY --from=build /usr/src/app/dist/packages/shared/ /usr/src/app/dist/packages/shared/

# Copy code packages (source for runtime logic)
COPY --from=build /usr/src/app/packages packages

# Install backend production dependencies again (ensure node_modules exists at runtime)
RUN cd /usr/src/app/dist/packages/server/api/ && npm install --production --force

# Frontend files for Nginx
COPY --from=build /usr/src/app/dist/packages/react-ui /usr/share/nginx/html/

# Entrypoint setup
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 80

LABEL service=activepieces

