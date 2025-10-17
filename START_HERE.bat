@echo off
echo ========================================
echo   Himanshu B A - Job Application Tracker
echo   Journey Since July 1, 2025
echo ========================================
echo.
echo Starting Local Web Server (fixes CORS errors)...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
echo.
echo Dashboard opened in your default browser!
echo.
echo Navigation:
echo - Dashboard: View analytics and charts
echo - Manage Applications: Add/edit data
echo.
echo Good luck with your job search, Himanshu!
echo.
echo Press any key to exit...
pause > nul
