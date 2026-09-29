@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=py"
) else (
    where python >nul 2>nul
    if not errorlevel 1 (
        set "PYTHON_CMD=python"
    ) else (
        echo Python was not found. Install Python or add it to PATH.
        pause
        exit /b 1
    )
)

echo ARCHVIZ Prompt Studio
echo Open http://127.0.0.1:8080 in your browser.
echo Close this window or press Ctrl+C to stop the server.
echo.
"%PYTHON_CMD%" -m http.server 8080 --bind 127.0.0.1
echo.
echo Server stopped.
pause
