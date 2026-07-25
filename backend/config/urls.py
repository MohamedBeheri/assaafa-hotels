from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, Http404
from django.views.static import serve
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import MyTokenView

api = [
    path("auth/login/", MyTokenView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("", include("apps.accounts.urls")),
    path("", include("apps.hotels.urls")),
    path("", include("apps.guests.urls")),
    path("", include("apps.reservations.urls")),
    path("", include("apps.billing.urls")),
    path("", include("apps.pos.urls")),
    path("", include("apps.finance.urls")),
    path("reports/", include("apps.reports.urls")),
    path("public/", include("apps.website.urls")),
]


def spa(request):
    """يرجّع index.html لكل مسارات الواجهة (توجيه من جهة العميل)."""
    index = settings.FRONTEND_DIR / "index.html"
    if index.exists():
        return HttpResponse(index.read_text(encoding="utf-8"),
                            content_type="text/html; charset=utf-8")
    return HttpResponse(
        "<h2>As'saafa Hotels API</h2><p>الفرونت لم يُبنَ بعد. شغّل build.sh.</p>",
        content_type="text/html; charset=utf-8")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api)),
]

# خدمة الميديا (صور الغرف/البانرات/المستندات) في كل الأوضاع — مناسب للتجريبي
urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]

# catch-all لتطبيق الواجهة أحادي الصفحة (يجب أن يكون الأخير)
urlpatterns += [re_path(r"^(?!api/|admin/|media/|static/).*$", spa)]
