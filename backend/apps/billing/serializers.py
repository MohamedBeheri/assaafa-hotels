from rest_framework import serializers
from .models import Invoice, Charge, Payment


class ChargeSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = Charge
        fields = "__all__"


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
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    vat_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"


from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)

    class Meta:
        model = Coupon
        fields = "__all__"
