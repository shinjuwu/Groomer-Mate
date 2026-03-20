'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, Users, ClipboardList } from 'lucide-react';

const tabs = [
  { href: '/', label: '首頁', icon: Mic },
  { href: '/customers', label: '客戶', icon: Users },
  { href: '/history', label: '紀錄', icon: ClipboardList },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
