from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(env_file='.env')

    MONGODB_URL: str
    DB_NAME: str = 'pratham_dashboard'
    JWT_SECRET: str
    JWT_ALGORITHM: str = 'HS256'
    JWT_EXPIRATION_HOURS: int = 24
    SMTP_HOST: str = 'smtp.sendgrid.net'
    SMTP_PORT: int = 587
    SMTP_USER: str = ''
    SMTP_PASS: str = ''
    FROM_EMAIL: str = ''
    FRONTEND_URL: str = 'http://localhost:5173'


settings = Settings()
