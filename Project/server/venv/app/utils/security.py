import argon2 as argon


password_hasher = argon.PasswordHasher(
    encoding="utf-8"
)



def hash_password(password:str)->str:
     return password_hasher.hash(password)
 



def verify_password(password:str , hashed_password:str)->bool:
    try:
        password_is_matched = password_hasher.verify(hashed_password, password)
        if password_is_matched:
            return True
    except argon.exceptions.VerifyMismatchError:
        return False