import { test } from "node:test"
import assert from "node:assert/strict"
import { detectTier } from "../src/model.js"

const tiers = {
  default_tier: "medium",
  tiers: [
    { id: "small", match: ["gpt-3.5*", "claude-haiku*"] },
    { id: "medium", match: ["claude-sonnet*", "gpt-4o-mini"] },
    { id: "large", match: ["claude-opus*", "claude-fable*"] },
  ],
}

test("an explicit override wins over the glob match", () => {
  assert.equal(detectTier("claude-opus-4", tiers, "small"), "small")
})

test("resolves tier by glob match on the model id", () => {
  assert.equal(detectTier("claude-sonnet-5", tiers, null), "medium")
  assert.equal(detectTier("claude-haiku-4-5", tiers, null), "small")
  assert.equal(detectTier("claude-fable-5", tiers, null), "large")
})

test("falls back to default_tier when nothing matches", () => {
  assert.equal(detectTier("some-unknown-model", tiers, null), "medium")
})
