const configured = (import.meta.env as Record<string, string | undefined>).WXT_FLOWNOTE_SERVER;

export const SERVER_URL = (configured ?? 'http://localhost:3100').replace(/\/$/, '');
