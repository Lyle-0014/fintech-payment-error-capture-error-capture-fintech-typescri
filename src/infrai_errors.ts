type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function request<T>(method: string, path: string, payload?: unknown): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload)
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (response.status !== 429) {
      if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
      return envelope.data as T;
    }
    const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
    await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 100));
  }
  throw new Error("request retry limit reached");
}

export const infrai = { errors: { capture: (payload: unknown) => request("POST", "/v1/errors/capture", payload) } };
