@echo off
setlocal
where.exe node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js or use Python: python -m http.server 8766 --bind 127.0.0.1
  pause
  exit /b 1
)
node.exe "%~dpn0.cjs"
if errorlevel 1 pause
