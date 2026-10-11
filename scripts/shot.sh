#!/bin/sh
# Screenshot a page of the running dev server (npx vite --port 5173) with headless Chrome, via dev/app.html.
# Usage: scripts/shot.sh <route> <out.png> [width] [height] [mock]
#   width ≤ 500 renders a phone-width iframe. mock=1 points AI at scripts/mock-server.mjs (run it first).
ROUTE="$1"; OUT="$2"; W="${3:-1440}"; H="${4:-1000}"; MOCK="${5:-0}"
WIN=$W; [ "$W" -lt 500 ] && WIN=500
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size="$WIN,$H" --virtual-time-budget=5000 --screenshot="$OUT" \
  "http://localhost:5173/dev/app.html?w=$W&mock=$MOCK#/$ROUTE" >/dev/null 2>&1
echo "$OUT"
