"""توليد جاليري صور placeholder بهوية السعفة لكل نوع غرفة (3 صور)."""
import math
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw, ImageFilter
from apps.hotels.models import RoomType, RoomTypePhoto

# لوحات ألوان لكل نوع (فاتح، غامق)
PALETTES = [
    [((58, 90, 52), (140, 193, 82)),  ((44, 74, 43), (111, 162, 60)),  ((31, 51, 32), (140, 193, 82))],
    [((107, 90, 50), (214, 188, 133)), ((150, 121, 63), (184, 152, 90)), ((96, 79, 42), (230, 208, 160))],
    [((44, 74, 43), (184, 152, 90)),  ((58, 90, 52), (214, 188, 133)), ((31, 51, 32), (111, 162, 60))],
    [((138, 111, 60), (140, 193, 82)), ((96, 79, 42), (140, 193, 82)), ((150, 121, 63), (58, 90, 52))],
]
W, H = 960, 640


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_palm(d, cx, cy, size, color, width=5):
    d.line([(cx, cy - size), (cx, cy + size)], fill=color, width=width)
    for i in range(5):
        y = cy - size + size * 0.35 * i
        dx, dy = size * (0.55 - 0.06 * i), size * 0.3
        d.line([(cx, y), (cx - dx, y + dy)], fill=color, width=width)
        d.line([(cx, y), (cx + dx, y + dy)], fill=color, width=width)


def make_image(c1, c2, variant):
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img, "RGBA")
    # تدرج مائل
    for y in range(H):
        for_seg = y / H
        d.line([(0, y), (W, y)], fill=lerp(c1, c2, for_seg))
    # دوائر ضوء ناعمة
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    positions = [(W * 0.75, H * 0.25, 260), (W * 0.2, H * 0.8, 200), (W * 0.5, H * 0.5, 320)]
    gd.ellipse([positions[variant][0] - positions[variant][2], positions[variant][1] - positions[variant][2],
                positions[variant][0] + positions[variant][2], positions[variant][1] + positions[variant][2]],
               fill=(255, 255, 255, 38))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img.convert("RGBA"), glow)
    d = ImageDraw.Draw(img, "RGBA")
    # نخيل شفاف
    palm_color = (255, 255, 255, 46)
    if variant == 0:
        draw_palm(d, W * 0.78, H * 0.52, 200, palm_color, 6)
        draw_palm(d, W * 0.15, H * 0.75, 120, (255, 255, 255, 30), 4)
    elif variant == 1:
        draw_palm(d, W * 0.5, H * 0.5, 230, palm_color, 7)
    else:
        draw_palm(d, W * 0.25, H * 0.45, 170, palm_color, 5)
        draw_palm(d, W * 0.85, H * 0.7, 130, (255, 255, 255, 30), 4)
    # خط أفق سفلي ذهبي رفيع
    d.rectangle([0, H - 14, W, H], fill=(184, 152, 90, 190))
    return img.convert("RGB")


class Command(BaseCommand):
    help = "توليد صور الجاليري لكل أنواع الغرف"

    def handle(self, *args, **opts):
        for idx, rt in enumerate(RoomType.objects.all()):
            if rt.photos.exists():
                continue
            palette = PALETTES[idx % len(PALETTES)]
            for v, (c1, c2) in enumerate(palette):
                img = make_image(c1, c2, v)
                buf = BytesIO()
                img.save(buf, "JPEG", quality=88)
                photo = RoomTypePhoto(room_type=rt, sort=v,
                                      caption=f"{rt.name_ar} — {v + 1}")
                photo.image.save(f"rt{rt.id}_{v}.jpg", ContentFile(buf.getvalue()), save=True)
            self.stdout.write(f"✓ {rt}")
        self.stdout.write(self.style.SUCCESS("تم توليد الجاليري"))
