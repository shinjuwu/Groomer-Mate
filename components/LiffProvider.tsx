'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initLiff, LiffState } from '@/lib/liff';
import { setAccessToken } from '@/lib/api';

const LiffContext = createContext<LiffState>({
    liff: null,
    isLoggedIn: false,
    error: null,
    profile: null,
    accessToken: null,
});

export const useLiff = () => useContext(LiffContext);

export const LiffProvider = ({
    children,
    liffId,
}: {
    children: React.ReactNode;
    liffId: string;
}) => {
    const [liffState, setLiffState] = useState<LiffState>({
        liff: null,
        isLoggedIn: false,
        error: null,
        profile: null,
        accessToken: null,
    });

    useEffect(() => {
        if (!liffId) {
            console.warn('LIFF ID is not provided.');
            return;
        }
        initLiff(liffId).then((state) => {
            setLiffState(state);
            if (state.accessToken) {
                setAccessToken(state.accessToken);
            }
        });
    }, [liffId]);

    return (
        <LiffContext.Provider value={liffState}>
            {children}
        </LiffContext.Provider>
    );
};
