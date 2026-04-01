# Clinical Appointment Booking API

An intentionally small Express API written in Typescript for a clinic scheduling workflow. It uses SQLite for persistence, ships with Docker support, includes a generated OpenAPI spec, and comes with reusable curl scripts for the core roles: patient, clinician, and admin.

## Technical Notes

- Functionally, this app is a simple CRUD app demonstrating clean design principles such as keeping the pure function core
separate from application shell concerns and best engineering practices in handling concurrent read-write behaviours.
- Zod is used in the validator middleware to reject requests that do
not conform to expected schema before they hit the handlers
- To allow for concurrency-safe operations when booking an appointment, we add a db level check for overlap before finally booking all as a single atomic transaction i.e. Atomic(check, then book). To do this, we perform a search against an index of patient appointments with `start`, `end` and `patient id` and then perform an overlap check and insert as a single, immediate transaction. This removes any window of opportunity for double booking if we had done a naive check at the application layer. However, this assumes that only patients can write. Obviously we'd need to add expand on this by using say a `BEFORE INSERT` trigger to do an overlap check prior to insert if we had things like migrations, admin work or a future service that does an appointment write
- The persistence layer is set to utilize write-ahead log as an optimization technique for handling writes separately from the main database so they do not block reads, allowing for more performant behaviour in high volume concurrent traffic.However, this assumes the app will handle only lean, constrained textual data. All bets are off if the traffic includes
huge files in transactions i.e. media files. For such usecases, it would better to a proper database like PostgreSQL instead of SQLite
- Dependencies are pinned for security and for deterministic builds
- We've added a delete and login functionality outside the scope of the original exercise to service user creation and cleanup cleanly. These could be extended further if this were to become a serious project for production
- There are a couple of deprecated Zod APIs that we depend on, but they're still functional. It has been a while since I used
Zod so for the sake of correctness and time management, I have left them as such. Ideally, we'd need to migrate away from them

## Includes

- Express 5 API written in TypeScript
- SQLite persistence through `better-sqlite3`
- Local and Docker-based development flows
- Generated OpenAPI spec and Redocly preview
- Reusable curl scripts for each main API use case
- Playwright API tests

## API Summary

Base URL: `http://localhost:3000/api`

Endpoints:

- `GET /health`
- `POST /login`
- `DELETE /users/:id`
- `POST /appointments`
- `GET /appointments`
- `GET /clinicians/:id/appointments`

Role header:

- Protected endpoints use the `x-role` header to simulate access control
- Use `patient` for appointment creation.
- Use `clinician` for clinician appointment lookup.
- Use `admin` for global appointment lookup.

Note: for the scope of this project, patients role has no means for retrieving appointments.

## Quick Start

### Prerequisites

- Node.js 22+
- npm 10+
- Docker Desktop if you want the container flow

### Install

```bash
npm install
cp .env.example .env
cp scripts/curl/.env.example scripts/curl/.env
```

### Run Locally

```bash
npm run dev
```

The API will start on `http://localhost:3000` and will persist data to `./data/app.db` by default.

### Run With Docker

```bash
npm run docker:build # build image
npm run docker:up # starts docker app
```

Container notes:

- The app listens on `http://localhost:3000`
- SQLite persists inside the named Docker volume mounted at `/app/data`
- The container uses `SQLITE_DB_PATH=/app/data/app.db`

To stop the stack:

```bash
npm run docker:down
```

## Useful Commands

```bash
npm run dev
npm run build
npm run start:prod
npm run typecheck
npm run test
npm run docker:build
npm run docker:up
npm run docker:down
npm run docker:logs
npm run openapi:generate
npm run openapi:preview
npm run openapi:lint
```

## Configuration

Application config in `.env`:

```dotenv
PORT=3000
SQLITE_DB_PATH=./data/app.db
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api
```

Reusable curl config in `scripts/curl/.env`:

```dotenv
API_BASE_URL=http://localhost:3000/api
PATIENT_ID=
CLINICIAN_ID=
USER_ID=
FROM_AT=2026-04-01T00:00:00Z
TO_AT=2026-04-30T23:59:59Z
START_AT=2026-04-01T10:00:00Z
END_AT=2026-04-01T10:30:00Z
REASON=Annual check-up
```

## OpenAPI Docs

Generate the spec:

```bash
npm run openapi:generate
```

This writes the generated spec to `openapi/openapi.json`.

Preview the docs locally with Redocly:

```bash
npm run openapi:preview
```

This builds `openapi/index.html` and serves it at `http://localhost:8080`.

## Reusable Curl Workflows

These scripts are shell-based and are intended for Git Bash, WSL, or macOS/Linux shells.

### 1. Create a Patient, Clinician, or Admin User

```bash
sh scripts/curl/login.sh patient patient-demo
sh scripts/curl/login.sh clinician clinician-demo
sh scripts/curl/login.sh admin admin-demo
```

Each command returns a `userId`. Copy the patient and clinician IDs into `scripts/curl/.env`.

### 2. Book an Appointment as a Patient

```bash
sh scripts/curl/create-appointment.sh
```

This reads `PATIENT_ID`, `CLINICIAN_ID`, `START_AT`, `END_AT`, and `REASON` from `scripts/curl/.env`.

### 3. List Appointments as an Admin

```bash
sh scripts/curl/list-admin-appointments.sh
```

If `FROM_AT` and `TO_AT` are set, the request is filtered to that date range.

### 4. List Appointments for a Clinician

```bash
sh scripts/curl/list-clinician-appointments.sh
```

This uses `CLINICIAN_ID` and the optional `FROM_AT` and `TO_AT` values.

### 5. Delete a User

```bash
sh scripts/curl/delete-user.sh
```

You can also pass an explicit ID:

```bash
sh scripts/curl/delete-user.sh <user-id>
```

## Example One-Off Curl Commands

Health check:

```bash
curl http://localhost:3000/api/health
```

Login:

```bash
curl -X POST http://localhost:3000/api/login \
 -H 'Content-Type: application/json' \
 -d '{"username":"patient-demo","role":"patient"}'
```

Create appointment:

```bash
curl -X POST http://localhost:3000/api/appointments \
 -H 'Content-Type: application/json' \
 -H 'x-role: patient' \
 -d '{"patientId":"<patient-id>","clinicianId":"<clinician-id>","start":"2026-04-01T10:00:00Z","end":"2026-04-01T10:30:00Z","reason":"Annual check-up"}'
```

Admin list:

```bash
curl -X GET 'http://localhost:3000/api/appointments?from=2026-04-01T00:00:00Z&to=2026-04-30T23:59:59Z' \
 -H 'x-role: admin'
```

Clinician list:

```bash
curl -X GET 'http://localhost:3000/api/clinicians/<clinician-id>/appointments?from=2026-04-01T00:00:00Z&to=2026-04-30T23:59:59Z' \
 -H 'x-role: clinician'
```

Delete user:

```bash
curl -X DELETE http://localhost:3000/api/users/<user-id>
```
