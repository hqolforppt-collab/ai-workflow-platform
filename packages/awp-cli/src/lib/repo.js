import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve, dirname } from "node:path"
import YAML from "yaml"

/** Walk upward from cwd to find the AWP repository root (marked by .ai/constitution.md). */
export function findRepoRoot(start = process.cwd()) {
  let dir = resolve(start)
  for (;;) {
    if (existsSync(join(dir, ".ai", "constitution.md"))) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export function requireRepoRoot() {
  const root = findRepoRoot()
  if (!root) {
    throw new Error(
      "not inside an AWP repository (no .ai/constitution.md found). Run `awp init` to scaffold one.",
    )
  }
  return root
}

export function readYaml(path) {
  return YAML.parse(readFileSync(path, "utf8"))
}

export function tryReadYaml(path) {
  try {
    return readYaml(path)
  } catch {
    return null
  }
}

/** Recursively list files under dir matching a predicate. */
export function listFiles(dir, predicate = () => true, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) listFiles(full, predicate, acc)
    else if (predicate(full)) acc.push(full)
  }
  return acc
}

export function fileExists(root, rel) {
  return existsSync(join(root, rel))
}
