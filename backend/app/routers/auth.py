from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import db
from app.models.user import (
    PasswordChange,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/signup')
async def signup(user_data: UserCreate):
    """Register a new user account."""
    # Check if email already exists
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    # Hash password and create user document
    hashed_pw = hash_password(user_data.password)
    user_doc = {
        'name': user_data.name,
        'email': user_data.email,
        'password': hashed_pw,
        'notification_email': user_data.email,
        'default_reminder_offset': 60,
        'created_at': datetime.utcnow(),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create access token
    token = create_access_token(user_id, user_data.email)

    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'id': user_id,
            'name': user_data.name,
            'email': user_data.email,
        }
    }


@router.post('/login')
async def login(user_data: UserLogin):
    """Authenticate and log in an existing user."""
    user = await db.users.find_one({'email': user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail='Invalid email or password')

    if not verify_password(user_data.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid email or password')

    user_id = str(user['_id'])
    token = create_access_token(user_id, user_data.email)

    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'id': user_id,
            'name': user['name'],
            'email': user['email'],
        }
    }


@router.get('/me', response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return UserResponse(
        id=current_user['id'],
        name=current_user['name'],
        email=current_user['email'],
        notification_email=current_user.get('notification_email'),
        default_reminder_offset=current_user.get('default_reminder_offset', 60),
        created_at=current_user.get('created_at'),
    )


@router.put('/me', response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the current user's profile fields."""
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if not update_fields:
        raise HTTPException(status_code=400, detail='No fields to update')

    await db.users.update_one(
        {'_id': ObjectId(current_user['id'])},
        {'$set': update_fields},
    )

    # Fetch updated user
    updated_user = await db.users.find_one({'_id': ObjectId(current_user['id'])})
    return UserResponse(
        id=str(updated_user['_id']),
        name=updated_user['name'],
        email=updated_user['email'],
        notification_email=updated_user.get('notification_email'),
        default_reminder_offset=updated_user.get('default_reminder_offset', 60),
        created_at=updated_user.get('created_at'),
    )


@router.put('/me/password')
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user),
):
    """Change the current user's password."""
    if not verify_password(password_data.current_password, current_user['password']):
        raise HTTPException(status_code=400, detail='Current password is incorrect')

    new_hashed = hash_password(password_data.new_password)
    await db.users.update_one(
        {'_id': ObjectId(current_user['id'])},
        {'$set': {'password': new_hashed}},
    )

    return {'message': 'Password updated successfully'}
