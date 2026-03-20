'use client';

import { ChevronRight } from 'lucide-react';
import type { Customer } from '@/types/customer';

interface CustomerCardProps {
  customer: Customer;
  petCount?: number;
  onClick: () => void;
}

export default function CustomerCard({ customer, petCount, onClick }: CustomerCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
            {petCount !== undefined && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                {petCount} 隻寵物
              </span>
            )}
          </div>
          {customer.phone && (
            <p className="text-sm text-gray-500">{customer.phone}</p>
          )}
          {customer.notes && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{customer.notes}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 ml-2 flex-shrink-0" />
      </div>
    </button>
  );
}
