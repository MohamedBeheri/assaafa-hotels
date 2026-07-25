from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Reservation, ReservationRoom
from .serializers import ReservationSerializer, ReservationRoomSerializer
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
        return Response(ReservationSerializer(res).data)

    @action(detail=True, methods=["post"])
    def check_out(self, request, pk=None):
        res = self.get_object()
        res.status = Reservation.Status.CHECKED_OUT
        res.actual_check_out = timezone.now()
        res.save()
        for rr in res.rooms.all():
            rr.room.status = Room.Status.CLEANING
            rr.room.save()
        return Response(ReservationSerializer(res).data)

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
