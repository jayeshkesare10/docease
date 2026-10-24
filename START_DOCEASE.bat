@echo off
title DOCEASE - A Documentation Guide Platform
cd /d "%~dp0"

echo ==========================================================
echo        DOCEASE - A Documentation Guide Platform
echo ==========================================================
echo.
echo Starting Backend Server on http://localhost:5000 ...
echo Starting Frontend Client on http://localhost:5173 ...
echo.
echo Opening browser in a few seconds...
echo.
echo Press Ctrl+C in this window anytime to stop DOCEASE.
echo ==========================================================
echo.

:: Automatically open browser once servers are ready
start /b "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"

:: Run both Backend and Frontend concurrently
call npm.cmd run dev

pause
