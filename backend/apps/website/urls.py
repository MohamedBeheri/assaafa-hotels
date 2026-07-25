from django.urls import path
from .views import hotels, availability, book, lookup, site

urlpatterns = [
    path("site/", site),
    path("hotels/", hotels),
    path("availability/", availability),
    path("book/", book),
    path("lookup/", lookup),
]
