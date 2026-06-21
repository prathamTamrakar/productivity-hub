from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class JobCreate(BaseModel):
    """Schema for creating a new job application."""
    company: str
    role: str
    status: Literal['applied', 'interview', 'offer', 'rejected'] = 'applied'
    application_date: str  # YYYY-MM-DD
    job_url: Optional[str] = None
    job_type: Literal['on-campus', 'off-campus'] = 'off-campus'
    location: Literal['remote', 'onsite', 'hybrid'] = 'remote'
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None  # YYYY-MM-DD


class JobUpdate(BaseModel):
    """Schema for updating a job application."""
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[Literal['applied', 'interview', 'offer', 'rejected']] = None
    application_date: Optional[str] = None
    job_url: Optional[str] = None
    job_type: Optional[Literal['on-campus', 'off-campus']] = None
    location: Optional[Literal['remote', 'onsite', 'hybrid']] = None
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None


class JobResponse(BaseModel):
    """Schema for job application response data."""
    id: str
    company: str
    role: str
    status: str = 'applied'
    application_date: str
    job_url: Optional[str] = None
    job_type: str = 'off-campus'
    location: str = 'remote'
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_email_sent: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class JobStats(BaseModel):
    """Schema for job application statistics."""
    total: int
    applied: int
    interview: int
    offer: int
    rejected: int
    interview_rate: float
    offer_rate: float
