import hashlib
import sys


def non_secure_md5(s):
    """Drop in replacement md5 hash function marking it for a non-security purpose."""
    # check python version
    if sys.version_info[0] <= 3 and sys.version_info[1] <= 8:
        return hashlib.md5(s)
    else:
        return hashlib.md5(s, usedforsecurity=False)
