from rest_framework.routers import DefaultRouter
from .views import GuestViewSet, GuestDocumentViewSet, CompanyViewSet

router = DefaultRouter()
router.register("guests", GuestViewSet)
router.register("guest-documents", GuestDocumentViewSet)
router.register("companies", CompanyViewSet)
urlpatterns = router.urls
