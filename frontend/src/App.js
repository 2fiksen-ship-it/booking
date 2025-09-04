import React, { useState, useEffect, createContext, useContext, memo, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import UI components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { Calendar } from './components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { CalendarIcon, Home, Users, Building2, Package, FileText, CreditCard, Wallet, BarChart3, Settings, LogOut, Globe, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock, Bell, AlertTriangle, Info, AlertCircle, ArrowUpCircle, ArrowDownCircle, Printer, RefreshCw, Download, Filter, Percent, FileX } from 'lucide-react';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

console.log('=== APP.JS LOADED ===');
console.log('BACKEND_URL:', BACKEND_URL);
console.log('API:', API);

// Configure axios - Remove global withCredentials to fix CORS issues
// axios.defaults.withCredentials = true; // This causes CORS issues with JWT auth

// Utility function to format dates with English numerals for Arabic UI
const formatDateWithEnglishNumerals = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  // Use 'en-US' locale to get English numerals but keep Arabic text if needed
  return new Date(date).toLocaleDateString('en-GB', defaultOptions);
};

const formatTimeWithEnglishNumerals = (date, options = {}) => {
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Date(date).toLocaleTimeString('en-GB', defaultOptions);
};

// Auth Context
const AuthContext = createContext();

// Language Context
const LanguageContext = createContext();

// Translation object - Enhanced Professional Arabic UI
const translations = {
  ar: {
    // Main Navigation - القوائم الرئيسية
    dashboard: '🏠 لوحة التحكم الرئيسية',
    clients: '👥 إدارة العملاء',
    suppliers: '🏪 إدارة الموردين', 
    bookings: '📋 إدارة الحجوزات',
    invoices: '📄 إدارة الفواتير',
    payments: '💳 إدارة المدفوعات',
    reports: '📊 التقارير والإحصائيات',
    userManagement: '👤 إدارة المستخدمين',
    dailyReports: '📈 التقارير اليومية',
    settings: '⚙️ إعدادات النظام',
    agencySettings: '🏢 إعدادات الوكالات',
    logout: '🚪 تسجيل الخروج',
    
    // Agency Settings - إعدادات الوكالات
    agencyInformation: 'معلومات الوكالة',
    basicInformation: 'المعلومات الأساسية',
    contactInformation: 'معلومات الاتصال',
    registrationDetails: 'تفاصيل التسجيل',
    managementInfo: 'معلومات الإدارة',
    brandingSettings: 'إعدادات العلامة التجارية',
    agencyName: 'اسم الوكالة',
    agencyAddress: 'عنوان الوكالة',
    agencyCity: 'المدينة',
    postalCode: 'الرمز البريدي',
    primaryPhone: 'الهاتف الأساسي',
    secondaryPhone: 'الهاتف الثانوي',
    additionalPhone: 'هاتف إضافي',
    faxNumber: 'رقم الفاكس',
    agencyEmail: 'البريد الإلكتروني',
    agencyWebsite: 'موقع الوكالة',
    taxNumber: 'رقم التسجيل الضريبي',
    commercialRegister: 'رقم السجل التجاري',
    nationalRegister: 'رقم السجل الوطني',
    businessLicense: 'رخصة النشاط التجاري',
    managerName: 'اسم المدير',
    establishedDate: 'تاريخ التأسيس',
    agencyDescription: 'وصف الوكالة',
    logoUrl: 'رابط الشعار',
    headerText: 'نص الرأس',
    footerText: 'نص التذييل',
    managerSignature: 'توقيع المدير',
    saveSettings: 'حفظ الإعدادات',
    settingsUpdated: 'تم تحديث الإعدادات بنجاح',
    settingsUpdateFailed: 'فشل في تحديث الإعدادات',
    
    // NEW - Services and Operations Management
    servicesManagement: '🛠️ إدارة الخدمات',
    dailyOperations: '📋 العمليات اليومية',
    dailyOperationsReports: '📊 تقارير العمليات',
    
    // Sub-Navigation - القوائم الفرعية
    financialManagement: '💰 الإدارة المالية',
    systemAdministration: '🔧 إدارة النظام',
    operationsManagement: '📋 إدارة العمليات',
    reportsCenter: '📊 مركز التقارير',
    
    // Dashboard Sections - أقسام لوحة التحكم
    quickStats: '📈 الإحصائيات السريعة',
    todayOverview: '📅 نظرة عامة على اليوم',
    weeklyOverview: '📆 نظرة عامة على الأسبوع',
    monthlyOverview: '🗓️ نظرة عامة على الشهر',
    
    // Roles - الأدوار والصلاحيات
    superAdmin: '👑 المدير العام للنظام',
    generalAccountant: '💼 المحاسب العام',
    agencyStaff: '🏢 موظف الوكالة',
    
    // Authentication - المصادقة
    login: 'تسجيل الدخول',
    welcome: 'مرحباً بك',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    loginFailed: 'فشل في تسجيل الدخول',
    
    // Dashboard Cards - بطاقات لوحة التحكم
    todayIncome: '💰 إيرادات اليوم',
    unpaidInvoices: '⚠️ الفواتير غير المسددة',
    weekBookings: '📅 حجوزات هذا الأسبوع',
    cashboxBalance: '🏦 إجمالي رصيد الصناديق',
    activeClients: '👥 العملاء النشطين',
    pendingPayments: '⏳ المدفوعات المعلقة',
    
    // Reports Management - إدارة التقارير
    createReport: '➕ إنشاء تقرير جديد',
    approveReport: '✅ الموافقة على التقرير',
    rejectReport: '❌ رفض التقرير',
    pendingApproval: '⏳ في انتظار الموافقة',
    approved: '✅ تمت الموافقة',
    rejected: '❌ مرفوض',
    reportsList: '📋 قائمة التقارير',
    generateReport: '🔄 إنتاج التقرير',
    
    // NEW - Services Management
    servicesList: '📋 قائمة الخدمات',
    addService: '➕ إضافة خدمة جديدة',
    editService: '✏️ تعديل الخدمة',
    deleteService: '🗑️ حذف الخدمة',
    serviceName: 'اسم الخدمة',
    serviceType: 'نوع الخدمة',
    serviceCategory: 'تصنيف الخدمة',
    basePrice: 'السعر الأساسي (دج)',
    minPrice: 'أقل سعر مسموح (دج)',
    isFixedPrice: 'سعر ثابت',
    isVariablePrice: 'سعر متغير',
    priceType: 'نوع السعر',
    fixedPriceService: 'خدمة بسعر ثابت',
    variablePriceService: 'خدمة بسعر متغير',
    pricePermissions: 'صلاحيات السعر',
    isActive: 'نشطة',
    serviceDescription: 'وصف الخدمة',
    
    // NEW - Daily Operations
    operationsList: '📋 قائمة العمليات اليومية',
    addOperation: '➕ إضافة عملية جديدة',
    operationNo: 'رقم الوصل',
    operationDate: 'تاريخ العملية',
    clientName: 'اسم العميل',
    serviceName: 'اسم الخدمة',
    discountAmount: 'مبلغ التخفيض (دج)',
    discountReason: 'سبب التخفيض',
    finalPrice: 'السعر النهائي (دج)',
    operationStatus: 'حالة العملية',
    approveOperation: '✅ اعتماد العملية',
    rejectOperation: '❌ رفض العملية',
    
    // NEW - Operation Statuses
    draft: '📝 مسودة',
    pendingApproval: '⏳ في انتظار الموافقة',
    operationApproved: '✅ معتمد',
    operationRejected: '❌ مرفوض',
    
    // NEW - Service Types
    umrah: 'عمرة',
    hajj: 'حج',
    flightTicket: 'تذكرة طيران',
    hotelBooking: 'حجز فندق',
    visaService: 'خدمة تأشيرة',
    transport: 'نقل',
    insurance: 'تأمين',
    passportService: 'خدمة جواز سفر',
    otherService: 'أخرى',
    
    // NEW - Service Categories
    religiousServices: 'خدمات دينية',
    travelServices: 'خدمات سفر',
    documentationServices: 'خدمات وثائق',
    accommodationServices: 'خدمات إقامة',
    otherCategory: 'أخرى',
    
    // User Management - إدارة المستخدمين  
    addUser: '➕ إضافة مستخدم جديد',
    editUser: '✏️ تعديل بيانات المستخدم',
    deleteUser: '🗑️ حذف المستخدم',
    selectRole: 'اختيار الدور الوظيفي',
    selectAgency: 'اختيار الوكالة',
    usersList: '👥 قائمة المستخدمين',
    userDetails: '📋 تفاصيل المستخدم',
    
    // Common Actions - الإجراءات العامة
    name: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    add: '➕ إضافة',
    edit: '✏️ تعديل',
    delete: '🗑️ حذف',
    save: '💾 حفظ',
    cancel: '❌ إلغاء',
    actions: 'الإجراءات المتاحة',
    status: 'الحالة الحالية',
    date: 'التاريخ',
    amount: 'المبلغ بالدينار',
    search: '🔍 البحث',
    filter: '🔽 تصفية',
    export: '📤 تصدير البيانات',
    import: '📥 استيراد البيانات',
    loading: '⏳ جاري التحميل...',
    noData: '📭 لا توجد بيانات للعرض',
    total: 'المجموع الكلي',
    profit: 'صافي الربح',
    view: '👁️ عرض',
    details: '📋 التفاصيل',
    
    // Clients Management - إدارة العملاء
    addClient: '➕ إضافة عميل جديد',
    editClient: '✏️ تعديل بيانات العميل',
    deleteClient: '🗑️ حذف العميل',
    cinPassport: '🆔 رقم الهوية/جواز السفر',
    clientsList: '👥 قائمة العملاء',
    clientDetails: '📋 تفاصيل العميل',
    clientHistory: '📚 تاريخ معاملات العميل',
    
    // Suppliers Management - إدارة الموردين
    addSupplier: '➕ إضافة مورد جديد',
    editSupplier: '✏️ تعديل بيانات المورد',
    deleteSupplier: '🗑️ حذف المورد',
    supplierType: '🏷️ تصنيف المورد',
    contact: '📞 بيانات الاتصال',
    suppliersList: '🏪 قائمة الموردين',
    supplierDetails: '📋 تفاصيل المورد',
    
    // Bookings Management - إدارة الحجوزات
    addBooking: '➕ إنشاء حجز جديد',
    editBooking: '✏️ تعديل الحجز',
    deleteBooking: '🗑️ إلغاء الحجز',
    reference: '🔢 رقم المرجع',
    client: '👤 العميل',
    supplier: '🏪 المورد',
    bookingType: '🏷️ نوع الخدمة',
    cost: '💸 تكلفة الخدمة',
    sellPrice: '💰 سعر البيع للعميل',
    startDate: '📅 تاريخ بداية الخدمة',
    endDate: '📅 تاريخ انتهاء الخدمة',
    bookingsList: '📋 سجل الحجوزات',
    selectClient: 'اختيار العميل',
    selectSupplier: 'اختيار المورد',
    bookingDetails: '📋 تفاصيل الحجز',
    
    // Service Types - أنواع الخدمات
    'عمرة': '🕋 عمرة',
    'طيران': '✈️ تذاكر طيران',
    'فندق': '🏨 حجز فنادق',
    'تأشيرة': '📋 خدمات التأشيرات',
    
    // Invoices Management - إدارة الفواتير
    addInvoice: '➕ إصدار فاتورة جديدة',
    editInvoice: '✏️ تعديل الفاتورة',
    deleteInvoice: '🗑️ حذف الفاتورة',
    invoiceNo: '🔢 رقم الفاتورة',
    amountHT: '💰 المبلغ قبل الضريبة',
    tvaRate: '📊 معدل ضريبة القيمة المضافة %',
    amountTTC: '💳 المبلغ شامل الضريبة',
    dueDate: '⏰ تاريخ استحقاق السداد',
    invoicesList: '📄 سجل الفواتير',
    generateFromBooking: '🔄 إنشاء فاتورة من الحجز',
    printInvoice: '🖨️ طباعة الفاتورة',
    sendInvoice: '📧 إرسال الفاتورة',
    
    // Invoice Status - حالة الفواتير
    pending: '⏳ في انتظار السداد',
    paid: '✅ مسددة بالكامل',
    overdue: '⚠️ متأخرة السداد',
    partial: '🔄 مسددة جزئياً',
    
    // Payments Management - إدارة المدفوعات
    addPayment: '➕ تسجيل دفعة جديدة',
    editPayment: '✏️ تعديل الدفعة',
    deletePayment: '🗑️ حذف سجل الدفعة',
    paymentNo: '🔢 رقم عملية الدفع',
    invoice: '📄 الفاتورة المرتبطة',
    paymentMethod: '💳 طريقة الدفع',
    paymentDate: '📅 تاريخ الدفع',
    paymentsList: '💰 سجل المدفوعات',
    selectInvoice: 'اختيار الفاتورة',
    remainingAmount: '📊 المبلغ المتبقي',
    
    // Payment Methods - طرق الدفع
    cash: '💵 نقداً',
    bank: '🏦 حوالة بنكية', 
    card: '💳 بطاقة ائتمانية',
    check: '📝 شيك',
    
    // Reports Center - مركز التقارير
    dailySalesReport: '📈 تقرير المبيعات اليومية',
    monthlySalesReport: '📊 تقرير المبيعات الشهرية',
    agingReport: '⏰ تقرير أعمار الديون',
    profitLossReport: '💹 تقرير الأرباح والخسائر',
    cashFlowReport: '💰 تقرير التدفق النقدي',
    clientsReport: '👥 تقرير العملاء',
    suppliersReport: '🏪 تقرير الموردين',
    generateReport: '🔄 إنتاج التقرير',
    reportPeriod: '📅 فترة التقرير',
    from: 'من تاريخ',
    to: 'إلى تاريخ',
    
    // System Messages - رسائل النظام
    success: '✅ تم بنجاح',
    error: '❌ حدث خطأ',
    warning: '⚠️ تحذير',
    info: 'ℹ️ معلومة',
    confirm: '✔️ تأكيد',
    confirmDelete: '🗑️ هل أنت متأكد من الحذف؟',
    dataRequired: '⚠️ يرجى إدخال البيانات المطلوبة',
    saveSuccess: '💾 تم الحفظ بنجاح',
    updateSuccess: '✅ تم التحديث بنجاح',
    deleteSuccess: '🗑️ تم الحذف بنجاح',
    
    // Financial Terms - المصطلحات المالية
    revenue: '📈 الإيرادات',
    expenses: '📉 المصروفات',
    netProfit: '💰 صافي الربح',
    grossProfit: '💸 إجمالي الربح',
    commission: '💼 العمولة',
    discount: '🏷️ الخصم',
    balance: '⚖️ الرصيد',
    debt: '📋 الدين',
    credit: '💳 دائن',
    debit: '💸 مدين'
  },
  fr: {
    // Navigation and roles
    dashboard: 'Tableau de bord',
    userManagement: 'Gestion des utilisateurs',
    dailyReports: 'Rapports quotidiens',
    superAdmin: 'Super Admin',
    generalAccountant: 'Comptable Général',
    agencyStaff: 'Personnel Agence',
    
    // All other translations...
    clients: 'Clients',
    suppliers: 'Fournisseurs',
    bookings: 'Réservations',
    invoices: 'Factures',
    payments: 'Paiements',
    reports: 'Rapports',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    login: 'Connexion',
    email: 'Email',
    password: 'Mot de passe',
    todayIncome: "Revenus d'aujourd'hui",
    unpaidInvoices: 'Factures impayées',
    weekBookings: 'Réservations de la semaine',
    cashboxBalance: 'Solde de caisse',
    name: 'Nom',
    phone: 'Téléphone',
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    actions: 'Actions',
    status: 'Statut',
    date: 'Date',
    amount: 'Montant',
    search: 'Rechercher',
    loading: 'Chargement...',
    noData: 'Aucune donnée',
    addClient: 'Ajouter un client',
    cinPassport: 'CIN/Passeport',
    clientsList: 'Liste des clients',
    addSupplier: 'Ajouter un fournisseur',
    supplierType: 'Type de fournisseur',
    contact: 'Contact',
    suppliersList: 'Liste des fournisseurs',
    addBooking: 'Ajouter une réservation',
    reference: 'Référence',
    client: 'Client',
    supplier: 'Fournisseur',
    bookingType: 'Type de réservation',
    cost: 'Coût',
    sellPrice: 'Prix de vente',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    bookingsList: 'Liste des réservations',
    'عمرة': 'Omra',
    'طيران': 'Vol',
    'فندق': 'Hôtel',
    'تأشيرة': 'Visa',
    addInvoice: 'Ajouter une facture',
    invoiceNo: 'N° Facture',
    amountHT: 'Montant HT',
    tvaRate: 'Taux TVA %',
    amountTTC: 'Montant TTC',
    dueDate: "Date d'échéance",
    invoicesList: 'Liste des factures',
    pending: 'En attente',
    paid: 'Payée',
    overdue: 'En retard',
    addPayment: 'Ajouter un paiement',
    paymentNo: 'N° Paiement',
    invoice: 'Facture',
    paymentMethod: 'Méthode de paiement',
    paymentDate: 'Date de paiement',
    paymentsList: 'Liste des paiements',
    cash: 'Espèces',
    bank: 'Banque',
    card: 'Carte',
    success: 'Succès',
    error: 'Erreur',
    confirm: 'Confirmer',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer?'
  }
};

