# Workflow Rules

- **Standard Change Workflow:**
  1. For every change or new section, first create or update the implementation plan (`implementation_plan.md`).
  2. Wait for the user's feedback and explicit approval before executing.
  3. Execute the approved implementation plan.
  4. Verify the changes locally and commit them to local Git repository.
  5. **CRITICAL:** Do NOT push commits to the remote repository (e.g. `git push`) until the user explicitly requests it.
- **Communication:**
  - Always ask the user for clarification if you have any doubts.
- **Dev Server Cache Clearing:**
  - **CRITICAL:** After making any code changes, always restart the dev server and clear the Next.js cache directory to avoid static chunk 404 cache errors:
    `cmd.exe /c "rmdir /s /q .next 2>nul & echo Cache cleared & npm.cmd run dev -- -p 3001"`
