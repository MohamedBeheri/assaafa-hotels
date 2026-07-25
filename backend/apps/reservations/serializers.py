from rest_framework import serializers
from .models import Reservation, ReservationRoom, Deposit, GroupBlock, BlockRoom
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
    company_name = serializers.CharField(source="company.name", read_only=True, default=None)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    source_display = serializers.CharField(source="get_source_display", read_only=True)
    nights = serializers.IntegerField(read_only=True)
    rooms_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    deposits = serializers.SerializerMethodField()
    deposit_total = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = "__all__"

    def get_deposits(self, obj):
        return [{"id": d.id, "amount": float(d.amount), "method": d.get_method_display(),
                 "reference": d.reference, "is_refunded": d.is_refunded,
                 "paid_at": d.paid_at.isoformat()} for d in obj.deposits.all()]

    def get_deposit_total(self, obj):
        from decimal import Decimal
        return float(sum((d.amount for d in obj.deposits.filter(is_refunded=False)), Decimal("0")))

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


class BlockRoomSerializer(serializers.ModelSerializer):
    room_type_name = serializers.CharField(source="room_type.name_ar", read_only=True)

    class Meta:
        model = BlockRoom
        fields = ["id", "block", "room_type", "room_type_name", "quantity", "rate_per_night"]
        extra_kwargs = {"block": {"required": False}}


class GroupBlockSerializer(serializers.ModelSerializer):
    block_rooms = BlockRoomSerializer(many=True, required=False)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True, default=None)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    nights = serializers.IntegerField(read_only=True)
    total_rooms = serializers.IntegerField(read_only=True)
    picked_up = serializers.IntegerField(read_only=True)

    class Meta:
        model = GroupBlock
        fields = "__all__"

    def create(self, validated_data):
        rooms = validated_data.pop("block_rooms", [])
        block = GroupBlock.objects.create(**validated_data)
        for r in rooms:
            BlockRoom.objects.create(block=block, **r)
        return block

    def update(self, instance, validated_data):
        rooms = validated_data.pop("block_rooms", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if rooms is not None:
            instance.block_rooms.all().delete()
            for r in rooms:
                BlockRoom.objects.create(block=instance, **r)
        return instance
