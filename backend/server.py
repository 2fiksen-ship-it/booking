from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Cookie
from fastapi.responses import JSONResponse, Response
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
import requests  # For calling Emergent Auth API
import aiohttp  # For async HTTP calls

# NEW: PDF generation imports with Arabic support
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO

# NEW: File upload imports
from fastapi import UploadFile, File
from fastapi.staticfiles import StaticFiles
import os
import uuid
from pathlib import Path

# Arabic text processing
try:
    from arabic_reshaper import reshape
    from bidi.algorithm import get_display
    ARABIC_SUPPORT = True
except ImportError:
    ARABIC_SUPPORT = False
    print("Arabic reshaper not available. Installing...")
    import subprocess
    try:
        subprocess.check_call(["pip", "install", "arabic-reshaper", "python-bidi"])
        from arabic_reshaper import reshape
        from bidi.algorithm import get_display
        ARABIC_SUPPORT = True
        print("Arabic support libraries installed successfully")
    except Exception as e:
        print(f"Failed to install Arabic support: {e}")
        ARABIC_SUPPORT = False

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



class ReportStatus(str, Enum):
    PENDING = "pending"  # في انتظار الموافقة
    APPROVED = "approved"  # تم الموافقة من المحاسب العام
    REJECTED = "rejected"  # مرفوض

class ServiceSaleStatus(str, Enum):
    SOLD = "sold"
    PENDING_CASH = "pending_cash"
    CASH_RECEIVED = "cash_received"

class InstallmentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"  # NEW: for partial payments
    PAID = "paid"
    OVERDUE = "overdue"

class InstallmentPlanStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Service Types
class ServiceType(str, Enum):
    UMRAH = "عمرة"
    HAJJ = "حج"
    FLIGHT_TICKET = "تذكرة طيران"
    HOTEL_BOOKING = "حجز فندق"
    VISA_SERVICE = "خدمة تأشيرة"
    TRANSPORT = "نقل"
    INSURANCE = "تأمين"
    PASSPORT_SERVICE = "خدمة جواز سفر"
    OTHER = "أخرى"

# Service Category
class ServiceCategory(str, Enum):
    RELIGIOUS = "خدمات دينية"
    TRAVEL = "خدمات سفر"
    DOCUMENTATION = "خدمات وثائق"
    ACCOMMODATION = "خدمات إقامة"
    OTHER = "أخرى"

# Operation Status
class OperationStatus(str, Enum):
    DRAFT = "مسودة"
    PENDING_APPROVAL = "في انتظار الموافقة"
    APPROVED = "معتمد"
    REJECTED = "مرفوض"

# Discount Status
class DiscountStatus(str, Enum):
    PENDING = "في انتظار الموافقة"
    APPROVED = "معتمد"
    REJECTED = "مرفوض"

# Add Daily Report model
class DailyReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime
    date_str: Optional[str] = None  # For easy querying (YYYY-MM-DD format)
    income: float
    expenses: float
    cashbox_balance: float
    notes: Optional[str] = ""
    report_status: ReportStatus = ReportStatus.PENDING
    agency_id: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_by: Optional[str] = None  # user_id of general accountant
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

# Service Management Models
class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    service_type: ServiceType
    category: ServiceCategory
    base_price: float  # السعر الأساسي الثابت
    min_price: Optional[float] = None  # أقل سعر مسموح
    is_fixed_price: bool = True  # هل السعر ثابت أم متغير
    is_active: bool = True
    agency_id: Optional[str] = None  # إذا كان للوكالة المحددة، أو None للعام
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

# Daily Operations Models
class DailyOperation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    operation_no: str  # رقم الوصل
    date: datetime
    service_id: str
    client_id: str
    service_name: str  # نسخة من اسم الخدمة للحفظ
    base_price: float  # السعر الأساسي
    discount_amount: float = 0.0  # مبلغ التخفيض
    final_price: float  # السعر النهائي بعد التخفيض
    discount_reason: Optional[str] = None  # سبب التخفيض
    discount_approved_by: Optional[str] = None  # من وافق على التخفيض
    status: OperationStatus = OperationStatus.DRAFT
    agency_id: str
    created_by: str  # الموظف الذي أنشأ العملية
    approved_by: Optional[str] = None  # المحاسب/المدير الذي اعتمد
    approved_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Service Pricing History
class ServicePriceHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_id: str
    old_price: float
    new_price: float
    change_reason: str
    changed_by: str
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Discount Request Model
class DiscountRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    operation_id: str
    original_price: float
    discount_amount: float
    discount_percentage: float
    reason: str
    requested_by: str
    discount_status: DiscountStatus = DiscountStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Notification System Models
class NotificationType(str, Enum):
    INVOICE_DUE = "invoice_due"  # اقتراب استحقاق فاتورة
    LOW_CASHBOX = "low_cashbox"  # انخفاض رصيد الصندوق
    BACKUP_FAILED = "backup_failed"  # فشل النسخ الاحتياطي
    BACKUP_SUCCESS = "backup_success"  # نجح النسخ الاحتياطي

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.MEDIUM
    user_id: Optional[str] = None  # إذا كان للمستخدم المحدد، وإلا للجميع
    agency_id: Optional[str] = None  # إذا كان لوكالة محددة
    is_read: bool = False
    action_url: Optional[str] = None  # رابط للإجراء المطلوب
    metadata: Optional[dict] = None  # بيانات إضافية
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read_at: Optional[datetime] = None

# Backup/Export Models
class BackupStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class BackupRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    file_size: Optional[int] = None
    backup_status: BackupStatus = BackupStatus.PENDING
    backup_type: str = "full"  # full, partial
    agency_id: Optional[str] = None  # إذا كان للوكالة المحددة
    created_by: str
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

