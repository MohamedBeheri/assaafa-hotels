import hashlib

from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer, MyTokenSerializer


class LoginThrottle(SimpleRateThrottle):
    """At most 10 sign-in attempts a minute on one account, whatever address they come from: a forged
    X-Forwarded-For does not escape it, and a proxy in front that makes every visitor look alike cannot lock
    everyone out together."""
    scope = "login"
    rate = "10/min"

    def get_cache_key(self, request, view):
        account = str(request.data.get("username") or "").strip().lower()
        if not account:
            return None                  # nothing to guess with: the serializer turns it down
        return self.cache_format % {"scope": self.scope, "ident": hashlib.sha256(account.encode()).hexdigest()[:32]}


class MyTokenView(TokenObtainPairView):
    throttle_classes = [LoginThrottle]
    serializer_class = MyTokenSerializer


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    filterset_fields = ["role", "hotel", "is_active"]
    search_fields = ["username", "first_name", "last_name", "phone"]
