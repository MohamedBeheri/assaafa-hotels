from django.db import models


class NightAudit(models.Model):
    """سجل تدقيق ليلي — لقطة إغلاق اليوم المالي والتشغيلي."""
    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.CASCADE,
                              null=True, blank=True, related_name="night_audits",
                              help_text="فارغ = كل الفنادق")
    business_date = models.DateField("تاريخ اليوم")
    total_rooms = models.PositiveIntegerField("إجمالي الغرف", default=0)
    rooms_sold = models.PositiveIntegerField("غرف مباعة", default=0)
    occupancy = models.DecimalField("الإشغال %", max_digits=5, decimal_places=1, default=0)
    adr = models.DecimalField("متوسط سعر الغرفة", max_digits=10, decimal_places=2, default=0)
    revpar = models.DecimalField("الإيراد لكل غرفة", max_digits=10, decimal_places=2, default=0)
    revenue = models.DecimalField("إيراد اليوم", max_digits=12, decimal_places=2, default=0)
    arrivals = models.PositiveIntegerField("الوصول", default=0)
    departures = models.PositiveIntegerField("المغادرات", default=0)
    no_shows = models.PositiveIntegerField("لم يحضروا", default=0)
    run_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    run_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تدقيق ليلي"
        verbose_name_plural = "التدقيق الليلي"
        ordering = ["-business_date", "-run_at"]

    def __str__(self):
        return f"تدقيق {self.business_date} - {self.hotel or 'الكل'}"
