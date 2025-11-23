from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_utils import authenticate_member
from .models import Member, ChatMessage, AuthToken
from .serializers import (
    MemberRegisterSerializer,
    MemberLoginSerializer,
    MemberSerializer,
    MemberUpdateSerializer,
    AuthResponseSerializer,
    ChatMessageSerializer,
    ChatMessageCreateSerializer,
)


def build_error_response(detail: str, status_code: int, code: str | None = None, fields=None) -> Response:
    data = {
        "detail": detail,
        "code": code,
        "fields": fields,
    }
    return Response(data, status=status_code)


def build_validation_error_response(errors) -> Response:
    return build_error_response(
        detail="Ошибка валидации данных.",
        status_code=status.HTTP_400_BAD_REQUEST,
        code="validation_error",
        fields=errors,
    )


class RegisterView(APIView):
    @extend_schema(
        request=MemberRegisterSerializer,
        responses={
            201: AuthResponseSerializer,
        },
        description="Регистрация нового пользователя",
    )
    def post(self, request):
        serializer = MemberRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return build_validation_error_response(serializer.errors)

        member = serializer.save()
        token = AuthToken.create_for_member(member)

        response_serializer = AuthResponseSerializer({"member": member, "token": token.key})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    @extend_schema(
        request=MemberLoginSerializer,
        responses={
            200: AuthResponseSerializer,
        },
        description="Вход пользователя",
    )
    def post(self, request):
        serializer = MemberLoginSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            non_field_errors = errors.get("non_field_errors")
            if non_field_errors and "Неверные учетные данные." in [str(e) for e in non_field_errors]:
                return build_error_response(
                    detail="Неверные учетные данные.",
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    code="invalid_credentials",
                    fields=None,
                )
            return build_validation_error_response(errors)

        member: Member = serializer.validated_data["member"]

        # Для простоты инвалидируем старые токены и создаем новый
        AuthToken.objects.filter(member=member).delete()
        token = AuthToken.create_for_member(member)

        response_serializer = AuthResponseSerializer({"member": member, "token": token.key})
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    @extend_schema(
        request=None,
        responses={204: None},
        description="Выход из системы",
    )
    def post(self, request):
        try:
            authenticate_member(request)
        except AuthenticationFailed as exc:
            return build_error_response(
                detail=str(exc.detail),
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="authentication_failed",
                fields=None,
            )

        token = getattr(request, "auth_token", None)
        if token is not None:
            token.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileView(APIView):
    @extend_schema(
        responses={200: MemberSerializer},
        description="Получить профиль текущего пользователя",
    )
    def get(self, request):
        try:
            member = authenticate_member(request)
        except AuthenticationFailed as exc:
            return build_error_response(
                detail=str(exc.detail),
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="authentication_failed",
                fields=None,
            )

        serializer = MemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=MemberUpdateSerializer,
        responses={200: MemberSerializer},
        description="Обновить профиль текущего пользователя",
    )
    def put(self, request):
        try:
            member = authenticate_member(request)
        except AuthenticationFailed as exc:
            return build_error_response(
                detail=str(exc.detail),
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="authentication_failed",
                fields=None,
            )

        serializer = MemberUpdateSerializer(instance=member, data=request.data, partial=True)
        if not serializer.is_valid():
            return build_validation_error_response(serializer.errors)

        serializer.save()
        response_serializer = MemberSerializer(member)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class ChatMessagesView(APIView):
    @extend_schema(
        responses={200: ChatMessageSerializer(many=True)},
        description="Получить список сообщений чата",
    )
    def get(self, request):
        try:
            authenticate_member(request)
        except AuthenticationFailed as exc:
            return build_error_response(
                detail=str(exc.detail),
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="authentication_failed",
                fields=None,
            )

        messages = ChatMessage.objects.select_related("member").all().order_by("created_at")
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=ChatMessageCreateSerializer,
        responses={201: ChatMessageSerializer},
        description="Отправить сообщение в чат",
    )
    def post(self, request):
        try:
            member = authenticate_member(request)
        except AuthenticationFailed as exc:
            return build_error_response(
                detail=str(exc.detail),
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="authentication_failed",
                fields=None,
            )

        serializer = ChatMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return build_validation_error_response(serializer.errors)

        text = serializer.validated_data["text"]
        message = ChatMessage.objects.create(member=member, text=text, created_at=timezone.now())

        response_serializer = ChatMessageSerializer(message)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
