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
