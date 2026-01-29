"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "./UserProvider";
import { useToast } from "./ToastProvider";

interface OrdersContextType {
    orders: any[];
    weekOrders: any[];
    currentPeriod: any;
    isLoading: boolean;
    isWeekLoading: boolean;
    refreshOrders: () => Promise<void>;
    fetchWeekOrders: (force?: boolean) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: React.ReactNode }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [weekOrders, setWeekOrders] = useState<any[]>([]);
    const [currentPeriod, setCurrentPeriod] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWeekLoading, setIsWeekLoading] = useState(false);
    const { user } = useUser();
    const { showToast } = useToast();
    const [hasFetched, setHasFetched] = useState(false);
    const [hasFetchedWeek, setHasFetchedWeek] = useState(false);

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
            const res = await fetch(`/api/orders/user?userId=${user.id}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache' }
            });
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

    const fetchWeekOrders = useCallback(async (force = false) => {
        if (!force && hasFetchedWeek) return;

        if (!hasFetchedWeek) setIsWeekLoading(true);

        try {
            const res = await fetch('/api/orders', {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache' }
            });
            if (res.ok) {
                const data = await res.json();
                setWeekOrders(data.orders || []);
                setCurrentPeriod(data.period || null);
                setHasFetchedWeek(true);
            }
        } catch (error) {
            console.error('Error fetching week orders:', error);
            if (force) showToast("Kon weekoverzicht niet verversen", "error");
        } finally {
            setIsWeekLoading(false);
        }
    }, [hasFetchedWeek, showToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const refreshOrders = useCallback(async () => {
        await Promise.all([
            fetchOrders(true),
            fetchWeekOrders(true)
        ]);
    }, [fetchOrders, fetchWeekOrders]);

    // Polling for live updates (every 10 seconds)
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            refreshOrders();
        }, 10000);

        return () => clearInterval(interval);
    }, [user, refreshOrders]);

    return (
        <OrdersContext.Provider value={{ orders, weekOrders, currentPeriod, isLoading, isWeekLoading, refreshOrders, fetchWeekOrders }}>
            {children}
        </OrdersContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrdersContext);
    if (!context) throw new Error("useOrders must be used within a OrdersProvider");
    return context;
};
