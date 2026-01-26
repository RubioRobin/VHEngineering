'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';

interface ProductFilterBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCategory: string | null;
    setSelectedCategory: (category: string | null) => void;
    showOnlyFavorites: boolean;
    setShowOnlyFavorites: (show: boolean) => void;
    categories: string[];
    productCount: number;
}

export const ProductFilterBar = ({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showOnlyFavorites,
    setShowOnlyFavorites,
    categories,
    productCount
}: ProductFilterBarProps) => {
    const { user } = useUser();
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle clicking outside of category dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100 transition-all">
            <div className="max-w-[1800px] mx-auto px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            {showOnlyFavorites
                                ? 'Jouw Favorieten'
                                : (selectedCategory || 'Het Assortiment')}
                        </h2>
                        <p className="text-slate-500 font-medium text-base mt-2">
                            {productCount} {showOnlyFavorites ? 'favoriete producten' : 'producten'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Category Dropdown */}
                        {!showOnlyFavorites && !searchQuery && (
                            <div className="relative min-w-[220px]" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                    className="w-full pl-6 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm cursor-pointer hover:border-indigo-200 flex items-center justify-between"
                                >
                                    <span className="truncate">
                                        {selectedCategory ? selectedCategory : 'Alle Categorieën'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCategoryDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(null);
                                                setIsCategoryDropdownOpen(false);
                                            }}
                                            className={`w-full px-6 py-3 text-left text-sm font-bold transition-all ${selectedCategory === null
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                }`}
                                        >
                                            Alle Categorieën
                                        </button>
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    setSelectedCategory(cat);
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                                className={`w-full px-6 py-3 text-left text-sm font-bold transition-all ${selectedCategory === cat
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {user && (
                                <button
                                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                                    className={`p-3 rounded-xl border transition-all ${showOnlyFavorites
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-inner'
                                        : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:shadow-sm'}`}
                                    title={showOnlyFavorites ? "Toon alles" : "Toon alleen favorieten"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={showOnlyFavorites ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                    </svg>
                                </button>
                            )}

                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Zoeken..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 shadow-sm rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
