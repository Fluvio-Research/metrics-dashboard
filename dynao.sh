#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
PLUGIN_DIR="$REPO_ROOT/Plugins/haohanyang-dynamodb-datasource-dev"
DIST_DIR="$PLUGIN_DIR/dist"
TARGET_DIR="$REPO_ROOT/grafana-dev/data/plugins/fluvio-connect-dynamodb"
DEV_SCRIPT="$REPO_ROOT/dev.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--no-restart]

Builds the DynamoDB plugin, copies the dist bundle into Grafana's data directory,
and restarts the dev Grafana instance (unless --no-restart is supplied).
EOF
}

RESTART_GRAFANA=true
for arg in "$@"; do
  case "$arg" in
    --no-restart)
      RESTART_GRAFANA=false
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

if [[ ! -d "$PLUGIN_DIR" ]]; then
  echo "Plugin directory not found: $PLUGIN_DIR" >&2
  exit 1
fi

log "Building DynamoDB plugin"
pushd "$PLUGIN_DIR" >/dev/null

if [[ ! -d node_modules ]]; then
  log "node_modules missing – running npm install"
  npm install
fi

npm run build
popd >/dev/null

log "Deploying build artifacts to Grafana data directory"
rm -rf "$TARGET_DIR"
mkdir -p "$(dirname "$TARGET_DIR")"
cp -R "$DIST_DIR" "$TARGET_DIR"

if $RESTART_GRAFANA; then
  if [[ ! -x "$DEV_SCRIPT" ]]; then
    echo "Unable to restart Grafana – dev.sh not found/executable at $DEV_SCRIPT" >&2
    exit 1
  fi
  log "Restarting Grafana"
  "$DEV_SCRIPT" restart
else
  log "Skipped Grafana restart (use ./dev.sh restart when ready)"
fi

log "DynamoDB plugin build & deploy complete"
