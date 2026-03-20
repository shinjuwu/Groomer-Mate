'use client';

import { useEffect, useState, useCallback, useReducer } from 'react';
import { useLiff } from '@/components/LiffProvider';
import { fetchGroomingLogs, deleteGroomingLog, fetchPets, fetchCustomers, updateGroomingLog } from '@/lib/api';
import { shareGroomingSummary } from '@/lib/line-share';
import HistoryCard from '@/components/HistoryCard';
import SearchBar from '@/components/SearchBar';
import PetSelector from '@/components/PetSelector';
import FormModal from '@/components/FormModal';
import Toast, { type ToastType } from '@/components/Toast';
import type { GroomingLog, GroomingLogFilters } from '@/types/grooming-log';
import type { Customer } from '@/types/customer';
import type { Pet } from '@/types/pet';

interface FilterState {
  search: string;
  petId: string;
  customerId: string;
  dateFrom: string;
  dateTo: string;
}

type FilterAction =
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SET_PET'; value: string }
  | { type: 'SET_CUSTOMER'; value: string }
  | { type: 'SET_DATE_FROM'; value: string }
  | { type: 'SET_DATE_TO'; value: string }
  | { type: 'RESET' };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH': return { ...state, search: action.value };
    case 'SET_PET': return { ...state, petId: action.value };
    case 'SET_CUSTOMER': return { ...state, customerId: action.value, petId: '' };
    case 'SET_DATE_FROM': return { ...state, dateFrom: action.value };
    case 'SET_DATE_TO': return { ...state, dateTo: action.value };
    case 'RESET': return { search: '', petId: '', customerId: '', dateFrom: '', dateTo: '' };
    default: return state;
  }
}

export default function HistoryPage() {
  const { isLoggedIn, profile, liff } = useLiff();
  const [logs, setLogs] = useState<GroomingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);

  // Link pet modal
  const [linkLogId, setLinkLogId] = useState<string | null>(null);
  const [linkPetId, setLinkPetId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const [filters, dispatch] = useReducer(filterReducer, {
    search: '', petId: '', customerId: '', dateFrom: '', dateTo: '',
  });

  const hasActiveFilters = filters.petId || filters.customerId || filters.dateFrom || filters.dateTo;

  const loadLogs = useCallback(async () => {
    if (!profile?.userId) return;
    setIsLoading(true);
    try {
      const apiFilters: GroomingLogFilters = {};
      if (filters.search) apiFilters.search = filters.search;
      if (filters.petId) apiFilters.petId = filters.petId;
      if (filters.customerId) apiFilters.customerId = filters.customerId;
      if (filters.dateFrom) apiFilters.dateFrom = filters.dateFrom;
      if (filters.dateTo) apiFilters.dateTo = filters.dateTo;

      const result = await fetchGroomingLogs(profile.userId, apiFilters);
      setLogs(result.data);
    } catch (err: any) {
      console.error('Failed to load logs:', err);
      setToast({ message: '載入紀錄失敗，請稍後再試', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.userId, filters]);

  useEffect(() => {
    if (isLoggedIn && profile?.userId) {
      loadLogs();
    }
  }, [isLoggedIn, profile?.userId, loadLogs]);

  // Load customers/pets for filter dropdowns
  useEffect(() => {
    if (isLoggedIn) {
      fetchCustomers().then((res) => setCustomers(res.data)).catch(console.error);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (filters.customerId) {
      fetchPets(filters.customerId).then((res) => setPets(res.data)).catch(console.error);
    } else {
      setPets([]);
    }
  }, [filters.customerId]);

  const handleSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH', value: query });
  }, []);

  const handleDelete = async (id: string) => {
    if (!profile?.userId) return;
    setDeletingId(id);
    try {
      await deleteGroomingLog(id, profile.userId);
      setLogs((prev) => prev.filter((log) => log.id !== id));
      setToast({ message: '紀錄已刪除', type: 'success' });
    } catch (err: any) {
      console.error('Failed to delete:', err);
      setToast({ message: '刪除失敗，請稍後再試', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (log: GroomingLog) => {
    if (!liff || !log.summary) return;
    const success = await shareGroomingSummary(liff, {
      summary: log.summary,
      petName: log.pet_name,
      date: log.created_at,
    });
    if (success) {
      setToast({ message: '已分享！', type: 'success' });
    } else if (!liff.isInClient()) {
      setToast({ message: '分享功能僅支援 LINE 內建瀏覽器', type: 'error' });
    }
  };

  const handleLinkPet = (logId: string) => {
    setLinkLogId(logId);
    setLinkPetId(null);
  };

  const handleConfirmLink = async () => {
    if (!linkLogId || !linkPetId) return;
    setIsLinking(true);
    try {
      await updateGroomingLog(linkLogId, { petId: linkPetId });
      setLinkLogId(null);
      setToast({ message: '已關聯寵物', type: 'success' });
      loadLogs();
    } catch (err) {
      console.error('Failed to link pet:', err);
      setToast({ message: '關聯失敗', type: 'error' });
    } finally {
      setIsLinking(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <p className="text-gray-500">請先登入 LINE 以查看歷史紀錄</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800">歷史紀錄</h1>
      </header>

      <div className="p-4 space-y-3">
        {/* Search */}
        <SearchBar placeholder="搜尋摘要或備註..." onSearch={handleSearch} />

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            篩選 {hasActiveFilters ? '(啟用中)' : ''}
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => dispatch({ type: 'RESET' })}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              清除篩選
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">客戶</label>
              <select
                value={filters.customerId}
                onChange={(e) => dispatch({ type: 'SET_CUSTOMER', value: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部客戶</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {filters.customerId && pets.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">寵物</label>
                <select
                  value={filters.petId}
                  onChange={(e) => dispatch({ type: 'SET_PET', value: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部寵物</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">起始日期</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => dispatch({ type: 'SET_DATE_FROM', value: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">結束日期</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => dispatch({ type: 'SET_DATE_TO', value: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Log List */}
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
              <div className="flex gap-2 mb-2">
                <div className="h-5 bg-gray-200 rounded-full w-16" />
                <div className="h-5 bg-gray-200 rounded-full w-20" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-500 font-medium">
              {hasActiveFilters || filters.search ? '找不到符合的紀錄' : '還沒有美容紀錄'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {hasActiveFilters || filters.search ? '試試其他篩選條件' : '按住麥克風開始第一筆！'}
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <HistoryCard
              key={log.id}
              log={log}
              onDelete={handleDelete}
              isDeleting={deletingId === log.id}
              onShare={liff?.isInClient() ? handleShare : undefined}
              onLinkPet={handleLinkPet}
            />
          ))
        )}
      </div>

      {/* Link Pet Modal */}
      <FormModal
        title="關聯寵物"
        open={!!linkLogId}
        onClose={() => setLinkLogId(null)}
        onSubmit={handleConfirmLink}
        isSubmitting={isLinking}
        submitLabel="確認關聯"
      >
        <PetSelector
          onSelect={(petId) => setLinkPetId(petId)}
          selectedPetId={linkPetId}
        />
      </FormModal>
    </main>
  );
}
