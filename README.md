# Mandatory 1

A fake info generator with a TypeScript/Express backend and a plain HTML/JS frontend.

## Running the Backend

The backend runs in Docker and requires Docker and Docker Compose to be installed.

From the `backend/` directory, build and start the containers:

```bash
cd backend
docker compose up --build
```

This starts:
- **API** — Express server exposed on port `8080`
- **Database** — MariaDB 11, initialized with `db/addresses.sql`

The API will be available at `http://localhost:8080` once the database health check passes.

To stop the containers:

```bash
docker compose down
```

## Running the Frontend

From the `frontend/` directory, serve the frontend using `npx serve`:

```bash
cd frontend
npx serve .
```

The frontend will be available at `http://localhost:3000` (or the port printed in the terminal).

> The frontend expects the backend API to be running on port `8080`.

## Test Configuration

The backend uses Vitest for testing, and the frontend uses Playwright for end-to-end testing. The test configurations are defined in `backend/vitest.config.ts` and `backend/playwright.config.ts`, respectively.

## Running Tests

The backend tests are written using Vitest. To run the tests:
```bash
cd backend
npm install
npm test
```
