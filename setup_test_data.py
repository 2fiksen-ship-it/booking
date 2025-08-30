#!/usr/bin/env python3
"""
Setup script to create initial test data for the Sanhaja Travel Agencies system
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import bcrypt
import uuid
from datetime import datetime, timezone

# Load environment variables
load_dotenv(Path(__file__).parent / 'backend' / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def setup_test_data():
    """Setup initial test data"""
    print("🚀 Setting up test data for Sanhaja Travel Agencies...")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Create agencies first
        agencies = [
            {
                "id": str(uuid.uuid4()),
                "name": "وكالة صنهاجة وهران",
                "city": "وهران",
                "address": "شارع الأمير عبد القادر، وهران",
                "phone": "+213 41 123 456",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "وكالة صنهاجة تلمسان",
                "city": "تلمسان",
                "address": "شارع الاستقلال، تلمسان",
                "phone": "+213 43 123 456",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "وكالة صنهاجة مغنية",
                "city": "مغنية",
                "address": "شارع الشهداء، مغنية",
                "phone": "+213 43 789 012",
                "created_at": datetime.now(timezone.utc)
            }
        ]
        
        # Insert agencies
        await db.agencies.delete_many({})  # Clear existing
        await db.agencies.insert_many(agencies)
        print(f"✅ Created {len(agencies)} agencies")
        
        # Create users
        users = [
            {
                "id": str(uuid.uuid4()),
                "name": "مدير النظام",
                "email": "admin@sanhaja-oran.dz",
                "password_hash": hash_password("admin123"),
                "role": "super_admin",
                "agency_id": agencies[0]["id"],  # Oran agency
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "المدير العام",
                "email": "superadmin@sanhaja.com",
                "password_hash": hash_password("super123"),
                "role": "super_admin",
                "agency_id": agencies[0]["id"],  # Oran agency
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "المحاسب العام",
                "email": "generalaccountant@sanhaja.com",
                "password_hash": hash_password("acc123"),
                "role": "general_accountant",
                "agency_id": agencies[0]["id"],  # Oran agency
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "موظف تلمسان 1",
                "email": "staff1@tlemcen.sanhaja.com",
                "password_hash": hash_password("staff123"),
                "role": "agency_staff",
                "agency_id": agencies[1]["id"],  # Tlemcen agency
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "موظف وهران 1",
                "email": "staff1@oran.sanhaja.com",
                "password_hash": hash_password("staff123"),
                "role": "agency_staff",
                "agency_id": agencies[0]["id"],  # Oran agency
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "موظف مغنية 1",
                "email": "staff1@maghnia.sanhaja.com",
                "password_hash": hash_password("staff123"),
                "role": "agency_staff",
                "agency_id": agencies[2]["id"],  # Maghnia agency
                "created_at": datetime.now(timezone.utc)
            }
        ]
        
        # Insert users
        await db.users.delete_many({})  # Clear existing
        await db.users.insert_many(users)
        print(f"✅ Created {len(users)} users")
        
        # Create some sample clients for each agency
        clients = []
        for i, agency in enumerate(agencies):
            for j in range(3):  # 3 clients per agency
                clients.append({
                    "id": str(uuid.uuid4()),
                    "name": f"عميل {j+1} - {agency['city']}",
                    "phone": f"+213 {40+i}{j} 123 45{j}",
                    "cin_passport": f"12345678{i}{j}",
                    "agency_id": agency["id"],
                    "created_at": datetime.now(timezone.utc)
                })
        
        await db.clients.delete_many({})  # Clear existing
        await db.clients.insert_many(clients)
        print(f"✅ Created {len(clients)} clients")
        
        # Create some sample suppliers for each agency
        suppliers = []
        supplier_types = ["فندق", "طيران", "نقل", "تأشيرات"]
        for i, agency in enumerate(agencies):
            for j, supplier_type in enumerate(supplier_types):
                suppliers.append({
                    "id": str(uuid.uuid4()),
                    "name": f"{supplier_type} {agency['city']} {j+1}",
                    "type": supplier_type,
                    "contact": f"+213 {50+i}{j} 987 65{j}",
                    "agency_id": agency["id"],
                    "created_at": datetime.now(timezone.utc)
                })
        
        await db.suppliers.delete_many({})  # Clear existing
        await db.suppliers.insert_many(suppliers)
        print(f"✅ Created {len(suppliers)} suppliers")
        
        # Create cashboxes for each agency
        cashboxes = []
        for agency in agencies:
            cashboxes.append({
                "id": str(uuid.uuid4()),
                "agency_id": agency["id"],
                "name": f"صندوق {agency['city']}",
                "balance": 50000.0,  # 50,000 DZD
                "created_at": datetime.now(timezone.utc)
            })
        
        await db.cashboxes.delete_many({})  # Clear existing
        await db.cashboxes.insert_many(cashboxes)
        print(f"✅ Created {len(cashboxes)} cashboxes")
        
        print("\n🎉 Test data setup completed successfully!")
        print("\nTest Users Created:")
        print("==================")
        for user in users:
            print(f"📧 {user['email']} | Role: {user['role']} | Password: [see setup script]")
        
        print(f"\nAgencies Created:")
        print("=================")
        for agency in agencies:
            print(f"🏢 {agency['name']} ({agency['city']})")
        
        print(f"\n✅ Total: {len(agencies)} agencies, {len(users)} users, {len(clients)} clients, {len(suppliers)} suppliers, {len(cashboxes)} cashboxes")
        
    except Exception as e:
        print(f"❌ Error setting up test data: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(setup_test_data())