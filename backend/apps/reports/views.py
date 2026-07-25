from decimal import Decimal
from datetime import timedelta
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.hotels.models import Hotel, Room
from apps.reservations.models import Reservation
from apps.billing.models import Invoice, Payment
from apps.finance.models import Expense
from apps.pos.models import Order


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """مؤشرات لوحة التحكم — مع فلتر اختياري بالفندق ?hotel=<id>."""
    hotel_id = request.query_params.get("hotel")
    today = timezone.localdate()

    rooms = Room.objects.filter(is_active=True)
    reservations = Reservation.objects.all()
    payments = Payment.objects.all()
    expenses = Expense.objects.all()
    orders = Order.objects.all()
    if hotel_id:
        rooms = rooms.filter(hotel_id=hotel_id)
        reservations = reservations.filter(hotel_id=hotel_id)
        payments = payments.filter(invoice__hotel_id=hotel_id)
        expenses = expenses.filter(hotel_id=hotel_id)
        orders = orders.filter(hotel_id=hotel_id)

    total_rooms = rooms.count()
    occupied = rooms.filter(status=Room.Status.OCCUPIED).count()
    available = rooms.filter(status=Room.Status.AVAILABLE).count()
    occupancy_rate = round((occupied / total_rooms) * 100, 1) if total_rooms else 0

    arrivals = reservations.filter(check_in=today).exclude(
        status__in=[Reservation.Status.CANCELLED, Reservation.Status.CHECKED_OUT]).count()
    departures = reservations.filter(check_out=today, status=Reservation.Status.CHECKED_IN).count()
    in_house = reservations.filter(status=Reservation.Status.CHECKED_IN).count()

    revenue_today = payments.filter(paid_at__date=today).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    month_start = today.replace(day=1)
    revenue_month = payments.filter(paid_at__date__gte=month_start).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    expenses_month = expenses.filter(paid_at__gte=month_start).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    pos_today = orders.filter(created_at__date=today).count()

    # حجوزات أونلاين بانتظار التأكيد — تمييز خاص
    online_pending_qs = reservations.filter(
        source=Reservation.Source.ONLINE,
        status=Reservation.Status.PENDING).select_related("guest").order_by("-created_at")
    online_pending = [{
        "id": r.id, "code": r.code, "guest": r.guest.full_name,
        "phone": r.guest.phone,
        "check_in": r.check_in.isoformat(), "check_out": r.check_out.isoformat(),
        "total": float(r.rooms_total),
        "created_at": r.created_at.isoformat(),
    } for r in online_pending_qs[:8]]

    # إيراد آخر 7 أيام
    revenue_series = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        amt = payments.filter(paid_at__date=d).aggregate(s=Sum("amount"))["s"] or Decimal("0")
        revenue_series.append({"date": d.isoformat(), "amount": float(amt)})

    room_status = {s.value: rooms.filter(status=s.value).count() for s in Room.Status}

    return Response({
        "total_rooms": total_rooms,
        "occupied": occupied,
        "available": available,
        "occupancy_rate": occupancy_rate,
        "arrivals_today": arrivals,
        "departures_today": departures,
        "in_house": in_house,
        "revenue_today": float(revenue_today),
        "revenue_month": float(revenue_month),
        "expenses_month": float(expenses_month),
        "net_month": float(revenue_month - expenses_month),
        "pos_orders_today": pos_today,
        "online_pending_count": online_pending_qs.count(),
        "online_pending": online_pending,
        "revenue_series": revenue_series,
        "room_status": room_status,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def hotels_overview(request):
    """مقارنة سريعة بين الفنادق."""
    data = []
    for h in Hotel.objects.filter(is_active=True):
        rooms = h.rooms.filter(is_active=True)
        total = rooms.count()
        occ = rooms.filter(status=Room.Status.OCCUPIED).count()
        data.append({
            "id": h.id, "name_ar": h.name_ar, "name_en": h.name_en, "code": h.code,
            "total_rooms": total, "occupied": occ,
            "occupancy_rate": round((occ / total) * 100, 1) if total else 0,
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def calendar(request):
    """شبكة التقويم (Tape Chart) — الغرف × الأيام مع الحجوزات.
    ?hotel=<id>&start=YYYY-MM-DD&days=14"""
    from datetime import date as date_cls
    hotel_id = request.query_params.get("hotel")
    days = min(int(request.query_params.get("days", 14)), 31)
    start_raw = request.query_params.get("start")
    start = date_cls.fromisoformat(start_raw) if start_raw else timezone.localdate()
    end = start + timedelta(days=days)

    rooms = Room.objects.filter(is_active=True).select_related("room_type", "hotel")
    if hotel_id:
        rooms = rooms.filter(hotel_id=hotel_id)
    rooms = rooms.order_by("hotel__code", "number")

    res = Reservation.objects.filter(
        check_in__lt=end, check_out__gt=start,
    ).exclude(status__in=[Reservation.Status.CANCELLED, Reservation.Status.NO_SHOW]
    ).select_related("guest").prefetch_related("rooms")
    if hotel_id:
        res = res.filter(hotel_id=hotel_id)

    bookings = []
    for r in res:
        for rr in r.rooms.all():
            bookings.append({
                "room_id": rr.room_id,
                "reservation_id": r.id,
                "code": r.code,
                "guest": r.guest.full_name,
                "status": r.status,
                "check_in": r.check_in.isoformat(),
                "check_out": r.check_out.isoformat(),
            })

    return Response({
        "start": start.isoformat(),
        "days": days,
        "dates": [(start + timedelta(days=i)).isoformat() for i in range(days)],
        "rooms": [{"id": rm.id, "number": rm.number, "type": rm.room_type.name_ar,
                   "status": rm.status, "hotel": rm.hotel.code} for rm in rooms],
        "bookings": bookings,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics(request):
    """تقارير متقدمة — ADR / RevPAR / إشغال 30 يوم / مصادر / طرق دفع."""
    hotel_id = request.query_params.get("hotel")
    today = timezone.localdate()
    period_days = min(int(request.query_params.get("days", 30)), 90)
    start = today - timedelta(days=period_days - 1)

    rooms = Room.objects.filter(is_active=True)
    reservations = Reservation.objects.all()
    payments = Payment.objects.all()
    if hotel_id:
        rooms = rooms.filter(hotel_id=hotel_id)
        reservations = reservations.filter(hotel_id=hotel_id)
        payments = payments.filter(invoice__hotel_id=hotel_id)

    total_rooms = rooms.count() or 1

    # room revenue خلال الفترة من بنود الإقامة
    from apps.billing.models import Charge
    room_charges = Charge.objects.filter(
        kind=Charge.Kind.ROOM, created_at__date__gte=start)
    if hotel_id:
        room_charges = room_charges.filter(invoice__hotel_id=hotel_id)
    room_revenue = sum((c.total for c in room_charges), Decimal("0"))

    # ليالي مباعة خلال الفترة
    sold = reservations.exclude(status__in=[Reservation.Status.CANCELLED, Reservation.Status.NO_SHOW])
    room_nights_sold = 0
    occupancy_series = []
    for i in range(period_days):
        d = start + timedelta(days=i)
        n = sum(r.rooms.count() for r in sold.filter(check_in__lte=d, check_out__gt=d))
        room_nights_sold += n
        occupancy_series.append({"date": d.isoformat(),
                                 "rate": round(n / total_rooms * 100, 1)})

    available_nights = total_rooms * period_days
    adr = float(room_revenue / room_nights_sold) if room_nights_sold else 0
    revpar = float(room_revenue / available_nights) if available_nights else 0

    by_source = list(sold.values("source").annotate(c=Count("id")).order_by("-c"))
    by_method = [
        {"method": m["method"], "amount": float(m["s"] or 0)}
        for m in payments.filter(paid_at__date__gte=start)
        .values("method").annotate(s=Sum("amount")).order_by("-s")]

    top_guests = list(
        sold.values("guest__first_name", "guest__last_name")
        .annotate(c=Count("id")).order_by("-c")[:5])

    return Response({
        "period_days": period_days,
        "adr": round(adr, 2),
        "revpar": round(revpar, 2),
        "room_revenue": float(room_revenue),
        "room_nights_sold": room_nights_sold,
        "avg_occupancy": round(room_nights_sold / available_nights * 100, 1) if available_nights else 0,
        "occupancy_series": occupancy_series,
        "by_source": by_source,
        "by_method": by_method,
        "top_guests": [{"name": f"{g['guest__first_name']} {g['guest__last_name']}".strip(),
                        "count": g["c"]} for g in top_guests],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def front_office(request):
    """شاشة الفرونت أوفيس — الوصول والمقيمون والمغادرات اليوم."""
    hotel_id = request.query_params.get("hotel")
    today = timezone.localdate()
    res = Reservation.objects.select_related("guest").prefetch_related("rooms__room", "rooms__room_type")
    if hotel_id:
        res = res.filter(hotel_id=hotel_id)

    def serialize(r):
        try:
            inv = r.invoice
            balance = float(inv.balance)
        except Exception:
            balance = None
        return {
            "id": r.id, "code": r.code,
            "guest": r.guest.full_name, "phone": r.guest.phone,
            "nationality": r.guest.nationality, "is_vip": r.guest.is_vip,
            "rooms": [{"number": rr.room.number, "type": rr.room_type.name_ar} for rr in r.rooms.all()],
            "check_in": r.check_in.isoformat(), "check_out": r.check_out.isoformat(),
            "nights": r.nights, "adults": r.adults, "children": r.children,
            "status": r.status, "status_display": r.get_status_display(),
            "source": r.source, "source_display": r.get_source_display(),
            "balance": balance,
        }

    arrivals = res.filter(check_in=today).exclude(
        status__in=[Reservation.Status.CANCELLED, Reservation.Status.CHECKED_OUT, Reservation.Status.NO_SHOW])
    in_house = res.filter(status=Reservation.Status.CHECKED_IN)
    departures = res.filter(check_out=today, status=Reservation.Status.CHECKED_IN)

    return Response({
        "date": today.isoformat(),
        "arrivals": [serialize(r) for r in arrivals.order_by("-created_at")],
        "in_house": [serialize(r) for r in in_house.order_by("check_out")],
        "departures": [serialize(r) for r in departures.order_by("-created_at")],
        "counts": {
            "arrivals": arrivals.count(),
            "in_house": in_house.count(),
            "departures": departures.count(),
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def global_search(request):
    """شريط الأوامر العالمي — بحث موحّد في النزلاء والحجوزات والغرف والفواتير."""
    from apps.guests.models import Guest
    from apps.billing.models import Invoice
    q = (request.query_params.get("q") or "").strip()
    hotel_id = request.query_params.get("hotel")
    results = []
    if not q:
        return Response({"results": results})

    guests = Guest.objects.filter(
        Q(first_name__icontains=q) | Q(last_name__icontains=q) |
        Q(phone__icontains=q) | Q(id_number__icontains=q))[:6]
    for g in guests:
        results.append({"type": "guest", "icon": "user",
                        "label": g.full_name,
                        "sublabel": f"{g.phone} · {g.nationality}",
                        "route": "/guests"})

    res = Reservation.objects.select_related("guest").filter(
        Q(code__icontains=q) | Q(guest__first_name__icontains=q) |
        Q(guest__last_name__icontains=q) | Q(guest__phone__icontains=q))
    if hotel_id:
        res = res.filter(hotel_id=hotel_id)
    for r in res[:6]:
        results.append({"type": "reservation", "icon": "calendar",
                        "label": f"{r.code} — {r.guest.full_name}",
                        "sublabel": f"{r.get_status_display()} · {r.check_in} → {r.check_out}",
                        "route": "/reservations"})

    rooms = Room.objects.select_related("room_type").filter(number__icontains=q)
    if hotel_id:
        rooms = rooms.filter(hotel_id=hotel_id)
    for rm in rooms[:5]:
        results.append({"type": "room", "icon": "home",
                        "label": f"غرفة {rm.number}",
                        "sublabel": f"{rm.room_type.name_ar} · {rm.get_status_display()}",
                        "route": "/rooms"})

    invs = Invoice.objects.select_related("guest").filter(number__icontains=q)
    if hotel_id:
        invs = invs.filter(hotel_id=hotel_id)
    for inv in invs[:5]:
        results.append({"type": "invoice", "icon": "file",
                        "label": inv.number,
                        "sublabel": f"{inv.guest.full_name} · {inv.get_status_display()}",
                        "route": "/invoices"})

    return Response({"results": results})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def night_audit_run(request):
    """تشغيل التدقيق الليلي — رصد المتخلفين + لقطة إغلاق اليوم."""
    from apps.billing.models import Payment
    from .models import NightAudit
    from .serializers import NightAuditSerializer
    hotel_id = request.data.get("hotel")
    today = timezone.localdate()

    reservations = Reservation.objects.all()
    rooms = Room.objects.filter(is_active=True)
    payments = Payment.objects.filter(paid_at__date=today)
    if hotel_id:
        reservations = reservations.filter(hotel_id=hotel_id)
        rooms = rooms.filter(hotel_id=hotel_id)
        payments = payments.filter(invoice__hotel_id=hotel_id)

    # 1) رصد من لم يحضر: حجوزات مؤكدة/معلقة مضى موعد وصولها ولم تُسجّل دخول
    no_show_qs = reservations.filter(
        check_in__lt=today,
        status__in=[Reservation.Status.CONFIRMED, Reservation.Status.PENDING])
    no_shows = no_show_qs.count()
    for r in no_show_qs:
        r.status = Reservation.Status.NO_SHOW
        r.save()
        for rr in r.rooms.all():
            if rr.room.status in (Room.Status.RESERVED,):
                rr.room.status = Room.Status.AVAILABLE
                rr.room.save()

    # 2) لقطة اليوم
    total_rooms = rooms.count() or 1
    rooms_sold = sum(r.rooms.count() for r in reservations.filter(
        status=Reservation.Status.CHECKED_IN, check_in__lte=today, check_out__gt=today))
    occupancy = round(rooms_sold / total_rooms * 100, 1)
    revenue = float(payments.aggregate(s=Sum("amount"))["s"] or 0)
    from apps.billing.models import Charge
    room_charges = Charge.objects.filter(kind=Charge.Kind.ROOM, created_at__date=today)
    if hotel_id:
        room_charges = room_charges.filter(invoice__hotel_id=hotel_id)
    room_rev = float(sum((c.total for c in room_charges), Decimal("0")))
    adr = round(room_rev / rooms_sold, 2) if rooms_sold else 0
    revpar = round(room_rev / total_rooms, 2)
    arrivals = reservations.filter(check_in=today).exclude(
        status__in=[Reservation.Status.CANCELLED, Reservation.Status.NO_SHOW]).count()
    departures = reservations.filter(check_out=today, status=Reservation.Status.CHECKED_OUT).count()

    audit = NightAudit.objects.create(
        hotel_id=hotel_id or None, business_date=today,
        total_rooms=rooms.count(), rooms_sold=rooms_sold, occupancy=occupancy,
        adr=adr, revpar=revpar, revenue=revenue, arrivals=arrivals,
        departures=departures, no_shows=no_shows,
        run_by=request.user if request.user.is_authenticated else None)
    return Response(NightAuditSerializer(audit).data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def night_audit_history(request):
    from .models import NightAudit
    from .serializers import NightAuditSerializer
    qs = NightAudit.objects.all()
    hotel_id = request.query_params.get("hotel")
    if hotel_id:
        qs = qs.filter(hotel_id=hotel_id)
    return Response(NightAuditSerializer(qs[:30], many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def board(request):
    """الشاشة الرئيسية بنمط OPERA — توافر الغرف، توقعات اليوم، الوصول/المقيمون/المغادرات."""
    from apps.hotels.models import RoomType
    from apps.billing.models import Charge
    hotel_id = request.query_params.get("hotel")
    today = timezone.localdate()

    rooms = Room.objects.filter(is_active=True)
    reservations = Reservation.objects.all()
    room_types = RoomType.objects.filter(is_active=True)
    payments = Payment.objects.all()
    charges = Charge.objects.all()
    if hotel_id:
        rooms = rooms.filter(hotel_id=hotel_id)
        reservations = reservations.filter(hotel_id=hotel_id)
        room_types = room_types.filter(hotel_id=hotel_id)
        payments = payments.filter(invoice__hotel_id=hotel_id)
        charges = charges.filter(invoice__hotel_id=hotel_id)

    total_rooms = rooms.count()
    ACTIVE = [Reservation.Status.PENDING, Reservation.Status.CONFIRMED, Reservation.Status.CHECKED_IN]

    def sold_on(d):
        """عدد الغرف المباعة (محجوزة/مشغولة) بتاريخ."""
        res = reservations.filter(status__in=ACTIVE, check_in__lte=d, check_out__gt=d)
        return sum(r.rooms.count() for r in res)

    # 1) ملخص توافر الغرف — 3 أيام
    availability = []
    for i in range(3):
        d = today + timedelta(days=i)
        sold = sold_on(d)
        availability.append({"date": d.isoformat(), "sold": sold,
                             "total": total_rooms, "available": max(total_rooms - sold, 0)})

    # 2) التوافر حسب نوع الغرفة (اليوم)
    room_type_avail = []
    for rt in room_types:
        rt_rooms = rt.rooms.filter(is_active=True).count()
        rt_sold = sum(r.rooms.filter(room_type=rt).count()
                      for r in reservations.filter(status__in=ACTIVE, check_in__lte=today, check_out__gt=today))
        room_type_avail.append({"code": rt.code or rt.name_ar[:6], "name": rt.name_ar,
                                "available": max(rt_rooms - rt_sold, 0), "sold": rt_sold, "total": rt_rooms})

    # 3) توقعات اليوم — أفراد / مجموعات / مشغول الليلة
    tonight = reservations.filter(status__in=ACTIVE, check_in__lte=today, check_out__gt=today)
    ind = tonight.filter(block__isnull=True)
    blk = tonight.filter(block__isnull=False)
    def rp(qs):
        r = sum(x.rooms.count() for x in qs)
        p = sum(x.adults + x.children for x in qs)
        v = sum(1 for x in qs if x.guest.is_vip)
        return {"rooms": r, "persons": p, "vip": v}
    occ_tonight = tonight.filter(status=Reservation.Status.CHECKED_IN)

    # بلوكات لم تُسحب
    from apps.reservations.models import GroupBlock
    blocks = GroupBlock.objects.filter(status__in=["tentative", "confirmed"],
                                       check_in__lte=today, check_out__gt=today)
    if hotel_id:
        blocks = blocks.filter(hotel_id=hotel_id)
    not_picked = sum(max(b.total_rooms - b.picked_up, 0) for b in blocks)

    occupied_rooms = sum(x.rooms.count() for x in occ_tonight)
    pct_occ = round(occupied_rooms / total_rooms * 100, 2) if total_rooms else 0
    min_available = min((a["available"] for a in availability), default=0)

    room_revenue = float(sum((c.total for c in charges.filter(kind=Charge.Kind.ROOM, created_at__date=today)), Decimal("0")))
    total_revenue = float(sum((c.total for c in charges.filter(created_at__date=today)), Decimal("0")))
    rooms_sold_today = sold_on(today)
    adr = round(room_revenue / rooms_sold_today, 2) if rooms_sold_today else 0
    revpar = round(room_revenue / total_rooms, 2) if total_rooms else 0

    # 4) الوصول / المقيمون / المغادرات (غرف + أشخاص)
    def counts(qs):
        return {"rooms": sum(x.rooms.count() for x in qs),
                "adults": sum(x.adults for x in qs),
                "children": sum(x.children for x in qs)}
    arrivals_exp = reservations.filter(check_in=today, status__in=[Reservation.Status.CONFIRMED, Reservation.Status.PENDING])
    arrivals_done = reservations.filter(check_in=today, status=Reservation.Status.CHECKED_IN)
    in_house = reservations.filter(status=Reservation.Status.CHECKED_IN)
    dep_exp = reservations.filter(check_out=today, status=Reservation.Status.CHECKED_IN)
    dep_done = reservations.filter(check_out=today, status=Reservation.Status.CHECKED_OUT)

    return Response({
        "date": today.isoformat(),
        "availability": availability,
        "room_type_availability": room_type_avail,
        "projections": {
            "individuals": rp(ind), "blocks": rp(blk), "occupied_tonight": rp(occ_tonight),
            "block_rooms_not_picked_up": not_picked,
            "percent_occupied": pct_occ,
            "min_available": min_available,
            "room_revenue": room_revenue, "total_revenue": total_revenue,
            "adr": adr, "revpar": revpar,
        },
        "arrivals": {"expected": arrivals_exp.count(), "arrived": arrivals_done.count(), **counts(arrivals_exp)},
        "in_house": {"rooms": occupied_rooms, **counts(in_house)},
        "departures": {"expected": dep_exp.count(), "checked_out": dep_done.count(), **counts(dep_done)},
    })
