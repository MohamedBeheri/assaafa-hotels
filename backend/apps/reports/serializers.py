from rest_framework import serializers
from .models import NightAudit


class NightAuditSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True, default="كل الفنادق")
    run_by_name = serializers.CharField(source="run_by.full_name", read_only=True)

    class Meta:
        model = NightAudit
        fields = "__all__"
