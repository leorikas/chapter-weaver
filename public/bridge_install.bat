@echo off
echo ========================================
echo   InLands Bridge - Установка зависимостей
echo ========================================
echo.

REM Проверяем наличие Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не найден!
    echo Установите Python с https://python.org/
    pause
    exit /b 1
)

echo [INFO] Python найден
echo.

echo [INFO] Устанавливаем httpx...
pip install httpx

echo.
echo [INFO] Устанавливаем playwright...
pip install playwright

echo.
echo [INFO] Устанавливаем markdownify...
pip install markdownify

echo.
echo [INFO] Устанавливаем Chromium для Playwright...
playwright install chromium

echo.
echo ========================================
echo [УСПЕХ] Все зависимости установлены!
echo.
echo Теперь вы можете запустить InLands Bridge:
echo   python inlands_bridge.py
echo ========================================
pause
