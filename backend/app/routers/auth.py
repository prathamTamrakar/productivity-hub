import random
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import db
from app.models.user import (
    PasswordChange,
    SendOTP,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
    VerifyOTP,
)
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.services.email_service import send_otp_email

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/send-otp')
async def send_otp(data: SendOTP):
    """Generate a 6-digit OTP, store it, and email it to the user."""
    email = data.email.strip().lower()

    # Check if email already registered
    existing = await db.users.find_one({'email': email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))

    # Upsert OTP document (replace any existing OTP for this email)
    await db.otp_codes.update_one(
        {'email': email},
        {
            '$set': {
                'email': email,
                'otp': otp_code,
                'created_at': datetime.utcnow(),
                'expires_at': datetime.utcnow() + timedelta(minutes=10),
                'verified': False,
            }
        },
        upsert=True,
    )

    # Send OTP via email
    await send_otp_email(to_email=email, otp_code=otp_code)

    return {'message': 'OTP sent successfully', 'email': email}


@router.post('/verify-otp')
async def verify_otp(data: VerifyOTP):
    """Verify the OTP entered by the user."""
    email = data.email.strip().lower()

    otp_doc = await db.otp_codes.find_one({'email': email})
    if not otp_doc:
        raise HTTPException(status_code=400, detail='No OTP found. Please request a new one.')

    # Check expiry
    if datetime.utcnow() > otp_doc['expires_at']:
        await db.otp_codes.delete_one({'email': email})
        raise HTTPException(status_code=400, detail='OTP has expired. Please request a new one.')

    # Check OTP match
    if otp_doc['otp'] != data.otp.strip():
        raise HTTPException(status_code=400, detail='Invalid OTP. Please try again.')

    # Mark as verified
    await db.otp_codes.update_one(
        {'email': email},
        {'$set': {'verified': True}},
    )

    return {'message': 'OTP verified successfully', 'verified': True}


@router.post('/signup')
async def signup(user_data: UserCreate):
    """Register a new user account after OTP verification."""
    email = user_data.email.strip().lower()

    # Check if email already exists
    existing = await db.users.find_one({'email': email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    # Verify OTP
    otp_doc = await db.otp_codes.find_one({'email': email})
    if not otp_doc:
        raise HTTPException(status_code=400, detail='No OTP found. Please verify your email first.')

    if datetime.utcnow() > otp_doc['expires_at']:
        await db.otp_codes.delete_one({'email': email})
        raise HTTPException(status_code=400, detail='OTP has expired. Please verify your email again.')

    if otp_doc['otp'] != user_data.otp.strip():
        raise HTTPException(status_code=400, detail='Invalid OTP.')

    if not otp_doc.get('verified'):
        raise HTTPException(status_code=400, detail='Please verify your OTP first.')

    # Hash password and create user document
    hashed_pw = hash_password(user_data.password)
    user_doc = {
        'name': user_data.name,
        'email': email,
        'password': hashed_pw,
        'notification_email': email,
        'default_reminder_offset': 60,
        'email_verified': True,
        'created_at': datetime.utcnow(),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Clean up OTP
    await db.otp_codes.delete_one({'email': email})

    # Create access token
    token = create_access_token(user_id, email)

    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'id': user_id,
            'name': user_data.name,
            'email': email,
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
