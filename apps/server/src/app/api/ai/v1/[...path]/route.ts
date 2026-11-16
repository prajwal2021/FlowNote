import { queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

const UPSTREAM = 'https://api.openai.com/v1';
const PATHS = new Set(['chat/completions', 'responses', 'audio/transcriptions', 'audio/speech', 'models']);
const DEFAULT_MODELS = ['gpt-4o-mini', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4.1', 'whisper-1', 'gpt-4o-mini-tts', 'tts-1', 'tts-1-hd'];
const MAX_AUDIO_BYTES = 26 * 1024 * 1024;
const MAX_JSON_BYTES = 40 * 1024 * 1024;

function dailyLimit(): number {
  const configured = Number(process.env.AI_DAILY_LIMIT);
  return Number.isFinite(configured) && configured > 0 ? configured : 100;
}

function allowedModels(): Set<string> {
  const configured = process.env.OPENAI_ALLOWED_MODELS?.split(',').map((m) => m.trim()).filter(Boolean);
  return new Set(configured?.length ? configured : DEFAULT_MODELS);
}

async function proxy(request: Request, params: Promise<{ path: string[] }>): Promise<Response> {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (!auth.user.canUseAi) return fail(403, 'AI is turned off for your account. Add your own key in Settings.');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fail(503, 'FlowNote AI is not configured on the server.');
  const path = (await params).path.join('/');
  if (!PATHS.has(path)) return fail(404, 'That AI endpoint is not available.');

  const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
  let body: BodyInit | undefined;
  if (request.method === 'POST') {
    const type = request.headers.get('content-type') ?? '';
    const declared = Number(request.headers.get('content-length') ?? 0);
    if (type.includes('multipart/form-data')) {
      if (declared > MAX_AUDIO_BYTES) return fail(413, 'That file is too large.');
      const form = await request.formData().catch(() => null);
      const model = form?.get('model');
      if (!form || typeof model !== 'string' || !allowedModels().has(model)) return fail(400, 'That model is not available on FlowNote AI.');
      body = form;
    } else {
      if (declared > MAX_JSON_BYTES) return fail(413, 'That request is too large.');
      const text = await request.text();
      let model: unknown;
      try {
        model = (JSON.parse(text) as { model?: unknown }).model;
      } catch {
        return fail(400, 'Invalid request body.');
      }
      if (typeof model !== 'string' || !allowedModels().has(model)) return fail(400, 'That model is not available on FlowNote AI.');
      headers['Content-Type'] = 'application/json';
      body = text;
    }
  }

  const used = await queryOne<{ requests: number }>(
    `insert into ai_usage (user_id, day, requests) values ($1, current_date, 1)
     on conflict (user_id, day) do update set requests = ai_usage.requests + 1
     returning requests`,
    [auth.user.id],
  );
  if ((used?.requests ?? 0) > dailyLimit()) {
    return fail(429, 'You have reached today\'s FlowNote AI limit. It resets at midnight UTC, or add your own key in Settings.');
  }

  const upstream = await fetch(`${UPSTREAM}/${path}`, { method: request.method, headers, body }).catch(() => null);
  if (!upstream) return json({ error: 'Could not reach the AI provider.' }, 502);
  if (upstream.status === 401 || upstream.status === 403) {
    return json({ error: 'FlowNote AI is unavailable right now. Try again later, or add your own key in Settings.' }, 502);
  }
  const out = new Headers({ 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
  for (const name of ['content-type', 'x-request-id']) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}
