import type { AppointmentResponse } from '../types.js';

export function hasOverlap(
    appointments: AppointmentResponse[],
    clinicianId: string,
    startIso: string,
    endIso: string,
): boolean {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();

    return appointments.some((appointment) => {
        if (appointment.clinicianId !== clinicianId) {
            return false;
        }

        const existingStart = new Date(appointment.start).getTime();
        const existingEnd = new Date(appointment.end).getTime();

        return start < existingEnd && end > existingStart;
    });
}

export function inDateRange(appointment: AppointmentResponse, from?: string, to?: string): boolean {
    const start = new Date(appointment.start).getTime();
    const end = new Date(appointment.end).getTime();

    if (from && start < new Date(from).getTime()) {
        return false;
    }

    if (to && end > new Date(to).getTime()) {
        return false;
    }

    return true;
}

export function onlyUpcoming(appointment: AppointmentResponse): boolean {
    return new Date(appointment.start).getTime() >= Date.now();
}
