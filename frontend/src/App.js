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

// Configure axios to include credentials for session cookies
axios.defaults.withCredentials = true;

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
    logout: '🚪 تسجيل الخروج',
    
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
      console.log('API endpoint:', `${API}/auth/login`);
      
      const response = await axios.post(`${API}/auth/login`, { email, password });
      console.log('Login response received:', response.data);
      
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      console.log('Login successful, user set:', userData);
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
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', email);
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, navigating...');
        navigate('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    }
    
    setLoading(false);
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
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-9 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-medium disabled:opacity-50"
            >
              {loading ? 'جاري تسجيل الدخول...' : t('login')}
            </button>
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
            { id: 'dailyReports', label: t('dailyReports'), icon: BarChart3 }
          ]
        },
        // Operations Management Category  
        {
          category: 'operations',
          label: t('operationsManagement'),
          items: [
            { id: 'clients', label: t('clients'), icon: Users },
            { id: 'suppliers', label: t('suppliers'), icon: Building2 },
            { id: 'bookings', label: t('bookings'), icon: Package }
          ]
        },
        // Financial Management Category
        {
          category: 'financial',
          label: t('financialManagement'),
          items: [
            { id: 'invoices', label: t('invoices'), icon: FileText },
            { id: 'payments', label: t('payments'), icon: CreditCard },  
            { id: 'reports', label: t('reports'), icon: BarChart3 }
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
            { id: 'reports', label: t('reports'), icon: BarChart3 }
          ]
        },
        // Full Operations Management (All Agencies)
        {
          category: 'operations',
          label: t('operationsManagement') + ' 🌐',
          items: [
            { id: 'clients', label: t('clients') + ' (جميع الوكالات)', icon: Users },
            { id: 'suppliers', label: t('suppliers') + ' (جميع الوكالات)', icon: Building2 },
            { id: 'bookings', label: t('bookings') + ' (جميع الوكالات)', icon: Package }
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
          { id: 'bookings', label: t('bookings'), icon: Package }
        ]
      },
      // Financial Transactions Category
      {
        category: 'financial',
        label: t('financialManagement'),
        items: [
          { id: 'invoices', label: t('invoices'), icon: FileText },
          { id: 'payments', label: t('payments'), icon: CreditCard }
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
                {new Date().toLocaleDateString('ar-SA', {
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
                📅 {new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <MainApp activeTab={activeTab} />
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
const Dashboard = () => {
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
              {new Date().toLocaleTimeString('ar-SA', {
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
            <button className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-right">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">➕ إضافة عميل جديد</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-right">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">📋 إنشاء حجز جديد</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-right">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">📄 إصدار فاتورة</span>
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
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium">تم إنشاء حجز جديد</p>
                  <p className="text-xs text-gray-500">منذ 5 دقائق</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium">دفعة جديدة مستلمة</p>
                  <p className="text-xs text-gray-500">منذ 15 دقيقة</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium">فاتورة تحتاج مراجعة</p>
                  <p className="text-xs text-gray-500">منذ ساعة</p>
                </div>
              </div>
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
                <button className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-md transition-colors">
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
      setClients(response.data);
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
      setSuppliers(response.data);
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
      
      setBookings(bookingsRes.data);
      setClients(clientsRes.data);
      setSuppliers(suppliersRes.data);
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
      
      setInvoices(invoicesRes.data);
      setClients(clientsRes.data);
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
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString('ar-DZ')}</TableCell>
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
      
      setPayments(paymentsRes.data);
      setInvoices(invoicesRes.data);
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
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString('ar-DZ')}</TableCell>
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
      setUsers(usersResponse.data);
      setAgencies(agenciesResponse.data);
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
                    {new Date(user.created_at).toLocaleDateString('ar-DZ')}
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
      setReports(response.data);
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
                      {new Date(report.date).toLocaleDateString('ar-DZ')}
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

// Main App Component
const MainApp = ({ activeTab }) => {
  const components = {
    dashboard: Dashboard,
    clients: ClientsManagement,
    suppliers: SuppliersManagement,
    bookings: BookingsManagement,
    invoices: InvoicesManagement,
    payments: PaymentsManagement,
    reports: ReportsManagement,
    userManagement: UserManagement,
    dailyReports: DailyReportsManagement
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