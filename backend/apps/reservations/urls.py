from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ReservationViewSet, ReservationRoomViewSet, GroupBlockViewSet, quote

router = DefaultRouter()
router.register("reservations", ReservationViewSet)
router.register("reservation-rooms", ReservationRoomViewSet)
router.register("group-blocks", GroupBlockViewSet)
urlpatterns = [path("reservations-quote/", quote)] + router.urls
