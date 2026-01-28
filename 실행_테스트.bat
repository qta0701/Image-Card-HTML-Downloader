@echo off
setlocal
chcp 65001 > nul
echo ========================================================
echo Image Card HTML Downloader - 로컬 실행 테스트
echo ========================================================
echo.

:: 0. 로그 폴더 정리
if not exist "logs" mkdir "logs"
echo [INFO] 기존 로그 파일을 정리합니다...
del /Q "logs\*"

:: 1. 로그 파일명 설정 (타임스탬프로 생성되어 유일한 파일이 됨)
for /f %%i in ('powershell -command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set TIMESTAMP=%%i
set "LOG_FILE=logs\log_%TIMESTAMP%.txt"

echo.
echo 2. 패키지 설치 확인
if not exist node_modules (
    echo [INFO] node_modules가 없어 설치를 진행합니다...
    call npm install >> "%LOG_FILE%" 2>&1
) else (
    echo [INFO] node_modules가 이미 존재합니다.
)

echo.
echo 3. 로컬 서버 실행
echo [INFO] 서버가 시작되면 브라우저가 자동으로 열립니다. (http://localhost:3000)
echo [INFO] 실행 로그는 "%LOG_FILE%"에 저장됩니다.
echo [INFO] 서버를 끄려면 이 창에서 'Ctrl + C'를 누른 후 'Y'를 입력하세요.
echo.

:: npm run dev 실행 및 로그 기록 (PowerShell Tee-Object 사용)
powershell -Command "npm run dev | Tee-Object -FilePath '%LOG_FILE%' -Append"

pause
