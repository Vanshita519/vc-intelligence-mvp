'use client';

import { useRouter } from 'next/navigation';
import {
    Bookmark,
    Trash2,
    Play,
    Search,
    Filter,
    Clock,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SavedSearch } from '../../lib/types';

export default function SavedSearchesPage() {
    const router = useRouter();
    const [savedSearches, setSavedSearches] = useLocalStorage<SavedSearch[]>('vc-saved-searches', []);

    const handleDelete = (id: string) => {
        setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    };

    const handleRerun = (search: SavedSearch) => {
        const params = new URLSearchParams();
        if (search.filters.query) params.set('q', search.filters.query);
        if (search.filters.sector) params.set('sector', search.filters.sector);
        if (search.filters.stage) params.set('stage', search.filters.stage);
        if (search.filters.location) params.set('location', search.filters.location);
        router.push(`/companies?${params.toString()}`);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="page-header">Saved Searches</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Quickly re-run your saved search filters.
                </p>
            </div>

            {/* Saved Searches List */}
            {savedSearches.length === 0 ? (
                <div className="card p-8 sm:p-12 text-center">
                    <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No saved searches</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Save a search from the Companies page to see it here.
                    </p>
                    <button
                        onClick={() => router.push('/companies')}
                        className="btn-primary text-sm"
                    >
                        Go to Companies
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {savedSearches.map((search) => (
                        <div key={search.id} className="card p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                        <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-900">{search.name}</h3>
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                                            {search.filters.query && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                    <Search className="w-3 h-3" />
                                                    &ldquo;{search.filters.query}&rdquo;
                                                </span>
                                            )}
                                            {search.filters.sector && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                                    <Filter className="w-3 h-3" />
                                                    {search.filters.sector}
                                                </span>
                                            )}
                                            {search.filters.stage && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                                                    {search.filters.stage}
                                                </span>
                                            )}
                                            {search.filters.location && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">
                                                    {search.filters.location}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Saved on {new Date(search.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                                    <button
                                        onClick={() => handleRerun(search)}
                                        className="btn-primary text-xs flex items-center gap-1.5"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        Re-run
                                    </button>
                                    <button
                                        onClick={() => handleDelete(search.id)}
                                        className="btn-ghost text-xs text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
