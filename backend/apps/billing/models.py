from decimal import Decimal
from django.db import models
from django.utils import timezone


class Invoice(models.Model):
    """فاتورة/فوليو مرتبطة بحجز — تجمع كل الرسوم والمدفوعات."""
    class Status(models.TextChoices):
        OPEN = "open", "مفتوحة"
        PAID = "paid", "مدفوعة"
        PARTIAL = "partial", "مدفوعة جزئياً"
        VOID = "void", "ملغاة"

    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.PROTECT, related_name="invoices")
    number = models.CharField("رقم الفاتورة", max_length=25, unique=True, blank=True)
    reservation = models.OneToOneField("reservations.Reservation", on_delete=models.CASCADE,
                                       related_name="invoice", null=True, blank=True)
    guest = models.ForeignKey("guests.Guest", on_delete=models.PROTECT, related_name="invoices")
    bill_to_company = models.ForeignKey("guests.Company", on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name="ar_invoices", verbose_name="على حساب شركة")
    status = models.CharField("الحالة", max_length=10, choices=Status.choices, default=Status.OPEN)
    vat_rate = models.DecimalField("الضريبة %", max_digits=5, decimal_places=2, default=15)
    discount = models.DecimalField("الخصم", max_digits=10, decimal_places=2, default=0)
    issued_at = models.DateTimeField("تاريخ الإصدار", default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "فاتورة"
        verbose_name_plural = "الفواتير"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.number:
            prefix = self.hotel.code if self.hotel_id else "INV"
            self.number = f"{prefix}-{timezone.now().strftime('%y%m%d%H%M%S')}"
        super().save(*args, **kwargs)

    @property
    def subtotal(self):
        return sum((c.total for c in self.charges.all()), Decimal("0"))

    @property
    def vat_amount(self):
        base = self.subtotal - self.discount
        return (base * self.vat_rate / Decimal("100")).quantize(Decimal("0.01"))

    @property
    def total(self):
        return self.subtotal - self.discount + self.vat_amount

    @property
    def paid_amount(self):
        return sum((p.amount for p in self.payments.all()), Decimal("0"))

    @property
    def balance(self):
        return self.total - self.paid_amount

    def __str__(self):
        return self.number


class Charge(models.Model):
    """بند رسوم على الفاتورة (إقامة، خدمة، طلب POS...)."""
    class Kind(models.TextChoices):
        ROOM = "room", "إقامة"
        POS = "pos", "مطعم/كافيه"
        SERVICE = "service", "خدمة"
        OTHER = "other", "أخرى"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="charges")
    kind = models.CharField("النوع", max_length=10, choices=Kind.choices, default=Kind.SERVICE)
    window = models.PositiveSmallIntegerField("النافذة", default=1)
    transaction_code = models.ForeignKey("billing.TransactionCode", on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name="charges", verbose_name="كود البند")
    reason = models.CharField("سبب التسوية", max_length=200, blank=True)
    description = models.CharField("الوصف", max_length=200)
    quantity = models.DecimalField("الكمية", max_digits=8, decimal_places=2, default=1)
    unit_price = models.DecimalField("سعر الوحدة", max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "بند فاتورة"
        verbose_name_plural = "بنود الفاتورة"

    @property
    def total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.description} ({self.total})"


class Payment(models.Model):
    """دفعة على فاتورة."""
    class Method(models.TextChoices):
        CASH = "cash", "نقدي"
        CARD = "card", "بطاقة"
        CHEQUE = "cheque", "شيك"
        TRANSFER = "transfer", "تحويل بنكي"
        ONLINE = "online", "دفع إلكتروني"
        CITY_LEDGER = "city_ledger", "حساب آجل (شركة)"
        WALLET = "wallet", "محفظة رقمية"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField("المبلغ", max_digits=10, decimal_places=2)
    method = models.CharField("طريقة الدفع", max_length=15, choices=Method.choices, default=Method.CASH)
    reference = models.CharField("مرجع", max_length=60, blank=True)
    received_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    paid_at = models.DateTimeField("تاريخ الدفع", default=timezone.now)

    class Meta:
        verbose_name = "دفعة"
        verbose_name_plural = "المدفوعات"
        ordering = ["-paid_at"]

    def __str__(self):
        return f"{self.amount} - {self.get_method_display()}"


class Coupon(models.Model):
    """كوبون خصم — نسبة مئوية أو مبلغ ثابت."""
    class Kind(models.TextChoices):
        PERCENT = "percent", "نسبة %"
        FIXED = "fixed", "مبلغ ثابت"

    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.CASCADE, null=True, blank=True,
                              related_name="coupons", help_text="فارغ = كل الفنادق")
    code = models.CharField("الكود", max_length=30, unique=True)
    kind = models.CharField("النوع", max_length=10, choices=Kind.choices, default=Kind.PERCENT)
    value = models.DecimalField("القيمة", max_digits=10, decimal_places=2)
    valid_from = models.DateField("صالح من", null=True, blank=True)
    valid_to = models.DateField("صالح حتى", null=True, blank=True)
    max_uses = models.PositiveIntegerField("أقصى استخدام", default=0, help_text="0 = بلا حد")
    used_count = models.PositiveIntegerField("مرات الاستخدام", default=0)
    is_active = models.BooleanField("نشط", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "كوبون"
        verbose_name_plural = "الكوبونات"

    def is_valid(self, on_date=None):
        from django.utils import timezone as tz
        d = on_date or tz.localdate()
        if not self.is_active:
            return False, "الكوبون غير نشط"
        if self.valid_from and d < self.valid_from:
            return False, "الكوبون لم يبدأ بعد"
        if self.valid_to and d > self.valid_to:
            return False, "الكوبون منتهي"
        if self.max_uses and self.used_count >= self.max_uses:
            return False, "تجاوز حد الاستخدام"
        return True, ""

    def discount_amount(self, subtotal):
        from decimal import Decimal
        if self.kind == self.Kind.PERCENT:
            return (subtotal * self.value / Decimal("100")).quantize(Decimal("0.01"))
        return min(self.value, subtotal)

    def __str__(self):
        return self.code


class TransactionCode(models.Model):
    """كود بند مالي مرقّم — لتقارير محاسبية دقيقة (نمط OPERA / ZATCA)."""
    class Category(models.TextChoices):
        ROOM = "room", "إقامة"
        FNB = "fnb", "مأكولات ومشروبات"
        SERVICE = "service", "خدمات"
        TAX = "tax", "ضرائب"
        OTHER = "other", "أخرى"

    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.CASCADE, null=True, blank=True,
                              related_name="transaction_codes", help_text="فارغ = كل الفنادق")
    code = models.CharField("الكود", max_length=10, unique=True)
    name_ar = models.CharField("الاسم", max_length=100)
    name_en = models.CharField("الاسم (EN)", max_length=100, blank=True)
    category = models.CharField("التصنيف", max_length=10, choices=Category.choices, default=Category.OTHER)
    default_price = models.DecimalField("السعر الافتراضي", max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "كود بند"
        verbose_name_plural = "أكواد البنود"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name_ar}"
