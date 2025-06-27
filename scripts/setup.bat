@echo off
echo 🚀 Setting up YouTube Clone...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing pnpm...
    npm install -g pnpm
)

echo ✅ pnpm version:
pnpm --version

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

REM Check if .env.local exists
if not exist ".env.local" (
    echo ⚠️  .env.local file not found!
    echo 📝 Please create a .env.local file with your Supabase credentials:
    echo.
    echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    echo SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    echo.
    echo 💡 You can copy from env.example as a starting point.
) else (
    echo ✅ .env.local file found
)

echo.
echo 🗄️  Don't forget to set up your Supabase database:
echo    1. Go to your Supabase project dashboard
echo    2. Open the SQL editor
echo    3. Run the contents of setup-database.sql
echo.

echo 🎉 Setup complete! Run 'pnpm dev' to start the development server.
pause 