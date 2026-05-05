#!/bin/bash
echo "================================================"
echo "  TaskFlow - Team Task Management App"
echo "================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed!"
  echo "Please install it from https://nodejs.org"
  exit 1
fi

echo "[1/3] Installing backend dependencies..."
cd backend && npm install && cd ..

echo ""
echo "[2/3] Installing frontend dependencies..."
cd frontend && npm install --legacy-peer-deps && cd ..

echo ""
echo "[3/3] Starting servers..."
echo ""
echo "  Backend  -> http://localhost:5000"
echo "  Frontend -> http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop all servers."
echo ""

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
cd frontend && npm start &
FRONTEND_PID=$!
cd ..

echo "Both servers running. Open http://localhost:3000"
echo "PIDs: backend=$BACKEND_PID, frontend=$FRONTEND_PID"

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
