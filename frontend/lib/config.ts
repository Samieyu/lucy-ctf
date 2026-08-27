// Used only in server-side code (API routes, middleware) — talks directly
// to the NestJS backend, container-to-container inside Docker.
export const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://api:4000';
