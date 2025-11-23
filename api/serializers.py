from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers

from .models import Member, ChatMessage


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["id", "username", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class MemberRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, write_only=True)

    def validate_username(self, value: str) -> str:
        if Member.objects.filter(username=value).exists():
            raise serializers.ValidationError("Пользователь с таким именем уже существует.")
        return value

    def create(self, validated_data):
        username = validated_data["username"]
        raw_password = validated_data["password"]

        member = Member(username=username)
        member.password = make_password(raw_password)
        member.save()
        return member


class MemberLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        try:
            member = Member.objects.get(username=username)
        except Member.DoesNotExist:
            raise serializers.ValidationError("Неверные учетные данные.")

        if not check_password(password, member.password):
            raise serializers.ValidationError("Неверные учетные данные.")

        attrs["member"] = member
        return attrs


class MemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["username"]

    def validate_username(self, value: str) -> str:
        member = self.instance
        if member is None:
            return value
        if Member.objects.filter(username=value).exclude(pk=member.pk).exists():
            raise serializers.ValidationError("Пользователь с таким именем уже существует.")
        return value


class AuthResponseSerializer(serializers.Serializer):
    member = MemberSerializer()
    token = serializers.CharField()


class ChatMessageSerializer(serializers.ModelSerializer):
    author = MemberSerializer(source="member", read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "text", "created_at", "author"]


class ChatMessageCreateSerializer(serializers.Serializer):
    text = serializers.CharField()
