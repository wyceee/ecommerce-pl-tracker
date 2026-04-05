#!/usr/bin/env bash
set -euo pipefail

URL="http://127.0.0.1:3001/"
MAX_WAIT_SECONDS=30
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      URL="${2:-}"
      shift 2
      ;;
    --max-wait)
      MAX_WAIT_SECONDS="${2:-30}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run OK"
  echo "Project root: $PROJECT_ROOT"
  echo "Will run: npm start"
  echo "Will open: $URL"
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found in PATH. Install Node.js first." >&2
  exit 1
fi

cd "$PROJECT_ROOT"
npm start >/tmp/ecommerce-pl-tracker.log 2>&1 &
SERVER_PID=$!

declare -i elapsed=0
while (( elapsed < MAX_WAIT_SECONDS * 2 )); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    if command -v open >/dev/null 2>&1; then
      open "$URL"
    else
      echo "Server is up at $URL"
    fi
    echo "Server is up. Opened $URL"
    exit 0
  fi
  sleep 0.5
  ((elapsed+=1))
done

echo "Server did not respond within ${MAX_WAIT_SECONDS}s." >&2
echo "Server PID: $SERVER_PID" >&2
echo "Check logs at /tmp/ecommerce-pl-tracker.log" >&2
exit 1

