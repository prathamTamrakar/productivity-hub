from datetime import datetime, timedelta

from bson import ObjectId
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import db
from app.services.email_service import send_task_reminder, send_followup_reminder

scheduler = AsyncIOScheduler()


async def check_reminders():
    """Check for pending task and job follow-up reminders and send emails."""
    try:
        now = datetime.now()
        today_str = now.strftime('%Y-%m-%d')

        # ── Task Reminders ──────────────────────────────────────────────
        # Find tasks that need email reminders
        task_cursor = db.tasks.find({
            '$or': [
                {'notify_email': True},
                {'is_important': True},
            ],
            'email_sent': False,
            'status': {'$ne': 'completed'},
        })

        async for task in task_cursor:
            try:
                # Parse the task date and time
                task_datetime_str = f"{task['date']} {task['time']}"
                task_datetime = datetime.strptime(task_datetime_str, '%Y-%m-%d %H:%M')

                # Calculate reminder time (task time minus offset)
                reminder_offset = task.get('reminder_offset', 60)
                reminder_time = task_datetime - timedelta(minutes=reminder_offset)

                # Send email if reminder time has passed
                if reminder_time <= now:
                    # Look up the user's notification email
                    user = await db.users.find_one({'_id': ObjectId(task['user_id'])})
                    if user:
                        to_email = user.get('notification_email') or user.get('email')
                        await send_task_reminder(
                            to_email=to_email,
                            task_title=task['title'],
                            task_description=task.get('description', ''),
                            due_date=task['date'],
                            due_time=task['time'],
                        )

                        # Mark email as sent
                        await db.tasks.update_one(
                            {'_id': task['_id']},
                            {'$set': {'email_sent': True}},
                        )
                        print(f'Sent task reminder for: {task["title"]}')
            except Exception as e:
                print(f'Error processing task reminder for {task.get("title", "unknown")}: {e}')

        # ── Job Follow-up Reminders ─────────────────────────────────────
        # Find jobs with follow-up dates that have arrived
        job_cursor = db.job_applications.find({
            'follow_up_date': {'$lte': today_str, '$ne': None},
            'follow_up_email_sent': False,
        })

        async for job in job_cursor:
            try:
                user = await db.users.find_one({'_id': ObjectId(job['user_id'])})
                if user:
                    to_email = user.get('notification_email') or user.get('email')
                    await send_followup_reminder(
                        to_email=to_email,
                        company=job['company'],
                        role=job['role'],
                        follow_up_date=job.get('follow_up_date', ''),
                    )

                    # Mark follow-up email as sent
                    await db.job_applications.update_one(
                        {'_id': job['_id']},
                        {'$set': {'follow_up_email_sent': True}},
                    )
                    print(f'Sent follow-up reminder for: {job["role"]} at {job["company"]}')
            except Exception as e:
                print(f'Error processing job follow-up for {job.get("company", "unknown")}: {e}')

    except Exception as e:
        print(f'Error in check_reminders: {e}')


def start_scheduler():
    """Start the APScheduler with the reminder check job."""
    scheduler.add_job(
        check_reminders,
        trigger='interval',
        minutes=1,
        id='check_reminders',
        replace_existing=True,
    )
    scheduler.start()
    print('Scheduler started — checking reminders every 1 minute')


def stop_scheduler():
    """Shut down the scheduler gracefully."""
    scheduler.shutdown()
    print('Scheduler stopped')
