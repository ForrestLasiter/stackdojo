@echo off
rem Double-click to open StackDojo. Builds the interface on first run.
cd /d "%~dp0"
if not exist node_modules call npm install
if not exist dist\index.html call npm run build
start "" node_moduleslectron\distlectron.exe .
