#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Starting PUBLIC DOOM Local Server..."
if command -v node >/dev/null 2>&1; then
  node server.js
elif command -v python3 >/dev/null 2>&1; then
  echo "Node.js not found, falling back to python3 http.server on port 3000..."
  python3 -m http.server 3000
else
  echo "Error: Neither Node.js nor Python3 was found in PATH."
  read -p "Press enter to exit..."
fi
