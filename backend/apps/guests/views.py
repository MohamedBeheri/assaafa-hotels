from decimal import Decimal
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Guest, GuestDocument, Company
from .serializers import GuestSerializer, GuestDocumentSerializer, CompanySerializer


class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.prefetch_related("documents").all()
    serializer_class = GuestSerializer
    filterset_fields = ["is_vip", "is_blacklisted", "nationality", "id_type"]
    search_fields = ["first_name", "last_name", "id_number", "phone", "email"]


class GuestDocumentViewSet(viewsets.ModelViewSet):
    queryset = GuestDocument.objects.select_related("guest").all()
    serializer_class = GuestDocumentSerializer
    filterset_fields = ["guest", "kind"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(uploaded_by=user)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filterset_fields = ["kind", "is_active"]
    search_fields = ["name", "tax_number", "phone", "email"]

    @action(detail=True, methods=["post"])
    def settle(self, request, pk=None):
        """تسوية رصيد الشركة — يوزّع المبلغ على الفواتير المفتوحة (الأقدم أولاً)."""
        from apps.billing.models import Payment, Invoice
        company = self.get_object()
        try:
            amount = Decimal(str(request.data.get("amount")))
        except Exception:
            return Response({"detail": "مبلغ غير صحيح"}, status=400)
        method = request.data.get("method", "transfer")
        user = request.user if request.user.is_authenticated else None
        remaining = amount
        allocated = []
        invs = company.ar_invoices.exclude(status=Invoice.Status.VOID).order_by("issued_at")
        for inv in invs:
            if remaining <= 0:
                break
            bal = inv.balance
            if bal <= 0:
                continue
            pay = min(remaining, bal)
            Payment.objects.create(invoice=inv, amount=pay, method=method,
                                   reference=f"تسوية {company.name}", received_by=user)
            remaining -= pay
            if inv.balance <= 0:
                inv.status = Invoice.Status.PAID
            elif inv.paid_amount > 0:
                inv.status = Invoice.Status.PARTIAL
            inv.save()
            allocated.append({"invoice": inv.number, "amount": float(pay)})
        return Response({"allocated": allocated, "unallocated": float(remaining),
                         "outstanding": float(company.outstanding)})

    @action(detail=True, methods=["get"])
    def statement(self, request, pk=None):
        """كشف حساب الشركة — كل الفواتير مع الأرصدة (للطباعة)."""
        company = self.get_object()
        invs = company.ar_invoices.order_by("issued_at")
        rows = [{
            "number": i.number, "guest": i.guest.full_name,
            "issued_at": i.issued_at.date().isoformat(),
            "total": float(i.total), "paid": float(i.paid_amount), "balance": float(i.balance),
            "status": i.get_status_display(),
        } for i in invs]
        return Response({
            "company": {"name": company.name, "kind": company.get_kind_display(),
                        "tax_number": company.tax_number, "phone": company.phone,
                        "credit_limit": float(company.credit_limit)},
            "rows": rows,
            "totals": {
                "total": sum(r["total"] for r in rows),
                "paid": sum(r["paid"] for r in rows),
                "balance": sum(r["balance"] for r in rows),
            },
        })
