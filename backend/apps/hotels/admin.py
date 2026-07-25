from django.contrib import admin
from .models import Hotel, Floor, Amenity, RoomType, Room
for m in (Hotel, Floor, Amenity, RoomType, Room):
    admin.site.register(m)
