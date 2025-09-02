import React, { useState, useEffect, createContext, useContext } from 'react';
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
import { CalendarIcon, Home, Users, Building2, Package, FileText, CreditCard, Wallet, BarChart3, Settings, LogOut, Globe, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock, Bell, AlertTriangle, Info, AlertCircle } from 'lucide-react';
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
            { id: 'payments', label: t('payments') + ' (جميع الوكالات)', icon: CreditCard }
          ]
        }
      ];
    }

    // Agency Staff sees operational functions
    return [
      ...baseItems,
      // Daily Operations Category
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
      // Financial Transactions Category
      {
        category: 'financial',
        label: t('financialManagement'),
        items: [
          { id: 'invoices', label: t('invoices'), icon: FileText },
          { id: 'payments', label: t('payments'), icon: CreditCard },
          { id: 'dailyOperationsReports', label: t('dailyOperationsReports'), icon: BarChart3 }
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
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    invoice_id: '',
    method: '',
    amount: '',
    payment_date: ''
  });

  const fetchData = async () => {
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/payments`),
        axios.get(`${API}/invoices`)
      ]);
      
      // Sort payments by payment date - newest first
      const sortedPayments = paymentsRes.data.sort((a, b) => {
        return new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at);
      });
      
      // Sort invoices by due date - newest first
      const sortedInvoices = invoicesRes.data.sort((a, b) => {
        return new Date(b.due_date || b.created_at) - new Date(a.due_date || a.created_at);
      });
      
      setPayments(sortedPayments);
      setInvoices(sortedInvoices);
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
      const paymentData = {
        invoice_id: formData.invoice_id,
        method: formData.method,
        amount: parseFloat(formData.amount),
        payment_date: new Date(formData.payment_date).toISOString()
      };

      if (editingPayment) {
        await axios.put(`${API}/payments/${editingPayment.id}`, paymentData);
      } else {
        await axios.post(`${API}/payments`, paymentData);
      }
      
      setFormData({
        invoice_id: '',
        method: '',
        amount: '',
        payment_date: ''
      });
      setEditingPayment(null);
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      invoice_id: payment.invoice_id,
      method: payment.method,
      amount: payment.amount.toString(),
      payment_date: payment.payment_date.split('T')[0]
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

  const getInvoiceNo = (invoiceId) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    return invoice ? invoice.invoice_no : 'غير معروف';
  };

  const getMethodBadge = (method) => {
    const methodColors = {
      'cash': 'bg-green-600',
      'bank': 'bg-blue-600',
      'card': 'bg-purple-600'
    };
    
    return (
      <Badge className={methodColors[method] || 'bg-gray-600'}>
        {t(method)}
      </Badge>
    );
  };

  const handlePrintPayments = () => {
    try {
      console.log('=== PRINTING PAYMENTS LIST ===');
      alert(`سيتم طباعة قائمة تحتوي على ${payments.length} دفعة`);
      
      const printContent = `
        <html dir="rtl">
          <head>
            <title>قائمة المدفوعات</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
              h1 { text-align: center; color: #1f2937; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
              th { background-color: #f3f4f6; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>💳 قائمة المدفوعات</h1>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            <table>
              <thead>
                <tr>
                  <th>رقم الدفعة</th>
                  <th>رقم الفاتورة</th>
                  <th>طريقة الدفع</th>
                  <th>المبلغ</th>
                  <th>تاريخ الدفع</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(payment => `
                  <tr>
                    <td>${payment.payment_no}</td>
                    <td>${getInvoiceNo(payment.invoice_id)}</td>
                    <td>${payment.payment_method}</td>
                    <td>${payment.amount.toLocaleString()} دج</td>
                    <td>${new Date(payment.payment_date).toLocaleDateString('ar-SA')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 20px;">
              <p>إجمالي المدفوعات: ${payments.length}</p>
              <p>إجمالي المبلغ: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} دج</p>
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
            alert('✅ تم فتح نافذة طباعة المدفوعات بنجاح!');
          }, 1000);
        };
      } else {
        alert('❌ لم يتم فتح نافذة الطباعة. تأكد من السماح للنوافذ المنبثقة.');
      }
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 2000);
      
    } catch (error) {
      console.error('Error printing payments:', error);
      alert('خطأ في طباعة المدفوعات: ' + error.message);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.payment_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getInvoiceNo(payment.invoice_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('paymentsList')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('addPayment')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPayment ? t('edit') : t('addPayment')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="invoice_id">{t('selectInvoice')}</Label>
                <Select value={formData.invoice_id} onValueChange={(value) => setFormData({ ...formData, invoice_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectInvoice')} />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.filter(invoice => invoice.status === 'pending').map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_no} - {invoice.amount_ttc} دج
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="method">{t('paymentMethod')}</Label>
                <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('paymentMethod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t('cash')}</SelectItem>
                    <SelectItem value="bank">{t('bank')}</SelectItem>
                    <SelectItem value="card">{t('card')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount">{t('amount')} (دج)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="payment_date">{t('paymentDate')}</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
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
                <TableHead>{t('paymentNo')}</TableHead>
                <TableHead>{t('invoice')}</TableHead>
                <TableHead>{t('paymentMethod')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('paymentDate')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {t('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.payment_no}</TableCell>
                    <TableCell>{getInvoiceNo(payment.invoice_id)}</TableCell>
                    <TableCell>{getMethodBadge(payment.method)}</TableCell>
                    <TableCell className="font-medium">{payment.amount} دج</TableCell>
                    <TableCell>{formatDateWithEnglishNumerals(payment.payment_date)}</TableCell>
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
                ))
              )}
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
  const [selectedService, setSelectedService] = useState(null);
  const [printDetails, setPrintDetails] = useState({
    paymentType: 'نقدي', // نقدي، بنكي، قسط
    amountPaid: 0,
    remainingAmount: 0,
    paymentStatus: 'مدفوع كاملاً' // مدفوع كاملاً، دفعة مقدمة، مؤجل
  });
  const [formData, setFormData] = useState({
    service_id: '',
    client_id: '',
    base_price: '', // Allow custom price for variable services
    discount_amount: 0,
    discount_reason: '',
    notes: ''
  });

  // Check if user can approve operations
  const canApproveOperations = user?.role === 'super_admin' || user?.role === 'general_accountant';

  useEffect(() => {
    fetchOperations();
    fetchServices();
    fetchClients();
    fetchAgencies();
  }, []);

  const fetchOperations = async () => {
    try {
      const response = await axios.get(`${API}/daily-operations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Sort operations by date - newest first
      const sortedOperations = response.data.sort((a, b) => {
        return new Date(b.date || b.created_at) - new Date(a.date || a.created_at);
      });
      setOperations(sortedOperations);
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
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
      
      await axios.post(`${API}/daily-operations`, submitData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
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
      fetchOperations();
    } catch (error) {
      console.error('Error creating operation:', error);
      alert('خطأ في إنشاء العملية');
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
    
    // Initialize print details with operation data
    setPrintDetails({
      paymentType: 'نقدي',
      amountPaid: operation.final_price,
      remainingAmount: 0,
      paymentStatus: 'مدفوع كاملاً'
    });
    
    // Show preview modal
    setShowPrintPreview(true);
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
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 ml-2" />
          {t('addOperation')}
        </Button>
      </div>

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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{t('addOperation')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="client_id">{t('clientName')}</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
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
    </div>
  );
};

// Daily Operations Reports Component
const DailyOperationsReports = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [reportData, setReportData] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [groupByAgency, setGroupByAgency] = useState(true);
  const [groupByService, setGroupByService] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState('all');

  useEffect(() => {
    fetchAgencies();
  }, []);

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

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        group_by_agency: groupByAgency.toString(),
        group_by_service: groupByService.toString()
      });

      // Add agency filter if specific agency is selected
      if (selectedAgency !== 'all') {
        params.append('agency_ids', selectedAgency);
      }

      const response = await axios.get(`${API}/reports/daily-operations?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('خطأ في إنتاج التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = async () => {
    try {
      console.log('=== PRINTING REPORT ===');
      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        group_by_agency: groupByAgency.toString()
      });

      // Add agency filter if specific agency is selected
      if (selectedAgency !== 'all') {
        params.append('agency_ids', selectedAgency);
      }

      const apiUrl = `${API}/reports/daily-operations/print?${params}`;
      console.log('Print API URL:', apiUrl);
      console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');

      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      
      console.log('Print response received');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data size:', response.data.size);
      
      // Check if response is actually a PDF
      if (response.data.size === 0) {
        throw new Error('PDF report is empty');
      }
      
      // Create blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      console.log('Report blob created, size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      
      // Ask user for preference
      const userChoice = confirm('اختر طريقة عرض التقرير:\nموافق = فتح في نافذة جديدة\nإلغاء = تحميل الملف');
      
      if (userChoice) {
        // Open in new window
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          console.log('Report PDF opened in new window');
          alert('✅ تم فتح التقرير في نافذة جديدة!');
        } else {
          console.log('New window blocked, trying download');
          triggerReportDownload();
        }
      } else {
        // Download file
        triggerReportDownload();
      }
      
      function triggerReportDownload() {
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily_operations_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        console.log('Report link added, triggering download...');
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log('Report cleanup completed');
        }, 100);
        
        alert('✅ تم تحميل التقرير بنجاح! تحقق من مجلد التحميلات.');
      }
      
      console.log('=== REPORT PRINT SUCCESS ===');
      
    } catch (error) {
      console.error('=== REPORT PRINT ERROR ===');
      console.error('Error printing report:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Check if it's a blob error response
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          console.log('Error blob content:', text);
        } catch (blobError) {
          console.log('Could not read error blob');
        }
      }
      
      alert('خطأ في طباعة التقرير: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">{t('dailyOperationsReports')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات التقرير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>
            <div>
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
          </div>

          {/* NEW: Agency Filter */}
          <div>
            <Label>فلتر الوكالة</Label>
            <Select value={selectedAgency} onValueChange={setSelectedAgency}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الوكالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌐 جميع الوكالات</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name} - {agency.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="groupByAgency"
                checked={groupByAgency}
                onChange={(e) => setGroupByAgency(e.target.checked)}
              />
              <Label htmlFor="groupByAgency">تجميع حسب الوكالة</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="groupByService"
                checked={groupByService}
                onChange={(e) => setGroupByService(e.target.checked)}
              />
              <Label htmlFor="groupByService">تجميع حسب الخدمة</Label>
            </div>
          </div>

          <Button onClick={generateReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'جاري الإنتاج...' : t('generateReport')}
          </Button>

          {/* Print Report Button */}
          {reportData && (
            <Button 
              onClick={handlePrintReport} 
              disabled={loading}
              variant="outline" 
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              🖨️ طباعة التقرير PDF
            </Button>
          )}
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>{reportData.title}</CardTitle>
            <CardDescription>
              {reportData.period}
              {selectedAgency !== 'all' && (
                <span className="mr-2 text-blue-600">
                  • الوكالة: {agencies.find(a => a.id === selectedAgency)?.name}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.group_by_agency && reportData.agencies_data ? (
              <div className="space-y-6">
                {reportData.agencies_data.map((agency, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">{agency.agency_name}</h3>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {agency.totals.operations_count}
                        </div>
                        <div className="text-sm text-gray-600">العمليات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {agency.totals.total_revenue.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">إجمالي الإيرادات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {agency.totals.total_discounts.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">إجمالي التخفيضات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {agency.totals.net_revenue.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">صافي الإيرادات</div>
                      </div>
                    </div>

                    {/* Display detailed operations if available */}
                    {agency.services && Array.isArray(agency.services) && agency.services.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">تفاصيل العمليات:</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">رقم الوصل</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">العميل</TableHead>
                                <TableHead className="text-right">الخدمة</TableHead>
                                <TableHead className="text-right">السعر الأساسي</TableHead>
                                <TableHead className="text-right">التخفيض</TableHead>
                                <TableHead className="text-right">السعر النهائي</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {agency.services.slice(0, 10).map((operation, opIndex) => (
                                <TableRow key={opIndex}>
                                  <TableCell className="text-right text-sm">{operation.operation_no}</TableCell>
                                  <TableCell className="text-right text-sm">{operation.date}</TableCell>
                                  <TableCell className="text-right text-sm">{operation.client_name}</TableCell>
                                  <TableCell className="text-right text-sm">{operation.service_name}</TableCell>
                                  <TableCell className="text-right text-sm">{operation.base_price.toLocaleString()} دج</TableCell>
                                  <TableCell className="text-right text-sm">{operation.discount_amount.toLocaleString()} دج</TableCell>
                                  <TableCell className="text-right text-sm font-semibold">{operation.final_price.toLocaleString()} دج</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {agency.services.length > 10 && (
                            <p className="text-sm text-gray-600 mt-2">
                              عرض أول 10 عمليات من إجمالي {agency.services.length} عملية
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {reportData.grand_totals && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">
                      المجموع العام
                      {selectedAgency !== 'all' && (
                        <span className="text-sm text-gray-600 font-normal mr-2">
                          (الوكالة المحددة فقط)
                        </span>
                      )}
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {reportData.grand_totals.operations_count}
                        </div>
                        <div className="text-sm text-gray-600">إجمالي العمليات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {reportData.grand_totals.total_revenue.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">إجمالي الإيرادات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {reportData.grand_totals.total_discounts.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">إجمالي التخفيضات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {reportData.grand_totals.net_revenue.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">صافي الإيرادات</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : reportData.data ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">تفاصيل العمليات</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الوصل</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الوكالة</TableHead>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">الخدمة</TableHead>
                        <TableHead className="text-right">السعر الأساسي</TableHead>
                        <TableHead className="text-right">التخفيض</TableHead>
                        <TableHead className="text-right">السعر النهائي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.data.map((operation, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-right text-sm">{operation.operation_no}</TableCell>
                          <TableCell className="text-right text-sm">{operation.date}</TableCell>
                          <TableCell className="text-right text-sm">{operation.agency_name}</TableCell>
                          <TableCell className="text-right text-sm">{operation.client_name}</TableCell>
                          <TableCell className="text-right text-sm">{operation.service_name}</TableCell>
                          <TableCell className="text-right text-sm">{operation.base_price.toLocaleString()} دج</TableCell>
                          <TableCell className="text-right text-sm">{operation.discount_amount.toLocaleString()} دج</TableCell>
                          <TableCell className="text-right text-sm font-semibold">{operation.final_price.toLocaleString()} دج</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {reportData.totals && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">المجموع العام</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {reportData.totals.operations_count}
                        </div>
                        <div className="text-sm text-gray-600">إجمالي العمليات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {reportData.totals.total_revenue.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">إجمالي الإيرادات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {reportData.totals.total_discounts.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">إجمالي التخفيضات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {reportData.totals.net_revenue.toLocaleString()} دج
                        </div>
                        <div className="text-sm text-gray-600">صافي الإيرادات</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-600">
                لا توجد بيانات لعرضها
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main App Component
const MainApp = ({ activeTab, setActiveTab }) => {
  const components = {
    dashboard: (props) => <Dashboard {...props} setActiveTab={setActiveTab} />,
    clients: ClientsManagement,
    suppliers: SuppliersManagement,
    bookings: BookingsManagement,
    invoices: InvoicesManagement,
    payments: PaymentsManagement,
    reports: ReportsManagement,
    userManagement: UserManagement,
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