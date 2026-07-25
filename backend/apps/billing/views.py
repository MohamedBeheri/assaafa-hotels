from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Invoice, Charge, Payment, Coupon
from .serializers import InvoiceSerializer, ChargeSerializer, PaymentSerializer, CouponSerializer
from apps.hotels.models import Service


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("hotel", "guest").prefetch_related("charges", "payments").all()
    serializer_class = InvoiceSerializer
    filterset_fields = ["hotel", "status", "guest"]
    search_fields = ["number", "guest__first_name", "guest__last_name"]

    @action(detail=True, methods=["post"])
    def apply_coupon(self, request, pk=None):
        """تطبيق كوبون خصم على الفاتورة."""
        inv = self.get_object()
        code = (request.data.get("code") or "").strip()
        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response({"detail": "كوبون غير موجود"}, status=400)
        if coupon.hotel_id and coupon.hotel_id != inv.hotel_id:
            return Response({"detail": "الكوبون لا يخص هذا الفندق"}, status=400)
        ok, why = coupon.is_valid()
        if not ok:
            return Response({"detail": why}, status=400)
        inv.discount = coupon.discount_amount(inv.subtotal)
        inv.save()
        coupon.used_count += 1
        coupon.save()
        return Response(InvoiceSerializer(inv).data)

    @action(detail=True, methods=["post"])
    def add_service(self, request, pk=None):
        """إضافة خدمة إضافية كبند على الفاتورة."""
        inv = self.get_object()
        try:
            service = Service.objects.get(pk=request.data.get("service"))
        except Service.DoesNotExist:
            return Response({"detail": "خدمة غير موجودة"}, status=400)
        qty = request.data.get("quantity") or 1
        Charge.objects.create(
            invoice=inv, kind=Charge.Kind.SERVICE,
            description=service.name_ar, quantity=qty, unit_price=service.price)
        return Response(InvoiceSerializer(inv).data)


class ChargeViewSet(viewsets.ModelViewSet):
    queryset = Charge.objects.all()
    serializer_class = ChargeSerializer
    filterset_fields = ["invoice", "kind"]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    filterset_fields = ["invoice", "method"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        payment = serializer.save(received_by=user)
        inv = payment.invoice
        if inv.balance <= 0:
            inv.status = Invoice.Status.PAID
        elif inv.paid_amount > 0:
            inv.status = Invoice.Status.PARTIAL
        inv.save()


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    filterset_fields = ["hotel", "is_active", "kind"]
    search_fields = ["code"]
