from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Sanhaja Travel Agencies Accounting System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"  # مدير عام - كل الصلاحيات
    GENERAL_ACCOUNTANT = "general_accountant"  # محاسب عام - موافقة على التقارير
    AGENCY_STAFF = "agency_staff"  # موظفي الوكالات - إدخال البيانات

class BookingType(str, Enum):
    UMRAH = "عمرة"
    FLIGHT = "طيران"
    HOTEL = "فندق"
    VISA = "تأشيرة"

class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK = "bank" 
    CARD = "card"

class InvoiceStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"

class AccountType(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"

# Add AccountType enum back
class AccountType(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"

class ReportStatus(str, Enum):
    PENDING = "pending"  # في انتظار الموافقة
    APPROVED = "approved"  # تم الموافقة من المحاسب العام
    REJECTED = "rejected"  # مرفوض

# Add Daily Report model
class DailyReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agency_id: str
    report_date: datetime
    total_income: float
    total_expenses: float
    transactions_count: int
    status: ReportStatus = ReportStatus.PENDING
    approved_by: Optional[str] = None  # user_id of general accountant
    created_by: str  # user_id who created the report
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None

# Database Models
class Agency(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    address: str
    phone: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    role: UserRole
    agency_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    cin_passport: str
    agency_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    contact: str
    agency_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ref: str
    client_id: str
    supplier_id: str
    type: BookingType
    cost: float
    sell_price: float
    start_date: datetime
    end_date: datetime
    agency_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_no: str
    client_id: str
    agency_id: str
    amount_ht: float
    tva_rate: float = 20.0
    amount_ttc: float
    status: InvoiceStatus = InvoiceStatus.PENDING
    due_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_no: str
    invoice_id: str
    method: PaymentMethod
    amount: float
    payment_date: datetime
    agency_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Cashbox(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agency_id: str
    name: str
    balance: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JournalEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime
    account_code: str
    debit: float = 0.0
    credit: float = 0.0
    reference: str
    agency_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChartOfAccounts(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    type: AccountType
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Create Models
class AgencyCreate(BaseModel):
    name: str
    city: str
    address: str
    phone: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole
    agency_id: str

class UserLogin(BaseModel):
    email: str
    password: str

class ClientCreate(BaseModel):
    name: str
    phone: str
    cin_passport: str

class SupplierCreate(BaseModel):
    name: str
    type: str
    contact: str

class BookingCreate(BaseModel):
    ref: str
    client_id: str
    supplier_id: str
    type: BookingType
    cost: float
    sell_price: float
    start_date: datetime
    end_date: datetime

class InvoiceCreate(BaseModel):
    client_id: str
    amount_ht: float
    tva_rate: float = 20.0
    due_date: datetime

class PaymentCreate(BaseModel):
    invoice_id: str
    method: PaymentMethod
    amount: float
    payment_date: datetime

class CashboxCreate(BaseModel):
    name: str

class ChartOfAccountsCreate(BaseModel):
    code: str
    name: str
    type: AccountType

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Permission helpers
def require_super_admin(current_user: User):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")

def require_general_accountant_or_above(current_user: User):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="General accountant or super admin access required")

def can_manage_agency_data(current_user: User, agency_id: str = None):
    if current_user.role == UserRole.SUPER_ADMIN:
        return True
    if agency_id and current_user.agency_id != agency_id:
        raise HTTPException(status_code=403, detail="Access denied to this agency's data")
    return True

# Authentication Routes
@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user_doc["id"]})
    user = User(**user_doc)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Agency Routes
@api_router.post("/agencies", response_model=Agency)
async def create_agency(agency_data: AgencyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create agencies")
    
    agency = Agency(**agency_data.dict())
    await db.agencies.insert_one(agency.dict())
    return agency

@api_router.get("/agencies", response_model=List[Agency])
async def get_agencies(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        agencies = await db.agencies.find().to_list(1000)
    else:
        agencies = await db.agencies.find({"id": current_user.agency_id}).to_list(1000)
    return [Agency(**agency) for agency in agencies]

# User Management Routes (Super Admin Only)
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    require_super_admin(current_user)  # Only super admin can create users
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = hash_password(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user_dict["password_hash"] = password_hash
    
    user = User(**user_dict)
    await db.users.insert_one({**user.dict(), "password_hash": password_hash})
    return user

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin sees all users
        users = await db.users.find().to_list(1000)
    elif current_user.role == UserRole.GENERAL_ACCOUNTANT:
        # General accountant sees all agency staff
        users = await db.users.find({"role": UserRole.AGENCY_STAFF}).to_list(1000)
    else:
        # Agency staff see only themselves
        users = await db.users.find({"id": current_user.id}).to_list(1000)
    
    return [User(**user) for user in users]

# Daily Reports Routes
@api_router.post("/daily-reports")
async def create_daily_report(
    agency_id: str,
    report_date: datetime,
    total_income: float,
    total_expenses: float,
    transactions_count: int,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    can_manage_agency_data(current_user, agency_id)
    
    # Check if report already exists for this date
    existing_report = await db.daily_reports.find_one({
        "agency_id": agency_id,
        "report_date": report_date.date().isoformat()
    })
    
    if existing_report:
        raise HTTPException(status_code=400, detail="Daily report already exists for this date")
    
    report = DailyReport(
        agency_id=agency_id,
        report_date=report_date,
        total_income=total_income,
        total_expenses=total_expenses,
        transactions_count=transactions_count,
        created_by=current_user.id,
        notes=notes
    )
    
    await db.daily_reports.insert_one(report.dict())
    return {"message": "Daily report created successfully", "status": "pending_approval"}

@api_router.get("/daily-reports")
async def get_daily_reports(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin sees all reports
        reports = await db.daily_reports.find().to_list(1000)
    elif current_user.role == UserRole.GENERAL_ACCOUNTANT:
        # General accountant sees all reports for approval
        reports = await db.daily_reports.find().to_list(1000)
    else:
        # Agency staff see only their agency's reports
        reports = await db.daily_reports.find({"agency_id": current_user.agency_id}).to_list(1000)
    
    return [DailyReport(**report) for report in reports]

@api_router.put("/daily-reports/{report_id}/approve")
async def approve_daily_report(
    report_id: str,
    action: str,  # "approve" or "reject"
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    require_general_accountant_or_above(current_user)
    
    report = await db.daily_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    status = ReportStatus.APPROVED if action == "approve" else ReportStatus.REJECTED
    
    await db.daily_reports.update_one(
        {"id": report_id},
        {
            "$set": {
                "status": status,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc),
                "notes": notes or report.get("notes", "")
            }
        }
    )
    
    return {"message": f"Report {action}d successfully"}

# Client Routes
@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    client_dict = client_data.dict()
    client_dict["agency_id"] = current_user.agency_id
    client = Client(**client_dict)
    await db.clients.insert_one(client.dict())
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    clients = await db.clients.find({"agency_id": current_user.agency_id}).to_list(1000)
    return [Client(**client) for client in clients]

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    existing_client = await db.clients.find_one({"id": client_id, "agency_id": current_user.agency_id})
    if not existing_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_data.dict()
    update_data["agency_id"] = current_user.agency_id
    
    await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    updated_client = await db.clients.find_one({"id": client_id})
    return Client(**updated_client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id, "agency_id": current_user.agency_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}

# Supplier Routes
@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier_data: SupplierCreate, current_user: User = Depends(get_current_user)):
    supplier_dict = supplier_data.dict()
    supplier_dict["agency_id"] = current_user.agency_id
    supplier = Supplier(**supplier_dict)
    await db.suppliers.insert_one(supplier.dict())
    return supplier

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers(current_user: User = Depends(get_current_user)):
    suppliers = await db.suppliers.find({"agency_id": current_user.agency_id}).to_list(1000)
    return [Supplier(**supplier) for supplier in suppliers]

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, supplier_data: SupplierCreate, current_user: User = Depends(get_current_user)):
    existing_supplier = await db.suppliers.find_one({"id": supplier_id, "agency_id": current_user.agency_id})
    if not existing_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier_data.dict()
    update_data["agency_id"] = current_user.agency_id
    
    await db.suppliers.update_one({"id": supplier_id}, {"$set": update_data})
    
    updated_supplier = await db.suppliers.find_one({"id": supplier_id})
    return Supplier(**updated_supplier)

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, current_user: User = Depends(get_current_user)):
    result = await db.suppliers.delete_one({"id": supplier_id, "agency_id": current_user.agency_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

# Booking Routes
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, current_user: User = Depends(get_current_user)):
    booking_dict = booking_data.dict()
    booking_dict["agency_id"] = current_user.agency_id
    booking = Booking(**booking_dict)
    await db.bookings.insert_one(booking.dict())
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"agency_id": current_user.agency_id}).to_list(1000)
    return [Booking(**booking) for booking in bookings]

# Invoice Routes
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, current_user: User = Depends(get_current_user)):
    # Generate invoice number
    count = await db.invoices.count_documents({"agency_id": current_user.agency_id})
    invoice_no = f"INV-{count + 1:06d}"
    
    # Calculate amount TTC
    amount_ttc = invoice_data.amount_ht * (1 + invoice_data.tva_rate / 100)
    
    invoice_dict = invoice_data.dict()
    invoice_dict.update({
        "invoice_no": invoice_no,
        "amount_ttc": amount_ttc,
        "agency_id": current_user.agency_id
    })
    
    invoice = Invoice(**invoice_dict)
    await db.invoices.insert_one(invoice.dict())
    return invoice

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(current_user: User = Depends(get_current_user)):
    invoices = await db.invoices.find({"agency_id": current_user.agency_id}).to_list(1000)
    return [Invoice(**invoice) for invoice in invoices]

# Payment Routes
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, current_user: User = Depends(get_current_user)):
    # Generate payment number
    count = await db.payments.count_documents({"agency_id": current_user.agency_id})
    payment_no = f"PAY-{count + 1:06d}"
    
    payment_dict = payment_data.dict()
    payment_dict.update({
        "payment_no": payment_no,
        "agency_id": current_user.agency_id
    })
    
    payment = Payment(**payment_dict)
    await db.payments.insert_one(payment.dict())
    
    # Update invoice status if fully paid
    invoice = await db.invoices.find_one({"id": payment_data.invoice_id})
    if invoice:
        total_payments = 0
        async for pay in db.payments.find({"invoice_id": payment_data.invoice_id}):
            total_payments += pay["amount"]
        
        if total_payments >= invoice["amount_ttc"]:
            await db.invoices.update_one(
                {"id": payment_data.invoice_id},
                {"$set": {"status": InvoiceStatus.PAID}}
            )
    
    return payment

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(current_user: User = Depends(get_current_user)):
    payments = await db.payments.find({"agency_id": current_user.agency_id}).to_list(1000)
    return [Payment(**payment) for payment in payments]

# Dashboard Route
@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    # Today's income/expenses
    today_invoices = await db.invoices.find({
        "agency_id": current_user.agency_id,
        "created_at": {"$gte": today, "$lt": tomorrow}
    }).to_list(1000)
    
    today_income = sum(inv["amount_ttc"] for inv in today_invoices)
    
    # Unpaid invoices
    unpaid_invoices = await db.invoices.count_documents({
        "agency_id": current_user.agency_id,
        "status": InvoiceStatus.PENDING
    })
    
    # This week's bookings
    week_start = today - timedelta(days=today.weekday())
    week_bookings = await db.bookings.count_documents({
        "agency_id": current_user.agency_id,
        "created_at": {"$gte": week_start}
    })
    
    # Cashbox balance
    cashboxes = await db.cashboxes.find({"agency_id": current_user.agency_id}).to_list(1000)
    total_cashbox_balance = sum(cb["balance"] for cb in cashboxes)
    
    return {
        "today_income": today_income,
        "unpaid_invoices": unpaid_invoices,
        "week_bookings": week_bookings,
        "cashbox_balance": total_cashbox_balance
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()