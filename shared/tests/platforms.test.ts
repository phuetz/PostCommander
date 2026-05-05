import { describe, it, expect } from 'vitest';
import { PLATFORMS } from '../src/constants/platforms.js';

describe('Platform Constants', () => {
  it('should define the standard platforms', () => {
    expect(PLATFORMS).toBeDefined();
    expect(Object.keys(PLATFORMS).length).toBeGreaterThan(0);
  });

  it('should include LinkedIn and Twitter', () => {
    const ids = Object.keys(PLATFORMS);
    expect(ids).toContain('linkedin');
    expect(ids).toContain('twitter');
  });

  it('all platforms should have required fields', () => {
    for (const key in PLATFORMS) {
      const platform = PLATFORMS[key as keyof typeof PLATFORMS];
      expect(platform.id).toBeDefined();
      expect(platform.name).toBeDefined();
      expect(typeof platform.charLimit).toBe('number');
    }
  });
});
