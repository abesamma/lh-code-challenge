import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { parseQuery } from '../middleware/validate.js';
import { inDateRange, onlyUpcoming } from '../services/appointments.js';
import {
    AppointmentConflictError,
    createAppointment,
    getUserById,
    listAppointments,
} from '../store/sqliteStore.js';
import { dateRangeQuerySchema } from '../validation/schemas.js';
import type {
    AdminAppointmentsResponse,
    AppointmentResponse,
    ClinicianAppointmentsResponse,
} from '../types.js';

export function createAppointmentHandler(req: Request, res: Response): void {
    const { patientId, clinicianId, start, end, reason } = req.body;

    const patient = getUserById(patientId);
    const clinician = getUserById(clinicianId);

    if (!patient || patient.role !== 'patient' || !clinician || clinician.role !== 'clinician') {
        res.status(400).json({ error: 'patientId or clinicianId is invalid' });
        return;
    }

    try {
        const appointment = createAppointment({ patientId, clinicianId, start, end, reason });
        res.status(201).json(appointment);
    } catch (error) {
        if (error instanceof AppointmentConflictError) {
            res.status(409).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: 'Internal server error' });
    }
}

export function getAdminAppointmentsHandler(req: Request, res: Response): void {
    try {
        const query = parseQuery(dateRangeQuerySchema, req.query);
        const allAppointments = listAppointments();

        const filtered = allAppointments
            .filter((appointment) => (query.from || query.to ? true : onlyUpcoming(appointment)))
            .filter((appointment) => inDateRange(appointment, query.from, query.to));

        const response: AdminAppointmentsResponse = {
            appointments: filtered,
            total: filtered.length,
            page: 1,
            pageSize: filtered.length,
        };

        res.status(200).json(response);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: 'Invalid date range query', details: error.flatten() });
            return;
        }

        res.status(500).json({ error: 'Internal server error' });
    }
}

export function getClinicianAppointmentsHandler(req: Request, res: Response): void {
    try {
        const query = parseQuery(dateRangeQuerySchema, req.query);
        const clinicianIdParam = req.params.id;
        const clinicianId = Array.isArray(clinicianIdParam) ? clinicianIdParam[0] : clinicianIdParam;

        if (!clinicianId) {
            res.status(400).json({ error: 'clinician id is required' });
            return;
        }

        const clinicianAppointments = listAppointments()
            .filter((appointment: AppointmentResponse) => appointment.clinicianId === clinicianId)
            .filter((appointment) => (query.from || query.to ? true : onlyUpcoming(appointment)))
            .filter((appointment) => inDateRange(appointment, query.from, query.to));

        const response: ClinicianAppointmentsResponse = {
            clinicianId,
            appointments: clinicianAppointments,
            total: clinicianAppointments.length,
            page: 1,
            pageSize: clinicianAppointments.length,
        };

        res.status(200).json(response);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: 'Invalid date range query', details: error.flatten() });
            return;
        }

        res.status(500).json({ error: 'Internal server error' });
    }
}
