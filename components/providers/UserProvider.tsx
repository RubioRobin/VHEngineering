"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@prisma/client";

interface UserContextType {
    user: User | null;
    adminShadowUser: string | null;
    isAdmin: boolean;
    isLoading: boolean;
    login: (name: string, department?: string) => Promise<void>;
    logout: () => void;
    setAdminShadowUser: (name: string) => void;
    clearAdminShadowUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [adminShadowUser, setShadowUser] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load user and shadow user from storage on mount
    useEffect(() => {
        const loadSession = async () => {
            const storedUser = localStorage.getItem("vh_user");
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                } catch (e) {
                    localStorage.removeItem("vh_user");
                }
            }

            const storedShadow = sessionStorage.getItem("vh_admin_shadow");
            if (storedShadow) {
                setShadowUser(storedShadow);
            }

            const adminToken = localStorage.getItem("vh_admin_token");
            if (adminToken) {
                setIsAdmin(true);
            }

            setIsLoading(false);
        };
        loadSession();
    }, []);

    const login = async (name: string, department?: string) => {
        try {
            const res = await fetch("/api/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, department }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to login");
            }

            const data = await res.json();
            setUser(data);
            localStorage.setItem("vh_user", JSON.stringify(data));
        } catch (error: any) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setShadowUser(null);
        setIsAdmin(false);
        localStorage.removeItem("vh_user");
        localStorage.removeItem("vh_admin_token"); // Also clear admin token on logout
        sessionStorage.removeItem("vh_admin_shadow");
    };

    const setAdminShadowUser = (name: string) => {
        setShadowUser(name);
        sessionStorage.setItem("vh_admin_shadow", name);
    };

    const clearAdminShadowUser = () => {
        setShadowUser(null);
        sessionStorage.removeItem("vh_admin_shadow");
    };

    return (
        <UserContext.Provider value={{
            user,
            adminShadowUser,
            isAdmin,
            isLoading,
            login,
            logout,
            setAdminShadowUser,
            clearAdminShadowUser
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};
