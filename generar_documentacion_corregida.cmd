@echo off
setlocal

set "SCRIPT=%~dp0generar_documentacion_corregida.ps1"
set "OUTPUT=%~dp0Documentacion_Tecnica_SGCF_Corregida.md"

if not exist "%SCRIPT%" (
  echo No se encontro el script auxiliar:
  echo %SCRIPT%
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -OutputPath "%OUTPUT%"

if errorlevel 1 (
  echo No se pudo generar el archivo.
  exit /b 1
)

echo Documento generado en:
echo %OUTPUT%

endlocal
