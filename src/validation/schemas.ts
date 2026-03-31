import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'clinician', 'patient']);

export const loginSchema = z.object({
    username: z.string().trim().min(1),
    role: roleSchema,
});

export const createAppointmentSchema = z
    .object({
        patientId: z.string().trim().min(1),
        clinicianId: z.string().trim().min(1),
        start: z.string().datetime({ offset: true }),
        end: z.string().datetime({ offset: true }),
        reason: z.string().trim().min(1).max(500),
    })
    .superRefine((value, ctx) => {
        const start = new Date(value.start);
        const end = new Date(value.end);

        if (start.getTime() >= end.getTime()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'start must be before end',
                path: ['start'],
            });
        }
    });

export const dateRangeQuerySchema = z
    .object({
        from: z.string().datetime({ offset: true }).optional(),
        to: z.string().datetime({ offset: true }).optional(),
    })
    .superRefine((value, ctx) => {
        if (!value.from || !value.to) {
            return;
        }

        if (new Date(value.from).getTime() > new Date(value.to).getTime()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'from must be before or equal to to',
                path: ['from'],
            });
        }
    });

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type DateRangeQueryInput = z.infer<typeof dateRangeQuerySchema>;
