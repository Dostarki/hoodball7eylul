from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta, timezone
import os
import re
import uuid
import secrets
import jwt

router = APIRouter(prefix='/api')
db = None  # injected from server.py

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-change-me')
X_RE = re.compile(r'^[A-Za-z0-9_]{1,15}$')
WALLET_RE = re.compile(r'^0x[a-fA-F0-9]{40}$')
CORE_TASKS = ('follow', 'rt', 'quote')

DEFAULT_SETTINGS = {
    'follow_url': 'https://x.com/goalhoodz',
    'follow_points': 50,
    'rt_url': 'https://x.com/goalhoodz',
    'rt_points': 50,
    'quote_text': 'I just secured my Early Access ticket for Futbot League - 1-bit head soccer on Robinhood Chain.',
    'quote_url': 'https://x.com/goalhoodz',
    'quote_points': 100,
}


def now():
    return datetime.now(timezone.utc)


def today():
    return now().strftime('%Y-%m-%d')


def make_token(sub: str, role: str, hours: int) -> str:
    return jwt.encode({'sub': sub, 'role': role, 'exp': now() + timedelta(hours=hours)}, JWT_SECRET, algorithm='HS256')


def decode(authorization: Optional[str], role: str) -> dict:
    if not authorization or not authorization.lower().startswith('bearer '):
        raise HTTPException(401, 'Not authenticated')
    try:
        payload = jwt.decode(authorization.split(' ', 1)[1], JWT_SECRET, algorithms=['HS256'])
    except jwt.PyJWTError:
        raise HTTPException(401, 'Invalid or expired token')
    if payload.get('role') != role:
        raise HTTPException(403, 'Forbidden')
    return payload


async def admin_guard(authorization: Optional[str] = Header(None)):
    return decode(authorization, 'admin')


async def current_participant(authorization: Optional[str] = Header(None)) -> dict:
    payload = decode(authorization, 'early')
    p = await db.early_participants.find_one({'id': payload['sub']})
    if not p:
        raise HTTPException(401, 'Participant not found')
    return p


async def get_settings() -> dict:
    s = await db.early_settings.find_one({'key': 'main'}, {'_id': 0, 'key': 0})
    return {**DEFAULT_SETTINGS, **(s or {})}


def task_points(s: dict, task: str) -> int:
    return int(s.get(f'{task}_points', 0))


def participant_view(p: dict) -> dict:
    tasks = p.get('tasks', {})
    return {
        'id': p['id'],
        'ticket_no': p['ticket_no'],
        'x_username': p['x_username'],
        'wallet': p['wallet'],
        'wallet_short': p['wallet'][:6] + '...' + p['wallet'][-4:],
        'points': p.get('points', 0),
        'tasks': {t: bool(tasks.get(t)) for t in CORE_TASKS},
        'completed': all(tasks.get(t) for t in CORE_TASKS),
        'completed_at': p['completed_at'].isoformat() if p.get('completed_at') else None,
        'daily_done': p.get('daily_done', {}),
        'created_at': p['created_at'].isoformat(),
    }


def daily_view(t: dict) -> dict:
    return {
        'id': t['id'], 'title': t['title'], 'url': t.get('url', ''), 'points': t['points'],
        'active': t.get('active', True), 'created_at': t['created_at'].isoformat(),
    }


# ---------- models ----------
class RegisterBody(BaseModel):
    x_username: str
    wallet: str


class AdminLoginBody(BaseModel):
    password: str


class SettingsBody(BaseModel):
    follow_url: str
    follow_points: int = Field(ge=0, le=100000)
    rt_url: str
    rt_points: int = Field(ge=0, le=100000)
    quote_text: str = Field(max_length=240)
    quote_url: str
    quote_points: int = Field(ge=0, le=100000)


