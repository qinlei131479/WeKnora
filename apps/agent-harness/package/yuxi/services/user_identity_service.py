import re

from pypinyin import Style, lazy_pinyin


def to_pinyin(text: str) -> str:
    return "".join(lazy_pinyin(text, style=Style.NORMAL))



def generate_uid(username: str) -> str:
    uid = re.sub(r"[^a-zA-Z0-9_]", "", to_pinyin(username.strip()))
    if uid and uid[0].isdigit():
        uid = f"u{uid}"
    if len(uid) < 2:
        uid = f"user{hash(username) % 10000:04d}"
    return uid[:20].lower()




