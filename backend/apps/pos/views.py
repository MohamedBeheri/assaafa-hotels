from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product, Order, OrderItem
from .serializers import (CategorySerializer, ProductSerializer,
                          OrderSerializer, OrderItemSerializer)
from apps.billing.models import Invoice, Charge


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filterset_fields = ["hotel", "is_active"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    filterset_fields = ["hotel", "category", "is_active"]
    search_fields = ["name_ar", "name_en", "sku"]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.prefetch_related("items").all()
    serializer_class = OrderSerializer
    filterset_fields = ["hotel", "status", "order_type", "reservation"]
    search_fields = ["number", "table_no"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    @action(detail=True, methods=["post"])
    def charge_to_room(self, request, pk=None):
        """تحميل الطلب على فاتورة الحجز المرتبط."""
        order = self.get_object()
        if not order.reservation_id:
            return Response({"detail": "لا يوجد حجز مرتبط بالطلب"}, status=400)
        res = order.reservation
        inv, _ = Invoice.objects.get_or_create(
            reservation=res,
            defaults={"hotel": res.hotel, "guest": res.guest, "vat_rate": res.hotel.vat_rate})
        Charge.objects.create(
            invoice=inv, kind=Charge.Kind.POS,
            description=f"طلب مطعم/كافيه {order.number}",
            quantity=1, unit_price=order.total)
        order.status = Order.Status.ROOM_CHARGED
        order.save()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        order = self.get_object()
        order.status = Order.Status.PAID
        order.save()
        return Response(OrderSerializer(order).data)


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    filterset_fields = ["order"]
