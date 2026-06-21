from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    title: str
    description: Optional[str] = None
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    priority: Literal['low', 'medium', 'high', 'important']
    category: str = 'Personal'
    status: Literal['pending', 'in_progress', 'completed'] = 'pending'
    is_important: bool = False
    notify_email: bool = False
    reminder_offset: int = 60  # minutes before task time


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    priority: Optional[Literal['low', 'medium', 'high', 'important']] = None
    category: Optional[str] = None
    status: Optional[Literal['pending', 'in_progress', 'completed']] = None
    is_important: Optional[bool] = None
    notify_email: Optional[bool] = None
    reminder_offset: Optional[int] = None


class TaskResponse(BaseModel):
    """Schema for task response data."""
    id: str
    title: str
    description: Optional[str] = None
    date: str
    time: str
    priority: str
    category: str = 'Personal'
    status: str = 'pending'
    is_important: bool = False
    notify_email: bool = False
    reminder_offset: int = 60
    email_sent: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
