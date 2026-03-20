'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/components/LiffProvider';
import { fetchCustomers, createCustomer, fetchPets } from '@/lib/api';
import SearchBar from '@/components/SearchBar';
import CustomerCard from '@/components/CustomerCard';
import FormModal from '@/components/FormModal';
import EmptyState from '@/components/EmptyState';
import Toast, { type ToastType } from '@/components/Toast';
import type { Customer, CustomerFormData } from '@/types/customer';

export default function CustomersPage() {
  const { isLoggedIn } = useLiff();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [petCounts, setPetCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLineId, setFormLineId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const loadCustomers = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const res = await fetchCustomers(search);
      setCustomers(res.data);

      // Load pet counts for each customer
      const counts: Record<string, number> = {};
      await Promise.all(
        res.data.map(async (c) => {
          try {
            const pets = await fetchPets(c.id);
            counts[c.id] = pets.total;
          } catch {
            counts[c.id] = 0;
          }
        }),
      );
      setPetCounts(counts);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setToast({ message: '載入客戶失敗', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadCustomers(searchQuery || undefined);
    }
  }, [isLoggedIn, loadCustomers, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormLineId('');
    setFormNotes('');
  };

  const handleCreateCustomer = async () => {
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const data: CustomerFormData = {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        line_id: formLineId.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };
      await createCustomer(data);
      setShowForm(false);
      resetForm();
      setToast({ message: '客戶已建立', type: 'success' });
      loadCustomers(searchQuery || undefined);
    } catch (err) {
      console.error('Failed to create customer:', err);
      setToast({ message: '建立客戶失敗', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <p className="text-gray-500">請先登入 LINE 以查看客戶列表</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">客戶列表</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="p-4 space-y-3">
        <SearchBar placeholder="搜尋客戶名稱..." onSearch={handleSearch} />

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
          ))
        ) : customers.length === 0 ? (
          <EmptyState
            icon="👤"
            title={searchQuery ? '找不到符合的客戶' : '還沒有客戶'}
            subtitle={searchQuery ? '試試其他關鍵字' : '點擊右上角 + 新增第一位客戶'}
          />
        ) : (
          customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              petCount={petCounts[customer.id]}
              onClick={() => router.push(`/customers/${customer.id}`)}
            />
          ))
        )}
      </div>

      <FormModal
        title="新增客戶"
        open={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        onSubmit={handleCreateCustomer}
        isSubmitting={isSubmitting}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="客戶姓名"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
          <input
            type="tel"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="手機號碼"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LINE ID</label>
          <input
            type="text"
            value={formLineId}
            onChange={(e) => setFormLineId(e.target.value)}
            placeholder="飼主的 LINE ID"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="其他備註"
            rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </FormModal>
    </main>
  );
}
