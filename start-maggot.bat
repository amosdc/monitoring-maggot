@echo off
title Maggot Farm Monitoring System Launcher
:menu
cls
echo =======================================================
echo     MAGGOT FARM MONITORING SYSTEM LAUNCHER
echo =======================================================
echo.
echo  [1] Jalankan Backend Server (Port 3001)
echo  [2] Jalankan ngrok Tunnel (Port 3001)
echo  [3] Jalankan Keduanya (Backend + ngrok)
echo  [4] Keluar
echo.
echo =======================================================
set /p choice="Masukkan pilihan (1-4): "

if "%choice%"=="1" goto start_backend
if "%choice%"=="2" goto start_ngrok
if "%choice%"=="3" goto start_both
if "%choice%"=="4" exit
goto menu

:start_backend
cls
echo Memulai Backend Server...
cd /d "%~dp0backend"
npm start
pause
goto menu

:start_ngrok
cls
echo.
echo Masukkan Domain Statis ngrok Anda jika ada (misal: mydomain.ngrok-free.app).
echo Jika dikosongkan, ngrok akan jalan dengan URL acak.
echo.
set /p ngrok_domain="Domain Statis (opsional): "
cls
if "%ngrok_domain%"=="" (
    echo Menjalankan ngrok di Port 3001 (URL Acak)...
    ngrok http 3001
) else (
    echo Menjalankan ngrok di Port 3001 menggunakan domain %ngrok_domain%...
    ngrok http --domain=%ngrok_domain% 3001
)
pause
goto menu

:start_both
cls
echo Menjalankan Backend dan ngrok di jendela terpisah...
start cmd /k "echo Menjalankan Backend... && cd /d %~dp0backend && npm start"
echo.
echo Masukkan Domain Statis ngrok Anda jika ada (misal: mydomain.ngrok-free.app).
echo Jika dikosongkan, ngrok akan jalan dengan URL acak.
echo.
set /p ngrok_domain="Domain Statis (opsional): "
if "%ngrok_domain%"=="" (
    start cmd /k "echo Menjalankan ngrok... && ngrok http 3001"
) else (
    start cmd /k "echo Menjalankan ngrok... && ngrok http --domain=%ngrok_domain% 3001"
)
echo Keduanya sedang berjalan! Jendela baru telah dibuka.
pause
goto menu
