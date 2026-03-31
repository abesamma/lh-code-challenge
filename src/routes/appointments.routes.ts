import { Router } from 'express';
import {
    createAppointmentHandler,
    getAdminAppointmentsHandler,
    getClinicianAppointmentsHandler,
} from '../handlers/appointments.handlers.js';
import { requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createAppointmentSchema } from '../validation/schemas.js';

export const appointmentsRouter = Router();

appointmentsRouter.post(
    '/appointments',
    requireRole('patient'),
    validateBody(createAppointmentSchema),
    createAppointmentHandler,
);

appointmentsRouter.get(
    '/appointments',
    requireRole('admin'),
    getAdminAppointmentsHandler
);

appointmentsRouter.get(
    '/clinicians/:id/appointments',
    requireRole('clinician'),
    getClinicianAppointmentsHandler
);
