@echo off
chcp 65001 >nul
title My Beat Watcher
echo My Beat Watcher - dang bat dau...
echo Cua so nay PHAI de mo trong luc soan bai My Beat. Dong lai (bam phim bat ky) khi xong viec.
echo.
"E:\LAP TRINH APP\MODEL\_parakeet_venv\Scripts\python.exe" "%~dp0mybeat-watch.py"
echo.
echo My Beat Watcher da dung. Bam phim bat ky de dong cua so.
pause >nul
