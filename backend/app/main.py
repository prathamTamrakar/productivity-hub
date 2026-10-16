from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    from app.database import create_indexes
    from app.scheduler import start_scheduler
    from app.routers.money import seed_default_categories
    await create_indexes()
    await seed_default_categories()
    start_scheduler()
    print('Pratham Dashboard API started')
    yield
    # Shutdown
    from app.scheduler import stop_scheduler
    stop_scheduler()


app = FastAPI(title='Pratham Dashboard API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', "https://productivity-hub-pratham.vercel.app"],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

from app.routers import auth, tasks, jobs, money  # noqa: E402

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(jobs.router)
app.include_router(money.router)


from datetime import datetime

@app.get('/')
@app.get('/health')
@app.get('/api/health')
async def health_check():
    """Keep-alive and health check endpoint to prevent Render inactivity spindown."""
    return {
        'status': 'alive',
        'message': 'Pratham Dashboard API is running and healthy',
        'timestamp': datetime.utcnow().isoformat(),
    }


@app.get('/ping')
@app.get('/api/ping')
async def ping():
    """Lightweight ping endpoint for uptime monitors."""
    return {'status': 'pong'}
