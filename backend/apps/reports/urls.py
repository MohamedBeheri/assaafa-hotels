from django.urls import path
from .views import (dashboard, hotels_overview, calendar, analytics,
                    front_office, global_search, night_audit_run, night_audit_history, board)

urlpatterns = [
    path("dashboard/", dashboard),
    path("board/", board),
    path("hotels-overview/", hotels_overview),
    path("calendar/", calendar),
    path("analytics/", analytics),
    path("front-office/", front_office),
    path("search/", global_search),
    path("night-audit/run/", night_audit_run),
    path("night-audit/history/", night_audit_history),
]
