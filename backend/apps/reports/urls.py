from django.urls import path
from .views import dashboard, hotels_overview, calendar, analytics

urlpatterns = [
    path("dashboard/", dashboard),
    path("hotels-overview/", hotels_overview),
    path("calendar/", calendar),
    path("analytics/", analytics),
]
