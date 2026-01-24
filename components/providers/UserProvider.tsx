"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@prisma/client";

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    login: (name: string, department?: string) => Promise<void>;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from local storage on mount
    useEffect(() => {
        const loadUser = async () => {
            const storedUser = localStorage.getItem("vh_user");
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    // Verify if user still exists in backend
                    // simplified: just trust local storage for now, or re-fetch
                    setUser(parsed);
                } catch (e) {
                    localStorage.removeItem("vh_user");
                }
            }
            setIsLoading(false);
        };
        loadUser();
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
        localStorage.removeItem("vh_user");
    };

    return (
        <UserContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};
