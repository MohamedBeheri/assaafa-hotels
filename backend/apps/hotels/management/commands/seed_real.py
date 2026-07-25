"""تحديث البيانات ببيانات موقع assaafahotels.com الحقيقية."""
from django.core.management.base import BaseCommand
from decimal import Decimal
from apps.hotels.models import Hotel, RoomType, RoomTypePhoto, Service, SeasonalRate


REAL_ROOMS = {
    "SF": [
        ("غرفة كينج", "King Size Room", 2, 1, "real-sf-king.jpg", 400,
         "غرفة أنيقة بسرير كينج فاخر، تصميم عصري بلمسات خشبية دافئة، وإطلالة على المدينة المنورة."),
        ("غرفة توين", "Twin Sharing Room", 2, 1, "real-sf-twin.jpg", 400,
         "غرفة مريحة بسريرين منفصلين، مثالية للأصدقاء والعائلات الصغيرة."),
        ("غرفة ثلاثية", "Triple Room", 3, 1, "real-sf-triple.jpg", 550,
         "غرفة واسعة بثلاثة أسرّة مريحة لإقامة عائلية هادئة قرب الحرم النبوي."),
        ("غرفة رباعية", "Quadruple Room", 4, 2, "real-sf-quad.jpg", 700,
         "غرفة عائلية رحبة بأربعة أسرّة، الخيار الأمثل للمجموعات والعائلات."),
    ],
    "SFG": [
        ("غرفة كينج ذهبية", "King Size Golden Room", 2, 1, "real-sfg-king.jpg", 520,
         "فخامة ذهبية بسرير كينج ملكي وتشطيبات راقية لتجربة إقامة استثنائية."),
        ("غرفة توين ذهبية", "Twin Sharing Golden Room", 2, 1, "real-sfg-twin.jpg", 520,
         "سريران فاخران بتصميم ذهبي أنيق مع كامل وسائل الراحة العصرية."),
        ("غرفة ثلاثية ذهبية", "Triple Golden Room", 3, 1, "real-sfg-triple.jpg", 715,
         "مساحة واسعة بثلاثة أسرّة فاخرة ولمسات ذهبية مميزة."),
        ("غرفة رباعية ذهبية", "Quad Golden Room", 4, 2, "real-sfg-quad.jpg", 910,
         "الجناح العائلي الذهبي بأربعة أسرّة، رحابة وفخامة للمجموعات."),
    ],
}

REAL_SERVICES = [
    ("خدمة سائق وسيارة", "Driver & Car Service", 150, "car"),
    ("نقل مباشر للمسجد النبوي", "Direct Transport to Holy Mosque", 0, "compass"),
    ("توصيل من/إلى المطار", "Airport Shuttle", 120, "rocket"),
    ("غسيل وكوي", "Laundry & Ironing", 30, "skin"),
    ("خدمة الغرف 24/7", "Room Service 24/7", 0, "bell"),
    ("إنترنت فائق السرعة", "High Speed Internet", 0, "wifi"),
    ("خزائن أمانات", "Safe Deposit Boxes", 0, "lock"),
]


class Command(BaseCommand):
    help = "تحديث الفنادق والغرف والخدمات ببيانات الموقع الرسمي"

    def handle(self, *args, **opts):
        # 1) بيانات الفنادق الحقيقية
        info = {
            "SF": {"name_ar": "فندق السعفة", "name_en": "As'saafa Hotel",
                   "address": "المدينة المنورة — على بُعد 500 متر من المسجد النبوي الشريف",
                   "phone": "920022549", "email": "info@assaafahotels.com", "star_rating": 4},
            "SFG": {"name_ar": "فندق السعفة الذهبية", "name_en": "As'saafa Golden Hotel",
                    "address": "المدينة المنورة — على بُعد 500 متر من المسجد النبوي الشريف",
                    "phone": "920022573", "email": "info@assaafahotels.com", "star_rating": 5},
        }
        for code, data in info.items():
            Hotel.objects.filter(code=code).update(**data)
        self.stdout.write("✓ بيانات الفنادق")

        # 2) أنواع الغرف الحقيقية (تحديث بالترتيب الموجود)
        for code, rooms in REAL_ROOMS.items():
            hotel = Hotel.objects.get(code=code)
            existing = list(hotel.room_types.order_by("id"))
            for i, (ar, en, adults, children, photo, price, desc) in enumerate(rooms):
                if i < len(existing):
                    rt = existing[i]
                    rt.name_ar, rt.name_en = ar, en
                    rt.max_adults, rt.max_children = adults, children
                    rt.base_price = price
                    rt.description = desc
                    rt.save()
                else:
                    rt = RoomType.objects.create(
                        hotel=hotel, name_ar=ar, name_en=en, base_price=price,
                        max_adults=adults, max_children=children, description=desc)
                # الصورة الحقيقية أولاً + صورتين جاليري
                rt.photos.all().delete()
                RoomTypePhoto.objects.create(room_type=rt, sort=0,
                                             image=f"room_photos/{photo}", caption=ar)
                for j, g in enumerate([(i * 3 + 1), (i * 3 + 2)]):
                    RoomTypePhoto.objects.create(room_type=rt, sort=j + 1,
                                                 image=f"site/gallery/g-{g}.jpg", caption=ar)
        self.stdout.write("✓ أنواع الغرف بالصور الحقيقية")

        # 3) الخدمات الحقيقية — idempotent (تحديث إن وُجدت وإلا إنشاء)
        real_names = [s[0] for s in REAL_SERVICES]
        for hotel in Hotel.objects.all():
            # عطّل أي خدمة قديمة مش ضمن القائمة الرسمية
            hotel.services.exclude(name_ar__in=real_names).update(is_active=False)
            for ar, en, price, icon in REAL_SERVICES:
                Service.objects.update_or_create(
                    hotel=hotel, name_ar=ar,
                    defaults={"name_en": en, "price": price, "icon": icon, "is_active": True})
        self.stdout.write("✓ الخدمات الحقيقية (7 خدمات)")

        # 4) مزامنة الأسعار الموسمية مع الأسعار الجديدة
        for sr in SeasonalRate.objects.select_related("room_type"):
            sr.price = (sr.room_type.base_price * Decimal("1.25")).quantize(Decimal("0.01"))
            sr.save()
        self.stdout.write("✓ الأسعار الموسمية متزامنة")
        self.stdout.write(self.style.SUCCESS("تم التحديث من الموقع الرسمي ✓"))
