# AI Mystery Room

A fictional investigation game built with React, Vite, Tailwind CSS, Express, MongoDB, Gemini, and Zod. Every case has one server-side canonical source of truth. Evidence shown to players is derived from that case; the culprit and solution stay private until an accusation is accepted.

## Run locally

1. Install Node.js 20+ and MongoDB (local or Atlas).
2. Run `npm install` at the repository root.
3. Copy `server/.env.example` to `server/.env`; set `MONGODB_URI` and `GEMINI_API_KEY` to enable persistence and AI generation. The app can run with its clearly labeled deterministic fictional fallback when those services are not configured.
4. Run `npm run dev` and open `http://localhost:5173`.

The API runs at `http://localhost:5000`. For a frontend-only preview, `npm run build --workspace=client` builds `client/dist`.

## Environment

See `server/.env.example` and `client/.env.example`. Gemini calls are server-side. Vite variables are public and must not contain secrets. MongoDB is optional for local fallback play; with it configured, canonical cases and player progress persist in MongoDB.

## Game rules

Easy, Medium, and Hard require 3/4/5 suspects, 5/7/9 clues, and 2/3/3 hints. Correct accusation base scores are 100/150/200. Each unique clue adds 5 points and each successfully delivered hint costs 10; the score floor is zero. The backend is authoritative for discovery, hints, accusation, and scoring.

## Deployment

Deploy `client` as a Vercel Vite app and `server` to a Node-compatible host. Set `VITE_API_BASE_URL` to the deployed API URL, and configure `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL`, `NODE_ENV`, and `PORT` on the API host. Configure CORS with the exact deployed frontend origin. Add appropriate rate limits and a production MongoDB database before public release.

All cases and artifacts are fictional. Unsupported media formats use clearly labeled simulations rather than claims of actual recordings.
