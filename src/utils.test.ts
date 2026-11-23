import { describe, expect, it } from "vitest";
import { formatAccessCode, greeting, theoreticalSpeed } from "./utils";

describe("formatAccessCode", () => {
  it("formats numeric codes and removes extra characters", () => {
    expect(formatAccessCode("4829-1736-9051")).toBe("4829  1736  9051");
    expect(formatAccessCode("a123456789012345")).toBe("1234  5678  9012");
  });
});
describe("greeting", () => {
  it("adapts the message to the hour", () => {
    expect(greeting("João", 6)).toContain("Bom dia, João");
    expect(greeting("João", 15)).toContain("Boa tarde");
    expect(greeting("João", 22)).toContain("Boa noite");
    expect(greeting("João", 2)).toContain("Boa madrugada");
  });
});
describe("theoreticalSpeed", () => {
  it("uses gear and final drive ratios and blocks invalid input", () => {
    expect(theoreticalSpeed(3000, 1, 4, 0.6)).toBeCloseTo(84.823, 2);
    expect(theoreticalSpeed(3000, 0, 4, 0.6)).toBe(0);
    expect(theoreticalSpeed(-1000, 2, 4, 0.6)).toBe(0);
  });
});
