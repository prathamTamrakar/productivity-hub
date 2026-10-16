import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SendOTP(BaseModel):
    """Schema for requesting an OTP to be sent."""
    email: str

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class VerifyOTP(BaseModel):
    """Schema for verifying the OTP."""
    email: str
    otp: str


class UserCreate(BaseModel):
    """Schema for user registration."""
    name: str
    email: str
    password: str = Field(..., min_length=6)
    otp: Optional[str] = None

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserLogin(BaseModel):
    """Schema for user login."""
    email: str
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    name: Optional[str] = None
    notification_email: Optional[str] = None
    default_reminder_offset: Optional[int] = None


class PasswordChange(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    """Schema for user response data."""
    id: str
    name: str
    email: str
    notification_email: Optional[str] = None
    default_reminder_offset: int = 60
    created_at: Optional[datetime] = None
