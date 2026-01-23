'use client';

import { useLiff } from '@/components/LiffProvider';
import { Mic } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

export default function Home() {
    const { isLoggedIn, profile, error, liff } = useLiff();
    const [mounted, setMounted] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const isPressedRef = useRef(false);

    // 串流快取：權限只需授權一次
    const streamRef = useRef<MediaStream | null>(null);
    const isRequestingPermission = useRef(false);

    // Result State
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<any>(null);

    const startRecording = async () => {
        // 防呆 1：如果已經在錄音中，不要重複觸發
        if (isRecording) return;

        // 防呆 2：如果正在請求權限，不要重複請求
        if (isRequestingPermission.current) return;

        isPressedRef.current = true;

        try {
            // 如果還沒有串流，先取得權限（只會在第一次執行）
            if (!streamRef.current) {
                isRequestingPermission.current = true;

                try {
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                } finally {
                    isRequestingPermission.current = false;
                }

                // 關鍵修復：權限彈窗期間，使用者必定已放開按鈕
                // 第一次授權後，不應該自動開始錄音
                console.log('權限已授權，請再次按住按鈕開始錄音');
                isPressedRef.current = false;
                return; // 不開始錄音，但保留串流供下次使用
            }

            // 再次確認使用者是否還按著按鈕（雙保險）
            if (!isPressedRef.current) return;

            // 使用快取的串流建立錄音器
            const recorder = new MediaRecorder(streamRef.current);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                // 使用正確的 MIME type
                const mimeType = recorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(chunks, { type: mimeType });
                handleAnalysis(audioBlob);
                // 注意：不再關閉串流，保留供下次使用
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            isRequestingPermission.current = false;
            isPressedRef.current = false;
            setIsRecording(false);

            // 如果權限被拒絕，清除串流快取
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            alert("無法存取麥克風，請確認權限設定。");
        }
    };

    const stopRecording = () => {
        isPressedRef.current = false;
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    // 全域監聽：防止權限彈窗導致的 mouseup/touchend 事件遺失
    // 以及滑鼠移出按鈕範圍後無法停止錄音的問題
    useEffect(() => {
        const handleGlobalRelease = () => {
            if (isPressedRef.current) {
                // 不論是否正在錄音，只要全域放開就停止
                isPressedRef.current = false;

                // 如果正在錄音，立即停止
                if (isRecording && mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                    setIsRecording(false);
                    setMediaRecorder(null);
                }
            }
        };

        window.addEventListener('mouseup', handleGlobalRelease);
        window.addEventListener('touchend', handleGlobalRelease);

        return () => {
            window.removeEventListener('mouseup', handleGlobalRelease);
            window.removeEventListener('touchend', handleGlobalRelease);
        };
    }, [isRecording, mediaRecorder]);

    const handleAnalysis = async (audioBlob: Blob) => {
        setIsProcessing(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s Timeout

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/analyze-log', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // 取得詳細錯誤訊息
                const errorData = await response.json().catch(() => ({}));
                console.error("API Error:", errorData);
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const data = await response.json();
            setResult(data);
            setShowResult(true);
        } catch (error: any) {
            console.error("Analysis Error:", error);
            if (error.name === 'AbortError') {
                alert("分析請求逾時 (超過 60 秒)，請檢查網路連線或稍後再試。");
            } else {
                alert(`分析失敗：${error.message || '請稍後再試'}`);
            }
        } finally {
            clearTimeout(timeoutId);
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        setMounted(true);

        // 清理函數：Component 卸載時關閉串流
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
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

            {/* Action Area */}
            <div className="w-full pb-12 flex flex-col items-center justify-center relative">

                {/* Recording Feedback */}
                {isRecording && (
                    <div className="absolute -top-16 text-blue-600 font-bold animate-pulse">
                        錄音中... 放開結束
                    </div>
                )}

                {isProcessing && (
                    <div className="absolute -top-16 text-gray-500 font-bold flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                        AI 分析中...
                    </div>
                )}

                <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={(e) => {
                        e.preventDefault(); // 防止觸發 mousedown 事件
                        startRecording();
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault(); // 防止觸發 mouseup 事件
                        stopRecording();
                    }}
                    disabled={isProcessing}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-200
                        ${isRecording ? 'bg-red-500 scale-110 ring-8 ring-red-200' : 'bg-blue-600 hover:bg-blue-700'}
                        ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : ''}
                        touch-none select-none
                    `}
                    style={{ touchAction: 'none', userSelect: 'none' }}
                    aria-label="新增美容紀錄"
                >
                    <Mic className={`w-10 h-10 text-white ${isRecording ? 'animate-bounce' : ''}`} />
                </button>
                <p className="absolute bottom-6 text-xs text-gray-400">
                    {isRecording ? "放開按鈕以結束" : "按住麥克風開始錄音"}
                </p>
            </div>

            {/* Result Dialog */}
            {showResult && result && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">美容紀錄分析</h3>
                                <button onClick={() => setShowResult(false)} className="text-gray-400 hover:text-gray-600">
                                    ✕
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {result.tags?.map((tag: string, index: number) => (
                                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">飼主通知</h4>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed">
                                    {result.summary}
                                </div>
                            </div>

                            {/* Internal Memo */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">內部備註</h4>
                                <p className="text-gray-600 text-sm">{result.internal_memo}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowResult(false)}
                                    className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        // TODO: Save to Supabase
                                        setShowResult(false);
                                        alert("儲存功能待實作");
                                    }}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                                >
                                    確認儲存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
