from rest_framework import serializers
from .models import Hotel, Floor, Amenity, RoomType, Room


class HotelSerializer(serializers.ModelSerializer):
    rooms_count = serializers.IntegerField(source="rooms.count", read_only=True)

    class Meta:
        model = Hotel
        fields = "__all__"


class FloorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Floor
        fields = "__all__"


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = "__all__"


class RoomTypeSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)
    amenities_detail = AmenitySerializer(source="amenities", many=True, read_only=True)

    class Meta:
        model = RoomType
        fields = "__all__"


class RoomSerializer(serializers.ModelSerializer):
    room_type_name = serializers.CharField(source="room_type.name_ar", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    hk_status_display = serializers.CharField(source="get_hk_status_display", read_only=True)
    base_price = serializers.DecimalField(source="room_type.base_price", max_digits=10,
                                          decimal_places=2, read_only=True)

    class Meta:
        model = Room
        fields = "__all__"


from .models import SeasonalRate, Service, HousekeepingTask, MaintenanceRequest


class SeasonalRateSerializer(serializers.ModelSerializer):
    room_type_name = serializers.CharField(source="room_type.name_ar", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)

    class Meta:
        model = SeasonalRate
        fields = "__all__"


class ServiceSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)

    class Meta:
        model = Service
        fields = "__all__"


class HousekeepingTaskSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source="room.number", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)
    task_type_display = serializers.CharField(source="get_task_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)

    class Meta:
        model = HousekeepingTask
        fields = "__all__"


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source="room.number", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = "__all__"
