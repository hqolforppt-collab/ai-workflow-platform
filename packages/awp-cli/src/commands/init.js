import { existsSync, mkdirSync, cpSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { findRepoRoot } from "../lib/repo.js"

/**
 * awp init [target-dir] — scaffold the AWP repository OS into a target repo.
 *
 * If run from inside an AWP repo (e.g. a clone of ai-workflow-platform), the
 * OS directories are copied from that source. The target gets:
 * .ai/ .commands/ .skills/ .memory/ .governance/ .templates/ .agents/ .schemas/
 */
const OS_DIRS = [".ai", ".commands", ".skills", ".memory", ".governance", ".templates", ".agents", ".schemas", ".workflows"]

export async function init(flags) {
  const target = resolve(flags._[0] || ".")
  const source = findRepoRoot(import.meta.dirname || process.cwd()) || findRepoRoot()

  if (existsSync(join(target, ".ai", "constitution.md"))) {
    console.log(`awp init: ${target} is already an AWP repository (found .ai/constitution.md). Nothing to do.`)
    return 0
  }

  if (!source) {
    console.error(
      "awp init: could not locate an AWP source repository to scaffold from.\n" +
        "Clone https://github.com/hqolforppt-collab/ai-workflow-platform and run `awp init <target>` from inside it.",
    )
    return 1
  }

  mkdirSync(target, { recursive: true })

  let copied = 0
  for (const dir of OS_DIRS) {
    const src = join(source, dir)
    if (!existsSync(src)) continue
    cpSync(src, join(target, dir), { recursive: true })
    copied++
    console.log(`  scaffolded ${dir}/`)
  }

  if (copied === 0) {
    console.error("awp init: source repository contained no OS directories to copy.")
    return 1
  }

  const marker = join(target, ".ai", "AWP_INIT.md")
  writeFileSync(
    marker,
    [
      "# AWP repository initialized",
      "",
      `- scaffolded by: awp init v0.1`,
      `- source: ${source}`,
      `- date: ${new Date().toISOString()}`,
      "",
      "Next steps:",
      "1. Open this repository in your AI tool of choice (Claude Code, Cursor, OpenCode, Copilot).",
      "2. Run `/awp-init` to boot the repository OS.",
      "3. Run `awp validate` to confirm the structure is healthy.",
      "",
    ].join("\n"),
  )

  console.log(`\nawp init: scaffolded ${copied} OS directories into ${target}`)
  console.log("Run `awp validate` inside the target to verify.")
  return 0
}
