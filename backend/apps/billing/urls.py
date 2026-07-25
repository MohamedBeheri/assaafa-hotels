from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (InvoiceViewSet, ChargeViewSet, PaymentViewSet, CouponViewSet,
                    TransactionCodeViewSet, accounts_receivable)

router = DefaultRouter()
router.register("invoices", InvoiceViewSet)
router.register("charges", ChargeViewSet)
router.register("payments", PaymentViewSet)
router.register("coupons", CouponViewSet)
router.register("transaction-codes", TransactionCodeViewSet)
urlpatterns = [path("accounts-receivable/", accounts_receivable)] + router.urls
