'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useLiff } from '@/components/LiffProvider';
import {
  fetchPet,
  updatePet,
  deletePet,
  fetchGroomingLogs,
} from '@/lib/api';
import HistoryCard from '@/components/HistoryCard';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Toast, { type ToastType } from '@/components/Toast';
import type { Pet } from '@/types/pet';
import type { GroomingLog } from '@/types/grooming-log';

export default function PetDetailPage() {
  const { id: customerId, petId } = useParams<{ id: string; petId: string }>();
  const router = useRouter();
  const { isLoggedIn, profile } = useLiff();

  const [pet, setPet] = useState<Pet | null>(null);
  const [logs, setLogs] = useState<GroomingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Edit pet
  const [showEditPet, setShowEditPet] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSpecies, setEditSpecies] = useState('狗');
  const [editBreed, setEditBreed] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!petId || !profile?.userId) return;
    setIsLoading(true);
    try {
      const [petData, logsData] = await Promise.all([
        fetchPet(petId),
        fetchGroomingLogs(profile.userId, { petId }),
      ]);
      setPet(petData);
      setLogs(logsData.data);
    } catch (err) {
      console.error('Failed to load pet:', err);
      setToast({ message: '載入寵物資料失敗', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [petId, profile?.userId]);

  useEffect(() => {
    if (isLoggedIn && profile?.userId) loadData();
  }, [isLoggedIn, profile?.userId, loadData]);

  const openEditPet = () => {
    if (!pet) return;
    setEditName(pet.name);
    setEditSpecies(pet.species);
    setEditBreed(pet.breed || '');
    setEditWeight(pet.weight_kg?.toString() || '');
    setEditBirthDate(pet.birth_date || '');
    setEditNotes(pet.notes || '');
    setShowEditPet(true);
  };

  const handleUpdatePet = async () => {
    if (!editName.trim()) return;
    setIsEditSubmitting(true);
    try {
      const updated = await updatePet(petId, {
        name: editName.trim(),
        species: editSpecies,
        breed: editBreed.trim() || undefined,
        weight_kg: editWeight ? parseFloat(editWeight) : undefined,
        birth_date: editBirthDate || undefined,
        notes: editNotes.trim() || undefined,
      });
      setPet(updated);
      setShowEditPet(false);
      setToast({ message: '寵物資料已更新', type: 'success' });
    } catch (err) {
      console.error('Failed to update pet:', err);
      setToast({ message: '更新失敗', type: 'error' });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeletePet = async () => {
    setIsDeleting(true);
    try {
      await deletePet(petId);
      router.push(`/customers/${customerId}`);
    } catch (err) {
      console.error('Failed to delete pet:', err);
      setToast({ message: '刪除失敗', type: 'error' });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!profile?.userId) return;
    setDeletingLogId(logId);
    try {
      const { deleteGroomingLog } = await import('@/lib/api');
      await deleteGroomingLog(logId, profile.userId);
      setLogs((prev) => prev.filter((log) => log.id !== logId));
      setToast({ message: '紀錄已刪除', type: 'success' });
    } catch (err) {
      console.error('Failed to delete log:', err);
      setToast({ message: '刪除失敗', type: 'error' });
    } finally {
      setDeletingLogId(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <p className="text-gray-500">請先登入 LINE</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 pb-20">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
        </header>
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-40" />
          </div>
        </div>
      </main>
    );
  }

  if (!pet) {
    return (
      <main className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <p className="text-gray-500">找不到此寵物</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/customers/${customerId}`)} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1">{pet.name}</h1>
        <button onClick={openEditPet} className="text-gray-400 hover:text-gray-600 p-1">
          <Pencil className="w-4 h-4" />
        </button>
      </header>

      {/* Pet Info */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">物種</span>
            <span className="text-gray-900">{pet.species}</span>
          </div>
          {pet.breed && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">品種</span>
              <span className="text-gray-900">{pet.breed}</span>
            </div>
          )}
          {pet.weight_kg && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">體重</span>
              <span className="text-gray-900">{pet.weight_kg} kg</span>
            </div>
          )}
          {pet.birth_date && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">生日</span>
              <span className="text-gray-900">
                {new Date(pet.birth_date).toLocaleDateString('zh-TW')}
              </span>
            </div>
          )}
          {pet.notes && (
            <div className="text-sm">
              <span className="text-gray-500">備註：</span>
              <span className="text-gray-700">{pet.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grooming Logs */}
      <div className="px-4">
        <h2 className="text-base font-bold text-gray-800 mb-3">美容紀錄</h2>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <EmptyState icon="📋" title="還沒有美容紀錄" subtitle="回首頁錄音新增紀錄" />
          ) : (
            logs.map((log) => (
              <HistoryCard
                key={log.id}
                log={log}
                onDelete={handleDeleteLog}
                isDeleting={deletingLogId === log.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Delete Pet Button */}
      <div className="p-4 mt-8">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"
        >
          刪除寵物
        </button>
      </div>

      {/* Edit Pet Modal */}
      <FormModal
        title="編輯寵物"
        open={showEditPet}
        onClose={() => setShowEditPet(false)}
        onSubmit={handleUpdatePet}
        isSubmitting={isEditSubmitting}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名字 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">物種</label>
          <select
            value={editSpecies}
            onChange={(e) => setEditSpecies(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="狗">狗</option>
            <option value="貓">貓</option>
            <option value="兔">兔</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">品種</label>
          <input
            type="text"
            value={editBreed}
            onChange={(e) => setEditBreed(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">體重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生日</label>
            <input
              type="date"
              value={editBirthDate}
              onChange={(e) => setEditBirthDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        message={`確定要刪除寵物「${pet.name}」嗎？美容紀錄會保留但不再關聯此寵物。`}
        onConfirm={handleDeletePet}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </main>
  );
}
