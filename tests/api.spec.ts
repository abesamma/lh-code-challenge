import type { AppointmentResponse, ClinicianAppointmentsResponse, AdminAppointmentsResponse } from '../src/types.js';
import { test, expect } from '@playwright/test';
import { test as testAsAdmin } from './fixtures/admin.fixture.js';
import { test as testAsClinician } from './fixtures/clinician.fixture.js';
import { test as testAsPatient } from './fixtures/patient.fixture.js';
import { createUser, deleteUser } from './helpers/user.js';

// Fail early if API_URL is not set
if (!process.env.API_URL) {
    throw new Error('API_URL environment variable is not set');
}

const API_BASE = process.env.API_URL.replace(/\/+$/, '');
const APPOINTMENTS_ENDPOINT = `${API_BASE}/appointments`;
const CLINICIAN_API_ENDPOINT = `${API_BASE}/clinicians`;

let testClinician: any;
let testClinicianTwo: any;
let testPatient: any;

test.beforeAll(async () => {
    try {
        // Create test users for clinician, patient, and admin roles
        testClinician = await createUser('clinician');
        testClinicianTwo = await createUser('clinician');
        testPatient = await createUser('patient');
    } catch (error) {
        console.error('Error setting up test users:', error);
        throw error; // Rethrow to fail the tests if setup fails
    }
});

test.afterAll(async () => {
    // Clean up test users after all tests have run
    if (testClinician?.userId) {
        await deleteUser(testClinician.userId);
    }
    if (testClinicianTwo?.userId) {
        await deleteUser(testClinicianTwo.userId);
    }
    if (testPatient?.userId) {
        await deleteUser(testPatient.userId);
    }
});

/**
 * Patient workflow tests
 */

test.describe('Clinical Appointment Booking API:patient workflow', () => {

    const apiUrl = APPOINTMENTS_ENDPOINT;

    testAsPatient('patient should create a new appointment', async ({ api }) => {
        const response = await api.request.post(apiUrl, {
            data: {
                patientId: api.userId,
                clinicianId: testClinician.userId,
                // Use ISO 8601 format for date and time start and end
                start: '2024-07-01T10:00:00Z',
                end: '2024-07-01T10:30:00Z',
                reason: 'Regular check-up'
            }
        });

        expect(response.status()).toBe(201);
        const responseBody: AppointmentResponse = await response.json();
        expect(responseBody).toHaveProperty('appointmentId');
        expect(responseBody.patientId).toBe(api.userId);
        expect(responseBody.clinicianId).toBe(testClinician.userId);
        expect(responseBody.reason).toBe('Regular check-up');
        expect(responseBody.start).toBe('2024-07-01T10:00:00Z');
        expect(responseBody.end).toBe('2024-07-01T10:30:00Z');
    });
});

/**
 * Clinician workflow tests
 */

test.describe('Clinical Appointment Booking API:clinician workflow', () => {

    const apiUrl = CLINICIAN_API_ENDPOINT;

    testAsClinician('clinician should retrieve their appointments', async ({ api }) => {
        const clinicianId = api.userId;
        const response = await api.request.get(`${apiUrl}/${clinicianId}/appointments`);

        expect(response.status()).toBe(200);
        const responseBody: ClinicianAppointmentsResponse = await response.json();
        expect(Array.isArray(responseBody.appointments)).toBe(true);
        // Check that the appointments belong to the clinician
        responseBody.appointments.forEach((appointment) => {
            expect(appointment.clinicianId).toBe(clinicianId);
        });
        // Check for pagination metadata        
        expect(responseBody).toHaveProperty('total');
        expect(responseBody).toHaveProperty('page');
        expect(responseBody).toHaveProperty('pageSize');
    });
});

/**
 * Admin workflow tests
 */

test.describe('Clinical Appointment Booking API:admin workflow', () => {

    const apiUrl = APPOINTMENTS_ENDPOINT;

    testAsAdmin('admin should retrieve all appointments', async ({ api }) => {
        const response = await api.request.get(apiUrl);

        expect(response.status()).toBe(200);
        const responseBody: AdminAppointmentsResponse = await response.json();
        expect(Array.isArray(responseBody.appointments)).toBe(true);
        // Check for pagination metadata        
        expect(responseBody).toHaveProperty('total');
        expect(responseBody).toHaveProperty('page');
        expect(responseBody).toHaveProperty('pageSize');
    });

    // Filter by date range from: to: ISO 8601 format
    testAsAdmin('admin should filter appointments by date range', async ({ api }) => {
        const fromDate = '2024-07-01T00:00:00Z';
        const toDate = '2024-07-31T23:59:59Z';
        const response = await api.request.get(`${apiUrl}?from=${fromDate}&to=${toDate}`);

        expect(response.status()).toBe(200);
        const responseBody: AdminAppointmentsResponse = await response.json();
        expect(Array.isArray(responseBody.appointments)).toBe(true);

        // Check that the appointments fall within the specified date range
        responseBody.appointments.forEach((appointment) => {
            const appointmentStart = new Date(appointment.start);
            const appointmentEnd = new Date(appointment.end);
            expect(appointmentStart.getTime()).toBeGreaterThanOrEqual(new Date(fromDate).getTime());
            expect(appointmentEnd.getTime()).toBeLessThanOrEqual(new Date(toDate).getTime());
        });
    });
});

/**
 * Error handling tests for appointment creation:
 *  - Expect 409 on overlapping appointments for the same patient
 *  - Expect 400 on invalid input data (e.g., missing required fields, invalid date formats)
 *  - Appointments of zero duration or negative duration should be rejected with 400
 */

