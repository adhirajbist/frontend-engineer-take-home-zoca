import { describe, expect, it } from "vitest";
import { continueLabel } from "./continueLabel";

describe("continueLabel", () => {
  it("names the campaign", () => {
    expect(continueLabel("Spring refresh", "draft")).toEqual({
      text: "Continue: Spring refresh",
      status: null,
    });
  });

  it("adds the status once launched", () => {
    expect(continueLabel("Spring refresh", "scheduled").status).toBe("Scheduled");
    expect(continueLabel("Spring refresh", "sent").status).toBe("Launched");
  });
});
