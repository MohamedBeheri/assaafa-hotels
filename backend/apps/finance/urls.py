from rest_framework.routers import DefaultRouter
from .views import (ExpenseCategoryViewSet, ExpenseViewSet, ShiftViewSet,
                    EmployeeViewSet, PayrollViewSet)

router = DefaultRouter()
router.register("expense-categories", ExpenseCategoryViewSet)
router.register("expenses", ExpenseViewSet)
router.register("shifts", ShiftViewSet)
router.register("employees", EmployeeViewSet)
router.register("payrolls", PayrollViewSet)
urlpatterns = router.urls
