from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, ChargeViewSet, PaymentViewSet, CouponViewSet

router = DefaultRouter()
router.register("invoices", InvoiceViewSet)
router.register("charges", ChargeViewSet)
router.register("payments", PaymentViewSet)
router.register("coupons", CouponViewSet)
urlpatterns = router.urls
