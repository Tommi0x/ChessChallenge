import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalStoragePersistenceAdapter } from './persistenceAdapter';

const isNumber = (value: unknown): value is number => typeof value === 'number';

beforeEach(() => {
  localStorage.clear();
});

describe('createLocalStoragePersistenceAdapter', () => {
  it('returns null when nothing has been saved yet', () => {
    const adapter = createLocalStoragePersistenceAdapter('test-key', isNumber);

    expect(adapter.load()).toBeNull();
  });

  it('round-trips a saved value', () => {
    const adapter = createLocalStoragePersistenceAdapter('test-key', isNumber);

    adapter.save(7);

    expect(adapter.load()).toBe(7);
  });

  it('starts fresh (returns null) when stored data does not match the expected shape', () => {
    localStorage.setItem('test-key', JSON.stringify({ not: 'a number' }));
    const adapter = createLocalStoragePersistenceAdapter('test-key', isNumber);

    expect(adapter.load()).toBeNull();
  });

  it('starts fresh (returns null) when stored data is not valid JSON', () => {
    localStorage.setItem('test-key', 'not json');
    const adapter = createLocalStoragePersistenceAdapter('test-key', isNumber);

    expect(adapter.load()).toBeNull();
  });
});
