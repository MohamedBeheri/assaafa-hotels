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
