import random
from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, Role
from apps.hotels.models import (Hotel, Room, RoomType, SeasonalRate, Service,
                                HousekeepingTask, MaintenanceRequest)
from apps.guests.models import Guest
from apps.reservations.models import Reservation, ReservationRoom
from apps.billing.models import Invoice, Charge, Payment, Coupon


class Command(BaseCommand):
    help = "بيانات تجريبية للخصائص الجديدة + تاريخ 30 يوم للتقارير"

    def handle(self, *args, **opts):
        today = timezone.localdate()
        now = timezone.now()

        # 1) أسعار موسمية
        if not SeasonalRate.objects.exists():
            for hotel in Hotel.objects.all():
                for rt in hotel.room_types.all():
                    SeasonalRate.objects.create(
                        hotel=hotel, room_type=rt, name="موسم الصيف",
                        start_date=today.replace(month=6, day=1),
                        end_date=today.replace(month=8, day=31),
                        price=rt.base_price * Decimal("1.25"))
            self.stdout.write("✓ أسعار موسمية")

        # 2) خدمات إضافية
        if not Service.objects.exists():
            for hotel in Hotel.objects.all():
                for n, p, i in [("إفطار", 45, "coffee"), ("غسيل ملابس", 30, "skin"),
                                ("توصيل مطار", 120, "car"), ("سرير إضافي", 80, "plus"),
                                ("موقف خاص", 25, "environment")]:
                    Service.objects.create(hotel=hotel, name_ar=n, price=p, icon=i)
            self.stdout.write("✓ خدمات")

        # 3) كوبونات
        if not Coupon.objects.exists():
            Coupon.objects.create(code="WELCOME10", kind="percent", value=10,
                                  valid_to=today + timedelta(days=90))
            Coupon.objects.create(code="SUMMER50", kind="fixed", value=50,
                                  valid_to=today + timedelta(days=60), max_uses=100)
            self.stdout.write("✓ كوبونات")

        # 4) مهام تدبير وصيانة
        if not HousekeepingTask.objects.exists():
            for hotel in Hotel.objects.all():
                rooms = list(hotel.rooms.all()[:6])
                hk_user = hotel.staff.first()
                for i, room in enumerate(rooms[:4]):
                    HousekeepingTask.objects.create(
                        hotel=hotel, room=room,
                        task_type=random.choice(["cleaning", "deep_clean", "inspection"]),
                        status=["pending", "in_progress", "pending", "done"][i % 4],
                        assigned_to=hk_user)
                MaintenanceRequest.objects.create(
                    hotel=hotel, room=rooms[4], title="تكييف لا يعمل",
                    priority="high", status="open")
                MaintenanceRequest.objects.create(
                    hotel=hotel, room=rooms[5], title="تسريب مياه بالحمام",
                    priority="medium", status="in_progress")
            self.stdout.write("✓ تدبير وصيانة")

        # 5) تاريخ 30 يوم: حجوزات منتهية + فواتير مدفوعة
        if Reservation.objects.count() < 10:
            guests = list(Guest.objects.all())
            for hotel in Hotel.objects.all():
                rooms = list(hotel.rooms.all())
                for i in range(12):
                    ci = today - timedelta(days=random.randint(2, 28))
                    nights = random.randint(1, 4)
                    co = ci + timedelta(days=nights)
                    guest = random.choice(guests)
                    room = random.choice(rooms)
                    res = Reservation.objects.create(
                        hotel=hotel, guest=guest, check_in=ci, check_out=co,
                        status=Reservation.Status.CHECKED_OUT,
                        source=random.choice(["walk_in", "phone", "online", "ota"]),
                        adults=random.randint(1, 3))
                    # كود فريد لكل حجز (save يولده بالثانية فيتكرر)
                    res.code = f"{hotel.code}-H{res.id:05d}"
                    res.save()
                    rate = room.room_type.price_for(ci)
                    ReservationRoom.objects.create(
                        reservation=res, room=room, room_type=room.room_type,
                        rate_per_night=rate)
                    inv = Invoice.objects.create(
                        hotel=hotel, reservation=res, guest=guest,
                        vat_rate=hotel.vat_rate, status=Invoice.Status.PAID)
                    inv.number = f"{hotel.code}-I{inv.id:05d}"
                    inv.save()
                    ch = Charge.objects.create(
                        invoice=inv, kind=Charge.Kind.ROOM,
                        description=f"إقامة غرفة {room.number} ({nights} ليلة)",
                        quantity=nights, unit_price=rate)
                    # بند بتاريخ قديم عشان التقارير
                    Charge.objects.filter(pk=ch.pk).update(
                        created_at=now - timedelta(days=(today - ci).days))
                    pay = Payment.objects.create(
                        invoice=inv, amount=inv.total,
                        method=random.choice(["cash", "card", "transfer", "online"]))
                    Payment.objects.filter(pk=pay.pk).update(
                        paid_at=now - timedelta(days=(today - co).days))
            self.stdout.write("✓ تاريخ حجوزات 30 يوم")

        # 6) شركات ووكلاء + حساب آجل تجريبي
        from apps.guests.models import Company
        if not Company.objects.exists():
            aramco, _ = Company.objects.get_or_create(
                name="شركة أرامكو", defaults={"kind": "company",
                "tax_number": "300012345600003", "credit_limit": 50000,
                "discount_pct": 15, "payment_terms_days": 30})
            Company.objects.get_or_create(
                name="وكالة المشاعر للسياحة", defaults={"kind": "travel_agent",
                "commission_pct": 10, "credit_limit": 30000})
            Company.objects.get_or_create(
                name="مجموعة الحبيب", defaults={"kind": "company",
                "credit_limit": 20000, "discount_pct": 10})
            # وجّه فاتورة مقيم حالياً لحساب أرامكو (يظهر في AR)
            inhouse = Reservation.objects.filter(
                status=Reservation.Status.CHECKED_IN).first()
            if inhouse and hasattr(inhouse, "invoice"):
                inhouse.company = aramco
                inhouse.save()
                inv = inhouse.invoice
                inv.bill_to_company = aramco
                inv.save()
            self.stdout.write("✓ شركات ووكلاء + حساب آجل")

        # 7) حالات تدبير متنوّعة للعرض
        import random as _r
        from apps.hotels.models import Room as _Room
        if not _Room.objects.filter(hk_status="inspected").exists():
            for _rm in _Room.objects.all():
                if _rm.status == _Room.Status.OCCUPIED:
                    _rm.hk_status = _r.choice(["dirty", "dirty", "clean"])
                else:
                    _rm.hk_status = _r.choice(["clean", "clean", "inspected", "dirty"])
                _rm.save()
            self.stdout.write("✓ حالات التدبير")

        # 8) أكواد البنود القياسية
        from apps.billing.models import TransactionCode
        for c, ar, en, cat, pr in [
            ("1000","إقامة غرفة","Room","room",0),("1500","ضريبة القيمة المضافة","VAT","tax",0),
            ("2000","إفطار","Breakfast","fnb",45),("2100","غداء","Lunch","fnb",65),
            ("2200","عشاء","Dinner","fnb",75),("3000","غسيل وكوي","Laundry","service",30),
            ("3100","موقف سيارات","Parking","service",25),("3200","توصيل مطار","Airport Transfer","service",120)]:
            TransactionCode.objects.get_or_create(code=c, defaults={
                "name_ar": ar, "name_en": en, "category": cat, "default_price": pr})

        self.stdout.write(self.style.SUCCESS("تمت التعبئة الإضافية ✓"))
