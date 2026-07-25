from rest_framework import serializers
from .models import Invoice, Charge, Payment, TransactionCode


class ChargeSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    tc_code = serializers.CharField(source="transaction_code.code", read_only=True, default=None)

    class Meta:
        model = Charge
        fields = "__all__"


class WindowSerializer(serializers.Serializer):
    window = serializers.IntegerField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    count = serializers.IntegerField()


class PaymentSerializer(serializers.ModelSerializer):
    method_display = serializers.CharField(source="get_method_display", read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    charges = ChargeSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    guest_name = serializers.CharField(source="guest.full_name", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)
    company_name = serializers.CharField(source="bill_to_company.name", read_only=True, default=None)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    windows = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    vat_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"

    def get_windows(self, obj):
        from collections import defaultdict
        from decimal import Decimal
        agg = defaultdict(lambda: {"total": Decimal("0"), "count": 0})
        for c in obj.charges.all():
            agg[c.window]["total"] += c.total
            agg[c.window]["count"] += 1
        return [{"window": w, "total": float(v["total"]), "count": v["count"]}
                for w, v in sorted(agg.items())]


from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)

    class Meta:
        model = Coupon
        fields = "__all__"


class TransactionCodeSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True, default="كل الفنادق")

    class Meta:
        model = TransactionCode
        fields = "__all__"
