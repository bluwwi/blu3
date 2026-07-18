const STORAGE_KEY = "blu3_pending_queue";

interface PendingAction {
  id: string;
  type: string;
  payload: string;
  createdAt: number;
}

export function enqueueAction(type: string, payload: object): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const queue: PendingAction[] = raw ? JSON.parse(raw) : [];
    queue.push({
      id: crypto.randomUUID(),
      type,
      payload: JSON.stringify(payload),
      createdAt: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

export function dequeueAll(): PendingAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    localStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearPendingQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
