from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class AccountCreate(BaseModel):
    """Schema for creating a new account/wallet."""
    name: str
    type: Literal['cash', 'bank', 'upi', 'credit_card', 'wallet', 'other']
    initial_balance: int  # stored in paise (integer)
    icon: Optional[str] = 'Wallet'
    color: Optional[str] = '#3b82f6'


class AccountUpdate(BaseModel):
    """Schema for updating an account/wallet."""
    name: Optional[str] = None
    type: Optional[Literal['cash', 'bank', 'upi', 'credit_card', 'wallet', 'other']] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    current_balance: Optional[int] = None


class AccountResponse(BaseModel):
    """Schema for account response data."""
    id: str
    name: str
    type: str
    initial_balance: int
    current_balance: int
    currency: str = 'INR'
    icon: str
    color: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CategoryCreate(BaseModel):
    """Schema for creating a custom category."""
    name: str
    type: Literal['income', 'expense']
    icon: Optional[str] = 'Grid'
    color: Optional[str] = '#6b7280'


class CategoryResponse(BaseModel):
    """Schema for category response data."""
    id: str
    name: str
    type: str
    icon: str
    color: str
    is_default: bool
    is_active: bool


class TransactionCreate(BaseModel):
    """Schema for creating a transaction."""
    type: Literal['income', 'expense', 'transfer']
    amount: int  # stored in paise (must be > 0)
    account_id: Optional[str] = None
    to_account_id: Optional[str] = None
    category_id: Optional[str] = None
    note: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction."""
    type: Optional[Literal['income', 'expense', 'transfer']] = None
    amount: Optional[int] = None
    account_id: Optional[str] = None
    to_account_id: Optional[str] = None
    category_id: Optional[str] = None
    note: Optional[str] = None
    date: Optional[datetime] = None


class TransactionResponse(BaseModel):
    """Schema for transaction response data."""
    id: str
    type: str
    amount: int
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    to_account_id: Optional[str] = None
    to_account_name: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    category_icon: Optional[str] = None
    note: Optional[str] = None
    date: datetime
    is_recurring_generated: bool = False
    recurring_rule_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class BudgetCreate(BaseModel):
    """Schema for creating or updating a budget."""
    category_id: str
    month: str  # YYYY-MM
    limit_amount: int


class BudgetResponse(BaseModel):
    """Schema for budget response data."""
    id: str
    category_id: str
    month: str
    limit_amount: int
    created_at: datetime
    updated_at: datetime
