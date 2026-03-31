import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../openapi');
const outputPath = path.join(outputDir, 'openapi.json');

const spec = {
    openapi: '3.1.0',
    info: {
        title: 'Clinical Appointment Booking API',
        version: '1.0.0',
        description: 'Express API for login, user cleanup, and appointment booking workflows backed by SQLite.',
        license: {
            name: 'ISC',
        },
    },
    servers: [
        {
            url: 'http://localhost:3000/api',
            description: 'Local development server',
        },
    ],
    tags: [
        { name: 'System', description: 'Operational endpoints for service health.' },
        { name: 'Auth', description: 'Role-based login bootstrap endpoints.' },
        { name: 'Users', description: 'User lifecycle endpoints.' },
        { name: 'Appointments', description: 'Appointment booking and lookup endpoints.' },
    ],
    components: {
        securitySchemes: {
            RoleHeader: {
                type: 'apiKey',
                in: 'header',
                name: 'x-role',
                description: 'Role context header. Use admin, clinician, or patient depending on the endpoint.',
            },
        },
        schemas: {
            LoginRequest: {
                type: 'object',
                additionalProperties: false,
                required: ['username', 'role'],
                properties: {
                    username: { type: 'string', minLength: 1, example: 'patient-demo' },
                    role: {
                        type: 'string',
                        enum: ['admin', 'clinician', 'patient'],
                        example: 'patient',
                    },
                },
            },
            LoginResponse: {
                type: 'object',
                additionalProperties: false,
                required: ['userId', 'role'],
                properties: {
                    userId: { type: 'string', format: 'uuid', example: '8d37fb7d-919f-4dca-a0d8-b4f4df93ebf9' },
                    role: {
                        type: 'string',
                        enum: ['admin', 'clinician', 'patient'],
                        example: 'patient',
                    },
                },
            },
            CreateAppointmentRequest: {
                type: 'object',
                additionalProperties: false,
                required: ['patientId', 'clinicianId', 'start', 'end', 'reason'],
                properties: {
                    patientId: { type: 'string', format: 'uuid' },
                    clinicianId: { type: 'string', format: 'uuid' },
                    start: { type: 'string', format: 'date-time', example: '2026-04-01T10:00:00Z' },
                    end: { type: 'string', format: 'date-time', example: '2026-04-01T10:30:00Z' },
                    reason: { type: 'string', minLength: 1, example: 'Follow-up consultation' },
                },
            },
            AppointmentResponse: {
                type: 'object',
                additionalProperties: false,
                required: ['appointmentId', 'patientId', 'clinicianId', 'start', 'end', 'reason'],
                properties: {
                    appointmentId: { type: 'string', format: 'uuid' },
                    patientId: { type: 'string', format: 'uuid' },
                    clinicianId: { type: 'string', format: 'uuid' },
                    start: { type: 'string', format: 'date-time' },
                    end: { type: 'string', format: 'date-time' },
                    reason: { type: 'string' },
                },
            },
            ClinicianAppointmentsResponse: {
                type: 'object',
                additionalProperties: false,
                required: ['clinicianId', 'appointments', 'total', 'page', 'pageSize'],
                properties: {
                    clinicianId: { type: 'string', format: 'uuid' },
                    appointments: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AppointmentResponse' },
                    },
                    total: { type: 'integer', minimum: 0, example: 1 },
                    page: { type: 'integer', minimum: 1, example: 1 },
                    pageSize: { type: 'integer', minimum: 0, example: 1 },
                },
            },
            AdminAppointmentsResponse: {
                type: 'object',
                additionalProperties: false,
                required: ['appointments', 'total', 'page', 'pageSize'],
                properties: {
                    appointments: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AppointmentResponse' },
                    },
                    total: { type: 'integer', minimum: 0, example: 1 },
                    page: { type: 'integer', minimum: 1, example: 1 },
                    pageSize: { type: 'integer', minimum: 0, example: 1 },
                },
            },
            ErrorResponse: {
                type: 'object',
                additionalProperties: true,
                required: ['error'],
                properties: {
                    error: { type: 'string', example: 'Forbidden' },
                },
            },
            ValidationErrorResponse: {
                type: 'object',
                additionalProperties: true,
                required: ['error', 'details'],
                properties: {
                    error: { type: 'string', example: 'Invalid date range query' },
                    details: {
                        type: 'object',
                        additionalProperties: true,
                    },
                },
            },
        },
        parameters: {
            FromQuery: {
                name: 'from',
                in: 'query',
                required: false,
                schema: { type: 'string', format: 'date-time' },
                description: 'Inclusive lower bound for appointment start/end filtering.',
            },
            ToQuery: {
                name: 'to',
                in: 'query',
                required: false,
                schema: { type: 'string', format: 'date-time' },
                description: 'Inclusive upper bound for appointment start/end filtering.',
            },
            UserIdPath: {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string', format: 'uuid' },
            },
            ClinicianIdPath: {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string', format: 'uuid' },
            },
        },
        responses: {
            BadRequest: {
                description: 'Request validation failed.',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
                    },
                },
            },
            Forbidden: {
                description: 'Caller role is not allowed for this endpoint.',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
            Conflict: {
                description: 'Requested appointment overlaps an existing booking for the clinician.',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
        },
    },
    paths: {
        '/health': {
            get: {
                tags: ['System'],
                operationId: 'getHealth',
                summary: 'Check API health',
                security: [],
                responses: {
                    '200': {
                        description: 'API is healthy.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    additionalProperties: false,
                                    required: ['status'],
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                    },
                                },
                            },
                        },
                    },
                    '404': {
                        description: 'Route was not found.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/login': {
            post: {
                tags: ['Auth'],
                operationId: 'login',
                summary: 'Create a user session surrogate for a given role',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'User created and returned as a login response.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                },
            },
        },
        '/users/{id}': {
            delete: {
                tags: ['Users'],
                operationId: 'deleteUser',
                summary: 'Delete a user and any linked appointments',
                security: [],
                parameters: [{ $ref: '#/components/parameters/UserIdPath' }],
                responses: {
                    '204': {
                        description: 'User deleted.',
                    },
                    '400': {
                        description: 'User id was not supplied.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/appointments': {
            post: {
                tags: ['Appointments'],
                operationId: 'createAppointment',
                summary: 'Create an appointment as a patient',
                security: [{ RoleHeader: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateAppointmentRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Appointment created.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AppointmentResponse' },
                            },
                        },
                    },
                    '400': {
                        description: 'Invalid patient/clinician or invalid request body.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '409': { $ref: '#/components/responses/Conflict' },
                },
            },
            get: {
                tags: ['Appointments'],
                operationId: 'listAdminAppointments',
                summary: 'List appointments as an admin',
                security: [{ RoleHeader: [] }],
                parameters: [
                    { $ref: '#/components/parameters/FromQuery' },
                    { $ref: '#/components/parameters/ToQuery' },
                ],
                responses: {
                    '200': {
                        description: 'Appointments visible to the admin caller.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AdminAppointmentsResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/clinicians/{id}/appointments': {
            get: {
                tags: ['Appointments'],
                operationId: 'listClinicianAppointments',
                summary: 'List appointments for a clinician',
                security: [{ RoleHeader: [] }],
                parameters: [
                    { $ref: '#/components/parameters/ClinicianIdPath' },
                    { $ref: '#/components/parameters/FromQuery' },
                    { $ref: '#/components/parameters/ToQuery' },
                ],
                responses: {
                    '200': {
                        description: 'Appointments visible to the clinician caller.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ClinicianAppointmentsResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
    },
} as const;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');

console.log(`OpenAPI spec written to ${outputPath}`);