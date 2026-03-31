/**
 * Utility function to create a new user with a specified 
 * role (admin, clinician, or patient) for testing purposes.
 */

import { fileURLToPath } from "url";
import type { Login, LoginResponse } from "../../src/types.js";
import dotenv from 'dotenv';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true });

const API_URL = process.env.API_URL;

if (!API_URL) {
    throw new Error('API_URL environment variable is not set');
}

const API_BASE = API_URL.replace(/\/+$/, '');
const LOGIN_ENDPOINT = `${API_BASE}/login`;
const USERS_ENDPOINT = `${API_BASE}/users`;

export async function createUser(role: 'admin' | 'clinician' | 'patient') {
    const payload: Login = {
        username: `${role}_user`,
        role: role
    };

    const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const responseBody: LoginResponse = await response.json();

    return responseBody;
}

export async function deleteUser(userId: string) {
    await fetch(`${USERS_ENDPOINT}/${userId}`, {
        method: 'DELETE'
    });
}