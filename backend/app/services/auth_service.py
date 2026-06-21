from datetime import datetime, timedelta

import bcrypt
import jwt
from bson import ObjectId
from fastapi import HTTPException, Request

from app.config import settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with 12 rounds."""
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt(rounds=12)
    ).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain text password against its bcrypt hash."""
    return bcrypt.checkpw(
        plain.encode('utf-8'),
        hashed.encode('utf-8')
    )


def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token with user_id, email, and expiration."""
    exp = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': exp
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token has expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')


async def get_current_user(request: Request) -> dict:
    """FastAPI dependency to extract and validate the current user from the Authorization header."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing or invalid authorization header')

    token = auth_header.split(' ', 1)[1]
    payload = decode_access_token(token)

    from app.database import db
    user = await db.users.find_one({'_id': ObjectId(payload['user_id'])})

    if not user:
        raise HTTPException(status_code=401, detail='User not found')

    # Convert MongoDB document to dict with string id
    user['id'] = str(user['_id'])
    del user['_id']
    return user
