export type McpResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
};

// Base URL of the local MCP server (adjust if needed)
const MCP_BASE = 'http://127.0.0.1:5000';

/**
 * Generic helper to call an endpoint on the MCP server.
 * @param endpoint   The endpoint name (without leading slash).
 * @param payload    JSON payload sent as POST body.
 */
export async function callMcp<T = any>(endpoint: string, payload: Record<string, unknown> = {}): Promise<McpResponse<T>> {
    try {
        const resp = await fetch(`${MCP_BASE}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json = await resp.json();
        return { success: true, data: json };
    } catch (err: any) {
        console.error('MCP call failed', err);
        return { success: false, error: err?.message ?? 'unknown error' };
    }
}

// ---------- iMessage specific helpers ----------
/** Retrieve received iMessages (if the server implements this endpoint). */
export async function getImessages() {
    return callMcp('imessages/get');
}

/** Send an iMessage via the local MCP server. */
export async function sendImessage(to: string, text: string) {
    return callMcp('imessages/send', { to, text });
}
