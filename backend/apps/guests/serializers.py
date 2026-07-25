from rest_framework import serializers
from .models import Guest, GuestDocument


class GuestDocumentSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True)

    class Meta:
        model = GuestDocument
        fields = "__all__"


class GuestSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    reservations_count = serializers.IntegerField(source="reservations.count", read_only=True)
    id_type_display = serializers.CharField(source="get_id_type_display", read_only=True)
    documents = GuestDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Guest
        fields = "__all__"
