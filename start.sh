#!/bin/bash
# تشغيل نظام فنادق السعفة (باك + فرونت)
cd "$(dirname "$0")"
echo "▶ تشغيل الباك-إند على 8020..."
(cd backend && source venv/bin/activate && python manage.py runserver 8020) &
BE=$!
echo "▶ تشغيل الفرونت-إند على 5180..."
(cd frontend && npm run dev) &
FE=$!
trap "kill $BE $FE 2>/dev/null" EXIT INT TERM
echo "✓ افتح http://localhost:5180  (admin / admin123)"
wait
