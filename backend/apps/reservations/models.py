from decimal import Decimal
from django.db import models
from django.utils import timezone


class Reservation(models.Model):
    """حجز — يشمل غرفة واحدة أو أكثر لنزيل خلال فترة."""
    class Status(models.TextChoices):
        PENDING = "pending", "بانتظار التأكيد"
        CONFIRMED = "confirmed", "مؤكد"
        CHECKED_IN = "checked_in", "تم الدخول"
        CHECKED_OUT = "checked_out", "تم الخروج"
        CANCELLED = "cancelled", "ملغي"
        NO_SHOW = "no_show", "لم يحضر"

    class Source(models.TextChoices):
        WALK_IN = "walk_in", "حضور مباشر"
        PHONE = "phone", "هاتف"
        ONLINE = "online", "الموقع الإلكتروني"
        OTA = "ota", "قناة خارجية"

    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.PROTECT, related_name="reservations")
    code = models.CharField("رقم الحجز", max_length=20, unique=True, blank=True)
    guest = models.ForeignKey("guests.Guest", on_delete=models.PROTECT, related_name="reservations")
    company = models.ForeignKey("guests.Company", on_delete=models.SET_NULL, null=True, blank=True,
                                related_name="reservations", verbose_name="شركة/وكيل")
    block = models.ForeignKey("reservations.GroupBlock", on_delete=models.SET_NULL, null=True, blank=True,
                              related_name="reservations", verbose_name="بلوك مجموعة")
    status = models.CharField("الحالة", max_length=20, choices=Status.choices, default=Status.CONFIRMED)
    source = models.CharField("مصدر الحجز", max_length=20, choices=Source.choices, default=Source.WALK_IN)
    check_in = models.DateField("تاريخ الدخول")
    check_out = models.DateField("تاريخ الخروج")
    adults = models.PositiveSmallIntegerField("البالغون", default=1)
    children = models.PositiveSmallIntegerField("الأطفال", default=0)
    actual_check_in = models.DateTimeField("دخول فعلي", null=True, blank=True)
    actual_check_out = models.DateTimeField("خروج فعلي", null=True, blank=True)
    special_requests = models.TextField("طلبات خاصة", blank=True)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="reservations")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "حجز"
        verbose_name_plural = "الحجوزات"
        ordering = ["-created_at"]

    @property
    def nights(self):
        return max((self.check_out - self.check_in).days, 1)

    @property
    def rooms_total(self):
        return sum((r.subtotal for r in self.rooms.all()), Decimal("0"))

    def save(self, *args, **kwargs):
        if not self.code:
            prefix = self.hotel.code if self.hotel_id else "RES"
            self.code = f"{prefix}-{timezone.now().strftime('%y%m%d%H%M%S')}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.guest}"


class ReservationRoom(models.Model):
    """غرفة ضمن حجز بسعر ليلة متفق عليه."""
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="rooms")
    room = models.ForeignKey("hotels.Room", on_delete=models.PROTECT, related_name="reservation_rooms")
    room_type = models.ForeignKey("hotels.RoomType", on_delete=models.PROTECT)
    rate_per_night = models.DecimalField("سعر الليلة", max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "غرفة الحجز"
        verbose_name_plural = "غرف الحجز"

    @property
    def subtotal(self):
        return self.rate_per_night * self.reservation.nights

    def __str__(self):
        return f"{self.room} @ {self.rate_per_night}"


class ReservationService(models.Model):
    """خدمة إضافية مختارة مع الحجز — تُضاف للفاتورة عند تسجيل الدخول."""
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="services")
    service = models.ForeignKey("hotels.Service", on_delete=models.PROTECT)
    quantity = models.PositiveSmallIntegerField("الكمية", default=1)
    unit_price = models.DecimalField("السعر", max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "خدمة الحجز"
        verbose_name_plural = "خدمات الحجز"

    @property
    def total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.service} x{self.quantity}"


class Deposit(models.Model):
    """عربون حجز — دفعة مقدّمة قبل الوصول، تُطبَّق كرصيد على الفاتورة عند تسجيل الدخول."""
    class Method(models.TextChoices):
        CASH = "cash", "نقدي"
        CARD = "card", "بطاقة"
        CHEQUE = "cheque", "شيك"
        TRANSFER = "transfer", "تحويل بنكي"
        ONLINE = "online", "دفع إلكتروني"

    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="deposits")
    amount = models.DecimalField("المبلغ", max_digits=10, decimal_places=2)
    method = models.CharField("الطريقة", max_length=10, choices=Method.choices, default=Method.CASH)
    reference = models.CharField("مرجع", max_length=60, blank=True)
    is_refunded = models.BooleanField("مُسترد", default=False)
    applied = models.BooleanField("طُبّق على الفاتورة", default=False)
    received_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    paid_at = models.DateTimeField("التاريخ", default=timezone.now)

    class Meta:
        verbose_name = "عربون"
        verbose_name_plural = "العرابين"
        ordering = ["-paid_at"]

    def __str__(self):
        return f"عربون {self.amount} - {self.reservation.code}"


