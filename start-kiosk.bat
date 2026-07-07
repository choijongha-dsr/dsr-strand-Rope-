@echo off
chcp 65001 >nul
title DSR 연선공정표 키오스크

echo [1/3] Node.js 서버 시작 중...
start /min cmd /c "chcp 65001 >nul && cd /d %~dp0 && set EXCEL_PATH=\\10.10.12.61\공정 공유폴더\공정폴더\2026공정표.xlsx && node server.js"

echo [2/3] 잠시 대기...
timeout /t 3 /nobreak >nul

echo [3/3] 브라우저 시작...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk http://localhost:3000 --no-first-run --disable-infobars --disable-session-crashed-bubble --disable-extensions --noerrdialogs

echo 완료!
