@echo off
title DSR Strand Kiosk

echo Starting server...
start /min powershell -NoProfile -WindowStyle Minimized -File "%~dp0start-server.ps1"

echo Waiting...
timeout /t 4 /nobreak >nul

echo Opening browser...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk http://localhost:3000 --no-first-run --disable-infobars --disable-session-crashed-bubble --disable-extensions --noerrdialogs
