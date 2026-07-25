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

    @action(detail=True, methods=["post"])
    def transfer_charge(self, request, pk=None):
        """نقل بند إلى نافذة أخرى (تقسيم الفوليو)."""
        inv = self.get_object()
        try:
            charge = inv.charges.get(pk=request.data.get("charge"))
        except Charge.DoesNotExist:
            return Response({"detail": "بند غير موجود"}, status=400)
        window = int(request.data.get("window", 1))
        charge.window = max(1, min(window, 4))
        charge.save()
        return Response(InvoiceSerializer(inv).data)

    @action(detail=True, methods=["post"])
    def route_to_company(self, request, pk=None):
        """توجيه الفاتورة لحساب شركة/وكيل آجل (AR)."""
        from apps.guests.models import Company
        inv = self.get_object()
        cid = request.data.get("company")
        if cid in (None, "", "null"):
            inv.bill_to_company = None
        else:
            try:
                inv.bill_to_company = Company.objects.get(pk=cid)
            except Company.DoesNotExist:
                return Response({"detail": "شركة غير موجودة"}, status=400)
        inv.save()
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


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def accounts_receivable(request):
    """دفتر المدينة (City Ledger) — أرصدة الشركات ووكلاء السياحة الآجلة."""
    from apps.guests.models import Company
    data = []
    for c in Company.objects.filter(is_active=True):
        inv_qs = c.ar_invoices.exclude(status=Invoice.Status.VOID)
        open_invs = [i for i in inv_qs if i.balance > 0]
        outstanding = float(sum((i.balance for i in open_invs), 0))
        if not open_invs and c.kind != Company.Kind.TRAVEL_AGENT:
            # اعرض الشركات اللي عليها رصيد فقط، لكن ابقِ الوكلاء دائماً
            if outstanding == 0:
                continue
        data.append({
            "id": c.id, "name": c.name, "kind": c.kind,
            "kind_display": c.get_kind_display(),
            "credit_limit": float(c.credit_limit),
            "outstanding": outstanding,
            "over_limit": bool(c.credit_limit and outstanding > float(c.credit_limit)),
            "invoices": [{"id": i.id, "number": i.number, "guest": i.guest.full_name,
                          "total": float(i.total), "balance": float(i.balance),
                          "issued_at": i.issued_at.date().isoformat()} for i in open_invs],
        })
    data.sort(key=lambda x: -x["outstanding"])
    total_ar = sum(d["outstanding"] for d in data)
    return Response({"total_ar": total_ar, "companies": data})
