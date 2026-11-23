import { describe, expect, it } from "vitest";
import { modules, glossary } from "../worker/curriculum";
describe("initial curriculum", () => {
  it("contains 15 ordered modules and 33 complete lessons", () => {
    expect(modules).toHaveLength(15);
    expect(modules.flatMap((m) => m.lessons)).toHaveLength(33);
  });
  it("does not repeat IDs and each question has a valid answer and explanation", () => {
    const lessons = modules.flatMap((m) => m.lessons);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    for (const l of lessons) {
      expect(l.sections.length).toBeGreaterThan(0);
      expect(l.question.options).toHaveLength(4);
      expect(l.question.correct).toBeGreaterThanOrEqual(0);
      expect(l.question.correct).toBeLessThan(4);
      expect(l.question.explanation.length).toBeGreaterThan(40);
    }
    expect(glossary.length).toBeGreaterThan(20);
  });
});
