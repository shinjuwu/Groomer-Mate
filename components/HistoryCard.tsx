'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Share2, Link } from 'lucide-react';
import type { GroomingLog } from '@/types/grooming-log';

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface HistoryCardProps {
  log: GroomingLog;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onShare?: (log: GroomingLog) => void;
  onLinkPet?: (logId: string) => void;
}

export default function HistoryCard({
  log,
  onDelete,
  isDeleting,
  onShare,
  onLinkPet,
}: HistoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-gray-400">{formatDate(log.created_at)}</p>
              {log.pet_name && (
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-md font-medium">
                  {log.customer_name ? `${log.customer_name} / ` : ''}{log.pet_name}
                </span>
              )}
            </div>
            {log.tags && log.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {log.tags.map((tag, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {log.summary && (
              <p className="text-sm text-gray-600 line-clamp-2">{log.summary}</p>
            )}
          </div>
          <div className="ml-2 mt-1 text-gray-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          {log.summary && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-1">飼主通知</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{log.summary}</p>
            </div>
          )}
          {log.internal_memo && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-1">內部備註</h4>
              <p className="text-sm text-gray-600">{log.internal_memo}</p>
            </div>
          )}
          {log.transcription && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-1">逐字稿</h4>
              <p className="text-sm text-gray-500 whitespace-pre-wrap">{log.transcription}</p>
            </div>
          )}
          <div className="pt-2 flex items-center gap-4">
            {onShare && log.summary && (
              <button
                onClick={() => onShare(log)}
                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                分享給飼主
              </button>
            )}
            {onLinkPet && !log.pet_id && (
              <button
                onClick={() => onLinkPet(log.id)}
                className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-700 transition-colors"
              >
                <Link className="w-3.5 h-3.5" />
                關聯寵物
              </button>
            )}
            <button
              onClick={() => onDelete(log.id)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? '刪除中...' : '刪除紀錄'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
