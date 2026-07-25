from rest_framework import serializers
from .models import Category, Product, Order, OrderItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name_ar", read_only=True)

    class Meta:
        model = Product
        fields = "__all__"


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name_ar", read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "order", "product", "product_name", "quantity", "unit_price", "note", "total"]
        extra_kwargs = {"order": {"required": False}}


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    hotel_name = serializers.CharField(source="hotel.name_ar", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    vat_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = "__all__"

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        order = Order.objects.create(**validated_data)
        for it in items:
            OrderItem.objects.create(order=order, **it)
        return order

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if items is not None:
            instance.items.all().delete()
            for it in items:
                OrderItem.objects.create(order=instance, **it)
        return instance