class GroupBlock(models.Model):
    """بلوك مجموعة — تخصيص عدد غرف لمجموعة/وفد خلال فترة، تُسحب منها حجوزات فردية."""
    class Status(models.TextChoices):
        TENTATIVE = "tentative", "مبدئي"
        CONFIRMED = "confirmed", "مؤكد"
        CANCELLED = "cancelled", "ملغي"

    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.PROTECT, related_name="blocks")
    name = models.CharField("اسم المجموعة", max_length=150)
    company = models.ForeignKey("guests.Company", on_delete=models.SET_NULL, null=True, blank=True,
                                related_name="blocks", verbose_name="شركة/وكيل")
    check_in = models.DateField("الوصول")
    check_out = models.DateField("المغادرة")
    status = models.CharField("الحالة", max_length=12, choices=Status.choices, default=Status.TENTATIVE)
    notes = models.CharField("ملاحظات", max_length=255, blank=True)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "بلوك مجموعة"
        verbose_name_plural = "بلوكات المجموعات"
        ordering = ["-created_at"]

    @property
    def nights(self):
        return max((self.check_out - self.check_in).days, 1)

    @property
    def total_rooms(self):
        return sum(br.quantity for br in self.block_rooms.all())

    @property
    def picked_up(self):
        return self.reservations.exclude(status=Reservation.Status.CANCELLED).count()

    def __str__(self):
        return f"{self.name} ({self.hotel.code})"


class BlockRoom(models.Model):
    """صف بلوك — عدد غرف من نوع معيّن بسعر متفق."""
    block = models.ForeignKey(GroupBlock, on_delete=models.CASCADE, related_name="block_rooms")
    room_type = models.ForeignKey("hotels.RoomType", on_delete=models.PROTECT)
    quantity = models.PositiveSmallIntegerField("العدد", default=1)
    rate_per_night = models.DecimalField("سعر الليلة", max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "غرف البلوك"
        verbose_name_plural = "غرف البلوكات"

    def __str__(self):
        return f"{self.room_type.name_ar} × {self.quantity}"


class FixedCharge(models.Model):
    """رسم ثابت متكرر يُرحّل تلقائياً على فاتورة الحجز (نمط OPERA Fixed Charges)."""
    class Frequency(models.TextChoices):
        DAILY = "daily", "يومي"
        WEEKLY = "weekly", "أسبوعي"
        ONCE = "once", "مرة واحدة"

    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="fixed_charges")
    description = models.CharField("الوصف", max_length=150)
    transaction_code = models.ForeignKey("billing.TransactionCode", on_delete=models.SET_NULL,
                                         null=True, blank=True)
    amount = models.DecimalField("المبلغ", max_digits=10, decimal_places=2)
    frequency = models.CharField("التكرار", max_length=10, choices=Frequency.choices, default=Frequency.DAILY)
    is_active = models.BooleanField("نشط", default=True)
    last_posted = models.DateField("آخر ترحيل", null=True, blank=True)

    class Meta:
        verbose_name = "رسم ثابت"
        verbose_name_plural = "الرسوم الثابتة"

    def __str__(self):
        return f"{self.description} ({self.get_frequency_display()})"


class ReservationAlert(models.Model):
    """تنبيه/أثر على الحجز — يظهر منبثقاً عند تسجيل الدخول (نمط OPERA Alerts/Traces)."""
    class Kind(models.TextChoices):
        ALERT = "alert", "تنبيه"
        TRACE = "trace", "أثر (مهمة قسم)"

    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="alerts")
    kind = models.CharField("النوع", max_length=8, choices=Kind.choices, default=Kind.ALERT)
    message = models.CharField("الرسالة", max_length=255)
    department = models.CharField("القسم", max_length=60, blank=True)
    show_on_checkin = models.BooleanField("يظهر عند الدخول", default=True)
    is_resolved = models.BooleanField("منجز", default=False)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تنبيه حجز"
        verbose_name_plural = "تنبيهات الحجوزات"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_kind_display()}: {self.message[:30]}"