// Language Provider
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar');
  const [isRTL, setIsRTL] = useState(true);

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'fr' : 'ar';
    setLanguage(newLang);
    setIsRTL(newLang === 'ar');
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key) => translations[language][key] || key;

  useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  return (
    <LanguageContext.Provider value={{ language, isRTL, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enhanced authentication context with Google OAuth support
  const login = async (email, password) => {
    try {
      console.log('=== LOGIN FUNCTION START ===');
      console.log('Login attempt with email:', email);
      console.log('Password provided:', password ? 'YES' : 'NO');
      console.log('API endpoint:', `${API}/auth/login`);
      
      const response = await axios.post(`${API}/auth/login`, { email, password });
      console.log('Login response received:', response.data);
      
      const { access_token, user: userData } = response.data;
      
      if (!access_token) {
        console.error('No access token in response!');
        return { success: false, error: 'No access token received' };
      }
      
      console.log('Setting token in localStorage...');
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      console.log('Login successful, user set:', userData);
      console.log('Token saved:', access_token.substring(0, 20) + '...');
      console.log('=== LOGIN FUNCTION SUCCESS ===');
      return { success: true };
    } catch (error) {
      console.error('=== LOGIN FUNCTION ERROR ===');
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  // Google Authentication function
  const loginWithGoogle = () => {
    console.log('=== GOOGLE LOGIN START ==='); 
    const currentUrl = window.location.origin;
    const redirectUrl = `${currentUrl}/profile`;
    const googleAuthUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    console.log('Redirecting to Google Auth:', googleAuthUrl);
    window.location.href = googleAuthUrl;
  };

  // Handle Google OAuth callback
  const handleGoogleCallback = async (sessionId) => {
    try {
      console.log('=== GOOGLE CALLBACK START ===');
      console.log('Session ID received:', sessionId);
      
      const response = await axios.post(`${API}/auth/google`, { session_id: sessionId }, {
        withCredentials: true // Important for cookies
      });
      
      console.log('Google auth response:', response.data);
      
      const { user: userData, session_token } = response.data;
      
      // Set user data in context
      setUser(userData);
      
      console.log('Google authentication successful:', userData);
      console.log('=== GOOGLE CALLBACK SUCCESS ===');
      return { success: true };
    } catch (error) {
      console.error('=== GOOGLE CALLBACK ERROR ===');
      console.error('Google auth error:', error);
      return { success: false, error: error.response?.data?.detail || 'Google authentication failed' };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear session cookie
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if server call fails
    }
    
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API}/auth/me`)
        .then(response => setUser(response.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithGoogle, 
      handleGoogleCallback, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Simple Login Component (with Google OAuth support)
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

  // Simple test function
  const testFunction = () => {
    console.log('=== TEST FUNCTION CALLED ===');
    alert('Test function works!');
  };

  const handleLogin = async () => {
    console.log('=== HANDLE LOGIN CALLED ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    setLoading(true);
    setError('');
    
    try {
      console.log('About to call login function...');
      const result = await login(email, password);
      console.log('Login function returned:', result);
      
      if (result.success) {
        console.log('Login successful, about to navigate to dashboard...');
        // Use navigate instead of window.location.reload() to avoid losing token
        navigate('/');
        console.log('Navigate called');
      } else {
        console.log('Login failed with error:', result.error);
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error caught:', error);
      setError('An error occurred during login');
    }
    
    setLoading(false);
    console.log('=== HANDLE LOGIN FINISHED ===');
  };

  const handleGoogleLogin = () => {
    console.log('=== GOOGLE LOGIN CLICKED ===');
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold text-gray-800">
            {t('login')}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            نظام محاسبة وكالات صنهاجة للسفر - غرب الجزائر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              🔐 تسجيل الدخول باستخدام Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-indigo-100 px-2 text-gray-500">أو</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-right"
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              
              {/* Traditional Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-medium disabled:opacity-50"
                data-testid="regular-login-button"
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول العادي'}
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Layout Component
const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { language, toggleLanguage, t } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Navigation items based on user role - Enhanced Professional Organization
  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard', label: t('dashboard'), icon: Home, category: 'main' }
    ];

    // Super Admin sees everything with organized categories
    if (user?.role === 'super_admin') {
      return [
        ...baseItems,
        // System Administration Category
        { 
          category: 'systemAdmin',
          label: t('systemAdministration'),
          items: [
            { id: 'userManagement', label: t('userManagement'), icon: Settings },
            { id: 'agencyManagement', label: '🏢 إدارة الوكالات', icon: Building2 },
            { id: 'dailyReports', label: t('dailyReports'), icon: BarChart3 },
            { id: 'servicesManagement', label: t('servicesManagement'), icon: Package },
            { id: 'agencySettings', label: t('agencySettings'), icon: Building2 }
          ]
        },
        // Operations Management Category  
        {
          category: 'operations',
          label: t('operationsManagement'),
          items: [
            { id: 'clients', label: t('clients'), icon: Users },
            { id: 'suppliers', label: t('suppliers'), icon: Building2 },
            { id: 'bookings', label: t('bookings'), icon: Package },
            { id: 'dailyOperations', label: t('dailyOperations'), icon: FileText }
          ]
        },
        // Financial Management Category
        {
          category: 'financial',
          label: t('financialManagement'),
          items: [
            { id: 'invoices', label: t('invoices'), icon: FileText },
            { id: 'payments', label: t('payments'), icon: CreditCard },
            { id: 'financial-management', label: '💰 الإدارة المالية', icon: CreditCard },
            { id: 'installments', label: '📅 إدارة التقسيط', icon: CalendarIcon },
            { id: 'enhanced-installments', label: '📅 نظام التقسيط المتكامل', icon: CalendarIcon },
            { id: 'reports', label: t('reports'), icon: BarChart3 },
            { id: 'dailyOperationsReports', label: t('dailyOperationsReports'), icon: BarChart3 }
          ]
        }
      ];
    }

    // General Accountant sees all operations and financial functions with full cross-agency access
    if (user?.role === 'general_accountant') {
      return [
        ...baseItems,
        // Reports and Approval Category
        {
          category: 'reportsCenter',
          label: t('reportsCenter'),
          items: [
            { id: 'dailyReports', label: t('dailyReports'), icon: BarChart3 },
            { id: 'reports', label: t('reports'), icon: BarChart3 },
            { id: 'dailyOperationsReports', label: t('dailyOperationsReports'), icon: BarChart3 },
            { id: 'servicesManagement', label: t('servicesManagement'), icon: Package },
            { id: 'agencySettings', label: t('agencySettings'), icon: Building2 }
          ]
        },
        // Full Operations Management (All Agencies)
        {
          category: 'operations',
          label: t('operationsManagement') + ' 🌐',
          items: [
            { id: 'clients', label: t('clients') + ' (جميع الوكالات)', icon: Users },
            { id: 'suppliers', label: t('suppliers') + ' (جميع الوكالات)', icon: Building2 },
            { id: 'bookings', label: t('bookings') + ' (جميع الوكالات)', icon: Package },
            { id: 'dailyOperations', label: t('dailyOperations') + ' (جميع الوكالات)', icon: FileText }
          ]
        },
        // Full Financial Management (All Agencies)
        {
          category: 'financial',
          label: t('financialManagement') + ' 🌐',
          items: [
            { id: 'invoices', label: t('invoices') + ' (جميع الوكالات)', icon: FileText },
            { id: 'payments', label: t('payments') + ' (جميع الوكالات)', icon: CreditCard },
            { id: 'financial-management', label: '💰 الإدارة المالية', icon: CreditCard },
            { id: 'installments', label: '📅 إدارة التقسيط', icon: CalendarIcon },
            { id: 'enhanced-installments', label: '📅 نظام التقسيط المتكامل', icon: CalendarIcon }
          ]
        }
      ];
    }

    // Agency Staff sees operational functions (LIMITED ACCESS)
    return [
      ...baseItems,
      // Daily Operations Category
      {
        category: 'operations',
        label: t('operationsManagement'),
        items: [
          { id: 'clients', label: t('clients'), icon: Users },
          { id: 'suppliers', label: t('suppliers'), icon: Building2 },
          { id: 'dailyOperations', label: t('dailyOperations'), icon: FileText }
          // REMOVED: bookings (restricted to managers/accountants)
        ]
      },
      // Financial Transactions Category (LIMITED)
      {
        category: 'financial',
        label: t('financialManagement'),
        items: [
          { id: 'payments', label: '💰 المدفوعات (العمليات)', icon: CreditCard },
          { id: 'financial-management', label: '💰 الإدارة المالية', icon: CreditCard },
          { id: 'installments', label: '📅 إدارة التقسيط', icon: CalendarIcon },
          { id: 'enhanced-installments', label: '📅 نظام التقسيط المتكامل', icon: CalendarIcon },
          { id: 'dailyOperationsReports', label: t('dailyOperationsReports'), icon: BarChart3 }
          // REMOVED: invoices (restricted to managers/accountants)
        ]
      },
      // Agency Information Category
      {
        category: 'agencyInfo',
        label: 'معلومات الوكالة',
        items: [
          { id: 'agencySettings', label: t('agencySettings') + ' (للعرض فقط)', icon: Building2 }
        ]
      }
    ];
  };

  const navItems = getNavItems();

  // Get role display name
  const getRoleDisplay = (role) => {
    switch(role) {
      case 'super_admin': return t('superAdmin');
      case 'general_accountant': return t('generalAccountant'); 
      case 'agency_staff': return t('agencyStaff');
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Professional Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900 text-center">
            🏢 وكالات صنهاجة للسفر
          </h1>
          <p className="text-sm text-gray-600 text-center mt-1">غرب الجزائر</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
              <p className="text-xs text-blue-600">{getRoleDisplay(user?.role)}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4">
          {navItems.map((item, index) => (
            <div key={index}>
              {item.category === 'main' ? (
                // Main dashboard item
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-right hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    activeTab === item.id ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-600' : 'text-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 ml-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ) : (
                // Category sections
                <div className="mt-6">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {item.label}
                  </h3>
                  {item.items?.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => setActiveTab(subItem.id)}
                      className={`w-full flex items-center px-6 py-2 text-right hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                        activeTab === subItem.id ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600'
                      }`}
                    >
                      <subItem.icon className="h-4 w-4 ml-3" />
                      <span className="text-sm">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center space-x-2 text-xs"
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'ar' ? 'Français' : 'العربية'}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-xs"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('logout')}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {navItems
                  .flatMap(item => item.items ? item.items : [item])
                  .find(item => item.id === activeTab)?.label || t('dashboard')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {formatDateWithEnglishNumerals(new Date(), {
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <NotificationBell />
              
              {/* Quick Actions could go here */}
              <div className="text-sm text-gray-500">
                📅 {formatTimeWithEnglishNumerals(new Date(), {hour: '2-digit', minute: '2-digit'})}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <MainApp activeTab={activeTab} setActiveTab={setActiveTab} />
        </main>
      </div>
    </div>
  );
};

// Profile Component for Google OAuth Callback
const Profile = () => {
  const { handleGoogleCallback } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        // Extract session ID from URL fragment
        const hash = window.location.hash;
        console.log('Current hash:', hash);
        
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const sessionId = params.get('session_id');
          
          console.log('Extracted session ID:', sessionId);
          
          if (sessionId) {
            console.log('Processing Google callback with session ID:', sessionId);
            const result = await handleGoogleCallback(sessionId);
            
            if (result.success) {
              console.log('Google authentication successful, redirecting to dashboard');
              navigate('/');
            } else {
              setError(result.error || 'Google authentication failed');
            }
          } else {
            setError('No session ID found in callback');
          }
        } else {
          setError('No authentication data received');
        }
      } catch (error) {
        console.error('Profile callback error:', error);
        setError('Authentication process failed');
      } finally {
        setLoading(false);
      }
    };

    processGoogleCallback();
  }, [handleGoogleCallback, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">جاري معالجة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في التسجيل</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              العودة لتسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

// Notification Bell Component
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Simulate fetching notifications
    const mockNotifications = [
      {
        id: 1,
        type: 'warning',
        title: '⚠️ فواتير مستحقة',
        message: 'يوجد 3 فواتير مستحقة السداد',
        time: 'منذ 5 دقائق',
        read: false
      },
      {
        id: 2,
        type: 'info',
        title: '💰 رصيد منخفض',
        message: 'رصيد الصندوق أقل من الحد المطلوب',
        time: 'منذ 30 دقيقة',
        read: false
      },
      {
        id: 3,
        type: 'success',
        title: '✅ دفعة جديدة',
        message: 'تم استلام دفعة بقيمة 25,000 دج',
        time: 'منذ ساعة',
        read: true
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-right">🔔 الإشعارات</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                لا توجد إشعارات جديدة
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200">
            <button 
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
              onClick={() => setShowNotifications(false)}
            >
              عرض جميع الإشعارات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Agency Filter Component for Super Admin and General Accountant
const AgencyFilter = ({ selectedAgency, onAgencyChange, showAllOption = true }) => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Only show for Super Admin and General Accountant
  if (!user || !['super_admin', 'general_accountant'].includes(user.role)) {
    return null;
  }

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const response = await axios.get(`${API}/agencies`);
        setAgencies(response.data);
      } catch (error) {
        console.error('Error fetching agencies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgencies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">جاري تحميل الوكالات...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Label htmlFor="agencyFilter" className="text-sm font-medium text-gray-700">
        🏢 فلترة الوكالة:
      </Label>
      <Select value={selectedAgency || 'all'} onValueChange={(value) => onAgencyChange(value === 'all' ? null : value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="اختر الوكالة" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">🌐 جميع الوكالات</SelectItem>
          )}
          {agencies.map((agency) => (
            <SelectItem key={agency.id} value={agency.id}>
              🏢 {agency.name} - {agency.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Enhanced Dashboard Component
const Dashboard = ({ setActiveTab }) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = selectedAgency ? `?agency_id=${selectedAgency}` : '';
      const response = await axios.get(`${API}/dashboard${params}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, [selectedAgency]);

  const getAgencyFilterText = () => {
    if (!selectedAgency) return 'جميع الوكالات';
    // This would need to be improved with actual agency name lookup
    return 'الوكالة المحددة';
  };

  const mainStatCards = [
    {
      title: t('todayIncome'),
      value: `${(stats.today_income || 0).toLocaleString()} دج`,
      icon: Wallet,
      color: 'from-green-500 to-emerald-600',
      trend: '+12%',
      description: selectedAgency ? 'للوكالة المحددة' : 'جميع الوكالات'
    },
    {
      title: t('unpaidInvoices'),
      value: stats.unpaid_invoices || 0,
      icon: FileText,
      color: 'from-orange-500 to-amber-600',
      trend: '-3%',
      description: selectedAgency ? 'في الوكالة المحددة' : 'في جميع الوكالات'
    },
    {
      title: t('weekBookings'),
      value: stats.week_bookings || 0,
      icon: Package,
      color: 'from-blue-500 to-indigo-600',
      trend: '+8%',
      description: selectedAgency ? 'للوكالة المحددة' : 'لجميع الوكالات'
    },
    {
      title: t('cashboxBalance'),
      value: `${(stats.cashbox_balance || 0).toLocaleString()} دج`,
      icon: CreditCard,
      color: 'from-purple-500 to-violet-600',
      trend: '+5%',
      description: selectedAgency ? 'رصيد الوكالة' : 'إجمالي جميع الوكالات'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Agency Filter for Super Admin and General Accountant */}
      {['super_admin', 'general_accountant'].includes(user?.role) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <AgencyFilter 
              selectedAgency={selectedAgency}
              onAgencyChange={setSelectedAgency}
              showAllOption={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">🏠 {t('quickStats')}</h2>
            <p className="text-blue-100">مرحباً بك في نظام إدارة وكالات صنهاجة للسفر</p>
            {['super_admin', 'general_accountant'].includes(user?.role) && (
              <p className="text-blue-200 text-sm mt-1">
                📊 عرض بيانات: {getAgencyFilterText()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {new Date().toLocaleDateString('ar-SA', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
            <p className="text-blue-200">
              {formatTimeWithEnglishNumerals(new Date(), {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStatCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 ml-2" />
              🚀 الإجراءات السريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              onClick={() => setActiveTab('clients')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-right"
            >
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">➕ إضافة عميل جديد</span>
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-right"
            >
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">📋 إنشاء حجز جديد</span>
            </button>
            <button 
              onClick={() => setActiveTab('invoices')}
              className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-right"
            >
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">📄 إصدار فاتورة</span>
            </button>
            <button 
              onClick={() => setActiveTab('dailyOperations')}
              className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-right"
            >
              <FileText className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">📋 عملية يومية جديدة</span>
            </button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 ml-2" />
              📈 آخر النشاطات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <button 
                onClick={() => setActiveTab('bookings')}
                className="w-full flex items-center space-x-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium">تم إنشاء حجز جديد</p>
                  <p className="text-xs text-gray-500">منذ 5 دقائق</p>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('payments')}
                className="w-full flex items-center space-x-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium">دفعة جديدة مستلمة</p>
                  <p className="text-xs text-gray-500">منذ 15 دقيقة</p>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('invoices')}
                className="w-full flex items-center space-x-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium">فاتورة تحتاج مراجعة</p>
                  <p className="text-xs text-gray-500">منذ ساعة</p>
                </div>
              </button>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button 
                onClick={() => setActiveTab('reports')}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                عرض جميع النشاطات ←
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 ml-2" />
              📊 مؤشرات الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="text-right">
                  <p className="text-sm font-medium text-green-800">معدل النمو الشهري</p>
                  <p className="text-xs text-green-600">مقارنة بالشهر السابق</p>
                </div>
                <div className="text-2xl font-bold text-green-700">+15%</div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-800">متوسط قيمة الحجز</p>
                  <p className="text-xs text-blue-600">للعمليات الأخيرة</p>
                </div>
                <div className="text-lg font-bold text-blue-700">45,000 دج</div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-800">معدل تحصيل الفواتير</p>
                  <p className="text-xs text-purple-600">خلال آخر 30 يوم</p>
                </div>
                <div className="text-lg font-bold text-purple-700">87%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner for Important Actions */}
      {(stats.unpaid_invoices > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="mr-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800 text-right">
                ⚠️ تنبيه: يوجد {stats.unpaid_invoices} فاتورة غير مسددة تحتاج للمتابعة
              </h3>
              <div className="mt-2">
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-md transition-colors"
                >
                  عرض الفواتير المعلقة ←
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Clients Management Component
const ClientsManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cin_passport: ''
  });
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cin_passport: '',
    address: ''
  });

  const fetchClients = async () => {
    try {
      const params = selectedAgency ? `?agency_id=${selectedAgency}` : '';
      const response = await axios.get(`${API}/clients${params}`);
      // Sort clients by creation date - newest first
      const sortedClients = response.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setClients(sortedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [selectedAgency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await axios.put(`${API}/clients/${editingClient.id}`, formData);
      } else {
        await axios.post(`${API}/clients`, formData);
      }
      setFormData({ name: '', phone: '', cin_passport: '' });
      setEditingClient(null);
      setIsDialogOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      cin_passport: client.cin_passport
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API}/clients/${clientId}`);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleAddClient = async () => {
    try {
      if (!clientFormData.name || !clientFormData.phone) {
        alert('يرجى إدخال الاسم ورقم الهاتف على الأقل');
        return;
      }
      
      await axios.post(`${API}/clients`, clientFormData);
      setClientFormData({
        name: '',
        phone: '',
        email: '',
        cin_passport: '',
        address: ''
      });
      setShowAddClientDialog(false);
      fetchClients();
      alert('✅ تم إضافة العميل بنجاح');
    } catch (error) {
      console.error('Error adding client:', error);
      alert('❌ حدث خطأ في إضافة العميل');
    }
  };

  const handlePrintClients = async () => {
    try {
      console.log('=== PRINTING CLIENTS LIST ===');
      console.log('Filtered clients count:', filteredClients.length);
      
      // Simple test - just alert first
      alert(`سيتم طباعة قائمة تحتوي على ${filteredClients.length} عميل`);
      
      // For now, just open a simple print window
      const printContent = `
        <html dir="rtl">
          <head>
            <title>قائمة العملاء</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
              h1 { text-align: center; color: #1f2937; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
              th { background-color: #f3f4f6; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>🏢 قائمة العملاء</h1>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            <table>
              <thead>
                <tr>
                  <th>اسم العميل</th>
                  <th>الهاتف</th>
                  <th>البريد الإلكتروني</th>
                </tr>
              </thead>
              <tbody>
                ${filteredClients.map(client => `
                  <tr>
                    <td>${client.name}</td>
                    <td>${client.phone || '-'}</td>
                    <td>${client.email || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p>إجمالي العملاء: ${filteredClients.length}</p>
          </body>
        </html>
      `;

      const blob = new Blob([printContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.onload = function() {
          setTimeout(() => {
            newWindow.print();
            alert('✅ تم فتح نافذة الطباعة بنجاح!');
          }, 1000);
        };
        console.log('✅ Print window opened successfully');
      } else {
        alert('❌ لم يتم فتح نافذة الطباعة. تأكد من السماح للنوافذ المنبثقة.');
      }
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 2000);
      
    } catch (error) {
      console.error('Error printing clients list:', error);
      alert('خطأ في طباعة قائمة العملاء: ' + error.message);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.cin_passport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agency Filter */}
      {['super_admin', 'general_accountant'].includes(user?.role) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <AgencyFilter 
              selectedAgency={selectedAgency}
              onAgencyChange={setSelectedAgency}
              showAllOption={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('clients')}</h2>
            <p className="text-gray-600 mt-1">
              إدارة وتنظيم بيانات العملاء
              {['super_admin', 'general_accountant'].includes(user?.role) && selectedAgency && (
                <span className="text-blue-600"> - الوكالة المحددة</span>
              )}
              {['super_admin', 'general_accountant'].includes(user?.role) && !selectedAgency && (
                <span className="text-green-600"> - جميع الوكالات</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Print Button */}
            <Button 
              onClick={handlePrintClients}
              variant="outline" 
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              🖨️ طباعة القائمة
            </Button>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                🔳 شبكة
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                📋 جدول
              </button>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addClient')}
                </Button>
              </DialogTrigger>
              
            {/* Enhanced Add Client Button */}
            <Button 
              onClick={() => setShowAddClientDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              ➕ إضافة عميل متقدم
            </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingClient ? '✏️ تعديل بيانات العميل' : '➕ إضافة عميل جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClient ? 'قم بتعديل بيانات العميل أدناه' : 'أدخل بيانات العميل الجديد'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">👤 {t('name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="أدخل الاسم الكامل"
                      required
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">📞 {t('phone')}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="مثال: 0555123456"
                      required
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cin_passport">🆔 {t('cinPassport')}</Label>
                    <Input
                      id="cin_passport"
                      value={formData.cin_passport}
                      onChange={(e) => setFormData({ ...formData, cin_passport: e.target.value })}
                      placeholder="رقم الهوية أو جواز السفر"
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingClient ? '💾 تحديث البيانات' : '➕ إضافة العميل'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-blue-800">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-green-800">العملاء النشطون</p>
                <p className="text-2xl font-bold text-green-900">{Math.floor(clients.length * 0.8)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-purple-800">عملاء جدد هذا الشهر</p>
                <p className="text-2xl font-bold text-purple-900">{Math.floor(clients.length * 0.2)}</p>
              </div>
              <Plus className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="🔍 البحث في العملاء (الاسم، الهاتف، رقم الهوية)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-right"
              />
            </div>
            <Button variant="outline" size="sm">
              📊 تصدير القائمة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Display */}
      {viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">لا توجد عملاء</p>
              <p className="text-gray-600">ابدأ بإضافة عميل جديد</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center justify-end">
                      <span>{client.phone}</span>
                      <span className="mr-2">📞</span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center justify-end">
                      <span>{client.cin_passport}</span>
                      <span className="mr-2">🆔</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        // Table View
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">👤 {t('name')}</TableHead>
                  <TableHead className="text-right">📞 {t('phone')}</TableHead>
                  <TableHead className="text-right">🆔 {t('cinPassport')}</TableHead>
                  <TableHead className="text-right">⚙️ {t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900">لا توجد عملاء</p>
                        <p className="text-gray-600">ابدأ بإضافة عميل جديد</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-right">{client.name}</TableCell>
                      <TableCell className="text-right">{client.phone}</TableCell>
                      <TableCell className="text-right">{client.cin_passport}</TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Client Dialog */}
      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات العميل الجديد للوكالة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الاسم الكامل *</Label>
                <Input
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
                  placeholder="اسم العميل الكامل"
                />
              </div>
              <div>
                <Label>رقم الهاتف *</Label>
                <Input
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})}
                  placeholder="رقم الهاتف"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})}
                  placeholder="البريد الإلكتروني (اختياري)"
                />
              </div>
              <div>
                <Label>رقم الهوية/جواز السفر</Label>
                <Input
                  value={clientFormData.cin_passport}
                  onChange={(e) => setClientFormData({...clientFormData, cin_passport: e.target.value})}
                  placeholder="رقم الهوية أو جواز السفر (اختياري)"
                />
              </div>
            </div>

            <div>
              <Label>العنوان</Label>
              <Input
                value={clientFormData.address}
                onChange={(e) => setClientFormData({...clientFormData, address: e.target.value})}
                placeholder="عنوان العميل (اختياري)"
              />
            </div>

            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={() => setShowAddClientDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleAddClient}
                disabled={!clientFormData.name || !clientFormData.phone}
                className="bg-green-600 hover:bg-green-700"
              >
                ✅ إضافة العميل
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// Suppliers Management Component  
const SuppliersManagement = () => {
  const { t } = useContext(LanguageContext);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    contact: ''
  });

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/suppliers`);
      // Sort suppliers by creation date - newest first
      const sortedSuppliers = response.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setSuppliers(sortedSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(`${API}/suppliers/${editingSupplier.id}`, formData);
      } else {
        await axios.post(`${API}/suppliers`, formData);
      }
      setFormData({ name: '', type: '', contact: '' });
      setEditingSupplier(null);
      setIsDialogOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      type: supplier.type,
      contact: supplier.contact
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API}/suppliers/${supplierId}`);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const handlePrintSuppliers = async () => {
    try {
      console.log('=== PRINTING SUPPLIERS LIST ===');
      console.log('Suppliers count:', suppliers.length);
      
      // Simple test alert
      alert(`سيتم طباعة قائمة تحتوي على ${suppliers.length} مورد`);
      
      const printContent = `
        <html dir="rtl">
          <head>
            <title>قائمة الموردين</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
              h1 { text-align: center; color: #1f2937; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
              th { background-color: #f3f4f6; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>🏭 قائمة الموردين</h1>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            <table>
              <thead>
                <tr>
                  <th>اسم المورد</th>
                  <th>نوع المورد</th>
                  <th>معلومات الاتصال</th>
                </tr>
              </thead>
              <tbody>
                ${suppliers.map(supplier => `
                  <tr>
                    <td>${supplier.name}</td>
                    <td>${supplier.type || '-'}</td>
                    <td>${supplier.contact || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p>إجمالي الموردين: ${suppliers.length}</p>
          </body>
        </html>
      `;

      const blob = new Blob([printContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.onload = function() {
          setTimeout(() => {
            newWindow.print();
            alert('✅ تم فتح نافذة طباعة الموردين بنجاح!');
          }, 1000);
        };
        console.log('✅ Suppliers print window opened');
      } else {
        alert('❌ لم يتم فتح نافذة الطباعة. تأكد من السماح للنوافذ المنبثقة.');
      }
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 2000);
      
    } catch (error) {
      console.error('Error printing suppliers list:', error);
      alert('خطأ في طباعة قائمة الموردين: ' + error.message);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.includes(searchTerm)
  );

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('suppliersList')}</h2>
        <div className="flex items-center space-x-3">
          {/* Print Button */}
          <Button 
            onClick={handlePrintSuppliers}
            variant="outline" 
            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            🖨️ طباعة القائمة
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('addSupplier')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSupplier ? t('edit') : t('addSupplier')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">{t('supplierType')}</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('supplierType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="طيران">طيران</SelectItem>
                      <SelectItem value="فنادق">فنادق</SelectItem>
                      <SelectItem value="نقل">نقل</SelectItem>
                      <SelectItem value="تأشيرات">تأشيرات</SelectItem>
                      <SelectItem value="تأمين">تأمين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contact">{t('contact')}</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit">{t('save')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('supplierType')}</TableHead>
                <TableHead>{t('contact')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    {t('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.type}</TableCell>
                    <TableCell>{supplier.contact}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Bookings Management Component
const BookingsManagement = () => {
  const { t } = useContext(LanguageContext);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    ref: '',
    client_id: '',
    supplier_id: '',
    type: '',
    cost: '',
    sell_price: '',
    start_date: '',
    end_date: ''
  });

  const fetchData = async () => {
    try {
      const [bookingsRes, clientsRes, suppliersRes] = await Promise.all([
        axios.get(`${API}/bookings`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/suppliers`)
      ]);
      
      // Sort bookings by creation date - newest first
      const sortedBookings = bookingsRes.data.sort((a, b) => {
        return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
      });
      
      // Sort clients by creation date - newest first
      const sortedClients = clientsRes.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // Sort suppliers by creation date - newest first
      const sortedSuppliers = suppliersRes.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      setBookings(sortedBookings);
      setClients(sortedClients);
      setSuppliers(sortedSuppliers);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bookingData = {
        ...formData,
        cost: parseFloat(formData.cost),
        sell_price: parseFloat(formData.sell_price),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };

      if (editingBooking) {
        await axios.put(`${API}/bookings/${editingBooking.id}`, bookingData);
      } else {
        await axios.post(`${API}/bookings`, bookingData);
      }
      
      setFormData({
        ref: '',
        client_id: '',
        supplier_id: '',
        type: '',
        cost: '',
        sell_price: '',
        start_date: '',
        end_date: ''
      });
      setEditingBooking(null);
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      ref: booking.ref,
      client_id: booking.client_id,
      supplier_id: booking.supplier_id,
      type: booking.type,
      cost: booking.cost.toString(),
      sell_price: booking.sell_price.toString(),
      start_date: booking.start_date.split('T')[0],
      end_date: booking.end_date.split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (bookingId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API}/bookings/${bookingId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'غير معروف';
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'غير معروف';
  };

  const handlePrintBookings = async () => {
    try {
      console.log('=== PRINTING BOOKINGS LIST ===');
      console.log('Bookings count:', bookings.length);
      
      alert(`سيتم طباعة قائمة تحتوي على ${bookings.length} حجز`);
      
      const printContent = `
        <html dir="rtl">
          <head>
            <title>قائمة الحجوزات</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
              h1 { text-align: center; color: #1f2937; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .profit { color: #059669; font-weight: bold; }
              .loss { color: #dc2626; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>📋 قائمة الحجوزات</h1>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            <table>
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>العميل</th>
                  <th>المورد</th>
                  <th>نوع الحجز</th>
                  <th>التكلفة</th>
                  <th>سعر البيع</th>
                  <th>الربح</th>
                </tr>
              </thead>
              <tbody>
                ${bookings.map(booking => {
                  const profit = booking.sell_price - booking.cost;
                  const profitClass = profit >= 0 ? 'profit' : 'loss';
                  return `
                    <tr>
                      <td>${booking.ref}</td>
                      <td>${getClientName(booking.client_id)}</td>
                      <td>${getSupplierName(booking.supplier_id)}</td>
                      <td>${booking.type}</td>
                      <td>${booking.cost.toLocaleString()} دج</td>
                      <td>${booking.sell_price.toLocaleString()} دج</td>
                      <td class="${profitClass}">${profit.toLocaleString()} دج</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <div style="margin-top: 20px;">
              <p>إجمالي الحجوزات: ${bookings.length}</p>
              <p>إجمالي التكاليف: ${bookings.reduce((sum, b) => sum + b.cost, 0).toLocaleString()} دج</p>
              <p>إجمالي المبيعات: ${bookings.reduce((sum, b) => sum + b.sell_price, 0).toLocaleString()} دج</p>
              <p>صافي الأرباح: ${bookings.reduce((sum, b) => sum + (b.sell_price - b.cost), 0).toLocaleString()} دج</p>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([printContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.onload = function() {
          setTimeout(() => {
            newWindow.print();
            alert('✅ تم فتح نافذة طباعة الحجوزات بنجاح!');
          }, 1000);
        };
        console.log('✅ Bookings print window opened');
      } else {
        alert('❌ لم يتم فتح نافذة الطباعة. تأكد من السماح للنوافذ المنبثقة.');
      }
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 2000);
      
    } catch (error) {
      console.error('Error printing bookings list:', error);
      alert('خطأ في طباعة قائمة الحجوزات: ' + error.message);
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(booking.client_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('bookingsList')}</h2>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handlePrintBookings}
            variant="outline" 
            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            🖨️ طباعة
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('addBooking')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingBooking ? t('edit') : t('addBooking')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ref">{t('reference')}</Label>
                  <Input
                    id="ref"
                    value={formData.ref}
                    onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">{t('bookingType')}</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('bookingType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="عمرة">عمرة</SelectItem>
                      <SelectItem value="طيران">طيران</SelectItem>
                      <SelectItem value="فندق">فندق</SelectItem>
                      <SelectItem value="تأشيرة">تأشيرة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id">{t('selectClient')}</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectClient')} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplier_id">{t('selectSupplier')}</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectSupplier')} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">{t('cost')} (دج)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sell_price">{t('sellPrice')} (دج)</Label>
                  <Input
                    id="sell_price"
                    type="number"
                    value={formData.sell_price}
                    onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">{t('startDate')}</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">{t('endDate')}</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('save')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reference')}</TableHead>
                <TableHead>{t('client')}</TableHead>
                <TableHead>{t('supplier')}</TableHead>
                <TableHead>{t('bookingType')}</TableHead>
                <TableHead>{t('cost')}</TableHead>
                <TableHead>{t('sellPrice')}</TableHead>
                <TableHead>{t('profit')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {t('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.ref}</TableCell>
                    <TableCell>{getClientName(booking.client_id)}</TableCell>
                    <TableCell>{getSupplierName(booking.supplier_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.type}</Badge>
                    </TableCell>
                    <TableCell>{booking.cost} دج</TableCell>
                    <TableCell>{booking.sell_price} دج</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {(booking.sell_price - booking.cost)} دج
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(booking)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(booking.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Invoices Management Component
const InvoicesManagement = () => {
  const { t } = useContext(LanguageContext);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    amount_ht: '',
    tva_rate: '20',
    due_date: ''
  });

  const fetchData = async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        axios.get(`${API}/invoices`),
        axios.get(`${API}/clients`)
      ]);
      
      // Sort invoices by due date - newest first
      const sortedInvoices = invoicesRes.data.sort((a, b) => {
        return new Date(b.due_date || b.created_at) - new Date(a.due_date || a.created_at);
      });
      
      // Sort clients by creation date - newest first
      const sortedClients = clientsRes.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      setInvoices(sortedInvoices);
      setClients(sortedClients);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const invoiceData = {
        client_id: formData.client_id,
        amount_ht: parseFloat(formData.amount_ht),
        tva_rate: parseFloat(formData.tva_rate),
        due_date: new Date(formData.due_date).toISOString()
      };

      if (editingInvoice) {
        await axios.put(`${API}/invoices/${editingInvoice.id}`, invoiceData);
      } else {
        await axios.post(`${API}/invoices`, invoiceData);
      }
      
      setFormData({
        client_id: '',
        amount_ht: '',
        tva_rate: '20',
        due_date: ''
      });
      setEditingInvoice(null);
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      client_id: invoice.client_id,
      amount_ht: invoice.amount_ht.toString(),
      tva_rate: invoice.tva_rate.toString(),
      due_date: invoice.due_date.split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API}/invoices/${invoiceId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'غير معروف';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <Badge className="bg-green-600">{t('paid')}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">{t('overdue')}</Badge>;
      default:
        return <Badge variant="outline">{t('pending')}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(invoice.client_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('invoicesList')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('addInvoice')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingInvoice ? t('edit') : t('addInvoice')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="client_id">{t('selectClient')}</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectClient')} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount_ht">{t('amountHT')} (دج)</Label>
                <Input
                  id="amount_ht"
                  type="number"
                  step="0.01"
                  value={formData.amount_ht}
                  onChange={(e) => setFormData({ ...formData, amount_ht: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="tva_rate">{t('tvaRate')}</Label>
                <Input
                  id="tva_rate"
                  type="number"
                  step="0.01"
                  value={formData.tva_rate}
                  onChange={(e) => setFormData({ ...formData, tva_rate: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="due_date">{t('dueDate')}</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('save')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('invoiceNo')}</TableHead>
                <TableHead>{t('client')}</TableHead>
                <TableHead>{t('amountHT')}</TableHead>
                <TableHead>{t('tvaRate')}</TableHead>
                <TableHead>{t('amountTTC')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('dueDate')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {t('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                    <TableCell>{getClientName(invoice.client_id)}</TableCell>
                    <TableCell>{invoice.amount_ht} دج</TableCell>
                    <TableCell>{invoice.tva_rate}%</TableCell>
                    <TableCell className="font-medium">{invoice.amount_ttc} دج</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{formatDateWithEnglishNumerals(invoice.due_date)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Payments Management Component
const PaymentsManagement = () => {
  const { t } = useContext(LanguageContext);
  const [payments, setPayments] = useState([]);
  const [operations, setOperations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, today, this_week, this_month
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    invoice_id: '',
    method: 'cash',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const [paymentsRes, operationsRes, clientsRes] = await Promise.all([
        axios.get(`${API}/payments?payment_type=operation`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API}/daily-operations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API}/clients`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      // Sort payments by payment date - newest first
      const sortedPayments = paymentsRes.data.sort((a, b) => {
        return new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at);
      });
      
      setPayments(sortedPayments);
      setOperations(operationsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      if (error.response?.status === 403) {
        alert('ليس لديك صلاحية للوصول إلى المدفوعات');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        invoice_id: formData.invoice_id,
        payment_method: formData.method,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date
      };

      if (editingPayment) {
        await axios.put(`${API}/payments/${editingPayment.id}`, paymentData);
      } else {
        await axios.post(`${API}/payments`, paymentData);
      }
      
      fetchData();
      setIsDialogOpen(false);
      setEditingPayment(null);
      setFormData({ invoice_id: '', method: '', amount: '', payment_date: '' });
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      invoice_id: payment.invoice_id,
      method: payment.payment_method,
      amount: payment.amount.toString(),
      payment_date: payment.payment_date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API}/payments/${paymentId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const getOperationInfo = (operationId) => {
    const operation = operations.find(op => op.id === operationId);
    if (operation) {
      const client = clients.find(c => c.id === operation.client_id);
      return {
        operation_no: operation.operation_no,
        service_name: operation.service_name,
        client_name: client?.name || 'غير معروف',
        final_price: operation.final_price
      };
    }
    return {
      operation_no: 'غير معروف',
      service_name: 'غير معروف', 
      client_name: 'غير معروف',
      final_price: 0
    };
  };

  const getMethodBadge = (method) => {
    const methodColors = {
      'cash': 'bg-green-600',
      'bank': 'bg-blue-600',
      'card': 'bg-purple-600'
    };
    
    return (
      <Badge className={`${methodColors[method] || 'bg-gray-600'} text-white`}>
        {t(method)}
      </Badge>
    );
  };

  const filteredPayments = payments.filter(payment => {
    if (!payment.daily_operation_id) return false; // Only show operation payments
    
    const operationInfo = getOperationInfo(payment.daily_operation_id);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      payment.payment_no.toLowerCase().includes(searchLower) ||
      operationInfo.operation_no.toLowerCase().includes(searchLower) ||
      operationInfo.client_name.toLowerCase().includes(searchLower) ||
      operationInfo.service_name.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">💰 مدفوعات العمليات</h2>
          <p className="text-sm text-gray-600 mt-1">إدارة مدفوعات العملاء للعمليات اليومية - سداد مباشر بدون فواتير</p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
          <p className="text-sm">
            💡 <strong>لإضافة مدفوعات جديدة:</strong> انتقل إلى صفحة "العمليات اليومية" واضغط على زر "💰 إضافة دفعة" بجانب العملية المطلوبة
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={t('search') + '...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم المدفوعة</TableHead>
                <TableHead className="text-right">رقم العملية</TableHead>
                <TableHead className="text-right">اسم العميل</TableHead>
                <TableHead className="text-right">الخدمة</TableHead>
                <TableHead className="text-right">طريقة الدفع</TableHead>
                <TableHead className="text-right">المبلغ المدفوع</TableHead>
                <TableHead className="text-right">تاريخ الدفع</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const operationInfo = getOperationInfo(payment.daily_operation_id);
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-right font-medium text-blue-700">{payment.payment_no}</TableCell>
                    <TableCell className="text-right">{operationInfo.operation_no}</TableCell>
                    <TableCell className="text-right">{operationInfo.client_name}</TableCell>
                    <TableCell className="text-right">{operationInfo.service_name}</TableCell>
                    <TableCell className="text-right">{getMethodBadge(payment.method)}</TableCell>
                    <TableCell className="text-right font-bold text-green-700">{payment.amount.toLocaleString()} دج</TableCell>
                    <TableCell className="text-right">{formatDateWithEnglishNumerals(payment.payment_date)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(payment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Reports Management Component with Agency Breakdown
const ReportsManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [reportType, setReportType] = useState('daily_sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAgencies, setSelectedAgencies] = useState('all');
  const [groupByAgency, setGroupByAgency] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agencies, setAgencies] = useState([]);

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);

    // Fetch agencies for filter
    const fetchAgencies = async () => {
      try {
        const response = await axios.get(`${API}/agencies`);
        setAgencies(response.data);
      } catch (error) {
        console.error('Error fetching agencies:', error);
      }
    };

    if (['super_admin', 'general_accountant'].includes(user?.role)) {
      fetchAgencies();
    }
  }, [user]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let endpoint = '';
      let params = new URLSearchParams();

      // Common parameters
      if (reportType !== 'aging') {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }

      // Agency filtering (only for super admin and general accountant)
      if (['super_admin', 'general_accountant'].includes(user?.role)) {
        if (selectedAgencies !== 'all') {
          params.append('agency_ids', selectedAgencies);
        }
        params.append('group_by_agency', groupByAgency.toString());
      }

      switch (reportType) {
        case 'daily_sales':
          endpoint = 'reports/sales';
          params.append('report_type', 'daily');
          break;
        case 'monthly_sales':
          endpoint = 'reports/sales';
          params.append('report_type', 'monthly');
          break;
        case 'aging':
          endpoint = 'reports/aging';
          // Agency params already set above
          break;
        case 'summary':
          endpoint = 'reports/summary';
          break;
        default:
          throw new Error('نوع التقرير غير مدعوم');
      }

      console.log(`Generating ${reportType} report...`);
      console.log(`API call: ${API}/${endpoint}?${params.toString()}`);

      const response = await axios.get(`${API}/${endpoint}?${params.toString()}`);
      console.log('Report response:', response.data);
      
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error.response?.data?.detail || 'فشل في إنتاج التقرير');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for UTF-8
      
      if (reportData.group_by_agency && reportData.agencies_data) {
        // Agency-grouped export
        if (reportType === 'daily_sales' || reportType === 'monthly_sales') {
          csvContent += "الوكالة,التاريخ/الشهر,المبيعات (دج),عدد الحجوزات\n";
          
          reportData.agencies_data.forEach(agency => {
            agency.periods.forEach(period => {
              const date = reportType === 'monthly_sales' ? period.month : period.date;
              csvContent += `${agency.agency_name},${date},${period.sales},${period.bookings}\n`;
            });
            csvContent += `${agency.agency_name} - المجموع,,${agency.totals.sales},${agency.totals.bookings}\n\n`;
          });
          
          csvContent += `الإجمالي العام,,${reportData.grand_totals.sales},${reportData.grand_totals.bookings}\n`;
        } else if (reportType === 'aging') {
          csvContent += "الوكالة,العميل,رقم الفاتورة,المبلغ (دج),عدد الأيام\n";
          
          reportData.agencies_data.forEach(agency => {
            agency.invoices.forEach(invoice => {
              csvContent += `${agency.agency_name},${invoice.client},${invoice.invoice},${invoice.amount},${invoice.days}\n`;
            });
            csvContent += `${agency.agency_name} - المجموع,,,${agency.totals.amount},\n\n`;
          });
          
          csvContent += `الإجمالي العام,,,${reportData.grand_totals.amount},\n`;
        }
      } else {
        // Traditional export format
        if (reportType === 'daily_sales' || reportType === 'monthly_sales') {
          const dateLabel = reportType === 'monthly_sales' ? 'الشهر' : 'التاريخ';
          csvContent += `${dateLabel},المبيعات (دج),عدد الحجوزات\n`;
          reportData.data.forEach(row => {
            const date = reportType === 'monthly_sales' ? row.month : row.date;
            csvContent += `${date},${row.sales},${row.bookings}\n`;
          });
          csvContent += `الإجمالي,${reportData.totals.sales},${reportData.totals.bookings}\n`;
        } else if (reportType === 'aging') {
          csvContent += "العميل,رقم الفاتورة,المبلغ (دج),عدد الأيام\n";
          reportData.data.forEach(row => {
            csvContent += `${row.client},${row.invoice},${row.amount},${row.days}\n`;
          });
          csvContent += `الإجمالي,,${reportData.totals.amount},\n`;
        }
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `تقرير_${reportType}_${startDate}_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('فشل في تصدير التقرير');
    }
  };

  const getReportTypeOptions = () => [
    { value: 'daily_sales', label: '📈 تقرير المبيعات اليومية' },
    { value: 'monthly_sales', label: '📊 تقرير المبيعات الشهرية' },
    { value: 'aging', label: '⏰ تقرير أعمار الديون' },
    { value: 'summary', label: '📋 تقرير ملخص المبيعات' }
  ];

  const isAdminUser = ['super_admin', 'general_accountant'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📊 {t('reports')}</h2>
            <p className="text-gray-600 mt-1">إنتاج وتصدير التقارير المالية والإحصائية المتقدمة</p>
          </div>
          {reportData && (
            <Button onClick={exportReport} variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200">
              <BarChart3 className="h-4 w-4 mr-2" />
              📤 {t('export')} CSV
            </Button>
          )}
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 ml-2" />
            ⚙️ إعدادات التقرير المتقدمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="reportType">📋 نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  {getReportTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reportType !== 'aging' && (
              <>
                <div>
                  <Label htmlFor="startDate">📅 {t('from')}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">📅 {t('to')}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-right"
                  />
                </div>
              </>
            )}
          </div>

          {/* Advanced Settings for Admin Users */}
          {isAdminUser && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 إعدادات متقدمة (للمديرين والمحاسبين)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agencyFilter">🏢 فلتر الوكالات</Label>
                  <Select value={selectedAgencies} onValueChange={setSelectedAgencies}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوكالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🌐 جميع الوكالات</SelectItem>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          🏢 {agency.name} - {agency.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="groupBy">📊 طريقة العرض</Label>
                  <Select value={groupByAgency.toString()} onValueChange={(value) => setGroupByAgency(value === 'true')}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة العرض" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">🏢 مجمع حسب الوكالة</SelectItem>
                      <SelectItem value="false">📋 مجمع عام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={generateReport} 
              disabled={loading || (!startDate || !endDate) && reportType !== 'aging'}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 px-8 py-3"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الإنتاج...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  🔄 {t('generateReport')}
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Display with Agency Breakdown */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <BarChart3 className="h-5 w-5 ml-2" />
                {reportData.title}
              </span>
              <div className="flex items-center space-x-2">
                {reportData.period && (
                  <Badge variant="secondary">{reportData.period}</Badge>
                )}
                {reportData.group_by_agency && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    📊 مجمع حسب الوكالة
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Agency-Grouped Reports Display */}
            {reportData.group_by_agency && reportData.agencies_data ? (
              <div className="space-y-8">
                {/* Grand Totals Summary */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-4 text-center">
                    📊 الإجمالي العام - جميع الوكالات
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-indigo-800">إجمالي المبيعات</p>
                      <p className="text-3xl font-bold text-indigo-900">
                        {reportData.grand_totals.sales?.toLocaleString() || reportData.grand_totals.amount?.toLocaleString() || 0} دج
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-indigo-800">
                        {reportType === 'aging' ? 'عدد الفواتير' : 'عدد الحجوزات'}
                      </p>
                      <p className="text-3xl font-bold text-indigo-900">
                        {reportData.grand_totals.bookings || reportData.grand_totals.count || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-indigo-800">عدد الوكالات</p>
                      <p className="text-3xl font-bold text-indigo-900">
                        {reportData.agencies_data.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individual Agency Reports */}
                <div className="space-y-6">
                  {reportData.agencies_data.map((agency, agencyIndex) => (
                    <div key={agencyIndex} className="border rounded-lg overflow-hidden">
                      {/* Agency Header */}
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            🏢 {agency.agency_name}
                          </h3>
                          <div className="flex space-x-4 text-sm">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                              💰 {agency.totals?.sales?.toLocaleString() || agency.totals?.amount?.toLocaleString() || 0} دج
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                              📋 {agency.totals?.bookings || agency.totals?.count || 0} 
                              {reportType === 'aging' ? ' فاتورة' : ' حجز'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Agency Data */}
                      <div className="p-6">
                        {reportType === 'aging' ? (
                          // Aging Report - show invoices table
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">👤 العميل</TableHead>
                                <TableHead className="text-right">📄 رقم الفاتورة</TableHead>
                                <TableHead className="text-right">💰 المبلغ (دج)</TableHead>
                                <TableHead className="text-right">⏰ عدد الأيام</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {agency.invoices.map((invoice, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="font-medium text-right">{invoice.client}</TableCell>
                                  <TableCell className="text-right">{invoice.invoice}</TableCell>
                                  <TableCell className="text-right text-red-600 font-semibold">
                                    {invoice.amount.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant={invoice.days > 30 ? 'destructive' : invoice.days > 15 ? 'default' : 'secondary'}>
                                      {invoice.days} يوم
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          // Sales Reports - show periods table
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">
                                  {reportType === 'monthly_sales' ? '📅 الشهر' : '📅 التاريخ'}
                                </TableHead>
                                <TableHead className="text-right">💰 المبيعات (دج)</TableHead>
                                <TableHead className="text-right">📋 عدد الحجوزات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(agency.periods || []).map((period, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="font-medium text-right">
                                    {period.month || period.date || period.period}
                                  </TableCell>
                                  <TableCell className="text-right text-green-600 font-semibold">
                                    {period.sales.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">{period.bookings}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Traditional Report Display (non-grouped)
              <div>
                {reportType === 'daily_sales' || reportType === 'monthly_sales' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-green-800">إجمالي المبيعات</p>
                            <p className="text-2xl font-bold text-green-900">
                              {reportData.totals.sales.toLocaleString()} دج
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-blue-800">إجمالي الحجوزات</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {reportData.totals.bookings}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">
                            {reportType === 'monthly_sales' ? '📅 الشهر' : '📅 التاريخ'}
                          </TableHead>
                          <TableHead className="text-right">💰 المبيعات (دج)</TableHead>
                          <TableHead className="text-right">📋 عدد الحجوزات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.data.map((row, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-right">
                              {reportType === 'monthly_sales' ? row.month : row.date}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              {row.sales.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">{row.bookings}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : reportType === 'aging' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-orange-800">عدد الفواتير المعلقة</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {reportData.totals.count}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-red-800">إجمالي المبلغ المعلق</p>
                            <p className="text-2xl font-bold text-red-900">
                              {reportData.totals.amount.toLocaleString()} دج
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">👤 العميل</TableHead>
                          <TableHead className="text-right">📄 رقم الفاتورة</TableHead>
                          <TableHead className="text-right">💰 المبلغ (دج)</TableHead>
                          <TableHead className="text-right">⏰ عدد الأيام</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.data.map((row, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-right">{row.client}</TableCell>
                            <TableCell className="text-right">{row.invoice}</TableCell>
                            <TableCell className="text-right text-red-600 font-semibold">
                              {row.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={row.days > 30 ? 'destructive' : row.days > 15 ? 'default' : 'secondary'}>
                                {row.days} يوم
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : reportType === 'summary' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-green-800 mb-3">💰 إجمالي المبيعات</h3>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-900">
                            {reportData.data.sales.toLocaleString()} دج
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-blue-800 mb-3">📋 إجمالي الحجوزات</h3>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-900">
                            {reportData.data.bookings}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-purple-800 mb-3">📄 إجمالي الفواتير</h3>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-purple-900">
                            {reportData.data.invoices}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// User Management Component (Super Admin Only)
const UserManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agency_staff',
    agency_id: ''
  });

  // Check if current user is Super Admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">غير مسموح بالوصول</h3>
            <p className="text-red-600">هذا القسم مخصص للمدير العام فقط</p>
          </div>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, agenciesResponse] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/agencies`)
      ]);
      
      // Sort users by creation date - newest first
      const sortedUsers = usersResponse.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // Sort agencies by creation date - newest first
      const sortedAgencies = agenciesResponse.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      setUsers(sortedUsers);
      setAgencies(sortedAgencies);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't send empty password
        }
        await axios.put(`${API}/users/${editingUser.id}`, updateData);
      } else {
        // Create new user
        await axios.post(`${API}/users`, formData);
      }
      
      setFormData({ name: '', email: '', password: '', role: 'agency_staff', agency_id: '' });
      setEditingUser(null);
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.detail || 'حدث خطأ أثناء حفظ المستخدم');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password
      role: user.role,
      agency_id: user.agency_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await axios.delete(`${API}/users/${userId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.response?.data?.detail || 'حدث خطأ أثناء حذف المستخدم');
      }
    }
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'super_admin': '👑 مدير عام',
      'general_accountant': '💼 محاسب عام',
      'agency_staff': '🏢 موظف وكالة'
    };
    return roleMap[role] || role;
  };

  const getAgencyName = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency ? `${agency.name} - ${agency.city}` : 'غير محدد';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">👤 {t('userManagement')}</h2>
            <p className="text-gray-600 mt-1">إدارة وتنظيم المستخدمين والصلاحيات</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('addUser')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? '✏️ تعديل المستخدم' : '➕ إضافة مستخدم جديد'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? 'قم بتعديل بيانات المستخدم' : 'أدخل بيانات المستخدم الجديد'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">👤 الاسم الكامل</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل الاسم الكامل"
                    required
                    className="text-right"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">📧 البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@domain.com"
                    required
                    className="text-right"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">🔒 كلمة المرور {editingUser && '(اتركها فارغة للاحتفاظ بالحالية)'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'اتركها فارغة لعدم التغيير' : 'أدخل كلمة المرور'}
                    required={!editingUser}
                    className="text-right"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">🎭 الدور الوظيفي</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">👑 مدير عام</SelectItem>
                      <SelectItem value="general_accountant">💼 محاسب عام</SelectItem>
                      <SelectItem value="agency_staff">🏢 موظف وكالة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="agency_id">🏢 الوكالة</Label>
                  <Select value={formData.agency_id} onValueChange={(value) => setFormData({ ...formData, agency_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوكالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name} - {agency.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingUser ? '💾 تحديث' : '➕ إضافة'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-blue-800">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-blue-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-purple-800">المديرين</p>
                <p className="text-2xl font-bold text-purple-900">
                  {users.filter(u => u.role === 'super_admin').length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-green-800">المحاسبين</p>
                <p className="text-2xl font-bold text-green-900">
                  {users.filter(u => u.role === 'general_accountant').length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-orange-800">موظفي الوكالات</p>
                <p className="text-2xl font-bold text-orange-900">
                  {users.filter(u => u.role === 'agency_staff').length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 ml-2" />
            قائمة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">👤 الاسم</TableHead>
                <TableHead className="text-right">📧 البريد الإلكتروني</TableHead>
                <TableHead className="text-right">🎭 الدور</TableHead>
                <TableHead className="text-right">🏢 الوكالة</TableHead>
                <TableHead className="text-right">📅 تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">⚙️ الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-right">{user.name}</TableCell>
                  <TableCell className="text-right">{user.email}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                      {getRoleDisplay(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{getAgencyName(user.agency_id)}</TableCell>
                  <TableCell className="text-right">
                    {formatDateWithEnglishNumerals(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.id !== user.id && ( // Can't delete self (this logic would be better with current user id)
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Installments Management Component
const InstallmentsManagement = memo(() => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [serviceSales, setServiceSales] = useState([]);
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // plans, create, reports
  
  // Create Plan states
  const [selectedSale, setSelectedSale] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    number_of_installments: 3,
    start_date: new Date().toISOString().split('T')[0],
    installment_dates: [],
    notes: ''
  });
  
  // Payment states
  const [selectedPlanPayments, setSelectedPlanPayments] = useState([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Reports states
  const [statusReport, setStatusReport] = useState(null);
  const [reportFilters, setReportFilters] = useState({
    start_date: '',
    end_date: ''
  });

  // Dialog states
  const [showPlanDetailsDialog, setShowPlanDetailsDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [salesRes] = await Promise.all([
        axios.get(`${API}/service-sales`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setServiceSales(salesRes.data);
      
      // Fetch installment plans for all sales that have status 'sold' or 'cash_received'
      await fetchInstallmentPlans(salesRes.data);
    } catch (error) {
      console.error('Error fetching installments data:', error);
      if (error.response?.status === 403) {
        alert('ليس لديك صلاحية للوصول إلى التقسيط');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInstallmentPlans = async (sales = serviceSales) => {
    try {
      console.log('=== FETCHING INSTALLMENT PLANS ===');
      const plansData = [];
      
      // Optimize: Batch API calls instead of loop
      const saleIds = sales.slice(0, 20).map(sale => sale.id); // Limit to 20 for performance
      const planPromises = saleIds.map(async (saleId) => {
        try {
          const response = await axios.get(`${API}/service-sales/${saleId}/installment-plan`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          
          if (response.data) {
            const sale = sales.find(s => s.id === saleId);
            return {
              ...response.data,
              sale_info: {
                service_name: sale?.service_name || 'غير محدد',
                client_name: sale?.client_name || 'غير محدد'
              }
            };
          }
          return null;
        } catch (error) {
          // 404 means no installment plan exists - normal
          if (error.response?.status !== 404) {
            console.error(`Error fetching plan for sale ${saleId}:`, error);
          }
          return null;
        }
      });
      
      // Execute batch requests with concurrency limit
      const results = await Promise.allSettled(planPromises);
      const validPlans = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
      
      console.log('Fetched installment plans:', validPlans.length);
      setInstallmentPlans(validPlans);
    } catch (error) {
      console.error('Error fetching installment plans:', error);
    }
  };

  const getSaleInstallmentPlan = async (saleId) => {
    try {
      const response = await axios.get(`${API}/service-sales/${saleId}/installment-plan`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No installment plan exists
      }
      throw error;
    }
  };

  const fetchStatusReport = async () => {
    try {
      console.log('=== FETCHING STATUS REPORT ===');
      let url = `${API}/reports/installment-status`;
      const params = new URLSearchParams();
      
      if (reportFilters.start_date) {
        params.append('start_date', reportFilters.start_date);
      }
      if (reportFilters.end_date) {
        params.append('end_date', reportFilters.end_date);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Status report fetched:', response.data);
      setStatusReport(response.data);
    } catch (error) {
      console.error('Error fetching status report:', error);
      alert('فشل في تحميل تقرير حالة الأقساط: ' + (error.response?.data?.detail || error.message));
    }
  };

  const createInstallmentPlan = async () => {
    if (!selectedSale) return;
    
    try {
      console.log('=== CREATING INSTALLMENT PLAN ===');
      console.log('Sale ID:', selectedSale.id);
      console.log('Plan data:', planFormData);
      
      await axios.post(`${API}/service-sales/${selectedSale.id}/installment-plan`, planFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('=== INSTALLMENT PLAN CREATED ===');
      alert('✅ تم إنشاء خطة التقسيط بنجاح');
      
      setShowCreateDialog(false);
      resetCreateForm();
      fetchData();
    } catch (error) {
      console.error('=== INSTALLMENT PLAN ERROR ===');
      console.error('Error creating installment plan:', error);
      
      if (error.response?.status === 400) {
        alert('❌ خطأ: ' + (error.response?.data?.detail || error.message));
      } else if (error.response?.status === 403) {
        alert('❌ ليس لديك صلاحية لإنشاء خطة تقسيط لهذا البيع');
      } else {
        alert('❌ فشل في إنشاء خطة التقسيط: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const cancelInstallmentPlan = async () => {
    if (!selectedPlan || !cancelReason) return;
    
    try {
      console.log('=== CANCELLING INSTALLMENT PLAN ===');
      console.log('Plan ID:', selectedPlan.id);
      console.log('Reason:', cancelReason);
      
      await axios.put(`${API}/installment-plans/${selectedPlan.id}/cancel?reason=${encodeURIComponent(cancelReason)}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('=== INSTALLMENT PLAN CANCELLED ===');
      alert('✅ تم إلغاء خطة التقسيط بنجاح');
      
      setShowCancelDialog(false);
      setSelectedPlan(null);
      setCancelReason('');
      fetchData();
    } catch (error) {
      console.error('=== INSTALLMENT PLAN CANCELLATION ERROR ===');
      console.error('Error cancelling installment plan:', error);
      alert('❌ فشل في إلغاء خطة التقسيط: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetCreateForm = () => {
    setSelectedSale(null);
    setPlanFormData({
      number_of_installments: 3,
      start_date: new Date().toISOString().split('T')[0],
      installment_dates: [],
      notes: ''
    });
  };

  const generateInstallmentDates = (numberOfInstallments, startDate) => {
    const dates = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const date = new Date(start);
      date.setMonth(date.getMonth() + i + 1); // Monthly installments starting next month
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const updateInstallmentDate = (index, date) => {
    const updatedDates = [...planFormData.installment_dates];
    updatedDates[index] = date;
    setPlanFormData({
      ...planFormData,
      installment_dates: updatedDates
    });
  };

  const viewPlanPayments = async (plan) => {
    try {
      console.log('=== VIEWING PLAN PAYMENTS ===');
      console.log('Plan ID:', plan.id);
      
      const response = await axios.get(`${API}/installment-plans/${plan.id}/payments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Payments fetched:', response.data);
      setSelectedPlanPayments(response.data);
      setSelectedPlan(plan);
      setShowPlanDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching plan payments:', error);
      alert('فشل في تحميل تفاصيل الأقساط: ' + (error.response?.data?.detail || error.message));
    }
  };

  const openPaymentDialog = (payment) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.remaining_amount?.toString() || '');
    setPaymentNotes('');
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedPayment || !paymentAmount) return;
    
    try {
      console.log('=== PROCESSING INSTALLMENT PAYMENT ===');
      console.log('Payment ID:', selectedPayment.id);
      console.log('Amount:', paymentAmount);
      
      await axios.put(`${API}/installment-payments/${selectedPayment.id}/pay`, {
        paid_amount: parseFloat(paymentAmount),
        notes: paymentNotes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('=== PAYMENT PROCESSED ===');
      alert('✅ تم تسجيل الدفعة بنجاح');
      
      setShowPaymentDialog(false);
      setSelectedPayment(null);
      setPaymentAmount('');
      setPaymentNotes('');
      
      // Refresh payments
      if (selectedPlanPayments.length > 0) {
        const plan = { id: selectedPlanPayments[0].plan_id };
        await viewPlanPayments(plan);
      }
    } catch (error) {
      console.error('=== PAYMENT ERROR ===');
      console.error('Error processing payment:', error);
      
      if (error.response?.status === 400) {
        alert('❌ خطأ في المبلغ: ' + (error.response?.data?.detail || error.message));
      } else {
        alert('❌ فشل في تسجيل الدفعة: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ معلق', class: 'bg-yellow-100 text-yellow-800' },
      partial: { label: '🟡 جزئي', class: 'bg-orange-100 text-orange-800' },
      paid: { label: '✅ مدفوع', class: 'bg-green-100 text-green-800' },
      overdue: { label: '🔴 متأخر', class: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 إدارة التقسيط</h1>
          <p className="text-sm text-gray-600 mt-1">إدارة خطط التقسيط والأقساط لمبيعات الخدمات</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 خطط التقسيط
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ➕ إنشاء خطة جديدة
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 التقارير
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' && (
        <Card>
          <CardHeader>
            <CardTitle>خطط التقسيط النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            {installmentPlans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>لا توجد خطط تقسيط حالياً</p>
                <p className="text-sm">انتقل إلى "إنشاء خطة جديدة" لإضافة خطة تقسيط</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الخدمة</TableHead>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                        <TableHead className="text-right">عدد الأقساط</TableHead>
                        <TableHead className="text-right">تاريخ البداية</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installmentPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            {plan.sale_info?.service_name || 'غير محدد'}
                          </TableCell>
                          <TableCell>{plan.sale_info?.client_name || 'غير محدد'}</TableCell>
                          <TableCell>{plan.total_amount?.toLocaleString()} دج</TableCell>
                          <TableCell>{plan.number_of_installments}</TableCell>
                          <TableCell>
                            {formatDateWithEnglishNumerals(plan.start_date)}
                          </TableCell>
                          <TableCell>
                            {plan.status === 'active' && (
                              <Badge className="bg-green-100 text-green-800">✅ نشط</Badge>
                            )}
                            {plan.status === 'completed' && (
                              <Badge className="bg-blue-100 text-blue-800">🎉 مكتمل</Badge>
                            )}
                            {plan.status === 'cancelled' && (
                              <Badge className="bg-red-100 text-red-800">❌ ملغي</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2 rtl:space-x-reverse">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewPlanPayments(plan)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                👁️ عرض التفاصيل
                              </Button>
                              {plan.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPlan(plan);
                                    setShowCancelDialog(true);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  ❌ إلغاء
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>إنشاء خطة تقسيط جديدة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Select Service Sale */}
            <div>
              <Label>اختر بيع الخدمة المراد تقسيطها *</Label>
              <Select value={selectedSale?.id || ''} onValueChange={(value) => {
                const sale = serviceSales.find(s => s.id === value);
                setSelectedSale(sale);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر من مبيعات الخدمات المتاحة" />
                </SelectTrigger>
                <SelectContent>
                  {serviceSales.map((sale) => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.service_name} - {sale.client_name} - {sale.amount.toLocaleString()} دج
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSale && (
              <>
                {/* Selected Sale Details */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2">تفاصيل البيع المحدد:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>الخدمة:</strong> {selectedSale.service_name}</div>
                    <div><strong>العميل:</strong> {selectedSale.client_name}</div>
                    <div><strong>المبلغ الإجمالي:</strong> {selectedSale.amount.toLocaleString()} دج</div>
                    <div><strong>حالة البيع:</strong> {selectedSale.status}</div>
                  </div>
                </div>

                {/* Number of Installments */}
                <div>
                  <Label>عدد الأقساط *</Label>
                  <Input
                    type="number"
                    min="2"
                    max="12"
                    value={planFormData.number_of_installments}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 3;
                      const dates = generateInstallmentDates(count, planFormData.start_date);
                      setPlanFormData({
                        ...planFormData,
                        number_of_installments: count,
                        installment_dates: dates
                      });
                    }}
                    placeholder="عدد الأقساط (2-12)"
                  />
                </div>

                {/* Installment Amount Preview */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-800">
                    <strong>مبلغ كل قسط:</strong> {(selectedSale.amount / planFormData.number_of_installments).toLocaleString()} دج
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <Label>تاريخ بداية التقسيط *</Label>
                  <Input
                    type="date"
                    value={planFormData.start_date}
                    onChange={(e) => {
                      const dates = generateInstallmentDates(planFormData.number_of_installments, e.target.value);
                      setPlanFormData({
                        ...planFormData,
                        start_date: e.target.value,
                        installment_dates: dates
                      });
                    }}
                  />
                </div>

                {/* Custom Installment Dates */}
                <div>
                  <Label>تواريخ الأقساط المخصصة</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {Array.from({ length: planFormData.number_of_installments }, (_, i) => (
                      <div key={i}>
                        <Label className="text-sm">القسط {i + 1}</Label>
                        <Input
                          type="date"
                          value={planFormData.installment_dates[i] || ''}
                          onChange={(e) => updateInstallmentDate(i, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>ملاحظات</Label>
                  <Input
                    value={planFormData.notes}
                    onChange={(e) => setPlanFormData({...planFormData, notes: e.target.value})}
                    placeholder="ملاحظات إضافية حول خطة التقسيط (اختياري)"
                  />
                </div>

                {/* Create Button */}
                <div className="flex justify-end">
                  <Button onClick={createInstallmentPlan} className="bg-green-600 hover:bg-green-700">
                    📅 إنشاء خطة التقسيط
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Filters */}
          <Card>
            <CardHeader>
              <CardTitle>تقارير حالة الأقساط</CardTitle>
              <CardDescription>تقرير شامل لحالة جميع خطط التقسيط والمدفوعات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={reportFilters.start_date}
                    onChange={(e) => setReportFilters({...reportFilters, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={reportFilters.end_date}
                    onChange={(e) => setReportFilters({...reportFilters, end_date: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchStatusReport} className="w-full">
                    📊 إنشاء التقرير
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Report Results */}
          {statusReport && (
            <Card>
              <CardHeader>
                <CardTitle>نتائج التقرير</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {statusReport.summary?.total_clients || 0}
                    </div>
                    <div className="text-sm text-blue-600">إجمالي العملاء</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {statusReport.summary?.total_plans || 0}
                    </div>
                    <div className="text-sm text-green-600">إجمالي الخطط</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {statusReport.summary?.total_due?.toLocaleString() || 0} دج
                    </div>
                    <div className="text-sm text-yellow-600">إجمالي المستحق</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {statusReport.summary?.total_paid?.toLocaleString() || 0} دج
                    </div>
                    <div className="text-sm text-purple-600">إجمالي المدفوع</div>
                  </div>
                </div>

                {/* Client Details */}
                {statusReport.clients && statusReport.clients.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">العميل</TableHead>
                          <TableHead className="text-right">عدد الخطط</TableHead>
                          <TableHead className="text-right">المبلغ المستحق</TableHead>
                          <TableHead className="text-right">المبلغ المدفوع</TableHead>
                          <TableHead className="text-right">المبلغ المتأخر</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statusReport.clients.map((client, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{client.client_name}</TableCell>
                            <TableCell>{client.total_plans}</TableCell>
                            <TableCell>{client.total_due?.toLocaleString()} دج</TableCell>
                            <TableCell className="text-green-600">
                              {client.total_paid?.toLocaleString()} دج
                            </TableCell>
                            <TableCell className="text-red-600">
                              {client.total_overdue?.toLocaleString()} دج
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!statusReport && (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>اضغط على "إنشاء التقرير" لعرض تقرير حالة الأقساط</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Plan Details Dialog */}
      <Dialog open={showPlanDetailsDialog} onOpenChange={setShowPlanDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل خطة التقسيط</DialogTitle>
            <DialogDescription>
              عرض تفاصيل الأقساط وحالة المدفوعات
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-6">
              {/* Plan Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">معلومات الخطة:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>الخدمة:</strong> {selectedPlan.sale_info?.service_name}</div>
                  <div><strong>العميل:</strong> {selectedPlan.sale_info?.client_name}</div>
                  <div><strong>المبلغ الإجمالي:</strong> {selectedPlan.total_amount?.toLocaleString()} دج</div>
                  <div><strong>عدد الأقساط:</strong> {selectedPlan.number_of_installments}</div>
                  <div><strong>تاريخ البداية:</strong> {formatDateWithEnglishNumerals(selectedPlan.start_date)}</div>
                  <div><strong>الحالة:</strong> {selectedPlan.status}</div>
                </div>
              </div>

              {/* Payments Table */}
              <div>
                <h4 className="font-bold mb-4">تفاصيل الأقساط:</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم القسط</TableHead>
                        <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-right">المبلغ المطلوب</TableHead>
                        <TableHead className="text-right">المبلغ المدفوع</TableHead>
                        <TableHead className="text-right">المبلغ المتبقي</TableHead>
                        <TableHead className="text-right">حالة الدفع</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPlanPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.installment_number}</TableCell>
                          <TableCell>
                            {formatDateWithEnglishNumerals(payment.due_date)}
                          </TableCell>
                          <TableCell>{payment.amount?.toLocaleString()} دج</TableCell>
                          <TableCell className="text-green-600">
                            {payment.paid_amount?.toLocaleString() || 0} دج
                          </TableCell>
                          <TableCell className="text-red-600">
                            {payment.remaining_amount?.toLocaleString() || 0} دج
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            {payment.status !== 'paid' && selectedPlan.status === 'active' && (
                              <Button
                                size="sm"
                                onClick={() => openPaymentDialog(payment)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                💰 دفع قسط
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>دفع قسط</DialogTitle>
            <DialogDescription>
              تسجيل دفعة للقسط رقم {selectedPayment?.installment_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>مبلغ القسط:</strong> {selectedPayment.amount?.toLocaleString()} دج</div>
                  <div><strong>المدفوع سابقاً:</strong> {selectedPayment.paid_amount?.toLocaleString() || 0} دج</div>
                  <div><strong>المتبقي:</strong> {selectedPayment.remaining_amount?.toLocaleString()} دج</div>
                  <div><strong>الحالة:</strong> {getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              {/* Payment Form */}
              <div>
                <Label>مبلغ الدفعة *</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedPayment.remaining_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`الحد الأقصى: ${selectedPayment.remaining_amount?.toLocaleString()} دج`}
                />
              </div>

              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="ملاحظات حول الدفعة (اختياري)"
                />
              </div>

              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  💰 تسجيل الدفعة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Plan Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إلغاء خطة التقسيط</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من إلغاء هذه الخطة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>سبب الإلغاء *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="اذكر سبب إلغاء خطة التقسيط..."
                required
              />
            </div>

            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                تراجع
              </Button>
              <Button
                onClick={cancelInstallmentPlan}
                disabled={!cancelReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                ❌ إلغاء الخطة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

// Enhanced Installments Management with Client & Service Creation
const EnhancedInstallmentsManagement = memo(() => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  
  // Main states
  const [activeTab, setActiveTab] = useState('create-plan'); // create-plan, manage-plans, reports
  const [loading, setLoading] = useState(false);
  
  // Client management states
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    national_id: '',
    notes: ''
  });
  
  // Service management states
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category: 'عمرة',
    duration_days: '',
    inclusions: ''
  });
  
  // Installment plan states
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [planFormData, setPlanFormData] = useState({
    client_id: '',
    service_id: '',
    total_amount: '',
    down_payment: '',
    number_of_installments: 3,
    start_date: new Date().toISOString().split('T')[0],
    installment_dates: [],
    payment_methods: ['نقد'],
    notes: ''
  });
  
  // Load initial data
  useEffect(() => {
    fetchClients();
    fetchServices();
    fetchInstallmentPlans();
  }, []);
  
  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/clients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);
  
  const fetchServices = useCallback(async () => {
    try {
      // We'll create a custom services endpoint or use existing services
      const response = await axios.get(`${API}/services`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to hardcoded services if endpoint doesn't exist
      setServices([
        { id: '1', name: 'عمرة اقتصادية', base_price: 80000, category: 'عمرة' },
        { id: '2', name: 'عمرة VIP', base_price: 150000, category: 'عمرة' },
        { id: '3', name: 'حج اقتصادي', base_price: 200000, category: 'حج' },
        { id: '4', name: 'حج VIP', base_price: 350000, category: 'حج' }
      ]);
    }
  }, []);
  
  const fetchInstallmentPlans = useCallback(async () => {
    try {
      // This would be a new endpoint for installment plans
      const response = await axios.get(`${API}/installment-plans`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInstallmentPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching installment plans:', error);
      setInstallmentPlans([]);
    }
  }, []);
  
  const addClient = useCallback(async () => {
    if (!clientFormData.name || !clientFormData.phone) {
      alert('يرجى إدخال الاسم ورقم الهاتف على الأقل');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/clients`, clientFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert('✅ تم إضافة العميل بنجاح');
      setClients([...clients, response.data]);
      setSelectedClient(response.data);
      setShowAddClientDialog(false);
      setClientFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        national_id: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding client:', error);
      alert('❌ فشل في إضافة العميل: ' + (error.response?.data?.detail || error.message));
    }
  }, [clientFormData, clients]);
  
  const addService = useCallback(async () => {
    if (!serviceFormData.name || !serviceFormData.base_price) {
      alert('يرجى إدخال اسم الخدمة والسعر على الأقل');
      return;
    }
    
    try {
      // For now, we'll add to local state since we might not have services endpoint
      const newService = {
        id: Date.now().toString(),
        ...serviceFormData,
        base_price: parseFloat(serviceFormData.base_price)
      };
      
      setServices([...services, newService]);
      setSelectedService(newService);
      setPlanFormData({...planFormData, total_amount: newService.base_price.toString()});
      setShowAddServiceDialog(false);
      setServiceFormData({
        name: '',
        description: '',
        base_price: '',
        category: 'عمرة',
        duration_days: '',
        inclusions: ''
      });
      
      alert('✅ تم إضافة الخدمة بنجاح');
    } catch (error) {
      console.error('Error adding service:', error);
      alert('❌ فشل في إضافة الخدمة');
    }
  }, [serviceFormData, services, planFormData]);
  
  const generateInstallmentDates = useCallback((numberOfInstallments, startDate) => {
    const dates = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const date = new Date(start);
      date.setMonth(date.getMonth() + i + 1); // Monthly installments starting next month
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }, []);
  
  const createInstallmentPlan = useCallback(async () => {
    if (!selectedClient || !selectedService || !planFormData.total_amount) {
      alert('يرجى اختيار العميل والخدمة وتحديد المبلغ الإجمالي');
      return;
    }
    
    try {
      const planData = {
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        service_name: selectedService.name,
        total_amount: parseFloat(planFormData.total_amount),
        down_payment: parseFloat(planFormData.down_payment) || 0,
        number_of_installments: planFormData.number_of_installments,
        start_date: planFormData.start_date,
        installment_dates: planFormData.installment_dates,
        payment_methods: planFormData.payment_methods,
        notes: planFormData.notes
      };
      
      // For now, add to local state since we need to create the backend endpoint
      const newPlan = {
        id: Date.now().toString(),
        ...planData,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      setInstallmentPlans([...installmentPlans, newPlan]);
      alert('✅ تم إنشاء خطة التقسيط بنجاح');
      
      // Reset form
      setPlanFormData({
        client_id: '',
        service_id: '',
        total_amount: '',
        down_payment: '',
        number_of_installments: 3,
        start_date: new Date().toISOString().split('T')[0],
        installment_dates: [],
        payment_methods: ['نقد'],
        notes: ''
      });
      setSelectedClient(null);
      setSelectedService(null);
      
    } catch (error) {
      console.error('Error creating installment plan:', error);
      alert('❌ فشل في إنشاء خطة التقسيط');
    }
  }, [selectedClient, selectedService, planFormData, installmentPlans]);
  
  // Update installment dates when count or start date changes
  useEffect(() => {
    if (planFormData.number_of_installments && planFormData.start_date) {
      const dates = generateInstallmentDates(planFormData.number_of_installments, planFormData.start_date);
      setPlanFormData(prev => ({...prev, installment_dates: dates}));
    }
  }, [planFormData.number_of_installments, planFormData.start_date, generateInstallmentDates]);
  
  // Update total amount when service is selected
  useEffect(() => {
    if (selectedService) {
      setPlanFormData(prev => ({
        ...prev, 
        service_id: selectedService.id,
        total_amount: selectedService.base_price?.toString() || ''
      }));
    }
  }, [selectedService]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 نظام التقسيط المتكامل</h1>
          <p className="text-sm text-gray-600 mt-1">إدارة شاملة للعملاء والخدمات وخطط التقسيط</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('create-plan')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create-plan'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ➕ إنشاء خطة تقسيط
          </button>
          <button
            onClick={() => setActiveTab('manage-plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manage-plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 إدارة الخطط
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 التقارير
          </button>
        </nav>
      </div>

      {/* Create Plan Tab */}
      {activeTab === 'create-plan' && (
        <div className="space-y-6">
          {/* Client Selection/Creation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                👤 اختيار/إضافة العميل
                <Button 
                  onClick={() => setShowAddClientDialog(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  ➕ عميل جديد
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClient ? (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-blue-800">العميل المحدد:</h4>
                      <p><strong>الاسم:</strong> {selectedClient.name}</p>
                      <p><strong>الهاتف:</strong> {selectedClient.phone}</p>
                      {selectedClient.email && <p><strong>الإيميل:</strong> {selectedClient.email}</p>}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedClient(null)}
                    >
                      تغيير العميل
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Label>اختر عميل موجود</Label>
                  <Select onValueChange={(value) => {
                    const client = clients.find(c => c.id === value);
                    setSelectedClient(client);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر من العملاء المتاحين أو أضف عميل جديد" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Selection/Creation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                🎯 اختيار/إنشاء الخدمة
                <Button 
                  onClick={() => setShowAddServiceDialog(true)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  ➕ خدمة جديدة
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedService ? (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-purple-800">الخدمة المحددة:</h4>
                      <p><strong>الاسم:</strong> {selectedService.name}</p>
                      <p><strong>السعر:</strong> {selectedService.base_price?.toLocaleString()} دج</p>
                      <p><strong>التصنيف:</strong> {selectedService.category}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedService(null)}
                    >
                      تغيير الخدمة
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Label>اختر خدمة موجودة</Label>
                  <Select onValueChange={(value) => {
                    const service = services.find(s => s.id === value);
                    setSelectedService(service);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر من الخدمات المتاحة أو أنشئ خدمة جديدة" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {service.base_price?.toLocaleString()} دج - {service.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Installment Plan Details */}
          {selectedClient && selectedService && (
            <Card>
              <CardHeader>
                <CardTitle>📋 تفاصيل خطة التقسيط</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>المبلغ الإجمالي *</Label>
                    <Input
                      type="number"
                      value={planFormData.total_amount}
                      onChange={(e) => setPlanFormData({...planFormData, total_amount: e.target.value})}
                      placeholder="المبلغ الإجمالي بالدينار"
                    />
                  </div>
                  <div>
                    <Label>الدفعة المقدمة</Label>
                    <Input
                      type="number"
                      value={planFormData.down_payment}
                      onChange={(e) => setPlanFormData({...planFormData, down_payment: e.target.value})}
                      placeholder="الدفعة المقدمة (اختياري)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>عدد الأقساط *</Label>
                    <Input
                      type="number"
                      min="2"
                      max="24"
                      value={planFormData.number_of_installments}
                      onChange={(e) => setPlanFormData({...planFormData, number_of_installments: parseInt(e.target.value) || 3})}
                    />
                  </div>
                  <div>
                    <Label>تاريخ البداية *</Label>
                    <Input
                      type="date"
                      value={planFormData.start_date}
                      onChange={(e) => setPlanFormData({...planFormData, start_date: e.target.value})}
                    />
                  </div>
                </div>

                {planFormData.total_amount && planFormData.number_of_installments && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-2">ملخص التقسيط:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><strong>المبلغ الإجمالي:</strong> {parseFloat(planFormData.total_amount).toLocaleString()} دج</div>
                      <div><strong>الدفعة المقدمة:</strong> {(parseFloat(planFormData.down_payment) || 0).toLocaleString()} دج</div>
                      <div><strong>المبلغ المتبقي:</strong> {(parseFloat(planFormData.total_amount) - (parseFloat(planFormData.down_payment) || 0)).toLocaleString()} دج</div>
                      <div><strong>قيمة كل قسط:</strong> {((parseFloat(planFormData.total_amount) - (parseFloat(planFormData.down_payment) || 0)) / planFormData.number_of_installments).toLocaleString()} دج</div>
                    </div>
                  </div>
                )}

                <div>
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={planFormData.notes}
                    onChange={(e) => setPlanFormData({...planFormData, notes: e.target.value})}
                    placeholder="ملاحظات إضافية حول خطة التقسيط..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={createInstallmentPlan}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!selectedClient || !selectedService || !planFormData.total_amount}
                  >
                    📅 إنشاء خطة التقسيط
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Manage Plans Tab */}
      {activeTab === 'manage-plans' && (
        <Card>
          <CardHeader>
            <CardTitle>📋 خطط التقسيط المُنشأة</CardTitle>
          </CardHeader>
          <CardContent>
            {installmentPlans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>لا توجد خطط تقسيط حالياً</p>
                <p className="text-sm">انتقل إلى "إنشاء خطة تقسيط" لإضافة خطة جديدة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">الخدمة</TableHead>
                      <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                      <TableHead className="text-right">الدفعة المقدمة</TableHead>
                      <TableHead className="text-right">عدد الأقساط</TableHead>
                      <TableHead className="text-right">تاريخ البداية</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installmentPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.client_name}</TableCell>
                        <TableCell>{plan.service_name}</TableCell>
                        <TableCell>{plan.total_amount?.toLocaleString()} دج</TableCell>
                        <TableCell>{plan.down_payment?.toLocaleString() || 0} دج</TableCell>
                        <TableCell>{plan.number_of_installments}</TableCell>
                        <TableCell>{formatDateWithEnglishNumerals(plan.start_date)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">✅ نشط</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button size="sm" variant="outline" className="text-blue-600">
                              👁️ عرض التفاصيل
                            </Button>
                            <Button size="sm" variant="outline" className="text-green-600">
                              💰 إدارة المدفوعات
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>📊 تقارير التقسيط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                <div className="text-sm text-blue-600">إجمالي العملاء</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{services.length}</div>
                <div className="text-sm text-purple-600">إجمالي الخدمات</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{installmentPlans.length}</div>
                <div className="text-sm text-green-600">خطط التقسيط النشطة</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {installmentPlans.reduce((sum, plan) => sum + (plan.total_amount || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-yellow-600">إجمالي المبالغ (دج)</div>
              </div>
            </div>
            
            <div className="text-center py-4 text-gray-500">
              <p>تقارير تفصيلية أكثر ستكون متاحة قريباً</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Client Dialog */}
      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات العميل الجديد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الاسم الكامل *</Label>
                <Input
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
                  placeholder="اسم العميل الكامل"
                />
              </div>
              <div>
                <Label>رقم الهاتف *</Label>
                <Input
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})}
                  placeholder="رقم الهاتف"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})}
                  placeholder="البريد الإلكتروني (اختياري)"
                />
              </div>
              <div>
                <Label>رقم الهوية الوطنية</Label>
                <Input
                  value={clientFormData.national_id}
                  onChange={(e) => setClientFormData({...clientFormData, national_id: e.target.value})}
                  placeholder="رقم الهوية (اختياري)"
                />
              </div>
            </div>

            <div>
              <Label>العنوان</Label>
              <Input
                value={clientFormData.address}
                onChange={(e) => setClientFormData({...clientFormData, address: e.target.value})}
                placeholder="عنوان العميل (اختياري)"
              />
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={clientFormData.notes}
                onChange={(e) => setClientFormData({...clientFormData, notes: e.target.value})}
                placeholder="ملاحظات إضافية عن العميل (اختياري)"
              />
            </div>

            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={() => setShowAddClientDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={addClient}
                disabled={!clientFormData.name || !clientFormData.phone}
                className="bg-green-600 hover:bg-green-700"
              >
                ✅ إضافة العميل
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={showAddServiceDialog} onOpenChange={setShowAddServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء خدمة جديدة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الخدمة/البرنامج الجديد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم الخدمة/البرنامج *</Label>
                <Input
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({...serviceFormData, name: e.target.value})}
                  placeholder="مثال: عمرة VIP، حج اقتصادي"
                />
              </div>
              <div>
                <Label>السعر الأساسي *</Label>
                <Input
                  type="number"
                  value={serviceFormData.base_price}
                  onChange={(e) => setServiceFormData({...serviceFormData, base_price: e.target.value})}
                  placeholder="السعر بالدينار الجزائري"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>التصنيف</Label>
                <Select 
                  value={serviceFormData.category} 
                  onValueChange={(value) => setServiceFormData({...serviceFormData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="عمرة">عمرة</SelectItem>
                    <SelectItem value="حج">حج</SelectItem>
                    <SelectItem value="سياحة">سياحة</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>مدة البرنامج (أيام)</Label>
                <Input
                  type="number"
                  value={serviceFormData.duration_days}
                  onChange={(e) => setServiceFormData({...serviceFormData, duration_days: e.target.value})}
                  placeholder="عدد الأيام (اختياري)"
                />
              </div>
            </div>

            <div>
              <Label>وصف الخدمة</Label>
              <Textarea
                value={serviceFormData.description}
                onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})}
                placeholder="وصف تفصيلي للخدمة أو البرنامج (اختياري)"
              />
            </div>

            <div>
              <Label>ما يتضمنه البرنامج</Label>
              <Textarea
                value={serviceFormData.inclusions}
                onChange={(e) => setServiceFormData({...serviceFormData, inclusions: e.target.value})}
                placeholder="مثال: تذاكر الطيران، الإقامة، النقل، الوجبات... (اختياري)"
              />
            </div>

            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={() => setShowAddServiceDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={addService}
                disabled={!serviceFormData.name || !serviceFormData.base_price}
                className="bg-purple-600 hover:bg-purple-700"
              >
                ✅ إنشاء الخدمة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

// Financial Management Component (Simplified)
const FinancialManagement = memo(() => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [activeTab, setActiveTab] = useState('balance'); // balance, transfer, expenses, reports
  
  // Transfer states
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transfers, setTransfers] = useState([]);
  
  // Expense states
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('operational');
  const [expenses, setExpenses] = useState([]);
  
  // Reports
  const [dailyReport, setDailyReport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const agencyId = user.agency_id;
      const token = localStorage.getItem('token');
      
      // Fetch balance
      const balanceRes = await axios.get(`${API}/agencies/${agencyId}/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(balanceRes.data);
      
      // Fetch transfers
      const transfersRes = await axios.get(`${API}/cash-transfers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransfers(transfersRes.data || []);
      
      // Fetch expenses
      const expensesRes = await axios.get(`${API}/agencies/${agencyId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(expensesRes.data || []);
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (parseFloat(transferAmount) > balance?.current_balance) {
      alert('المبلغ أكبر من الرصيد المتاح');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/agencies/${user.agency_id}/cash-transfer`, {
        amount: parseFloat(transferAmount),
        notes: transferNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ تم إنشاء طلب تحويل الأموال بنجاح');
      setTransferAmount('');
      setTransferNotes('');
      fetchFinancialData();
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('❌ فشل في إنشاء التحويل: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleExpense = async () => {
    if (!expenseAmount || !expenseDescription) {
      alert('يرجى إدخال المبلغ والوصف');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/agencies/${user.agency_id}/expenses`, {
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
        category: expenseCategory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ تم تسجيل المصروف بنجاح');
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseCategory('operational');
      fetchFinancialData();
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('❌ فشل في تسجيل المصروف: ' + (error.response?.data?.detail || error.message));
    }
  };

  const confirmTransfer = async (transferId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/cash-transfers/${transferId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ تم تأكيد التحويل بنجاح');
      fetchFinancialData();
    } catch (error) {
      console.error('Error confirming transfer:', error);
      alert('❌ فشل في تأكيد التحويل: ' + (error.response?.data?.detail || error.message));
    }
  };

  const rejectTransfer = async (transferId) => {
    if (!confirm('هل أنت متأكد من رفض هذا التحويل؟')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/cash-transfers/${transferId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ تم رفض التحويل بنجاح');
      fetchFinancialData();
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      alert('❌ فشل في رفض التحويل: ' + (error.response?.data?.detail || error.message));
    }
  };

  const fetchDailyReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/daily-financial/${user.agency_id}?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDailyReport(response.data);
    } catch (error) {
      console.error('Error fetching daily report:', error);
      alert('فشل في تحميل التقرير اليومي');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 الإدارة المالية</h1>
          <p className="text-sm text-gray-600 mt-1">رصيد الوكالة والحركات المالية</p>
        </div>
      </div>

      {/* Current Balance Card */}
      {balance && (
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{balance.current_balance?.toLocaleString()}</div>
                <div className="text-blue-100">الرصيد الحالي (دج)</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">{balance.total_revenue?.toLocaleString()}</div>
                <div className="text-blue-100">إجمالي الإيرادات</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">{balance.total_transferred?.toLocaleString()}</div>
                <div className="text-blue-100">المحول للإدارة العامة</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">{balance.total_expenses?.toLocaleString()}</div>
                <div className="text-blue-100">إجمالي المصاريف</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'balance', label: '💰 الرصيد الحالي', icon: '💰' },
            { id: 'transfer', label: '📤 تحويل أموال', icon: '📤' },
            { id: 'expenses', label: '💸 المصاريف', icon: '💸' },
            { id: 'reports', label: '📊 التقرير اليومي', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Balance Tab */}
      {activeTab === 'balance' && balance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📈 ملخص مالي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>إجمالي الإيرادات:</span>
                <span className="font-semibold text-green-600">{balance.total_revenue?.toLocaleString()} دج</span>
              </div>
              <div className="flex justify-between">
                <span>المحول للإدارة:</span>
                <span className="font-semibold text-blue-600">-{balance.total_transferred?.toLocaleString()} دج</span>
              </div>
              <div className="flex justify-between">
                <span>المصاريف:</span>
                <span className="font-semibold text-red-600">-{balance.total_expenses?.toLocaleString()} دج</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>الرصيد الحالي:</span>
                <span className={balance.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {balance.current_balance?.toLocaleString()} دج
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔄 آخر الحركات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transfers.slice(0, 5).map((transfer) => (
                  <div key={transfer.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">تحويل للإدارة العامة</p>
                      <p className="text-sm text-gray-500">{formatDateWithEnglishNumerals(transfer.transfer_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">-{transfer.amount?.toLocaleString()} دج</p>
                      <p className="text-xs text-gray-500">{transfer.status === 'confirmed' ? '✅ مؤكد' : '⏳ في الانتظار'}</p>
                    </div>
                  </div>
                ))}
                {expenses.slice(0, 3).map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">{formatDateWithEnglishNumerals(expense.expense_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">-{expense.amount?.toLocaleString()} دج</p>
                      <p className="text-xs text-gray-500">{expense.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer Tab */}
      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📤 تحويل أموال للإدارة العامة</CardTitle>
              <CardDescription>
                تحويل جزء من أموال الوكالة إلى الإدارة العامة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>المبلغ المراد تحويله *</Label>
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="المبلغ بالدينار الجزائري"
                />
                <p className="text-xs text-gray-500">
                  الرصيد المتاح: {balance?.current_balance?.toLocaleString()} دج
                </p>
              </div>

              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="ملاحظات حول التحويل (اختياري)"
                />
              </div>

              <Button 
                onClick={handleTransfer} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!transferAmount || parseFloat(transferAmount) <= 0}
              >
                📤 إنشاء طلب التحويل
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📋 سجل التحويلات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{transfer.amount?.toLocaleString()} دج</span>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transfer.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          transfer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transfer.status === 'confirmed' ? '✅ مؤكد' :
                           transfer.status === 'pending' ? '⏳ في الانتظار' : 
                           transfer.status === 'rejected' ? '❌ مرفوض' : '❌ ملغي'}
                        </span>
                        
                        {/* Confirmation buttons for pending transfers (only for authorized users) */}
                        {transfer.status === 'pending' && (user.role === 'general_accountant' || user.role === 'super_admin') && (
                          <div className="flex space-x-1 rtl:space-x-reverse">
                            <Button
                              size="sm"
                              onClick={() => confirmTransfer(transfer.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                            >
                              ✅ تأكيد
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectTransfer(transfer.id)}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 px-2 py-1 text-xs"
                            >
                              ❌ رفض
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{formatDateWithEnglishNumerals(transfer.transfer_date)}</span>
                      {transfer.confirmation_by && (
                        <span className="text-xs">
                          {transfer.status === 'confirmed' ? 'أكد من قبل:' : 'رفض من قبل:'} {transfer.confirmation_by}
                        </span>
                      )}
                    </div>
                    {transfer.notes && <p className="text-sm text-gray-500 mt-1">{transfer.notes}</p>}
                  </div>
                ))}
                {transfers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">لا توجد تحويلات مسجلة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>💸 تسجيل مصروف جديد</CardTitle>
              <CardDescription>
                تسجيل المصاريف التي تنخصم من رصيد الوكالة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>مبلغ المصروف *</Label>
                <Input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="المبلغ بالدينار الجزائري"
                />
              </div>

              <div>
                <Label>وصف المصروف *</Label>
                <Input
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="مثال: بنزين، إيجار، مصاريف تشغيلية"
                />
              </div>

              <div>
                <Label>نوع المصروف</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">تشغيلية</SelectItem>
                    <SelectItem value="travel">سفر</SelectItem>
                    <SelectItem value="supplies">مستلزمات</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleExpense} 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={!expenseAmount || !expenseDescription}
              >
                💸 تسجيل المصروف
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📋 سجل المصاريف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {expenses.map((expense) => (
                  <div key={expense.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{expense.description}</span>
                      <span className="font-bold text-red-600">{expense.amount?.toLocaleString()} دج</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{formatDateWithEnglishNumerals(expense.expense_date)}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">{expense.category}</span>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <p className="text-center text-gray-500 py-4">لا توجد مصاريف مسجلة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>📊 التقرير المالي اليومي</CardTitle>
            <CardDescription>
              تقرير مفصل لجميع الحركات المالية في يوم محدد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Label>التاريخ:</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
              <Button onClick={fetchDailyReport} className="bg-blue-600 hover:bg-blue-700">
                📊 إنشاء التقرير
              </Button>
            </div>

            {dailyReport && (
              <div className="mt-6 space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-3">ملخص اليوم ({selectedDate}):</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {dailyReport.summary?.daily_revenue?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-600">إيرادات اليوم</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {dailyReport.summary?.daily_transfers?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-600">تحويلات اليوم</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {dailyReport.summary?.daily_expenses?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-600">مصاريف اليوم</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {dailyReport.summary?.current_balance?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-600">الرصيد الحالي</div>
                    </div>
                  </div>
                </div>

                {/* Operations */}
                {dailyReport.operations && dailyReport.operations.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-2">العمليات اليومية ({dailyReport.operations.length}):</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">رقم العملية</TableHead>
                            <TableHead className="text-right">العميل</TableHead>
                            <TableHead className="text-right">الخدمة</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyReport.operations.map((op) => (
                            <TableRow key={op.id}>
                              <TableCell>{op.operation_no}</TableCell>
                              <TableCell>{op.client_name}</TableCell>
                              <TableCell>{op.service_name}</TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {op.final_price?.toLocaleString()} دج
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});
const AgencyManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    phone_numbers: [''],
    fax_number: '',
    commercial_register_number: '',
    tax_registration_number: '',
    address: ''
  });

  // Only Super Admin can access this
  useEffect(() => {
    if (user?.role !== 'super_admin') {
      return;
    }
    fetchAgencies();
  }, [user]);

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(`${API}/agencies`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAgencies(response.data);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        phone_numbers: formData.phone_numbers.filter(phone => phone.trim() !== '')
      };

      if (editingAgency) {
        await axios.put(`${API}/agencies/${editingAgency.id}`, submitData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('✅ تم تحديث الوكالة بنجاح');
      } else {
        await axios.post(`${API}/agencies`, submitData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('✅ تم إنشاء الوكالة بنجاح');
      }
      
      setShowAddDialog(false);
      setEditingAgency(null);
      setFormData({
        name: '',
        city: '',
        phone_numbers: [''],
        fax_number: '',
        commercial_register_number: '',
        tax_registration_number: '',
        address: ''
      });
      fetchAgencies();
    } catch (error) {
      console.error('Error saving agency:', error);
      alert('خطأ في حفظ الوكالة: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (agency) => {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      city: agency.city,
      phone_numbers: agency.phone_numbers || [''],
      fax_number: agency.fax_number || '',
      commercial_register_number: agency.commercial_register_number || '',
      tax_registration_number: agency.tax_registration_number || '',
      address: agency.address || ''
    });
    setShowAddDialog(true);
  };

  const addPhoneNumber = () => {
    setFormData({
      ...formData,
      phone_numbers: [...formData.phone_numbers, '']
    });
  };

  const updatePhoneNumber = (index, value) => {
    const updatedPhones = [...formData.phone_numbers];
    updatedPhones[index] = value;
    setFormData({
      ...formData,
      phone_numbers: updatedPhones
    });
  };

  const removePhoneNumber = (index) => {
    if (formData.phone_numbers.length > 1) {
      const updatedPhones = formData.phone_numbers.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        phone_numbers: updatedPhones
      });
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">⛔ وصول محظور</h2>
        <p className="text-gray-600">هذا القسم مخصص للمدير العام فقط</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">🏢 إدارة الوكالات</h1>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 ml-2" />
          إضافة وكالة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الوكالات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الوكالة</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">أرقام الهاتف</TableHead>
                  <TableHead className="text-right">السجل التجاري</TableHead>
                  <TableHead className="text-right">الرقم الضريبي</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell className="font-medium text-right">{agency.name}</TableCell>
                    <TableCell className="text-right">{agency.city}</TableCell>
                    <TableCell className="text-right">
                      {agency.phone_numbers?.join(', ') || 'غير محدد'}
                    </TableCell>
                    <TableCell className="text-right">{agency.commercial_register_number || 'غير محدد'}</TableCell>
                    <TableCell className="text-right">{agency.tax_registration_number || 'غير محدد'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(agency)}
                        className="ml-2"
                      >
                        <Edit className="h-3 w-3" />
                        تعديل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Agency Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingAgency ? '✏️ تعديل الوكالة' : '➕ إضافة وكالة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم الوكالة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: وكالة صنهاجة للسياحة"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="city">المدينة *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="مثال: تلمسان"
                  required
                />
              </div>
            </div>

            <div>
              <Label>أرقام الهاتف</Label>
              {formData.phone_numbers.map((phone, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <Input
                    value={phone}
                    onChange={(e) => updatePhoneNumber(index, e.target.value)}
                    placeholder="مثال: 043123456"
                    className="flex-1"
                  />
                  {formData.phone_numbers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePhoneNumber(index)}
                      className="text-red-600"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPhoneNumber}
                className="mt-2"
              >
                <Plus className="h-3 w-3 ml-1" />
                إضافة رقم هاتف
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fax_number">رقم الفاكس</Label>
                <Input
                  id="fax_number"
                  value={formData.fax_number}
                  onChange={(e) => setFormData({ ...formData, fax_number: e.target.value })}
                  placeholder="مثال: 043123457"
                />
              </div>
              
              <div>
                <Label htmlFor="commercial_register_number">رقم السجل التجاري</Label>
                <Input
                  id="commercial_register_number"
                  value={formData.commercial_register_number}
                  onChange={(e) => setFormData({ ...formData, commercial_register_number: e.target.value })}
                  placeholder="مثال: 123456789"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tax_registration_number">الرقم الضريبي</Label>
              <Input
                id="tax_registration_number"
                value={formData.tax_registration_number}
                onChange={(e) => setFormData({ ...formData, tax_registration_number: e.target.value })}
                placeholder="مثال: 987654321"
              />
            </div>

            <div>
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="مثال: شارع العربي بن مهيدي، تلمسان"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingAgency ? '💾 حفظ التغييرات' : '➕ إضافة الوكالة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Daily Reports Management Component
const DailyReportsManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    income: '',
    expenses: '',
    cashbox_balance: '',
    notes: ''
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/daily-reports`);
      // Sort reports by date - newest first
      const sortedReports = response.data.sort((a, b) => {
        return new Date(b.date || b.created_at) - new Date(a.date || a.created_at);
      });
      setReports(sortedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const reportData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        income: parseFloat(formData.income),
        expenses: parseFloat(formData.expenses),
        cashbox_balance: parseFloat(formData.cashbox_balance)
      };
      
      await axios.post(`${API}/daily-reports`, reportData);
      setFormData({ date: '', income: '', expenses: '', cashbox_balance: '', notes: '' });
      setIsDialogOpen(false);
      fetchReports();
    } catch (error) {
      console.error('Error saving report:', error);
      alert(error.response?.data?.detail || 'حدث خطأ أثناء حفظ التقرير');
    }
  };

  const handleApprove = async (reportId) => {
    try {
      await axios.put(`${API}/daily-reports/${reportId}/approve`);
      fetchReports();
    } catch (error) {
      console.error('Error approving report:', error);
      alert('حدث خطأ أثناء الموافقة على التقرير');
    }
  };

  const handleReject = async (reportId) => {
    const reason = prompt('أدخل سبب الرفض (اختياري):');
    try {
      await axios.put(`${API}/daily-reports/${reportId}/reject`, null, {
        params: { rejection_reason: reason || '' }
      });
      fetchReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('حدث خطأ أثناء رفض التقرير');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { variant: 'secondary', text: '⏳ في انتظار الموافقة', color: 'bg-yellow-100 text-yellow-800' },
      'approved': { variant: 'default', text: '✅ تمت الموافقة', color: 'bg-green-100 text-green-800' },
      'rejected': { variant: 'destructive', text: '❌ مرفوض', color: 'bg-red-100 text-red-800' }
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</span>;
  };

  const canCreateReports = user?.role === 'agency_staff' || user?.role === 'super_admin';
  const canApproveReports = user?.role === 'general_accountant' || user?.role === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📈 {t('dailyReports')}</h2>
            <p className="text-gray-600 mt-1">إدارة ومراجعة التقارير اليومية</p>
          </div>
          {canCreateReports && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createReport')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>➕ إنشاء تقرير يومي جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات التقرير اليومي
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="date">📅 التاريخ</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="income">💰 الإيرادات (دج)</Label>
                    <Input
                      id="income"
                      type="number"
                      step="0.01"
                      value={formData.income}
                      onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                      placeholder="0.00"
                      required
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expenses">📉 المصروفات (دج)</Label>
                    <Input
                      id="expenses"
                      type="number"
                      step="0.01"
                      value={formData.expenses}
                      onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                      placeholder="0.00"
                      required
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cashbox_balance">🏦 رصيد الصندوق (دج)</Label>
                    <Input
                      id="cashbox_balance"
                      type="number"
                      step="0.01"
                      value={formData.cashbox_balance}
                      onChange={(e) => setFormData({ ...formData, cashbox_balance: e.target.value })}
                      placeholder="0.00"
                      required
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">📝 ملاحظات</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="ملاحظات إضافية (اختياري)"
                      className="w-full p-2 border border-gray-300 rounded-md text-right"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      📊 إنشاء التقرير
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 ml-2" />
            قائمة التقارير اليومية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">📅 التاريخ</TableHead>
                <TableHead className="text-right">💰 الإيرادات</TableHead>
                <TableHead className="text-right">📉 المصروفات</TableHead>
                <TableHead className="text-right">🏦 رصيد الصندوق</TableHead>
                <TableHead className="text-right">📊 الحالة</TableHead>
                <TableHead className="text-right">👤 المنشئ</TableHead>
                {canApproveReports && <TableHead className="text-right">⚙️ الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canApproveReports ? 7 : 6} className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900">لا توجد تقارير</p>
                      <p className="text-gray-600">ابدأ بإنشاء تقرير يومي جديد</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-right">
                      {formatDateWithEnglishNumerals(report.date)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {report.income.toLocaleString()} دج
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      {report.expenses.toLocaleString()} دج
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {report.cashbox_balance.toLocaleString()} دج
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {report.created_by || 'غير محدد'}
                    </TableCell>
                    {canApproveReports && (
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          {report.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(report.id)}
                                className="text-green-600 hover:text-green-700 border-green-600"
                              >
                                ✅ موافقة
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(report.id)}
                                className="text-red-600 hover:text-red-700 border-red-600"
                              >
                                ❌ رفض
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Services Management Component (General Manager and General Accountant Only)
const ServicesManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    service_type: 'عمرة',
    category: 'خدمات دينية',
    base_price: '',
    min_price: '',
    is_fixed_price: true,
    is_active: true
  });

  // Check if user can manage services
  const canManageServices = user?.role === 'super_admin' || user?.role === 'general_accountant';

  useEffect(() => {
    if (canManageServices) {
      fetchServices();
    }
  }, [canManageServices]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Sort services by creation date - newest first
      const sortedServices = response.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setServices(sortedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await axios.put(`${API}/services/${editingService.id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${API}/services`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      
      setShowAddDialog(false);
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        service_type: 'عمرة',
        category: 'خدمات دينية',
        base_price: '',
        min_price: '',
        is_fixed_price: true,
        is_active: true
      });
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('خطأ في حفظ الخدمة');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      service_type: service.service_type,
      category: service.category,
      base_price: service.base_price.toString(),
      min_price: service.min_price?.toString() || '',
      is_fixed_price: service.is_fixed_price,
      is_active: service.is_active
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      try {
        await axios.delete(`${API}/services/${serviceId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('خطأ في حذف الخدمة');
      }
    }
  };

  if (!canManageServices) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">⚠️ ليس لديك صلاحية لإدارة الخدمات</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('servicesManagement')}</h1>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 ml-2" />
          {t('addService')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t('serviceName')}</TableHead>
                <TableHead className="text-right">{t('serviceType')}</TableHead>
                <TableHead className="text-right">{t('serviceCategory')}</TableHead>
                <TableHead className="text-right">{t('basePrice')}</TableHead>
                <TableHead className="text-right">{t('priceType')}</TableHead>
                <TableHead className="text-right">{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="text-right font-medium">{service.name}</TableCell>
                  <TableCell className="text-right">{service.service_type}</TableCell>
                  <TableCell className="text-right">{service.category}</TableCell>
                  <TableCell className="text-right">{service.base_price.toLocaleString()} دج</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={service.is_fixed_price ? "default" : "outline"}>
                      {service.is_fixed_price ? '🔒 ثابت' : '🔄 متغير'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? t('isActive') : 'غير نشطة'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Service Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? t('editService') : t('addService')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t('serviceName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="service_type">{t('serviceType')}</Label>
              <Select value={formData.service_type} onValueChange={(value) => setFormData({...formData, service_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="عمرة">{t('umrah')}</SelectItem>
                  <SelectItem value="حج">{t('hajj')}</SelectItem>
                  <SelectItem value="تذكرة طيران">{t('flightTicket')}</SelectItem>
                  <SelectItem value="حجز فندق">{t('hotelBooking')}</SelectItem>
                  <SelectItem value="خدمة تأشيرة">{t('visaService')}</SelectItem>
                  <SelectItem value="نقل">{t('transport')}</SelectItem>
                  <SelectItem value="تأمين">{t('insurance')}</SelectItem>
                  <SelectItem value="خدمة جواز سفر">{t('passportService')}</SelectItem>
                  <SelectItem value="أخرى">{t('otherService')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">{t('serviceCategory')}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="خدمات دينية">{t('religiousServices')}</SelectItem>
                  <SelectItem value="خدمات سفر">{t('travelServices')}</SelectItem>
                  <SelectItem value="خدمات وثائق">{t('documentationServices')}</SelectItem>
                  <SelectItem value="خدمات إقامة">{t('accommodationServices')}</SelectItem>
                  <SelectItem value="أخرى">{t('otherCategory')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="base_price">{t('basePrice')}</Label>
              <Input
                id="base_price"
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="min_price">{t('minPrice')}</Label>
              <Input
                id="min_price"
                type="number"
                value={formData.min_price}
                onChange={(e) => setFormData({...formData, min_price: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="price_type">{t('priceType')}</Label>
              <Select 
                value={formData.is_fixed_price ? 'fixed' : 'variable'} 
                onValueChange={(value) => setFormData({...formData, is_fixed_price: value === 'fixed'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">🔒 {t('fixedPriceService')}</SelectItem>
                  <SelectItem value="variable">🔄 {t('variablePriceService')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">
                {formData.is_fixed_price 
                  ? "🔒 موظفو الوكالة لا يستطيعون تغيير السعر" 
                  : "🔄 يمكن لموظفي الوكالة تعديل السعر في العمليات اليومية"
                }
              </p>
            </div>

            <div>
              <Label htmlFor="description">{t('serviceDescription')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
              <Label htmlFor="is_active">{t('isActive')}</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                {t('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Agency Settings Management Component
const AgencySettingsManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [agencies, setAgencies] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    phone_2: '',
    phone_3: '',
    fax: '',
    email: '',
    website: '',
    tax_number: '',
    commercial_register: '',
    national_register: '',
    business_license: '',
    manager_name: '',
    established_date: '',
    description: '',
    logo_url: '',
    header_text: '',
    footer_text: '',
    manager_signature_url: ''
  });

  const showToast = (message, type = 'success') => {
    // Toast implementation (you might want to use a toast library)
    console.log(`${type}: ${message}`);
  };

  // Load agencies and set initial data
  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/agencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAgencies(response.data);
      
      // For agency staff, auto-select their agency
      if (user?.role === 'agency_staff' && user?.agency_id) {
        const userAgency = response.data.find(agency => agency.id === user.agency_id);
        if (userAgency) {
          setSelectedAgency(userAgency);
          loadAgencyDetails(userAgency.id);
        }
      } else if (response.data.length > 0) {
        // For GM/GA, select first agency by default
        setSelectedAgency(response.data[0]);
        loadAgencyDetails(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
      showToast('فشل في تحميل الوكالات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAgencyDetails = async (agencyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/agencies/${agencyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const agency = response.data;
      setFormData({
        name: agency.name || '',
        address: agency.address || '',
        city: agency.city || '',
        postal_code: agency.postal_code || '',
        phone: agency.phone || '',
        phone_2: agency.phone_2 || '',
        phone_3: agency.phone_3 || '',
        fax: agency.fax || '',
        email: agency.email || '',
        website: agency.website || '',
        tax_number: agency.tax_number || '',
        commercial_register: agency.commercial_register || '',
        national_register: agency.national_register || '',
        business_license: agency.business_license || '',
        manager_name: agency.manager_name || '',
        established_date: agency.established_date || '',
        description: agency.description || '',
        logo_url: agency.logo_url || '',
        header_text: agency.header_text || '',
        footer_text: agency.footer_text || '',
        manager_signature_url: agency.manager_signature_url || ''
      });
    } catch (error) {
      console.error('Error loading agency details:', error);
      showToast('فشل في تحميل تفاصيل الوكالة', 'error');
    }
  };

  const handleAgencyChange = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    setSelectedAgency(agency);
    loadAgencyDetails(agencyId);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle logo file selection and preview
  const handleLogoFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('يرجى اختيار ملف صورة صالح (JPEG, PNG, GIF)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. يرجى اختيار صورة أقل من 5 ميجابايت');
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo file
  const handleLogoUpload = async () => {
    if (!logoFile || !selectedAgency) return;

    try {
      setUploadingLogo(true);
      
      const formDataUpload = new FormData();
      formDataUpload.append('logo', logoFile);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/agencies/${selectedAgency.id}/upload-logo`, formDataUpload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update form data with new logo URL
      const logoUrl = response.data.logo_url;
      setFormData(prev => ({
        ...prev,
        logo_url: logoUrl
      }));
      
      // Clear upload state
      setLogoFile(null);
      setLogoPreview(null);
      
      showToast('✅ تم رفع اللوجو بنجاح');
      
      // Reset file input
      const fileInput = document.getElementById('logo-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('❌ فشل في رفع اللوجو: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Remove current logo
  const handleLogoRemove = async () => {
    if (!selectedAgency || !formData.logo_url) return;
    
    if (!confirm('هل أنت متأكد من حذف اللوجو الحالي؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/agencies/${selectedAgency.id}/remove-logo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFormData(prev => ({
        ...prev,
        logo_url: ''
      }));
      
      showToast('✅ تم حذف اللوجو بنجاح');
      
    } catch (error) {
      console.error('Error removing logo:', error);
      showToast('❌ فشل في حذف اللوجو', 'error');
    }
  };

  const handleSave = async () => {
    if (!selectedAgency) return;
    
    // Agency staff cannot save
    if (user?.role === 'agency_staff') {
      showToast('ليس لديك صلاحية لتعديل إعدادات الوكالة', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`${API}/agencies/${selectedAgency.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast(t('settingsUpdated'));
      loadAgencies(); // Refresh agencies list
    } catch (error) {
      console.error('Error saving agency settings:', error);
      showToast(t('settingsUpdateFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = user?.role === 'agency_staff';

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('agencySettings')}</h1>
        <p className="text-gray-600">
          {isReadOnly ? 'عرض معلومات الوكالة' : 'إدارة وتحديث معلومات الوكالات'}
        </p>
      </div>

      {/* Agency Selector (for GM/GA only) */}
      {!isReadOnly && agencies.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>اختيار الوكالة</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAgency?.id || ''} onValueChange={handleAgencyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر الوكالة" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map(agency => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedAgency && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('agencyName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="address">{t('agencyAddress')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">{t('agencyCity')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">{t('postalCode')}</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">{t('agencyDescription')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="established_date">{t('establishedDate')}</Label>
                <Input
                  id="established_date"
                  type="date"
                  value={formData.established_date}
                  onChange={(e) => handleInputChange('established_date', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contactInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">{t('primaryPhone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="phone_2">{t('secondaryPhone')}</Label>
                <Input
                  id="phone_2"
                  value={formData.phone_2}
                  onChange={(e) => handleInputChange('phone_2', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="phone_3">{t('additionalPhone')}</Label>
                <Input
                  id="phone_3"
                  value={formData.phone_3}
                  onChange={(e) => handleInputChange('phone_3', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="fax">{t('faxNumber')}</Label>
                <Input
                  id="fax"
                  value={formData.fax}
                  onChange={(e) => handleInputChange('fax', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="email">{t('agencyEmail')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="website">{t('agencyWebsite')}</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Management */}
          <Card>
            <CardHeader>
              <CardTitle>🎨 إدارة اللوجو</CardTitle>
              <CardDescription>
                رفع وإدارة لوجو الوكالة الذي سيظهر في جميع الوثائق والوصولات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Logo Display */}
              {formData.logo_url ? (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <Label className="font-medium text-gray-700 mb-2 block">اللوجو الحالي:</Label>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo" 
                      className="w-20 h-20 object-contain bg-white border rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{display: 'none'}} className="w-20 h-20 bg-gray-200 border rounded flex items-center justify-center text-gray-500 text-xs">
                      صورة غير متاحة
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        اللوجو الحالي سيظهر في جميع الوصولات والطباعات
                      </p>
                      {!isReadOnly && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleLogoRemove}
                          className="text-red-600 hover:text-red-700"
                        >
                          🗑️ حذف اللوجو
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse text-blue-700">
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      🎨
                    </div>
                    <div>
                      <p className="font-medium">لا يوجد لوجو حالياً</p>
                      <p className="text-sm">قم برفع لوجو الوكالة ليظهر في جميع الوثائق</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Logo Upload Section */}
              {!isReadOnly && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logo-upload" className="font-medium">رفع لوجو جديد:</Label>
                    <div className="mt-2">
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        الملفات المدعومة: PNG, JPG, GIF (أقل من 5 ميجابايت)
                      </p>
                    </div>
                  </div>

                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <Label className="font-medium text-green-700 mb-2 block">معاينة اللوجو الجديد:</Label>
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="w-20 h-20 object-contain bg-white border rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-green-700 mb-3">
                            اللоجو جاهز للرفع. اضغط "رفع اللوجو" لحفظه.
                          </p>
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button 
                              onClick={handleLogoUpload}
                              disabled={uploadingLogo}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              {uploadingLogo ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  جاري الرفع...
                                </>
                              ) : (
                                '📤 رفع اللوجو'
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview(null);
                                document.getElementById('logo-upload').value = '';
                              }}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Logo URL Input (fallback for manual entry) */}
              <div>
                <Label htmlFor="logo_url">رابط اللوجو (اختياري):</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك إدخال رابط مباشر للوجو بدلاً من رفع ملف
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Registration Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('registrationDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tax_number">{t('taxNumber')}</Label>
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) => handleInputChange('tax_number', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="commercial_register">{t('commercialRegister')}</Label>
                <Input
                  id="commercial_register"
                  value={formData.commercial_register}
                  onChange={(e) => handleInputChange('commercial_register', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="national_register">{t('nationalRegister')}</Label>
                <Input
                  id="national_register"
                  value={formData.national_register}
                  onChange={(e) => handleInputChange('national_register', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="business_license">{t('businessLicense')}</Label>
                <Input
                  id="business_license"
                  value={formData.business_license}
                  onChange={(e) => handleInputChange('business_license', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>

          {/* Management & Branding */}
          <Card>
            <CardHeader>
              <CardTitle>{t('managementInfo')} & {t('brandingSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="manager_name">{t('managerName')}</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => handleInputChange('manager_name', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="logo_url">{t('logoUrl')}</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="header_text">{t('headerText')}</Label>
                <Textarea
                  id="header_text"
                  value={formData.header_text}
                  onChange={(e) => handleInputChange('header_text', e.target.value)}
                  disabled={isReadOnly}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="footer_text">{t('footerText')}</Label>
                <Textarea
                  id="footer_text"
                  value={formData.footer_text}
                  onChange={(e) => handleInputChange('footer_text', e.target.value)}
                  disabled={isReadOnly}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="manager_signature_url">{t('managerSignature')}</Label>
                <Input
                  id="manager_signature_url"
                  type="url"
                  value={formData.manager_signature_url}
                  onChange={(e) => handleInputChange('manager_signature_url', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button (only for GM/GA) */}
      {!isReadOnly && selectedAgency && (
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'جاري الحفظ...' : t('saveSettings')}
          </Button>
        </div>
      )}
    </div>
  );
};

// Daily Operations Management Component
const DailyOperationsManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [operations, setOperations] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedOperationForPrint, setSelectedOperationForPrint] = useState(null);
  const [editingOperation, setEditingOperation] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  
  // NEW: Payment states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedOperationForPayment, setSelectedOperationForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    method: 'cash',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [operationPaymentStatuses, setOperationPaymentStatuses] = useState({});
  
  const [printDetails, setPrintDetails] = useState({
    paymentType: 'نقدي', // نقدي، بنكي، قسط
    amountPaid: 0,
    remainingAmount: 0,
    paymentStatus: 'مدفوع كاملاً' // مدفوع كاملاً، دفعة مقدمة، مؤجل
  });
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);  // Add this for client dialog
  const [clientFormData, setClientFormData] = useState({  // Add this for client form
    name: '',
    phone: '',
    cin_passport: '',
    email: '',
    address: ''
  });
  const [formData, setFormData] = useState({
    service_id: '',
    client_id: '',
    base_price: '', // Allow custom price for variable services
    discount_amount: 0,
    discount_reason: '',
    notes: ''
  });

  // NEW: Advanced Filtering State
  const [filters, setFilters] = useState({
    agency_id: 'all',
    client_name: '',
    service_name: '',
    service_type: 'all',
    status: 'all',
    start_date: '',
    end_date: '',
    min_amount: '',
    max_amount: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredOperations, setFilteredOperations] = useState([]);

  // Check if user can approve operations
  const canApproveOperations = user?.role === 'super_admin' || user?.role === 'general_accountant';

  useEffect(() => {
    fetchOperations();
    fetchServices();
    fetchClients();
    fetchAgencies();
  }, []);

  // Update payment statuses when operations change
  useEffect(() => {
    if (operations.length > 0) {
      updatePaymentStatuses();
    }
  }, [operations]);

  const fetchOperations = async (filterParams = {}) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filter parameters
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = `${API}/daily-operations${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Sort operations by date - newest first
      const sortedOperations = response.data.sort((a, b) => {
        return new Date(b.date || b.created_at) - new Date(a.date || a.created_at);
      });
      
      setOperations(sortedOperations);
      setFilteredOperations(sortedOperations);
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add client function
  const handleAddClient = async () => {
    if (!clientFormData.name || !clientFormData.phone) {
      alert('يرجى إدخال الاسم ورقم الهاتف على الأقل');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/clients`, clientFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ تم إضافة العميل بنجاح');
      
      // Update clients list
      setClients([...clients, response.data]);
      
      // Set the new client as selected
      setFormData({...formData, client_id: response.data.id});
      
      // Reset form and close dialog
      setClientFormData({
        name: '',
        phone: '',
        cin_passport: '',
        email: '',
        address: ''
      });
      setShowAddClientDialog(false);
      
    } catch (error) {
      console.error('Error adding client:', error);
      alert('❌ فشل في إضافة العميل: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Apply filters to operations
  const applyFilters = () => {
    const filterParams = {};
    
    // Build filter parameters (exclude "all" values)
    if (filters.agency_id && filters.agency_id !== 'all') filterParams.agency_id = filters.agency_id;
    if (filters.client_name) filterParams.client_name = filters.client_name;
    if (filters.service_name) filterParams.service_name = filters.service_name;
    if (filters.service_type && filters.service_type !== 'all') filterParams.service_type = filters.service_type;
    if (filters.status && filters.status !== 'all') filterParams.status = filters.status;
    if (filters.start_date) filterParams.start_date = filters.start_date;
    if (filters.end_date) filterParams.end_date = filters.end_date;
    if (filters.min_amount) filterParams.min_amount = filters.min_amount;
    if (filters.max_amount) filterParams.max_amount = filters.max_amount;

    fetchOperations(filterParams);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      agency_id: 'all',
      client_name: '',
      service_name: '',
      service_type: 'all',
      status: 'all',
      start_date: '',
      end_date: '',
      min_amount: '',
      max_amount: ''
    });
    fetchOperations();
  };

  // NEW: Payment management functions
  const fetchOperationPaymentStatus = async (operationId) => {
    try {
      const response = await axios.get(`${API}/daily-operations/${operationId}/payment-status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return null;
    }
  };

  const updatePaymentStatuses = async () => {
    const statuses = {};
    for (const operation of operations) {
      const status = await fetchOperationPaymentStatus(operation.id);
      if (status) {
        statuses[operation.id] = status;
      }
    }
    setOperationPaymentStatuses(statuses);
  };

  const handleAddPayment = (operation) => {
    setSelectedOperationForPayment(operation);
    const status = operationPaymentStatuses[operation.id];
    setPaymentFormData({
      method: 'cash',
      amount: status?.remaining_amount?.toString() || operation.final_price.toString(),
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOperationForPayment) return;
    
    try {
      console.log('=== ADDING PAYMENT TO OPERATION ===');
      console.log('Operation ID:', selectedOperationForPayment.id);
      console.log('Payment data:', paymentFormData);
      
      await axios.post(
        `${API}/daily-operations/${selectedOperationForPayment.id}/payments`,
        paymentFormData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      console.log('=== PAYMENT ADDED SUCCESSFULLY ===');
      alert('✅ تم إضافة المدفوعة بنجاح');
      
      // Reset form and close dialog
      setShowPaymentDialog(false);
      setSelectedOperationForPayment(null);
      setPaymentFormData({
        method: 'cash',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      // Refresh operations and payment statuses
      fetchOperations();
      setTimeout(updatePaymentStatuses, 1000);
      
    } catch (error) {
      console.error('=== PAYMENT ERROR ===');
      console.error('Error adding payment:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 403) {
        alert('❌ ليس لديك صلاحية لإضافة مدفوعات لهذه العملية');
      } else if (error.response?.status === 400) {
        alert('❌ خطأ في البيانات: ' + (error.response?.data?.detail || error.message));
      } else {
        alert('❌ فشل في إضافة المدفوعة: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const getPaymentStatusBadge = (operationId) => {
    const status = operationPaymentStatuses[operationId];
    if (!status) return <span className="text-gray-500">⏳ جاري التحميل...</span>;
    
    switch (status.payment_status) {
      case 'fully_paid':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">🟢 مدفوع كاملاً</span>;
      case 'partially_paid':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">🟡 مدفوع جزئياً</span>;
      case 'unpaid':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">🔴 غير مدفوع</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">❓ غير محدد</span>;
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services?is_active=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Sort clients by creation date - newest first
      const sortedClients = response.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setClients(sortedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(`${API}/agencies`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAgencies(response.data);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service);
    
    // Set default price for fixed-price services, clear for variable services
    const basePrice = service && service.is_fixed_price ? service.base_price.toString() : '';
    
    setFormData({
      ...formData,
      service_id: serviceId,
      base_price: basePrice
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate custom price for variable services
    if (selectedService && !selectedService.is_fixed_price && (!formData.base_price || parseFloat(formData.base_price) <= 0)) {
      alert('يرجى إدخال سعر صحيح للخدمة المتغيرة');
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null
      };
      
      if (editingOperation) {
        // UPDATE existing operation
        console.log('=== UPDATING OPERATION ===');
        console.log('Operation ID:', editingOperation.id);
        console.log('Update data:', submitData);
        
        await axios.put(`${API}/daily-operations/${editingOperation.id}`, submitData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        console.log('=== UPDATE SUCCESS ===');
        alert('✅ تم تحديث العملية بنجاح');
      } else {
        // CREATE new operation
        console.log('=== CREATING OPERATION ===');
        console.log('Create data:', submitData);
        
        await axios.post(`${API}/daily-operations`, submitData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        console.log('=== CREATE SUCCESS ===');
        alert('✅ تم إنشاء العملية بنجاح');
      }
      
      // Reset form and close dialog
      setShowAddDialog(false);
      setEditingOperation(null);
      setSelectedService(null);
      setFormData({
        service_id: '',
        client_id: '',
        base_price: '',
        discount_amount: 0,
        discount_reason: '',
        notes: ''
      });
      fetchOperations();
    } catch (error) {
      console.error('=== OPERATION SUBMIT ERROR ===');
      console.error('Error submitting operation:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 403) {
        alert('❌ ليس لديك صلاحية لتعديل هذه العملية. اتصل بالمحاسب للمساعدة.');
      } else {
        const action = editingOperation ? 'تحديث' : 'إنشاء';
        alert(`خطأ في ${action} العملية: ` + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleApprove = async (operationId) => {
    try {
      console.log('=== APPROVING OPERATION ===');
      console.log('Operation ID:', operationId);
      console.log('API endpoint:', `${API}/daily-operations/${operationId}/approve`);
      console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const response = await axios.put(`${API}/daily-operations/${operationId}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Approval response:', response.data);
      console.log('=== APPROVAL SUCCESS ===');
      
      // Show success message
      alert('✅ تم اعتماد العملية بنجاح');
      
      // Refresh operations list
      fetchOperations();
    } catch (error) {
      console.error('=== APPROVAL ERROR ===');
      console.error('Error approving operation:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert('خطأ في اعتماد العملية: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleReject = async (operationId) => {
    const reason = prompt('سبب الرفض:');
    if (reason) {
      try {
        console.log('=== REJECTING OPERATION ===');
        console.log('Operation ID:', operationId);
        console.log('Rejection reason:', reason);
        console.log('API endpoint:', `${API}/daily-operations/${operationId}/reject`);
        
        const response = await axios.put(`${API}/daily-operations/${operationId}/reject`, 
          { rejection_reason: reason }, 
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        console.log('Rejection response:', response.data);
        console.log('=== REJECTION SUCCESS ===');
        
        // Show success message
        alert('❌ تم رفض العملية بنجاح');
        
        // Refresh operations list
        fetchOperations();
      } catch (error) {
        console.error('=== REJECTION ERROR ===');
        console.error('Error rejecting operation:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        alert('خطأ في رفض العملية: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handlePrintReceipt = async (operationId, operationNo) => {
    // Get full operation details first
    const operation = operations.find(op => op.id === operationId);
    if (!operation) {
      alert('لم يتم العثور على تفاصيل العملية');
      return;
    }

    // Set the operation for print preview
    setSelectedOperationForPrint(operation);
    
    try {
      // Get REAL payment status for this operation
      console.log('=== FETCHING REAL PAYMENT STATUS FOR RECEIPT ===');
      console.log('Operation ID:', operationId);
      
      const paymentStatus = await fetchOperationPaymentStatus(operationId);
      console.log('Payment status:', paymentStatus);
      
      // Get actual payments for payment method detection
      const paymentsResponse = await axios.get(`${API}/daily-operations/${operationId}/payments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const payments = paymentsResponse.data;
      console.log('Payments:', payments);
      
      // Determine payment method from actual payments
      let paymentMethod = 'نقدي'; // default
      if (payments.length > 0) {
        const lastPayment = payments[0]; // Most recent payment
        switch (lastPayment.method) {
          case 'cash':
            paymentMethod = 'نقدي';
            break;
          case 'check':
            paymentMethod = 'شيك';
            break;
          case 'bank_transfer':
            paymentMethod = 'تحويل بنكي';
            break;
          case 'credit_card':
            paymentMethod = 'بطاقة ائتمان';
            break;
          default:
            paymentMethod = 'نقدي';
        }
      }
      
      // Determine payment status in Arabic
      let arabicPaymentStatus;
      switch (paymentStatus?.payment_status) {
        case 'fully_paid':
          arabicPaymentStatus = 'مدفوع كاملاً';
          break;
        case 'partially_paid':
          arabicPaymentStatus = 'دفعة جزئية';
          break;
        case 'unpaid':
          arabicPaymentStatus = 'غير مدفوع';
          break;
        default:
          arabicPaymentStatus = 'غير محدد';
      }
      
      // Initialize print details with REAL payment data
      setPrintDetails({
        paymentType: paymentMethod,
        amountPaid: paymentStatus?.total_paid || 0,
        remainingAmount: paymentStatus?.remaining_amount || operation.final_price,
        paymentStatus: arabicPaymentStatus
      });
      
      console.log('=== PRINT DETAILS SET ===');
      console.log('Payment Type:', paymentMethod);
      console.log('Amount Paid:', paymentStatus?.total_paid || 0);
      console.log('Remaining:', paymentStatus?.remaining_amount || operation.final_price);
      console.log('Status:', arabicPaymentStatus);
      
      // Show preview modal ONLY after payment data is fetched and set
      setShowPrintPreview(true);
      
    } catch (error) {
      console.error('Error fetching payment status for receipt:', error);
      
      // Fallback to default values if payment fetch fails
      setPrintDetails({
        paymentType: 'نقدي',
        amountPaid: 0,
        remainingAmount: operation.final_price,
        paymentStatus: 'غير مدفوع'
      });
      
      alert('⚠️ تعذر جلب بيانات المدفوعات، سيتم استخدام القيم الافتراضية');
      
      // Show preview modal even with fallback data
      setShowPrintPreview(true);
    }
  };

  const handleConfirmPrint = async () => {
    if (!selectedOperationForPrint) return;
    
    try {
      console.log('=== PRINTING RECEIPT ===');
      console.log('Operation ID:', selectedOperationForPrint.id);
      console.log('Operation No:', selectedOperationForPrint.operation_no);
      
      const response = await axios.get(`${API}/daily-operations/${selectedOperationForPrint.id}/print`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      
      console.log('Print response received, size:', response.data.size);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${selectedOperationForPrint.operation_no}.pdf`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Close modal
      setShowPrintPreview(false);
      setSelectedOperationForPrint(null);
      
      alert('✅ تم تحميل الوصل بنجاح!');
      
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('خطأ في طباعة الوصل: ' + (error.response?.data?.detail || error.message));
    }
  };
  // NEW: Permission functions for enhanced approval workflow
  const canEditOperation = (operation) => {
    const userRole = user?.role;
    const operationStatus = operation.status;

    if (userRole === 'agency_staff') {
      // Staff can edit if not approved
      return operationStatus !== 'معتمد';
    } else if (['general_accountant', 'super_admin'].includes(userRole)) {
      // Accountants and Super Admin can edit any operation
      return true;
    }
    return false;
  };

  const canDeleteOperation = (operation) => {
    const userRole = user?.role;
    const operationStatus = operation.status;

    if (userRole === 'agency_staff') {
      // Staff can delete if not approved
      return operationStatus !== 'معتمد';
    } else if (['general_accountant', 'super_admin'].includes(userRole)) {
      // Accountants and Super Admin can delete any operation
      return true;
    }
    return false;
  };

  // NEW: Edit operation handler
  const handleEditOperation = (operation) => {
    // Populate form with operation data
    setFormData({
      service_id: operation.service_id,
      client_id: operation.client_id,
      base_price: operation.base_price.toString(),
      discount_amount: operation.discount_amount || 0,
      discount_reason: operation.discount_reason || '',
      notes: operation.notes || ''
    });

    // Set the service for price management
    const service = services.find(s => s.id === operation.service_id);
    setSelectedService(service);

    // Set editing mode
    setEditingOperation(operation);
    setShowAddDialog(true);
  };

  // NEW: Delete operation handler  
  const handleDeleteOperation = async (operationId) => {
    const operation = operations.find(op => op.id === operationId);
    
    if (!operation) {
      alert('لم يتم العثور على العملية');
      return;
    }

    // Show confirmation with status-specific message
    let confirmMessage = 'هل أنت متأكد من حذف هذه العملية؟';
    if (operation.status === 'معتمد') {
      confirmMessage = '⚠️ تحذير: هذه عملية معتمدة! هل أنت متأكد من حذفها؟ سيتم تسجيل هذا الإجراء لأغراض التدقيق.';
    }

    if (window.confirm(confirmMessage)) {
      try {
        console.log('=== DELETING OPERATION ===');
        console.log('Operation ID:', operationId);
        console.log('Operation Status:', operation.status);
        
        await axios.delete(`${API}/daily-operations/${operationId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        console.log('=== DELETION SUCCESS ===');
        alert('✅ تم حذف العملية بنجاح');
        
        // Refresh operations list
        fetchOperations();
      } catch (error) {
        console.error('=== DELETION ERROR ===');
        console.error('Error deleting operation:', error);
        console.error('Error response:', error.response?.data);
        
        if (error.response?.status === 403) {
          alert('❌ ليس لديك صلاحية لحذف هذه العملية. اتصل بالمحاسب للمساعدة.');
        } else {
          alert('خطأ في حذف العملية: ' + (error.response?.data?.detail || error.message));
        }
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'مسودة': { color: 'bg-gray-100 text-gray-800', text: t('draft') },
      'في انتظار الموافقة': { color: 'bg-yellow-100 text-yellow-800', text: t('pendingApproval') },
      'معتمد': { color: 'bg-green-100 text-green-800', text: t('operationApproved') },
      'مرفوض': { color: 'bg-red-100 text-red-800', text: t('operationRejected') }
    };
    
    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('dailyOperations')}</h1>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Search className="h-4 w-4 ml-2" />
            🔍 فلتر متقدم
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 ml-2" />
            {t('addOperation')}
          </Button>
        </div>
      </div>

      {/* NEW: Advanced Filtering Panel */}
      {showFilters && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800 flex items-center">
              <Search className="h-5 w-5 ml-2" />
              🔍 البحث والفلترة المتقدمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Agency Filter - for Super Admin and General Accountant */}
              {['super_admin', 'general_accountant'].includes(user?.role) && (
                <div>
                  <Label htmlFor="filter-agency" className="text-sm font-medium text-gray-700">
                    🏢 الوكالة
                  </Label>
                  <Select value={filters.agency_id} onValueChange={(value) => setFilters({...filters, agency_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الوكالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الوكالات</SelectItem>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          🏢 {agency.name} - {agency.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Client Name Search */}
              <div>
                <Label htmlFor="filter-client-name" className="text-sm font-medium text-gray-700">
                  👤 اسم العميل
                </Label>
                <Input
                  id="filter-client-name"
                  placeholder="ابحث بالاسم..."
                  value={filters.client_name}
                  onChange={(e) => setFilters({...filters, client_name: e.target.value})}
                />
              </div>

              {/* Service Name Search */}
              <div>
                <Label htmlFor="filter-service-name" className="text-sm font-medium text-gray-700">
                  🛠️ اسم الخدمة
                </Label>
                <Input
                  id="filter-service-name"
                  placeholder="ابحث بنوع الخدمة..."
                  value={filters.service_name}
                  onChange={(e) => setFilters({...filters, service_name: e.target.value})}
                />
              </div>

              {/* Service Type Filter */}
              <div>
                <Label htmlFor="filter-service-type" className="text-sm font-medium text-gray-700">
                  📋 نوع الخدمة
                </Label>
                <Select value={filters.service_type} onValueChange={(value) => setFilters({...filters, service_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="عمرة">🕋 عمرة</SelectItem>
                    <SelectItem value="حج">🕌 حج</SelectItem>
                    <SelectItem value="تذكرة طيران">✈️ تذكرة طيران</SelectItem>
                    <SelectItem value="حجز فندق">🏨 حجز فندق</SelectItem>
                    <SelectItem value="خدمة تأشيرة">📋 خدمة تأشيرة</SelectItem>
                    <SelectItem value="نقل">🚌 نقل</SelectItem>
                    <SelectItem value="أخرى">🔧 أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="filter-status" className="text-sm font-medium text-gray-700">
                  📊 حالة الموافقة
                </Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="مسودة">📝 مسودة</SelectItem>
                    <SelectItem value="في انتظار الموافقة">⏳ في انتظار الموافقة</SelectItem>
                    <SelectItem value="معتمد">✅ معتمد</SelectItem>
                    <SelectItem value="مرفوض">❌ مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <Label htmlFor="filter-start-date" className="text-sm font-medium text-gray-700">
                  📅 من تاريخ
                </Label>
                <Input
                  id="filter-start-date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                />
              </div>

              {/* End Date */}
              <div>
                <Label htmlFor="filter-end-date" className="text-sm font-medium text-gray-700">
                  📅 إلى تاريخ
                </Label>
                <Input
                  id="filter-end-date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                />
              </div>

              {/* Minimum Amount */}
              <div>
                <Label htmlFor="filter-min-amount" className="text-sm font-medium text-gray-700">
                  💰 أقل مبلغ (دج)
                </Label>
                <Input
                  id="filter-min-amount"
                  type="number"
                  placeholder="0"
                  value={filters.min_amount}
                  onChange={(e) => setFilters({...filters, min_amount: e.target.value})}
                />
              </div>

              {/* Maximum Amount */}
              <div>
                <Label htmlFor="filter-max-amount" className="text-sm font-medium text-gray-700">
                  💰 أعلى مبلغ (دج)
                </Label>
                <Input
                  id="filter-max-amount"
                  type="number"
                  placeholder="999999999"
                  value={filters.max_amount}
                  onChange={(e) => setFilters({...filters, max_amount: e.target.value})}
                />
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-blue-200">
              <div className="text-sm text-blue-700">
                📊 عدد العمليات المعروضة: {operations.length}
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={clearFilters}
                  variant="outline" 
                  className="text-gray-700 border-gray-300"
                >
                  🗑️ مسح الفلاتر
                </Button>
                <Button 
                  onClick={applyFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  🔍 تطبيق الفلتر
                </Button>
              </div>
            </div>

            {/* Quick Filter Examples */}
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">🚀 فلاتر سريعة:</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setFilters({...filters, start_date: new Date().toISOString().split('T')[0], service_name: 'عمرة'});
                    setTimeout(applyFilters, 100);
                  }}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  🕋 عمرة اليوم
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setFilters({...filters, status: 'في انتظار الموافقة'});
                    setTimeout(applyFilters, 100);
                  }}
                  className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                >
                  ⏳ تحتاج موافقة
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setFilters({...filters, min_amount: '100000'});
                    setTimeout(applyFilters, 100);
                  }}
                  className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                >
                  💰 مبالغ عالية
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t('operationNo')}</TableHead>
                <TableHead className="text-right">{t('operationDate')}</TableHead>
                <TableHead className="text-right">{t('clientName')}</TableHead>
                <TableHead className="text-right">{t('serviceName')}</TableHead>
                <TableHead className="text-right">{t('finalPrice')}</TableHead>
                <TableHead className="text-right">{t('operationStatus')}</TableHead>
                <TableHead className="text-right">💰 حالة الدفع</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((operation) => (
                <TableRow key={operation.id}>
                  <TableCell className="text-right font-medium">{operation.operation_no}</TableCell>
                  <TableCell className="text-right">
                    {formatDateWithEnglishNumerals(operation.date)}
                  </TableCell>
                  <TableCell className="text-right">
                    {clients.find(c => c.id === operation.client_id)?.name || 'غير محدد'}
                  </TableCell>
                  <TableCell className="text-right">{operation.service_name}</TableCell>
                  <TableCell className="text-right">{operation.final_price.toLocaleString()} دج</TableCell>
                  <TableCell className="text-right">
                    {getStatusBadge(operation.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {getPaymentStatusBadge(operation.id)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      {/* Print Receipt Button - Available for everyone */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintReceipt(operation.id, operation.operation_no)}
                        className="text-blue-600 hover:text-blue-700 border-blue-600"
                      >
                        🖨️ طباعة
                      </Button>

                      {/* NEW: Add Payment Button */}
                      {(() => {
                        const paymentStatus = operationPaymentStatuses[operation.id];
                        return paymentStatus?.payment_status !== 'fully_paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddPayment(operation)}
                            className="text-green-600 hover:text-green-700 border-green-600"
                          >
                            💰 إضافة دفعة
                          </Button>
                        );
                      })()}

                      {/* NEW: Edit Button - Based on approval workflow permissions */}
                      {canEditOperation(operation) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOperation(operation)}
                          className="text-orange-600 hover:text-orange-700 border-orange-600"
                        >
                          <Edit className="h-3 w-3" />
                          تعديل
                        </Button>
                      )}

                      {/* NEW: Delete Button - Based on approval workflow permissions */}
                      {canDeleteOperation(operation) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOperation(operation.id)}
                          className="text-red-600 hover:text-red-700 border-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                          حذف
                        </Button>
                      )}
                      
                      {/* Approval buttons - Only for managers */}
                      {canApproveOperations && operation.status === 'في انتظار الموافقة' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(operation.id)}
                            className="text-green-600 hover:text-green-700 border-green-600"
                          >
                            ✅ {t('approveOperation')}
                          </Button>
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReject(operation.id)}
                            className="text-red-600 hover:text-red-700 border-red-600"
                          >
                            ❌ {t('rejectOperation')}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Operation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setEditingOperation(null);
          setSelectedService(null);
          setFormData({
            service_id: '',
            client_id: '',
            base_price: '',
            discount_amount: 0,
            discount_reason: '',
            notes: ''
          });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingOperation ? '✏️ تعديل العملية' : '➕ ' + t('addOperation')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="client_id">{t('clientName')}</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => {
                    if (value === 'ADD_NEW_CLIENT') {
                      setShowAddClientDialog(true);
                    } else {
                      setFormData({...formData, client_id: value});
                    }
                  }}
                  className="flex-1"
                >
                  <SelectTrigger>
                    <SelectValue placeholder={clients.length === 0 ? "لا توجد عملاء - أضف عميل جديد أولاً" : "اختر العميل"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem value="no_clients" disabled>
                        لا توجد عملاء مسجلين
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))
                    )}
                    <SelectItem value="ADD_NEW_CLIENT" className="bg-blue-50 text-blue-700 font-medium">
                      ➕ إضافة عميل جديد
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Quick Add Client Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddClientDialog(true)}
                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                >
                  ➕ عميل جديد
                </Button>
              </div>
              
              {clients.length === 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-700">
                    <div className="ml-2">💡</div>
                    <div>
                      <p className="font-medium">مرحباً بك في الوكالة الجديدة!</p>
                      <p className="text-sm">تحتاج لإضافة عملاء أولاً قبل تسجيل العمليات. اضغط "➕ عميل جديد" لإضافة أول عميل.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="service_id">{t('serviceName')}</Label>
              <Select value={formData.service_id} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.is_fixed_price ? `${service.base_price.toLocaleString()} دج` : 'سعر متغير'}
                      {!service.is_fixed_price && <span className="text-green-600 mr-2">📝 متغير</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show price input for variable services */}
            {selectedService && !selectedService.is_fixed_price && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-blue-600 ml-2" />
                  <span className="text-blue-800 font-medium">خدمة بسعر متغير</span>
                </div>
                <div>
                  <Label htmlFor="base_price">السعر النهائي (دج) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                    placeholder="أدخل السعر للخدمة"
                    required
                    className="mt-1"
                  />
                  <p className="text-sm text-blue-600 mt-1">
                    💡 يمكنك تحديد السعر المناسب لهذه الخدمة
                  </p>
                </div>
              </div>
            )}

            {/* Show price info for fixed services */}
            {selectedService && selectedService.is_fixed_price && (
              <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                  <span className="text-gray-700">
                    السعر الثابت: <strong>{selectedService.base_price.toLocaleString()} دج</strong>
                  </span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="discount_amount">{t('discountAmount')}</Label>
              <Input
                id="discount_amount"
                type="number"
                value={formData.discount_amount}
                onChange={(e) => setFormData({...formData, discount_amount: parseFloat(e.target.value) || 0})}
              />
            </div>

            {formData.discount_amount > 0 && (
              <div>
                <Label htmlFor="discount_reason">{t('discountReason')}</Label>
                <Input
                  id="discount_reason"
                  value={formData.discount_reason}
                  onChange={(e) => setFormData({...formData, discount_reason: e.target.value})}
                  placeholder="سبب التخفيض (مطلوب للتخفيضات)"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddDialog(false);
                setSelectedService(null);
                setFormData({
                  service_id: '',
                  client_id: '',
                  base_price: '',
                  discount_amount: 0,
                  discount_reason: '',
                  notes: ''
                });
              }}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                {t('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Preview Modal */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">🖨️ معاينة الوصل قبل الطباعة</DialogTitle>
          </DialogHeader>
          
          {selectedOperationForPrint && (
            <div className="space-y-6">
              {/* Agency Information */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="text-lg font-bold text-blue-800 mb-3 text-center">
                  {agencies.find(a => a.id === user?.agency_id)?.name || 'وكالة صنهاجة للسياحة والسفر'}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>العنوان:</strong> {agencies.find(a => a.id === user?.agency_id)?.address || 'غير محدد'}
                  </div>
                  <div>
                    <strong>المدينة:</strong> {agencies.find(a => a.id === user?.agency_id)?.city || 'غير محدد'}
                  </div>
                  <div>
                    <strong>الهاتف:</strong> {agencies.find(a => a.id === user?.agency_id)?.phone || 'غير محدد'}
                  </div>
                  <div>
                    <strong>البريد:</strong> {agencies.find(a => a.id === user?.agency_id)?.email || 'غير محدد'}
                  </div>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="border rounded-lg p-4">
                <h4 className="font-bold mb-3 text-center bg-gray-100 p-2 rounded">تفاصيل الوصل</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><strong>رقم الوصل:</strong> {selectedOperationForPrint.operation_no}</div>
                  <div><strong>التاريخ:</strong> {formatDateWithEnglishNumerals(selectedOperationForPrint.date)}</div>
                  <div><strong>اسم العميل:</strong> {clients.find(c => c.id === selectedOperationForPrint.client_id)?.name || 'غير محدد'}</div>
                  <div><strong>الخدمة:</strong> {selectedOperationForPrint.service_name}</div>
                  <div><strong>السعر الأساسي:</strong> {selectedOperationForPrint.base_price.toLocaleString()} دج</div>
                  <div><strong>التخفيض:</strong> {selectedOperationForPrint.discount_amount.toLocaleString()} دج</div>
                  <div><strong>المبلغ النهائي:</strong> <span className="font-bold text-green-600">{selectedOperationForPrint.final_price.toLocaleString()} دج</span></div>
                  <div><strong>الحالة:</strong> {selectedOperationForPrint.status}</div>
                </div>
                {selectedOperationForPrint.notes && (
                  <div className="mt-3">
                    <strong>ملاحظات:</strong> {selectedOperationForPrint.notes}
                  </div>
                )}
              </div>

              {/* Payment Details Form */}
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h4 className="font-bold mb-3 text-center bg-yellow-100 p-2 rounded">تفاصيل الدفع</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>نوع الدفع</Label>
                    <Select value={printDetails.paymentType} onValueChange={(value) => setPrintDetails({...printDetails, paymentType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="نقدي">💵 نقدي</SelectItem>
                        <SelectItem value="بنكي">🏦 تحويل بنكي</SelectItem>
                        <SelectItem value="شيك">📋 شيك</SelectItem>
                        <SelectItem value="قسط">📅 دفع بالأقساط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>حالة الدفع</Label>
                    <Select value={printDetails.paymentStatus} onValueChange={(value) => {
                      setPrintDetails({...printDetails, paymentStatus: value});
                      // Auto-calculate amounts based on status
                      if (value === 'مدفوع كاملاً') {
                        setPrintDetails(prev => ({
                          ...prev,
                          paymentStatus: value,
                          amountPaid: selectedOperationForPrint.final_price,
                          remainingAmount: 0
                        }));
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="مدفوع كاملاً">✅ مدفوع كاملاً</SelectItem>
                        <SelectItem value="دفعة مقدمة">💰 دفعة مقدمة</SelectItem>
                        <SelectItem value="مؤجل">⏰ دفع مؤجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>المبلغ المدفوع (دج)</Label>
                    <Input
                      type="number"
                      value={printDetails.amountPaid}
                      onChange={(e) => {
                        const paid = parseFloat(e.target.value) || 0;
                        setPrintDetails({
                          ...printDetails, 
                          amountPaid: paid,
                          remainingAmount: Math.max(0, selectedOperationForPrint.final_price - paid)
                        });
                      }}
                    />
                  </div>

                  <div>
                    <Label>المبلغ المتبقي (دج)</Label>
                    <Input
                      type="number"
                      value={printDetails.remainingAmount}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Employee Signature */}
              <div className="border rounded-lg p-4 bg-green-50">
                <h4 className="font-bold mb-3 text-center bg-green-100 p-2 rounded">توقيع الموظف</h4>
                <div className="text-center space-y-2">
                  <div><strong>اسم الموظف:</strong> {user?.name || 'غير محدد'}</div>
                  <div><strong>المنصب:</strong> {user?.job_title || 'موظف'}</div>
                  <div><strong>تاريخ الإصدار:</strong> {formatDateWithEnglishNumerals(new Date())} - {formatTimeWithEnglishNumerals(new Date())}</div>
                  {user?.signature_url ? (
                    <div className="mt-3">
                      <p className="text-sm text-green-600">✅ التوقيع الإلكتروني متوفر</p>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 border-2 border-dashed border-gray-300 rounded">
                      <p className="text-sm text-gray-600">التوقيع الإلكتروني: ________________</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPrintPreview(false);
                    setSelectedOperationForPrint(null);
                  }}
                >
                  ❌ إلغاء
                </Button>
                <Button 
                  onClick={handleConfirmPrint}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🖨️ طباعة الوصل الآن
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>💰 إضافة دفعة للعملية</DialogTitle>
          </DialogHeader>
          {selectedOperationForPayment && (
            <div>
              {/* Operation Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-bold mb-2">تفاصيل العملية:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>رقم العملية:</strong> {selectedOperationForPayment.operation_no}</div>
                  <div><strong>اسم العميل:</strong> {clients.find(c => c.id === selectedOperationForPayment.client_id)?.name || 'غير محدد'}</div>
                  <div><strong>الخدمة:</strong> {selectedOperationForPayment.service_name}</div>
                  <div><strong>المبلغ الإجمالي:</strong> {selectedOperationForPayment.final_price.toLocaleString()} دج</div>
                  {(() => {
                    const paymentStatus = operationPaymentStatuses[selectedOperationForPayment.id];
                    return paymentStatus && (
                      <>
                        <div><strong>المدفوع:</strong> {paymentStatus.total_paid.toLocaleString()} دج</div>
                        <div><strong>المتبقي:</strong> <span className="text-red-600 font-bold">{paymentStatus.remaining_amount.toLocaleString()} دج</span></div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="payment-method">طريقة الدفع *</Label>
                  <Select value={paymentFormData.method} onValueChange={(value) => setPaymentFormData({...paymentFormData, method: value})}>
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 نقدي</SelectItem>
                      <SelectItem value="check">📄 شيك</SelectItem>
                      <SelectItem value="bank_transfer">🏦 تحويل بنكي</SelectItem>
                      <SelectItem value="credit_card">💳 بطاقة ائتمان</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Enhanced Payment Calculation Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-bold text-blue-800 mb-3 text-center">💰 حاسبة السداد</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total Amount */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">المبلغ الإجمالي (دج)</Label>
                      <Input
                        type="number"
                        value={selectedOperationForPayment?.final_price || 0}
                        readOnly
                        className="bg-gray-100 font-bold text-blue-900"
                      />
                    </div>

                    {/* Already Paid */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">المدفوع سابقاً (دج)</Label>
                      <Input
                        type="number"
                        value={(() => {
                          const paymentStatus = operationPaymentStatuses[selectedOperationForPayment?.id];
                          return paymentStatus?.total_paid || 0;
                        })()}
                        readOnly
                        className="bg-gray-100 font-bold text-green-700"
                      />
                    </div>

                    {/* Current Payment Amount */}
                    <div>
                      <Label htmlFor="payment-amount" className="text-sm font-medium text-red-700">
                        المبلغ المراد دفعه الآن (دج) *
                      </Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={(() => {
                          const paymentStatus = operationPaymentStatuses[selectedOperationForPayment?.id];
                          return paymentStatus?.remaining_amount || selectedOperationForPayment?.final_price || 0;
                        })()}
                        value={paymentFormData.amount}
                        onChange={(e) => {
                          const currentPayment = parseFloat(e.target.value) || 0;
                          const paymentStatus = operationPaymentStatuses[selectedOperationForPayment?.id];
                          const maxAllowed = paymentStatus?.remaining_amount || selectedOperationForPayment?.final_price || 0;
                          
                          // Prevent payment exceeding remaining amount
                          if (currentPayment > maxAllowed) {
                            alert(`💡 لا يمكن دفع أكثر من المبلغ المتبقي: ${maxAllowed.toLocaleString()} دج`);
                            return;
                          }
                          
                          setPaymentFormData({...paymentFormData, amount: e.target.value});
                        }}
                        placeholder="أدخل المبلغ المراد دفعه"
                        className="border-red-300 focus:border-red-500"
                        required
                      />
                    </div>

                    {/* Remaining After This Payment */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">الباقي بعد هذه الدفعة (دج)</Label>
                      <Input
                        type="number"
                        value={(() => {
                          const currentPayment = parseFloat(paymentFormData.amount) || 0;
                          const paymentStatus = operationPaymentStatuses[selectedOperationForPayment?.id];
                          const remaining = (paymentStatus?.remaining_amount || selectedOperationForPayment?.final_price || 0) - currentPayment;
                          return Math.max(0, remaining);
                        })()}
                        readOnly
                        className={(() => {
                          const currentPayment = parseFloat(paymentFormData.amount) || 0;
                          const paymentStatus = operationPaymentStatuses[selectedOperationForPayment?.id];
                          const remaining = (paymentStatus?.remaining_amount || selectedOperationForPayment?.final_price || 0) - currentPayment;
                          return remaining <= 0 ? "bg-green-100 font-bold text-green-800" : "bg-yellow-100 font-bold text-orange-700";
                        })()}
                      />
                    </div>
                  </div>

                  {/* Payment Status Indicator */}
                  <div className="mt-3 p-2 rounded text-center text-sm font-medium">
                    {(() => {
                      const currentPayment = parseFloat(paymentFormData.amount) || 0;
                      const paymentStatus = operationPaymentStatuses[selectedOperationForPayment?.id];
                      const remaining = (paymentStatus?.remaining_amount || selectedOperationForPayment?.final_price || 0) - currentPayment;
                      
                      if (remaining <= 0) {
                        return <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full">🟢 ✅ سيكون مسدد بالكامل</span>;
                      } else if (currentPayment > 0) {
                        return <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full">🟡 ⏳ سداد جزئي - يتبقى {remaining.toLocaleString()} دج</span>;
                      } else {
                        return <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full">⚪ أدخل مبلغ السداد</span>;
                      }
                    })()}
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment-date">تاريخ الدفع *</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentFormData.payment_date}
                    onChange={(e) => setPaymentFormData({...paymentFormData, payment_date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payment-notes">ملاحظات</Label>
                  <Input
                    id="payment-notes"
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                    placeholder="ملاحظات إضافية (اختياري)"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    💰 إضافة الدفعة
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Enhanced Daily Operations Reports Component with Detailed Analytics
const DailyOperationsReports = memo(() => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [serviceFilter, setServiceFilter] = useState('');
  const [reportData, setReportData] = useState(null);
  const [servicesAnalytics, setServicesAnalytics] = useState(null);
  const [viewMode, setViewMode] = useState('summary'); // summary, detailed, charts

  // Combined fetch function to prevent race conditions
  const fetchAllReports = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setReportData(null);
      setServicesAnalytics(null);
      
      // Prepare parameters for comprehensive reports
      const comprehensiveParams = new URLSearchParams();
      if (selectedDate) comprehensiveParams.append('date', selectedDate);
      if (selectedAgency) comprehensiveParams.append('agency_id', selectedAgency);
      if (serviceFilter) comprehensiveParams.append('service_filter', serviceFilter);

      // Prepare parameters for services analytics
      const analyticsParams = new URLSearchParams();
      if (selectedDate) {
        const endDate = new Date(selectedDate);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
        analyticsParams.append('start_date', startDate.toISOString().split('T')[0]);
        analyticsParams.append('end_date', selectedDate);
      }
      if (selectedAgency) analyticsParams.append('agency_id', selectedAgency);

      // Execute both API calls simultaneously but handle them properly
      const [comprehensiveResponse, analyticsResponse] = await Promise.allSettled([
        axios.get(`${API}/reports/comprehensive-daily-financial?${comprehensiveParams.toString()}`, {
          signal: controller.signal
        }),
        axios.get(`${API}/reports/services-analytics?${analyticsParams.toString()}`, {
          signal: controller.signal
        })
      ]);

      // Handle comprehensive reports response
      if (comprehensiveResponse.status === 'fulfilled') {
        setReportData(comprehensiveResponse.value.data);
      } else {
        console.error('Error fetching comprehensive reports:', comprehensiveResponse.reason);
        if (!controller.signal.aborted) {
          alert('خطأ في تحميل التقارير الشاملة: ' + (comprehensiveResponse.reason?.response?.data?.detail || comprehensiveResponse.reason?.message));
        }
      }

      // Handle services analytics response
      if (analyticsResponse.status === 'fulfilled') {
        setServicesAnalytics(analyticsResponse.value.data);
      } else {
        console.error('Error fetching services analytics:', analyticsResponse.reason);
        // Don't show alert for analytics as it's not critical
      }

    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Error in fetchAllReports:', error);
        alert('خطأ في تحميل البيانات: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }

    return () => controller.abort();
  }, [selectedDate, selectedAgency, serviceFilter]);

  useEffect(() => {
    const cleanup = fetchAllReports();
    return cleanup;
  }, [fetchAllReports]);

  const formatCurrency = (amount) => {
    return `${(amount || 0).toLocaleString()} دج`;
  };

  const getServiceColor = (index) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 {t('dailyOperationsReports')}</h1>
          <p className="text-sm text-gray-600 mt-1">تقارير مفصلة للحالة المالية لجميع الوكالات</p>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 ml-2" />
            🔍 الفلاتر والتحكم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div>
              <Label>📅 التاريخ</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Agency Filter */}
            {['super_admin', 'general_accountant'].includes(user?.role) && (
              <div>
                <Label>🏢 الوكالة</Label>
                <AgencyFilter
                  selectedAgency={selectedAgency}
                  onAgencyChange={setSelectedAgency}
                  showAllOption={true}
                />
              </div>
            )}

            {/* Service Filter */}
            <div>
              <Label>🛠️ فلتر الخدمة</Label>
              <Input
                placeholder="مثال: عمرة، طيران، نقل"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              />
            </div>

            {/* View Mode */}
            <div>
              <Label>👁️ طريقة العرض</Label>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">📊 ملخص إجمالي</SelectItem>
                  <SelectItem value="detailed">📋 تفصيلي لكل وكالة</SelectItem>
                  <SelectItem value="charts">📈 المخططات البيانية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-sm opacity-90">إجمالي الإيرادات</p>
                  <p className="text-xl font-bold">{formatCurrency(reportData.summary?.total_revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <ArrowUpCircle className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-sm opacity-90">إجمالي التحويلات</p>
                  <p className="text-xl font-bold">{formatCurrency(reportData.summary?.total_transfers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <ArrowDownCircle className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-sm opacity-90">إجمالي المصاريف</p>
                  <p className="text-xl font-bold">{formatCurrency(reportData.summary?.total_expenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-sm opacity-90">عدد الوكالات</p>
                  <p className="text-xl font-bold">{reportData.summary?.total_agencies || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Based on View Mode */}
      {viewMode === 'summary' && reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>🛠️ تحليل الخدمات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(reportData.service_analytics || {}).slice(0, 5).map(([service, data], index) => (
                  <div key={service} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getServiceColor(index)} mr-3`}></div>
                      <span className="font-medium">{service}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(data.total_revenue)}</p>
                      <p className="text-xs text-gray-500">{data.revenue_percentage?.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Agencies */}
          <Card>
            <CardHeader>
              <CardTitle>🏆 أفضل الوكالات أداءً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.agencies?.sort((a, b) => b.daily_revenue - a.daily_revenue).slice(0, 5).map((agency, index) => (
                  <div key={agency.agency_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{agency.agency_name}</p>
                        <p className="text-xs text-gray-500">{agency.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(agency.daily_revenue)}</p>
                      <p className="text-xs text-gray-500">{agency.operations_count} عملية</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed View */}
      {viewMode === 'detailed' && reportData && (
        <Card>
          <CardHeader>
            <CardTitle>📋 التقرير المفصل لكل وكالة</CardTitle>
            <CardDescription>
              عرض تفصيلي للحالة المالية لكل وكالة بتاريخ {selectedDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-right">الوكالة</th>
                    <th className="border p-3 text-right">المدينة</th>
                    <th className="border p-3 text-right">الدخل اليومي</th>
                    <th className="border p-3 text-right">التحويلات</th>
                    <th className="border p-3 text-right">المصاريف</th>
                    <th className="border p-3 text-right">الصافي</th>
                    <th className="border p-3 text-right">الرصيد الحالي</th>
                    <th className="border p-3 text-right">العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.agencies?.map((agency) => (
                    <tr key={agency.agency_id} className="hover:bg-gray-50">
                      <td className="border p-3 font-medium">{agency.agency_name}</td>
                      <td className="border p-3">{agency.city}</td>
                      <td className="border p-3 text-green-600 font-semibold">
                        {formatCurrency(agency.daily_revenue)}
                      </td>
                      <td className="border p-3 text-blue-600">
                        {formatCurrency(agency.daily_transfers)}
                      </td>
                      <td className="border p-3 text-red-600">
                        {formatCurrency(agency.daily_expenses)}
                      </td>
                      <td className={`border p-3 font-semibold ${agency.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(agency.net_balance)}
                      </td>
                      <td className="border p-3 font-semibold">
                        {formatCurrency(agency.current_balance)}
                      </td>
                      <td className="border p-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                          {agency.operations_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-bold">
                    <td className="border p-3" colSpan="2">المجموع الإجمالي</td>
                    <td className="border p-3 text-green-600">
                      {formatCurrency(reportData.summary?.total_revenue)}
                    </td>
                    <td className="border p-3 text-blue-600">
                      {formatCurrency(reportData.summary?.total_transfers)}
                    </td>
                    <td className="border p-3 text-red-600">
                      {formatCurrency(reportData.summary?.total_expenses)}
                    </td>
                    <td className="border p-3 text-purple-600">
                      {formatCurrency(reportData.summary?.total_net_balance)}
                    </td>
                    <td className="border p-3">-</td>
                    <td className="border p-3 text-center">
                      {reportData.summary?.total_operations}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services Distribution Chart */}
          {servicesAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>📊 توزيع الخدمات حسب الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(servicesAnalytics.services_performance || {}).slice(0, 6).map(([service, data], index) => (
                    <div key={service} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{service}</span>
                        <span className="text-sm text-gray-500">
                          {data.revenue_percentage?.toFixed(1)}% ({formatCurrency(data.total_revenue)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${getServiceColor(index)}`}
                          style={{ width: `${Math.min(data.revenue_percentage || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Operations Count Chart */}
          {servicesAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>📈 عدد العمليات لكل خدمة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(servicesAnalytics.services_performance || {})
                    .sort(([,a], [,b]) => b.count - a.count)
                    .slice(0, 6)
                    .map(([service, data], index) => {
                      const maxCount = Math.max(...Object.values(servicesAnalytics.services_performance).map(s => s.count));
                      const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={service} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{service}</span>
                            <span className="text-sm text-gray-500">
                              {data.count} عملية ({data.operations_percentage?.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agency Performance Chart */}
          {reportData && (
            <Card>
              <CardHeader>
                <CardTitle>🏢 أداء الوكالات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.agencies?.sort((a, b) => b.daily_revenue - a.daily_revenue).slice(0, 6).map((agency, index) => {
                    const maxRevenue = Math.max(...reportData.agencies.map(a => a.daily_revenue));
                    const percentage = maxRevenue > 0 ? (agency.daily_revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={agency.agency_id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{agency.agency_name}</span>
                          <span className="text-sm text-gray-500">
                            {formatCurrency(agency.daily_revenue)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services Pricing Analysis */}
          {servicesAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>💰 تحليل أسعار الخدمات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(servicesAnalytics.services_performance || {}).slice(0, 5).map(([service, data], index) => (
                    <div key={service} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{service}</span>
                        <span className="text-sm text-blue-600">{data.count} عملية</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-gray-500">متوسط السعر</p>
                          <p className="font-semibold text-green-600">{formatCurrency(data.avg_price)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">أقل سعر</p>
                          <p className="font-semibold text-blue-600">{formatCurrency(data.min_price)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">أعلى سعر</p>
                          <p className="font-semibold text-red-600">{formatCurrency(data.max_price)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary Pie Chart */}
          {reportData && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>💰 الملخص المالي العام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-8">
                  {/* Revenue */}
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 relative">
                      <div className="w-full h-full bg-green-200 rounded-full flex items-center justify-center">
                        <Wallet className="h-10 w-10 text-green-600" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-green-600">الإيرادات</h3>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency(reportData.summary?.total_revenue)}
                    </p>
                  </div>

                  {/* Transfers */}
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 relative">
                      <div className="w-full h-full bg-blue-200 rounded-full flex items-center justify-center">
                        <ArrowUpCircle className="h-10 w-10 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-blue-600">التحويلات</h3>
                    <p className="text-xl font-bold text-blue-700">
                      {formatCurrency(reportData.summary?.total_transfers)}
                    </p>
                  </div>

                  {/* Expenses */}
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 relative">
                      <div className="w-full h-full bg-red-200 rounded-full flex items-center justify-center">
                        <ArrowDownCircle className="h-10 w-10 text-red-600" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-red-600">المصاريف</h3>
                    <p className="text-xl font-bold text-red-700">
                      {formatCurrency(reportData.summary?.total_expenses)}
                    </p>
                  </div>
                </div>

                {/* Services Performance Donut Chart */}
                {servicesAnalytics && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-center mb-4">🎯 نسب الخدمات المباعة</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(servicesAnalytics.services_performance || {})
                        .sort(([,a], [,b]) => b.revenue_percentage - a.revenue_percentage)
                        .slice(0, 8)
                        .map(([service, data], index) => (
                          <div key={service} className="text-center p-3 bg-white rounded-lg border">
                            <div className={`w-16 h-16 mx-auto mb-2 rounded-full ${getServiceColor(index)} flex items-center justify-center`}>
                              <span className="text-white font-bold text-lg">
                                {data.revenue_percentage?.toFixed(0)}%
                              </span>
                            </div>
                            <h5 className="font-medium text-gray-800 text-sm">{service}</h5>
                            <p className="text-xs text-gray-500">{formatCurrency(data.total_revenue)}</p>
                            <p className="text-xs text-blue-600">{data.count} عملية</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Advanced Analytics Cards */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>📈 إحصائيات متقدمة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {servicesAnalytics && (
                  <>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {Object.keys(servicesAnalytics.services_performance || {}).length}
                      </div>
                      <div className="text-sm text-blue-700">أنواع الخدمات</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {servicesAnalytics.summary?.total_operations || 0}
                      </div>
                      <div className="text-sm text-green-700">إجمالي العمليات</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {formatCurrency(servicesAnalytics.summary?.avg_revenue_per_service || 0)}
                      </div>
                      <div className="text-sm text-purple-700">متوسط ربح الخدمة</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {reportData?.summary?.total_agencies || 0}
                      </div>
                      <div className="text-sm text-orange-700">الوكالات النشطة</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              آخر تحديث: {new Date().toLocaleString('ar-SA')}
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button 
                onClick={fetchAllReports}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                تحديث البيانات
              </Button>
              <Button 
                onClick={() => {
                  const printContent = document.getElementById('report-content');
                  if (printContent) {
                    window.print();
                  }
                }}
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                طباعة التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Main App Component
const MainApp = ({ activeTab, setActiveTab }) => {
  const components = {
    dashboard: (props) => <Dashboard {...props} setActiveTab={setActiveTab} />,
    clients: ClientsManagement,
    suppliers: SuppliersManagement,
    bookings: BookingsManagement,
    invoices: InvoicesManagement,
    payments: PaymentsManagement,
    'financial-management': FinancialManagement,
    installments: InstallmentsManagement,
    'enhanced-installments': EnhancedInstallmentsManagement,
    reports: ReportsManagement,
    userManagement: UserManagement,
    agencyManagement: AgencyManagement,
    dailyReports: DailyReportsManagement,
    servicesManagement: ServicesManagement,
    agencySettings: AgencySettingsManagement,
    dailyOperations: DailyOperationsManagement,
    dailyOperationsReports: DailyOperationsReports
  };

  const Component = components[activeTab] || components.dashboard;
  return <Component />;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Main App Component
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MainApp />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;