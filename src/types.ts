export type Login = {
    username: string;
    role: 'admin' | 'clinician' | 'patient';
};

export type Role = Login['role'];

export type User = {
    userId: string;
    username: string;
    role: Role;
};

export type LoginResponse = {
    userId: string;
    role: 'admin' | 'clinician' | 'patient';
};

export type Appointment = {
    patientId: string;
    clinicianId: string;
    start: string; // ISO 8601 format
    end: string;   // ISO 8601 format
    reason: string;
};

export type AppointmentResponse = Appointment & {
    appointmentId: string;
};

export type ClinicianAppointmentsResponse = {
    clinicianId: string;
    appointments: AppointmentResponse[];
    total: number;
    page: number;
    pageSize: number;
};

export type AdminAppointmentsResponse = {
    appointments: AppointmentResponse[];
    total: number;
    page: number;
    pageSize: number;
};
