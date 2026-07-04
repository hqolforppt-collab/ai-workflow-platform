import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { runPipeline } from "../src/stages.js"
import { streamModelCall } from "../src/model.js"

const here = dirname(fileURLToPath(import.meta.url))
const REPO = join(here, "..", "..", "..")

test("runs the 6 stages in dependency order and writes a file each", async () => {
  const outDir = ".tmp-stages-" + process.pid
  const order = []
  const results = await runPipeline({
    root: REPO, story: "test story", slug: "t", level: "L6", tier: "medium", outDir,
    runStage: async (stageDef) => { order.push(stageDef.id); return `# ${stageDef.id}\n` },
  })
  assert.deepEqual(order, ["stage-01", "stage-02", "stage-03", "stage-04", "stage-05", "stage-06"])
  assert.equal(results.length, 6)
  rmSync(join(REPO, outDir), { recursive: true, force: true })
})

test("--resume-from skips completed earlier stages", async () => {
  const outDir = ".tmp-resume-" + process.pid
  const full = join(REPO, outDir, "t")
  mkdirSync(full, { recursive: true })
  for (const f of ["01-initialized.yaml", "02-in-progress.yaml", "03-generating-app.yaml"]) {
    writeFileSync(join(full, f), "# preexisting\n")
  }
  const ran = []
  await runPipeline({
    root: REPO, story: "s", slug: "t", level: "L6", tier: "medium", outDir, resumeFrom: "stage-04",
    runStage: async (s) => { ran.push(s.id); return "# regenerated\n" },
  })
  assert.deepEqual(ran, ["stage-04", "stage-05", "stage-06"])
  rmSync(join(REPO, outDir), { recursive: true, force: true })
})

test("mock provider returns canned per-stage content from AWP_MOCK_DIR", async () => {
  const mockDir = join(REPO, "examples", "workflow-builder", "login-registration")
  process.env.AWP_MOCK_DIR = mockDir
  let content = ""
  for await (const ev of streamModelCall({
    systemPrompt: "s", userPrompt: "u",
    config: { provider: "mock", apiKeyEnv: "NONE" }, tier: "medium",
    stageFile: "01-initialized.yaml",
  })) {
    content = ev.content
    assert.equal(ev.error, null)
  }
  assert.ok(content.includes("project:"), "mock returned the fixture stage file")
  delete process.env.AWP_MOCK_DIR
})