test.describe('Error handling tests for appointment creation', () => {
    const apiUrl = APPOINTMENTS_ENDPOINT;

    testAsPatient('should return 409 on overlapping appointments for the same patient', async ({ api }) => {
        // First, create an appointment for the patient.
        const response1 = await api.request.post(apiUrl, {
            data: {
                patientId: api.userId,
                clinicianId: testClinician.userId,
                start: '2024-07-01T10:00:00Z',
                end: '2024-07-01T10:30:00Z',
                reason: 'Regular check-up'
            }
        });
        expect(response1.status()).toBe(201);

        // Attempt to create another appointment that overlaps for the same patient,
        // even though it is with a different clinician.
        const response2 = await api.request.post(apiUrl, {
            data: {
                patientId: api.userId,
                clinicianId: testClinicianTwo.userId,
                start: '2024-07-01T10:15:00Z', // Overlaps with the first appointment
                end: '2024-07-01T10:45:00Z',
                reason: 'Follow-up'
            }
        });
        expect(response2.status()).toBe(409);
    });

    testAsPatient('should allow overlapping appointments for different patients', async ({ api }) => {
        const response = await api.request.post(apiUrl, {
            data: {
                patientId: api.userId,
                clinicianId: testClinician.userId,
                start: '2024-07-01T11:00:00Z',
                end: '2024-07-01T11:30:00Z',
                reason: 'Different patient same slot'
            }
        });

        expect(response.status()).toBe(201);
    });

    testAsPatient('should return 400 on invalid input data', async ({ api }) => {
        // Attempt to create an appointment with missing required fields
        const response = await api.request.post(apiUrl, {
            data: {
                patientId: api.userId,
                clinicianId: testClinician.userId,
                // Missing start and end times
                reason: 'Regular check-up'
            }
        });
        expect(response.status()).toBe(400);
    });

    testAsPatient('should return 400 for appointments of zero or negative duration', async ({ api }) => {
        // Attempt to create an appointment with zero duration
        const responseZeroDuration = await api.request.post(apiUrl, {
            data: {
                patientId: api.userId,
                clinicianId: testClinician.userId,
                start: '2024-07-01T10:00:00Z',
                end: '2024-07-01T10:00:00Z', // Zero duration
                reason: 'Regular check-up'
            }
        });
        expect(responseZeroDuration.status()).toBe(400);

        // Attempt to create an appointment with negative duration
        const responseNegativeDuration = await api.request.post(apiUrl, {
            data: {
                patientId: api.userId,
                clinicianId: testClinician.userId,
                start: '2024-07-01T10:30:00Z',
                end: '2024-07-01T10:00:00Z', // Negative duration
                reason: 'Regular check-up'
            }
        });
        expect(responseNegativeDuration.status()).toBe(400);
    });
});

/**
 * Error handling for clinician appointment retrieval:
 * - from and to query parameters should be in ISO 8601 format
 * - Expect 400 on invalid date formats
 * - from to should be a valid date range (from <= to): return 400 if from is after to
 */

test.describe('Error handling for clinician appointment retrieval', () => {
    const apiUrl = CLINICIAN_API_ENDPOINT;

    testAsClinician('should return 400 on invalid date formats', async ({ api }) => {
        const clinicianId = api.userId;
        const response = await api.request.get(`${apiUrl}/${clinicianId}/appointments?from=invalid-date&to=invalid-date`);

        expect(response.status()).toBe(400);
    });

    testAsClinician('should return 400 if from date is after to date', async ({ api }) => {
        const clinicianId = api.userId;
        const fromDate = '2024-07-31T23:59:59Z';
        const toDate = '2024-07-01T00:00:00Z';
        const response = await api.request.get(`${apiUrl}/${clinicianId}/appointments?from=${fromDate}&to=${toDate}`);

        expect(response.status()).toBe(400);
    });
});

test.describe('Authorization for protected appointment operations', () => {
    testAsPatient('patient should not retrieve all appointments', async ({ api }) => {
        const response = await api.request.get(APPOINTMENTS_ENDPOINT);

        expect(response.status()).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    });

    testAsPatient('patient should not retrieve clinician appointments', async ({ api }) => {
        const response = await api.request.get(`${CLINICIAN_API_ENDPOINT}/${testClinician.userId}/appointments`);

        expect(response.status()).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    });

    testAsClinician('clinician should not retrieve all appointments', async ({ api }) => {
        const response = await api.request.get(APPOINTMENTS_ENDPOINT);

        expect(response.status()).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    });

    testAsClinician('clinician should not create an appointment', async ({ api }) => {
        const response = await api.request.post(APPOINTMENTS_ENDPOINT, {
            data: {
                patientId: testPatient.userId,
                clinicianId: testClinician.userId,
                start: '2024-07-02T10:00:00Z',
                end: '2024-07-02T10:30:00Z',
                reason: 'Unauthorized clinician booking'
            }
        });

        expect(response.status()).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    });

    testAsAdmin('admin should not create an appointment', async ({ api }) => {
        const response = await api.request.post(APPOINTMENTS_ENDPOINT, {
            data: {
                patientId: testPatient.userId,
                clinicianId: testClinician.userId,
                start: '2024-07-02T11:00:00Z',
                end: '2024-07-02T11:30:00Z',
                reason: 'Unauthorized admin booking'
            }
        });

        expect(response.status()).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    });
});