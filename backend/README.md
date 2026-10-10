# HerGuardian Backend

A scalable Express.js backend for the HerGuardian AI project.

## Structure

- src/app.js - Express app setup and middleware
- src/server.js - Server entry point and MongoDB connection
- src/routes - API routes
- src/controllers - Request handlers
- src/services - Business logic
- src/models - Mongoose models
- src/middleware - Error handling and reusable middleware
- src/utils - Helper utilities

## Scripts

- npm install
- npm run dev
- npm run start

## Environment

Copy .env.example to .env and update the values.

## Opportunity feeds

Run `node scripts/refreshOpportunities.js` after configuring `MONGODB_URI` to fetch and report current listings. Adzuna and Jooble require their backend API keys; JSearch is optional. Remotive, Himalayas, and Arbeitnow use their public APIs, and every result links to its source.

Local/development servers refresh every four hours. Production refresh is triggered by `POST /api/opportunities/refresh` with the `x-cron-secret` header. On Render Free, schedule that endpoint with cron-job.org every four hours and set `CRON_SECRET` in Render's private environment variables.
