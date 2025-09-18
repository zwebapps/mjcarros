@echo off
echo 🚀 MJ Carros Admin Setup
echo =========================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env >nul
        echo ✅ .env file created from .env.example
        echo 📝 Please update .env with your actual values before running this script again.
        pause
        exit /b 1
    ) else (
        echo ❌ No .env.example file found. Please create a .env file with your database connection.
        pause
        exit /b 1
    )
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Run the admin setup script
echo 🔐 Creating admin user and initial data...
node scripts/setup-admin.js

echo.
echo 🎉 Setup completed!
echo.
echo 📋 Next steps:
echo    1. Start your application: npm run dev
echo    2. Go to: http://localhost:3000/admin
echo    3. Login with the credentials shown above
echo    4. Change the default password
echo    5. Upload your first cars using the bulk upload feature
echo.
echo 💡 To create additional admin users, use the admin panel or run:
echo    node scripts/create-admin.js
echo.
pause
