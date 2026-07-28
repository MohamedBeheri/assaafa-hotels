from decimal import Decimal
from django.db import models
from django.utils import timezone


class Category(models.Model):
    """قسم في قائمة المطعم/الكافيه."""
    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.CASCADE, related_name="pos_categories")
    name_ar = models.CharField("الاسم", max_length=80)
    name_en = models.CharField("الاسم (EN)", max_length=80, blank=True)
    sort = models.PositiveSmallIntegerField("الترتيب", default=0)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "قسم"
        verbose_name_plural = "الأقسام"
        ordering = ["sort"]

    def __str__(self):
        return self.name_ar


class Product(models.Model):
    """صنف قابل للبيع في نقطة البيع."""
    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.CASCADE, related_name="pos_products")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name_ar = models.CharField("الاسم", max_length=120)
    name_en = models.CharField("الاسم (EN)", max_length=120, blank=True)
    sku = models.CharField("الباركود/الكود", max_length=40, blank=True)
    price = models.DecimalField("السعر", max_digits=10, decimal_places=2, default=0)
    photo = models.ImageField("صورة", upload_to="pos/", blank=True, null=True)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "صنف"
        verbose_name_plural = "الأصناف"

    def __str__(self):
        return self.name_ar


class Order(models.Model):
    """طلب في نقطة البيع — يُدفع نقداً أو يُحمّل على غرفة."""
    class Type(models.TextChoices):
        DINE_IN = "dine_in", "محلي"
        TAKEAWAY = "takeaway", "سفري"
        ROOM = "room_service", "خدمة الغرف"

    class Status(models.TextChoices):
        OPEN = "open", "مفتوح"
        PAID = "paid", "مدفوع"
        ROOM_CHARGED = "room_charged", "محمّل على الغرفة"
        VOID = "void", "ملغي"

    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.PROTECT, related_name="pos_orders")
    number = models.CharField("رقم الطلب", max_length=25, unique=True, blank=True)
    order_type = models.CharField("النوع", max_length=15, choices=Type.choices, default=Type.DINE_IN)
    status = models.CharField("الحالة", max_length=15, choices=Status.choices, default=Status.OPEN)
    table_no = models.CharField("رقم الطاولة", max_length=10, blank=True)
    reservation = models.ForeignKey("reservations.Reservation", on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name="pos_orders",
                                    help_text="عند التحميل على غرفة")
    vat_rate = models.DecimalField("الضريبة %", max_digits=5, decimal_places=2, default=15)
    discount = models.DecimalField("الخصم", max_digits=10, decimal_places=2, default=0)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "طلب"
        verbose_name_plural = "طلبات نقطة البيع"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.number:
            base = f"POS-{timezone.now().strftime('%y%m%d%H%M%S')}"
            # ضمان التفرّد حتى لو أُنشئت عدة طلبات في نفس الثانية (البذر/الإنشاء السريع)
            number = base
            n = 0
            while self.__class__.objects.filter(number=number).exclude(pk=self.pk).exists():
                n += 1
                number = f"{base}{n:02d}"[:25]
            self.number = number
        super().save(*args, **kwargs)

    @property
    def subtotal(self):
        return sum((i.total for i in self.items.all()), Decimal("0"))

    @property
    def vat_amount(self):
        return ((self.subtotal - self.discount) * self.vat_rate / Decimal("100")).quantize(Decimal("0.01"))

    @property
    def total(self):
        return self.subtotal - self.discount + self.vat_amount

    def __str__(self):
        return self.number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.DecimalField("الكمية", max_digits=8, decimal_places=2, default=1)
    unit_price = models.DecimalField("السعر", max_digits=10, decimal_places=2)
    note = models.CharField("ملاحظة", max_length=120, blank=True)

    class Meta:
        verbose_name = "بند طلب"
        verbose_name_plural = "بنود الطلب"

    @property
    def total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.product} x{self.quantity}"