class DailyTaskBody(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    url: str = ''
    points: int = Field(ge=0, le=100000)
    active: bool = True


# ---------- public ----------
@router.get('/early/config')
async def early_config():
    s = await get_settings()
    tasks = await db.early_daily_tasks.find({'active': True}).sort('created_at', -1).to_list(100)
    return {'settings': s, 'daily_tasks': [daily_view(t) for t in tasks], 'today': today()}


@router.post('/early/register')
async def early_register(body: RegisterBody):
    x = body.x_username.strip().lstrip('@')
    if not X_RE.match(x):
        raise HTTPException(400, 'X username must be 1-15 chars: letters, numbers, underscore')
    if not WALLET_RE.match(body.wallet.strip()):
        raise HTTPException(400, 'Wallet must be a valid 0x address (42 chars)')
    wallet = body.wallet.strip().lower()
    p = await db.early_participants.find_one({'wallet': wallet})
    if p:
        if p['x_username_lc'] != x.lower():
            raise HTTPException(409, f'This wallet is already registered as @{p["x_username"]}')
    else:
        taken = await db.early_participants.find_one({'x_username_lc': x.lower()})
        if taken:
            raise HTTPException(409, 'This X username is already registered with another wallet')
        c = await db.counters.find_one_and_update({'key': 'ticket'}, {'$inc': {'seq': 1}}, upsert=True, return_document=True)
        p = {
            'id': str(uuid.uuid4()), 'ticket_no': c['seq'], 'x_username': x, 'x_username_lc': x.lower(),
            'wallet': wallet, 'points': 0, 'tasks': {}, 'daily_done': {}, 'completed_at': None, 'created_at': now(),
        }
        await db.early_participants.insert_one(p)
    return {'token': make_token(p['id'], 'early', 24 * 30), 'participant': participant_view(p)}


@router.get('/early/me')
async def early_me(p=Depends(current_participant)):
    return participant_view(p)


@router.post('/early/tasks/{task}/complete')
async def early_complete(task: str, p=Depends(current_participant)):
    if task not in CORE_TASKS:
        raise HTTPException(400, 'Unknown task')
    if p.get('tasks', {}).get(task):
        return participant_view(p)
    s = await get_settings()
    update = {'$set': {f'tasks.{task}': True}, '$inc': {'points': task_points(s, task)}}
    done = {**p.get('tasks', {}), task: True}
    if all(done.get(t) for t in CORE_TASKS):
        update['$set']['completed_at'] = now()
    await db.early_participants.update_one({'id': p['id']}, update)
    return participant_view(await db.early_participants.find_one({'id': p['id']}))


@router.post('/early/daily/{task_id}/complete')
async def early_daily_complete(task_id: str, p=Depends(current_participant)):
    t = await db.early_daily_tasks.find_one({'id': task_id, 'active': True})
    if not t:
        raise HTTPException(404, 'Task not found')
    if p.get('daily_done', {}).get(task_id) == today():
        raise HTTPException(409, 'Already completed today')
    await db.early_participants.update_one({'id': p['id']}, {'$set': {f'daily_done.{task_id}': today()}, '$inc': {'points': int(t['points'])}})
    return participant_view(await db.early_participants.find_one({'id': p['id']}))


@router.get('/early/list')
async def early_list(limit: int = 200):
    limit = max(1, min(limit, 500))
    rows = await db.early_participants.find({'completed_at': {'$ne': None}}).sort([('points', -1), ('completed_at', 1)]).to_list(limit)
    total = await db.early_participants.count_documents({'completed_at': {'$ne': None}})
    out = []
    for i, p in enumerate(rows):
        v = participant_view(p)
        v.pop('wallet')
        v.pop('daily_done')
        v['rank'] = i + 1
        out.append(v)
    return {'total': total, 'rows': out}


# ---------- admin ----------
@router.post('/admin/login')
async def admin_login(body: AdminLoginBody, request: Request):
    ip = request.client.host if request.client else 'unknown'
    attempt = await db.login_attempts.find_one({'identifier': f'admin:{ip}'})
    if attempt and attempt.get('count', 0) >= 5 and attempt.get('locked_until') and attempt['locked_until'] > now():
        raise HTTPException(429, 'Too many attempts. Try again in 15 minutes')
    expected = os.environ.get('ADMIN_PASSWORD', '')
    if not expected or not secrets.compare_digest(body.password, expected):
        await db.login_attempts.update_one(
            {'identifier': f'admin:{ip}'},
            {'$inc': {'count': 1}, '$set': {'locked_until': now() + timedelta(minutes=15)}}, upsert=True)
        raise HTTPException(401, 'Wrong password')
    await db.login_attempts.delete_one({'identifier': f'admin:{ip}'})
    return {'token': make_token('admin', 'admin', 12)}


@router.get('/admin/me')
async def admin_me(_=Depends(admin_guard)):
    return {'role': 'admin'}


@router.get('/admin/settings')
async def admin_get_settings(_=Depends(admin_guard)):
    return await get_settings()


@router.put('/admin/settings')
async def admin_put_settings(body: SettingsBody, _=Depends(admin_guard)):
    await db.early_settings.update_one({'key': 'main'}, {'$set': body.model_dump()}, upsert=True)
    return await get_settings()


@router.get('/admin/daily-tasks')
async def admin_daily_list(_=Depends(admin_guard)):
    rows = await db.early_daily_tasks.find().sort('created_at', -1).to_list(200)
    return [daily_view(t) for t in rows]


@router.post('/admin/daily-tasks')
async def admin_daily_create(body: DailyTaskBody, _=Depends(admin_guard)):
    t = {'id': str(uuid.uuid4()), **body.model_dump(), 'created_at': now()}
    await db.early_daily_tasks.insert_one(t)
    return daily_view(t)


@router.put('/admin/daily-tasks/{task_id}')
async def admin_daily_update(task_id: str, body: DailyTaskBody, _=Depends(admin_guard)):
    r = await db.early_daily_tasks.update_one({'id': task_id}, {'$set': body.model_dump()})
    if not r.matched_count:
        raise HTTPException(404, 'Task not found')
    return daily_view(await db.early_daily_tasks.find_one({'id': task_id}))


@router.delete('/admin/daily-tasks/{task_id}')
async def admin_daily_delete(task_id: str, _=Depends(admin_guard)):
    r = await db.early_daily_tasks.delete_one({'id': task_id})
    if not r.deleted_count:
        raise HTTPException(404, 'Task not found')
    return {'ok': True}


@router.get('/admin/participants')
async def admin_participants(_=Depends(admin_guard)):
    rows = await db.early_participants.find().sort('created_at', -1).to_list(2000)
    return [participant_view(p) for p in rows]


async def ensure_indexes():
    await db.early_participants.create_index('wallet', unique=True)
    await db.early_participants.create_index('x_username_lc', unique=True)
    await db.early_participants.create_index([('points', -1), ('completed_at', 1)])
    await db.early_daily_tasks.create_index('id', unique=True)
    await db.login_attempts.create_index('identifier')
