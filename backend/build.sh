#!/usr/bin/env bash
# سكربت بناء Render — يثبّت الحزم، يجمع static، يهيّئ قاعدة البيانات
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# التعبئة مرة واحدة فقط عند أول نشر (قاعدة فاضية) — يمنع التكرار
if python manage.py shell -c "import sys; from apps.hotels.models import Hotel; sys.exit(0 if Hotel.objects.exists() else 1)"; then
  echo ">> قاعدة البيانات معبّأة مسبقاً — تخطّي البذر."
else
  echo ">> أول نشر: جاري تعبئة البيانات..."
  python manage.py seed
  python manage.py seed_real
  python manage.py seed_extra
fi
