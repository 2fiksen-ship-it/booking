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
import { CalendarIcon, Home, Users, Building2, Package, FileText, CreditCard, Wallet, BarChart3, Settings, LogOut, Globe, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

// Language Context
const LanguageContext = createContext();

// Translation object
const translations = {
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    clients: 'العملاء',
    suppliers: 'الموردين',
    bookings: 'الحجوزات',
    invoices: 'الفواتير',
    payments: 'المدفوعات',
    reports: 'التقارير',
    userManagement: 'إدارة المستخدمين',
    dailyReports: 'التقارير اليومية',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Roles
    superAdmin: 'مدير عام',
    generalAccountant: 'محاسب عام',
    agencyStaff: 'موظف وكالة',
    
    // Auth
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    
    // Dashboard
    todayIncome: 'إيرادات اليوم',
    unpaidInvoices: 'الفواتير غير المسددة',
    weekBookings: 'حجوزات الأسبوع',
    cashboxBalance: 'رصيد الصندوق',
    
    // Daily Reports
    createReport: 'إنشاء تقرير يومي',
    approveReport: 'موافقة على التقرير',
    rejectReport: 'رفض التقرير',
    pendingApproval: 'في انتظار الموافقة',
    approved: 'تمت الموافقة',
    rejected: 'مرفوض',
    
    // User Management
    addUser: 'إضافة مستخدم',
    selectRole: 'اختر الدور',
    selectAgency: 'اختر الوكالة',
    
    // Common
    name: 'الاسم',
    phone: 'الهاتف',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    actions: 'الإجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    amount: 'المبلغ',
    search: 'بحث',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    total: 'المجموع',
    profit: 'الربح',
    
    // Clients
    addClient: 'إضافة عميل',
    cinPassport: 'رقم الهوية/جواز السفر',
    clientsList: 'قائمة العملاء',
    
    // Suppliers
    addSupplier: 'إضافة مورد',
    supplierType: 'نوع المورد',
    contact: 'جهة الاتصال',
    suppliersList: 'قائمة الموردين',
    
    // Bookings
    addBooking: 'إضافة حجز',
    reference: 'المرجع',
    client: 'العميل',
    supplier: 'المورد',
    bookingType: 'نوع الحجز',
    cost: 'التكلفة',
    sellPrice: 'سعر البيع',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    bookingsList: 'قائمة الحجوزات',
    selectClient: 'اختر العميل',
    selectSupplier: 'اختر المورد',
    
    // Booking Types
    'عمرة': 'عمرة',
    'طيران': 'طيران',
    'فندق': 'فندق',
    'تأشيرة': 'تأشيرة',
    
    // Invoices
    addInvoice: 'إضافة فاتورة',
    invoiceNo: 'رقم الفاتورة',
    amountHT: 'المبلغ قبل الضريبة',
    tvaRate: 'معدل الضريبة %',
    amountTTC: 'المبلغ شامل الضريبة',
    dueDate: 'تاريخ الاستحقاق',
    invoicesList: 'قائمة الفواتير',
    generateFromBooking: 'إنشاء من حجز',
    
    // Invoice Status
    pending: 'معلقة',
    paid: 'مدفوعة',
    overdue: 'متأخرة',
    
    // Payments
    addPayment: 'إضافة دفعة',
    paymentNo: 'رقم الدفعة',
    invoice: 'الفاتورة',
    paymentMethod: 'طريقة الدفع',
    paymentDate: 'تاريخ الدفع',
    paymentsList: 'قائمة المدفوعات',
    selectInvoice: 'اختر الفاتورة',
    
    // Payment Methods
    cash: 'نقدي',
    bank: 'بنكي',
    card: 'بطاقة',
    
    // Reports
    dailySalesReport: 'تقرير المبيعات اليومية',
    monthlySalesReport: 'تقرير المبيعات الشهرية',
    agingReport: 'تقرير أعمار الديون',
    profitLossReport: 'تقرير الأرباح والخسائر',
    generateReport: 'إنشاء التقرير',
    reportPeriod: 'فترة التقرير',
    from: 'من',
    to: 'إلى',
    export: 'تصدير',
    
    // Messages
    success: 'تم بنجاح',
    error: 'حدث خطأ',
    confirm: 'تأكيد',
    confirmDelete: 'هل أنت متأكد من الحذف؟'
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

  const logout = () => {
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
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('=== FORM SUBMIT START ===');
    console.log('Form submitted with email:', email);
    console.log('Backend URL:', BACKEND_URL);
    console.log('API URL:', API);

    try {
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, navigating to dashboard...');
        navigate('/'); // Redirect to dashboard after successful login
      } else {
        console.error('Login failed:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setError('An unexpected error occurred');
    }
    
    setLoading(false);
    console.log('=== FORM SUBMIT END ===');
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button
              type="submit"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : t('login')}
            </Button>
          </form>
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

  // Navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard', label: t('dashboard'), icon: Home }
    ];

    // Super Admin sees everything
    if (user?.role === 'super_admin') {
      return [
        ...baseItems,
        { id: 'userManagement', label: t('userManagement'), icon: Settings },
        { id: 'dailyReports', label: t('dailyReports'), icon: BarChart3 },
        { id: 'clients', label: t('clients'), icon: Users },
        { id: 'suppliers', label: t('suppliers'), icon: Building2 },
        { id: 'bookings', label: t('bookings'), icon: Package },
        { id: 'invoices', label: t('invoices'), icon: FileText },
        { id: 'payments', label: t('payments'), icon: CreditCard },
        { id: 'reports', label: t('reports'), icon: BarChart3 }
      ];
    }

    // General Accountant sees reports and approvals
    if (user?.role === 'general_accountant') {
      return [
        ...baseItems,
        { id: 'dailyReports', label: t('dailyReports'), icon: BarChart3 },
        { id: 'clients', label: t('clients'), icon: Users },
        { id: 'suppliers', label: t('suppliers'), icon: Building2 },
        { id: 'invoices', label: t('invoices'), icon: FileText },
        { id: 'payments', label: t('payments'), icon: CreditCard },
        { id: 'reports', label: t('reports'), icon: BarChart3 }
      ];
    }

    // Agency Staff sees basic operations
    return [
      ...baseItems,
      { id: 'clients', label: t('clients'), icon: Users },
      { id: 'suppliers', label: t('suppliers'), icon: Building2 },
      { id: 'bookings', label: t('bookings'), icon: Package },
      { id: 'invoices', label: t('invoices'), icon: FileText },
      { id: 'payments', label: t('payments'), icon: CreditCard }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                وكالات صنهاجة للسفر - غرب الجزائر
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span>{language === 'ar' ? 'FR' : 'عر'}</span>
              </Button>
              
              <div className="text-sm text-gray-600">
                {user?.name} ({getRoleDisplay(user?.role)})
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-${navItems.length} bg-gray-100`}>
              {navItems.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {navItems.map((item) => (
            <TabsContent key={item.id} value={item.id} className="mt-0">
              {React.cloneElement(children, { activeTab })}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState({});
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/dashboard`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: t('todayIncome'),
      value: `${stats.today_income || 0} دج`,
      icon: Wallet,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: t('unpaidInvoices'),
      value: stats.unpaid_invoices || 0,
      icon: FileText,
      color: 'from-orange-500 to-amber-600'
    },
    {
      title: t('weekBookings'),
      value: stats.week_bookings || 0,
      icon: Package,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: t('cashboxBalance'),
      value: `${stats.cashbox_balance || 0} دج`,
      icon: CreditCard,
      color: 'from-purple-500 to-violet-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">إجمالي العملاء</span>
                <Badge variant="secondary">-</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">الحجوزات النشطة</span>
                <Badge variant="secondary">-</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">الفواتير المعلقة</span>
                <Badge variant="destructive">{stats.unpaid_invoices || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>آخر النشاطات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center text-gray-500 py-8">
                لا توجد أنشطة حديثة
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Clients Management Component
const ClientsManagement = () => {
  const { t } = useContext(LanguageContext);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cin_passport: ''
  });

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

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
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('clientsList')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('addClient')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? t('edit') : t('addClient')}</DialogTitle>
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
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cin_passport">{t('cinPassport')}</Label>
                <Input
                  id="cin_passport"
                  value={formData.cin_passport}
                  onChange={(e) => setFormData({ ...formData, cin_passport: e.target.value })}
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
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('cinPassport')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    {t('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.cin_passport}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
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

// Reports Component
const ReportsManagement = () => {
  const { t } = useContext(LanguageContext);
  const [reportType, setReportType] = useState('daily_sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock report data based on type
      const mockData = {
        daily_sales: {
          title: 'تقرير المبيعات اليومية',
          data: [
            { date: '2024-01-01', sales: 25000, bookings: 5, profit: 5000 },
            { date: '2024-01-02', sales: 18000, bookings: 3, profit: 3600 },
            { date: '2024-01-03', sales: 32000, bookings: 7, profit: 6400 }
          ],
          totals: { sales: 75000, bookings: 15, profit: 15000 }
        },
        monthly_sales: {
          title: 'تقرير المبيعات الشهرية',
          data: [
            { month: 'يناير', sales: 450000, bookings: 85, profit: 90000 },
            { month: 'فبراير', sales: 380000, bookings: 72, profit: 76000 },
            { month: 'مارس', sales: 520000, bookings: 98, profit: 104000 }
          ],
          totals: { sales: 1350000, bookings: 255, profit: 270000 }
        },
        aging: {
          title: 'تقرير أعمار الديون',
          data: [
            { client: 'أحمد محمد', invoice: 'INV-001', amount: 15000, days: 10 },
            { client: 'فاطمة علي', invoice: 'INV-003', amount: 22000, days: 25 },
            { client: 'محمد حسن', invoice: 'INV-007', amount: 8000, days: 45 }
          ],
          totals: { amount: 45000, count: 3 }
        },
        profit_loss: {
          title: 'تقرير الأرباح والخسائر',
          data: {
            income: { sales: 850000, services: 125000 },
            expenses: { suppliers: 680000, operations: 95000 },
            profit: 200000
          }
        }
      };

      setReportData(mockData[reportType]);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Mock export functionality
    const csvContent = "data:text/csv;charset=utf-8," 
      + "التاريخ,المبيعات,الحجوزات,الربح\n"
      + reportData.data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('reports')}</h2>
        {reportData && (
          <Button onClick={exportReport} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('generateReport')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="report-type">نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_sales">{t('dailySalesReport')}</SelectItem>
                  <SelectItem value="monthly_sales">{t('monthlySalesReport')}</SelectItem>
                  <SelectItem value="aging">{t('agingReport')}</SelectItem>
                  <SelectItem value="profit_loss">{t('profitLossReport')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="start-date">{t('from')}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">{t('to')}</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={generateReport} 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('generateReport')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>{reportData.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {reportType === 'profit_loss' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-green-600 mb-2">الإيرادات</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>المبيعات:</span>
                        <span>{reportData.data.income.sales.toLocaleString()} دج</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الخدمات:</span>
                        <span>{reportData.data.income.services.toLocaleString()} دج</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-red-600 mb-2">المصروفات</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>الموردين:</span>
                        <span>{reportData.data.expenses.suppliers.toLocaleString()} دج</span>
                      </div>
                      <div className="flex justify-between">
                        <span>التشغيل:</span>
                        <span>{reportData.data.expenses.operations.toLocaleString()} دج</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-blue-600 mb-2">صافي الربح</h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.data.profit.toLocaleString()} دج
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {reportType === 'aging' ? (
                        <>
                          <TableHead>العميل</TableHead>
                          <TableHead>رقم الفاتورة</TableHead>
                          <TableHead>المبلغ</TableHead>
                          <TableHead>الأيام</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>{reportType === 'monthly_sales' ? 'الشهر' : 'التاريخ'}</TableHead>
                          <TableHead>المبيعات</TableHead>
                          <TableHead>الحجوزات</TableHead>
                          <TableHead>الربح</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.data.map((row, index) => (
                      <TableRow key={index}>
                        {reportType === 'aging' ? (
                          <>
                            <TableCell>{row.client}</TableCell>
                            <TableCell>{row.invoice}</TableCell>
                            <TableCell>{row.amount.toLocaleString()} دج</TableCell>
                            <TableCell>
                              <Badge variant={row.days > 30 ? 'destructive' : 'outline'}>
                                {row.days} يوم
                              </Badge>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{row.date || row.month}</TableCell>
                            <TableCell>{row.sales.toLocaleString()} دج</TableCell>
                            <TableCell>{row.bookings}</TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {row.profit.toLocaleString()} دج
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {reportData.totals && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">الإجماليات:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {reportType === 'aging' ? (
                        <>
                          <div>
                            <span className="text-sm text-gray-600">عدد الفواتير:</span>
                            <div className="font-semibold">{reportData.totals.count}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">إجمالي المبلغ:</span>
                            <div className="font-semibold">{reportData.totals.amount.toLocaleString()} دج</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-sm text-gray-600">إجمالي المبيعات:</span>
                            <div className="font-semibold">{reportData.totals.sales.toLocaleString()} دج</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">إجمالي الحجوزات:</span>
                            <div className="font-semibold">{reportData.totals.bookings}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">إجمالي الربح:</span>
                            <div className="font-semibold text-green-600">{reportData.totals.profit.toLocaleString()} دج</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
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
    userManagement: () => <div className="text-center py-8">قريباً - إدارة المستخدمين</div>,
    dailyReports: () => <div className="text-center py-8">قريباً - التقارير اليومية</div>
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