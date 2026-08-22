import { describe, expect, it } from 'vitest';
import { runEndPresentation } from './runEndPresentation';

describe('runEndPresentation', () => {
  it('gives ladder-complete a distinct heading and class from an ordinary loss or draw', () => {
    const complete = runEndPresentation('ladder-complete');
    const lost = runEndPresentation('lost');
    const drawn = runEndPresentation('drawn');

    expect(complete.heading).not.toBe(lost.heading);
    expect(complete.className).not.toBe(lost.className);
    expect(lost).toEqual(drawn);
  });
});
