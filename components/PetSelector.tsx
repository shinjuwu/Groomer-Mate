'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCustomers, fetchPets } from '@/lib/api';
import type { Customer } from '@/types/customer';
import type { Pet } from '@/types/pet';

interface PetSelectorProps {
  onSelect: (petId: string | null, petName?: string) => void;
  selectedPetId?: string | null;
}

export default function PetSelector({ onSelect, selectedPetId }: PetSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCustomers().then((res) => setCustomers(res.data)).catch(console.error);
  }, []);

  const handleCustomerChange = useCallback(async (customerId: string) => {
    setSelectedCustomerId(customerId);
    onSelect(null);
    setPets([]);

    if (!customerId) return;

    setIsLoading(true);
    try {
      const res = await fetchPets(customerId);
      setPets(res.data);
    } catch (err) {
      console.error('Failed to fetch pets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onSelect]);

  const handlePetChange = useCallback(
    (petId: string) => {
      if (!petId) {
        onSelect(null);
        return;
      }
      const pet = pets.find((p) => p.id === petId);
      onSelect(petId, pet?.name);
    },
    [pets, onSelect],
  );

  return (
    <div className="space-y-2">
      <select
        value={selectedCustomerId}
        onChange={(e) => handleCustomerChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">選擇客戶（可選）</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {selectedCustomerId && (
        <select
          value={selectedPetId || ''}
          onChange={(e) => handlePetChange(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">選擇寵物（可選）</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.species}{p.breed ? ` - ${p.breed}` : ''})</option>
          ))}
        </select>
      )}
    </div>
  );
}
