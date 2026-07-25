from django.db import models


class Guest(models.Model):
    class IDType(models.TextChoices):
        NATIONAL = "national_id", "هوية وطنية"
        IQAMA = "iqama", "إقامة"
        PASSPORT = "passport", "جواز سفر عادي"
        PASSPORT_DIPLOMATIC = "passport_diplomatic", "جواز سفر دبلوماسي"
        PASSPORT_MISSION = "passport_mission", "جواز سفر مهام"

    class Gender(models.TextChoices):
        MALE = "male", "ذكر"
        FEMALE = "female", "أنثى"

    first_name = models.CharField("الاسم الأول", max_length=80)
    last_name = models.CharField("اسم العائلة", max_length=80, blank=True)
    id_type = models.CharField("نوع الهوية", max_length=20, choices=IDType.choices, default=IDType.NATIONAL)
    id_number = models.CharField("رقم الهوية/الجواز", max_length=40, db_index=True)
    nationality = models.CharField("الجنسية", max_length=60, default="السعودية")
    gender = models.CharField("الجنس", max_length=10, choices=Gender.choices, default=Gender.MALE)
    phone = models.CharField("الجوال", max_length=20, db_index=True)
    email = models.EmailField("البريد", blank=True)
    address = models.CharField("العنوان", max_length=255, blank=True)
    date_of_birth = models.DateField("تاريخ الميلاد", null=True, blank=True)
    is_vip = models.BooleanField("VIP", default=False)
    is_blacklisted = models.BooleanField("قائمة سوداء", default=False)
    notes = models.TextField("ملاحظات", blank=True)
    id_document = models.FileField("صورة الهوية", upload_to="guest_ids/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "نزيل"
        verbose_name_plural = "النزلاء"
        ordering = ["-created_at"]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return self.full_name


class GuestDocument(models.Model):
    """مستند إثبات ضمن ملف العميل (صورة هوية/إقامة/جواز/تأشيرة...)."""
    class Kind(models.TextChoices):
        ID = "id", "هوية/إقامة"
        PASSPORT = "passport", "جواز سفر"
        VISA = "visa", "تأشيرة"
        OTHER = "other", "أخرى"

    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name="documents")
    kind = models.CharField("النوع", max_length=12, choices=Kind.choices, default=Kind.ID)
    file = models.FileField("الملف", upload_to="guest_docs/")
    note = models.CharField("ملاحظة", max_length=150, blank=True)
    uploaded_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL,
                                    null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "مستند عميل"
        verbose_name_plural = "مستندات العملاء"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.guest} - {self.get_kind_display()}"


class Company(models.Model):
    """ملف شركة أو وكيل سياحة — أسعار خاصة، حد ائتمان، عمولة، حساب آجل (AR)."""
    class Kind(models.TextChoices):
        COMPANY = "company", "شركة"
        TRAVEL_AGENT = "travel_agent", "وكيل سياحة"

    kind = models.CharField("النوع", max_length=15, choices=Kind.choices, default=Kind.COMPANY)
    name = models.CharField("الاسم", max_length=150)
    contact_person = models.CharField("مسؤول التواصل", max_length=120, blank=True)
    phone = models.CharField("الهاتف", max_length=30, blank=True)
    email = models.EmailField("البريد", blank=True)
    address = models.CharField("العنوان", max_length=255, blank=True)
    tax_number = models.CharField("الرقم الضريبي", max_length=40, blank=True)
    credit_limit = models.DecimalField("حد الائتمان", max_digits=12, decimal_places=2, default=0)
    discount_pct = models.DecimalField("خصم متفق %", max_digits=5, decimal_places=2, default=0)
    commission_pct = models.DecimalField("عمولة الوكيل %", max_digits=5, decimal_places=2, default=0)
    payment_terms_days = models.PositiveSmallIntegerField("مدة السداد (يوم)", default=30)
    is_active = models.BooleanField("نشط", default=True)
    notes = models.TextField("ملاحظات", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "شركة/وكيل"
        verbose_name_plural = "الشركات ووكلاء السياحة"
        ordering = ["name"]

    @property
    def outstanding(self):
        """إجمالي المتبقي على الشركة (فواتير AR غير مسددة)."""
        from decimal import Decimal
        return sum((inv.balance for inv in self.ar_invoices.all()), Decimal("0"))

    def __str__(self):
        return f"{self.name} ({self.get_kind_display()})"
