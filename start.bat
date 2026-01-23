@echo off
echo ====================================
echo   Broodjes Bestellen - Setup
echo ====================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo.

echo [2/4] Setting up database...
call npm run db:push
if %errorlevel% neq 0 (
    echo ERROR: database setup failed
    pause
    exit /b 1
)
echo.

echo [3/4] Seeding database with sample data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo WARNING: seed failed, continuing anyway...
)
echo.

echo [4/4] Starting development server...
echo.
echo ====================================
echo   Setup Complete!
echo ====================================
echo.
echo Application will start at: http://localhost:3000
echo Admin code (default): admin123
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
