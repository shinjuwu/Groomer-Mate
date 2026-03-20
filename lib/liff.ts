import liff from '@line/liff';

export interface LiffState {
    liff: typeof liff | null;
    isLoggedIn: boolean;
    error: any;
    profile: any | null;
    accessToken: string | null;
}

export const initLiff = async (liffId: string): Promise<LiffState> => {
    try {
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
            return { liff, isLoggedIn: false, error: null, profile: null, accessToken: null };
        }
        const profile = await liff.getProfile();
        const accessToken = liff.getAccessToken();
        return { liff, isLoggedIn: true, error: null, profile, accessToken };
    } catch (error) {
        console.error('LIFF Init Error:', error);
        return { liff: null, isLoggedIn: false, error, profile: null, accessToken: null };
    }
};
