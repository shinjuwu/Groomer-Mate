import liff from '@line/liff';

export interface LiffState {
    liff: typeof liff | null;
    isLoggedIn: boolean;
    error: any;
    profile: any | null;
}

export const initLiff = async (liffId: string): Promise<LiffState> => {
    try {
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
            return { liff, isLoggedIn: false, error: null, profile: null };
        }
        const profile = await liff.getProfile();
        return { liff, isLoggedIn: true, error: null, profile };
    } catch (error) {
        console.error('LIFF Init Error:', error);
        return { liff: null, isLoggedIn: false, error, profile: null };
    }
};
