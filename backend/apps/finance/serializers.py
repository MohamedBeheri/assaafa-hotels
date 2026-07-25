from rest_framework import serializers
from .models import ExpenseCategory, Expense, Shift, Employee, Payroll


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = "__all__"


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name_ar", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)

    class Meta:
        model = Expense
        fields = "__all__"


class ShiftSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Shift
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Employee
        fields = "__all__"


class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.user.full_name", read_only=True)
    net = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Payroll
        fields = "__all__"
