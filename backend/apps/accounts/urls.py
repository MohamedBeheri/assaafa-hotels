from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UserViewSet, me

router = DefaultRouter()
router.register("users", UserViewSet)
urlpatterns = [path("me/", me)] + router.urls
