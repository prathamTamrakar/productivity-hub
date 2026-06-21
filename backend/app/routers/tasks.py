from datetime import datetime, date

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import db
from app.models.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.auth_service import get_current_user

router = APIRouter(prefix='/api/tasks', tags=['tasks'])


def _doc_to_response(doc: dict) -> dict:
    """Convert a MongoDB task document to a response-friendly dict."""
    task = {**doc}
    task['id'] = str(task.pop('_id'))
    task.pop('user_id', None)
    return task


@router.get('/today')
async def get_today_tasks(current_user: dict = Depends(get_current_user)):
    """Get today's tasks and overdue tasks."""
    today_str = date.today().strftime('%Y-%m-%d')
    user_id = current_user['id']

    # Today's tasks
    today_cursor = db.tasks.find({
        'user_id': user_id,
        'date': today_str,
    })
    today_tasks = []
    async for doc in today_cursor:
        today_tasks.append(_doc_to_response(doc))

    # Overdue tasks (date < today AND not completed)
    overdue_cursor = db.tasks.find({
        'user_id': user_id,
        'date': {'$lt': today_str},
        'status': {'$ne': 'completed'},
    })
    overdue_tasks = []
    async for doc in overdue_cursor:
        overdue_tasks.append(_doc_to_response(doc))

    return {'today': today_tasks, 'overdue': overdue_tasks}


@router.get('/upcoming')
async def get_upcoming_tasks(
    limit: int = Query(5, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    """Get upcoming tasks sorted by date and time."""
    today_str = date.today().strftime('%Y-%m-%d')
    user_id = current_user['id']

    cursor = db.tasks.find({
        'user_id': user_id,
        'date': {'$gte': today_str},
        'status': {'$ne': 'completed'},
    }).sort([('date', 1), ('time', 1)]).limit(limit)

    tasks = []
    async for doc in cursor:
        tasks.append(_doc_to_response(doc))

    return tasks


@router.get('/')
async def get_tasks(
    month: int = Query(None, ge=1, le=12),
    year: int = Query(None, ge=2000, le=2100),
    date_filter: str = Query(None, alias='date'),
    status: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Get tasks with optional filters for month/year, date, and status."""
    user_id = current_user['id']
    query = {'user_id': user_id}

    if date_filter:
        query['date'] = date_filter
    elif month and year:
        # Filter by date strings starting with 'YYYY-MM'
        month_prefix = f'{year:04d}-{month:02d}'
        query['date'] = {'$regex': f'^{month_prefix}'}

    if status:
        query['status'] = status

    cursor = db.tasks.find(query).sort([('date', 1), ('time', 1)])
    tasks = []
    async for doc in cursor:
        tasks.append(_doc_to_response(doc))

    return tasks


@router.post('/', response_model=TaskResponse, status_code=201)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new task."""
    now = datetime.utcnow()
    task_doc = {
        **task_data.model_dump(),
        'user_id': current_user['id'],
        'email_sent': False,
        'created_at': now,
        'updated_at': now,
    }

    result = await db.tasks.insert_one(task_doc)
    task_doc['_id'] = result.inserted_id

    return _doc_to_response(task_doc)


@router.put('/{task_id}', response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update an existing task."""
    update_fields = {k: v for k, v in task_data.model_dump().items() if v is not None}

    if not update_fields:
        raise HTTPException(status_code=400, detail='No fields to update')

    update_fields['updated_at'] = datetime.utcnow()

    # If date, time, or reminder_offset changed, reset email_sent
    if any(k in update_fields for k in ('date', 'time', 'reminder_offset')):
        update_fields['email_sent'] = False

    result = await db.tasks.find_one_and_update(
        {'_id': ObjectId(task_id), 'user_id': current_user['id']},
        {'$set': update_fields},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail='Task not found')

    return _doc_to_response(result)


@router.delete('/{task_id}')
async def delete_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a task."""
    result = await db.tasks.delete_one({
        '_id': ObjectId(task_id),
        'user_id': current_user['id'],
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Task not found')

    return {'message': 'Task deleted successfully'}


@router.patch('/{task_id}/status')
async def update_task_status(
    task_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update only the status of a task."""
    status = status_data.get('status')
    if status not in ('pending', 'in_progress', 'completed'):
        raise HTTPException(status_code=400, detail='Invalid status value')

    result = await db.tasks.find_one_and_update(
        {'_id': ObjectId(task_id), 'user_id': current_user['id']},
        {'$set': {'status': status, 'updated_at': datetime.utcnow()}},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail='Task not found')

    return _doc_to_response(result)
