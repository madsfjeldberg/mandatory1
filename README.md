# Mandatory 1

A fake info generator with a TypeScript/Express backend and a plain HTML/JS frontend.

## Running the Backend

The backend runs in Docker and requires Docker and Docker Compose to be installed.

From the `backend/` directory, build and start the containers:

```bash
cd backend
docker compose up --build -d
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

## Test

## Prerequisite
This project uses Testcontainers for integration tests.
Therefor you need to have docker running on your local pc, to ensure the integration tests can run.
Otherwise it will fail.

## Test Configuration
The backend uses Vitest for unit and integration testing, and the frontend uses Playwright for end-to-end testing. The test configurations are defined in `backend/vitest.config.ts` and `backend/playwright.config.ts`, respectively.

## Running Tests
First install the dependencies for the backend:

```bash
npm install
```

The backend tests are written using Vitest. To run the tests:
```bash
npm run test
```
This will run the tests continually in watch mode. To run the tests once and exit:
```bash
npm run test:once
```

Or run the tests in ui mode:
```bash
npm run test:ui
```

The frontend tests are written using Playwright. To run the tests:
```bash
npm run test:e2e
```

## API Tests (Postman/Newman)

API tests are run with Newman in CI and locally.

1. In Postman, export your collection as JSON.
2. Save it as `tests/api/postman/collection.json`.
3. Commit the file to the repository.

Then run API tests locally with:

```bash
npm run test:api
```

The CI workflow starts backend services first, then runs Newman against this collection.