# Database Models
class Agency(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    postal_code: Optional[str] = None  # رمز بريدي
    phone: Optional[str] = None  # الهاتف الأساسي
    phone_2: Optional[str] = None  # هاتف ثانوي
    phone_3: Optional[str] = None  # هاتف إضافي
    fax: Optional[str] = None  # فاكس
    email: Optional[str] = None
    website: Optional[str] = None  # موقع الوكالة
    # NEW: Printing and branding fields
    logo_url: Optional[str] = None  # URL to agency logo
    header_text: Optional[str] = None  # Custom header text for documents
    footer_text: Optional[str] = None  # Custom footer text
    # Registration details
    tax_number: Optional[str] = None  # رقم التسجيل الضريبي
    commercial_register: Optional[str] = None  # رقم السجل التجاري
    national_register: Optional[str] = None  # رقم السجل الوطني
    # Management details
    manager_name: Optional[str] = None  # اسم المدير
    manager_signature_url: Optional[str] = None  # توقيع المدير
    # Additional business info
    business_license: Optional[str] = None  # رخصة النشاط التجاري
    established_date: Optional[str] = None  # تاريخ التأسيس
    description: Optional[str] = None  # وصف الوكالة
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    role: UserRole
    agency_id: str
    # NEW: Digital signature for printing
    signature_url: Optional[str] = None  # URL to user's digital signature
    job_title: Optional[str] = None  # المسمى الوظيفي
    is_active: bool = True
    google_id: Optional[str] = None  # For Google OAuth integration
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
    # NEW: Approval workflow fields
    status: OperationStatus = OperationStatus.DRAFT
    created_by: Optional[str] = None  # الموظف الذي أنشأ الحجز (optional for backward compatibility)
    approved_by: Optional[str] = None  # المحاسب/المدير الذي اعتمد
    approved_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None
    modification_history: Optional[List[dict]] = []  # تاريخ التعديلات
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_no: str
    client_id: str
    agency_id: str
    amount_ht: float
    tva_rate: float = 20.0
    amount_ttc: float
    invoice_status: InvoiceStatus = InvoiceStatus.PENDING
    due_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_no: str
    # Support both invoice and daily operation payments
    invoice_id: Optional[str] = None
    daily_operation_id: Optional[str] = None
    method: PaymentMethod
    amount: float
    payment_date: datetime
    agency_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None

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

class ServiceSale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_name: str
    client_name: str
    amount: float
    status: ServiceSaleStatus = ServiceSaleStatus.SOLD
    sold_by: str  # User ID who sold the service
    confirmed_by: Optional[str] = None  # User ID who confirmed cash receipt
    agency_id: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    cash_delivered_at: Optional[datetime] = None  # When staff marked cash as delivered
    cash_received_at: Optional[datetime] = None   # When accountant confirmed receipt

class InstallmentPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_sale_id: str  # Reference to ServiceSale
    total_amount: float
    number_of_installments: int
    start_date: datetime
    status: InstallmentPlanStatus = InstallmentPlanStatus.ACTIVE
    created_by: str  # User ID who created the plan
    agency_id: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None

class InstallmentPayment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plan_id: str  # Reference to InstallmentPlan
    installment_number: int  # Which installment (1, 2, 3, etc.)
    due_date: datetime
    original_amount: float  # Original installment amount
    paid_amount: float = 0.0  # Amount actually paid (for partial payments)
    remaining_amount: float  # Calculated: original_amount - paid_amount
    status: InstallmentStatus = InstallmentStatus.PENDING
    paid_at: Optional[datetime] = None
    confirmed_by: Optional[str] = None
    agency_id: str
    notes: Optional[str] = None
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
    address: str
    city: str
    phone: Optional[str] = None
    email: Optional[str] = None
    # NEW: Printing and branding fields
    logo_url: Optional[str] = None  # URL to agency logo
    header_text: Optional[str] = None  # Custom header text for documents
    footer_text: Optional[str] = None  # Custom footer text
    tax_number: Optional[str] = None  # رقم التسجيل الضريبي
    commercial_register: Optional[str] = None  # رقم السجل التجاري
    manager_name: Optional[str] = None  # اسم المدير
    manager_signature_url: Optional[str] = None  # توقيع المدير

class AgencyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None  # رمز بريدي
    phone: Optional[str] = None  # الهاتف الأساسي
    phone_2: Optional[str] = None  # هاتف ثانوي
    phone_3: Optional[str] = None  # هاتف إضافي
    fax: Optional[str] = None  # فاكس
    email: Optional[str] = None
    website: Optional[str] = None  # موقع الوكالة
    # Branding fields
    logo_url: Optional[str] = None  # URL to agency logo
    header_text: Optional[str] = None  # Custom header text for documents
    footer_text: Optional[str] = None  # Custom footer text
    # Registration details
    tax_number: Optional[str] = None  # رقم التسجيل الضريبي
    commercial_register: Optional[str] = None  # رقم السجل التجاري
    national_register: Optional[str] = None  # رقم السجل الوطني
    # Management details
    manager_name: Optional[str] = None  # اسم المدير
    manager_signature_url: Optional[str] = None  # توقيع المدير
    # Additional business info
    business_license: Optional[str] = None  # رخصة النشاط التجاري
    established_date: Optional[str] = None  # تاريخ التأسيس
    description: Optional[str] = None  # وصف الوكالة

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

class BookingUpdate(BaseModel):
    ref: Optional[str] = None
    client_id: Optional[str] = None
    supplier_id: Optional[str] = None
    type: Optional[BookingType] = None
    cost: Optional[float] = None
    sell_price: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[OperationStatus] = None

class InvoiceCreate(BaseModel):
    client_id: str
    amount_ht: float
    tva_rate: float = 20.0
    due_date: datetime

class PaymentCreate(BaseModel):
    # Support both invoice and daily operation payments
    invoice_id: Optional[str] = None
    daily_operation_id: Optional[str] = None
    method: PaymentMethod
    amount: float
    payment_date: datetime
    notes: Optional[str] = None

class CashboxCreate(BaseModel):
    name: str

class ChartOfAccountsCreate(BaseModel):
    code: str
    name: str
    type: AccountType

class ServiceSaleCreate(BaseModel):
    service_name: str
    client_name: str
    amount: float
    notes: Optional[str] = None

class ServiceSaleUpdate(BaseModel):
    service_name: Optional[str] = None
    client_name: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[ServiceSaleStatus] = None
    notes: Optional[str] = None

class InstallmentPlanCreate(BaseModel):
    service_sale_id: str
    number_of_installments: int
    start_date: datetime
    installment_dates: List[datetime]  # Custom dates for each installment
    notes: Optional[str] = None

class InstallmentPlanUpdate(BaseModel):
    number_of_installments: Optional[int] = None
    start_date: Optional[datetime] = None
    status: Optional[InstallmentPlanStatus] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None

class InstallmentPaymentUpdate(BaseModel):
    paid_amount: Optional[float] = None
    status: Optional[InstallmentStatus] = None
    notes: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    agency_id: Optional[str] = None

class DailyReportCreate(BaseModel):
    date: datetime
    income: float
    expenses: float
    cashbox_balance: float
    notes: Optional[str] = None

# Service Management Create Models
class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    service_type: ServiceType
    category: ServiceCategory
    base_price: float
    min_price: Optional[float] = None
    is_fixed_price: bool = True
    is_active: bool = True
    agency_id: Optional[str] = None

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    service_type: Optional[ServiceType] = None
    category: Optional[ServiceCategory] = None
    base_price: Optional[float] = None
    min_price: Optional[float] = None
    is_fixed_price: Optional[bool] = None
    is_active: Optional[bool] = None

# Daily Operations Create Models
class DailyOperationCreate(BaseModel):
    service_id: str
    client_id: str
    base_price: Optional[float] = None  # إذا لم يتم توفيره، سيتم أخذه من الخدمة
    discount_amount: float = 0.0
    discount_reason: Optional[str] = None
    notes: Optional[str] = None

class DailyOperationUpdate(BaseModel):
    discount_amount: Optional[float] = None
    discount_reason: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[OperationStatus] = None

# Discount Request Create Models
class DiscountRequestCreate(BaseModel):
    operation_id: str
    discount_amount: float
    reason: str

class DiscountApproval(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None

# Session Model for Google Authentication
class SessionToken(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_token: str
    user_id: str
    email: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GoogleAuthResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    session_token: str

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

# Authentication dependency with session support
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session_token: Optional[str] = Cookie(None)
):
    # Priority 1: Check for session token in cookie (Google Auth)
    if session_token:
        try:
            # Verify session token in database
            session = await db.sessions.find_one({"session_token": session_token})
            if session and session["expires_at"] > datetime.now(timezone.utc):
                user = await db.users.find_one({"id": session["user_id"]})
                if user:
                    return User(**user)
        except Exception as e:
            print(f"Session authentication error: {e}")
    
    # Priority 2: Check for JWT Bearer token (Traditional Auth)
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            user = await db.users.find_one({"id": user_id})
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
            
            return User(**user)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    raise HTTPException(status_code=401, detail="Authentication required")

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

# Google Authentication Endpoints
@api_router.post("/auth/google")
async def google_auth_callback(session_id: str = None):
    """Handle Google OAuth callback with session ID"""
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    try:
        # Call Emergent Auth API to get user data
        async with aiohttp.ClientSession() as session:
            headers = {"X-Session-ID": session_id}
            async with session.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers=headers
            ) as response:
                if response.status != 200:
                    raise HTTPException(status_code=401, detail="Invalid session ID")
                
                google_user_data = await response.json()
                
        # Check if user exists
        existing_user = await db.users.find_one({"email": google_user_data["email"]})
        
        if existing_user:
            # User exists, update session token
            user = User(**existing_user)
        else:
            # Create new user with Google data - assign to default agency (first agency)
            agencies = await db.agencies.find({}).to_list(1)
            if not agencies:
                raise HTTPException(status_code=500, detail="No agencies available")
            
            new_user = User(
                id=str(uuid.uuid4()),
                name=google_user_data["name"],
                email=google_user_data["email"],
                password_hash="",  # No password for Google auth users
                role=UserRole.AGENCY_STAFF,  # Default role
                agency_id=agencies[0]["id"],  # Assign to first agency
                created_at=datetime.now(timezone.utc)
            )
            
            await db.users.insert_one(new_user.dict())
            user = new_user
        
        # Create session token with 7-day expiry
        session_token_record = SessionToken(
            session_token=google_user_data["session_token"],
            user_id=user.id,
            email=user.email,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        # Store session in database
        await db.sessions.insert_one(session_token_record.dict())
        
        # Prepare response with user data
        response_data = {
            "user": user.dict(),
            "session_token": google_user_data["session_token"],
            "message": "Google authentication successful"
        }
        
        # Create response with session cookie
        response = JSONResponse(content=response_data)
        response.set_cookie(
            key="session_token",
            value=google_user_data["session_token"],
            max_age=7 * 24 * 60 * 60,  # 7 days in seconds
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )
        
        return response
        
    except Exception as e:
        print(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")

@api_router.post("/auth/logout")
async def logout(session_token: Optional[str] = Cookie(None)):
    """Logout user and invalidate session"""
    if session_token:
        # Remove session from database
        await db.sessions.delete_one({"session_token": session_token})
    
    # Create response that clears the cookie
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return response

@api_router.get("/auth/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return {"user": current_user.dict()}

# Agency Routes (Updated permissions)
@api_router.post("/agencies", response_model=Agency)
async def create_agency(agency_data: AgencyCreate, current_user: User = Depends(get_current_user)):
    require_super_admin(current_user)  # Only super admin can create agencies
    
    agency = Agency(**agency_data.dict())
    await db.agencies.insert_one(agency.dict())
    return agency

# Agency Logo Management Endpoints
@api_router.post("/agencies/{agency_id}/upload-logo")
async def upload_agency_logo(
    agency_id: str, 
    logo: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload logo for agency"""
    # Check permissions
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.GENERAL_MANAGER, UserRole.GENERAL_ACCOUNTANT]:
        if current_user.role == UserRole.AGENCY_STAFF and current_user.agency_id != agency_id:
            raise HTTPException(status_code=403, detail="Not authorized to upload logo for this agency")
        elif current_user.role == UserRole.AGENCY_STAFF:
            raise HTTPException(status_code=403, detail="Agency staff cannot upload logos")
    
    # Validate file type
    if not logo.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (5MB max)
    max_size = 5 * 1024 * 1024  # 5MB
    contents = await logo.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/logos")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(logo.filename).suffix
    unique_filename = f"{agency_id}_{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    try:
        # Save file
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Update agency with logo URL
        logo_url = f"/uploads/logos/{unique_filename}"
        await db.agencies.update_one(
            {"id": agency_id},
            {"$set": {"logo_url": logo_url}}
        )
        
        return {"message": "Logo uploaded successfully", "logo_url": logo_url}
        
    except Exception as e:
        # Clean up file if database update fails
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

@api_router.delete("/agencies/{agency_id}/remove-logo")
async def remove_agency_logo(agency_id: str, current_user: User = Depends(get_current_user)):
    """Remove logo for agency"""
    # Check permissions
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.GENERAL_MANAGER, UserRole.GENERAL_ACCOUNTANT]:
        if current_user.role == UserRole.AGENCY_STAFF and current_user.agency_id != agency_id:
            raise HTTPException(status_code=403, detail="Not authorized to remove logo for this agency")
        elif current_user.role == UserRole.AGENCY_STAFF:
            raise HTTPException(status_code=403, detail="Agency staff cannot remove logos")
    
    try:
        # Get current agency data to find logo file
        agency = await db.agencies.find_one({"id": agency_id})
        if not agency:
            raise HTTPException(status_code=404, detail="Agency not found")
        
        # Remove logo file if it exists
        if agency.get("logo_url"):
            logo_path = Path(f".{agency['logo_url']}")  # Remove leading slash for local path
            if logo_path.exists():
                logo_path.unlink()
        
        # Update agency to remove logo URL
        await db.agencies.update_one(
            {"id": agency_id},
            {"$set": {"logo_url": ""}}
        )
        
        return {"message": "Logo removed successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove logo: {str(e)}")

# Notification Routes
@api_router.post("/notifications")
async def create_notification(
    title: str,
    message: str,
    notification_type: NotificationType,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    user_id: Optional[str] = None,
    agency_id: Optional[str] = None,
    action_url: Optional[str] = None,
    metadata: Optional[dict] = None,
    current_user: User = Depends(get_current_user)
):
    """إنشاء إشعار جديد"""
    notification = Notification(
        title=title,
        message=message,
        type=notification_type,
        priority=priority,
        user_id=user_id,
        agency_id=agency_id or current_user.agency_id,
        action_url=action_url,
        metadata=metadata
    )
    
    await db.notifications.insert_one(notification.dict())
    return {"message": "Notification created successfully", "id": notification.id}

@api_router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """الحصول على الإشعارات للمستخدم الحالي"""
    query = {
        "$or": [
            {"user_id": current_user.id},  # إشعارات شخصية
            {"user_id": None, "agency_id": current_user.agency_id},  # إشعارات الوكالة
            {"user_id": None, "agency_id": None}  # إشعارات عامة
        ]
    }
    
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [Notification(**notification) for notification in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """تعليم الإشعار كمقروء"""
    result = await db.notifications.update_one(
        {
            "id": notification_id,
            "$or": [
                {"user_id": current_user.id},
                {"user_id": None, "agency_id": current_user.agency_id},
                {"user_id": None, "agency_id": None}
            ]
        },
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """حذف إشعار"""
    result = await db.notifications.delete_one(
        {
            "id": notification_id,
            "$or": [
                {"user_id": current_user.id},
                {"user_id": None, "agency_id": current_user.agency_id}
            ]
        }
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted successfully"}

# Backup/Export Routes
@api_router.post("/backup")
async def create_backup(
    backup_type: str = "full",
    agency_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """إنشاء نسخة احتياطية"""
    require_super_admin(current_user)
    
    import json
    from datetime import datetime
    
    try:
        # إنشاء سجل النسخ الاحتياطي
        backup_filename = f"sanhaja_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        backup_record = BackupRecord(
            filename=backup_filename,
            backup_type=backup_type,
            agency_id=agency_id,
            created_by=current_user.id,
            status=BackupStatus.IN_PROGRESS
        )
        
        await db.backup_records.insert_one(backup_record.dict())
        
        # تجميع البيانات للنسخ الاحتياطي
        collections = ['agencies', 'users', 'clients', 'suppliers', 'bookings', 
                      'invoices', 'payments', 'cashboxes', 'journal_entries', 
                      'chart_of_accounts', 'daily_reports']
        
        backup_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "backup_type": backup_type,
            "agency_id": agency_id,
            "collections": {}
        }
        
        for collection_name in collections:
            collection = db[collection_name]
            query = {}
            
            # إذا كانت نسخة احتياطية لوكالة محددة
            if agency_id and collection_name in ['clients', 'suppliers', 'bookings', 
                                               'invoices', 'payments', 'cashboxes', 
                                               'journal_entries', 'daily_reports']:
                query["agency_id"] = agency_id
            
            documents = await collection.find(query).to_list(None)
            
            # تحويل ObjectId إلى string للتسلسل
            for doc in documents:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
            
            backup_data["collections"][collection_name] = documents
        
        # حفظ النسخة الاحتياطية (في التطبيق الحقيقي، ستحفظ في S3 أو نظام ملفات)
        # هنا سنحفظها في قاعدة البيانات كمثال
        backup_size = len(json.dumps(backup_data))
        
        await db.backup_records.update_one(
            {"id": backup_record.id},
            {
                "$set": {
                    "status": BackupStatus.COMPLETED,
                    "file_size": backup_size,
                    "completed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # حفظ البيانات
        await db.backups.insert_one({
            "backup_id": backup_record.id,
            "data": backup_data
        })
        
        # إنشاء إشعار نجاح
        await create_notification_internal(
            title="تم إنشاء النسخة الاحتياطية بنجاح",
            message=f"تم إنشاء النسخة الاحتياطية {backup_filename} بحجم {backup_size} بايت",
            notification_type=NotificationType.BACKUP_SUCCESS,
            user_id=current_user.id
        )
        
        return {
            "message": "Backup created successfully",
            "backup_id": backup_record.id,
            "filename": backup_filename,
            "size": backup_size
        }
        
    except Exception as e:
        # تحديث حالة الفشل
        await db.backup_records.update_one(
            {"id": backup_record.id},
            {
                "$set": {
                    "status": BackupStatus.FAILED,
                    "error_message": str(e),
                    "completed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # إنشاء إشعار فشل
        await create_notification_internal(
            title="فشل في إنشاء النسخة الاحتياطية",
            message=f"حدث خطأ أثناء إنشاء النسخة الاحتياطية: {str(e)}",
            notification_type=NotificationType.BACKUP_FAILED,
            priority=NotificationPriority.HIGH,
            user_id=current_user.id
        )
        
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@api_router.get("/backups")
async def get_backups(current_user: User = Depends(get_current_user)):
    """الحصول على قائمة النسخ الاحتياطية"""
    require_super_admin(current_user)
    
    backups = await db.backup_records.find().sort("created_at", -1).to_list(100)
    return [BackupRecord(**backup) for backup in backups]

@api_router.post("/restore/{backup_id}")
async def restore_backup(
    backup_id: str,
    current_user: User = Depends(get_current_user)
):
    """استعادة نسخة احتياطية"""
    require_super_admin(current_user)
    
    try:
        # البحث عن النسخة الاحتياطية
        backup_record = await db.backup_records.find_one({"id": backup_id})
        if not backup_record:
            raise HTTPException(status_code=404, detail="Backup not found")
        
        backup_data_doc = await db.backups.find_one({"backup_id": backup_id})
        if not backup_data_doc:
            raise HTTPException(status_code=404, detail="Backup data not found")
        
        backup_data = backup_data_doc["data"]
        
        # استعادة البيانات
        for collection_name, documents in backup_data["collections"].items():
            if documents:
                collection = db[collection_name]
                
                # حذف البيانات الموجودة (حذر!)
                if backup_data.get("agency_id"):
                    # حذف بيانات الوكالة المحددة فقط
                    await collection.delete_many({"agency_id": backup_data["agency_id"]})
                else:
                    # حذف جميع البيانات
                    await collection.delete_many({})
                
                # إدراج البيانات المستعادة
                for doc in documents:
                    if '_id' in doc:
                        del doc['_id']  # إزالة _id القديم
                
                await collection.insert_many(documents)
        
        # إنشاء إشعار نجاح
        await create_notification_internal(
            title="تم استعادة النسخة الاحتياطية بنجاح",
            message=f"تم استعادة البيانات من النسخة الاحتياطية {backup_record['filename']}",
            notification_type=NotificationType.BACKUP_SUCCESS,
            user_id=current_user.id
        )
        
        return {"message": "Backup restored successfully"}
        
    except Exception as e:
        # إنشاء إشعار فشل
        await create_notification_internal(
            title="فشل في استعادة النسخة الاحتياطية",
            message=f"حدث خطأ أثناء استعادة النسخة الاحتياطية: {str(e)}",
            notification_type=NotificationType.BACKUP_FAILED,
            priority=NotificationPriority.HIGH,
            user_id=current_user.id
        )
        
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

# Helper function for creating notifications internally
async def create_notification_internal(
    title: str,
    message: str,
    notification_type: NotificationType,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    user_id: Optional[str] = None,
    agency_id: Optional[str] = None,
    action_url: Optional[str] = None,
    metadata: Optional[dict] = None
):
    """دالة مساعدة لإنشاء الإشعارات داخلياً"""
    notification = Notification(
        title=title,
        message=message,
        type=notification_type,
        priority=priority,
        user_id=user_id,
        agency_id=agency_id,
        action_url=action_url,
        metadata=metadata
    )
    
    await db.notifications.insert_one(notification.dict())
    return notification

# Background task for checking due invoices and low cashbox
@api_router.post("/check-notifications")
async def check_notifications(current_user: User = Depends(get_current_user)):
    """فحص الإشعارات التلقائية (الفواتير المستحقة ورصيد الصندوق المنخفض)"""
    
    # فحص الفواتير المستحقة قريباً (خلال 7 أيام)
    seven_days_from_now = datetime.now(timezone.utc) + timedelta(days=7)
    
    due_invoices = await db.invoices.find({
        "status": "pending",
        "due_date": {"$lte": seven_days_from_now.isoformat()},
        "agency_id": current_user.agency_id
    }).to_list(None)
    
    for invoice in due_invoices:
        # تحقق من عدم وجود إشعار مسبق لهذه الفاتورة
        existing_notification = await db.notifications.find_one({
            "type": NotificationType.INVOICE_DUE,
            "metadata.invoice_id": invoice["id"],
            "is_read": False
        })
        
        if not existing_notification:
            due_date = datetime.fromisoformat(invoice["due_date"].replace('Z', '+00:00'))
            days_until_due = (due_date - datetime.now(timezone.utc)).days
            
            priority = NotificationPriority.HIGH if days_until_due <= 3 else NotificationPriority.MEDIUM
            
            await create_notification_internal(
                title=f"فاتورة مستحقة قريباً - {invoice['invoice_no']}",
                message=f"الفاتورة {invoice['invoice_no']} ستستحق خلال {days_until_due} أيام بمبلغ {invoice['amount_ttc']} دج",
                notification_type=NotificationType.INVOICE_DUE,
                priority=priority,
                agency_id=current_user.agency_id,
                action_url=f"/invoices/{invoice['id']}",
                metadata={"invoice_id": invoice["id"], "days_until_due": days_until_due}
            )
    
    # فحص رصيد الصندوق المنخفض
    cashboxes = await db.cashboxes.find({"agency_id": current_user.agency_id}).to_list(None)
    
    for cashbox in cashboxes:
        if cashbox["balance"] < 10000:  # أقل من 10,000 دج
            # تحقق من عدم وجود إشعار مسبق
            existing_notification = await db.notifications.find_one({
                "type": NotificationType.LOW_CASHBOX,
                "metadata.cashbox_id": cashbox["id"],
                "is_read": False
            })
            
            if not existing_notification:
                priority = NotificationPriority.URGENT if cashbox["balance"] < 5000 else NotificationPriority.HIGH
                
                await create_notification_internal(
                    title=f"رصيد منخفض في {cashbox['name']}",
                    message=f"رصيد {cashbox['name']} منخفض: {cashbox['balance']} دج",
                    notification_type=NotificationType.LOW_CASHBOX,
                    priority=priority,
                    agency_id=current_user.agency_id,
                    action_url=f"/cashboxes/{cashbox['id']}",
                    metadata={"cashbox_id": cashbox["id"], "balance": cashbox["balance"]}
                )
    
    return {"message": "Notifications checked and created"}

# CSV/Excel Export Routes
@api_router.get("/export/{table_name}")
async def export_data(
    table_name: str,
    format: str = "csv",  # csv, excel
    current_user: User = Depends(get_current_user)
):
    """تصدير البيانات إلى CSV أو Excel"""
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    # التحقق من الجدول المسموح
    allowed_tables = ['clients', 'suppliers', 'bookings', 'invoices', 'payments']
    if table_name not in allowed_tables:
        raise HTTPException(status_code=400, detail="Table not allowed for export")
    
    # جلب البيانات
    collection = db[table_name]
    query = {"agency_id": current_user.agency_id}
    
    if current_user.role == UserRole.SUPER_ADMIN:
        query = {}  # المدير العام يرى جميع البيانات
    
    data = await collection.find(query).to_list(None)
    
    if not data:
        raise HTTPException(status_code=404, detail="No data found")
    
    # إنشاء CSV
    output = io.StringIO()
    
    if data:
        # استخدام أول سجل لتحديد الأعمدة
        fieldnames = list(data[0].keys())
        # إزالة الحقول غير المرغوب فيها
        fieldnames = [f for f in fieldnames if f not in ['_id', 'password_hash']]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in data:
            # تنظيف البيانات
            clean_row = {k: v for k, v in row.items() if k in fieldnames}
            # تحويل التواريخ إلى نص
            for key, value in clean_row.items():
                if isinstance(value, datetime):
                    clean_row[key] = value.isoformat()
            writer.writerow(clean_row)
    
    output.seek(0)
    
    # إنشاء الاستجابة
    filename = f"{table_name}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Client Routes (Updated permissions)
@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    client_dict = client_data.dict()
    
    # Super admin can specify agency_id, others use their own
    if current_user.role == UserRole.SUPER_ADMIN and "agency_id" in client_dict:
        agency_id = client_dict["agency_id"]
    else:
        agency_id = current_user.agency_id
        client_dict["agency_id"] = agency_id
    
    can_manage_agency_data(current_user, agency_id)
    
    client = Client(**client_dict)
    await db.clients.insert_one(client.dict())
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(agency_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    # Super Admin and General Accountant see all clients, can filter by agency
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        query_filter = {"agency_id": agency_id} if agency_id else {}
    else:
        # Agency staff only see their own agency clients
        query_filter = {"agency_id": current_user.agency_id}
    
    clients = await db.clients.find(query_filter).to_list(1000)
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
async def get_suppliers(agency_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    # Super Admin and General Accountant see all suppliers, can filter by agency
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        query_filter = {"agency_id": agency_id} if agency_id else {}
    else:
        # Agency staff only see their own agency suppliers
        query_filter = {"agency_id": current_user.agency_id}
    
    suppliers = await db.suppliers.find(query_filter).to_list(1000)
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
    booking_dict["created_by"] = current_user.id
    booking_dict["status"] = OperationStatus.DRAFT
    booking_dict["modification_history"] = []
    booking = Booking(**booking_dict)
    await db.bookings.insert_one(booking.dict())
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(
    agency_id: Optional[str] = None,
    client_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    booking_type: Optional[BookingType] = None,
    status: Optional[OperationStatus] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_cost: Optional[float] = None,
    max_cost: Optional[float] = None,
    current_user: User = Depends(get_current_user)
):
    """Get bookings with advanced filtering - Restricted to Manager/Accountant only"""
    # NEW: Block Agency Staff from accessing bookings
    if current_user.role == UserRole.AGENCY_STAFF:
        raise HTTPException(
            status_code=403, 
            detail="Bookings access restricted to managers and accountants only"
        )
    
    query_filter = {}
    
    # Role-based access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        if agency_id:
            query_filter["agency_id"] = agency_id
        # else: show all agencies
    else:
        query_filter["agency_id"] = current_user.agency_id
    
    # Advanced filtering
    if client_id:
        query_filter["client_id"] = client_id
    if supplier_id:
        query_filter["supplier_id"] = supplier_id
    if booking_type:
        query_filter["type"] = booking_type
    if status:
        query_filter["status"] = status
    
    # Date range filtering
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query_filter["start_date"] = {"$gte": start_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            if "start_date" in query_filter:
                query_filter["start_date"]["$lte"] = end_dt
            else:
                query_filter["start_date"] = {"$lte": end_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    # Cost range filtering
    if min_cost is not None and max_cost is not None:
        query_filter["cost"] = {"$gte": min_cost, "$lte": max_cost}
    elif min_cost is not None:
        query_filter["cost"] = {"$gte": min_cost}
    elif max_cost is not None:
        query_filter["cost"] = {"$lte": max_cost}
    
    bookings = await db.bookings.find(query_filter).sort("created_at", -1).to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: str, 
    booking_data: BookingUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Update booking - allowed for staff if not yet approved, accountants can modify unapproved items"""
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check agency access
    can_manage_agency_data(current_user, booking["agency_id"])
    
    # Check approval status permissions
    booking_status = booking.get("status", OperationStatus.DRAFT)
    
    if current_user.role == UserRole.AGENCY_STAFF:
        # Staff can only edit if status is DRAFT, PENDING_APPROVAL, or REJECTED
        if booking_status == OperationStatus.APPROVED:
            raise HTTPException(
                status_code=403, 
                detail="Cannot modify approved booking. Contact accountant for changes."
            )
    elif current_user.role in [UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        # Accountants and Super Admin can modify any unapproved booking
        if booking_status == OperationStatus.APPROVED:
            # Log modification history for approved items
            modification_record = {
                "modified_by": current_user.id,
                "modified_at": datetime.now(timezone.utc).isoformat(),
                "reason": "Post-approval modification by accountant",
                "fields_changed": list(booking_data.dict(exclude_unset=True).keys())
            }
            
            # Add to modification history
            current_history = booking.get("modification_history", [])
            current_history.append(modification_record)
            booking_data.modification_history = current_history
    
    # Update booking
    update_data = booking_data.dict(exclude_unset=True)
    if update_data:
        await db.bookings.update_one(
            {"id": booking_id}, 
            {"$set": update_data}
        )
    
    updated_booking = await db.bookings.find_one({"id": booking_id})
    return Booking(**updated_booking)

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    """Delete booking - allowed for staff if not yet approved, accountants can delete unapproved items"""
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check agency access
    can_manage_agency_data(current_user, booking["agency_id"])
    
    # Check approval status permissions
    booking_status = booking.get("status", OperationStatus.DRAFT)
    
    if current_user.role == UserRole.AGENCY_STAFF:
        # Staff can only delete if status is DRAFT, PENDING_APPROVAL, or REJECTED
        if booking_status == OperationStatus.APPROVED:
            raise HTTPException(
                status_code=403, 
                detail="Cannot delete approved booking. Contact accountant for deletion."
            )
    elif current_user.role in [UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        # Accountants and Super Admin can delete any booking but log the action
        if booking_status == OperationStatus.APPROVED:
            # Log the deletion for audit purposes
            await db.booking_deletions.insert_one({
                "booking_id": booking_id,
                "booking_data": booking,
                "deleted_by": current_user.id,
                "deleted_at": datetime.now(timezone.utc),
                "reason": "Post-approval deletion by accountant"
            })
    
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking deleted successfully"}

@api_router.put("/bookings/{booking_id}/approve")
async def approve_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    """Approve booking - General Manager and General Accountant only"""
    require_general_accountant_or_above(current_user)
    
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check agency access for General Accountant
    if current_user.role == UserRole.GENERAL_ACCOUNTANT:
        if booking["agency_id"] != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Cannot approve bookings of other agencies")
    
    # Update booking status
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "status": OperationStatus.APPROVED,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Booking approved successfully"}

@api_router.put("/bookings/{booking_id}/reject")
async def reject_booking(
    booking_id: str, 
    rejection_reason: str = "",
    current_user: User = Depends(get_current_user)
):
    """Reject booking - General Manager and General Accountant only"""
    require_general_accountant_or_above(current_user)
    
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check agency access for General Accountant
    if current_user.role == UserRole.GENERAL_ACCOUNTANT:
        if booking["agency_id"] != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Cannot reject bookings of other agencies")
    
    # Update booking status
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "status": OperationStatus.REJECTED,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc),
                "rejected_reason": rejection_reason
            }
        }
    )
    
    return {"message": "Booking rejected successfully"}

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
async def get_invoices(agency_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get invoices - Restricted to Manager/Accountant only"""
    # NEW: Block Agency Staff from accessing invoices
    if current_user.role == UserRole.AGENCY_STAFF:
        raise HTTPException(
            status_code=403, 
            detail="Invoices access restricted to managers and accountants only"
        )
    
    # Super Admin and General Accountant see all invoices, can filter by agency
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        query_filter = {"agency_id": agency_id} if agency_id else {}
    else:
        query_filter = {"agency_id": current_user.agency_id}
    
    invoices = await db.invoices.find(query_filter).to_list(1000)
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
async def get_payments(
    agency_id: Optional[str] = None,
    payment_type: Optional[str] = None,  # "invoice" or "operation"
    current_user: User = Depends(get_current_user)
):
    """Get payments with role-based filtering"""
    query_filter = {}
    
    # Role-based access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        # Managers/Accountants see all payments, can filter by agency
        if agency_id:
            query_filter["agency_id"] = agency_id
    else:
        # Agency staff see only their agency payments
        query_filter["agency_id"] = current_user.agency_id
        
        # Agency staff can only see operation payments (not invoice payments)
        if current_user.role == UserRole.AGENCY_STAFF:
            query_filter["daily_operation_id"] = {"$exists": True, "$ne": None}
    
    # Filter by payment type
    if payment_type == "invoice":
        query_filter["invoice_id"] = {"$exists": True, "$ne": None}
    elif payment_type == "operation":
        query_filter["daily_operation_id"] = {"$exists": True, "$ne": None}
    
    payments = await db.payments.find(query_filter).sort("payment_date", -1).to_list(1000)
    return [Payment(**payment) for payment in payments]

# Dashboard Route
@api_router.get("/dashboard")
async def get_dashboard(agency_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    # Query filter based on role and optional agency filter
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        query_filter = {"agency_id": agency_id} if agency_id else {}
    else:
        query_filter = {"agency_id": current_user.agency_id}
    
    # Today's income/expenses
    today_invoices = await db.invoices.find({
        **query_filter,
        "created_at": {"$gte": today, "$lt": tomorrow}
    }).to_list(1000)
    
    today_income = sum(inv["amount_ttc"] for inv in today_invoices)
    
    # Unpaid invoices
    unpaid_invoices = await db.invoices.count_documents({
        **query_filter,
        "status": InvoiceStatus.PENDING
    })
    
    # This week's bookings
    week_start = today - timedelta(days=today.weekday())
    week_bookings = await db.bookings.count_documents({
        **query_filter,
        "created_at": {"$gte": week_start}
    })
    
    # Cashbox balance
    cashboxes = await db.cashboxes.find(query_filter).to_list(1000)
    total_cashbox_balance = sum(cb["balance"] for cb in cashboxes)
    
    return {
        "today_income": today_income,
        "unpaid_invoices": unpaid_invoices,
        "week_bookings": week_bookings,
        "cashbox_balance": total_cashbox_balance
    }

# Enhanced Reports Routes with Agency Breakdown
@api_router.get("/reports/sales")
async def generate_sales_report(
    start_date: str,
    end_date: str,
    report_type: str = "daily",  # daily, monthly
    agency_ids: Optional[str] = None,  # Comma-separated agency IDs, or "all" for all agencies
    group_by_agency: bool = True,  # Whether to group results by agency
    current_user: User = Depends(get_current_user)
):
    """Generate enhanced sales reports with agency breakdown"""
    try:
        from datetime import datetime
        
        # Parse dates with flexible format support
        try:
            if 'T' not in start_date and 'T' not in end_date:
                start = datetime.fromisoformat(start_date + 'T00:00:00')
                end = datetime.fromisoformat(end_date + 'T23:59:59')
            else:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError as e:
            try:
                start = datetime.strptime(start_date[:10], '%Y-%m-%d')
                end = datetime.strptime(end_date[:10], '%Y-%m-%d')
                end = end.replace(hour=23, minute=59, second=59)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid date format. Use YYYY-MM-DD or ISO format.")
        
        # Ensure timezone awareness
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        
        print(f"Generating {report_type} sales report from {start} to {end}")
        
        # Build query filter based on user role and agency selection
        if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
            if agency_ids and agency_ids != "all":
                # Filter by specific agencies
                selected_agency_ids = [id.strip() for id in agency_ids.split(',')]
                query_filter = {"agency_id": {"$in": selected_agency_ids}}
            else:
                # All agencies
                query_filter = {}
        else:
            # Agency staff only see their own data
            query_filter = {"agency_id": current_user.agency_id}
            
        query_filter["created_at"] = {"$gte": start, "$lte": end}
        
        # Get invoices for the period
        invoices = await db.invoices.find(query_filter).to_list(1000)
        
        # Get agencies data for names
        agencies = await db.agencies.find({}).to_list(100)
        agencies_dict = {agency["id"]: agency for agency in agencies}
        
        print(f"Found {len(invoices)} invoices for the period")
        
        if group_by_agency:
            # Group by agency first, then by time period
            agency_data = {}
            
            for invoice in invoices:
                agency_id = invoice["agency_id"]
                agency_info = agencies_dict.get(agency_id, {"name": "وكالة غير معروفة", "city": "غير محدد"})
                agency_name = f"{agency_info['name']} - {agency_info['city']}"
                
                if agency_name not in agency_data:
                    agency_data[agency_name] = {
                        "agency_id": agency_id,
                        "agency_name": agency_name,
                        "periods": {},
                        "totals": {"sales": 0, "bookings": 0}
                    }
                
                # Group by time period within agency
                if report_type == "monthly":
                    period_key = invoice["created_at"].strftime("%Y-%m")
                else:
                    period_key = invoice["created_at"].strftime("%Y-%m-%d")
                
                if period_key not in agency_data[agency_name]["periods"]:
                    agency_data[agency_name]["periods"][period_key] = {
                        "period": period_key,
                        "sales": 0,
                        "bookings": 0
                    }
                
                agency_data[agency_name]["periods"][period_key]["sales"] += invoice["amount_ttc"]
                agency_data[agency_name]["periods"][period_key]["bookings"] += 1
                agency_data[agency_name]["totals"]["sales"] += invoice["amount_ttc"]
                agency_data[agency_name]["totals"]["bookings"] += 1
            
            # Convert to list and sort periods within each agency
            result_data = []
            grand_totals = {"sales": 0, "bookings": 0}
            
            for agency_name, agency_info in agency_data.items():
                # Sort periods within agency
                periods_list = list(agency_info["periods"].values())
                periods_list.sort(key=lambda x: x['period'])
                
                agency_info["periods"] = periods_list
                result_data.append(agency_info)
                
                # Add to grand totals
                grand_totals["sales"] += agency_info["totals"]["sales"]
                grand_totals["bookings"] += agency_info["totals"]["bookings"]
            
            # Sort agencies by name
            result_data.sort(key=lambda x: x['agency_name'])
            
            return {
                "title": f"تقرير المبيعات {('الشهري' if report_type == 'monthly' else 'اليومي')} - حسب الوكالة",
                "period": f"من {start_date} إلى {end_date}",
                "report_type": report_type,
                "group_by_agency": True,
                "agencies_data": result_data,
                "grand_totals": grand_totals,
                "invoice_count": len(invoices)
            }
        
        else:
            # Traditional grouping without agency breakdown
            if report_type == "monthly":
                monthly_data = {}
                for invoice in invoices:
                    month_key = invoice["created_at"].strftime("%Y-%m")
                    if month_key not in monthly_data:
                        monthly_data[month_key] = {
                            "month": month_key,
                            "sales": 0,
                            "bookings": 0
                        }
                    monthly_data[month_key]["sales"] += invoice["amount_ttc"]
                    monthly_data[month_key]["bookings"] += 1
                
                data = list(monthly_data.values())
                data.sort(key=lambda x: x['month'])
                
                totals = {
                    "sales": sum(item["sales"] for item in data),
                    "bookings": sum(item["bookings"] for item in data)
                }
            else:
                daily_data = {}
                for invoice in invoices:
                    date_key = invoice["created_at"].strftime("%Y-%m-%d")
                    if date_key not in daily_data:
                        daily_data[date_key] = {
                            "date": date_key,
                            "sales": 0,
                            "bookings": 0
                        }
                    daily_data[date_key]["sales"] += invoice["amount_ttc"]
                    daily_data[date_key]["bookings"] += 1
                
                data = list(daily_data.values())
                data.sort(key=lambda x: x['date'])
                
                totals = {
                    "sales": sum(item["sales"] for item in data),
                    "bookings": sum(item["bookings"] for item in data)
                }
            
            return {
                "title": f"تقرير المبيعات {('الشهري' if report_type == 'monthly' else 'اليومي')} - مجمع",
                "period": f"من {start_date} إلى {end_date}",
                "report_type": report_type,
                "group_by_agency": False,
                "data": data,
                "totals": totals,
                "invoice_count": len(invoices)
            }
        
    except Exception as e:
        print(f"Sales report error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error generating sales report: {str(e)}")

@api_router.get("/reports/aging")
async def generate_aging_report(
    agency_ids: Optional[str] = None,  # Comma-separated agency IDs, or "all" for all agencies
    group_by_agency: bool = True,  # Whether to group results by agency
    current_user: User = Depends(get_current_user)
):
    """Generate accounts receivable aging report with agency breakdown"""
    try:
        # Build query filter based on user role and agency selection
        if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
            if agency_ids and agency_ids != "all":
                selected_agency_ids = [id.strip() for id in agency_ids.split(',')]
                query_filter = {"agency_id": {"$in": selected_agency_ids}}
            else:
                query_filter = {}
        else:
            query_filter = {"agency_id": current_user.agency_id}
        
        query_filter["status"] = InvoiceStatus.PENDING
        
        # Get unpaid invoices
        unpaid_invoices = await db.invoices.find(query_filter).to_list(1000)
        
        # Get clients and agencies data
        clients = await db.clients.find({}).to_list(1000)
        clients_dict = {client["id"]: client["name"] for client in clients}
        
        agencies = await db.agencies.find({}).to_list(100)
        agencies_dict = {agency["id"]: agency for agency in agencies}
        
        if group_by_agency:
            # Group by agency
            agency_data = {}
            grand_totals = {"count": 0, "amount": 0}
            
            for invoice in unpaid_invoices:
                agency_id = invoice["agency_id"]
                agency_info = agencies_dict.get(agency_id, {"name": "وكالة غير معروفة", "city": "غير محدد"})
                agency_name = f"{agency_info['name']} - {agency_info['city']}"
                
                if agency_name not in agency_data:
                    agency_data[agency_name] = {
                        "agency_id": agency_id,
                        "agency_name": agency_name,
                        "invoices": [],
                        "totals": {"count": 0, "amount": 0}
                    }
                
                # Calculate days overdue
                invoice_date = invoice["created_at"]
                if isinstance(invoice_date, str):
                    invoice_date = datetime.fromisoformat(invoice_date.replace('Z', '+00:00'))
                elif invoice_date.tzinfo is None:
                    invoice_date = invoice_date.replace(tzinfo=timezone.utc)
                
                days_overdue = (datetime.now(timezone.utc) - invoice_date).days
                
                invoice_data = {
                    "client": clients_dict.get(invoice["client_id"], "Unknown"),
                    "invoice": invoice["invoice_no"],
                    "amount": invoice["amount_ttc"],
                    "days": days_overdue
                }
                
                agency_data[agency_name]["invoices"].append(invoice_data)
                agency_data[agency_name]["totals"]["count"] += 1
                agency_data[agency_name]["totals"]["amount"] += invoice["amount_ttc"]
                
                grand_totals["count"] += 1
                grand_totals["amount"] += invoice["amount_ttc"]
            
            # Sort invoices within each agency by days overdue
            result_data = []
            for agency_name, agency_info in agency_data.items():
                agency_info["invoices"].sort(key=lambda x: x["days"], reverse=True)
                result_data.append(agency_info)
            
            # Sort agencies by name
            result_data.sort(key=lambda x: x['agency_name'])
            
            return {
                "title": "تقرير أعمار الديون - حسب الوكالة",
                "group_by_agency": True,
                "agencies_data": result_data,
                "grand_totals": grand_totals
            }
        
        else:
            # Traditional format without agency grouping
            aging_data = []
            total_amount = 0
            
            for invoice in unpaid_invoices:
                # Calculate days overdue
                invoice_date = invoice["created_at"]
                if isinstance(invoice_date, str):
                    invoice_date = datetime.fromisoformat(invoice_date.replace('Z', '+00:00'))
                elif invoice_date.tzinfo is None:
                    invoice_date = invoice_date.replace(tzinfo=timezone.utc)
                
                days_overdue = (datetime.now(timezone.utc) - invoice_date).days
                
                aging_data.append({
                    "client": clients_dict.get(invoice["client_id"], "Unknown"),
                    "invoice": invoice["invoice_no"],
                    "amount": invoice["amount_ttc"],
                    "days": days_overdue
                })
                total_amount += invoice["amount_ttc"]
            
            # Sort by days overdue (highest first)
            aging_data.sort(key=lambda x: x["days"], reverse=True)
            
            return {
                "title": "تقرير أعمار الديون - مجمع",
                "group_by_agency": False,
                "data": aging_data,
                "totals": {
                    "count": len(aging_data),
                    "amount": total_amount
                }
            }
            
    except Exception as e:
        print(f"Aging report error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error generating aging report: {str(e)}")

@api_router.get("/reports/summary")
async def generate_summary_report(
    start_date: str,
    end_date: str,
    agency_ids: Optional[str] = None,  # Comma-separated agency IDs, or "all" for all agencies
    group_by_agency: bool = True,  # Whether to group results by agency
    current_user: User = Depends(get_current_user)
):
    """Generate summary sales report (without profit calculations)"""
    try:
        from datetime import datetime
        
        # Parse dates
        try:
            if 'T' not in start_date and 'T' not in end_date:
                start = datetime.fromisoformat(start_date + 'T00:00:00')
                end = datetime.fromisoformat(end_date + 'T23:59:59')
            else:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            try:
                start = datetime.strptime(start_date[:10], '%Y-%m-%d')
                end = datetime.strptime(end_date[:10], '%Y-%m-%d')
                end = end.replace(hour=23, minute=59, second=59)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format")
        
        # Ensure timezone awareness
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        
        # Build query filter based on user role and agency selection
        if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
            if agency_ids and agency_ids != "all":
                selected_agency_ids = [id.strip() for id in agency_ids.split(',')]
                query_filter = {"agency_id": {"$in": selected_agency_ids}}
            else:
                query_filter = {}
        else:
            query_filter = {"agency_id": current_user.agency_id}
            
        query_filter["created_at"] = {"$gte": start, "$lte": end}
        
        # Get invoices and bookings for the period
        invoices = await db.invoices.find(query_filter).to_list(1000)
        bookings = await db.bookings.find(query_filter).to_list(1000)
        
        # Get agencies data
        agencies = await db.agencies.find({}).to_list(100)
        agencies_dict = {agency["id"]: agency for agency in agencies}
        
        if group_by_agency:
            # Group by agency
            agency_data = {}
            grand_totals = {"sales": 0, "bookings": 0, "invoices": 0}
            
            for invoice in invoices:
                agency_id = invoice["agency_id"]
                agency_info = agencies_dict.get(agency_id, {"name": "وكالة غير معروفة", "city": "غير محدد"})
                agency_name = f"{agency_info['name']} - {agency_info['city']}"
                
                if agency_name not in agency_data:
                    agency_data[agency_name] = {
                        "agency_id": agency_id,
                        "agency_name": agency_name,
                        "sales": 0,
                        "bookings": 0,
                        "invoices": 0
                    }
                
                agency_data[agency_name]["sales"] += invoice["amount_ttc"]
                agency_data[agency_name]["invoices"] += 1
                grand_totals["sales"] += invoice["amount_ttc"]
                grand_totals["invoices"] += 1
            
            # Count bookings by agency
            for booking in bookings:
                agency_id = booking["agency_id"]
                agency_info = agencies_dict.get(agency_id, {"name": "وكالة غير معروفة", "city": "غير محدد"})
                agency_name = f"{agency_info['name']} - {agency_info['city']}"
                
                if agency_name not in agency_data:
                    agency_data[agency_name] = {
                        "agency_id": agency_id,
                        "agency_name": agency_name,
                        "sales": 0,
                        "bookings": 0,
                        "invoices": 0
                    }
                
                agency_data[agency_name]["bookings"] += 1
                grand_totals["bookings"] += 1
            
            # Convert to list and sort
            result_data = list(agency_data.values())
            result_data.sort(key=lambda x: x['agency_name'])
            
            return {
                "title": "تقرير ملخص المبيعات - حسب الوكالة",
                "period": f"من {start_date} إلى {end_date}",
                "group_by_agency": True,
                "agencies_data": result_data,
                "grand_totals": grand_totals
            }
        
        else:
            # Calculate totals without agency breakdown
            total_sales = sum(inv["amount_ttc"] for inv in invoices)
            total_bookings = len(bookings)
            total_invoices = len(invoices)
            
            return {
                "title": "تقرير ملخص المبيعات - مجمع",
                "period": f"من {start_date} إلى {end_date}",
                "group_by_agency": False,
                "data": {
                    "sales": total_sales,
                    "bookings": total_bookings,
                    "invoices": total_invoices
                }
            }
        
    except Exception as e:
        print(f"Summary report error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error generating summary report: {str(e)}")

# User Management Routes (Super Admin Only)
@api_router.get("/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users - Super Admin only"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can access user management")
    
    users = await db.users.find({}).to_list(1000)
    return [User(**user) for user in users]

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    """Create new user - Super Admin only"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can create users")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate agency exists
    agency = await db.agencies.find_one({"id": user_data.agency_id})
    if not agency:
        raise HTTPException(status_code=400, detail="Agency not found")
    
    # Create new user
    password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = User(
        id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        password_hash=password_hash,  # Add password_hash to the model
        role=user_data.role,
        agency_id=user_data.agency_id,
        created_at=datetime.now(timezone.utc)
    )
    
    # Insert user
    user_dict = user.dict()
    await db.users.insert_one(user_dict)
    return user

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, current_user: User = Depends(get_current_user)):
    """Update user - Super Admin only"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can update users")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update data
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if user_data.name:
        update_data["name"] = user_data.name
    if user_data.email:
        # Check email uniqueness
        existing_user = await db.users.find_one({"email": user_data.email, "id": {"$ne": user_id}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        update_data["email"] = user_data.email
    if user_data.role:
        update_data["role"] = user_data.role
    if user_data.agency_id:
        # Validate agency exists
        agency = await db.agencies.find_one({"id": user_data.agency_id})
        if not agency:
            raise HTTPException(status_code=400, detail="Agency not found")
        update_data["agency_id"] = user_data.agency_id
    if user_data.password:
        update_data["password_hash"] = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    # Return updated user
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Delete user - Super Admin only"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can delete users")
    
    # Cannot delete self
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted successfully"}

@api_router.get("/agencies", response_model=List[Agency])
async def get_all_agencies(current_user: User = Depends(get_current_user)):
    """Get all agencies for user management dropdowns"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    agencies = await db.agencies.find({}).to_list(1000)
    return [Agency(**agency) for agency in agencies]

@api_router.get("/agencies/{agency_id}", response_model=Agency)
async def get_agency_details(agency_id: str, current_user: User = Depends(get_current_user)):
    """Get agency details for settings"""
    # Role-based access control
    if current_user.role == UserRole.AGENCY_STAFF:
        # Agency staff can only view their own agency
        if agency_id != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Access denied. You can only view your own agency settings.")
    elif current_user.role not in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    agency = await db.agencies.find_one({"id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    
    return Agency(**agency)

@api_router.put("/agencies/{agency_id}", response_model=Agency)
async def update_agency_settings(
    agency_id: str, 
    agency_data: AgencyUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Update agency settings"""
    # Role-based access control for updates
    if current_user.role == UserRole.AGENCY_STAFF:
        raise HTTPException(status_code=403, detail="Access denied. Only General Manager and General Accountant can modify agency settings.")
    elif current_user.role not in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify agency exists
    agency = await db.agencies.find_one({"id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    
    # Build update data
    update_data = {}
    for field, value in agency_data.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid update data provided")
    
    # Update agency
    await db.agencies.update_one({"id": agency_id}, {"$set": update_data})
    
    # Return updated agency
    updated_agency = await db.agencies.find_one({"id": agency_id})
    return Agency(**updated_agency)

# Daily Reports Management Routes
@api_router.get("/daily-reports")
async def get_daily_reports(current_user: User = Depends(get_current_user)):
    """Get daily reports based on user role"""
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super Admin sees all reports from all agencies
        reports = await db.daily_reports.find({}).to_list(1000)
    elif current_user.role == UserRole.GENERAL_ACCOUNTANT:
        # General Accountant sees all reports but can approve/reject
        reports = await db.daily_reports.find({}).to_list(1000)
    else:
        # Agency staff sees only their agency reports
        reports = await db.daily_reports.find({"agency_id": current_user.agency_id}).to_list(1000)
    
    # Convert to DailyReport models to ensure proper JSON serialization
    return [DailyReport(**report) for report in reports]

@api_router.post("/daily-reports")
async def create_daily_report(report_data: DailyReportCreate, current_user: User = Depends(get_current_user)):
    """Create daily report - Agency Staff"""
    if current_user.role not in [UserRole.AGENCY_STAFF, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only agency staff can create daily reports")
    
    try:
        # Parse the date properly
        report_date = report_data.date
        if isinstance(report_date, str):
            report_date = datetime.fromisoformat(report_date.replace('Z', '+00:00'))
        
        # Ensure date is timezone-aware
        if report_date.tzinfo is None:
            report_date = report_date.replace(tzinfo=timezone.utc)
        
        # Convert to date-only string for unique constraint
        date_str = report_date.strftime('%Y-%m-%d')
        
        # Check if report already exists for this date and agency
        existing_report = await db.daily_reports.find_one({
            "date_str": date_str,
            "agency_id": current_user.agency_id
        })
        
        if existing_report:
            # Update existing report instead of creating new one
            update_data = {
                "income": report_data.income,
                "expenses": report_data.expenses,
                "cashbox_balance": report_data.cashbox_balance,
                "notes": report_data.notes or "",
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.daily_reports.update_one(
                {"id": existing_report["id"]},
                {"$set": update_data}
            )
            
            # Return updated report
            updated_report = await db.daily_reports.find_one({"id": existing_report["id"]})
            return DailyReport(**updated_report)
        
        # Create new report
        report = DailyReport(
            id=str(uuid.uuid4()),
            date=report_date,
            date_str=date_str,  # Add date string for easy querying
            income=report_data.income,
            expenses=report_data.expenses,
            cashbox_balance=report_data.cashbox_balance,
            notes=report_data.notes or "",
            status=ReportStatus.PENDING,
            agency_id=current_user.agency_id,
            created_by=current_user.id,
            created_at=datetime.now(timezone.utc)
        )
        
        await db.daily_reports.insert_one(report.dict())
        return report
        
    except Exception as e:
        print(f"Error creating daily report: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error creating daily report: {str(e)}")

@api_router.put("/daily-reports/{report_id}/approve")
async def approve_daily_report(report_id: str, current_user: User = Depends(get_current_user)):
    """Approve daily report - General Accountant or Super Admin"""
    if current_user.role not in [UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only General Accountant or Super Admin can approve reports")
    
    report = await db.daily_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    await db.daily_reports.update_one(
        {"id": report_id},
        {
            "$set": {
                "status": ReportStatus.APPROVED,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Report approved successfully"}

@api_router.put("/daily-reports/{report_id}/reject")
async def reject_daily_report(
    report_id: str, 
    rejection_reason: str = "",
    current_user: User = Depends(get_current_user)
):
    """Reject daily report - General Accountant or Super Admin"""
    if current_user.role not in [UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only General Accountant or Super Admin can reject reports")
    
    report = await db.daily_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    await db.daily_reports.update_one(
        {"id": report_id},
        {
            "$set": {
                "status": ReportStatus.REJECTED,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc),
                "rejection_reason": rejection_reason
            }
        }
    )
    
    return {"message": "Report rejected successfully"}

# Services Management Routes
@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    """Create a new service - General Manager and General Accountant only"""
    require_general_accountant_or_above(current_user)
    
    service_dict = service_data.dict()
    service_dict["created_by"] = current_user.id
    
    # Super admin can assign to specific agency, others to their own
    if current_user.role == UserRole.SUPER_ADMIN:
        # Keep agency_id as provided (can be None for global services)
        pass
    else:
        # General accountant - assign to their agency
        service_dict["agency_id"] = current_user.agency_id
    
    service = Service(**service_dict)
    await db.services.insert_one(service.dict())
    return service

@api_router.get("/services", response_model=List[Service])
async def get_services(
    agency_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    service_type: Optional[ServiceType] = None,
    current_user: User = Depends(get_current_user)
):
    """Get services list with filters"""
    query_filter = {}
    
    # Role-based access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        if agency_id:
            query_filter["agency_id"] = agency_id
        else:
            # Show global services and agency-specific services
            query_filter["$or"] = [
                {"agency_id": None},  # Global services
                {"agency_id": current_user.agency_id}  # Their agency services
            ]
    else:
        # Agency staff see global services and their agency services
        query_filter["$or"] = [
            {"agency_id": None},  # Global services
            {"agency_id": current_user.agency_id}  # Their agency services
        ]
    
    # Additional filters
    if is_active is not None:
        query_filter["is_active"] = is_active
    if service_type:
        query_filter["service_type"] = service_type
    
    services = await db.services.find(query_filter).to_list(1000)
    return [Service(**service) for service in services]

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(
    service_id: str, 
    service_data: ServiceUpdate, 
    change_reason: str = "تحديث السعر",
    current_user: User = Depends(get_current_user)
):
    """Update service - General Manager and General Accountant only"""
    require_general_accountant_or_above(current_user)
    
    existing_service = await db.services.find_one({"id": service_id})
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check permissions for agency-specific services
    if existing_service["agency_id"] and current_user.role == UserRole.GENERAL_ACCOUNTANT:
        if existing_service["agency_id"] != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Cannot modify services of other agencies")
    
    update_data = service_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # If price is being updated, record in history
    if "base_price" in update_data and update_data["base_price"] != existing_service["base_price"]:
        price_history = ServicePriceHistory(
            service_id=service_id,
            old_price=existing_service["base_price"],
            new_price=update_data["base_price"],
            change_reason=change_reason,
            changed_by=current_user.id
        )
        await db.service_price_history.insert_one(price_history.dict())
    
    await db.services.update_one({"id": service_id}, {"$set": update_data})
    
    updated_service = await db.services.find_one({"id": service_id})
    return Service(**updated_service)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_user)):
    """Delete service - General Manager and General Accountant only"""
    require_general_accountant_or_above(current_user)
    
    existing_service = await db.services.find_one({"id": service_id})
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check permissions for agency-specific services
    if existing_service["agency_id"] and current_user.role == UserRole.GENERAL_ACCOUNTANT:
        if existing_service["agency_id"] != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Cannot delete services of other agencies")
    
    # Check if service is used in operations
    operations_count = await db.daily_operations.count_documents({"service_id": service_id})
    if operations_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete service. It is used in {operations_count} operations."
        )
    
    await db.services.delete_one({"id": service_id})
    return {"message": "Service deleted successfully"}

# Daily Operations Routes
@api_router.post("/daily-operations", response_model=DailyOperation)
async def create_daily_operation(operation_data: DailyOperationCreate, current_user: User = Depends(get_current_user)):
    """Create daily operation receipt"""
    
    # Get service details
    service = await db.services.find_one({"id": operation_data.service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if service is active
    if not service["is_active"]:
        raise HTTPException(status_code=400, detail="Service is not active")
    
    # Get client details
    client = await db.clients.find_one({"id": operation_data.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check client belongs to same agency or user has cross-agency access
    if current_user.role == UserRole.AGENCY_STAFF:
        if client["agency_id"] != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Client not accessible")
    
    # Generate operation number
    today = datetime.now(timezone.utc).date()
    today_operations = await db.daily_operations.count_documents({
        "agency_id": current_user.agency_id,
        "date": {
            "$gte": datetime.combine(today, datetime.min.time()),
            "$lt": datetime.combine(today + timedelta(days=1), datetime.min.time())
        }
    })
    operation_no = f"OP-{today.strftime('%Y%m%d')}-{today_operations + 1:04d}"
    
    # Use provided price or service base price
    base_price = operation_data.base_price if operation_data.base_price is not None else service["base_price"]
    
    # Validate discount
    discount_amount = operation_data.discount_amount or 0.0
    if discount_amount > 0:
        if service["is_fixed_price"] and service.get("min_price"):
            final_price = base_price - discount_amount
            if final_price < service["min_price"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Final price ({final_price}) cannot be less than minimum price ({service['min_price']})"
                )
    
    final_price = base_price - discount_amount
    
    operation_dict = operation_data.dict()
    operation_dict.update({
        "operation_no": operation_no,
        "date": datetime.now(timezone.utc),
        "service_name": service["name"],
        "base_price": base_price,
        "final_price": final_price,
        "agency_id": current_user.agency_id,
        "created_by": current_user.id,
        "status": OperationStatus.DRAFT if discount_amount > 0 else OperationStatus.PENDING_APPROVAL
    })
    
    operation = DailyOperation(**operation_dict)
    await db.daily_operations.insert_one(operation.dict())
    
    # If there's a discount, create discount request
    if discount_amount > 0:
        discount_request = DiscountRequest(
            operation_id=operation.id,
            original_price=base_price,
            discount_amount=discount_amount,
            discount_percentage=(discount_amount / base_price) * 100 if base_price > 0 else 0,
            reason=operation_data.discount_reason or "تخفيض على السعر",
            requested_by=current_user.id
        )
        await db.discount_requests.insert_one(discount_request.dict())
    
    return operation

@api_router.get("/daily-operations", response_model=List[DailyOperation])
async def get_daily_operations(
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    agency_id: Optional[str] = None,
    status: Optional[OperationStatus] = None,
    client_id: Optional[str] = None,
    client_name: Optional[str] = None,
    service_id: Optional[str] = None,
    service_name: Optional[str] = None,
    service_type: Optional[ServiceType] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    current_user: User = Depends(get_current_user)
):
    """Get daily operations with advanced filtering"""
    query_filter = {}
    
    # Role-based access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        if agency_id:
            query_filter["agency_id"] = agency_id
        # else: show all agencies
    else:
        query_filter["agency_id"] = current_user.agency_id
    
    # Date filters
    if date:
        try:
            filter_date = datetime.fromisoformat(date).date()
            query_filter["date"] = {
                "$gte": datetime.combine(filter_date, datetime.min.time()),
                "$lt": datetime.combine(filter_date + timedelta(days=1), datetime.min.time())
            }
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    elif start_date or end_date:
        date_filter = {}
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                date_filter["$gte"] = start_dt
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
                date_filter["$lte"] = end_dt
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        if date_filter:
            query_filter["date"] = date_filter
    
    # Additional filters
    if status:
        query_filter["status"] = status
    if client_id:
        query_filter["client_id"] = client_id
    if service_id:
        query_filter["service_id"] = service_id
    
    # Service name filter (contains search)
    if service_name:
        query_filter["service_name"] = {"$regex": service_name, "$options": "i"}
    
    # Amount range filtering  
    if min_amount is not None and max_amount is not None:
        query_filter["final_price"] = {"$gte": min_amount, "$lte": max_amount}
    elif min_amount is not None:
        query_filter["final_price"] = {"$gte": min_amount}
    elif max_amount is not None:
        query_filter["final_price"] = {"$lte": max_amount}
    
    # Get operations
    operations = await db.daily_operations.find(query_filter).sort("date", -1).to_list(1000)
    
    # Client name filtering (requires joining with clients collection)
    if client_name:
        # Get client IDs that match the name
        clients = await db.clients.find(
            {"name": {"$regex": client_name, "$options": "i"}}
        ).to_list(1000)
        client_ids = [client["id"] for client in clients]
        
        # Filter operations by matching client IDs
        operations = [op for op in operations if op.get("client_id") in client_ids]
    
    # Service type filtering (requires joining with services collection)
    if service_type:
        # Get service IDs that match the type
        services = await db.services.find({"service_type": service_type}).to_list(1000)
        service_ids = [service["id"] for service in services]
        
        # Filter operations by matching service IDs
        operations = [op for op in operations if op.get("service_id") in service_ids]
    
    return [DailyOperation(**operation) for operation in operations]

@api_router.put("/daily-operations/{operation_id}", response_model=DailyOperation)
async def update_daily_operation(
    operation_id: str, 
    operation_data: DailyOperationUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Update daily operation - allowed for staff if not yet approved, accountants can modify unapproved items"""
    operation = await db.daily_operations.find_one({"id": operation_id})
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    # Check agency access
    can_manage_agency_data(current_user, operation["agency_id"])
    
    # Check approval status permissions
    operation_status = operation.get("status", OperationStatus.DRAFT)
    
    if current_user.role == UserRole.AGENCY_STAFF:
        # Staff can only edit if status is DRAFT, PENDING_APPROVAL, or REJECTED
        if operation_status == OperationStatus.APPROVED:
            raise HTTPException(
                status_code=403, 
                detail="Cannot modify approved operation. Contact accountant for changes."
            )
    elif current_user.role in [UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        # Accountants and Super Admin can modify any operation but log the action for approved ones
        if operation_status == OperationStatus.APPROVED:
            # Log modification in audit trail
            await db.operation_modifications.insert_one({
                "operation_id": operation_id,
                "modified_by": current_user.id,
                "modified_at": datetime.now(timezone.utc),
                "original_data": operation,
                "changes": operation_data.dict(exclude_unset=True),
                "reason": "Post-approval modification by accountant"
            })
    
    # Update operation
    update_data = operation_data.dict(exclude_unset=True)
    if update_data:
        # Recalculate final price if discount changed
        if "discount_amount" in update_data:
            base_price = operation.get("base_price", 0)
            new_discount = update_data["discount_amount"]
            update_data["final_price"] = base_price - new_discount
        
        await db.daily_operations.update_one(
            {"id": operation_id}, 
            {"$set": update_data}
        )
    
    updated_operation = await db.daily_operations.find_one({"id": operation_id})
    return DailyOperation(**updated_operation)

@api_router.delete("/daily-operations/{operation_id}")
async def delete_daily_operation(operation_id: str, current_user: User = Depends(get_current_user)):
    """Delete daily operation - allowed for staff if not yet approved, accountants can delete any"""
    operation = await db.daily_operations.find_one({"id": operation_id})
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    # Check agency access
    can_manage_agency_data(current_user, operation["agency_id"])
    
    # Check approval status permissions
    operation_status = operation.get("status", OperationStatus.DRAFT)
    
    if current_user.role == UserRole.AGENCY_STAFF:
        # Staff can only delete if status is DRAFT, PENDING_APPROVAL, or REJECTED
        if operation_status == OperationStatus.APPROVED:
            raise HTTPException(
                status_code=403, 
                detail="Cannot delete approved operation. Contact accountant for deletion."
            )
    elif current_user.role in [UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        # Accountants and Super Admin can delete any operation but log the action
        if operation_status == OperationStatus.APPROVED:
            # Log the deletion for audit purposes
            await db.operation_deletions.insert_one({
                "operation_id": operation_id,
                "operation_data": operation,
                "deleted_by": current_user.id,
                "deleted_at": datetime.now(timezone.utc),
                "reason": "Post-approval deletion by accountant"
            })
    
    result = await db.daily_operations.delete_one({"id": operation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    return {"message": "Daily operation deleted successfully"}

@api_router.put("/daily-operations/{operation_id}/approve")
async def approve_operation(operation_id: str, current_user: User = Depends(get_current_user)):
    """Approve daily operation - General Manager and General Accountant only"""
    require_general_accountant_or_above(current_user)
    
    operation = await db.daily_operations.find_one({"id": operation_id})
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    # Check agency access for General Accountant
    if current_user.role == UserRole.GENERAL_ACCOUNTANT:
        if operation["agency_id"] != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Cannot approve operations of other agencies")
    
    # Update operation status
    await db.daily_operations.update_one(
        {"id": operation_id},
        {
            "$set": {
                "status": OperationStatus.APPROVED,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update discount request status if exists
    await db.discount_requests.update_one(
        {"operation_id": operation_id},
        {
            "$set": {
                "status": DiscountStatus.APPROVED,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Operation approved successfully"}

@api_router.put("/daily-operations/{operation_id}/reject")
async def reject_operation(
    operation_id: str, 
    rejection_reason: str = "",
    current_user: User = Depends(get_current_user)
):
    """Reject daily operation - General Manager and General Accountant only"""
    require_general_accountant_or_above(current_user)
    
    operation = await db.daily_operations.find_one({"id": operation_id})
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    # Check agency access for General Accountant
    if current_user.role == UserRole.GENERAL_ACCOUNTANT:
        if operation["agency_id"] != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Cannot reject operations of other agencies")
    
    # Update operation status
    await db.daily_operations.update_one(
        {"id": operation_id},
        {
            "$set": {
                "status": OperationStatus.REJECTED,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc),
                "rejected_reason": rejection_reason
            }
        }
    )
    
    # Update discount request status if exists
    await db.discount_requests.update_one(
        {"operation_id": operation_id},
        {
            "$set": {
                "status": DiscountStatus.REJECTED,
                "approved_by": current_user.id,
                "approved_at": datetime.now(timezone.utc),
                "rejection_reason": rejection_reason
            }
        }
    )
    
    return {"message": "Operation rejected successfully"}

# ================================
# DAILY OPERATIONS PAYMENTS ENDPOINTS
# ================================

@api_router.post("/daily-operations/{operation_id}/payments", response_model=Payment)
async def add_payment_to_operation(
    operation_id: str,
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user)
):
    """Add payment to a daily operation - Staff can add payments to their operations"""
    # Get the operation
    operation = await db.daily_operations.find_one({"id": operation_id})
    if not operation:
        raise HTTPException(status_code=404, detail="Daily operation not found")
    
    # Check agency access
    if operation["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Agency staff can only add payments to their own operations
    if current_user.role == UserRole.AGENCY_STAFF:
        if operation["created_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Can only add payments to your own operations")
    
    # Validate that payment doesn't exceed remaining amount
    existing_payments = await db.payments.find({"daily_operation_id": operation_id}).to_list(1000)
    total_paid = sum([p["amount"] for p in existing_payments])
    remaining_amount = operation["final_price"] - total_paid
    
    if payment_data.amount > remaining_amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Payment amount ({payment_data.amount}) exceeds remaining amount ({remaining_amount})"
        )
    
    # Generate payment number
    payments_count = await db.payments.count_documents({"agency_id": current_user.agency_id})
    payment_no = f"PAY-{current_user.agency_id[-4:]}-{payments_count + 1:04d}"
    
    # Create payment
    payment_dict = payment_data.dict()
    payment_dict["payment_no"] = payment_no
    payment_dict["daily_operation_id"] = operation_id
    payment_dict["invoice_id"] = None  # Clear invoice_id for operation payments
    payment_dict["agency_id"] = current_user.agency_id
    
    payment = Payment(**payment_dict)
    await db.payments.insert_one(payment.dict())
    
    return payment

@api_router.get("/daily-operations/{operation_id}/payments", response_model=List[Payment])
async def get_operation_payments(
    operation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all payments for a daily operation"""
    # Get the operation
    operation = await db.daily_operations.find_one({"id": operation_id})
    if not operation:
        raise HTTPException(status_code=404, detail="Daily operation not found")
    
    # Check agency access
    if operation["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get payments for this operation
    payments = await db.payments.find({"daily_operation_id": operation_id}).sort("payment_date", -1).to_list(1000)
    return [Payment(**payment) for payment in payments]

@api_router.get("/daily-operations/{operation_id}/payment-status")
async def get_operation_payment_status(
    operation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get payment status for a daily operation"""
    # Get the operation
    operation = await db.daily_operations.find_one({"id": operation_id})
    if not operation:
        raise HTTPException(status_code=404, detail="Daily operation not found")
    
    # Check agency access
    if operation["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get payments for this operation
    payments = await db.payments.find({"daily_operation_id": operation_id}).to_list(1000)
    
    total_paid = sum([p["amount"] for p in payments])
    total_amount = operation["final_price"]
    remaining_amount = total_amount - total_paid
    
    payment_status = "fully_paid" if remaining_amount <= 0 else "partially_paid" if total_paid > 0 else "unpaid"
    
    return {
        "operation_id": operation_id,
        "total_amount": total_amount,
        "total_paid": total_paid,
        "remaining_amount": remaining_amount,
        "payment_status": payment_status,
        "payments_count": len(payments)
    }

# Daily Operations Reports Routes
@api_router.get("/reports/daily-operations")
async def generate_daily_operations_report(
    start_date: str,
    end_date: str,
    agency_ids: Optional[str] = None,
    service_type: Optional[ServiceType] = None,
    status: Optional[OperationStatus] = None,
    group_by_agency: bool = True,
    group_by_service: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Generate comprehensive daily operations report"""
    try:
        # Parse dates
        try:
            if 'T' not in start_date and 'T' not in end_date:
                start = datetime.fromisoformat(start_date + 'T00:00:00')
                end = datetime.fromisoformat(end_date + 'T23:59:59')
            else:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            try:
                start = datetime.strptime(start_date[:10], '%Y-%m-%d')
                end = datetime.strptime(end_date[:10], '%Y-%m-%d')
                end = end.replace(hour=23, minute=59, second=59)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format")
        
        # Ensure timezone awareness
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        
        # Build query filter
        if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
            if agency_ids and agency_ids != "all":
                selected_agency_ids = [id.strip() for id in agency_ids.split(',')]
                query_filter = {"agency_id": {"$in": selected_agency_ids}}
            else:
                query_filter = {}
        else:
            query_filter = {"agency_id": current_user.agency_id}
            
        query_filter["date"] = {"$gte": start, "$lte": end}
        
        # Additional filters
        if status:
            query_filter["status"] = status
        if service_type:
            # Get services of the specified type
            services = await db.services.find({"service_type": service_type}).to_list(1000)
            service_ids = [service["id"] for service in services]
            query_filter["service_id"] = {"$in": service_ids}
        
        # Get operations
        operations = await db.daily_operations.find(query_filter).to_list(1000)
        
        # Get related data
        agencies = await db.agencies.find({}).to_list(100)
        agencies_dict = {agency["id"]: agency for agency in agencies}
        
        clients = await db.clients.find({}).to_list(1000)
        clients_dict = {client["id"]: client["name"] for client in clients}
        
        services = await db.services.find({}).to_list(1000)
        services_dict = {service["id"]: service for service in services}
        
        if group_by_agency:
            # Group by agency
            agency_data = {}
            grand_totals = {
                "operations_count": 0,
                "total_revenue": 0,
                "total_discounts": 0,
                "net_revenue": 0
            }
            
            for operation in operations:
                agency_id = operation["agency_id"]
                agency_info = agencies_dict.get(agency_id, {"name": "وكالة غير معروفة", "city": "غير محدد"})
                agency_name = f"{agency_info['name']} - {agency_info['city']}"
                
                if agency_name not in agency_data:
                    agency_data[agency_name] = {
                        "agency_id": agency_id,
                        "agency_name": agency_name,
                        "services": {} if group_by_service else [],
                        "totals": {
                            "operations_count": 0,
                            "total_revenue": 0,
                            "total_discounts": 0,
                            "net_revenue": 0
                        }
                    }
                
                service_info = services_dict.get(operation["service_id"], {"name": "خدمة محذوفة", "service_type": "غير محدد"})
                
                operation_data = {
                    "operation_no": operation["operation_no"],
                    "date": operation["date"].strftime("%Y-%m-%d"),
                    "client_name": clients_dict.get(operation["client_id"], "عميل غير معروف"),
                    "service_name": operation["service_name"],
                    "service_type": service_info["service_type"],
                    "base_price": operation["base_price"],
                    "discount_amount": operation["discount_amount"],
                    "final_price": operation["final_price"],
                    "status": operation["status"],
                    "notes": operation.get("notes", "")
                }
                
                if group_by_service:
                    service_name = operation["service_name"]
                    if service_name not in agency_data[agency_name]["services"]:
                        agency_data[agency_name]["services"][service_name] = {
                            "service_name": service_name,
                            "service_type": service_info["service_type"],
                            "operations": [],
                            "totals": {
                                "operations_count": 0,
                                "total_revenue": 0,
                                "total_discounts": 0,
                                "net_revenue": 0
                            }
                        }
                    
                    agency_data[agency_name]["services"][service_name]["operations"].append(operation_data)
                    agency_data[agency_name]["services"][service_name]["totals"]["operations_count"] += 1
                    agency_data[agency_name]["services"][service_name]["totals"]["total_revenue"] += operation["base_price"]
                    agency_data[agency_name]["services"][service_name]["totals"]["total_discounts"] += operation["discount_amount"]
                    agency_data[agency_name]["services"][service_name]["totals"]["net_revenue"] += operation["final_price"]
                else:
                    agency_data[agency_name]["services"].append(operation_data)
                
                # Update agency totals
                agency_data[agency_name]["totals"]["operations_count"] += 1
                agency_data[agency_name]["totals"]["total_revenue"] += operation["base_price"]
                agency_data[agency_name]["totals"]["total_discounts"] += operation["discount_amount"]
                agency_data[agency_name]["totals"]["net_revenue"] += operation["final_price"]
                
                # Update grand totals
                grand_totals["operations_count"] += 1
                grand_totals["total_revenue"] += operation["base_price"]
                grand_totals["total_discounts"] += operation["discount_amount"]
                grand_totals["net_revenue"] += operation["final_price"]
            
            # Convert services dict to list if grouped by service
            if group_by_service:
                for agency_name in agency_data:
                    services_list = list(agency_data[agency_name]["services"].values())
                    services_list.sort(key=lambda x: x["service_name"])
                    agency_data[agency_name]["services"] = services_list
            
            result_data = list(agency_data.values())
            result_data.sort(key=lambda x: x["agency_name"])
            
            return {
                "title": "تقرير العمليات اليومية الشامل - حسب الوكالة",
                "period": f"من {start_date} إلى {end_date}",
                "group_by_agency": True,
                "group_by_service": group_by_service,
                "agencies_data": result_data,
                "grand_totals": grand_totals,
                "filters": {
                    "service_type": service_type,
                    "status": status,
                    "agency_ids": agency_ids
                }
            }
        
        else:
            # Simple list without grouping
            operations_data = []
            totals = {
                "operations_count": len(operations),
                "total_revenue": 0,
                "total_discounts": 0,
                "net_revenue": 0
            }
            
            for operation in operations:
                service_info = services_dict.get(operation["service_id"], {"name": "خدمة محذوفة", "service_type": "غير محدد"})
                agency_info = agencies_dict.get(operation["agency_id"], {"name": "وكالة غير معروفة", "city": "غير محدد"})
                
                operations_data.append({
                    "operation_no": operation["operation_no"],
                    "date": operation["date"].strftime("%Y-%m-%d"),
                    "agency_name": f"{agency_info['name']} - {agency_info['city']}",
                    "client_name": clients_dict.get(operation["client_id"], "عميل غير معروف"),
                    "service_name": operation["service_name"],
                    "service_type": service_info["service_type"],
                    "base_price": operation["base_price"],
                    "discount_amount": operation["discount_amount"],
                    "final_price": operation["final_price"],
                    "status": operation["status"],
                    "notes": operation.get("notes", "")
                })
                
                totals["total_revenue"] += operation["base_price"]
                totals["total_discounts"] += operation["discount_amount"]
                totals["net_revenue"] += operation["final_price"]
            
            # Sort by date descending
            operations_data.sort(key=lambda x: x["date"], reverse=True)
            
            return {
                "title": "تقرير العمليات اليومية الشامل - قائمة مفصلة",
                "period": f"من {start_date} إلى {end_date}",
                "group_by_agency": False,
                "data": operations_data,
                "totals": totals,
                "filters": {
                    "service_type": service_type,
                    "status": status,
                    "agency_ids": agency_ids
                }
            }
            
    except Exception as e:
        print(f"Daily operations report error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error generating report: {str(e)}")

# PDF Generation Utilities

def fix_arabic_text(text):
    """Fix Arabic text for proper PDF display"""
    if not text:
        return ""
    
    if not ARABIC_SUPPORT:
        return str(text)
    
    try:
        # Convert to string if not already
        text_str = str(text)
        # Reshape Arabic text to connect letters properly
        reshaped_text = reshape(text_str)
        # Apply bidirectional algorithm for proper RTL display
        bidi_text = get_display(reshaped_text)
        return bidi_text
    except Exception as e:
        print(f"Arabic text processing error for '{text}': {e}")
        return str(text)  # Return original text if processing fails

def create_receipt_pdf(operation_data: dict, agency_data: dict, user_data: dict, client_data: dict, service_data: dict, payment_info: dict = None):
    """Generate professional and elegant PDF receipt for daily operations with Arabic support"""
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=40, bottomMargin=40)
        
        # Validate input data
        if not operation_data or not agency_data or not user_data:
            raise ValueError("Missing required data for PDF generation")
        
        # Set default values for missing data
        client_data = client_data or {}
        service_data = service_data or {}
        payment_info = payment_info or {}
        
        # Register Arabic font for PDF generation
        try:
            # Try to register Arabic font (DejaVu Sans supports Arabic)
            pdfmetrics.registerFont(TTFont('Arabic', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
            pdfmetrics.registerFont(TTFont('ArabicBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
            arabic_font = 'Arabic'
            arabic_bold_font = 'ArabicBold'
        except:
            try:
                # Fallback to default system font that might support Arabic
                pdfmetrics.registerFont(TTFont('Arabic', '/System/Library/Fonts/Arial.ttf'))
                arabic_font = 'Arabic'
                arabic_bold_font = 'Arabic'
            except:
                # Final fallback to Helvetica (will show garbled Arabic but won't crash)
                arabic_font = 'Helvetica'
                arabic_bold_font = 'Helvetica-Bold'
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define professional styles
        styles = getSampleStyleSheet()
        
        # ========== HEADER SECTION ==========
        # Agency Logo and Header
        header_table_data = []
        
        # Create header with logo (left) and agency info (right)
        if agency_data.get('logo_url') and False:  # Disable logo for now until we have actual logo files
            # If logo exists, create a two-column header
            agency_info_text = f"""
            <font size="18" color="darkblue"><b>{fix_arabic_text(agency_data['name'])}</b></font><br/>
            <font size="12" color="gray">{fix_arabic_text('وكالة الأسفار والسياحة')}</font><br/>
            <font size="10">{fix_arabic_text(agency_data.get('address', ''))}, {fix_arabic_text(agency_data.get('city', ''))}</font><br/>
            <font size="10">{fix_arabic_text('هاتف')}: {agency_data.get('phone', '')}</font>
            """
            
            header_table_data = [
                [Paragraph(agency_info_text, ParagraphStyle('HeaderInfo', 
                    parent=styles['Normal'], alignment=TA_RIGHT, fontName=arabic_font)),
                 Paragraph('LOGO', styles['Normal'])]  # Simple text placeholder instead of image
            ]
        else:
            # No logo - centered agency info
            agency_name = fix_arabic_text(agency_data.get('name', 'اسم الوكالة'))
            agency_address = fix_arabic_text(agency_data.get('address', ''))
            agency_city = fix_arabic_text(agency_data.get('city', ''))
            agency_phone = agency_data.get('phone', '')
            agency_email = agency_data.get('email', '')
            
            agency_title = f"""
            <font size="20" color="darkblue"><b>{agency_name}</b></font><br/>
            <font size="14" color="gray">{fix_arabic_text('وكالة الأسفار والسياحة')}</font><br/>
            <font size="11">{agency_address}, {agency_city}</font><br/>
            <font size="11">{fix_arabic_text('هاتف')}: {agency_phone} | {fix_arabic_text('إيميل')}: {agency_email}</font>
            """
            
            title_style = ParagraphStyle(
                'AgencyTitle',
                parent=styles['Normal'],
                fontSize=16,
                spaceAfter=20,
                alignment=TA_CENTER,
                fontName=arabic_font
            )
            
            elements.append(Paragraph(agency_title, title_style))
        
        if header_table_data:
            header_table = Table(header_table_data, colWidths=[4*inch, 2*inch])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'RIGHT'),
                ('ALIGN', (1, 0), (1, 0), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]))
            elements.append(header_table)
        
        # Decorative line
        elements.append(Spacer(1, 10))
        line_table = Table([['', '']], colWidths=[7*inch])
        line_table.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 3, colors.darkblue),
        ]))
        elements.append(line_table)
        elements.append(Spacer(1, 20))
        
        # Receipt Title
        receipt_title_style = ParagraphStyle(
            'ReceiptTitle',
            parent=styles['Normal'],
            fontSize=18,
            spaceAfter=15,
            alignment=TA_CENTER,
            textColor=colors.darkred,
            fontName=arabic_bold_font
        )
        
        elements.append(Paragraph(f"<b>{fix_arabic_text('وصل استلام')}</b>", receipt_title_style))
        
        # Receipt number and date box - RTL format
        receipt_info_style = ParagraphStyle(
            'ReceiptInfo',
            parent=styles['Normal'],
            fontSize=12,
            alignment=TA_CENTER,
            fontName=arabic_font
        )
        
        operation_no = operation_data.get('operation_no', 'غير محدد')
        operation_date = operation_data.get('date', datetime.now())
        if isinstance(operation_date, str):
            receipt_date = operation_date[:10]
        else:
            receipt_date = operation_date.strftime('%Y-%m-%d')
        
        # Create a simple table for receipt info
        receipt_info_table = [
            [receipt_date, fix_arabic_text('التاريخ:'), operation_no, fix_arabic_text('رقم الوصل:')]
        ]
        
        receipt_info_table_element = Table(receipt_info_table, colWidths=[1.5*inch, 1*inch, 1.5*inch, 1*inch])
        receipt_info_table_element.setStyle(TableStyle([
            ('BACKGROUND', (1, 0), (1, 0), colors.lightblue),
            ('BACKGROUND', (3, 0), (3, 0), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),   # Date value - left align
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),  # Date label - right align
            ('ALIGN', (2, 0), (2, 0), 'LEFT'),   # Receipt number value - left align
            ('ALIGN', (3, 0), (3, 0), 'RIGHT'),  # Receipt number label - right align
            ('FONTNAME', (0, 0), (-1, -1), arabic_font),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
        ]))
        
        elements.append(receipt_info_table_element)
        elements.append(Spacer(1, 25))
        
        # ========== CLIENT AND SERVICE INFORMATION ==========
        # Client Information Section
        client_section_title = ParagraphStyle(
            'SectionTitle',
            parent=styles['Normal'],
            fontSize=14,
            spaceAfter=8,
            alignment=TA_RIGHT,
            textColor=colors.darkblue,
            fontName=arabic_bold_font,
            backColor=colors.lightgrey,
            borderPadding=(5, 10, 5, 10)
        )
        
        elements.append(Paragraph(f"<b>{fix_arabic_text('معلومات العميل')}</b>", client_section_title))
        
        # Client details table
        client_name = fix_arabic_text(client_data.get('name', 'غير محدد'))
        client_phone = client_data.get('phone', 'غير محدد')
        
        # RTL table - Arabic labels on RIGHT, values on LEFT
        client_data_table = [
            [client_name, fix_arabic_text('اسم العميل:')],
            [client_phone, fix_arabic_text('رقم الهاتف:')],
        ]
        
        if client_data.get('email'):
            client_data_table.append([client_data.get('email'), fix_arabic_text('البريد الإلكتروني:')])
        
        client_table = Table(client_data_table, colWidths=[4*inch, 2*inch])
        client_table.setStyle(TableStyle([
            ('BACKGROUND', (1, 0), (1, -1), colors.lightblue),  # Right column (Arabic labels) background
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),   # Left column (values) align left
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),  # Right column (labels) align right
            ('FONTNAME', (0, 0), (-1, -1), arabic_font),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
        ]))
        
        elements.append(client_table)
        elements.append(Spacer(1, 20))
        
        # Service Information Section
        elements.append(Paragraph(f"<b>{fix_arabic_text('تفاصيل الخدمة')}</b>", client_section_title))
        
        # Service details table with enhanced styling - RTL format
        service_name = fix_arabic_text(operation_data.get('service_name', 'غير محدد'))
        base_price = operation_data.get('base_price', 0)
        discount_amount = operation_data.get('discount_amount', 0)
        final_price = operation_data.get('final_price', 0)
        status = fix_arabic_text(operation_data.get('status', 'غير محدد'))
        
        # RTL table - Arabic labels on RIGHT, values on LEFT
        service_data_table = [
            [service_name, fix_arabic_text('اسم الخدمة:')],
            [f"{base_price:,.0f} {fix_arabic_text('دج')}", fix_arabic_text('السعر الأساسي:')],
        ]
        
        if discount_amount > 0:
            service_data_table.append([f"-{discount_amount:,.0f} {fix_arabic_text('دج')}", fix_arabic_text('مبلغ التخفيض:')])
        
        service_data_table.extend([
            [f"<b>{final_price:,.0f} {fix_arabic_text('دج')}</b>", fix_arabic_text('المبلغ النهائي:')],
            [status, fix_arabic_text('حالة العملية:')],
        ])
        
        service_table = Table(service_data_table, colWidths=[4*inch, 2*inch])
        service_table.setStyle(TableStyle([
            ('BACKGROUND', (1, 0), (1, -1), colors.lightgreen),  # Right column (Arabic labels) background
            ('BACKGROUND', (1, -2), (1, -2), colors.gold),  # Highlight final amount label row
            ('BACKGROUND', (0, -2), (0, -2), colors.lightyellow),  # Highlight final amount value
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),   # Left column (values) align left
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),  # Right column (labels) align right
            ('FONTNAME', (0, 0), (-1, -1), arabic_font),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
        ]))
        
        elements.append(service_table)
        elements.append(Spacer(1, 20))
        
        # ========== PAYMENT INFORMATION ==========
        elements.append(Paragraph(f"<b>{fix_arabic_text('معلومات الدفع')}</b>", client_section_title))
        
        # Payment details with enhanced styling - RTL format
        payment_data_table = []
        
        if payment_info and payment_info.get('total_paid'):
            payment_method = payment_info.get('payment_method', 'cash')
            payment_method_ar = fix_arabic_text('نقدي') if payment_method == 'cash' else fix_arabic_text('بنكي')
            payment_status_ar = fix_arabic_text(payment_info.get('payment_status', 'غير محدد'))
            
            # RTL table - Arabic labels on RIGHT, values on LEFT
            payment_data_table = [
                [payment_method_ar, fix_arabic_text('طريقة الدفع:')],
                [f"{payment_info.get('total_paid', 0):,.0f} {fix_arabic_text('دج')}", fix_arabic_text('المبلغ المدفوع:')],
                [f"{payment_info.get('remaining_amount', 0):,.0f} {fix_arabic_text('دج')}", fix_arabic_text('المبلغ المتبقي:')],
                [payment_status_ar, fix_arabic_text('حالة الدفع:')],
                [str(payment_info.get('payments_count', 0)), fix_arabic_text('عدد الدفعات:')],
            ]
        else:
            # Default payment info - RTL format
            payment_data_table = [
                [fix_arabic_text('نقدي'), fix_arabic_text('طريقة الدفع:')],
                [f"0 {fix_arabic_text('دج')}", fix_arabic_text('المبلغ المدفوع:')],
                [f"{final_price:,.0f} {fix_arabic_text('دج')}", fix_arabic_text('المبلغ المتبقي:')],
                [fix_arabic_text('غير مدفوع'), fix_arabic_text('حالة الدفع:')],
            ]
        
        payment_table = Table(payment_data_table, colWidths=[4*inch, 2*inch])
        payment_table.setStyle(TableStyle([
            ('BACKGROUND', (1, 0), (1, -1), colors.lightyellow),  # Right column (Arabic labels) background
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),   # Left column (values) align left
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),  # Right column (labels) align right
            ('FONTNAME', (0, 0), (-1, -1), arabic_font),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
        ]))
        
        elements.append(payment_table)
        
        # Notes section (if any)
        if operation_data.get('notes'):
            elements.append(Spacer(1, 15))
            elements.append(Paragraph(f"<b>{fix_arabic_text('ملاحظات')}</b>", client_section_title))
            
            notes_style = ParagraphStyle(
                'Notes',
                parent=styles['Normal'],
                fontSize=10,
                alignment=TA_RIGHT,
                fontName=arabic_font,
                backColor=colors.lightgrey,
                borderPadding=(8, 8, 8, 8)
            )
            
            elements.append(Paragraph(fix_arabic_text(operation_data['notes']), notes_style))
        
        elements.append(Spacer(1, 30))
        
        # ========== SIGNATURE SECTION ==========
        # Create signature section with two columns
        user_name = fix_arabic_text(user_data.get('name', 'غير محدد'))
        user_job_title = fix_arabic_text(user_data.get('job_title', 'موظف'))
        current_datetime = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        signature_data = [
            [
                f"""<b>{fix_arabic_text('توقيع العميل')}</b><br/><br/>
                {fix_arabic_text('الاسم')}: ________________<br/>
                {fix_arabic_text('التوقيع')}: ________________<br/>
                {fix_arabic_text('التاريخ')}: ________________""",
                
                f"""<b>{fix_arabic_text('توقيع الموظف')}</b><br/><br/>
                {fix_arabic_text('الاسم')}: {user_name}<br/>
                {fix_arabic_text('المنصب')}: {user_job_title}<br/>
                {fix_arabic_text('التاريخ')}: {current_datetime}"""
            ]
        ]
        
        signature_table = Table(signature_data, colWidths=[3*inch, 3*inch])
        signature_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), arabic_font),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
        ]))
        
        elements.append(signature_table)
        elements.append(Spacer(1, 20))
        
        # ========== FOOTER SECTION ==========
        # Agency footer with registration details
        footer_info = ""
        if agency_data.get('tax_number'):
            footer_info += f"{fix_arabic_text('رقم التسجيل الضريبي')}: {agency_data['tax_number']} | "
        if agency_data.get('commercial_register'):
            footer_info += f"{fix_arabic_text('السجل التجاري')}: {agency_data['commercial_register']} | "
        if agency_data.get('website'):
            footer_info += f"{fix_arabic_text('الموقع الإلكتروني')}: {agency_data['website']}"
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            fontName=arabic_font,
            textColor=colors.grey
        )
        
        if footer_info:
            elements.append(Paragraph(footer_info, footer_style))
            elements.append(Spacer(1, 5))
        
        # Custom footer message
        if agency_data.get('footer_text'):
            elements.append(Paragraph(fix_arabic_text(agency_data['footer_text']), footer_style))
            elements.append(Spacer(1, 5))
        
        # Generation timestamp
        timestamp_style = ParagraphStyle(
            'Timestamp',
            parent=styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            fontName=arabic_font,
            textColor=colors.grey
        )
        
        elements.append(Paragraph(f"{fix_arabic_text('تم إنشاء هذا الوصل بتاريخ')}: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", timestamp_style))
        
        # Decorative bottom line
        elements.append(Spacer(1, 10))
        bottom_line_table = Table([['', '']], colWidths=[7*inch])
        bottom_line_table.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 2, colors.darkblue),
        ]))
        elements.append(bottom_line_table)
        
        # Build PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer and return it
        pdf_data = buffer.getvalue()
        buffer.close()
        
        return pdf_data
        
    except Exception as e:
        print(f"PDF generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return a simple error PDF or raise the exception
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
    """Generate professional and elegant PDF receipt for daily operations with Arabic support"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=40, bottomMargin=40)
    
    # Register Arabic font for PDF generation
    try:
        # Try to register Arabic font (DejaVu Sans supports Arabic)
        pdfmetrics.registerFont(TTFont('Arabic', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
        pdfmetrics.registerFont(TTFont('ArabicBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
        arabic_font = 'Arabic'
        arabic_bold_font = 'ArabicBold'
    except:
        try:
            # Fallback to default system font that might support Arabic
            pdfmetrics.registerFont(TTFont('Arabic', '/System/Library/Fonts/Arial.ttf'))
            arabic_font = 'Arabic'
            arabic_bold_font = 'Arabic'
        except:
            # Final fallback to Helvetica (will show garbled Arabic but won't crash)
            arabic_font = 'Helvetica'
            arabic_bold_font = 'Helvetica-Bold'
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define professional styles
    styles = getSampleStyleSheet()
    
    # ========== HEADER SECTION ==========
    # Agency Logo and Header
    header_table_data = []
    
    # Create header with logo (left) and agency info (right)
    if agency_data.get('logo_url') and False:  # Disable logo for now until we have actual logo files
        # If logo exists, create a two-column header
        agency_info_text = f"""
        <font size="18" color="darkblue"><b>{fix_arabic_text(agency_data['name'])}</b></font><br/>
        <font size="12" color="gray">{fix_arabic_text('وكالة الأسفار والسياحة')}</font><br/>
        <font size="10">{fix_arabic_text(agency_data.get('address', ''))}, {fix_arabic_text(agency_data.get('city', ''))}</font><br/>
        <font size="10">{fix_arabic_text('هاتف')}: {agency_data.get('phone', '')}</font>
        """
        
        header_table_data = [
            [Paragraph(agency_info_text, ParagraphStyle('HeaderInfo', 
                parent=styles['Normal'], alignment=TA_RIGHT, fontName=arabic_font)),
             Paragraph('LOGO', styles['Normal'])]  # Simple text placeholder instead of image
        ]
    else:
        # No logo - centered agency info
        agency_title = f"""
        <font size="20" color="darkblue"><b>{fix_arabic_text(agency_data['name'])}</b></font><br/>
        <font size="14" color="gray">{fix_arabic_text('وكالة الأسفار والسياحة')}</font><br/>
        <font size="11">{fix_arabic_text(agency_data.get('address', ''))}, {fix_arabic_text(agency_data.get('city', ''))}</font><br/>
        <font size="11">{fix_arabic_text('هاتف')}: {agency_data.get('phone', '')} | {fix_arabic_text('إيميل')}: {agency_data.get('email', '')}</font>
        """
        
        title_style = ParagraphStyle(
            'AgencyTitle',
            parent=styles['Normal'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName=arabic_font
        )
        
        elements.append(Paragraph(agency_title, title_style))
    
    if header_table_data:
        header_table = Table(header_table_data, colWidths=[4*inch, 2*inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'RIGHT'),
            ('ALIGN', (1, 0), (1, 0), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(header_table)
    
    # Decorative line
    elements.append(Spacer(1, 10))
    line_table = Table([['', '']], colWidths=[7*inch])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 3, colors.darkblue),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 20))
    
    # Receipt Title
    receipt_title_style = ParagraphStyle(
        'ReceiptTitle',
        parent=styles['Normal'],
        fontSize=18,
        spaceAfter=15,
        alignment=TA_CENTER,
        textColor=colors.darkred,
        fontName=arabic_bold_font
    )
    
    elements.append(Paragraph(f"<b>{fix_arabic_text('وصل استلام')}</b>", receipt_title_style))
    
    # Receipt number and date box
    receipt_info_style = ParagraphStyle(
        'ReceiptInfo',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_CENTER,
        fontName=arabic_font
    )
    
    receipt_date = operation_data['date'][:10] if isinstance(operation_data['date'], str) else operation_data['date'].strftime('%Y-%m-%d')
    receipt_info = f"{fix_arabic_text('رقم الوصل')}: <b>{operation_data['operation_no']}</b> | {fix_arabic_text('التاريخ')}: <b>{receipt_date}</b>"
    
    elements.append(Paragraph(receipt_info, receipt_info_style))
    elements.append(Spacer(1, 25))
    
    # ========== CLIENT AND SERVICE INFORMATION ==========
    # Client Information Section
    client_section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontSize=14,
        spaceAfter=8,
        alignment=TA_RIGHT,
        textColor=colors.darkblue,
        fontName=arabic_bold_font,
        backColor=colors.lightgrey,
        borderPadding=(5, 10, 5, 10)
    )
    
    elements.append(Paragraph(f"<b>{fix_arabic_text('معلومات العميل')}</b>", client_section_title))
    
    # Client details table
    client_data_table = [
        [fix_arabic_text('اسم العميل:'), fix_arabic_text(client_data.get('name', 'غير محدد'))],
        [fix_arabic_text('رقم الهاتف:'), client_data.get('phone', 'غير محدد')],
    ]
    
    if client_data.get('email'):
        client_data_table.append([fix_arabic_text('البريد الإلكتروني:'), client_data.get('email')])
    
    client_table = Table(client_data_table, colWidths=[2*inch, 4*inch])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), arabic_font),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
    ]))
    
    elements.append(client_table)
    elements.append(Spacer(1, 20))
    
    # Service Information Section
    elements.append(Paragraph(f"<b>{fix_arabic_text('تفاصيل الخدمة')}</b>", client_section_title))
    
    # Service details table with enhanced styling
    service_data_table = [
        [fix_arabic_text('اسم الخدمة:'), fix_arabic_text(operation_data['service_name'])],
        [fix_arabic_text('السعر الأساسي:'), f"{operation_data['base_price']:,.0f} {fix_arabic_text('دج')}"],
    ]
    
    if operation_data.get('discount_amount', 0) > 0:
        service_data_table.append([fix_arabic_text('مبلغ التخفيض:'), f"-{operation_data.get('discount_amount', 0):,.0f} {fix_arabic_text('دج')}"])
    
    service_data_table.extend([
        [fix_arabic_text('المبلغ النهائي:'), f"<b>{operation_data['final_price']:,.0f} {fix_arabic_text('دج')}</b>"],
        [fix_arabic_text('حالة العملية:'), fix_arabic_text(operation_data.get('status', 'غير محدد'))],
    ])
    
    service_table = Table(service_data_table, colWidths=[2*inch, 4*inch])
    service_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgreen),
        ('BACKGROUND', (0, -2), (0, -2), colors.gold),  # Highlight final amount row
        ('BACKGROUND', (1, -2), (1, -2), colors.lightyellow),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), arabic_font),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
    ]))
    
    elements.append(service_table)
    elements.append(Spacer(1, 20))
    
    # ========== PAYMENT INFORMATION ==========
    elements.append(Paragraph(f"<b>{fix_arabic_text('معلومات الدفع')}</b>", client_section_title))
    
    # Payment details with enhanced styling
    payment_data_table = []
    
    if payment_info:
        payment_method_ar = fix_arabic_text('نقدي') if payment_info.get('payment_method') == 'cash' else fix_arabic_text('بنكي')
        payment_status_ar = fix_arabic_text(payment_info.get('payment_status', 'غير محدد'))
        
        payment_data_table = [
            [fix_arabic_text('طريقة الدفع:'), payment_method_ar],
            [fix_arabic_text('المبلغ المدفوع:'), f"{payment_info.get('total_paid', 0):,.0f} {fix_arabic_text('دج')}"],
            [fix_arabic_text('المبلغ المتبقي:'), f"{payment_info.get('remaining_amount', 0):,.0f} {fix_arabic_text('دج')}"],
            [fix_arabic_text('حالة الدفع:'), payment_status_ar],
            [fix_arabic_text('عدد الدفعات:'), str(payment_info.get('payments_count', 0))],
        ]
    else:
        # Default payment info
        payment_data_table = [
            [fix_arabic_text('طريقة الدفع:'), fix_arabic_text('نقدي')],
            [fix_arabic_text('المبلغ المدفوع:'), f"0 {fix_arabic_text('دج')}"],
            [fix_arabic_text('المبلغ المتبقي:'), f"{operation_data['final_price']:,.0f} {fix_arabic_text('دج')}"],
            [fix_arabic_text('حالة الدفع:'), fix_arabic_text('غير مدفوع')],
        ]
    
    payment_table = Table(payment_data_table, colWidths=[2*inch, 4*inch])
    payment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightyellow),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), arabic_font),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
    ]))
    
    elements.append(payment_table)
    
    # Notes section (if any)
    if operation_data.get('notes'):
        elements.append(Spacer(1, 15))
        elements.append(Paragraph(f"<b>{fix_arabic_text('ملاحظات')}</b>", client_section_title))
        
        notes_style = ParagraphStyle(
            'Notes',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_RIGHT,
            fontName=arabic_font,
            backColor=colors.lightgrey,
            borderPadding=(8, 8, 8, 8)
        )
        
        elements.append(Paragraph(fix_arabic_text(operation_data['notes']), notes_style))
    
    elements.append(Spacer(1, 30))
    
    # ========== SIGNATURE SECTION ==========
    # Create signature section with two columns
    signature_data = [
        [
            f"""<b>{fix_arabic_text('توقيع العميل')}</b><br/><br/>
            {fix_arabic_text('الاسم')}: ________________<br/>
            {fix_arabic_text('التوقيع')}: ________________<br/>
            {fix_arabic_text('التاريخ')}: ________________""",
            
            f"""<b>{fix_arabic_text('توقيع الموظف')}</b><br/><br/>
            {fix_arabic_text('الاسم')}: {fix_arabic_text(user_data['name'])}<br/>
            {fix_arabic_text('المنصب')}: {fix_arabic_text(user_data.get('job_title', 'موظف'))}<br/>
            {fix_arabic_text('التاريخ')}: {datetime.now().strftime('%Y-%m-%d %H:%M')}"""
        ]
    ]
    
    signature_table = Table(signature_data, colWidths=[3*inch, 3*inch])
    signature_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), arabic_font),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.darkblue)
    ]))
    
    elements.append(signature_table)
    elements.append(Spacer(1, 20))
    
    # ========== FOOTER SECTION ==========
    # Agency footer with registration details
    footer_info = ""
    if agency_data.get('tax_number'):
        footer_info += f"{fix_arabic_text('رقم التسجيل الضريبي')}: {agency_data['tax_number']} | "
    if agency_data.get('commercial_register'):
        footer_info += f"{fix_arabic_text('السجل التجاري')}: {agency_data['commercial_register']} | "
    if agency_data.get('website'):
        footer_info += f"{fix_arabic_text('الموقع الإلكتروني')}: {agency_data['website']}"
    
    if footer_info:
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            fontName=arabic_font,
            textColor=colors.grey
        )
        elements.append(Paragraph(footer_info, footer_style))
        elements.append(Spacer(1, 5))
    
    # Custom footer message
    if agency_data.get('footer_text'):
        elements.append(Paragraph(fix_arabic_text(agency_data['footer_text']), footer_style))
        elements.append(Spacer(1, 5))
    
    # Generation timestamp
    timestamp_style = ParagraphStyle(
        'Timestamp',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        fontName=arabic_font,
        textColor=colors.grey
    )
    
    elements.append(Paragraph(f"{fix_arabic_text('تم إنشاء هذا الوصل بتاريخ')}: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", timestamp_style))
    
    # Decorative bottom line
    elements.append(Spacer(1, 10))
    bottom_line_table = Table([['', '']], colWidths=[7*inch])
    bottom_line_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 2, colors.darkblue),
    ]))
    elements.append(bottom_line_table)
    
    # Build PDF
    doc.build(elements)
    
    # Get the value of the BytesIO buffer and return it
    pdf_data = buffer.getvalue()
    buffer.close()
    
    return pdf_data

