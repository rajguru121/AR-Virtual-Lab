@echo off
title VirtuLab Local Server
echo.
echo  Starting VirtuLab server...
echo  Your browser will open automatically.
echo.

:: Try Python 3 first, then Python
python start_server.py 2>nul
if %errorlevel% neq 0 (
    python3 start_server.py 2>nul
)
if %errorlevel% neq 0 (
    echo.
    echo  Python not found. Please install Python from https://python.org
    echo  Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
)
