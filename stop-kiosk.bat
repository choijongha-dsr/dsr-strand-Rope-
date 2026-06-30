@echo off
echo 키오스크 종료 중...
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo 완료!
timeout /t 2 /nobreak >nul
