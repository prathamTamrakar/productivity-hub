from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import db
from app.models.job import JobCreate, JobResponse, JobStats, JobUpdate
from app.services.auth_service import get_current_user

router = APIRouter(prefix='/api/jobs', tags=['jobs'])


def _doc_to_response(doc: dict) -> dict:
    """Convert a MongoDB job document to a response-friendly dict."""
    job = {**doc}
    job['id'] = str(job.pop('_id'))
    job.pop('user_id', None)
    return job


@router.get('/stats', response_model=JobStats)
async def get_job_stats(current_user: dict = Depends(get_current_user)):
    """Get aggregated job application statistics."""
    user_id = current_user['id']

    pipeline = [
        {'$match': {'user_id': user_id}},
        {'$group': {
            '_id': '$status',
            'count': {'$sum': 1},
        }},
    ]

    status_counts = {'applied': 0, 'interview': 0, 'offer': 0, 'rejected': 0}
    cursor = await db.job_applications.aggregate(pipeline)
    async for doc in cursor:
        if doc['_id'] in status_counts:
            status_counts[doc['_id']] = doc['count']

    total = sum(status_counts.values())
    interview_rate = (status_counts['interview'] / total * 100) if total > 0 else 0.0
    offer_rate = (status_counts['offer'] / total * 100) if total > 0 else 0.0

    return JobStats(
        total=total,
        applied=status_counts['applied'],
        interview=status_counts['interview'],
        offer=status_counts['offer'],
        rejected=status_counts['rejected'],
        interview_rate=round(interview_rate, 1),
        offer_rate=round(offer_rate, 1),
    )


@router.get('/')
async def get_jobs(
    status: str = Query(None),
    job_type: str = Query(None),
    search: str = Query(None),
    sort: str = Query('newest'),
    current_user: dict = Depends(get_current_user),
):
    """Get job applications with optional filters and sorting."""
    user_id = current_user['id']
    query = {'user_id': user_id}

    if status:
        query['status'] = status

    if job_type:
        query['job_type'] = job_type

    if search:
        # Case-insensitive regex search on company and role
        query['$or'] = [
            {'company': {'$regex': search, '$options': 'i'}},
            {'role': {'$regex': search, '$options': 'i'}},
        ]

    # Determine sort order
    if sort == 'oldest':
        sort_key = [('created_at', 1)]
    elif sort == 'company':
        sort_key = [('company', 1)]
    else:  # newest (default)
        sort_key = [('created_at', -1)]

    cursor = db.job_applications.find(query).sort(sort_key)
    jobs = []
    async for doc in cursor:
        jobs.append(_doc_to_response(doc))

    return jobs


@router.post('/', response_model=JobResponse, status_code=201)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new job application."""
    now = datetime.utcnow()
    job_doc = {
        **job_data.model_dump(),
        'user_id': current_user['id'],
        'follow_up_email_sent': False,
        'created_at': now,
        'updated_at': now,
    }

    result = await db.job_applications.insert_one(job_doc)
    job_doc['_id'] = result.inserted_id

    return _doc_to_response(job_doc)


@router.put('/{job_id}', response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update an existing job application."""
    update_fields = {k: v for k, v in job_data.model_dump().items() if v is not None}

    if not update_fields:
        raise HTTPException(status_code=400, detail='No fields to update')

    update_fields['updated_at'] = datetime.utcnow()

    # If follow_up_date changed, reset follow_up_email_sent
    if 'follow_up_date' in update_fields:
        update_fields['follow_up_email_sent'] = False

    result = await db.job_applications.find_one_and_update(
        {'_id': ObjectId(job_id), 'user_id': current_user['id']},
        {'$set': update_fields},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail='Job application not found')

    return _doc_to_response(result)


@router.delete('/{job_id}')
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a job application."""
    result = await db.job_applications.delete_one({
        '_id': ObjectId(job_id),
        'user_id': current_user['id'],
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Job application not found')

    return {'message': 'Job application deleted successfully'}


@router.patch('/{job_id}/status')
async def update_job_status(
    job_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update only the status of a job application."""
    status = status_data.get('status')
    if status not in ('applied', 'interview', 'offer', 'rejected'):
        raise HTTPException(status_code=400, detail='Invalid status value')

    result = await db.job_applications.find_one_and_update(
        {'_id': ObjectId(job_id), 'user_id': current_user['id']},
        {'$set': {'status': status, 'updated_at': datetime.utcnow()}},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail='Job application not found')

    return _doc_to_response(result)
