import { describe, expect, it } from 'vitest';
import { buildBlindStructure } from './blinds';

describe('blind structure', () => {
  it('opens with a familiar 10/20 level', () => {
    const levels = buildBlindStructure(180, 5000, 7);
    expect(levels[0].smallBlind).toBe(10);
    expect(levels[0].bigBlind).toBe(20);
  });

  it('raises the finishing blinds for a larger field at equal stack and duration', () => {
    const four = buildBlindStructure(180, 5000, 4).filter(level => !level.isBreak);
    const ten = buildBlindStructure(180, 5000, 10).filter(level => !level.isBreak);
    expect(ten[ten.length - 1].bigBlind).toBeGreaterThan(four[four.length - 1].bigBlind);
  });

  it('adds an optional break', () => {
    expect(buildBlindStructure(180, 5000, 7, 15, 10).some(level => level.isBreak)).toBe(true);
  });

  it('uses the complete requested duration including a break', () => {
    const levels = buildBlindStructure(180, 5000, 7, 15, 5);
    expect(levels.reduce((sum, level) => sum + level.durationSeconds, 0)).toBe(180 * 60);
  });
});
