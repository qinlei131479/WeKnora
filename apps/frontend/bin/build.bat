@echo off
chcp 65001
%~d0
cd %~dp0

cd ..

echo nvm_version: %nvm_version%
@REM 判断nvm_version的大版本是不是v23
if not "%nvm_version:~0,3%"=="v23" (
    nvm use 23
    @REM 等1秒，确保nvm切换完成
    timeout /t 1 /nobreak
)

npm run build

if not "%nvm_version:~0,3%"=="v23" (
    nvm use %nvm_version%
)

