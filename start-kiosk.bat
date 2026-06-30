@echo off
title DSR 연선공정표 키오스크

echo [1/2] Node.js 서버 시작 중...
start /min cmd /k "cd /d %~dp0 && node server.js"

echo [2/2] 잠시 대기...
timeout /t 3 /nobreak >nul

echo [3/3] 키오스크 브라우저 시작...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --kiosk http://localhost:3000 ^
  --no-first-run ^
  --disable-infobars ^
  --disable-session-crashed-bubble ^
  --disable-extensions ^
  --disable-translate ^
  --noerrdialogs ^
  --touch-events=enabled ^
  --enable-touchpad-three-finger-click ^
  --overscroll-history-navigation=0

echo 완료!
