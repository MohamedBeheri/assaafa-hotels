from rest_framework import viewsets
from .models import Guest, GuestDocument, Company
from .serializers import GuestSerializer, GuestDocumentSerializer, CompanySerializer


class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.prefetch_related("documents").all()
    serializer_class = GuestSerializer
    filterset_fields = ["is_vip", "is_blacklisted", "nationality", "id_type"]
    search_fields = ["first_name", "last_name", "id_number", "phone", "email"]


class GuestDocumentViewSet(viewsets.ModelViewSet):
    queryset = GuestDocument.objects.select_related("guest").all()
    serializer_class = GuestDocumentSerializer
    filterset_fields = ["guest", "kind"]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(uploaded_by=user)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filterset_fields = ["kind", "is_active"]
    search_fields = ["name", "tax_number", "phone", "email"]
