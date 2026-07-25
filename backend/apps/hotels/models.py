from django.db import models


class Hotel(models.Model):
    """فندق ضمن مجموعة السعفة (السعفة / السعفة الذهبية)."""
    name_ar = models.CharField("الاسم بالعربي", max_length=120)
    name_en = models.CharField("الاسم بالإنجليزي", max_length=120)
    code = models.CharField("الكود", max_length=10, unique=True)
    address = models.CharField("العنوان", max_length=255, blank=True)
    phone = models.CharField("الهاتف", max_length=30, blank=True)
    email = models.EmailField("البريد", blank=True)
    tax_number = models.CharField("الرقم الضريبي", max_length=30, blank=True)
    star_rating = models.PositiveSmallIntegerField("التصنيف (نجوم)", default=4)
    check_in_time = models.TimeField("موعد الدخول", default="14:00")
    check_out_time = models.TimeField("موعد الخروج", default="12:00")
    currency = models.CharField("العملة", max_length=10, default="SAR")
    vat_rate = models.DecimalField("نسبة الضريبة %", max_digits=5, decimal_places=2, default=15)
    logo = models.ImageField("الشعار", upload_to="hotels/", blank=True, null=True)
    is_active = models.BooleanField("نشط", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "فندق"
        verbose_name_plural = "الفنادق"

    def __str__(self):
        return self.name_ar


class Floor(models.Model):
    """طابق داخل فندق."""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="floors")
    number = models.CharField("رقم الطابق", max_length=10)
    name = models.CharField("الاسم", max_length=60, blank=True)

    class Meta:
        verbose_name = "طابق"
        verbose_name_plural = "الطوابق"
        unique_together = ("hotel", "number")

    def __str__(self):
        return f"{self.hotel.code} - طابق {self.number}"


class Amenity(models.Model):
    """مرفق/خدمة بالغرفة (واي فاي، تكييف، ...)."""
    name_ar = models.CharField("الاسم", max_length=80)
    name_en = models.CharField("الاسم (EN)", max_length=80, blank=True)
    icon = models.CharField("الأيقونة", max_length=60, blank=True)

    class Meta:
        verbose_name = "مرفق"
        verbose_name_plural = "المرافق"

    def __str__(self):
        return self.name_ar


class RoomType(models.Model):
    """نوع الغرفة مع السعر الأساسي والسعة."""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="room_types")
    name_ar = models.CharField("الاسم", max_length=100)
    name_en = models.CharField("الاسم (EN)", max_length=100, blank=True)
    code = models.CharField("الكود", max_length=20, blank=True)
    base_price = models.DecimalField("السعر الأساسي/ليلة", max_digits=10, decimal_places=2, default=0)
    max_adults = models.PositiveSmallIntegerField("عدد البالغين", default=2)
    max_children = models.PositiveSmallIntegerField("عدد الأطفال", default=1)
    description = models.TextField("الوصف", blank=True)
    amenities = models.ManyToManyField(Amenity, blank=True, related_name="room_types")
    photo = models.ImageField("صورة", upload_to="room_types/", blank=True, null=True)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "نوع غرفة"
        verbose_name_plural = "أنواع الغرف"

    def price_for(self, date):
        """السعر الفعلي لليلة بتاريخ معين — موسمي إن وجد وإلا الأساسي."""
        rate = self.seasonal_rates.filter(
            is_active=True, start_date__lte=date, end_date__gte=date).first()
        return rate.price if rate else self.base_price

    def __str__(self):
        return f"{self.name_ar} - {self.hotel.code}"


class Room(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "متاحة"
        OCCUPIED = "occupied", "مشغولة"
        RESERVED = "reserved", "محجوزة"
        CLEANING = "cleaning", "قيد التنظيف"
        MAINTENANCE = "maintenance", "صيانة"
        BLOCKED = "blocked", "موقوفة"

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="rooms")
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT, related_name="rooms")
    floor = models.ForeignKey(Floor, on_delete=models.SET_NULL, null=True, blank=True, related_name="rooms")
    number = models.CharField("رقم الغرفة", max_length=20)
    status = models.CharField("الحالة", max_length=20, choices=Status.choices, default=Status.AVAILABLE)

    class HKStatus(models.TextChoices):
        CLEAN = "clean", "نظيفة"
        DIRTY = "dirty", "متسخة"
        INSPECTED = "inspected", "مفحوصة"
        OUT_OF_ORDER = "out_of_order", "خارج الخدمة"

    hk_status = models.CharField("حالة التدبير", max_length=15,
                                 choices=HKStatus.choices, default=HKStatus.CLEAN)
    notes = models.CharField("ملاحظات", max_length=255, blank=True)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "غرفة"
        verbose_name_plural = "الغرف"
        unique_together = ("hotel", "number")
        ordering = ["hotel", "number"]

    def __str__(self):
        return f"{self.hotel.code}-{self.number}"


