from django.db import models
from django.contrib.auth.hashers import make_password, check_password
import secrets


class Member(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)

    def __str__(self) -> str:  # pragma: no cover - representation
        return self.username


class AuthToken(models.Model):
    key = models.CharField(max_length=40, unique=True)
    member = models.ForeignKey("Member", related_name="tokens", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def generate_key(cls) -> str:
        return secrets.token_hex(20)

    @classmethod
    def create_for_member(cls, member: Member) -> "AuthToken":
        key = cls.generate_key()
        return cls.objects.create(member=member, key=key)

    def __str__(self) -> str:  # pragma: no cover - representation
        return f"{self.member.username}: {self.key}"


class ChatMessage(models.Model):
    member = models.ForeignKey("Member", related_name="messages", on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:  # pragma: no cover - representation
        return f"{self.member.username}: {self.text[:20]}"
