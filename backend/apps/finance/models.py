from decimal import Decimal
from django.db import models
from django.utils import timezone


class ExpenseCategory(models.Model):
    name_ar = models.CharField("الاسم", max_length=80)
    name_en = models.CharField("الاسم (EN)", max_length=80, blank=True)

    class Meta:
        verbose_name = "بند مصروف"
        verbose_name_plural = "بنود المصروفات"

    def __str__(self):
        return self.name_ar


class Expense(models.Model):
    """مصروف تشغيلي على مستوى فندق."""
    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.PROTECT, related_name="expenses")
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name="expenses")
    amount = models.DecimalField("المبلغ", max_digits=12, decimal_places=2)
    description = models.CharField("الوصف", max_length=200, blank=True)
    vendor = models.CharField("المورد", max_length=120, blank=True)
    paid_at = models.DateField("التاريخ", default=timezone.now)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    attachment = models.FileField("مرفق", upload_to="expenses/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "مصروف"
        verbose_name_plural = "المصروفات"
        ordering = ["-paid_at"]

    def __str__(self):
        return f"{self.category} - {self.amount}"


class Shift(models.Model):
    """وردية عمل — فتح/إغلاق خزينة لموظف."""
    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.PROTECT, related_name="shifts")
    user = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="shifts")
    opening_balance = models.DecimalField("رصيد الافتتاح", max_digits=12, decimal_places=2, default=0)
    closing_balance = models.DecimalField("رصيد الإغلاق", max_digits=12, decimal_places=2, null=True, blank=True)
    opened_at = models.DateTimeField("وقت الفتح", default=timezone.now)
    closed_at = models.DateTimeField("وقت الإغلاق", null=True, blank=True)
    is_open = models.BooleanField("مفتوحة", default=True)
    notes = models.CharField("ملاحظات", max_length=200, blank=True)

    class Meta:
        verbose_name = "وردية"
        verbose_name_plural = "الورديات"
        ordering = ["-opened_at"]

    def __str__(self):
        return f"وردية {self.user} - {self.opened_at:%Y-%m-%d}"


class Employee(models.Model):
    """بيانات توظيف الموظف للرواتب."""
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="employee")
    job_title = models.CharField("المسمى الوظيفي", max_length=100, blank=True)
    base_salary = models.DecimalField("الراتب الأساسي", max_digits=12, decimal_places=2, default=0)
    hire_date = models.DateField("تاريخ التعيين", null=True, blank=True)
    is_active = models.BooleanField("على رأس العمل", default=True)

    class Meta:
        verbose_name = "موظف"
        verbose_name_plural = "الموظفون"

    def __str__(self):
        return str(self.user)


class Payroll(models.Model):
    """كشف راتب شهري."""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="payrolls")
    month = models.DateField("الشهر")
    base_salary = models.DecimalField("الأساسي", max_digits=12, decimal_places=2, default=0)
    allowances = models.DecimalField("بدلات", max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField("خصومات", max_digits=12, decimal_places=2, default=0)
    is_paid = models.BooleanField("مدفوع", default=False)
    paid_at = models.DateField("تاريخ الصرف", null=True, blank=True)

    class Meta:
        verbose_name = "راتب"
        verbose_name_plural = "الرواتب"
        ordering = ["-month"]

    @property
    def net(self):
        return self.base_salary + self.allowances - self.deductions

    def __str__(self):
        return f"{self.employee} - {self.month:%Y-%m}"
