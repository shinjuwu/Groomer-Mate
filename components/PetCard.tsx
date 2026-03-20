'use client';

import { ChevronRight } from 'lucide-react';
import type { Pet } from '@/types/pet';

const SPECIES_EMOJI: Record<string, string> = {
  '狗': '🐕',
  '貓': '🐈',
  '兔': '🐇',
};

interface PetCardProps {
  pet: Pet;
  onClick: () => void;
}

export default function PetCard({ pet, onClick }: PetCardProps) {
  const emoji = SPECIES_EMOJI[pet.species] || '🐾';

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl">{emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{pet.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{pet.species}</span>
              {pet.breed && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="truncate">{pet.breed}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 ml-2 flex-shrink-0" />
      </div>
    </button>
  );
}
