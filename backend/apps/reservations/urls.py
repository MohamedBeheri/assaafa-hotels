from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ReservationViewSet, ReservationRoomViewSet, quote

router = DefaultRouter()
router.register("reservations", ReservationViewSet)
router.register("reservation-rooms", ReservationRoomViewSet)
urlpatterns = [path("reservations-quote/", quote)] + router.urls
