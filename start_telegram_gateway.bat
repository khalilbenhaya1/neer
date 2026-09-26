@echo off
set /p TOKEN="Enter Telegram Bot Token: "
set /p OWNER="Enter Owner ID: "
echo Starting Telegram Gateway...
cd %~dp0\scripts
python telegram_gateway.py --token "%TOKEN%" --owner "%OWNER%"
pause
