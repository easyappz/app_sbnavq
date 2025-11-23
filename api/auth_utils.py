from typing import Any

from rest_framework.exceptions import AuthenticationFailed

from .models import AuthToken


def authenticate_member(request: Any):
    """Authenticate request using custom token scheme.

    Expected header: "Authorization: Token <key>".
    On success attaches `member` and `auth_token` to request and returns member.
    """

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise AuthenticationFailed("Токен авторизации отсутствует.")

    parts = auth_header.split()
    if len(parts) != 2 or parts[0] != "Token":
        raise AuthenticationFailed(
            "Неверный формат заголовка авторизации. Ожидается 'Token <ключ>'."
        )

    key = parts[1]

    try:
        token = AuthToken.objects.select_related("member").get(key=key)
    except AuthToken.DoesNotExist:
        raise AuthenticationFailed("Недействительный токен авторизации.")

    member = token.member
    setattr(request, "member", member)
    setattr(request, "auth_token", token)
    return member
