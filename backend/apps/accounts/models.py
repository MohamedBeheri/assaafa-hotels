from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "admin", "مدير عام"
    MANAGER = "manager", "مدير فندق"
    RECEPTION = "reception", "استقبال"
    HOUSEKEEPING = "housekeeping", "تدبير فندقي"
    CASHIER = "cashier", "كاشير"
    ACCOUNTANT = "accountant", "محاسب"
    POS = "pos", "نقطة بيع"


class User(AbstractUser):
    """مستخدم النظام — موظف بدور محدد ومربوط بفندق (أو كل الفنادق للمدير العام)."""
    role = models.CharField("الدور", max_length=20, choices=Role.choices, default=Role.RECEPTION)
    phone = models.CharField("الجوال", max_length=20, blank=True)
    hotel = models.ForeignKey(
        "hotels.Hotel", verbose_name="الفندق", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="staff",
    )
    national_id = models.CharField("رقم الهوية", max_length=30, blank=True)

    class Meta:
        verbose_name = "مستخدم"
        verbose_name_plural = "المستخدمون"

    @property
    def full_name(self):
        return self.get_full_name() or self.username

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"
