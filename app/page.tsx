'use client';

import { useLiff } from '@/components/LiffProvider';
import { Mic } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
    const { isLoggedIn, profile, error, liff } = useLiff();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-50">
            {/* Header */}
            <header className="w-full py-4 text-center">
                <h1 className="text-xl font-bold text-gray-800">Groomer Mate</h1>
            </header>

            {/* User Status */}
            <div className="flex flex-col items-center justify-center flex-grow space-y-4">
                {error && (
                    <div className="p-4 text-red-500 bg-red-100 rounded-lg">
                        <p>LIFF Error: {error.message}</p>
                    </div>
                )}

                {isLoggedIn && profile ? (
                    <div className="text-center">
                        <img
                            src={profile.pictureUrl}
                            alt={profile.displayName}
                            className="w-20 h-20 mx-auto rounded-full border-4 border-white shadow-lg"
                        />
                        <h2 className="mt-4 text-2xl font-bold text-gray-800">嗨！{profile.displayName}</h2>
                    </div>
                ) : (
                    <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                        <h2 className="text-lg text-gray-600 mb-4">請使用 LINE 登入</h2>
                        <button
                            onClick={() => liff?.login()}
                            className="px-6 py-2 bg-[#06C755] text-white rounded-lg font-bold hover:bg-[#05b34c] transition-colors"
                        >
                            LINE 登入
                        </button>
                        <p className="text-sm text-gray-400 mt-4">以開始紀錄寵物美容</p>
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="w-full pb-12 flex justify-center">
                <button
                    className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    aria-label="新增美容紀錄"
                >
                    <Mic className="w-10 h-10 text-white" />
                </button>
                <p className="absolute bottom-6 text-xs text-gray-400">新增美容紀錄</p>
            </div>
        </main>
    );
}
