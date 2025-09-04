import React, { useState, useEffect, useContext, memo, useCallback } from 'react';
import axios from 'axios';

// Card Components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white shadow rounded-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200">
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-medium leading-6 text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children }) => (
  <div className="px-6 py-4">
    {children}
  </div>
);

// Button Component
const Button = ({ children, onClick, className = '', variant = 'default', disabled = false, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 text-gray-700 hover:text-gray-500 focus:ring-blue-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Select Components
const Select = ({ value, onValueChange, children }) => (
  <select 
    value={value} 
    onChange={(e) => onValueChange(e.target.value)}
    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {children}
  </select>
);

const SelectTrigger = ({ children, className = '' }) => (
  <div className={`border border-gray-300 rounded px-3 py-2 bg-white ${className}`}>
    {children}
  </div>
);

const SelectValue = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder}</span>
);

const SelectContent = ({ children }) => children;

const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);

// Icons (Simple replacements)
const RefreshCw = ({ className = '' }) => <span className={className}>🔄</span>;
const Settings = ({ className = '' }) => <span className={className}>⚙️</span>;
const CheckCircle = ({ className = '' }) => <span className={className}>✅</span>;
const XCircle = ({ className = '' }) => <span className={className}>❌</span>;
const Filter = ({ className = '' }) => <span className={className}>🔍</span>;

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

// Auth Context
const AuthContext = React.createContext();

