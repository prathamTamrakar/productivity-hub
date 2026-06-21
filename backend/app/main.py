from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    from app.database import create_indexes
    from app.scheduler import start_scheduler
    await create_indexes()
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

from app.routers import auth, tasks, jobs  # noqa: E402

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(jobs.router)


@app.get('/')
async def root():
    """Health check endpoint."""
    return {'status': 'ok', 'message': 'Pratham Dashboard API'}
