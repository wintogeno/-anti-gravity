from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
import os

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt-change-me")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

async def verify_google_token(token: str):
    # FALLBACK: If NO Google Client ID, use mock for development
    if not GOOGLE_CLIENT_ID:
        print(f"\n[GOOGLE MOCK] Verifying fake token: {token}\n")
        if "@" in token:
            return {"email": token, "sub": f"google_{token.split('@')[0]}"}
        return None

    # REAL VERIFICATION
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        return idinfo
    except Exception as e:
        print(f"\n[GOOGLE AUTH ERROR] {str(e)}\n")
        return None
