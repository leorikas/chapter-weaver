@echo off
echo ========================================
echo   InLands Translation Manager
echo   Локальный сервер разработки
echo ========================================
echo.

REM Проверяем наличие Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден!
    echo Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js найден
echo.

REM Переходим в директорию проекта
cd /d "%~dp0.."

REM Проверяем наличие node_modules
if not exist "node_modules" (
    echo [INFO] Устанавливаем зависимости...
    call npm install
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить зависимости!
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Запуск сервера разработки...
echo [INFO] Сайт будет доступен по адресу: http://localhost:5173
echo.
echo Нажмите Ctrl+C для остановки сервера
echo ========================================
echo.

call npm run dev

pause
