from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ExpenseCategory, Expense, Shift, Employee, Payroll
from .serializers import (ExpenseCategorySerializer, ExpenseSerializer,
                          ShiftSerializer, EmployeeSerializer, PayrollSerializer)


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related("category", "hotel").all()
    serializer_class = ExpenseSerializer
    filterset_fields = ["hotel", "category"]
    search_fields = ["description", "vendor"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.select_related("user", "hotel").all()
    serializer_class = ShiftSerializer
    filterset_fields = ["hotel", "user", "is_open"]

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        shift = self.get_object()
        shift.is_open = False
        shift.closed_at = timezone.now()
        shift.closing_balance = request.data.get("closing_balance", shift.opening_balance)
        shift.save()
        return Response(ShiftSerializer(shift).data)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("user").all()
    serializer_class = EmployeeSerializer
    filterset_fields = ["is_active"]


class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.select_related("employee__user").all()
    serializer_class = PayrollSerializer
    filterset_fields = ["employee", "is_paid"]
