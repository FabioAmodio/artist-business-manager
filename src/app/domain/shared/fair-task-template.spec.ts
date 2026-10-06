import { buildDefaultFairTasks } from './fair-task-template';

describe('buildDefaultFairTasks', () => {
  it('generates the global guide checklist when the series has no custom template', () => {
    const tasks = buildDefaultFairTasks('edition-1', '2026-01-01T00:00:00.000Z');

    expect(tasks).toHaveLength(7);
    expect(tasks.every((task) => task.fairEditionId === 'edition-1')).toBe(true);
    expect(tasks.every((task) => task.status === 'pending')).toBe(true);
    expect(tasks.map((task) => task.kind)).toContain('contact-organizer');
    expect(tasks.map((task) => task.kind)).toContain('hotel-cancellation-deadline');
  });

  it('uses the series template when provided, including default status and notes', () => {
    const tasks = buildDefaultFairTasks('edition-2', '2026-01-01T00:00:00.000Z', [
      { kind: 'book-hotel', title: 'Prenotare hotel', defaultStatus: 'pending', defaultNotes: 'Prenotare sempre con cancellazione gratuita fino a conferma organizzatori.' },
      { kind: 'contact-organizer', title: 'Contattare organizzatore', defaultStatus: 'not-needed' },
    ]);

    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toEqual(expect.objectContaining({ kind: 'book-hotel', status: 'pending', notes: 'Prenotare sempre con cancellazione gratuita fino a conferma organizzatori.' }));
    expect(tasks[1]).toEqual(expect.objectContaining({ kind: 'contact-organizer', status: 'not-needed' }));
  });

  it('produces stable, unique ids for each generated task', () => {
    const tasks = buildDefaultFairTasks('edition-3', '2026-01-01T00:00:00.000Z');
    const ids = new Set(tasks.map((task) => task.id));

    expect(ids.size).toBe(tasks.length);
  });
});
