"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "./UserProvider";
import { useToast } from "./ToastProvider";

interface OrdersContextType {
    orders: any[];
    isLoading: boolean;
    refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: React.ReactNode }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useUser();
    const { showToast } = useToast();
    const [hasFetched, setHasFetched] = useState(false);

    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (!user) {
            setOrders([]);
            setIsLoading(false);
            return;
        }

        // Prevent double fetching on mount if already fetched
        if (!isRefresh && hasFetched) {
            return;
        }

        if (!hasFetched) setIsLoading(true);

        try {
            const res = await fetch(`/api/orders/user?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
                setHasFetched(true);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            if (isRefresh) showToast("Kon bestellingen niet verversen", "error");
        } finally {
            setIsLoading(false);
        }
    }, [user, hasFetched, showToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const refreshOrders = async () => {
        await fetchOrders(true);
    };

    return (
        <OrdersContext.Provider value={{ orders, isLoading, refreshOrders }}>
            {children}
        </OrdersContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrdersContext);
    if (!context) throw new Error("useOrders must be used within a OrdersProvider");
    return context;
};
