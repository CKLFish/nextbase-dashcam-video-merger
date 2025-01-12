@echo off
:: for /F will launch a new instance of cmd so we create a guard to prevent an infnite loop
if not defined FNM_AUTORUN_GUARD (
    set "FNM_AUTORUN_GUARD=AutorunGuard"
    FOR /f "tokens=*" %%z IN ('fnm env --use-on-cd') DO CALL %%z
)

@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\node_modules\electron-vite\bin\electron-vite.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\..\node_modules\electron-vite\bin\electron-vite.js" %*
)