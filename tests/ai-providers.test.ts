/**
 * Tests for the AI provider abstraction.
 *
 * Only tests the registry + env-key logic — actual provider calls
 * require real API keys and are covered by manual / live tests.
 */

import { describe, expect, it } from "vitest";
import {
  providers,
  geminiProvider,
  deepseekProvider,
  openaiProvider,
  getProvider,
  getFirstConfiguredProvider,
} from "@/lib/ai/providers";

describe("AI provider registry", () => {
  it("has all three providers", () => {
    expect(geminiProvider).toBeDefined();
    expect(deepseekProvider).toBeDefined();
    expect(openaiProvider).toBeDefined();
  });

  it("exposes at least 2 models per provider", () => {
    for (const p of Object.values(providers)) {
      expect(p.models.length).toBeGreaterThanOrEqual(2);
      expect(p.defaultModel).toBe(p.models[0]);
    }
  });

  it("Gemini default is 3.5 Flash", () => {
    expect(geminiProvider.defaultModel).toBe("gemini-3.5-flash");
  });

  it("OpenAI default is gpt-4.1-mini", () => {
    expect(openaiProvider.defaultModel).toBe("gpt-4.1-mini");
  });

  it("DeepSeek default is deepseek-chat", () => {
    expect(deepseekProvider.defaultModel).toBe("deepseek-chat");
  });

  it("getProvider returns gemini for unknown keys (safe fallback)", () => {
    expect(getProvider("gemini")).toBe(geminiProvider);
    expect(getProvider("unknown-key")).toBe(geminiProvider);
  });

  it("isConfigured returns false when env var is missing", () => {
    // The test env has no keys set
    expect(geminiProvider.isConfigured()).toBe(false);
    expect(deepseekProvider.isConfigured()).toBe(false);
    expect(openaiProvider.isConfigured()).toBe(false);
  });

  it("getFirstConfiguredProvider returns null when no env vars set", () => {
    expect(getFirstConfiguredProvider()).toBeNull();
  });
});