// Services Management Component
const ServicesManagement = memo(() => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [includeInactive, setIncludeInactive] = useState(true);
  const [bulkAction, setBulkAction] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Fetch services for management
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('include_inactive', includeInactive);
      
      const response = await axios.get(`${API}/services/management?${params.toString()}`);
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('خطأ في تحميل الخدمات: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedServices.size === services.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(services.map(s => s.id)));
    }
  };

  // Handle individual service selection
  const handleServiceSelect = (serviceId) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const serviceIds = Array.from(selectedServices);
      
      const response = await axios.delete(`${API}/services/bulk-delete`, {
        data: { service_ids: serviceIds }
      });
      
      alert(`✅ تم حذف ${response.data.deleted_count} خدمة بنجاح`);
      setSelectedServices(new Set());
      fetchServices();
    } catch (error) {
      console.error('Error deleting services:', error);
      alert('❌ خطأ في حذف الخدمات: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (isActive) => {
    try {
      setLoading(true);
      const serviceIds = Array.from(selectedServices);
      
      const response = await axios.patch(`${API}/services/bulk-update-status`, {
        service_ids: serviceIds,
        is_active: isActive
      });
      
      const statusText = isActive ? 'تفعيل' : 'إلغاء تفعيل';
      alert(`✅ تم ${statusText} ${response.data.updated_count} خدمة بنجاح`);
      setSelectedServices(new Set());
      fetchServices();
    } catch (error) {
      console.error('Error updating services status:', error);
      alert('❌ خطأ في تحديث حالة الخدمات: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Execute bulk action
  const executeBulkAction = () => {
    if (selectedServices.size === 0) {
      alert('⚠️ يرجى تحديد خدمة واحدة على الأقل');
      return;
    }

    if (bulkAction === 'delete') {
      setConfirmAction(() => handleBulkDelete);
      setShowConfirmDialog(true);
    } else if (bulkAction === 'activate') {
      setConfirmAction(() => () => handleBulkStatusUpdate(true));
      setShowConfirmDialog(true);
    } else if (bulkAction === 'deactivate') {
      setConfirmAction(() => () => handleBulkStatusUpdate(false));
      setShowConfirmDialog(true);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `${(amount || 0).toLocaleString()} دج`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛠️ إدارة الخدمات</h1>
          <p className="text-sm text-gray-600 mt-1">
            إدارة شاملة للخدمات مع إمكانية التحديد والحذف والتفعيل
          </p>
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button onClick={fetchServices} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardContent>
            <div className="flex items-center p-4">
              <Settings className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">إجمالي الخدمات</p>
                <p className="text-xl font-bold">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent>
            <div className="flex items-center p-4">
              <CheckCircle className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">الخدمات النشطة</p>
                <p className="text-xl font-bold">{services.filter(s => s.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardContent>
            <div className="flex items-center p-4">
              <XCircle className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">الخدمات غير النشطة</p>
                <p className="text-xl font-bold">{services.filter(s => !s.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 ml-2" />
            أدوات التحكم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Include Inactive Toggle */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <label className="text-sm font-medium">عرض الخدمات غير النشطة:</label>
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded"
              />
            </div>

            {/* Select All/None */}
            <Button
              onClick={handleSelectAll}
              variant="outline"
              className="text-sm"
            >
              {selectedServices.size === services.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </Button>

            {/* Selected Count */}
            {selectedServices.size > 0 && (
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                تم تحديد {selectedServices.size} خدمة
              </span>
            )}

            {/* Bulk Actions */}
            {selectedServices.size > 0 && (
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="اختر إجراء جماعي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">✅ تفعيل المحدد</SelectItem>
                    <SelectItem value="deactivate">❌ إلغاء تفعيل المحدد</SelectItem>
                    <SelectItem value="delete">🗑️ حذف المحدد</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={executeBulkAction}
                  disabled={!bulkAction}
                  variant="outline"
                >
                  تنفيذ
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخدمات ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد خدمات</h3>
              <p className="text-gray-600">لم يتم العثور على خدمات تطابق المعايير المحددة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedServices.size === services.length && services.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="border p-2 text-right">اسم الخدمة</th>
                    <th className="border p-2 text-right">النوع</th>
                    <th className="border p-2 text-right">الفئة</th>
                    <th className="border p-2 text-right">السعر الأساسي</th>
                    <th className="border p-2 text-center">الحالة</th>
                    <th className="border p-2 text-center">عدد العمليات</th>
                    <th className="border p-2 text-right">إجمالي الإيرادات</th>
                    <th className="border p-2 text-right">آخر استخدام</th>
                    <th className="border p-2 text-center">يمكن حذفها</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="border p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedServices.has(service.id)}
                          onChange={() => handleServiceSelect(service.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="border p-2 font-medium">{service.name}</td>
                      <td className="border p-2">{service.service_type}</td>
                      <td className="border p-2">{service.category}</td>
                      <td className="border p-2 text-green-600 font-semibold">
                        {formatCurrency(service.base_price)}
                      </td>
                      <td className="border p-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          service.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.is_active ? '✅ نشط' : '❌ غير نشط'}
                        </span>
                      </td>
                      <td className="border p-2 text-center font-semibold">
                        {service.usage_stats?.operations_count || 0}
                      </td>
                      <td className="border p-2 text-blue-600 font-semibold">
                        {formatCurrency(service.usage_stats?.total_revenue || 0)}
                      </td>
                      <td className="border p-2">
                        {service.usage_stats?.last_used 
                          ? new Date(service.usage_stats.last_used).toLocaleDateString('ar-SA')
                          : 'لم تُستخدم بعد'
                        }
                      </td>
                      <td className="border p-2 text-center">
                        {service.usage_stats?.can_delete ? (
                          <span className="text-green-600">✅ نعم</span>
                        ) : (
                          <span className="text-red-600">❌ لا</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">تأكيد الإجراء</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من تنفيذ هذا الإجراء على {selectedServices.size} خدمة محددة؟
              {bulkAction === 'delete' && (
                <span className="block text-red-600 font-medium mt-2">
                  ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!
                </span>
              )}
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <Button 
                onClick={confirmAction}
                className={bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                disabled={loading}
              >
                {loading ? 'جاري التنفيذ...' : 'تأكيد'}
              </Button>
              <Button 
                onClick={() => setShowConfirmDialog(false)}
                variant="outline"
                disabled={loading}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Simple App Component for testing
const SimpleApp = () => {
  const [user] = useState({ role: 'super_admin', agency_id: 'test' });

  return (
    <AuthContext.Provider value={{ user }}>
      <div className="min-h-screen bg-gray-100">
        <ServicesManagement />
      </div>
    </AuthContext.Provider>
  );
};

export default SimpleApp;