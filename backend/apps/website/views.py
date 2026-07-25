"""واجهة الموقع العام — endpoints بدون مصادقة لحجز النزلاء أونلاين."""
from datetime import date as date_cls, timedelta
from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.hotels.models import Hotel, Room, RoomType, Service
from apps.reservations.models import ReservationService
from apps.guests.models import Guest, GuestDocument
from apps.reservations.models import Reservation, ReservationRoom

ACTIVE_STATUSES = [Reservation.Status.PENDING, Reservation.Status.CONFIRMED,
                   Reservation.Status.CHECKED_IN]


import os
from django.conf import settings


@api_view(["GET"])
@permission_classes([AllowAny])
def site(request):
    """محتوى الموقع العام: بانرات متحركة، جاليري، تواصل."""
    def media_list(sub):
        d = settings.MEDIA_ROOT / "site" / sub
        if not d.exists():
            return []
        files = sorted(d.iterdir(), key=lambda f: (len(f.name), f.name))
        return [request.build_absolute_uri(settings.MEDIA_URL + f"site/{sub}/{f.name}")
                for f in files if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
    return Response({
        "banners": media_list("banner"),
        "gallery": media_list("gallery"),
        "hotel_cards": {
            "SF": request.build_absolute_uri(settings.MEDIA_URL + "site/hotels/sf-card.jpg"),
            "SFG": request.build_absolute_uri(settings.MEDIA_URL + "site/hotels/sfg-card.jpg"),
        },
        "about_photos": media_list("hotels")[:3],
        "contact": {
            "phones": ["920022549", "920022573"],
            "email": "info@assaafahotels.com",
            "location_ar": "المدينة المنورة — 500 متر من المسجد النبوي الشريف",
            "location_en": "Madinah — 500m from the Prophet's Mosque",
        },
        "stats": {"rooms": 135, "distance_m": 500, "dining": "24/7"},
    })


def _photos(request, rt):
    return [request.build_absolute_uri(p.image.url) for p in rt.photos.all()]


@api_view(["GET"])
@permission_classes([AllowAny])
def hotels(request):
    """قائمة الفنادق مع أنواع الغرف والخدمات — للعرض العام."""
    data = []
    for h in Hotel.objects.filter(is_active=True):
        data.append({
            "id": h.id, "code": h.code,
            "name_ar": h.name_ar, "name_en": h.name_en,
            "address": h.address, "phone": h.phone,
            "star_rating": h.star_rating, "vat_rate": float(h.vat_rate),
            "check_in_time": str(h.check_in_time)[:5],
            "check_out_time": str(h.check_out_time)[:5],
            "room_types": [{
                "id": rt.id, "name_ar": rt.name_ar, "name_en": rt.name_en,
                "base_price": float(rt.base_price),
                "max_adults": rt.max_adults, "max_children": rt.max_children,
                "description": rt.description,
                "photos": _photos(request, rt),
                "amenities": [{"name_ar": a.name_ar, "name_en": a.name_en, "icon": a.icon}
                              for a in rt.amenities.all()],
            } for rt in h.room_types.filter(is_active=True)],
            "services": [{"id": s.id, "name_ar": s.name_ar, "name_en": s.name_en,
                          "price": float(s.price), "icon": s.icon}
                         for s in h.services.filter(is_active=True)],
        })
    return Response(data)


def _availability(request, hotel, check_in, check_out, adults):
    """أنواع الغرف المتاحة بالفترة مع السعر الموسمي."""
    nights = max((check_out - check_in).days, 1)
    overlapping = ReservationRoom.objects.filter(
        reservation__hotel=hotel,
        reservation__status__in=ACTIVE_STATUSES,
        reservation__check_in__lt=check_out,
        reservation__check_out__gt=check_in,
    ).values_list("room_id", flat=True)

    result = []
    for rt in hotel.room_types.filter(is_active=True, max_adults__gte=adults):
        rooms_qs = rt.rooms.filter(is_active=True).exclude(
            status__in=[Room.Status.MAINTENANCE, Room.Status.BLOCKED])
        free = rooms_qs.exclude(id__in=overlapping).count()
        prices = [rt.price_for(check_in + timedelta(days=i)) for i in range(nights)]
        total = sum(prices)
        vat = (total * hotel.vat_rate / Decimal("100")).quantize(Decimal("0.01"))
        result.append({
            "room_type": rt.id, "name_ar": rt.name_ar, "name_en": rt.name_en,
            "description": rt.description,
            "photos": _photos(request, rt),
            "max_adults": rt.max_adults, "max_children": rt.max_children,
            "amenities": [{"name_ar": a.name_ar, "name_en": a.name_en, "icon": a.icon}
                          for a in rt.amenities.all()],
            "available": free,
            "nights": nights,
            "avg_rate": round(float(total) / nights, 2),
            "subtotal": float(total),
            "vat": float(vat),
            "total": float(total + vat),
        })
    return result


@api_view(["GET"])
@permission_classes([AllowAny])
def availability(request):
    """?hotel=&check_in=&check_out=&adults="""
    try:
        hotel = Hotel.objects.get(pk=request.query_params.get("hotel"), is_active=True)
        check_in = date_cls.fromisoformat(request.query_params.get("check_in"))
        check_out = date_cls.fromisoformat(request.query_params.get("check_out"))
        adults = int(request.query_params.get("adults", 1))
    except (Hotel.DoesNotExist, TypeError, ValueError):
        return Response({"detail": "معاملات غير صحيحة"}, status=400)
    if check_in >= check_out or check_in < date_cls.today():
        return Response({"detail": "تواريخ غير صالحة"}, status=400)
    return Response({
        "hotel": hotel.id,
        "nights": max((check_out - check_in).days, 1),
        "room_types": _availability(request, hotel, check_in, check_out, adults),
    })


@api_view(["POST"])
@permission_classes([AllowAny])
@transaction.atomic
def book(request):
    """إنشاء حجز أونلاين: hotel, room_type, check_in, check_out, adults,
    children, first_name, last_name, phone, email, id_number, notes"""
    d = request.data
    try:
        hotel = Hotel.objects.get(pk=d.get("hotel"), is_active=True)
        check_in = date_cls.fromisoformat(d.get("check_in"))
        check_out = date_cls.fromisoformat(d.get("check_out"))
        adults = int(d.get("adults", 1))
        children = int(d.get("children", 0))
    except (Hotel.DoesNotExist, TypeError, ValueError):
        return Response({"detail": "بيانات غير صحيحة"}, status=400)

    # طلب الغرف: فردي room_type أو مجموعة rooms=[{room_type, qty}]
    rooms_req = d.get("rooms")
    if isinstance(rooms_req, str):
        import json as _json
        try:
            rooms_req = _json.loads(rooms_req)
        except ValueError:
            rooms_req = None
    if not rooms_req:
        rooms_req = [{"room_type": d.get("room_type"), "qty": 1}]
    try:
        rooms_req = [{"rt": RoomType.objects.get(pk=r.get("room_type"), hotel=hotel, is_active=True),
                      "qty": max(int(r.get("qty", 1)), 1)}
                     for r in rooms_req if int(r.get("qty", 1)) > 0]
    except (RoomType.DoesNotExist, TypeError, ValueError):
        return Response({"detail": "نوع غرفة غير صحيح"}, status=400)
    if not rooms_req:
        return Response({"detail": "اختر غرفة واحدة على الأقل"}, status=400)
    if check_in >= check_out or check_in < date_cls.today():
        return Response({"detail": "تواريخ غير صالحة"}, status=400)
    first_name = (d.get("first_name") or "").strip()
    phone = (d.get("phone") or "").strip()
    nationality = (d.get("nationality") or "").strip()
    id_type = (d.get("id_type") or "").strip()
    id_number = (d.get("id_number") or "").strip()
    if not first_name or not phone:
        return Response({"detail": "الاسم والجوال مطلوبان"}, status=400)
    if not nationality:
        return Response({"detail": "الجنسية مطلوبة"}, status=400)
    valid_id_types = [c[0] for c in Guest.IDType.choices]
    if id_type not in valid_id_types:
        return Response({"detail": "اختر نوع إثبات الهوية"}, status=400)
    if not id_number:
        return Response({"detail": "رقم الإثبات مطلوب"}, status=400)

    # تخصيص الغرف المطلوبة (قفل صفوف لمنع الحجز المزدوج)
    overlapping = list(ReservationRoom.objects.filter(
        reservation__hotel=hotel,
        reservation__status__in=ACTIVE_STATUSES,
        reservation__check_in__lt=check_out,
        reservation__check_out__gt=check_in,
    ).values_list("room_id", flat=True))
    allocated = []  # [(room, rt)]
    for req in rooms_req:
        rt = req["rt"]
        free = list(rt.rooms.select_for_update()
                    .filter(is_active=True)
                    .exclude(status__in=[Room.Status.MAINTENANCE, Room.Status.BLOCKED])
                    .exclude(id__in=overlapping)[:req["qty"]])
        if len(free) < req["qty"]:
            return Response({"detail": f"غرف {rt.name_ar} المتاحة غير كافية (متاح {len(free)})"}, status=409)
        for room in free:
            allocated.append((room, rt))
            overlapping.append(room.id)

    guest, created = Guest.objects.get_or_create(
        phone=phone,
        defaults={"first_name": first_name,
                  "last_name": (d.get("last_name") or "").strip(),
                  "email": (d.get("email") or "").strip(),
                  "nationality": nationality,
                  "id_type": id_type,
                  "id_number": id_number})
    if not created:
        # تحديث ملف العميل بأحدث بيانات الإثبات
        guest.nationality = nationality
        guest.id_type = id_type
        guest.id_number = id_number
        guest.save()

    # رفع صورة الإثبات إن وُجدت (multipart)
    doc_file = request.FILES.get("id_document")
    if doc_file:
        kind = GuestDocument.Kind.PASSPORT if id_type.startswith("passport") else GuestDocument.Kind.ID
        GuestDocument.objects.create(
            guest=guest, kind=kind, file=doc_file,
            note=f"رفع أونلاين مع الحجز — {dict(Guest.IDType.choices)[id_type]}")

    nights = max((check_out - check_in).days, 1)

    # الخدمات الإضافية المختارة [{id, qty}] — قائمة أو نص JSON (multipart)
    services_req = d.get("services") or []
    if isinstance(services_req, str):
        import json as _json
        try:
            services_req = _json.loads(services_req)
        except ValueError:
            services_req = []
    services_rows = []
    for s in services_req:
        try:
            svc = Service.objects.get(pk=s.get("id"), hotel=hotel, is_active=True)
            qty = max(int(s.get("qty", 1)), 1)
            services_rows.append((svc, qty))
        except (Service.DoesNotExist, TypeError, ValueError):
            continue

    res = Reservation.objects.create(
        hotel=hotel, guest=guest, check_in=check_in, check_out=check_out,
        adults=adults, children=children,
        status=Reservation.Status.PENDING, source=Reservation.Source.ONLINE,
        special_requests=(d.get("notes") or "").strip())
    room_subtotal = Decimal("0")
    for room, rt in allocated:
        prices = [rt.price_for(check_in + timedelta(days=i)) for i in range(nights)]
        avg_rate = (sum(prices) / nights).quantize(Decimal("0.01"))
        room_subtotal += sum(prices)
        ReservationRoom.objects.create(
            reservation=res, room=room, room_type=rt, rate_per_night=avg_rate)
    for svc, qty in services_rows:
        ReservationService.objects.create(
            reservation=res, service=svc, quantity=qty, unit_price=svc.price)

    services_subtotal = sum((svc.price * qty for svc, qty in services_rows), Decimal("0"))
    subtotal = room_subtotal + services_subtotal
    vat = (subtotal * hotel.vat_rate / Decimal("100")).quantize(Decimal("0.01"))
    return Response({
        "code": res.code,
        "hotel": hotel.name_ar,
        "rooms": [{"type": rt.name_ar, "number": room.number} for room, rt in allocated],
        "rooms_count": len(allocated),
        "adults": adults, "children": children,
        "check_in": check_in.isoformat(),
        "check_out": check_out.isoformat(),
        "nights": nights,
        "room_subtotal": float(room_subtotal),
        "services": [{"name": svc.name_ar, "qty": qty, "total": float(svc.price * qty)}
                     for svc, qty in services_rows],
        "services_subtotal": float(services_subtotal),
        "subtotal": float(subtotal),
        "vat": float(vat),
        "total": float(subtotal + vat),
    }, status=201)


@api_view(["GET"])
@permission_classes([AllowAny])
def lookup(request):
    """الاستعلام عن حجز بالكود + الجوال."""
    code = (request.query_params.get("code") or "").strip()
    phone = (request.query_params.get("phone") or "").strip()
    try:
        res = Reservation.objects.get(code__iexact=code, guest__phone=phone)
    except Reservation.DoesNotExist:
        return Response({"detail": "لم يتم العثور على الحجز"}, status=404)
    return Response({
        "code": res.code, "hotel": res.hotel.name_ar,
        "guest": res.guest.full_name,
        "status": res.status, "status_display": res.get_status_display(),
        "check_in": res.check_in.isoformat(), "check_out": res.check_out.isoformat(),
        "nights": res.nights,
        "rooms": [{"type": rr.room_type.name_ar, "rate": float(rr.rate_per_night)}
                  for rr in res.rooms.all()],
        "services": [{"name": rs.service.name_ar, "qty": rs.quantity, "total": float(rs.total)}
                     for rs in res.services.all()],
        "total": float(res.rooms_total + sum((rs.total for rs in res.services.all()), Decimal("0"))),
    })
