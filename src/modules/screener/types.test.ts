import { describe, it, expect } from "vitest";
import { deriveRecommendation } from "./types";

describe("deriveRecommendation", () => {
  it("returns STRONG when total >= 22 and confidence is not LOW", () => {
    expect(deriveRecommendation({ skillsFit: 8, expFit: 8, cultureFit: 6 }, "HIGH")).toBe("STRONG");
  });

  it("returns CONSIDER when total is between 14 and 21", () => {
    expect(deriveRecommendation({ skillsFit: 5, expFit: 5, cultureFit: 5 }, "HIGH")).toBe("CONSIDER");
  });

  it("returns WEAK when total < 14", () => {
    expect(deriveRecommendation({ skillsFit: 2, expFit: 2, cultureFit: 2 }, "MEDIUM")).toBe("WEAK");
  });

  it("routes to CONSIDER whenever confidence is LOW, even with a STRONG-range total", () => {
    expect(deriveRecommendation({ skillsFit: 10, expFit: 10, cultureFit: 10 }, "LOW")).toBe("CONSIDER");
  });

  it("routes to CONSIDER whenever confidence is LOW, even with a WEAK-range total", () => {
    expect(deriveRecommendation({ skillsFit: 0, expFit: 0, cultureFit: 0 }, "LOW")).toBe("CONSIDER");
  });

  it("is deterministic: same input always yields the same band", () => {
    const scores = { skillsFit: 7, expFit: 8, cultureFit: 7 };
    const results = Array.from({ length: 5 }, () => deriveRecommendation(scores, "HIGH"));
    expect(new Set(results).size).toBe(1);
  });

  it("treats the STRONG/CONSIDER boundary correctly (total 21 vs 22)", () => {
    expect(deriveRecommendation({ skillsFit: 7, expFit: 7, cultureFit: 7 }, "HIGH")).toBe("CONSIDER"); // 21
    expect(deriveRecommendation({ skillsFit: 8, expFit: 7, cultureFit: 7 }, "HIGH")).toBe("STRONG"); // 22
  });

  it("treats the CONSIDER/WEAK boundary correctly (total 13 vs 14)", () => {
    expect(deriveRecommendation({ skillsFit: 4, expFit: 5, cultureFit: 4 }, "HIGH")).toBe("WEAK"); // 13
    expect(deriveRecommendation({ skillsFit: 5, expFit: 5, cultureFit: 4 }, "HIGH")).toBe("CONSIDER"); // 14
  });
});
