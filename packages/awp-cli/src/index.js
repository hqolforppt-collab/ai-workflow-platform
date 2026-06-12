import { discover } from "./commands/discover.js"
import { validate } from "./commands/validate.js"
import { build } from "./commands/build.js"
import { init } from "./commands/init.js"

const VERSION = "0.1.0"

const HELP = `awp ${VERSION} — AI Workflow Platform CLI

Usage:
  awp discover [--model=<type>] [--skills-only] [--depth=quick|full] [--output=text|json|yaml]
  awp validate [--only=spec,gates,adapters,memory,trace,secrets]
  awp build <story> [--level=L1..L6] [--out=<path>]
  awp init [target-dir]
  awp --version | --help

Commands:
  discover   Scan the repository for registered/unregistered skills, templates,
             commands, agents, workflows, and models. Reports inventory counts
             and missing registry entries.
  validate   Run the full repository-OS validation suite: YAML schemas,
             governance gates, adapter drift, memory tiers, trace audit,
             and secret scan (Constitution C5).
  build      Assemble the /workflow-builder prompt (prompt.md + knowledge base
             + blueprint schema) for a user story and write it to a file so it
             can be piped into your configured model.
  init       Scaffold the AWP repository OS (.ai/.commands/.skills/.memory/
             .governance/.templates) into a target repo.
`

export async function main(argv) {
  const [cmd, ...rest] = argv

  if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(HELP)
    return 0
  }
  if (cmd === "--version" || cmd === "-v" || cmd === "version") {
    console.log(VERSION)
    return 0
  }

  const flags = parseFlags(rest)

  switch (cmd) {
    case "discover":
      return discover(flags)
    case "validate":
      return validate(flags)
    case "build":
      return build(flags)
    case "init":
      return init(flags)
    default:
      console.error(`awp: unknown command "${cmd}". Run "awp --help".`)
      return 1
  }
}

function parseFlags(args) {
  const flags = { _: [] }
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=")
      if (eq === -1) flags[arg.slice(2)] = true
      else flags[arg.slice(2, eq)] = arg.slice(eq + 1)
    } else {
      flags._.push(arg)
    }
  }
  return flags
}
