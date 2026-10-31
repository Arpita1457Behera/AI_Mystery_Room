# AI Mystery Room

A fictional investigation game built with React, Vite, Tailwind CSS, Express, MongoDB, Gemini, and Zod. The Express server serves both the API and the built web app, so deployment uses one public service and one origin.

## Deploy on Render

This repository includes `render.yaml`. The blueprint builds the client and runs the API as one Render web service. MongoDB Atlas provides persistent case storage; Gemini generation is optional and the game uses its deterministic fallback when no Gemini key is configured.

1. Push this project to a GitHub repository. Do not commit `.env` files or put secret values in `client/.env`.
2. Create a MongoDB Atlas cluster. In **Network Access**, allow connections from the deployment host (for a straightforward Render setup, use `0.0.0.0/0` and a strong database password). Create a database user and copy the Atlas connection string, replacing its password placeholder and specifying a database name such as `ai-mystery-room`.
3. In Render, choose **New → Blueprint**, connect the repository, and apply the `render.yaml` blueprint.
4. In the new service's **Environment** settings, set `MONGODB_URI` to the Atlas connection string. Set `GEMINI_API_KEY` to a Google AI Studio key if you want AI generated cases. Both values are secrets and belong only in the Render service environment.
5. Deploy. Render runs `npm install`, `npm run build`, then `npm start`. Wait for the service to become live.
6. Open the service URL. Check `https://<your-service>.onrender.com/api/health`; `database` should report `connected` after MongoDB connects. Create a case and refresh it to confirm persisted case state.

The blueprint sets `NODE_ENV=production` and uses `/api/health` for health checks. Render supplies `PORT` automatically. The frontend calls the relative `/api` path, so you do not need a `VITE_API_BASE_URL` or a separate CORS origin for this deployment.

### Optional Gemini setup

Create a Gemini API key in Google AI Studio and save it as `GEMINI_API_KEY` in the Render service environment. Keep it out of client variables and source control. The optional `GEMINI_MODEL` setting defaults to `gemini-2.5-flash`.

### Updating the deployment

Push changes to the connected branch. Render rebuilds and deploys the service automatically. To use another Node host, configure the repository root, build command `npm install && npm run build`, start command `npm start`, and health check `/api/health`; provide `MONGODB_URI` and optionally `GEMINI_API_KEY` in that host's environment settings.

## Run locally

1. Install Node.js 20+.
2. Run `npm install` from the repository root.
3. Copy `server/.env.example` to `server/.env` (if provided) and set `MONGODB_URI` and `GEMINI_API_KEY` as desired. MongoDB and Gemini are optional for local fallback play.
4. Run `npm run dev` and open `http://localhost:5173`. The API runs at `http://localhost:5000`.
5. To verify the production build locally, run `npm run build` followed by `npm start`, then open `http://localhost:5000`.

## Environment

Server settings: `PORT` (host supplied), `MONGODB_URI` (optional, recommended for persistence), `GEMINI_API_KEY` (optional), `GEMINI_MODEL` (optional), and `CLIENT_URL` (optional when allowing a separate client origin). Vite variables are public and must not contain secrets.

## Game rules

Easy, Medium, and Hard require 3/4/5 suspects, 5/7/9 clues, and 2/3/3 hints. Correct accusation base scores are 100/150/200. Each unique clue adds 5 points and each successfully delivered hint costs 10; the score floor is zero. The backend is authoritative for discovery, hints, accusation, and scoring.

All cases and artifacts are fictional. Unsupported media formats use clearly labeled simulations rather than claims of actual recordings.
