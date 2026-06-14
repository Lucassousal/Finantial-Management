import { describe, it, expect } from 'vitest';
import { calculatePropagationUpdates } from './investmentUtils';

describe('investmentUtils - calculatePropagationUpdates', () => {
  it('should require insert and return empty updates when futureHistory is empty', () => {
    const targetDate = '2026-05-30';
    const newBalance = 650;
    const delta = 100;
    const futureHistory = [];

    const result = calculatePropagationUpdates(targetDate, newBalance, delta, futureHistory);

    expect(result.needsInsert).toBe(true);
    expect(result.updates).toEqual([]);
  });

  it('should require insert and calculate future updates correctly when targetDate is not in history', () => {
    const targetDate = '2026-05-30';
    const newBalance = 650;
    const delta = 100;
    const futureHistory = [
      { id: 'uuid-1', date: '2026-06-14', balance: 550 }
    ];

    const result = calculatePropagationUpdates(targetDate, newBalance, delta, futureHistory);

    expect(result.needsInsert).toBe(true);
    // Deve propagar o delta para o dia 14/06
    expect(result.updates).toEqual([
      { id: 'uuid-1', date: '2026-06-14', balance: 650 }
    ]);
  });

  it('should NOT require insert and update existing target date correctly without altering future if delta is 0', () => {
    const targetDate = '2026-06-14';
    const newBalance = 650; // was 650
    const delta = 0;
    const futureHistory = [
      { id: 'uuid-1', date: '2026-06-14', balance: 650 },
      { id: 'uuid-2', date: '2026-07-14', balance: 700 }
    ];

    const result = calculatePropagationUpdates(targetDate, newBalance, delta, futureHistory);

    expect(result.needsInsert).toBe(false);
    expect(result.updates).toEqual([
      { id: 'uuid-1', date: '2026-06-14', balance: 650 },
      { id: 'uuid-2', date: '2026-07-14', balance: 700 }
    ]);
  });

  it('should NOT require insert and should propagate negative delta correctly', () => {
    const targetDate = '2026-05-14';
    const newBalance = 400; // was 500, decreased by 100
    const delta = -100;
    const futureHistory = [
      { id: 'uuid-1', date: '2026-05-14', balance: 500 },
      { id: 'uuid-2', date: '2026-06-14', balance: 650 }
    ];

    const result = calculatePropagationUpdates(targetDate, newBalance, delta, futureHistory);

    expect(result.needsInsert).toBe(false);
    // O alvo recebe newBalance, e o futuro soma o delta negativo
    expect(result.updates).toEqual([
      { id: 'uuid-1', date: '2026-05-14', balance: 400 },
      { id: 'uuid-2', date: '2026-06-14', balance: 550 }
    ]);
  });

  it('CRITICAL: Should never inject new objects into updates array without an ID from futureHistory', () => {
    // Esse teste garante que o erro de "chaves não uniformes" do Supabase não volte a acontecer!
    const targetDate = '2026-05-30';
    const newBalance = 650;
    const delta = 100;
    const futureHistory = [
      { id: 'uuid-1', created_at: 'now', date: '2026-06-14', balance: 550 }
    ];

    const result = calculatePropagationUpdates(targetDate, newBalance, delta, futureHistory);

    result.updates.forEach(update => {
      // Todos os objetos no array updates DEVEM ter vindo do futureHistory, logo devem ter o campo 'id'.
      expect(update).toHaveProperty('id');
      expect(update).toHaveProperty('created_at');
    });
  });
});
