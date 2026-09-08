from argon2 import PasswordHasher
from argon2.exceptions import InvalidHash, VerificationError, VerifyMismatchError

PASSWORD_HASHER = PasswordHasher()


class AuthUtils:
    @staticmethod
    def hash_password(password: str) -> str:
        return PASSWORD_HASHER.hash(password)

    @staticmethod
    def verify_password(stored_password: str, provided_password: str) -> bool:
        if not stored_password:
            return False
        if stored_password.startswith("$2"):
            try:
                import bcrypt

                return bcrypt.checkpw(provided_password.encode("utf-8"), stored_password.encode("utf-8"))
            except (ValueError, TypeError, ImportError):
                return False
        if not stored_password.startswith("$argon2"):
            return False
        try:
            return PASSWORD_HASHER.verify(stored_password, provided_password)
        except (InvalidHash, VerifyMismatchError, VerificationError):
            return False
