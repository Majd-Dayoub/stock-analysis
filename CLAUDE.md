# Stock Analysis AI Guide

This file is the main AI access point for the stock-analysis project. Read it before making changes, then use the docs and task files to keep work coordinated.

## Project Overview

Stock Analysis is a stock portfolio tracker. The MVP focuses on portfolios, buy/sell transactions, ticker lookup, current or delayed prices, and portfolio charts for `1d`, `5d`, `1m`, `6m`, `1y`, and `5y`.

The project must remain 100% free to develop. Supabase is used for auth and database, FastAPI for the backend, and Next.js for the frontend.

## Core Docs

- `docs/PRD.md`: product purpose, user goals, MVP scope, and success criteria.
- `docs/ARCHITECTURE.md`: technical stack, current backend state, Supabase schema, market data direction, and implementation boundaries.
- `tasks/current_task.md`: active task record.
- `tasks/archive/`: completed or replaced task records.

## Agent Workflow

Four agents may contribute to a task. The workflow is flexible: fill useful sections, skip sections that do not apply, and let the next agent continue even when an earlier section is empty. The task file should preserve what happened, not enforce ceremony.

### Research Agent

Purpose: gather context before planning or implementation.

Typical responsibilities:
- Inspect relevant files and docs.
- Record current behavior and constraints.
- Note open questions, risks, useful references, and repo facts.
- Avoid implementation unless the user explicitly asks for direct execution.

### Plan Agent

Purpose: turn the task into a practical implementation direction.

Typical responsibilities:
- Convert research into a concise plan.
- Identify files, interfaces, data flow, and likely edge cases.
- Keep the plan scoped to the user's request.
- Note assumptions when the user has not specified a preference.

### Implement Agent

Purpose: make the requested changes.

Typical responsibilities:
- Follow the latest task plan when one exists.
- Keep edits focused and consistent with the project's existing patterns.
- Update docs or task notes when implementation changes the plan.
- Avoid unrelated refactors.

### Test Agent

Purpose: verify the result.

Typical responsibilities:
- Run relevant checks, tests, or manual verification.
- Record what passed, what failed, and what was not run.
- Note follow-up work separately from the completed task.

## Task Lifecycle

Use `tasks/current_task.md` for the active task. It should include:
- Task summary
- Current status
- Research notes
- Plan notes
- Implementation notes
- Test notes
- Open questions

Sections may be left blank or marked as skipped when they do not apply.

## "next task" Instruction

When the user says `next task`:

1. Archive the existing `tasks/current_task.md`.
2. Save it under `tasks/archive/` with a date-prefixed slug, for example:
   - `tasks/archive/2026-04-26-ai-agent-docs-setup.md`
3. Create a fresh `tasks/current_task.md` from the standard template.
4. Treat the user's next request as the new active task.

If the current task has no meaningful content yet, it may still be archived with a clear title such as `empty-task`.

## Working Principles

- Keep the PRD product-focused.
- Keep technical decisions in the architecture doc.
- Keep all development free for the project owner.
- Prefer simple, replaceable integrations for market data.
- Record uncertainty clearly instead of burying it in implementation.
