from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Reservation, ReservationRoom, Deposit, GroupBlock, FixedCharge
from .serializers import (ReservationSerializer, ReservationRoomSerializer,
                          GroupBlockSerializer)
from apps.hotels.models import Room
from apps.billing.models import Invoice, Charge


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related("hotel", "guest").prefetch_related("rooms").all()
    serializer_class = ReservationSerializer
    filterset_fields = ["hotel", "status", "source", "guest"]
    search_fields = ["code", "guest__first_name", "guest__last_name", "guest__phone"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    @action(detail=True, methods=["post"])
    def check_in(self, request, pk=None):
        res = self.get_object()
        res.status = Reservation.Status.CHECKED_IN
        res.actual_check_in = timezone.now()
        res.save()
        for rr in res.rooms.all():
            rr.room.status = Room.Status.OCCUPIED
            rr.room.save()
        self._ensure_invoice(res)
        self._apply_deposits(res)
        self._post_fixed_charges(res)
        return Response(ReservationSerializer(res).data)

    @action(detail=True, methods=["post"])
    def check_out(self, request, pk=None):
        res = self.get_object()
        res.status = Reservation.Status.CHECKED_OUT
        res.actual_check_out = timezone.now()
        res.save()
        for rr in res.rooms.all():
            rr.room.status = Room.Status.AVAILABLE
            rr.room.hk_status = Room.HKStatus.DIRTY
            rr.room.save()
        return Response(ReservationSerializer(res).data)

    @action(detail=True, methods=["post"])
    def add_deposit(self, request, pk=None):
        """تسجيل عربون على الحجز."""
        res = self.get_object()
        from decimal import Decimal
        try:
            amount = Decimal(str(request.data.get("amount")))
        except Exception:
            return Response({"detail": "مبلغ غير صحيح"}, status=400)
        user = request.user if request.user.is_authenticated else None
        Deposit.objects.create(
            reservation=res, amount=amount,
            method=request.data.get("method", "cash"),
            reference=request.data.get("reference", ""), received_by=user)
        # لو الفاتورة موجودة بالفعل، طبّق العربون فوراً كدفعة
        if hasattr(res, "invoice"):
            self._apply_deposits(res)
        return Response(ReservationSerializer(res).data)

    def _apply_deposits(self, res):
        """يحوّل العرابين غير المطبّقة لدفعات على الفاتورة."""
        from apps.billing.models import Payment, Invoice
        if not hasattr(res, "invoice"):
            return
        inv = res.invoice
        for dep in res.deposits.filter(applied=False, is_refunded=False):
            Payment.objects.create(invoice=inv, amount=dep.amount, method=dep.method,
                                   reference=f"عربون {dep.reference}".strip())
            dep.applied = True
            dep.save()
        if inv.balance <= 0 and inv.paid_amount > 0:
            inv.status = Invoice.Status.PAID
        elif inv.paid_amount > 0:
            inv.status = Invoice.Status.PARTIAL
        inv.save()

    @action(detail=True, methods=["post"])
    def add_fixed_charge(self, request, pk=None):
        """إضافة رسم ثابت متكرر للحجز."""
        from decimal import Decimal
        res = self.get_object()
        try:
            amount = Decimal(str(request.data.get("amount")))
        except Exception:
            return Response({"detail": "مبلغ غير صحيح"}, status=400)
        FixedCharge.objects.create(
            reservation=res, description=request.data.get("description", "رسم ثابت"),
            amount=amount, frequency=request.data.get("frequency", "daily"),
            transaction_code_id=request.data.get("transaction_code") or None)
        return Response(ReservationSerializer(res).data)

    def _post_fixed_charges(self, res, on_date=None):
        """يرحّل الرسوم الثابتة المستحقة على فاتورة الحجز."""
        from apps.billing.models import Charge
        from django.utils import timezone as _tz
        d = on_date or _tz.localdate()
        if not hasattr(res, "invoice"):
            return
        inv = res.invoice
        for fc in res.fixed_charges.filter(is_active=True):
            due = False
            if fc.frequency == "daily":
                due = fc.last_posted != d
            elif fc.frequency == "weekly":
                due = fc.last_posted is None or (d - fc.last_posted).days >= 7
            elif fc.frequency == "once":
                due = fc.last_posted is None
            if due:
                Charge.objects.create(
                    invoice=inv, kind=Charge.Kind.SERVICE, description=fc.description,
                    transaction_code=fc.transaction_code, quantity=1, unit_price=fc.amount)
                fc.last_posted = d
                fc.save()

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        res = self.get_object()
        res.status = Reservation.Status.CANCELLED
        res.save()
        for rr in res.rooms.all():
            if rr.room.status in (Room.Status.RESERVED, Room.Status.OCCUPIED):
                rr.room.status = Room.Status.AVAILABLE
                rr.room.save()
        return Response(ReservationSerializer(res).data)

    def _ensure_invoice(self, res):
        if hasattr(res, "invoice"):
            return res.invoice
        inv = Invoice.objects.create(
            hotel=res.hotel, reservation=res, guest=res.guest,
            vat_rate=res.hotel.vat_rate, bill_to_company=res.company)
        for rr in res.rooms.all():
            Charge.objects.create(
                invoice=inv, kind=Charge.Kind.ROOM,
                description=f"إقامة غرفة {rr.room.number} ({res.nights} ليلة)",
                quantity=res.nights, unit_price=rr.rate_per_night)
        for rs in res.services.all():
            Charge.objects.create(
                invoice=inv, kind=Charge.Kind.SERVICE,
                description=rs.service.name_ar,
                quantity=rs.quantity, unit_price=rs.unit_price)
        return inv


class ReservationRoomViewSet(viewsets.ModelViewSet):
    queryset = ReservationRoom.objects.all()
    serializer_class = ReservationRoomSerializer
    filterset_fields = ["reservation", "room"]


from datetime import timedelta, date as date_cls
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.hotels.models import RoomType


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quote(request):
    """تسعير حجز — متوسط سعر الليلة بمراعاة الأسعار الموسمية.
    ?room_type=<id>&check_in=YYYY-MM-DD&check_out=YYYY-MM-DD"""
    try:
        rt = RoomType.objects.get(pk=request.query_params.get("room_type"))
        check_in = date_cls.fromisoformat(request.query_params.get("check_in"))
        check_out = date_cls.fromisoformat(request.query_params.get("check_out"))
    except (RoomType.DoesNotExist, TypeError, ValueError):
        return Response({"detail": "معاملات غير صحيحة"}, status=400)
    nights = max((check_out - check_in).days, 1)
    prices = [rt.price_for(check_in + timedelta(days=i)) for i in range(nights)]
    total = sum(prices)
    return Response({
        "nights": nights,
        "avg_rate": round(float(total) / nights, 2),
        "total": float(total),
        "nightly": [{"date": (check_in + timedelta(days=i)).isoformat(), "price": float(p)}
                    for i, p in enumerate(prices)],
    })


class GroupBlockViewSet(viewsets.ModelViewSet):
    queryset = GroupBlock.objects.select_related("hotel", "company").prefetch_related("block_rooms").all()
    serializer_class = GroupBlockSerializer
    filterset_fields = ["hotel", "status", "company"]
    search_fields = ["name"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    @action(detail=True, methods=["post"])
    def pickup(self, request, pk=None):
        """سحب غرفة من البلوك: إنشاء حجز فردي لنزيل ضمن المجموعة."""
        block = self.get_object()
        from apps.guests.models import Guest
        try:
            guest = Guest.objects.get(pk=request.data.get("guest"))
            block_room = block.block_rooms.get(pk=request.data.get("block_room"))
        except (Guest.DoesNotExist, Exception):
            return Response({"detail": "بيانات غير صحيحة"}, status=400)
        # أول غرفة متاحة من النوع
        from apps.hotels.models import Room
        taken = ReservationRoom.objects.filter(
            reservation__hotel=block.hotel,
            reservation__status__in=[Reservation.Status.PENDING, Reservation.Status.CONFIRMED, Reservation.Status.CHECKED_IN],
            reservation__check_in__lt=block.check_out,
            reservation__check_out__gt=block.check_in,
        ).values_list("room_id", flat=True)
        room = (block_room.room_type.rooms.filter(is_active=True)
                .exclude(status__in=[Room.Status.MAINTENANCE, Room.Status.BLOCKED])
                .exclude(id__in=list(taken)).first())
        if not room:
            return Response({"detail": "لا توجد غرف متاحة من هذا النوع"}, status=409)
        res = Reservation.objects.create(
            hotel=block.hotel, guest=guest, company=block.company, block=block,
            check_in=block.check_in, check_out=block.check_out,
            status=Reservation.Status.CONFIRMED, source=Reservation.Source.WALK_IN)
        ReservationRoom.objects.create(
            reservation=res, room=room, room_type=block_room.room_type,
            rate_per_night=block_room.rate_per_night)
        room.status = Room.Status.RESERVED
        room.save()
        return Response(ReservationSerializer(res).data, status=201)
