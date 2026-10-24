#!/bin/bash
# Worktree lifecycle for Paseo, Orca, Conductor and T3 Code: setup and run.
# The orchestrator configs next to this file call it; `bun run agents:sync` links them to the repo root.
set -e

# ─── Tool detection ──────────────────────────────────
# Only the source checkout path is needed: it holds the .env to copy.
if [ -n "${PASEO_SOURCE_CHECKOUT_PATH:-}" ]; then
  TOOL="paseo"
  SOURCE_PATH="$PASEO_SOURCE_CHECKOUT_PATH"
elif [ -n "${ORCA_ROOT_PATH:-}" ]; then
  TOOL="orca"
  SOURCE_PATH="$ORCA_ROOT_PATH"
elif [ -n "${CONDUCTOR_ROOT_PATH:-}" ]; then
  TOOL="conductor"
  SOURCE_PATH="$CONDUCTOR_ROOT_PATH"
elif [ -n "${T3CODE_PROJECT_ROOT:-}" ]; then
  TOOL="t3code"
  SOURCE_PATH="$T3CODE_PROJECT_ROOT"
else
  TOOL="manual"
  SOURCE_PATH=""
fi

# ─── Helpers ─────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
error() { echo -e "${RED}x${NC} $1"; }
success() { echo -e "${GREEN}v${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

main_worktree_path() {
  git worktree list --porcelain 2>/dev/null | awk '/^worktree /{path=$2} /^branch refs\/heads\/main$/{print path; exit}'
}

# ─── Setup ───────────────────────────────────────────
setup_main() {
  command -v bun >/dev/null 2>&1 || { error "bun not found"; exit 1; }

  [ -n "$SOURCE_PATH" ] || SOURCE_PATH=$(main_worktree_path)
  echo "Setting up $(basename "$PWD") ($TOOL, .env from ${SOURCE_PATH:-nowhere})"

  # 1. Environment
  if [ -f .env ]; then
    success ".env already present"
  elif [ -n "$SOURCE_PATH" ] && [ "$SOURCE_PATH" != "$PWD" ] && [ -f "$SOURCE_PATH/.env" ]; then
    cp "$SOURCE_PATH/.env" .env
    success "Copied .env"
  else
    cp .env.example .env
    warn "No .env in the source checkout: copied .env.example, fill it in"
  fi

  # 2. Dependencies and agent links
  bun install < /dev/null || { error "bun install failed"; exit 1; }
  bun run agents:sync < /dev/null || warn "agents:sync failed"

  # 3. Plans are local and git-ignored: share the source checkout's folder
  if [ -n "$SOURCE_PATH" ] && [ "$SOURCE_PATH" != "$PWD" ] && [ -d "$SOURCE_PATH/.agents/plans" ] && [ ! -L .agents/plans ]; then
    rm -rf .agents/plans
    ln -s "$SOURCE_PATH/.agents/plans" .agents/plans
    success "Linked .agents/plans"
  fi

  # 4. State file
  cat > .agents/state.md <<EOF
# Workspace: $(basename "$PWD")

| Resource | Value |
| -------- | ----- |
| Tool | $TOOL |
| Web | <http://localhost:47190> |
| Daemon | <http://localhost:47191> |
| Data | \`~/.config/orbs-dev\` |

Dev ports are fixed, so only one worktree can run \`dev\` at a time.

Setup: $(date -Iseconds)
EOF

  # 5. Orca has no terminal config: open the dev terminal through its CLI
  if [ "$TOOL" = "orca" ] && command -v orca >/dev/null 2>&1; then
    orca terminal create --worktree current --title "dev" --command "./.agents/orchestrators/workspace.sh run" >/dev/null 2>&1 || warn "Failed to create the dev terminal"
  fi

  echo ""
  echo "Workspace ready. Run: ./.agents/orchestrators/workspace.sh run"
}

# ─── Run ─────────────────────────────────────────────
# Web and daemon together; Turbo starts the daemon with the web app.
run_main() {
  exec bun run dev:web
}

case "${1:-}" in
  setup) setup_main ;;
  run)   run_main ;;
  *)     error "Usage: $0 {setup|run}"; exit 1 ;;
esac
