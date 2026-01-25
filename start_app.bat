@echo off
echo Starting TheWorkshop...

:: Start Backend in a new window
echo Starting Backend Server...
start "TheWorkshop Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

:: Start Frontend in a new window
echo Starting Frontend Server...
start "TheWorkshop Frontend" cmd /k "cd frontend && npm run dev"

echo App is launching! Check the new windows for logs.
timeout /t 3
