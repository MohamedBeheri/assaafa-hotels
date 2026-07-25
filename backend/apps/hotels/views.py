from rest_framework import viewsets
from .models import Hotel, Floor, Amenity, RoomType, Room
from .serializers import (HotelSerializer, FloorSerializer, AmenitySerializer,
                          RoomTypeSerializer, RoomSerializer)


class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    filterset_fields = ["is_active"]
    search_fields = ["name_ar", "name_en", "code"]


class FloorViewSet(viewsets.ModelViewSet):
    queryset = Floor.objects.all()
    serializer_class = FloorSerializer
    filterset_fields = ["hotel"]


class AmenityViewSet(viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer


class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomType.objects.select_related("hotel").all()
    serializer_class = RoomTypeSerializer
    filterset_fields = ["hotel", "is_active"]
    search_fields = ["name_ar", "name_en"]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related("hotel", "room_type", "floor").all()
    serializer_class = RoomSerializer
    filterset_fields = ["hotel", "room_type", "floor", "status", "is_active"]
    search_fields = ["number"]


from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SeasonalRate, Service, HousekeepingTask, MaintenanceRequest
from .serializers import (SeasonalRateSerializer, ServiceSerializer,
                          HousekeepingTaskSerializer, MaintenanceRequestSerializer)


class SeasonalRateViewSet(viewsets.ModelViewSet):
    queryset = SeasonalRate.objects.select_related("hotel", "room_type").all()
    serializer_class = SeasonalRateSerializer
    filterset_fields = ["hotel", "room_type", "is_active"]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related("hotel").all()
    serializer_class = ServiceSerializer
    filterset_fields = ["hotel", "is_active"]
    search_fields = ["name_ar", "name_en"]


class HousekeepingTaskViewSet(viewsets.ModelViewSet):
    queryset = HousekeepingTask.objects.select_related("room", "hotel", "assigned_to").all()
    serializer_class = HousekeepingTaskSerializer
    filterset_fields = ["hotel", "room", "status", "task_type", "assigned_to"]

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """إنهاء المهمة — لو الغرفة كانت قيد التنظيف تصبح متاحة."""
        task = self.get_object()
        task.status = HousekeepingTask.Status.DONE
        task.completed_at = timezone.now()
        task.save()
        room = task.room
        if room.status == Room.Status.CLEANING:
            room.status = Room.Status.AVAILABLE
            room.save()
        return Response(HousekeepingTaskSerializer(task).data)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        task = self.get_object()
        task.status = HousekeepingTask.Status.IN_PROGRESS
        task.save()
        return Response(HousekeepingTaskSerializer(task).data)


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequest.objects.select_related("room", "hotel").all()
    serializer_class = MaintenanceRequestSerializer
    filterset_fields = ["hotel", "room", "status", "priority"]
    search_fields = ["title"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        req = serializer.save(reported_by=user)
        if req.room and req.priority in (MaintenanceRequest.Priority.HIGH, MaintenanceRequest.Priority.URGENT):
            req.room.status = Room.Status.MAINTENANCE
            req.room.save()

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """إغلاق طلب الصيانة — الغرفة ترجع متاحة لو كانت صيانة."""
        req = self.get_object()
        req.status = MaintenanceRequest.Status.RESOLVED
        req.resolved_at = timezone.now()
        req.save()
        if req.room and req.room.status == Room.Status.MAINTENANCE:
            req.room.status = Room.Status.AVAILABLE
            req.room.save()
        return Response(MaintenanceRequestSerializer(req).data)
