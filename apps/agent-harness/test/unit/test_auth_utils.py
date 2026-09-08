from yuxi.utils.auth_utils import AuthUtils


def test_verify_password_accepts_bcrypt_and_rejects_wrong():
    hashed = AuthUtils.hash_password("secret-password")
    assert AuthUtils.verify_password(hashed, "secret-password") is True
    assert AuthUtils.verify_password(hashed, "wrong-password") is False
