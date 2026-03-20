'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { useLiff } from '@/components/LiffProvider';
import {
  fetchCustomer,
  updateCustomer,
  deleteCustomer,
  fetchPets,
  createPet,
} from '@/lib/api';
import PetCard from '@/components/PetCard';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Toast, { type ToastType } from '@/components/Toast';
import type { Customer } from '@/types/customer';
import type { Pet, PetFormData } from '@/types/pet';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useLiff();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Edit customer
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLineId, setEditLineId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Add pet
  const [showAddPet, setShowAddPet] = useState(false);
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('狗');
  const [petBreed, setPetBreed] = useState('');
  const [petWeight, setPetWeight] = useState('');
  const [petBirthDate, setPetBirthDate] = useState('');
  const [petNotes, setPetNotes] = useState('');
  const [isPetSubmitting, setIsPetSubmitting] = useState(false);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [customerData, petsData] = await Promise.all([
        fetchCustomer(id),
        fetchPets(id),
      ]);
      setCustomer(customerData);
      setPets(petsData.data);
    } catch (err) {
      console.error('Failed to load customer:', err);
      setToast({ message: '載入客戶資料失敗', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, loadData]);

  const openEditCustomer = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditPhone(customer.phone || '');
    setEditLineId(customer.line_id || '');
    setEditNotes(customer.notes || '');
    setShowEditCustomer(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editName.trim()) return;
    setIsEditSubmitting(true);
    try {
      const updated = await updateCustomer(id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        line_id: editLineId.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setCustomer(updated);
      setShowEditCustomer(false);
      setToast({ message: '客戶資料已更新', type: 'success' });
    } catch (err) {
      console.error('Failed to update customer:', err);
      setToast({ message: '更新失敗', type: 'error' });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(id);
      router.push('/customers');
    } catch (err) {
      console.error('Failed to delete customer:', err);
      setToast({ message: '刪除失敗', type: 'error' });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const resetPetForm = () => {
    setPetName('');
    setPetSpecies('狗');
    setPetBreed('');
    setPetWeight('');
    setPetBirthDate('');
    setPetNotes('');
  };

  const handleCreatePet = async () => {
    if (!petName.trim()) return;
    setIsPetSubmitting(true);
    try {
      const data: PetFormData = {
        customer_id: id,
        name: petName.trim(),
        species: petSpecies || '狗',
        breed: petBreed.trim() || undefined,
        weight_kg: petWeight ? parseFloat(petWeight) : undefined,
        birth_date: petBirthDate || undefined,
        notes: petNotes.trim() || undefined,
      };
      await createPet(data);
      setShowAddPet(false);
      resetPetForm();
      setToast({ message: '寵物已新增', type: 'success' });
      loadData();
    } catch (err) {
      console.error('Failed to create pet:', err);
      setToast({ message: '新增寵物失敗', type: 'error' });
    } finally {
      setIsPetSubmitting(false);
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
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        </header>
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-40" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <p className="text-gray-500">找不到此客戶</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/customers')} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1">{customer.name}</h1>
        <button onClick={openEditCustomer} className="text-gray-400 hover:text-gray-600 p-1">
          <Pencil className="w-4 h-4" />
        </button>
      </header>

      {/* Customer Info */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
          {customer.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">電話</span>
              <span className="text-gray-900">{customer.phone}</span>
            </div>
          )}
          {customer.line_id && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">LINE ID</span>
              <span className="text-gray-900">{customer.line_id}</span>
            </div>
          )}
          {customer.notes && (
            <div className="text-sm">
              <span className="text-gray-500">備註：</span>
              <span className="text-gray-700">{customer.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pets Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">寵物</h2>
          <button
            onClick={() => setShowAddPet(true)}
            className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {pets.length === 0 ? (
            <EmptyState icon="🐾" title="還沒有寵物" subtitle="點擊 + 新增寵物" />
          ) : (
            pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onClick={() => router.push(`/customers/${id}/pets/${pet.id}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* Delete Customer Button */}
      <div className="p-4 mt-8">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"
        >
          刪除客戶
        </button>
      </div>

      {/* Edit Customer Modal */}
      <FormModal
        title="編輯客戶"
        open={showEditCustomer}
        onClose={() => setShowEditCustomer(false)}
        onSubmit={handleUpdateCustomer}
        isSubmitting={isEditSubmitting}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            姓名 <span className="text-red-500">*</span>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
          <input
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LINE ID</label>
          <input
            type="text"
            value={editLineId}
            onChange={(e) => setEditLineId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

      {/* Add Pet Modal */}
      <FormModal
        title="新增寵物"
        open={showAddPet}
        onClose={() => { setShowAddPet(false); resetPetForm(); }}
        onSubmit={handleCreatePet}
        isSubmitting={isPetSubmitting}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名字 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="寵物名字"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">物種</label>
          <select
            value={petSpecies}
            onChange={(e) => setPetSpecies(e.target.value)}
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
            value={petBreed}
            onChange={(e) => setPetBreed(e.target.value)}
            placeholder="例：貴賓、柴犬"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">體重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={petWeight}
              onChange={(e) => setPetWeight(e.target.value)}
              placeholder="5.0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生日</label>
            <input
              type="date"
              value={petBirthDate}
              onChange={(e) => setPetBirthDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
          <textarea
            value={petNotes}
            onChange={(e) => setPetNotes(e.target.value)}
            placeholder="特殊注意事項"
            rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        message={`確定要刪除客戶「${customer.name}」嗎？此操作會同時刪除所有寵物資料。`}
        onConfirm={handleDeleteCustomer}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </main>
  );
}
