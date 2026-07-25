from rest_framework.routers import DefaultRouter
from .views import (HotelViewSet, FloorViewSet, AmenityViewSet,
                    RoomTypeViewSet, RoomViewSet, SeasonalRateViewSet,
                    ServiceViewSet, HousekeepingTaskViewSet, MaintenanceRequestViewSet)

router = DefaultRouter()
router.register("hotels", HotelViewSet)
router.register("floors", FloorViewSet)
router.register("amenities", AmenityViewSet)
router.register("room-types", RoomTypeViewSet)
router.register("rooms", RoomViewSet)
router.register("seasonal-rates", SeasonalRateViewSet)
router.register("services", ServiceViewSet)
router.register("housekeeping", HousekeepingTaskViewSet)
router.register("maintenance", MaintenanceRequestViewSet)
urlpatterns = router.urls