def create_operations_report_pdf(report_data: dict, agencies_data: List[dict], current_user: dict):
    """Generate professional PDF report for daily operations with Arabic support"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles for better Arabic display
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontSize=18,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.darkblue,
        fontName='Helvetica-Bold'
    )
    
    header_style = ParagraphStyle(
        'ReportHeader',
        parent=styles['Normal'],
        fontSize=14,
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        textColor=colors.darkgreen
    )
    
    normal_style = ParagraphStyle(
        'ReportNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_RIGHT,
        fontName='Helvetica'
    )
    
    # Report header
    elements.append(Paragraph("🏢 نظام إدارة الوكالات السياحية", title_style))
    elements.append(Paragraph("📊 تقرير العمليات اليومية المفصل", header_style))
    elements.append(Spacer(1, 15))
    
    # Report period
    elements.append(Paragraph(f"📅 فترة التقرير: {report_data['period']}", normal_style))
    elements.append(Paragraph(f"👤 تم إنشاء التقرير بواسطة: {current_user['name']}", normal_style))
    elements.append(Paragraph(f"⏰ تاريخ الإنشاء: {datetime.now().strftime('%Y-%m-%d %H:%M')}", normal_style))
    elements.append(Spacer(1, 20))
    
    # Summary table
    if 'grand_totals' in report_data:
        totals = report_data['grand_totals']
        
        # Create summary table
        summary_data = [
            ['البيان', 'القيمة'],
            [f'عدد العمليات الإجمالي', f"{totals.get('operations_count', 0)}"],
            [f'الإيرادات الإجمالية', f"{totals.get('total_revenue', 0):,.0f} دج"],
            [f'إجمالي التخفيضات', f"{totals.get('total_discounts', 0):,.0f} دج"],
            [f'صافي الإيرادات', f"{totals.get('net_revenue', 0):,.0f} دج"]
        ]
        
        summary_table = Table(summary_data, colWidths=[300, 150])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.darkblue),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        
        elements.append(Paragraph("📈 ملخص التقرير", header_style))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))
    
    # Agencies details if available
    if 'agencies_data' in report_data and report_data['agencies_data']:
        elements.append(Paragraph("🏢 تفاصيل الوكالات", header_style))
        elements.append(Spacer(1, 10))
        
        for agency in report_data['agencies_data']:
            agency_name = agency.get('agency_name', 'وكالة غير محددة')
            agency_totals = agency.get('totals', {})
            
            # Agency header
            elements.append(Paragraph(f"▶ {agency_name}", ParagraphStyle(
                'AgencyHeader',
                parent=styles['Normal'],
                fontSize=12,
                spaceAfter=8,
                textColor=colors.darkred,
                fontName='Helvetica-Bold'
            )))
            
            # Agency summary
            agency_summary = f"""
            • عدد العمليات: {agency_totals.get('operations_count', 0)}
            • إجمالي الإيرادات: {agency_totals.get('total_revenue', 0):,.0f} دج
            • إجمالي التخفيضات: {agency_totals.get('total_discounts', 0):,.0f} دج
            • صافي الإيرادات: {agency_totals.get('net_revenue', 0):,.0f} دج
            """
            
            elements.append(Paragraph(agency_summary, normal_style))
            elements.append(Spacer(1, 15))
    
    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("═" * 50, ParagraphStyle(
        'Separator',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.grey
    )))
    elements.append(Paragraph("تم إنشاء هذا التقرير بواسطة نظام إدارة الوكالات السياحية", ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )))
    
    # Build PDF
    try:
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
    except Exception as e:
        print(f"Error building PDF: {e}")
        # Return simple text-based PDF as fallback
        return create_simple_text_pdf(report_data, current_user)
def create_simple_text_pdf(report_data: dict, current_user: dict):
    """Fallback simple PDF generator"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    normal_style = styles['Normal']
    normal_style.alignment = TA_RIGHT
    
    # Simple content
    content = f"""
    نظام إدارة الوكالات السياحية
    
    تقرير العمليات اليومية
    
    فترة التقرير: {report_data.get('period', '')}
    تم إنشاء التقرير بواسطة: {current_user.get('name', '')}
    تاريخ الإنشاء: {datetime.now().strftime('%Y-%m-%d %H:%M')}
    
    ملخص النتائج:
    """
    
    if 'grand_totals' in report_data:
        totals = report_data['grand_totals']
        content += f"""
        عدد العمليات الإجمالي: {totals.get('operations_count', 0)}
        الإيرادات الإجمالية: {totals.get('total_revenue', 0):,.0f} دج
        إجمالي التخفيضات: {totals.get('total_discounts', 0):,.0f} دج
        صافي الإيرادات: {totals.get('net_revenue', 0):,.0f} دج
        """
    
    elements.append(Paragraph(content, normal_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

# PDF Generation Endpoints
@api_router.get("/daily-operations/{operation_id}/print")
async def print_operation_receipt(operation_id: str, current_user: User = Depends(get_current_user)):
    """Generate and return PDF receipt for a daily operation"""
    try:
        # Get operation details
        operation = await db.daily_operations.find_one({"id": operation_id})
        if not operation:
            raise HTTPException(status_code=404, detail="Operation not found")
        
        # Check permissions
        if current_user.role == UserRole.AGENCY_STAFF:
            if operation["agency_id"] != current_user.agency_id:
                raise HTTPException(status_code=403, detail="Cannot access operations of other agencies")
        
        # Get related data
        agency = await db.agencies.find_one({"id": operation["agency_id"]})
        client = await db.clients.find_one({"id": operation["client_id"]})
        service = await db.services.find_one({"id": operation["service_id"]})
        user = await db.users.find_one({"id": operation["created_by"]})
        
        if not agency:
            raise HTTPException(status_code=404, detail="Agency not found")
        
        # NEW: Get real payment data for the receipt
        payments = await db.payments.find({"daily_operation_id": operation_id}).to_list(1000)
        total_paid = sum([p["amount"] for p in payments])
        remaining_amount = operation["final_price"] - total_paid
        
        # Determine payment status
        if remaining_amount <= 0:
            payment_status = "مدفوع كاملاً"
        elif total_paid > 0:
            payment_status = "دفعة جزئية"
        else:
            payment_status = "غير مدفوع"
        
        # Determine payment method from last payment
        payment_method = "نقدي"  # default
        if payments:
            last_payment = payments[-1]  # Most recent payment
            payment_methods = {
                'cash': 'نقدي',
                'check': 'شيك',
                'bank_transfer': 'تحويل بنكي',
                'credit_card': 'بطاقة ائتمان'
            }
            payment_method = payment_methods.get(last_payment.get("method"), "نقدي")
        
        # Create payment info dictionary
        payment_info = {
            "total_paid": total_paid,
            "remaining_amount": remaining_amount,
            "payment_status": payment_status,
            "payment_method": payment_method,
            "payments_count": len(payments)
        }
        
        # Generate PDF with real payment data
        pdf_data = create_receipt_pdf(operation, agency, user or {}, client or {}, service or {}, payment_info)
        
        # Return PDF response
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=receipt_{operation['operation_no']}.pdf"}
        )
        
    except Exception as e:
        print(f"Print receipt error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error generating receipt: {str(e)}")

@api_router.get("/reports/daily-operations/print")
async def print_daily_operations_report(
    start_date: str,
    end_date: str,
    agency_ids: Optional[str] = None,
    service_type: Optional[ServiceType] = None,
    status: Optional[OperationStatus] = None,
    group_by_agency: bool = True,
    current_user: User = Depends(get_current_user)
):
    """Generate and return PDF report for daily operations"""
    try:
        # Generate report data (reuse existing logic)
        report_params = {
            'start_date': start_date,
            'end_date': end_date,
            'agency_ids': agency_ids,
            'service_type': service_type,
            'status': status,
            'group_by_agency': group_by_agency,
            'group_by_service': False
        }
        
        # Get report data using existing function logic
        # Parse dates
        try:
            if 'T' not in start_date and 'T' not in end_date:
                start = datetime.fromisoformat(start_date + 'T00:00:00')
                end = datetime.fromisoformat(end_date + 'T23:59:59')
            else:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            try:
                start = datetime.strptime(start_date[:10], '%Y-%m-%d')
                end = datetime.strptime(end_date[:10], '%Y-%m-%d')
                end = end.replace(hour=23, minute=59, second=59)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format")
        
        # Ensure timezone awareness
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        
        # Build query filter
        if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
            if agency_ids and agency_ids != "all":
                selected_agency_ids = [id.strip() for id in agency_ids.split(',')]
                query_filter = {"agency_id": {"$in": selected_agency_ids}}
            else:
                query_filter = {}
        else:
            query_filter = {"agency_id": current_user.agency_id}
            
        query_filter["date"] = {"$gte": start, "$lte": end}
        
        # Additional filters
        if status:
            query_filter["status"] = status
        if service_type:
            services = await db.services.find({"service_type": service_type}).to_list(1000)
            service_ids = [service["id"] for service in services]
            query_filter["service_id"] = {"$in": service_ids}
        
        # Get operations
        operations = await db.daily_operations.find(query_filter).to_list(1000)
        
        # Get agencies data
        agencies = await db.agencies.find({}).to_list(100)
        agencies_dict = {agency["id"]: agency for agency in agencies}
        
        # Build report data structure
        if group_by_agency:
            agency_data = {}
            grand_totals = {
                "operations_count": 0,
                "total_revenue": 0,
                "total_discounts": 0,
                "net_revenue": 0
            }
            
            for operation in operations:
                agency_id = operation["agency_id"]
                agency_info = agencies_dict.get(agency_id, {"name": "وكالة غير معروفة", "city": "غير محدد"})
                agency_name = f"{agency_info['name']} - {agency_info['city']}"
                
                if agency_name not in agency_data:
                    agency_data[agency_name] = {
                        "agency_id": agency_id,
                        "agency_name": agency_name,
                        "totals": {
                            "operations_count": 0,
                            "total_revenue": 0,
                            "total_discounts": 0,
                            "net_revenue": 0
                        }
                    }
                
                # Update agency totals
                agency_data[agency_name]["totals"]["operations_count"] += 1
                agency_data[agency_name]["totals"]["total_revenue"] += operation["base_price"]
                agency_data[agency_name]["totals"]["total_discounts"] += operation["discount_amount"]
                agency_data[agency_name]["totals"]["net_revenue"] += operation["final_price"]
                
                # Update grand totals
                grand_totals["operations_count"] += 1
                grand_totals["total_revenue"] += operation["base_price"]
                grand_totals["total_discounts"] += operation["discount_amount"]
                grand_totals["net_revenue"] += operation["final_price"]
            
            report_data = {
                "title": "تقرير العمليات اليومية الشامل - حسب الوكالة",
                "period": f"من {start_date} إلى {end_date}",
                "agencies_data": list(agency_data.values()),
                "grand_totals": grand_totals
            }
        else:
            # Simple totals without grouping
            totals = {
                "operations_count": len(operations),
                "total_revenue": sum(op["base_price"] for op in operations),
                "total_discounts": sum(op["discount_amount"] for op in operations),
                "net_revenue": sum(op["final_price"] for op in operations)
            }
            
            report_data = {
                "title": "تقرير العمليات اليومية الشامل",
                "period": f"من {start_date} إلى {end_date}",
                "grand_totals": totals
            }
        
        # Generate PDF
        agencies_list = list(agencies_dict.values())
        pdf_data = create_operations_report_pdf(report_data, agencies_list, current_user.dict())
        
        # Return PDF response
        filename = f"daily_operations_report_{start_date}_{end_date}.pdf"
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        print(f"Print report error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error generating report: {str(e)}")

# Discount Requests Routes
@api_router.get("/discount-requests")
async def get_discount_requests(
    status: Optional[DiscountStatus] = None,
    agency_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get discount requests - for approval by General Manager/General Accountant"""
    require_general_accountant_or_above(current_user)
    
    query_filter = {}
    
    # Role-based access
    if current_user.role == UserRole.GENERAL_ACCOUNTANT:
        # Get operations from their agency only
        operations = await db.daily_operations.find({"agency_id": current_user.agency_id}).to_list(1000)
        operation_ids = [op["id"] for op in operations]
        query_filter["operation_id"] = {"$in": operation_ids}
    elif agency_id:
        # Super admin can filter by agency
        operations = await db.daily_operations.find({"agency_id": agency_id}).to_list(1000)
        operation_ids = [op["id"] for op in operations]
        query_filter["operation_id"] = {"$in": operation_ids}
    
    if status:
        query_filter["status"] = status
    
    discount_requests = await db.discount_requests.find(query_filter).sort("created_at", -1).to_list(1000)
    
    # Enrich with operation and user details
    operations = await db.daily_operations.find({}).to_list(1000)
    operations_dict = {op["id"]: op for op in operations}
    
    users = await db.users.find({}).to_list(1000)
    users_dict = {user["id"]: user["name"] for user in users}
    
    result = []
    for req in discount_requests:
        operation = operations_dict.get(req["operation_id"])
        if operation:
            # Clean request data to avoid MongoDB ObjectId serialization issues
            clean_req = {
                "id": req["id"],
                "operation_id": req["operation_id"],
                "original_price": req["original_price"],
                "discount_amount": req["discount_amount"],
                "discount_percentage": req["discount_percentage"],
                "reason": req["reason"],
                "requested_by": req["requested_by"],
                "status": req["status"],
                "approved_by": req.get("approved_by"),
                "approved_at": req.get("approved_at").isoformat() if req.get("approved_at") else None,
                "rejection_reason": req.get("rejection_reason"),
                "created_at": req["created_at"].isoformat() if req.get("created_at") else None,
                "operation_no": operation["operation_no"],
                "service_name": operation["service_name"],
                "client_id": operation["client_id"],
                "requested_by_name": users_dict.get(req["requested_by"], "غير معروف"),
                "approved_by_name": users_dict.get(req.get("approved_by"), "") if req.get("approved_by") else ""
            }
            result.append(clean_req)
    
    return result

# ================================
# SERVICE CASH FLOW ENDPOINTS
# ================================

@api_router.post("/service-sales", response_model=ServiceSale)
async def record_service_sale(sale_data: ServiceSaleCreate, current_user: User = Depends(get_current_user)):
    """الموظف يسجل عملية بيع خدمة"""
    # Only Agency Staff and higher can record sales
    if current_user.role not in [UserRole.AGENCY_STAFF, UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to record service sales")
    
    sale_dict = sale_data.dict()
    sale_dict["agency_id"] = current_user.agency_id
    sale_dict["sold_by"] = current_user.id
    sale_dict["status"] = ServiceSaleStatus.SOLD
    
    service_sale = ServiceSale(**sale_dict)
    await db.service_sales.insert_one(service_sale.dict())
    
    return service_sale

@api_router.get("/service-sales", response_model=List[ServiceSale])
async def get_service_sales(
    status: Optional[ServiceSaleStatus] = None,
    sold_by: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get service sales with filtering"""
    query_filter = {}
    
    # Role-based access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        # Super Admin and General Accountant can see all sales in their scope
        if current_user.role == UserRole.GENERAL_ACCOUNTANT:
            query_filter["agency_id"] = current_user.agency_id
        # Super Admin sees all agencies
    else:
        # Agency Staff only see their own sales
        query_filter["agency_id"] = current_user.agency_id
        query_filter["sold_by"] = current_user.id
    
    # Apply filters
    if status:
        query_filter["status"] = status
    if sold_by and current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        query_filter["sold_by"] = sold_by
    
    # Date range filtering
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query_filter["created_at"] = {"$gte": start_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            if "created_at" in query_filter:
                query_filter["created_at"]["$lte"] = end_dt
            else:
                query_filter["created_at"] = {"$lte": end_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    sales = await db.service_sales.find(query_filter).sort("created_at", -1).to_list(1000)
    return [ServiceSale(**sale) for sale in sales]

@api_router.put("/service-sales/{sale_id}/deliver-cash")
async def deliver_cash_to_accountant(sale_id: str, current_user: User = Depends(get_current_user)):
    """الموظف يعلّم أنه سلّم الكاش للمحاسب"""
    sale = await db.service_sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Service sale not found")
    
    # Check if user is the one who sold or has higher privileges
    if sale["sold_by"] != current_user.id and current_user.role not in [UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Can only mark your own sales as delivered")
    
    # Check agency access
    if sale["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Can only deliver cash if status is 'sold'
    if sale["status"] != ServiceSaleStatus.SOLD:
        raise HTTPException(status_code=400, detail="Can only deliver cash for sold items")
    
    # Update status to pending_cash
    await db.service_sales.update_one(
        {"id": sale_id},
        {
            "$set": {
                "status": ServiceSaleStatus.PENDING_CASH,
                "cash_delivered_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Cash delivery marked successfully"}

@api_router.put("/service-sales/{sale_id}/confirm-cash")
async def confirm_cash_received(sale_id: str, current_user: User = Depends(get_current_user)):
    """المحاسب يؤكد استلام الكاش"""
    # Only General Accountant and Super Admin can confirm cash receipt
    if current_user.role not in [UserRole.GENERAL_ACCOUNTANT, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only accountants can confirm cash receipt")
    
    sale = await db.service_sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Service sale not found")
    
    # Check agency access for General Accountant
    if current_user.role == UserRole.GENERAL_ACCOUNTANT and sale["agency_id"] != current_user.agency_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Can only confirm cash if status is 'pending_cash'
    if sale["status"] != ServiceSaleStatus.PENDING_CASH:
        raise HTTPException(status_code=400, detail="Can only confirm cash for pending deliveries")
    
    # Update status to cash_received
    await db.service_sales.update_one(
        {"id": sale_id},
        {
            "$set": {
                "status": ServiceSaleStatus.CASH_RECEIVED,
                "confirmed_by": current_user.id,
                "cash_received_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Create journal entry (simplified ledger entry)
    journal_entry = JournalEntry(
        date=datetime.now(timezone.utc),
        account_code="1000",  # Cash account
        debit=sale["amount"],
        credit=0.0,
        reference=f"Service sale cash receipt - {sale['service_name']}",
        agency_id=sale["agency_id"]
    )
    
    await db.journal_entries.insert_one(journal_entry.dict())
    
    # Create corresponding credit entry for service revenue
    revenue_entry = JournalEntry(
        date=datetime.now(timezone.utc),
        account_code="4000",  # Service Revenue account
        debit=0.0,
        credit=sale["amount"],
        reference=f"Service sale revenue - {sale['service_name']}",
        agency_id=sale["agency_id"]
    )
    
    await db.journal_entries.insert_one(revenue_entry.dict())
    
    return {"message": "Cash receipt confirmed and journal entries created"}

@api_router.get("/reports/service-cash-reconciliation")
async def service_cash_reconciliation_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    agency_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """تقرير يوضح المبيعات والكاش المسلم والمؤكد"""
    query_filter = {}
    
    # Role-based access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        if current_user.role == UserRole.GENERAL_ACCOUNTANT:
            query_filter["agency_id"] = current_user.agency_id
        elif agency_id:  # Super Admin can filter by agency
            query_filter["agency_id"] = agency_id
    else:
        # Agency Staff only see their own sales
        query_filter["agency_id"] = current_user.agency_id
        query_filter["sold_by"] = current_user.id
    
    # Date range filtering
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query_filter["created_at"] = {"$gte": start_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            if "created_at" in query_filter:
                query_filter["created_at"]["$lte"] = end_dt
            else:
                query_filter["created_at"] = {"$lte": end_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    # Get all service sales
    sales = await db.service_sales.find(query_filter).to_list(1000)
    
    # Get user information for grouping
    user_ids = list(set([sale["sold_by"] for sale in sales]))
    users = await db.users.find({"id": {"$in": user_ids}}).to_list(1000)
    user_map = {user["id"]: user for user in users}
    
    # Group by sold_by
    report_data = {}
    
    for sale in sales:
        sold_by = sale["sold_by"]
        user_name = user_map.get(sold_by, {}).get("name", "Unknown User")
        
        if sold_by not in report_data:
            report_data[sold_by] = {
                "user_name": user_name,
                "total_sales": 0.0,
                "total_pending": 0.0,
                "total_received": 0.0,
                "sales_count": 0,
                "pending_count": 0,
                "received_count": 0
            }
        
        amount = sale["amount"]
        status = sale["status"]
        
        if status == ServiceSaleStatus.SOLD:
            report_data[sold_by]["total_sales"] += amount
            report_data[sold_by]["sales_count"] += 1
        elif status == ServiceSaleStatus.PENDING_CASH:
            report_data[sold_by]["total_pending"] += amount
            report_data[sold_by]["pending_count"] += 1
        elif status == ServiceSaleStatus.CASH_RECEIVED:
            report_data[sold_by]["total_received"] += amount
            report_data[sold_by]["received_count"] += 1
    
    # Calculate totals
    grand_totals = {
        "total_sales": sum([data["total_sales"] for data in report_data.values()]),
        "total_pending": sum([data["total_pending"] for data in report_data.values()]),
        "total_received": sum([data["total_received"] for data in report_data.values()]),
        "sales_count": sum([data["sales_count"] for data in report_data.values()]),
        "pending_count": sum([data["pending_count"] for data in report_data.values()]),
        "received_count": sum([data["received_count"] for data in report_data.values()])
    }
    
    return {
        "report_data": report_data,
        "grand_totals": grand_totals,
        "period": {
            "start_date": start_date,
            "end_date": end_date
        }
    }

# ================================
# SERVICE INSTALLMENTS ENDPOINTS
# ================================

@api_router.post("/service-sales/{sale_id}/installment-plan", response_model=InstallmentPlan)
async def create_installment_plan(
    sale_id: str,
    plan_data: InstallmentPlanCreate,
    current_user: User = Depends(get_current_user)
):
    """Create installment plan for a service sale"""
    # Get the service sale
    sale = await db.service_sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Service sale not found")
    
    # Check agency access
    if sale["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if installment plan already exists
    existing_plan = await db.installment_plans.find_one({"service_sale_id": sale_id, "status": {"$ne": InstallmentPlanStatus.CANCELLED}})
    if existing_plan:
        raise HTTPException(status_code=400, detail="Active installment plan already exists for this sale")
    
    # Validate installment dates
    if len(plan_data.installment_dates) != plan_data.number_of_installments:
        raise HTTPException(status_code=400, detail="Number of installment dates must match number of installments")
    
    # Calculate installment amount
    installment_amount = sale["amount"] / plan_data.number_of_installments
    
    # Create installment plan
    plan_dict = plan_data.dict()
    plan_dict["total_amount"] = sale["amount"]
    plan_dict["created_by"] = current_user.id
    plan_dict["agency_id"] = sale["agency_id"]
    
    plan = InstallmentPlan(**plan_dict)
    await db.installment_plans.insert_one(plan.dict())
    
    # Create individual installment payments
    for i, due_date in enumerate(plan_data.installment_dates, 1):
        installment_payment = InstallmentPayment(
            plan_id=plan.id,
            installment_number=i,
            due_date=due_date,
            original_amount=installment_amount,
            remaining_amount=installment_amount,
            agency_id=sale["agency_id"]
        )
        await db.installment_payments.insert_one(installment_payment.dict())
    
    return plan

@api_router.get("/service-sales/{sale_id}/installment-plan", response_model=InstallmentPlan)
async def get_installment_plan(
    sale_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get installment plan for a service sale"""
    # Get the service sale
    sale = await db.service_sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Service sale not found")
    
    # Check agency access
    if sale["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get installment plan
    plan = await db.installment_plans.find_one({"service_sale_id": sale_id, "status": {"$ne": InstallmentPlanStatus.CANCELLED}})
    if not plan:
        raise HTTPException(status_code=404, detail="No active installment plan found for this sale")
    
    return InstallmentPlan(**plan)

@api_router.get("/installment-plans/{plan_id}/payments", response_model=List[InstallmentPayment])
async def get_installment_payments(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all installment payments for a plan"""
    # Get the plan
    plan = await db.installment_plans.find_one({"id": plan_id})
    if not plan:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    
    # Check agency access
    if plan["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get installment payments
    payments = await db.installment_payments.find({"plan_id": plan_id}).sort("installment_number", 1).to_list(1000)
    return [InstallmentPayment(**payment) for payment in payments]

@api_router.put("/installment-payments/{payment_id}/pay", response_model=InstallmentPayment)
async def pay_installment(
    payment_id: str,
    paid_amount: float,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Record payment for an installment (supports partial payments)"""
    # Get the installment payment
    payment = await db.installment_payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Installment payment not found")
    
    # Check agency access
    if payment["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate payment amount
    if paid_amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    
    if paid_amount > payment["remaining_amount"]:
        raise HTTPException(status_code=400, detail="Payment amount exceeds remaining amount")
    
    # Update payment
    new_paid_amount = payment["paid_amount"] + paid_amount
    new_remaining_amount = payment["original_amount"] - new_paid_amount
    
    # Determine new status
    if new_remaining_amount <= 0:
        new_status = InstallmentStatus.PAID
    elif new_paid_amount > 0:
        new_status = InstallmentStatus.PARTIAL
    else:
        new_status = InstallmentStatus.PENDING
    
    # Update the installment payment
    await db.installment_payments.update_one(
        {"id": payment_id},
        {
            "$set": {
                "paid_amount": new_paid_amount,
                "remaining_amount": new_remaining_amount,
                "status": new_status,
                "paid_at": datetime.now(timezone.utc),
                "confirmed_by": current_user.id,
                "notes": notes
            }
        }
    )
    
    # Create journal entry for the payment
    journal_entry = JournalEntry(
        date=datetime.now(timezone.utc),
        account_code="1000",  # Cash account
        debit=paid_amount,
        credit=0.0,
        reference=f"Installment payment - Plan {payment['plan_id']} - Installment {payment['installment_number']}",
        agency_id=payment["agency_id"]
    )
    await db.journal_entries.insert_one(journal_entry.dict())
    
    # Create corresponding credit entry for installment revenue
    revenue_entry = JournalEntry(
        date=datetime.now(timezone.utc),
        account_code="4100",  # Installment Revenue account
        debit=0.0,
        credit=paid_amount,
        reference=f"Installment revenue - Plan {payment['plan_id']} - Installment {payment['installment_number']}",
        agency_id=payment["agency_id"]
    )
    await db.journal_entries.insert_one(revenue_entry.dict())
    
    # Check if plan is completed
    plan_payments = await db.installment_payments.find({"plan_id": payment["plan_id"]}).to_list(1000)
    all_paid = all(p["status"] == InstallmentStatus.PAID for p in plan_payments)
    
    if all_paid:
        await db.installment_plans.update_one(
            {"id": payment["plan_id"]},
            {"$set": {"status": InstallmentPlanStatus.COMPLETED}}
        )
    
    # Return updated payment
    updated_payment = await db.installment_payments.find_one({"id": payment_id})
    return InstallmentPayment(**updated_payment)

@api_router.put("/installment-plans/{plan_id}/cancel")
async def cancel_installment_plan(
    plan_id: str,
    reason: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel an installment plan"""
    # Get the plan
    plan = await db.installment_plans.find_one({"id": plan_id})
    if not plan:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    
    # Check agency access
    if plan["agency_id"] != current_user.agency_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if plan can be cancelled
    if plan["status"] == InstallmentPlanStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Plan is already cancelled")
    
    if plan["status"] == InstallmentPlanStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel completed plan")
    
    # Cancel the plan
    await db.installment_plans.update_one(
        {"id": plan_id},
        {
            "$set": {
                "status": InstallmentPlanStatus.CANCELLED,
                "cancelled_at": datetime.now(timezone.utc),
                "cancelled_by": current_user.id,
                "cancellation_reason": reason
            }
        }
    )
    
    return {"message": "Installment plan cancelled successfully"}

@api_router.get("/reports/installment-status")
async def installment_status_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    agency_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Generate installment status report grouped by client"""
    query_filter = {}
    
    # Role-based access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.GENERAL_ACCOUNTANT]:
        if current_user.role == UserRole.GENERAL_ACCOUNTANT:
            query_filter["agency_id"] = current_user.agency_id
        elif agency_id:  # Super Admin can filter by agency
            query_filter["agency_id"] = agency_id
    else:
        # Agency Staff only see their own agency
        query_filter["agency_id"] = current_user.agency_id
    
    # Date range filtering
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query_filter["created_at"] = {"$gte": start_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            if "created_at" in query_filter:
                query_filter["created_at"]["$lte"] = end_dt
            else:
                query_filter["created_at"] = {"$lte": end_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    # Get all installment plans
    plans = await db.installment_plans.find(query_filter).to_list(1000)
    
    # Get corresponding service sales
    plan_ids = [plan["id"] for plan in plans]
    all_payments = await db.installment_payments.find({"plan_id": {"$in": plan_ids}}).to_list(1000)
    
    # Get service sales data
    sale_ids = [plan["service_sale_id"] for plan in plans]
    sales = await db.service_sales.find({"id": {"$in": sale_ids}}).to_list(1000)
    sale_map = {sale["id"]: sale for sale in sales}
    
    # Group by client name
    report_data = {}
    
    for plan in plans:
        sale = sale_map.get(plan["service_sale_id"])
        if not sale:
            continue
        
        client_name = sale["client_name"]
        plan_payments = [p for p in all_payments if p["plan_id"] == plan["id"]]
        
        if client_name not in report_data:
            report_data[client_name] = {
                "total_due": 0.0,
                "total_paid": 0.0,
                "total_overdue": 0.0,
                "plans_count": 0,
                "active_plans": 0,
                "completed_plans": 0
            }
        
        report_data[client_name]["plans_count"] += 1
        
        if plan["status"] == InstallmentPlanStatus.ACTIVE:
            report_data[client_name]["active_plans"] += 1
        elif plan["status"] == InstallmentPlanStatus.COMPLETED:
            report_data[client_name]["completed_plans"] += 1
        
        for payment in plan_payments:
            if payment["status"] == InstallmentStatus.PENDING:
                report_data[client_name]["total_due"] += payment["remaining_amount"]
            elif payment["status"] == InstallmentStatus.PAID:
                report_data[client_name]["total_paid"] += payment["paid_amount"]
            elif payment["status"] == InstallmentStatus.PARTIAL:
                report_data[client_name]["total_paid"] += payment["paid_amount"]
                report_data[client_name]["total_due"] += payment["remaining_amount"]
            elif payment["status"] == InstallmentStatus.OVERDUE:
                report_data[client_name]["total_overdue"] += payment["remaining_amount"]
    
    # Calculate grand totals
    grand_totals = {
        "total_due": sum([data["total_due"] for data in report_data.values()]),
        "total_paid": sum([data["total_paid"] for data in report_data.values()]),
        "total_overdue": sum([data["total_overdue"] for data in report_data.values()]),
        "total_clients": len(report_data),
        "total_plans": sum([data["plans_count"] for data in report_data.values()]),
        "active_plans": sum([data["active_plans"] for data in report_data.values()]),
        "completed_plans": sum([data["completed_plans"] for data in report_data.values()])
    }
    
    return {
        "report_data": report_data,
        "grand_totals": grand_totals,
        "period": {
            "start_date": start_date,
            "end_date": end_date
        }
    }

@api_router.post("/admin/check-overdue-installments")
async def check_overdue_installments(current_user: User = Depends(get_current_user)):
    """Check for overdue installments and update their status (Daily job)"""
    require_super_admin(current_user)
    
    try:
        # Find all pending installments that are past due
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        overdue_result = await db.installment_payments.update_many(
            {
                "due_date": {"$lt": today},
                "status": InstallmentStatus.PENDING
            },
            {
                "$set": {
                    "status": InstallmentStatus.OVERDUE
                }
            }
        )
        
        # Also check partial payments that are overdue
        partial_overdue_result = await db.installment_payments.update_many(
            {
                "due_date": {"$lt": today},
                "status": InstallmentStatus.PARTIAL,
                "remaining_amount": {"$gt": 0}
            },
            {
                "$set": {
                    "status": InstallmentStatus.OVERDUE
                }
            }
        )
        
        total_overdue = overdue_result.modified_count + partial_overdue_result.modified_count
        
        # Get list of affected clients for notification (optional)
        overdue_payments = await db.installment_payments.find(
            {"status": InstallmentStatus.OVERDUE}
        ).to_list(1000)
        
        # Get unique plan IDs and their sales
        plan_ids = list(set([p["plan_id"] for p in overdue_payments]))
        plans = await db.installment_plans.find({"id": {"$in": plan_ids}}).to_list(1000)
        
        sale_ids = [plan["service_sale_id"] for plan in plans]
        sales = await db.service_sales.find({"id": {"$in": sale_ids}}).to_list(1000)
        
        affected_clients = list(set([sale["client_name"] for sale in sales]))
        
        return {
            "message": "Overdue installments check completed",
            "overdue_count": total_overdue,
            "affected_clients_count": len(affected_clients),
            "affected_clients": affected_clients[:10]  # Show first 10 clients
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking overdue installments: {str(e)}")

# Database Migration Endpoint for Booking Model Update
@api_router.post("/admin/migrate-bookings")
async def migrate_bookings_data(current_user: User = Depends(get_current_user)):
    """Migrate existing booking records to include new approval workflow fields"""
    require_super_admin(current_user)
    
    try:
        # Count bookings without the new fields
        missing_fields_count = await db.bookings.count_documents({
            "$or": [
                {"created_by": {"$exists": False}},
                {"status": {"$exists": False}},
                {"modification_history": {"$exists": False}}
            ]
        })
        
        if missing_fields_count == 0:
            return {"message": "All booking records are already up to date", "updated_count": 0}
        
        # Update all bookings that are missing the new fields
        update_result = await db.bookings.update_many(
            {
                "$or": [
                    {"created_by": {"$exists": False}},
                    {"status": {"$exists": False}}, 
                    {"modification_history": {"$exists": False}}
                ]
            },
            {
                "$set": {
                    "created_by": None,  # Will be optional
                    "status": OperationStatus.DRAFT,
                    "approved_by": None,
                    "approved_at": None,
                    "rejected_reason": None,
                    "modification_history": []
                }
            }
        )
        
        return {
            "message": "Booking migration completed successfully",
            "updated_count": update_result.modified_count,
            "found_needing_update": missing_fields_count
        }
        
    except Exception as e:
        logger.error(f"Error migrating booking data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

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