#!/usr/bin/env bash
set -euo pipefail

# startup - build and start the frontend webapp and optionally the backend
# Usage: ./startup [dev|preview|backend|stop]

echo "[startup] Initializing SatTracker startup script..."

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Auto-detect backend directory based on project file location
if [ -f "$ROOT_DIR/backend/TLE/SatTracker.Api.csproj" ]; then
  BACKEND_DIR="$ROOT_DIR/backend/TLE"
elif [ -f "$ROOT_DIR/backend/SatTracker.Api.csproj" ]; then
  BACKEND_DIR="$ROOT_DIR/backend"
else
  echo "[startup] ERROR: SatTracker.Api.csproj not found in backend directories."
  exit 1
fi

BACKEND_PID_FILE="$ROOT_DIR/.sat_tracker_backend.pid"
BACKEND_LOG="$ROOT_DIR/backend.log"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"

resolve_dotnet() {
  DOTNET_EXEC="dotnet"
  if command -v dotnet >/dev/null 2>&1; then
    DOTNET_EXEC=$(command -v dotnet)
  elif [ -f "/usr/local/share/dotnet/dotnet" ]; then
    DOTNET_EXEC="/usr/local/share/dotnet/dotnet"
  elif [ -f "/usr/local/bin/dotnet" ]; then
    DOTNET_EXEC="/usr/local/bin/dotnet"
  elif [ -f "/usr/bin/dotnet" ]; then
    DOTNET_EXEC="/usr/bin/dotnet"
  elif [ -f "/opt/homebrew/bin/dotnet" ]; then
    DOTNET_EXEC="/opt/homebrew/bin/dotnet"
  elif [ -f "/opt/homebrew/share/dotnet/dotnet" ]; then
    DOTNET_EXEC="/opt/homebrew/share/dotnet/dotnet"
  elif [ -f "$HOME/.dotnet/dotnet" ]; then
    DOTNET_EXEC="$HOME/.dotnet/dotnet"
  else
    echo "[startup] ERROR: 'dotnet' command not found. Please ensure .NET SDK is installed."
    echo "[startup] Debug: Current PATH is: $PATH"
    exit 1
  fi
}

load_backend_env() {
  if [ -f "$BACKEND_ENV_FILE" ]; then
    echo "[startup] Loading environment variables from $BACKEND_ENV_FILE"
    set -a
    source "$BACKEND_ENV_FILE"
    set +a
  fi
}

start_backend_bg() {
  if [ -f "$BACKEND_PID_FILE" ]; then
    pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
      echo "[startup] Stopping existing backend (pid=$pid) to ensure latest code runs..."
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  # Force kill any process holding port 5000
  local port_pids=$(lsof -ti:5000 2>/dev/null || echo "")
  if [ -n "$port_pids" ]; then
    echo "[startup] Killing stale backend processes on port 5000: $port_pids"
    kill $port_pids 2>/dev/null || true
  fi

  resolve_dotnet
  load_backend_env

  echo "[startup] Starting backend in background (logs: $BACKEND_LOG)"
  if [ ! -d "$BACKEND_DIR" ]; then
    echo "[startup] ERROR: Backend directory '$BACKEND_DIR' does not exist."
    exit 1
  fi
  cd "$BACKEND_DIR"
  if [ ! -f "SatTracker.Api.csproj" ]; then
    echo "[startup] ERROR: SatTracker.Api.csproj not found in '$BACKEND_DIR'."
    exit 1
  fi
  # Force URL to localhost:5000 to avoid port mismatch issues
  nohup "$DOTNET_EXEC" run --project SatTracker.Api.csproj --environment Development --urls "http://localhost:5000" > "$BACKEND_LOG" 2>&1 &
  backend_pid=$!
  echo "$backend_pid" > "$BACKEND_PID_FILE"
  echo "[startup] Backend started (pid=$backend_pid)"

  # Check if backend is still running after a brief pause
  sleep 2
  if ! kill -0 "$backend_pid" 2>/dev/null; then
    echo "[startup] ERROR: Backend process exited unexpectedly. Checking logs:"
    cat "$BACKEND_LOG"
    rm -f "$BACKEND_PID_FILE"
    exit 1
  fi

  cd "$ROOT_DIR"
}

stop_backend() {
  if [ -f "$BACKEND_PID_FILE" ]; then
    pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null || echo "")
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "[startup] Stopping backend (pid=$pid)"
      kill "$pid" || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        echo "[startup] Backend did not exit; killing"
        kill -9 "$pid" || true
      fi
    fi
    rm -f "$BACKEND_PID_FILE"
  else
    echo "[startup] No backend pid file found"
  fi
}

stop_all() {
  stop_backend

  # Kill any remaining backend on port 5000 (cleanup)
  local backend_pids=$(lsof -ti:5000 2>/dev/null || echo "")
  if [ -n "$backend_pids" ]; then
    echo "[startup] Killing remaining backend processes on port 5000: $backend_pids"
    kill $backend_pids 2>/dev/null || true
  fi

  # Kill frontend on port 5173
  local frontend_pids=$(lsof -ti:5173 2>/dev/null || echo "")
  if [ -n "$frontend_pids" ]; then
    echo "[startup] Stopping frontend on port 5173: $frontend_pids"
    kill $frontend_pids 2>/dev/null || true
  else
    echo "[startup] No frontend found on port 5173"
  fi
}

cleanup() {
  # If we started the backend in this script, stop it when this script exits.
  if [ -f "$BACKEND_PID_FILE" ]; then
    pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null || echo "")
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "[startup] Cleaning up backend (pid=$pid)"
      kill "$pid" || true
      rm -f "$BACKEND_PID_FILE"
    fi
  fi
}

trap cleanup EXIT

install_deps() {
  if ! command -v npm >/dev/null 2>&1; then
    echo "[startup] ERROR: npm is not installed or not in PATH."
    exit 1
  fi

  if [ -f package-lock.json ]; then
    echo "[startup] Installing dependencies with npm ci (attempt)"
    if npm ci; then
      return 0
    else
      echo "[startup] npm ci failed — falling back to npm install"
      npm install
      return 0
    fi
  else
    echo "[startup] Installing dependencies with npm install"
    npm install
  fi
}

case "${1:-preview}" in
  dev)
    start_backend_bg

    echo "[startup] Changing directory to $FRONTEND_DIR"
    if [ ! -d "$FRONTEND_DIR" ]; then
      echo "[startup] ERROR: Frontend directory '$FRONTEND_DIR' does not exist."
      exit 1
    fi
    cd "$FRONTEND_DIR"

    install_deps

    echo "[startup] Starting dev server (npm run dev)"
    npm run dev
    ;;
  preview)
    start_backend_bg

    echo "[startup] Changing directory to $FRONTEND_DIR"
    cd "$FRONTEND_DIR"

    install_deps

    echo "[startup] Building frontend"
    npm run build
    echo "[startup] Starting preview server (npm run preview)"
    npm run preview
    ;;
  backend)
    resolve_dotnet
    load_backend_env
    echo "[startup] Running backend in foreground"
    cd "$BACKEND_DIR"
    "$DOTNET_EXEC" run --project SatTracker.Api.csproj --environment Development --urls "http://localhost:5000"
    ;;
  stop)
    stop_all
    ;;
  help|--help|-h)
    echo "Usage: ./startup [dev|preview|backend|stop]"
    exit 0
    ;;
  *)
    echo "Unknown option: ${1:-}" >&2
    echo "Usage: ./startup [dev|preview|backend|stop]" >&2
    exit 2
    ;;
esac
