import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import type { AppointmentResponse, Role, User } from '../types.js';

type AppointmentInput = Omit<AppointmentResponse, 'appointmentId'>;

export class AppointmentConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AppointmentConflictError';
    }
}

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const defaultDbPath = path.join(projectRoot, 'data', 'app.db');
const databasePath = process.env.SQLITE_DB_PATH ?? defaultDbPath;

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
// Enable Write-Ahead Logging for better concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'clinician', 'patient'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    appointment_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    clinician_id TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    reason TEXT NOT NULL,
    FOREIGN KEY(patient_id) REFERENCES users(user_id),
    FOREIGN KEY(clinician_id) REFERENCES users(user_id)
  );

    CREATE INDEX IF NOT EXISTS idx_appointments_patient_schedule
        ON appointments(patient_id, start, end);
`);

const createUserStmt = db.prepare(
    'INSERT INTO users (user_id, username, role) VALUES (?, ?, ?)',
);
const getUserByIdStmt = db.prepare(
    'SELECT user_id, username, role FROM users WHERE user_id = ?',
);
const deleteUserStmt = db.prepare('DELETE FROM users WHERE user_id = ?');
const deleteAppointmentsByUserStmt = db.prepare(
    'DELETE FROM appointments WHERE patient_id = ? OR clinician_id = ?',
);
const createAppointmentStmt = db.prepare(
    'INSERT INTO appointments (appointment_id, patient_id, clinician_id, start, end, reason) VALUES (?, ?, ?, ?, ?, ?)',
);
const findPatientOverlapStmt = db.prepare(
    `SELECT 1
     FROM appointments
     WHERE patient_id = ?
       AND unixepoch(start) < unixepoch(?)
       AND unixepoch(end) > unixepoch(?)
     LIMIT 1`,
);
const listAppointmentsStmt = db.prepare(
    'SELECT appointment_id, patient_id, clinician_id, start, end, reason FROM appointments',
);

type DbUserRow = {
    user_id: string;
    username: string;
    role: Role;
};

type DbAppointmentRow = {
    appointment_id: string;
    patient_id: string;
    clinician_id: string;
    start: string;
    end: string;
    reason: string;
};

export function createUser(username: string, role: Role): User {
    const user: User = {
        userId: randomUUID(),
        username,
        role,
    };

    createUserStmt.run(user.userId, user.username, user.role);
    return user;
}

export function getUserById(userId: string): User | undefined {
    const row = getUserByIdStmt.get(userId) as DbUserRow | undefined;
    if (!row) {
        return undefined;
    }

    return {
        userId: row.user_id,
        username: row.username,
        role: row.role,
    };
}

export function deleteUserById(userId: string): void {
    // Ideally this should be a soft delete with a "deleted" flag, 
    // but for simplicity we'll do a hard delete here.
    const tx = db.transaction((id: string) => {
        deleteAppointmentsByUserStmt.run(id, id);
        deleteUserStmt.run(id);
    });

    tx(userId);
}

export function createAppointment(input: AppointmentInput): AppointmentResponse {
    const appointment: AppointmentResponse = {
        appointmentId: randomUUID(),
        ...input,
    };

    // We do an immediate transaction here to ensure that the overlap check and insert are atomic.
    // This prevents race conditions where two appointments could be created for the same patient at the same time.
    const insertAppointment = db.transaction((nextAppointment: AppointmentResponse) => {
        const hasPatientOverlap = findPatientOverlapStmt.get(
            nextAppointment.patientId,
            nextAppointment.end,
            nextAppointment.start,
        ) as { 1: number } | undefined;

        if (hasPatientOverlap) {
            throw new AppointmentConflictError('Appointment overlaps for patient');
        }

        createAppointmentStmt.run(
            nextAppointment.appointmentId,
            nextAppointment.patientId,
            nextAppointment.clinicianId,
            nextAppointment.start,
            nextAppointment.end,
            nextAppointment.reason,
        );
    }).immediate;

    insertAppointment(appointment);

    return appointment;
}

export function listAppointments(): AppointmentResponse[] {
    const rows = listAppointmentsStmt.all() as DbAppointmentRow[];

    return rows.map((row) => ({
        appointmentId: row.appointment_id,
        patientId: row.patient_id,
        clinicianId: row.clinician_id,
        start: row.start,
        end: row.end,
        reason: row.reason,
    }));
}
