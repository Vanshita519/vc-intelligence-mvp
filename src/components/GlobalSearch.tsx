'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { getAllCompanies } from '../lib/companies';
import { Company } from '../lib/types';

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Company[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleSearch = useCallback((q: string) => {
        setQuery(q);
        if (q.length < 2) {
            setResults([]);
            return;
        }
        const companies = getAllCompanies();
        const filtered = companies
            .filter(
                (c) =>
                    c.name.toLowerCase().includes(q.toLowerCase()) ||
                    c.sector.toLowerCase().includes(q.toLowerCase()) ||
                    c.description.toLowerCase().includes(q.toLowerCase())
            )
            .slice(0, 6);
        setResults(filtered);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setResults([]);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (company: Company) => {
        router.push(`/companies/${company.id}`);
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={() => { setIsOpen(false); setQuery(''); setResults([]); }}>
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search companies, sectors..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="flex-1 text-base outline-none placeholder:text-gray-400 bg-transparent"
                    />
                    <button
                        onClick={() => { setIsOpen(false); setQuery(''); setResults([]); }}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {results.length > 0 && (
                    <div className="max-h-80 overflow-y-auto py-2">
                        {results.map((company) => (
                            <button
                                key={company.id}
                                onClick={() => handleSelect(company)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                                    {company.logo}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{company.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {company.sector} · {company.stage} · {company.location}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {query.length >= 2 && results.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                        No companies found for &ldquo;{query}&rdquo;
                    </div>
                )}

                {query.length < 2 && (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">
                        Type at least 2 characters to search
                    </div>
                )}
            </div>
        </div>
    );
}
