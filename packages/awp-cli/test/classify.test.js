/**
 * classify.test.js — deterministic classification engine.
 * Uses an in-memory domain map (no repo scan) for hermetic tests.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { classifyStory, normalize, stem } from "../src/classify.js"

// Minimal domain graph: login (functional) implies session + password;
// email (functional); security (baseline cross-cutting).
function domains() {
  const m = new Map()
  m.set("security", { id: "security", type: "cross-cutting", triggers: ["ANY-USER-FACING"] })
  m.set("login", { id: "login", type: "functional", triggers: [{ term: "login", synonyms: ["sign in", "signin"] }], implies: ["session", "password"] })
  m.set("session", { id: "session", type: "cross-cutting", triggers: ["session"], implies: ["security"] })
  m.set("password", { id: "password", type: "cross-cutting", triggers: ["password"] })
  m.set("email", { id: "email", type: "functional", triggers: [{ term: "email", synonyms: ["notify"] }] })
  return m
}

test("normalize + stem basics", () => {
  assert.equal(normalize("Sign-In, please!"), "sign in please")
  assert.equal(stem("registering"), "register")
  assert.equal(stem("policies"), "policy")
})

test("explicit match + implication fixpoint + baseline", () => {
  const r = classifyStory(null, "user login flow", { domains: domains() })
  const ids = new Set([...r.explicit, ...r.hidden].map((d) => d.id))
  assert.ok(ids.has("login"))       // explicit
  assert.ok(ids.has("session"))     // implied by login
  assert.ok(ids.has("password"))    // implied by login
  assert.ok(ids.has("security"))    // baseline
  assert.equal(r.matchedZero, false)
})

test("synonym match works without exact keyword", () => {
  const r = classifyStory(null, "let users sign in", { domains: domains() })
  assert.ok(r.explicit.some((d) => d.id === "login"))
})

test("negation marks a domain not-applicable", () => {
  const r = classifyStory(null, "login without email", { domains: domains() })
  assert.ok(r.notApplicable.some((d) => d.id === "email"))
  assert.ok(!r.explicit.some((d) => d.id === "email"))
})

test("passwordless negates password", () => {
  const r = classifyStory(null, "passwordless login", { domains: domains() })
  assert.ok(r.notApplicable.some((d) => d.id === "password"))
})

test("zero functional match flags matchedZero but still gets baseline", () => {
  const r = classifyStory(null, "quarterly widget synergy", { domains: domains() })
  assert.equal(r.matchedZero, true)
  assert.ok([...r.hidden].some((d) => d.id === "security")) // baseline still applied
})
