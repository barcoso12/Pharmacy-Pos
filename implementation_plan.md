# Deployment Implementation Plan - Pharmacy POS

## Goal
Containerize the Pharmacy POS system (Frontend, Backend, Database) to ensure consistent environments and simplify deployment.

## Proposed Changes

### Root
#### [NEW] [docker-compose.yml](file:///c:/Users/Krypton/Desktop/Pharmacy POS/docker-compose.yml)
- Orchestrates the following services:
    - `postgres`: Version 15 (Database)
    - `redis`: Latest (Caching)
    - `server`: NestJS Backend
    - `web`: React Frontend (served via Nginx or static server in prod)

### Server (`apps/server`)
#### [NEW] [Dockerfile](file:///c:/Users/Krypton/Desktop/Pharmacy POS/apps/server/Dockerfile)
- Multi-stage build:
    - `builder`: Installs dependencies and runs `nest build`.
    - `runner`: Lightweight Alpine image, runs `node dist/main`.

### Web (`apps/web`)
#### [NEW] [Dockerfile](file:///c:/Users/Krypton/Desktop/Pharmacy POS/apps/web/Dockerfile)
- Multi-stage build:
    - `builder`: Builds React app (`vite build`).
    - `runner`: Nginx Alpine to serve static files on port 80.

## Verification
- Run `docker-compose up --build`.
- Verify Backend health at `http://localhost:3000/api`.
- Verify Frontend loads at `http://localhost:80`.
