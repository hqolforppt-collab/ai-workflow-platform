import { discover } from "./commands/discover.js"
import { validate } from "./commands/validate.js"
import { build } from "./commands/build.js"
import { init } from "./commands/init.js"
import { flowableConvert, flowableDeploy, flowableValidate } from "./commands/flowable.js"
import { kb } from "./commands/kb.js"
import { classifyCmd } from "./commands/classify.js"

const VERSION = "0.3.0"

const HELP = `awp ${VERSION} — AI Workflow Platform CLI

Usage:
  awp discover [--model=<type>] [--skills-only] [--depth=quick|full] [--output=text|json|yaml]
  awp validate [--only=spec,gates,adapters,memory,trace,secrets] [--kb]
  awp validate <blueprint-dir|blueprint.yaml> [--story=<text>] [--level=L1..L6]
  awp build <story> [--level=L1..L6] [--out=<path>] [--execute] [--staged]
                    [--model-tier=small|medium|large] [--resume-from=stage-0N]
                    [--no-validate] [--check] [--aggregate]
  awp classify <story> [--json]
  awp review <blueprint-dir> [--out=<path>]
  awp kb validate | build-index [--check] | stats
  awp flowable convert <blueprint-dir> [--out=<path>]
  awp flowable deploy   <blueprint-dir>
  awp flowable validate <blueprint-dir>
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
             + blueprint schema) for a user story and optionally execute it
             against a configured model (--execute). Supports staged 6-file
             output (--staged), model tier routing (--model-tier), and
             partial recovery (--resume-from).
  flowable   Convert, validate, and deploy blueprint output to a Flowable
             engine via REST API.
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

  // Handle subcommands: kb <subcommand> ...
  if (cmd === "kb") {
    const [sub, ...subRest] = rest
    return kb(sub, parseFlags(subRest))
  }

  // Handle subcommands: schema <subcommand> ...
  if (cmd === "schema") {
    const [sub, ...subRest] = rest
    return (await import("./commands/schema.js")).schema(sub, parseFlags(subRest))
  }

  // Handle subcommands: flowable <subcommand> ...
  if (cmd === "flowable") {
    const [sub, ...subRest] = rest
    const flags = parseFlags(subRest)
    switch (sub) {
      case "convert":
        return flowableConvert(flags)
      case "deploy":
        return flowableDeploy(flags)
      case "validate":
        return flowableValidate(flags)
      default:
        console.error(`awp flowable: unknown subcommand "${sub}". Usage: awp flowable convert|deploy|validate <blueprint-dir>`)
        return 1
    }
  }

  const flags = parseFlags(rest)

  switch (cmd) {
    case "discover":
      return discover(flags)
    case "validate":
      return validate(flags)
    case "build":
      return build(flags)
    case "classify":
      return classifyCmd(flags)
    case "review":
      return (await import("./commands/review.js")).review(flags)
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
