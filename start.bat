@echo off
echo ================================================
echo   TaskFlow - Team Task Management App
echo ================================================
echo.

:: Check Node.js
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed!
  echo Please install it from https://nodejs.org
  pause
  exit /b 1
)

echo [1/3] Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
cd ..

echo.
echo [3/3] Starting servers...
echo.
echo  Backend  -> http://localhost:5000
echo  Frontend -> http://localhost:3000
echo.
echo  Press Ctrl+C in each window to stop.
echo.

start "TaskFlow Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "TaskFlow Frontend" cmd /k "cd frontend && npm start"

echo Both servers are starting...
echo Open http://localhost:3000 in your browser.
pause
