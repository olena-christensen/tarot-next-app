<!-- CLAUDE: First read .claude/features/README.md for how to work with this file -->

# Second computer setup

## Status

Started 2026-10-17. Repository side done; Lena's husband sets up his computer from the shared setup page.

## Goal

Lena's husband works on the games from his own computer and Claude account with the same rules as Lena, and with far fewer permission prompts on both machines. His changes reach Lena as pull requests on GitHub.

## Files

- `.claude/settings.json` — shared permission rules (allow and deny)
- `.claude/project-instructions.md` — the Claude app project instructions both of them paste
- `CLAUDE.md` — General: two people, pull requests, which settings file is shared

## To Do

- [ ] Lena adds her husband as a collaborator on the GitHub repository
- [ ] Lena pastes `.claude/project-instructions.md` into her own project instructions (replacing the old text)
- [ ] Her husband follows the setup page

## In Progress


## Done

- [x] Shared permission rules moved into `.claude/settings.json` with paths that work on any machine; git write commands, deploys and localhost:3000 denied there
- [x] Project instructions written once in the repository
- [x] `CLAUDE.md` updated for two people and pull requests

## Notes

- Personal Claude plans cannot share a project between two accounts (only Team and Enterprise can), so each of them keeps their own project and pastes the same instructions from the repository.
- `.claude/settings.local.json` is ignored by git, so its approvals never reached any other machine. A deny rule in the shared file wins over an allow rule in a local file.
- `/feature` runs the `feature-dev` plugin, which must be installed in Claude Code on each machine.
