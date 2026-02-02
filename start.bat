@echo off
start "backend" cmd /k "cd backend && node server.js"
start "frontned" cmd /k "cd frontend && npm start"