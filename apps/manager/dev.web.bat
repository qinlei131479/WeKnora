@echo off
chcp 65001
for /f "delims=" %%i in ('nvm current') do set nvm_version=%%i
echo nvm_version: %nvm_version%
@REM 判断nvm_version的大版本是不是v18
if not "%nvm_version:~0,3%"=="v18" (
    nvm use 18
    @REM 等1秒，确保nvm切换完成
    timeout /t 1 /nobreak
)

set port=8110
@REM set PROXY_API_TARGET=http://192.168.170.245:9899/prod-api
set PROXY_API_TARGET=
set STATIC_API_TARGET=
npm run dev

if not "%nvm_version:~0,3%"=="v18" (
    nvm use %nvm_version%
)
