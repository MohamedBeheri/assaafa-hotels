import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, Role
from apps.hotels.models import Hotel, Floor, Amenity, RoomType, Room
from apps.guests.models import Guest
from apps.reservations.models import Reservation, ReservationRoom
from apps.billing.models import Invoice, Charge, Payment
from apps.pos.models import Category, Product, Order, OrderItem
from apps.finance.models import ExpenseCategory, Expense, Employee


class Command(BaseCommand):
    help = "تعبئة بيانات تجريبية لفنادق السعفة"

    def handle(self, *args, **opts):
        self.stdout.write("جاري إنشاء البيانات...")

        # المدير العام
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                "admin", "admin@assaafa.com", "admin123",
                first_name="المدير", last_name="العام", role=Role.ADMIN)

        hotels_data = [
            {"name_ar": "فندق السعفة", "name_en": "As'saafa Hotel", "code": "SF", "stars": 4},
            {"name_ar": "فندق السعفة الذهبية", "name_en": "As'saafa Golden Hotel", "code": "SFG", "stars": 5},
        ]
        amenities = []
        for n, i in [("واي فاي مجاني", "wifi"), ("تكييف", "snowflake"), ("تلفاز", "tv"),
                     ("ثلاجة", "box"), ("خزنة", "lock"), ("مجفف شعر", "wind")]:
            a, _ = Amenity.objects.get_or_create(name_ar=n, defaults={"icon": i})
            amenities.append(a)

        rt_templates = [
            ("غرفة مفردة", "Single", 250, 1, 0),
            ("غرفة مزدوجة", "Double", 400, 2, 1),
            ("جناح", "Suite", 750, 2, 2),
            ("جناح ملكي", "Royal Suite", 1200, 4, 2),
        ]

        for hd in hotels_data:
            hotel, _ = Hotel.objects.get_or_create(
                code=hd["code"],
                defaults={"name_ar": hd["name_ar"], "name_en": hd["name_en"],
                          "star_rating": hd["stars"], "phone": "0555000000",
                          "address": "المملكة العربية السعودية", "vat_rate": 15})
            # موظف استقبال لكل فندق
            uname = f"reception_{hotel.code.lower()}"
            if not User.objects.filter(username=uname).exists():
                u = User(username=uname, first_name="موظف", last_name="استقبال",
                         role=Role.RECEPTION, hotel=hotel)
                u.set_password("123456")
                u.save()

            room_types = []
            for name_ar, name_en, price, ad, ch in rt_templates:
                rt, _ = RoomType.objects.get_or_create(
                    hotel=hotel, name_ar=name_ar,
                    defaults={"name_en": name_en, "base_price": price * (1.3 if hd["code"] == "SFG" else 1),
                              "max_adults": ad, "max_children": ch})
                rt.amenities.set(amenities)
                room_types.append(rt)

            for fnum in range(1, 5):
                floor, _ = Floor.objects.get_or_create(hotel=hotel, number=str(fnum))
                for r in range(1, 9):
                    num = f"{fnum}0{r}"
                    Room.objects.get_or_create(
                        hotel=hotel, number=num,
                        defaults={"room_type": random.choice(room_types), "floor": floor,
                                  "status": Room.Status.AVAILABLE})

            # قائمة الكافيه
            cat, _ = Category.objects.get_or_create(hotel=hotel, name_ar="مشروبات ساخنة", defaults={"sort": 1})
            cat2, _ = Category.objects.get_or_create(hotel=hotel, name_ar="وجبات", defaults={"sort": 2})
            for nm, pr, c in [("قهوة عربية", 15, cat), ("كابتشينو", 18, cat),
                              ("شاي", 10, cat), ("برجر", 35, cat2), ("شاورما", 25, cat2)]:
                Product.objects.get_or_create(hotel=hotel, name_ar=nm, defaults={"category": c, "price": pr})

        # نزلاء
        names = [("محمد", "العتيبي"), ("سارة", "القحطاني"), ("عبدالله", "الشهري"),
                 ("نورة", "الدوسري"), ("فيصل", "الغامدي")]
        for i, (f, l) in enumerate(names):
            Guest.objects.get_or_create(
                id_number=f"10{i}2345678",
                defaults={"first_name": f, "last_name": l, "phone": f"05500011{i}2",
                          "nationality": "السعودية"})

        # بنود مصروفات
        for n in ["كهرباء", "مياه", "صيانة", "مستلزمات", "رواتب"]:
            ExpenseCategory.objects.get_or_create(name_ar=n)

        # حجز تجريبي مع فاتورة
        hotel = Hotel.objects.get(code="SF")
        guest = Guest.objects.first()
        room = hotel.rooms.filter(status=Room.Status.AVAILABLE).first()
        if room and not Reservation.objects.exists():
            res = Reservation.objects.create(
                hotel=hotel, guest=guest, check_in=timezone.localdate(),
                check_out=timezone.localdate() + timedelta(days=2),
                status=Reservation.Status.CHECKED_IN, adults=2)
            ReservationRoom.objects.create(
                reservation=res, room=room, room_type=room.room_type,
                rate_per_night=room.room_type.base_price)
            room.status = Room.Status.OCCUPIED
            room.save()
            inv = Invoice.objects.create(hotel=hotel, reservation=res, guest=guest, vat_rate=15)
            Charge.objects.create(invoice=inv, kind=Charge.Kind.ROOM,
                                  description=f"إقامة غرفة {room.number}",
                                  quantity=2, unit_price=room.room_type.base_price)
            Payment.objects.create(invoice=inv, amount=inv.total / 2, method=Payment.Method.CASH)

        self.stdout.write(self.style.SUCCESS("تمت التعبئة بنجاح ✓"))
        self.stdout.write("دخول المدير: admin / admin123")
