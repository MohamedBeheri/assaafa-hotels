#!/usr/bin/env bash
# سكربت بناء Render — يثبّت الحزم، يجمع static، يهيّئ قاعدة البيانات والبيانات
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# تعبئة البيانات (idempotent — آمن التكرار)
python manage.py seed
python manage.py seed_real
python manage.py seed_extra
