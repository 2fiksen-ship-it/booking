#!/usr/bin/env python3
"""
Seed data script for Sanhaja Travel Agencies
Creates sample data for 6 agencies with users, clients, suppliers, bookings, and invoices
"""

import asyncio
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import bcrypt
from datetime import datetime, timedelta, timezone
import uuid

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_seed_data():
    print("🌱 Creating seed data for Sanhaja Travel Agencies...")
    
    # Clear existing data
    print("🧹 Clearing existing data...")
    collections = ['agencies', 'users', 'clients', 'suppliers', 'bookings', 'invoices', 'payments', 'cashboxes', 'chart_of_accounts']
    for collection in collections:
        await db[collection].delete_many({})
    
    # Create Chart of Accounts
    print("📊 Creating Chart of Accounts...")
    chart_accounts = [
        {'id': str(uuid.uuid4()), 'code': '4111', 'name': 'مبيعات السفر والسياحة', 'type': 'revenue', 'created_at': datetime.now(timezone.utc)},
        {'id': str(uuid.uuid4()), 'code': '4112', 'name': 'مبيعات العمرة', 'type': 'revenue', 'created_at': datetime.now(timezone.utc)},
        {'id': str(uuid.uuid4()), 'code': '4113', 'name': 'مبيعات التأشيرات', 'type': 'revenue', 'created_at': datetime.now(timezone.utc)},
        {'id': str(uuid.uuid4()), 'code': '5311', 'name': 'صندوق الوكالة', 'type': 'asset', 'created_at': datetime.now(timezone.utc)},
        {'id': str(uuid.uuid4()), 'code': '5312', 'name': 'حساب بنكي', 'type': 'asset', 'created_at': datetime.now(timezone.utc)},
        {'id': str(uuid.uuid4()), 'code': '6111', 'name': 'تكاليف الطيران', 'type': 'expense', 'created_at': datetime.now(timezone.utc)},
        {'id': str(uuid.uuid4()), 'code': '6112', 'name': 'تكاليف الفنادق', 'type': 'expense', 'created_at': datetime.now(timezone.utc)},
        {'id': str(uuid.uuid4()), 'code': '4011', 'name': 'ذمم العملاء', 'type': 'asset', 'created_at': datetime.now(timezone.utc)},
    ]
    await db.chart_of_accounts.insert_many(chart_accounts)
    
    # Create 6 Agencies in Western Algeria
    print("🏢 Creating agencies...")
    agencies_data = [
        {'name': 'وكالة صنهاجة تلمسان', 'city': 'تلمسان', 'address': 'شارع الأمير عبد القادر، تلمسان', 'phone': '+213043123456'},
        {'name': 'وكالة صنهاجة مغنية', 'city': 'مغنية', 'address': 'الشارع الرئيسي، مغنية', 'phone': '+213043789012'},
        {'name': 'وكالة صنهاجة ندرومة', 'city': 'ندرومة', 'address': 'حي النصر، ندرومة', 'phone': '+213043345678'},
        {'name': 'وكالة صنهاجة وهران', 'city': 'وهران', 'address': 'شارع الاستقلال، وهران', 'phone': '+213041901234'},
        {'name': 'وكالة صنهاجة الرمشي', 'city': 'الرمشي', 'address': 'المركز التجاري، الرمشي', 'phone': '+213048567890'},
        {'name': 'وكالة صنهاجة سيدي بلعباس', 'city': 'سيدي بلعباس', 'address': 'شارع الثورة، سيدي بلعباس', 'phone': '+213048234567'}
    ]
    
    agencies = []
    for agency_data in agencies_data:
        agency = {
            'id': str(uuid.uuid4()),
            'created_at': datetime.now(timezone.utc),
            **agency_data
        }
        agencies.append(agency)
    
    await db.agencies.insert_many(agencies)
    
    # Create Users with new role hierarchy
    print("👥 Creating users...")
    users = []
    
    # Create Super Admin (مدير عام واحد)
    users.append({
        'id': str(uuid.uuid4()),
        'name': 'المدير العام لوكالات صنهاجة',
        'email': 'superadmin@sanhaja.com',
        'password_hash': hash_password('super123'),
        'role': 'super_admin',
        'agency_id': agencies[0]['id'],  # Can manage all agencies
        'created_at': datetime.now(timezone.utc)
    })
    
    # Create General Accountant (محاسب عام واحد)
    users.append({
        'id': str(uuid.uuid4()),
        'name': 'المحاسب العام لوكالات صنهاجة',
        'email': 'generalaccountant@sanhaja.com',
        'password_hash': hash_password('acc123'),
        'role': 'general_accountant',
        'agency_id': agencies[0]['id'],  # Can see all agencies
        'created_at': datetime.now(timezone.utc)
    })
    
    # Create Agency Staff for each agency
    for agency in agencies:
        city_code = {
            'تلمسان': 'tlemcen', 
            'مغنية': 'maghnia', 
            'ندرومة': 'nedroma', 
            'وهران': 'oran', 
            'الرمشي': 'remchi', 
            'سيدي بلعباس': 'sidibel'
        }
        email_city = city_code.get(agency["city"], agency["city"].lower())
        
        # Create 2 staff members per agency
        for i in range(2):
            users.append({
                'id': str(uuid.uuid4()),
                'name': f'موظف {agency["name"]} {i+1}',
                'email': f'staff{i+1}@{email_city}.sanhaja.com',
                'password_hash': hash_password('staff123'),
                'role': 'agency_staff',
                'agency_id': agency['id'],
                'created_at': datetime.now(timezone.utc)
            })
    
    await db.users.insert_many(users)
    
    # Create suppliers
    print("🏭 Creating suppliers...")
    supplier_types = ['طيران', 'فنادق', 'نقل', 'تأشيرات', 'تأمين']
    suppliers = []
    for agency in agencies:
        for i, supplier_type in enumerate(supplier_types):
            suppliers.append({
                'id': str(uuid.uuid4()),
                'name': f'{supplier_type} غرب الجزائر - {agency["city"]}',
                'type': supplier_type,
                'contact': f'+213{4+i%2}{i+1}2345678',
                'agency_id': agency['id'],
                'created_at': datetime.now(timezone.utc)
            })
    
    await db.suppliers.insert_many(suppliers)
    
    # Create clients for each agency (10 per agency) - Western Algeria names
    print("👤 Creating clients...")
    client_names = [
        'عبد القادر بن زيان', 'خديجة بلحبيب', 'محمد بن عودة', 'فاطمة بوزيد', 'أحمد بن سعيد',
        'زينب بلعربي', 'يوسف مداني', 'عائشة بن علي', 'حسن بوجمعة', 'مريم بلقاسم',
        'طارق زروال', 'نجوى بن عيسى', 'سعيد بوعلام', 'رقية حمدي', 'عمر بلحاج'
    ]
    
    clients = []
    for agency in agencies:
        for i, name in enumerate(client_names[:10]):  # 10 clients per agency
            clients.append({
                'id': str(uuid.uuid4()),
                'name': name,
                'phone': f'+213{5+i%4}{10000000 + i + len(agency["name"]):08d}',
                'cin_passport': f'{agency["city"][:3].upper()}{i+1:05d}',
                'agency_id': agency['id'],
                'created_at': datetime.now(timezone.utc) - timedelta(days=i*2)
            })
    
    await db.clients.insert_many(clients)
    
    # Create bookings (20 per agency)
    print("✈️ Creating bookings...")
    booking_types = ['عمرة', 'طيران', 'فندق', 'تأشيرة']
    bookings = []
    
    for agency in agencies:
        agency_clients = [c for c in clients if c['agency_id'] == agency['id']]
        agency_suppliers = [s for s in suppliers if s['agency_id'] == agency['id']]
        
        for i in range(20):  # 20 bookings per agency
            client = agency_clients[i % len(agency_clients)]
            supplier = agency_suppliers[i % len(agency_suppliers)]
            booking_type = booking_types[i % len(booking_types)]
            
            cost = round(200000 + (i * 15000) + (i % 3 * 50000), 2)  # تكلفة بالدينار الجزائري
            sell_price = round(cost * 1.25, 2)  # هامش ربح 25%
            
            start_date = datetime.now(timezone.utc) + timedelta(days=15 + i*2)
            end_date = start_date + timedelta(days=7 if booking_type in ['عمرة', 'فندق'] else 1)
            
            bookings.append({
                'id': str(uuid.uuid4()),
                'ref': f'BKG-{agency["city"][:3].upper()}-{i+1:04d}',
                'client_id': client['id'],
                'supplier_id': supplier['id'],
                'type': booking_type,
                'cost': cost,
                'sell_price': sell_price,
                'start_date': start_date,
                'end_date': end_date,
                'agency_id': agency['id'],
                'created_at': datetime.now(timezone.utc) - timedelta(days=i)
            })
    
    await db.bookings.insert_many(bookings)
    
    # Create invoices (15 per agency)
    print("📄 Creating invoices...")
    invoices = []
    for agency in agencies:
        agency_clients = [c for c in clients if c['agency_id'] == agency['id']]
        
        for i in range(15):  # 15 invoices per agency
            client = agency_clients[i % len(agency_clients)]
            amount_ht = round(3000 + (i * 200), 2)
            tva_rate = 20.0
            amount_ttc = round(amount_ht * (1 + tva_rate / 100), 2)
            
            status = 'paid' if i % 3 == 0 else ('overdue' if i % 5 == 0 else 'pending')
            due_date = datetime.now(timezone.utc) + timedelta(days=30 - i*2)
            
            invoices.append({
                'id': str(uuid.uuid4()),
                'invoice_no': f'INV-{agency["city"][:3].upper()}-{i+1:06d}',
                'client_id': client['id'],
                'agency_id': agency['id'],
                'amount_ht': amount_ht,
                'tva_rate': tva_rate,
                'amount_ttc': amount_ttc,
                'status': status,
                'due_date': due_date,
                'created_at': datetime.now(timezone.utc) - timedelta(days=i*3)
            })
    
    await db.invoices.insert_many(invoices)
    
    # Create payments for paid invoices
    print("💳 Creating payments...")
    payments = []
    payment_methods = ['cash', 'bank', 'card']
    
    paid_invoices = [inv for inv in invoices if inv['status'] == 'paid']
    
    for i, invoice in enumerate(paid_invoices):
        payments.append({
            'id': str(uuid.uuid4()),
            'payment_no': f'PAY-{i+1:06d}',
            'invoice_id': invoice['id'],
            'method': payment_methods[i % len(payment_methods)],
            'amount': invoice['amount_ttc'],
            'payment_date': invoice['created_at'] + timedelta(days=5),
            'agency_id': invoice['agency_id'],
            'created_at': invoice['created_at'] + timedelta(days=5)
        })
    
    await db.payments.insert_many(payments)
    
    # Create cashboxes for each agency
    print("💰 Creating cashboxes...")
    cashboxes = []
    for agency in agencies:
        # Main cashbox
        cashboxes.append({
            'id': str(uuid.uuid4()),
            'agency_id': agency['id'],
            'name': 'الصندوق الرئيسي',
            'balance': round(50000 + (len(agency['name']) * 1000), 2),
            'created_at': datetime.now(timezone.utc)
        })
        
        # Secondary cashbox
        cashboxes.append({
            'id': str(uuid.uuid4()),
            'agency_id': agency['id'],
            'name': 'صندوق العمرة',
            'balance': round(25000 + (len(agency['name']) * 500), 2),
            'created_at': datetime.now(timezone.utc)
        })
    
    await db.cashboxes.insert_many(cashboxes)
    
    print("✅ Seed data creation completed!")
    print(f"Created:")
    print(f"  - {len(agencies)} agencies")
    print(f"  - {len(users)} users")
    print(f"  - {len(clients)} clients")
    print(f"  - {len(suppliers)} suppliers")
    print(f"  - {len(bookings)} bookings")
    print(f"  - {len(invoices)} invoices")
    print(f"  - {len(payments)} payments")
    print(f"  - {len(cashboxes)} cashboxes")
    print(f"  - {len(chart_accounts)} chart of accounts")
    
    print("\n🔑 Login credentials:")
    
    print("Super Admin:")
    print("  superadmin@sanhaja.com / super123")
    
    print("\nGeneral Accountant:")
    print("  generalaccountant@sanhaja.com / acc123")
    
    city_code = {
        'تلمسان': 'tlemcen', 
        'مغنية': 'maghnia', 
        'ندرومة': 'nedroma', 
        'وهران': 'oran', 
        'الرمشي': 'remchi', 
        'سيدي بلعباس': 'sidibel'
    }
    
    print("\nAgency Staff:")
    for agency in agencies:
        email_city = city_code.get(agency['city'], agency['city'].lower())
        print(f"  {agency['city']} Staff 1: staff1@{email_city}.sanhaja.com / staff123")
        print(f"  {agency['city']} Staff 2: staff2@{email_city}.sanhaja.com / staff123")

if __name__ == "__main__":
    asyncio.run(create_seed_data())