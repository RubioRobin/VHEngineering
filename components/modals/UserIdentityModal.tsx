"use client";

import { useState } from "react";
import { useUser } from "../providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardButton } from "../ui/DashboardButton";
import { Loader2, User } from "lucide-react";
import { useToast } from "../providers/ToastProvider";

export const UserIdentityModal = () => {
    const { user, isLoading, login } = useUser();
    const { showToast } = useToast();
    const [name, setName] = useState("");
    const [department, setDepartment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isLoading || user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 2 || !department) return;

        setIsSubmitting(true);
        try {
            await login(name, department);
            showToast(`Welkom, ${name}!`, "success");
        } catch (error) {
            showToast("Inloggen mislukt.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-8"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <User className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Wie ben je?</h2>
                    <p className="text-text-secondary">
                        Vul je naam in om bestellingen te plaatsen. We onthouden dit voor de volgende keer.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jouw naam (bijv. Robin)"
                            className="w-full px-4 py-3 bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all"
                            autoFocus
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Jouw afdeling (bijv. Bouwkunde)"
                            className="w-full px-4 py-3 bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all"
                        />
                    </div>
                    <DashboardButton
                        type="submit"
                        className="w-full"
                        isLoading={isSubmitting}
                        disabled={name.trim().length < 2 || !department}
                    >
                        Verder naar Dashboard
                    </DashboardButton>
                </form>
            </motion.div>
        </div>
    );
};
