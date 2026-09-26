@echo off
echo Starting Neer Gateway...
cd %~dp0
npm run gateway:dev
pause
