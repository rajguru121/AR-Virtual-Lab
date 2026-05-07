@echo off
title VirtuLab – Full Stack Server
echo.
echo  ========================================
echo   VirtuLab – Starting Full Stack Server
echo  ========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo  [ERROR] Python not found!
        echo  Install Python from https://python.org
        echo  Make sure "Add Python to PATH" is checked.
        echo.
        pause
        exit /b 1
    )
)

:: Install dependencies
echo  [1/2] Installing dependencies...
pip install -r requirements.txt --quiet 2>nul
if %errorlevel% neq 0 (
    pip3 install -r requirements.txt --quiet 2>nul
)

:: Start Flask server
echo  [2/2] Starting server...
echo.
python backend/app.py
if %errorlevel% neq 0 (
    python3 backend/app.py
)

pause
