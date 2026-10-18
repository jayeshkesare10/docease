@echo off
title Stop DOCEASE Servers
echo Stopping any running DOCEASE servers on ports 5000 and 5173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo All DOCEASE local services have been stopped.
echo You can run START_DOCEASE.bat whenever you want to start again.
echo.
pause
