/**
 * Cienki klient HTTP + globalny stan „trybu AI”.
 *
 * Adres backendu pochodzi ze zmiennej `VITE_API_URL` (np. http://localhost:5000).
 * Gdy zmiennej brak, aplikacja działa wyłącznie na mockach (tryb demo).
 */
import { useSyncExternalStore } from 'react';

const rawBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? '';

/** Adres bazowy API bez końcowego ukośnika; pusty string = backend wyłączony. */
export const API_BASE_URL = rawBase.replace(/\/+$/, '');

export const isApiEnabled = API_BASE_URL.length > 0;

export class ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** POST z JSON-em, timeoutem i czytelnym błędem. Zwraca sparsowaną odpowiedź. */
export async function postJson<TResponse>(path: string, body: unknown, timeoutMs = 45_000): Promise<TResponse> {
  if (!isApiEnabled) throw new ApiError('Backend wyłączony (brak VITE_API_URL).');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = '';
      try {
        const data = (await res.json()) as { message?: string };
        detail = data.message ?? '';
      } catch {
        /* odpowiedź bez JSON-a */
      }
      throw new ApiError(detail || `Błąd serwera (${res.status}).`, res.status);
    }
    return (await res.json()) as TResponse;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') throw new ApiError('Backend nie odpowiedział w czasie.');
    throw new ApiError('Nie można połączyć się z backendem.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Skąd pochodzi ostatnia odpowiedź AI:
 * - `demo`     – backend wyłączony, działają mocki,
 * - `pending`  – backend włączony, jeszcze nie było zapytania,
 * - `backend`  – ostatnia odpowiedź przyszła z backendu,
 * - `fallback` – backend zawiódł, użyto mocka.
 */
export type AiMode = 'demo' | 'pending' | 'backend' | 'fallback';

let currentMode: AiMode = isApiEnabled ? 'pending' : 'demo';
const listeners = new Set<() => void>();

export function setAiMode(mode: AiMode): void {
  if (mode === currentMode) return;
  currentMode = mode;
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useAiMode = (): AiMode => useSyncExternalStore(subscribe, () => currentMode);
