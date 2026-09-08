import pytest
from pydantic import ValidationError

from server.routers.auth_router import LoginBody


def test_login_body_rejects_empty_password():
    with pytest.raises(ValidationError) as exc_info:
        LoginBody.model_validate({"email": "a@b.c", "password": ""})
    assert exc_info.value.errors()[0]["type"] == "string_too_short"


def test_login_body_accepts_eight_char_password():
    body = LoginBody.model_validate({"email": "a@b.c", "password": "12345678"})
    assert body.password == "12345678"
