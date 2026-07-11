from datetime import datetime, date
from typing import Literal, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import db, client
from app.services.auth_service import get_current_user
from app.models.money import (
    AccountCreate, AccountUpdate, AccountResponse,
    CategoryCreate, CategoryResponse,
    TransactionCreate, TransactionUpdate, TransactionResponse
)

router = APIRouter(prefix='/api/money', tags=['money'])


# Helper Conversions
def _account_doc_to_response(doc: dict) -> dict:
    account = {**doc}
    account['id'] = str(account.pop('_id'))
    account.pop('user_id', None)
    return account


def _category_doc_to_response(doc: dict) -> dict:
    category = {**doc}
    category['id'] = str(category.pop('_id'))
    category.pop('user_id', None)
    return category


async def run_in_session(op_func, *args, **kwargs):
    """
    Runs database operations in a transaction session.
    Falls back to a regular execution if MongoDB is not running in a replica set.
    """
    try:
        async with await client.start_session() as session:
            try:
                async with session.start_transaction():
                    return await op_func(session, *args, **kwargs)
            except Exception as e:
                err_msg = str(e)
                if 'transaction' in err_msg.lower() or 'replica set' in err_msg.lower() or 'session' in err_msg.lower():
                    # Standalone fallback: execute without session transaction
                    return await op_func(None, *args, **kwargs)
                raise e
    except Exception as e:
        err_msg = str(e)
        if 'session' in err_msg.lower() or 'replica set' in err_msg.lower() or 'transaction' in err_msg.lower():
            # Completely standalone MongoDB fallback (no session support)
            return await op_func(None, *args, **kwargs)
        raise e


async def apply_balance_effect(session, account_id: Optional[str], type: str, amount: int, to_account_id: Optional[str] = None, factor: int = 1):
    """
    Updates the balances of the corresponding accounts.
    factor = 1 for applying, -1 for reversing transaction.
    """
    if not account_id:
        return
    acc_oid = ObjectId(account_id)
    if type == 'income':
        await db.accounts.update_one(
            {'_id': acc_oid},
            {'$inc': {'current_balance': amount * factor}},
            session=session
        )
    elif type == 'expense':
        await db.accounts.update_one(
            {'_id': acc_oid},
            {'$inc': {'current_balance': -amount * factor}},
            session=session
        )
    elif type == 'transfer' and to_account_id:
        to_acc_oid = ObjectId(to_account_id)
        # Decrement source account
        await db.accounts.update_one(
            {'_id': acc_oid},
            {'$inc': {'current_balance': -amount * factor}},
            session=session
        )
        # Increment destination account
        await db.accounts.update_one(
            {'_id': to_acc_oid},
            {'$inc': {'current_balance': amount * factor}},
            session=session
        )


async def seed_default_categories():
    """Seeds global system categories if not already present."""
    defaults = [
        {'name': 'Salary', 'type': 'income', 'icon': 'Briefcase', 'color': '#10b981'},
        {'name': 'Freelance', 'type': 'income', 'icon': 'DollarSign', 'color': '#06b6d4'},
        {'name': 'Food', 'type': 'expense', 'icon': 'Utensils', 'color': '#f97316'},
        {'name': 'Rent', 'type': 'expense', 'icon': 'Home', 'color': '#3b82f6'},
        {'name': 'Travel', 'type': 'expense', 'icon': 'Car', 'color': '#eab308'},
        {'name': 'Shopping', 'type': 'expense', 'icon': 'ShoppingBag', 'color': '#ec4899'},
        {'name': 'Bills', 'type': 'expense', 'icon': 'Receipt', 'color': '#a855f7'},
        {'name': 'EMI', 'type': 'expense', 'icon': 'CreditCard', 'color': '#6366f1'},
        {'name': 'Health', 'type': 'expense', 'icon': 'HeartPulse', 'color': '#ef4444'},
        {'name': 'Education', 'type': 'expense', 'icon': 'GraduationCap', 'color': '#14b8a6'},
        {'name': 'Entertainment', 'type': 'expense', 'icon': 'Film', 'color': '#8b5cf6'},
        {'name': 'Others', 'type': 'expense', 'icon': 'Grid', 'color': '#6b7280'},
        {'name': 'Others', 'type': 'income', 'icon': 'Grid', 'color': '#6b7280'},
    ]
    count = await db.categories.count_documents({'is_default': True, 'user_id': None})
    if count == 0:
        for cat in defaults:
            await db.categories.insert_one({
                **cat,
                'user_id': None,
                'is_default': True,
                'is_active': True
            })
        print('Default categories seeded successfully')


