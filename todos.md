# Todo List — Clinic Appointment System Backend

## 1. Project Setup

* Initialize TypeScript project
* Choose framework (Express / Fastify / Nest)
* Set up project structure (routes, services, models, validation)
* Configure linting + formatting (optional but recommended)
* Set up in-memory store or SQLite DB

---

## 2. Core Domain Modeling

* Define entities:

  * Appointment
  * Patient
  * Clinician
* Decide:

  * Auto-create patient/clinician vs pre-seeded
* Define appointment schema:

  * id
  * patientId
  * clinicianId
  * start (ISO datetime)
  * end (ISO datetime)

---

## 3. Validation Layer

* Validate:

  * `start` and `end` are valid ISO datetimes
  * `start < end`
  * No zero or negative duration
  * Optional: reject past appointments
* Implement overlap logic:

  * Allow: `end === other.start`
  * Reject if: `start < other.end && end > other.start`

---

## 4. Endpoint: Create Appointment

**POST /appointments**

* Parse and validate request body
* Ensure patient & clinician exist (or auto-create)
* Check for overlapping appointments (same clinician)
* Return:

  * `201 Created` + appointment JSON
  * `409 Conflict` if overlap
  * `400 Bad Request` if invalid input

---

## 5. Endpoint: Clinician Upcoming Appointments

**GET /clinicians/{id}/appointments**

* Accept optional query params: `from`, `to`
* Filter:

  * Default: `start >= now`
  * Apply date range if provided
* Return:

  * `200 OK` + list of appointments

---

## 6. Endpoint: Admin — All Upcoming Appointments

**GET /appointments**

* Accept optional query params: `from`, `to`
* Filter:

  * Upcoming appointments
  * Date range if provided
* Optional:

  * Add pagination / limit
* Return:

  * `200 OK` + list

---

## 7. Error Handling

* Standardize error responses
* Use correct HTTP status codes:

  * 400 (validation)
  * 409 (conflict)
  * 200 / 201 (success)

---

## 8. Tests (Minimal but Required)

* Test cases:

  * Successful appointment creation
  * Reject overlapping appointment
  * List clinician appointments
  * Date range filtering

---

## 9. README.md

* Add:

  * Setup instructions (npm/yarn)
  * Run instructions
  * Test instructions
  * Example `curl` commands
  * Design decisions / tradeoffs

---

## 10. Optional Enhancements (Bonus)

* Swagger / OpenAPI docs
* Role simulation:

  * `?role=patient|clinician|admin` or `X-Role` header
  * Restrict endpoints (e.g. admin-only)
* Dockerfile (+ docker-compose with SQLite)
* CI pipeline (e.g. GitHub Actions)
* Concurrency safety:

  * Locking or DB constraint
  * Document race condition handling

---

## 11. Final Review

* Ensure code clarity and structure
* Confirm edge cases handled
* Verify endpoints match spec
* Keep within ~3–4 hour scope (avoid overbuilding)

---
