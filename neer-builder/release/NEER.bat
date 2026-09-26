@echo off
setlocal

:: NEER Launcher - لتشغيل NEER مباشرةً من المصدر
:: يجب أن يكون هذا الملف في: neer-builder\release\NEER.bat
:: مجلد neer الرئيسي يكون في: ..\..\ من هنا

set "NEER_ROOT=%~dp0..\.."
set "ENTRY=%NEER_ROOT%\neer.mjs"

if not exist "%ENTRY%" (
    echo ERROR: لم يتم العثور على neer.mjs
    echo المسار المتوقع: %ENTRY%
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js غير مثبت. قم بتنزيله من https://nodejs.org
    pause
    exit /b 1
)

cd /d "%NEER_ROOT%"
echo Starting NEER from %NEER_ROOT%...
node "%ENTRY%" %*

if errorlevel 1 (
    echo.
    echo انتهى NEER بخطأ. اضغط أي مفتاح للإغلاق.
    pause
)
endlocal
