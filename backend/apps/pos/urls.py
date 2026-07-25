from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, OrderViewSet, OrderItemViewSet

router = DefaultRouter()
router.register("pos-categories", CategoryViewSet)
router.register("products", ProductViewSet)
router.register("orders", OrderViewSet)
router.register("order-items", OrderItemViewSet)
urlpatterns = router.urls
