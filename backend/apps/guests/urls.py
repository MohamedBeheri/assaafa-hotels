from rest_framework.routers import DefaultRouter
from .views import GuestViewSet, GuestDocumentViewSet

router = DefaultRouter()
router.register("guests", GuestViewSet)
router.register("guest-documents", GuestDocumentViewSet)
urlpatterns = router.urls