class SeasonalRate(models.Model):
    """سعر موسمي — يتجاوز السعر الأساسي لنوع الغرفة خلال فترة."""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="seasonal_rates")
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name="seasonal_rates")
    name = models.CharField("اسم الموسم", max_length=100)
    start_date = models.DateField("من")
    end_date = models.DateField("إلى")
    price = models.DecimalField("سعر الليلة", max_digits=10, decimal_places=2)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "سعر موسمي"
        verbose_name_plural = "الأسعار الموسمية"
        ordering = ["start_date"]

    def __str__(self):
        return f"{self.name} - {self.room_type}"


class Service(models.Model):
    """خدمة إضافية تُباع مع الإقامة (إفطار، غسيل، توصيل...)."""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="services")
    name_ar = models.CharField("الاسم", max_length=100)
    name_en = models.CharField("الاسم (EN)", max_length=100, blank=True)
    price = models.DecimalField("السعر", max_digits=10, decimal_places=2, default=0)
    icon = models.CharField("الأيقونة", max_length=50, blank=True)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "خدمة"
        verbose_name_plural = "الخدمات الإضافية"

    def __str__(self):
        return self.name_ar


class HousekeepingTask(models.Model):
    """مهمة تدبير فندقي على غرفة."""
    class TaskType(models.TextChoices):
        CLEANING = "cleaning", "تنظيف"
        DEEP_CLEAN = "deep_clean", "تنظيف شامل"
        LAUNDRY = "laundry", "غسيل ومفروشات"
        INSPECTION = "inspection", "تفتيش"

    class Status(models.TextChoices):
        PENDING = "pending", "معلّقة"
        IN_PROGRESS = "in_progress", "جارية"
        DONE = "done", "منجزة"

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="housekeeping_tasks")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="housekeeping_tasks")
    task_type = models.CharField("النوع", max_length=15, choices=TaskType.choices, default=TaskType.CLEANING)
    status = models.CharField("الحالة", max_length=15, choices=Status.choices, default=Status.PENDING)
    assigned_to = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="housekeeping_tasks", verbose_name="المكلّف")
    notes = models.CharField("ملاحظات", max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField("وقت الإنجاز", null=True, blank=True)

    class Meta:
        verbose_name = "مهمة تدبير"
        verbose_name_plural = "مهام التدبير الفندقي"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_task_type_display()} - {self.room}"


class MaintenanceRequest(models.Model):
    """طلب صيانة على غرفة أو مرفق."""
    class Priority(models.TextChoices):
        LOW = "low", "منخفضة"
        MEDIUM = "medium", "متوسطة"
        HIGH = "high", "عالية"
        URGENT = "urgent", "عاجلة"

    class Status(models.TextChoices):
        OPEN = "open", "مفتوح"
        IN_PROGRESS = "in_progress", "جاري الإصلاح"
        RESOLVED = "resolved", "تم الإصلاح"

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="maintenance_requests")
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                             related_name="maintenance_requests")
    title = models.CharField("العطل", max_length=150)
    description = models.TextField("التفاصيل", blank=True)
    priority = models.CharField("الأولوية", max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField("الحالة", max_length=15, choices=Status.choices, default=Status.OPEN)
    reported_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField("وقت الإصلاح", null=True, blank=True)

    class Meta:
        verbose_name = "طلب صيانة"
        verbose_name_plural = "طلبات الصيانة"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class RoomTypePhoto(models.Model):
    """صورة ضمن جاليري نوع الغرفة."""
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField("الصورة", upload_to="room_photos/")
    caption = models.CharField("وصف", max_length=120, blank=True)
    sort = models.PositiveSmallIntegerField("الترتيب", default=0)

    class Meta:
        verbose_name = "صورة غرفة"
        verbose_name_plural = "صور الغرف"
        ordering = ["sort", "id"]

    def __str__(self):
        return f"{self.room_type} #{self.sort}"
