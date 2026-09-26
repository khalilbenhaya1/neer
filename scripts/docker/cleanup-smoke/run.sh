#!/usr/bin/env bash
set -euo pipefail

cd /repo

export NEER_STATE_DIR="/tmp/neer-test"
export NEER_CONFIG_PATH="${NEER_STATE_DIR}/neer.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${NEER_STATE_DIR}/credentials"
mkdir -p "${NEER_STATE_DIR}/agents/main/sessions"
echo '{}' >"${NEER_CONFIG_PATH}"
echo 'creds' >"${NEER_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${NEER_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm neer reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${NEER_CONFIG_PATH}"
test ! -d "${NEER_STATE_DIR}/credentials"
test ! -d "${NEER_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${NEER_STATE_DIR}/credentials"
echo '{}' >"${NEER_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm neer uninstall --state --yes --non-interactive

test ! -d "${NEER_STATE_DIR}"

echo "OK"
