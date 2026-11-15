"use client";

import {useContext , createContext , useState, useEffect, useMemo} from "react";
import type { loginUserType } from "@/types/common-types";

type AuthContextValue = {
    user: loginUserType | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const APP_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;


export function AuthProvider({children}: Readonly<{children: React.ReactNode}>){
    const [user, setUser] = useState<loginUserType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        fetch(`${APP_URL}/user/get/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        })
            .then(async (response) => {
                if (!response.ok) return null;
                const loginUser: loginUserType = await response.json();
                return loginUser;
            })
            .then((loginUser) => {
                if (isActive && loginUser) setUser(loginUser);
            })
            .catch((error: unknown) => {
                console.error("Failed to fetch the logged-in user:", error);
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);


    const contextValue = useMemo(() => ({user, loading}), [user, loading]);

    return <AuthContext.Provider value={contextValue}>
         {children}
    </AuthContext.Provider>

}
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    
    // 💡 Guard against missing provider and narrow type from null | AuthContextValue to AuthContextValue
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    
    return context;
};
