from rest_framework import serializers
from .models import Reservation, ReservationRoom
from apps.guests.serializers import GuestSerializer


class ReservationRoomSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source="room.number", read_only=True)
    room_type_name = serializers.CharField(source="room_type.name_ar", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ReservationRoom
        fields = ["id", "reservation", "room", "room_number", "room_type",
                  "room_type_name", "rate_per_night", "subtotal"]
        extra_kwargs = {"reservation": {"required": False}}


class ReservationSerializer(serializers.ModelSerializer):
    rooms = ReservationRoomSerializer(many=True, required=False)
    guest_detail = GuestSerializer(source="guest", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    source_display = serializers.CharField(source="get_source_display", read_only=True)
    nights = serializers.IntegerField(read_only=True)
    rooms_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Reservation
        fields = "__all__"

    def create(self, validated_data):
        rooms = validated_data.pop("rooms", [])
        reservation = Reservation.objects.create(**validated_data)
        for r in rooms:
            ReservationRoom.objects.create(reservation=reservation, **r)
        return reservation

    def update(self, instance, validated_data):
        rooms = validated_data.pop("rooms", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if rooms is not None:
            instance.rooms.all().delete()
            for r in rooms:
                ReservationRoom.objects.create(reservation=instance, **r)
        return instance
