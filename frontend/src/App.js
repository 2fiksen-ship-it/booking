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
import { CalendarIcon, Home, Users, Building2, Package, FileText, CreditCard, Wallet, BarChart3, Settings, LogOut, Globe } from 'lucide-react';
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
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Auth
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    
    // Dashboard
    todayIncome: 'إيرادات اليوم',
    unpaidInvoices: 'الفواتير غير المسددة',
    weekBookings: 'حجوزات الأسبوع',
    cashboxBalance: 'رصيد الصندوق',
    
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
    
    // Clients
    addClient: 'إضافة عميل',
    cinPassport: 'رقم الهوية/جواز السفر',
    
    // Suppliers
    addSupplier: 'إضافة مورد',
    supplierType: 'نوع المورد',
    contact: 'جهة الاتصال',
    
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
    
    // Payment Methods
    cash: 'نقدي',
    bank: 'بنكي',
    card: 'بطاقة'
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    clients: 'Clients',
    suppliers: 'Fournisseurs',
    bookings: 'Réservations',
    invoices: 'Factures',
    payments: 'Paiements',
    reports: 'Rapports',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    
    // Auth
    login: 'Connexion',
    email: 'Email',
    password: 'Mot de passe',
    
    // Dashboard
    todayIncome: "Revenus d'aujourd'hui",
    unpaidInvoices: 'Factures impayées',
    weekBookings: 'Réservations de la semaine',
    cashboxBalance: 'Solde de caisse',
    
    // Common
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
    
    // Clients
    addClient: 'Ajouter un client',
    cinPassport: 'CIN/Passeport',
    
    // Suppliers
    addSupplier: 'Ajouter un fournisseur',
    supplierType: 'Type de fournisseur',
    contact: 'Contact',
    
    // Bookings
    addBooking: 'Ajouter une réservation',
    reference: 'Référence',
    client: 'Client',
    supplier: 'Fournisseur',
    bookingType: 'Type de réservation',
    cost: 'Coût',
    sellPrice: 'Prix de vente',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    
    // Booking Types
    'عمرة': 'Omra',
    'طيران': 'Vol',
    'فندق': 'Hôtel',
    'تأشيرة': 'Visa',
    
    // Invoices
    addInvoice: 'Ajouter une facture',
    invoiceNo: 'N° Facture',
    amountHT: 'Montant HT',
    tvaRate: 'Taux TVA %',
    amountTTC: 'Montant TTC',
    dueDate: "Date d'échéance",
    
    // Invoice Status
    pending: 'En attente',
    paid: 'Payée',
    overdue: 'En retard',
    
    // Payments
    addPayment: 'Ajouter un paiement',
    paymentNo: 'N° Paiement',
    invoice: 'Facture',
    paymentMethod: 'Méthode de paiement',
    paymentDate: 'Date de paiement',
    
    // Payment Methods
    cash: 'Espèces',
    bank: 'Banque',
    card: 'Carte'
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
      console.log('Login attempt:', email);
      const response = await axios.post(`${API}/auth/login`, { email, password });
      console.log('Login response:', response.data);
      
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      console.log('Login successful, user set:', userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
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
    
    console.log('Form submitted with:', email, password);

    const result = await login(email, password);
    console.log('Login result:', result);
    
    if (result.success) {
      console.log('Navigating to dashboard...');
      navigate('/'); // Redirect to dashboard after successful login
    } else {
      console.error('Login failed:', result.error);
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold text-gray-800">
            {t('login')}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            نظام محاسبة وكالات صنهاجة للسفر
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

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'clients', label: t('clients'), icon: Users },
    { id: 'suppliers', label: t('suppliers'), icon: Building2 },
    { id: 'bookings', label: t('bookings'), icon: Package },
    { id: 'invoices', label: t('invoices'), icon: FileText },
    { id: 'payments', label: t('payments'), icon: CreditCard },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                وكالات صنهاجة للسفر
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
                {user?.name} ({user?.role})
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
            <TabsList className="grid w-full grid-cols-7 bg-gray-100">
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

// Main App Component
const MainApp = ({ activeTab }) => {
  const components = {
    dashboard: Dashboard,
    clients: () => <div className="text-center py-8">قريباً - إدارة العملاء</div>,
    suppliers: () => <div className="text-center py-8">قريباً - إدارة الموردين</div>,
    bookings: () => <div className="text-center py-8">قريباً - إدارة الحجوزات</div>,
    invoices: () => <div className="text-center py-8">قريباً - إدارة الفواتير</div>,
    payments: () => <div className="text-center py-8">قريباً - إدارة المدفوعات</div>,
    reports: () => <div className="text-center py-8">قريباً - التقارير</div>
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