# === ACCOUNTS ENDPOINTS ===

@router.post('/accounts', response_model=AccountResponse, status_code=201)
async def create_account(account_data: AccountCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.utcnow()
    doc = {
        **account_data.model_dump(),
        'user_id': current_user['id'],
        'current_balance': account_data.initial_balance,
        'currency': 'INR',
        'is_active': True,
        'created_at': now,
        'updated_at': now,
    }
    result = await db.accounts.insert_one(doc)
    doc['_id'] = result.inserted_id
    return _account_doc_to_response(doc)


@router.get('/accounts', response_model=list[AccountResponse])
async def list_accounts(current_user: dict = Depends(get_current_user)):
    cursor = db.accounts.find({'user_id': current_user['id'], 'is_active': True})
    accounts = []
    async for doc in cursor:
        accounts.append(_account_doc_to_response(doc))
    return accounts


@router.patch('/accounts/{account_id}', response_model=AccountResponse)
async def update_account(account_id: str, account_data: AccountUpdate, current_user: dict = Depends(get_current_user)):
    update_fields = {k: v for k, v in account_data.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail='No fields to update')
    
    update_fields['updated_at'] = datetime.utcnow()
    
    result = await db.accounts.find_one_and_update(
        {'_id': ObjectId(account_id), 'user_id': current_user['id']},
        {'$set': update_fields},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail='Account not found')
    
    return _account_doc_to_response(result)


@router.delete('/accounts/{account_id}')
async def delete_account(
    account_id: str,
    strategy: Literal['block', 'delete_all', 'reassign'] = Query('block'),
    target_account_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    acc_oid = ObjectId(account_id)
    
    account = await db.accounts.find_one({'_id': acc_oid, 'user_id': user_id, 'is_active': True})
    if not account:
        raise HTTPException(status_code=404, detail='Account not found')
        
    tx_count = await db.transactions.count_documents({
        'user_id': user_id,
        'deleted_at': None,
        '$or': [{'account_id': acc_oid}, {'to_account_id': acc_oid}]
    })
    
    if tx_count > 0 and strategy == 'block':
        return {
            'status': 'warning',
            'code': 'ACCOUNT_HAS_TRANSACTIONS',
            'message': 'Account has active transactions. Choose a deletion strategy.',
            'transaction_count': tx_count
        }
        
    async def op(session):
        if tx_count > 0:
            if strategy == 'delete_all':
                cursor = db.transactions.find({
                    'user_id': user_id,
                    'deleted_at': None,
                    '$or': [{'account_id': acc_oid}, {'to_account_id': acc_oid}]
                }, session=session)
                async for tx in cursor:
                    # Reverse effect on the OTHER account if this was a transfer
                    if tx['type'] == 'transfer':
                        if str(tx['account_id']) == account_id and tx.get('to_account_id'):
                            await db.accounts.update_one(
                                {'_id': tx['to_account_id']},
                                {'$inc': {'current_balance': -tx['amount']}},
                                session=session
                            )
                        elif str(tx.get('to_account_id')) == account_id:
                            await db.accounts.update_one(
                                {'_id': tx['account_id']},
                                {'$inc': {'current_balance': tx['amount']}},
                                session=session
                            )
                    await db.transactions.update_one(
                        {'_id': tx['_id']},
                        {'$set': {'deleted_at': datetime.utcnow(), 'updated_at': datetime.utcnow()}},
                        session=session
                    )
            elif strategy == 'reassign':
                if not target_account_id:
                    raise HTTPException(status_code=422, detail='target_account_id is required for reassign strategy')
                target_oid = ObjectId(target_account_id)
                target_acc = await db.accounts.find_one({'_id': target_oid, 'user_id': user_id, 'is_active': True}, session=session)
                if not target_acc:
                    raise HTTPException(status_code=404, detail='Target account not found')
                if target_account_id == account_id:
                    raise HTTPException(status_code=422, detail='Target account cannot be the same as deleted account')
                
                cursor = db.transactions.find({
                    'user_id': user_id,
                    'deleted_at': None,
                    '$or': [{'account_id': acc_oid}, {'to_account_id': acc_oid}]
                }, session=session)
                
                async for tx in cursor:
                    if str(tx['account_id']) == account_id:
                        factor = 1 if tx['type'] == 'income' else -1
                        await db.accounts.update_one(
                            {'_id': target_oid},
                            {'$inc': {'current_balance': tx['amount'] * factor}},
                            session=session
                        )
                        await db.transactions.update_one(
                            {'_id': tx['_id']},
                            {'$set': {'account_id': target_oid, 'updated_at': datetime.utcnow()}},
                            session=session
                        )
                    if tx.get('to_account_id') and str(tx['to_account_id']) == account_id:
                        await db.accounts.update_one(
                            {'_id': target_oid},
                            {'$inc': {'current_balance': tx['amount']}},
                            session=session
                        )
                        await db.transactions.update_one(
                            {'_id': tx['_id']},
                            {'$set': {'to_account_id': target_oid, 'updated_at': datetime.utcnow()}},
                            session=session
                        )
                        
        await db.accounts.update_one(
            {'_id': acc_oid, 'user_id': user_id},
            {'$set': {'is_active': False, 'updated_at': datetime.utcnow()}},
            session=session
        )
        return {'status': 'success', 'message': 'Account deleted successfully'}
        
    return await run_in_session(op)


# === CATEGORIES ENDPOINTS ===

@router.get('/categories', response_model=list[CategoryResponse])
async def list_categories(type: Optional[Literal['income', 'expense']] = Query(None), current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    query = {
        'is_active': True,
        '$or': [
            {'user_id': None, 'is_default': True},
            {'user_id': user_id, 'is_default': False}
        ]
    }
    if type:
        query['type'] = type
        
    cursor = db.categories.find(query)
    categories = []
    async for doc in cursor:
        categories.append(_category_doc_to_response(doc))
    return categories


@router.post('/categories', response_model=CategoryResponse, status_code=201)
async def create_category(category_data: CategoryCreate, current_user: dict = Depends(get_current_user)):
    # Check if category with same name and type already exists for this user (or defaults)
    user_id = current_user['id']
    exists = await db.categories.find_one({
        'name': {'$regex': f"^{category_data.name}$", '$options': 'i'},
        'type': category_data.type,
        'is_active': True,
        '$or': [
            {'user_id': None, 'is_default': True},
            {'user_id': user_id}
        ]
    })
    if exists:
        raise HTTPException(status_code=400, detail='Category already exists')
        
    doc = {
        **category_data.model_dump(),
        'user_id': user_id,
        'is_default': False,
        'is_active': True
    }
    result = await db.categories.insert_one(doc)
    doc['_id'] = result.inserted_id
    return _category_doc_to_response(doc)


@router.delete('/categories/{category_id}')
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    cat_oid = ObjectId(category_id)
    
    cat = await db.categories.find_one({'_id': cat_oid, 'user_id': user_id, 'is_active': True})
    if not cat:
        raise HTTPException(status_code=404, detail='Category not found')
        
    # Get or create the matching type's default "Others" category
    others_cat = await db.categories.find_one({
        'is_default': True,
        'user_id': None,
        'name': 'Others',
        'type': cat['type']
    })
    
    if others_cat:
        others_id = others_cat['_id']
    else:
        others_id = ObjectId()
        await db.categories.insert_one({
            '_id': others_id,
            'user_id': None,
            'name': 'Others',
            'type': cat['type'],
            'icon': 'Grid',
            'color': '#6b7280',
            'is_default': True,
            'is_active': True
        })
        
    # Reassign transactions
    await db.transactions.update_many(
        {'user_id': user_id, 'category_id': cat_oid},
        {'$set': {'category_id': others_id, 'updated_at': datetime.utcnow()}}
    )
    
    # Soft delete category
    await db.categories.update_one(
        {'_id': cat_oid, 'user_id': user_id},
        {'$set': {'is_active': False}}
    )
    return {'status': 'success', 'message': 'Category deleted and transactions reassigned to "Others"'}


# === TRANSACTIONS ENDPOINTS ===

@router.post('/transactions', response_model=TransactionResponse, status_code=201)
async def create_transaction(tx_data: TransactionCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    
    if tx_data.amount <= 0:
        raise HTTPException(status_code=422, detail='Amount must be greater than zero')
        
    if tx_data.type == 'transfer':
        if not tx_data.account_id or not tx_data.to_account_id:
            raise HTTPException(status_code=422, detail='Source and destination accounts are required for transfer')
        if tx_data.account_id == tx_data.to_account_id:
            raise HTTPException(status_code=422, detail='Source and destination accounts cannot be the same')
            
    async def op(session):
        # Validate account exists if provided
        acc = None
        if tx_data.account_id:
            acc = await db.accounts.find_one({'_id': ObjectId(tx_data.account_id), 'user_id': user_id, 'is_active': True}, session=session)
            if not acc:
                raise HTTPException(status_code=404, detail='Source account not found')
            
        to_acc = None
        if tx_data.type == 'transfer':
            to_acc = await db.accounts.find_one({'_id': ObjectId(tx_data.to_account_id), 'user_id': user_id, 'is_active': True}, session=session)
            if not to_acc:
                raise HTTPException(status_code=404, detail='Destination account not found')
        else:
            if tx_data.category_id:
                cat = await db.categories.find_one({
                    '_id': ObjectId(tx_data.category_id),
                    'is_active': True,
                    '$or': [{'user_id': None}, {'user_id': user_id}]
                }, session=session)
                if not cat:
                    raise HTTPException(status_code=404, detail='Category not found')
                    
        now = datetime.utcnow()
        doc = {
            'user_id': user_id,
            'type': tx_data.type,
            'amount': tx_data.amount,
            'account_id': ObjectId(tx_data.account_id) if tx_data.account_id else None,
            'to_account_id': ObjectId(tx_data.to_account_id) if tx_data.to_account_id else None,
            'category_id': ObjectId(tx_data.category_id) if tx_data.category_id else None,
            'note': tx_data.note,
            'date': tx_data.date,
            'attachment_url': None,
            'is_recurring_generated': False,
            'recurring_rule_id': None,
            'created_at': now,
            'updated_at': now,
            'deleted_at': None
        }
        
        await apply_balance_effect(
            session,
            account_id=tx_data.account_id,
            type=tx_data.type,
            amount=tx_data.amount,
            to_account_id=tx_data.to_account_id,
            factor=1
        )
        
        result = await db.transactions.insert_one(doc, session=session)
        doc['_id'] = result.inserted_id
        
        # Format response
        res = {
            **doc,
            'id': str(doc['_id']),
            'account_id': str(doc['account_id']) if doc.get('account_id') else None,
            'account_name': acc['name'] if acc else 'General / Cashless',
            'to_account_id': str(doc['to_account_id']) if doc.get('to_account_id') else None,
            'to_account_name': to_acc['name'] if tx_data.type == 'transfer' else None
        }
        if tx_data.category_id:
            res['category_id'] = str(doc['category_id'])
            res['category_name'] = cat['name']
            res['category_color'] = cat['color']
            res['category_icon'] = cat['icon']
            
        res.pop('_id')
        res.pop('user_id')
        return res
        
    return await run_in_session(op)


@router.get('/transactions')
async def list_transactions(
    account_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query('date_desc'),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    query = {'user_id': user_id, 'deleted_at': None}
    
    if account_id:
        query['$or'] = [
            {'account_id': ObjectId(account_id)},
            {'to_account_id': ObjectId(account_id)}
        ]
        
    if category_id:
        query['category_id'] = ObjectId(category_id)
        
    if type:
        query['type'] = type
        
    if date_from or date_to:
        date_q = {}
        if date_from:
            date_q['$gte'] = date_from
        if date_to:
            date_q['$lte'] = date_to
        query['date'] = date_q
        
    if search:
        query['note'] = {'$regex': search, '$options': 'i'}
        
    # Sort
    sort_opts = [('date', -1)]
    if sort == 'date_asc':
        sort_opts = [('date', 1)]
    elif sort == 'amount_desc':
        sort_opts = [('amount', -1)]
    elif sort == 'amount_asc':
        sort_opts = [('amount', 1)]
        
    total = await db.transactions.count_documents(query)
    
    cursor = db.transactions.find(query).sort(sort_opts).skip((page - 1) * limit).limit(limit)
    txs = await cursor.to_list(length=limit)
    
    if not txs:
        return {'transactions': [], 'total': total, 'page': page, 'limit': limit}
        
    # Build maps to populate name / icon / colors
    acc_ids = list(set(
        [t['account_id'] for t in txs if t.get('account_id')] +
        [t['to_account_id'] for t in txs if t.get('to_account_id')]
    ))
    cat_ids = list(set([t['category_id'] for t in txs if t.get('category_id')]))
    
    accounts = await db.accounts.find({'_id': {'$in': acc_ids}}).to_list(length=None)
    categories = await db.categories.find({'_id': {'$in': cat_ids}}).to_list(length=None)
    
    acc_map = {str(a['_id']): a for a in accounts}
    cat_map = {str(c['_id']): c for c in categories}
    
    response_txs = []
    for t in txs:
        res = {**t}
        res['id'] = str(res.pop('_id'))
        res.pop('user_id', None)
        
        # ObjectIds to strings
        res['account_id'] = str(t['account_id']) if t.get('account_id') else None
        if t.get('to_account_id'):
            res['to_account_id'] = str(t['to_account_id'])
        if t.get('category_id'):
            res['category_id'] = str(t['category_id'])
            
        acc_id_str = str(t.get('account_id')) if t.get('account_id') else None
        if acc_id_str and acc_id_str in acc_map:
            res['account_name'] = acc_map[acc_id_str]['name']
        else:
            res['account_name'] = 'General / Cashless'
            
        to_acc_id_str = str(t.get('to_account_id')) if t.get('to_account_id') else None
        if to_acc_id_str and to_acc_id_str in acc_map:
            res['to_account_name'] = acc_map[to_acc_id_str]['name']
            
        cat_id_str = str(t.get('category_id')) if t.get('category_id') else None
        if cat_id_str and cat_id_str in cat_map:
            res['category_name'] = cat_map[cat_id_str]['name']
            res['category_color'] = cat_map[cat_id_str]['color']
            res['category_icon'] = cat_map[cat_id_str]['icon']
            
        response_txs.append(res)
        
    return {'transactions': response_txs, 'total': total, 'page': page, 'limit': limit}


@router.get('/transactions/{tx_id}', response_model=TransactionResponse)
async def get_transaction(tx_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    tx = await db.transactions.find_one({'_id': ObjectId(tx_id), 'user_id': user_id, 'deleted_at': None})
    if not tx:
        raise HTTPException(status_code=404, detail='Transaction not found')
        
    res = {**tx}
    res['id'] = str(res.pop('_id'))
    res.pop('user_id', None)
    
    # ObjectId strings
    res['account_id'] = str(tx['account_id']) if tx.get('account_id') else None
    if tx.get('to_account_id'):
        res['to_account_id'] = str(tx['to_account_id'])
    if tx.get('category_id'):
        res['category_id'] = str(tx['category_id'])
        
    if tx.get('account_id'):
        acc = await db.accounts.find_one({'_id': tx['account_id']})
        if acc:
            res['account_name'] = acc['name']
    else:
        res['account_name'] = 'General / Cashless'
        
    if tx.get('to_account_id'):
        to_acc = await db.accounts.find_one({'_id': tx['to_account_id']})
        if to_acc:
            res['to_account_name'] = to_acc['name']
            
    if tx.get('category_id'):
        cat = await db.categories.find_one({'_id': tx['category_id']})
        if cat:
            res['category_name'] = cat['name']
            res['category_color'] = cat['color']
            res['category_icon'] = cat['icon']
            
    return res


@router.patch('/transactions/{tx_id}', response_model=TransactionResponse)
async def update_transaction(tx_id: str, tx_data: TransactionUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    tx_oid = ObjectId(tx_id)
    
    if tx_data.amount is not None and tx_data.amount <= 0:
        raise HTTPException(status_code=422, detail='Amount must be greater than zero')
        
    async def op(session):
        # Fetch old transaction
        old_tx = await db.transactions.find_one({'_id': tx_oid, 'user_id': user_id, 'deleted_at': None}, session=session)
        if not old_tx:
            raise HTTPException(status_code=404, detail='Transaction not found')
            
        # Merge fields
        new_type = tx_data.type if tx_data.type is not None else old_tx['type']
        new_amount = tx_data.amount if tx_data.amount is not None else old_tx['amount']
        new_account_id = tx_data.account_id if tx_data.account_id is not None else str(old_tx['account_id'])
        new_to_account_id = tx_data.to_account_id if tx_data.to_account_id is not None else (str(old_tx['to_account_id']) if old_tx.get('to_account_id') else None)
        new_category_id = tx_data.category_id if tx_data.category_id is not None else (str(old_tx['category_id']) if old_tx.get('category_id') else None)
        new_note = tx_data.note if tx_data.note is not None else old_tx.get('note')
        new_date = tx_data.date if tx_data.date is not None else old_tx['date']
        
        # Validations
        if new_type == 'transfer':
            if not new_to_account_id:
                raise HTTPException(status_code=422, detail='Destination account is required for transfer')
            if new_account_id == new_to_account_id:
                raise HTTPException(status_code=422, detail='Source and destination accounts cannot be the same')
                
        # Validate accounts exist
        acc = await db.accounts.find_one({'_id': ObjectId(new_account_id), 'user_id': user_id, 'is_active': True}, session=session)
        if not acc:
            raise HTTPException(status_code=404, detail='Source account not found')
            
        to_acc = None
        if new_type == 'transfer':
            to_acc = await db.accounts.find_one({'_id': ObjectId(new_to_account_id), 'user_id': user_id, 'is_active': True}, session=session)
            if not to_acc:
                raise HTTPException(status_code=404, detail='Destination account not found')
        else:
            new_to_account_id = None  # Ensure it is null if not transfer
            
        cat = None
        if new_type != 'transfer' and new_category_id:
            cat = await db.categories.find_one({
                '_id': ObjectId(new_category_id),
                'is_active': True,
                '$or': [{'user_id': None}, {'user_id': user_id}]
            }, session=session)
            if not cat:
                raise HTTPException(status_code=404, detail='Category not found')
        else:
            new_category_id = None  # Ensure null if transfer
            
        # Reverse old balance effect
        await apply_balance_effect(
            session,
            account_id=str(old_tx['account_id']),
            type=old_tx['type'],
            amount=old_tx['amount'],
            to_account_id=str(old_tx['to_account_id']) if old_tx.get('to_account_id') else None,
            factor=-1
        )
        
        # Apply new balance effect
        await apply_balance_effect(
            session,
            account_id=new_account_id,
            type=new_type,
            amount=new_amount,
            to_account_id=new_to_account_id,
            factor=1
        )
        
        # Update transaction
        update_doc = {
            'type': new_type,
            'amount': new_amount,
            'account_id': ObjectId(new_account_id),
            'to_account_id': ObjectId(new_to_account_id) if new_to_account_id else None,
            'category_id': ObjectId(new_category_id) if new_category_id else None,
            'note': new_note,
            'date': new_date,
            'updated_at': datetime.utcnow()
        }
        
        updated = await db.transactions.find_one_and_update(
            {'_id': tx_oid},
            {'$set': update_doc},
            return_document=True,
            session=session
        )
        
        # Format response
        res = {
            **updated,
            'id': str(updated['_id']),
            'account_id': str(updated['account_id']),
            'account_name': acc['name'],
            'to_account_id': str(updated['to_account_id']) if updated.get('to_account_id') else None,
            'to_account_name': to_acc['name'] if new_type == 'transfer' else None
        }
        if new_category_id:
            res['category_id'] = str(updated['category_id'])
            res['category_name'] = cat['name']
            res['category_color'] = cat['color']
            res['category_icon'] = cat['icon']
            
        res.pop('_id')
        res.pop('user_id')
        return res
        
    return await run_in_session(op)


@router.delete('/transactions/{tx_id}')
async def delete_transaction(tx_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    tx_oid = ObjectId(tx_id)
    
    async def op(session):
        tx = await db.transactions.find_one({'_id': tx_oid, 'user_id': user_id, 'deleted_at': None}, session=session)
        if not tx:
            raise HTTPException(status_code=404, detail='Transaction not found')
            
        # Reverse balance effect
        await apply_balance_effect(
            session,
            account_id=str(tx['account_id']),
            type=tx['type'],
            amount=tx['amount'],
            to_account_id=str(tx['to_account_id']) if tx.get('to_account_id') else None,
            factor=-1
        )
        
        # Soft delete
        now = datetime.utcnow()
        await db.transactions.update_one(
            {'_id': tx_oid},
            {'$set': {'deleted_at': now, 'updated_at': now}},
            session=session
        )
        return {'status': 'success', 'message': 'Transaction deleted successfully'}
        
    return await run_in_session(op)


# === ANALYTICS ENDPOINTS ===

@router.get('/analytics/summary')
async def get_summary(month: str = Query(..., regex=r'^\d{4}-\d{2}$'), current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    
    parts = month.split('-')
    year = int(parts[0])
    m = int(parts[1])
    
    start_date = datetime(year, m, 1)
    if m == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, m + 1, 1)
        
    txs = await db.transactions.find({
        'user_id': user_id,
        'deleted_at': None,
        'date': {'$gte': start_date, '$lt': end_date}
    }).to_list(length=None)
    
    total_income = sum(tx['amount'] for tx in txs if tx['type'] == 'income')
    total_expense = sum(tx['amount'] for tx in txs if tx['type'] == 'expense')
    net_savings = total_income - total_expense
    
    # Account balances
    cursor = db.accounts.find({'user_id': user_id, 'is_active': True})
    accounts = []
    async for a in cursor:
        accounts.append({
            'id': str(a['_id']),
            'name': a['name'],
            'type': a['type'],
            'color': a['color'],
            'icon': a['icon'],
            'current_balance': a['current_balance']
        })
        
    return {
        'total_income': total_income,
        'total_expense': total_expense,
        'net_savings': net_savings,
        'accounts': accounts
    }


@router.get('/analytics/trend')
async def get_trend(range_type: Literal['6m', '1y'] = Query('6m', alias='range'), current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    today = date.today()
    
    months_count = 6 if range_type == '6m' else 12
    month_list = []
    
    y = today.year
    m = today.month
    for _ in range(months_count):
        month_list.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
            
    month_list.reverse()
    
    start_date = datetime(month_list[0][0], month_list[0][1], 1)
    last_year, last_month = month_list[-1]
    if last_month == 12:
        end_date = datetime(last_year + 1, 1, 1)
    else:
        end_date = datetime(last_year, last_month + 1, 1)
        
    txs = await db.transactions.find({
        'user_id': user_id,
        'deleted_at': None,
        'date': {'$gte': start_date, '$lt': end_date}
    }).to_list(length=None)
    
    monthly_data = {f'{y:04d}-{m:02d}': {'month': f'{y:04d}-{m:02d}', 'income': 0, 'expense': 0} for y, m in month_list}
    for tx in txs:
        m_str = tx['date'].strftime('%Y-%m')
        if m_str in monthly_data:
            if tx['type'] == 'income':
                monthly_data[m_str]['income'] += tx['amount']
            elif tx['type'] == 'expense':
                monthly_data[m_str]['expense'] += tx['amount']
                
    return list(monthly_data.values())


@router.get('/analytics/category-breakdown')
async def get_category_breakdown(
    type: Literal['income', 'expense'] = Query('expense'),
    month: str = Query(..., regex=r'^\d{4}-\d{2}$'),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    
    parts = month.split('-')
    year = int(parts[0])
    m = int(parts[1])
    
    start_date = datetime(year, m, 1)
    if m == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, m + 1, 1)
        
    txs = await db.transactions.find({
        'user_id': user_id,
        'deleted_at': None,
        'type': type,
        'date': {'$gte': start_date, '$lt': end_date}
    }).to_list(length=None)
    
    cat_amounts = {}
    for tx in txs:
        cat_id = str(tx.get('category_id')) if tx.get('category_id') else 'others'
        cat_amounts[cat_id] = cat_amounts.get(cat_id, 0) + tx['amount']
        
    cat_ids = [ObjectId(cid) for cid in cat_amounts.keys() if cid != 'others']
    categories = await db.categories.find({'_id': {'$in': cat_ids}}).to_list(length=None)
    cat_map = {str(c['_id']): c for c in categories}
    
    breakdown = []
    for cid, amt in cat_amounts.items():
        if cid in cat_map:
            breakdown.append({
                'category_id': cid,
                'name': cat_map[cid]['name'],
                'color': cat_map[cid]['color'],
                'icon': cat_map[cid]['icon'],
                'amount': amt
            })
        else:
            breakdown.append({
                'category_id': cid,
                'name': 'Others',
                'color': '#6b7280',
                'icon': 'Grid',
                'amount': amt
            })
            
    breakdown.sort(key=lambda x: x['amount'], reverse=True)
    return breakdown


@router.get('/analytics/account-balances', response_model=list[AccountResponse])
async def get_account_balances(current_user: dict = Depends(get_current_user)):
    cursor = db.accounts.find({'user_id': current_user['id'], 'is_active': True})
    accounts = []
    async for a in cursor:
        accounts.append(_account_doc_to_response(a))
    return accounts
