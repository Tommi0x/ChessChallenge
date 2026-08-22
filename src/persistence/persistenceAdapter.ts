export type PersistenceAdapter<T> = {
  load(): T | null;
  save(value: T): void;
};

export function createLocalStoragePersistenceAdapter<T>(
  key: string,
  isValid: (value: unknown) => value is T,
): PersistenceAdapter<T> {
  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        return isValid(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // localStorage unavailable (private browsing, quota exceeded) — persistence is best-effort.
      }
    },
  };
}
