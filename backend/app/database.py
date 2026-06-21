from pymongo import AsyncMongoClient
from app.config import settings

client = AsyncMongoClient(settings.MONGODB_URL)
db = client[settings.DB_NAME]


async def create_indexes():
    """Create database indexes for optimal query performance."""
    # Unique index on user email
    await db.users.create_index('email', unique=True)
    # Index on tasks by user_id for fast task lookups
    await db.tasks.create_index('user_id')
    # Index on job_applications by user_id for fast job lookups
    await db.job_applications.create_index('user_id')
    # OTP indexes: unique email + TTL auto-expiry after 10 minutes
    await db.otp_codes.create_index('email', unique=True)
    await db.otp_codes.create_index('expires_at', expireAfterSeconds=0)
    print('Database indexes created successfully')
