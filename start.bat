@echo off
start "backend" cmd /k "cd backend && npm run dev"
start "frontned" cmd /k "cd frontend && npm start"