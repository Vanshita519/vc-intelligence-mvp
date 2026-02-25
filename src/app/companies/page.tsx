'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    BookmarkPlus,
    X,
    SlidersHorizontal,
} from 'lucide-react';
import {
    getAllCompanies,
    getUniqueSectors,
    getUniqueStages,
    getUniqueLocations,
} from '../../lib/companies';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SavedSearch, SearchFilters } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

function getStageBadgeClass(stage: string) {
    switch (stage) {
        case 'Pre-Seed': return 'badge-purple';
        case 'Seed': return 'badge-green';
        case 'Series A': return 'badge-blue';
        case 'Series B': return 'badge-amber';
        case 'Series C': return 'badge-rose';
        default: return 'badge-blue';
    }
}

export default function CompaniesPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [sector, setSector] = useState('');
    const [stage, setStage] = useState('');
    const [location, setLocation] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [savedSearches, setSavedSearches] = useLocalStorage<SavedSearch[]>('vc-saved-searches', []);
    const [showFilters, setShowFilters] = useState(false);

    const allCompanies = useMemo(() => getAllCompanies(), []);
    const sectors = useMemo(() => getUniqueSectors(), []);
    const stages = useMemo(() => getUniqueStages(), []);
    const locations = useMemo(() => getUniqueLocations(), []);

    const filteredCompanies = useMemo(() => {
        let result = [...allCompanies];

        if (query) {
            const q = query.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.description.toLowerCase().includes(q) ||
                    c.sector.toLowerCase().includes(q)
            );
        }
        if (sector) result = result.filter((c) => c.sector === sector);
        if (stage) result = result.filter((c) => c.stage === stage);
        if (location) result = result.filter((c) => c.location === location);

        result.sort((a, b) => {
            const aVal = String(a[sortBy as keyof typeof a] || '');
            const bVal = String(b[sortBy as keyof typeof b] || '');
            return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

        return result;
    }, [allCompanies, query, sector, stage, location, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
    const paginatedCompanies = filteredCompanies.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleSort = useCallback((column: string) => {
        setSortBy((prev) => {
            if (prev === column) {
                setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                return prev;
            }
            setSortOrder('asc');
            return column;
        });
        setCurrentPage(1);
    }, []);

    const handleSaveSearch = () => {
        if (!searchName.trim()) return;
        const newSearch: SavedSearch = {
            id: Date.now().toString(),
            name: searchName,
            filters: { query, sector, stage, location, sortBy, sortOrder },
            createdAt: new Date().toISOString(),
        };
        setSavedSearches((prev) => [...prev, newSearch]);
        setSearchName('');
        setShowSaveModal(false);
    };

    const clearFilters = () => {
        setQuery('');
        setSector('');
        setStage('');
        setLocation('');
        setCurrentPage(1);
    };

    const hasActiveFilters = query || sector || stage || location;

    const SortIcon = ({ column }: { column: string }) => (
        <span className="inline-flex ml-1">
            {sortBy === column ? (
                sortOrder === 'asc' ? (
                    <ChevronUp className="w-3.5 h-3.5 text-primary-600" />
                ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
                )
            ) : (
                <ChevronUp className="w-3.5 h-3.5 text-gray-300" />
            )}
        </span>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-header">Companies</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {filteredCompanies.length} companies found
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary flex items-center gap-2 text-sm ${showFilters ? 'ring-2 ring-primary-500/20 border-primary-300' : ''}`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="btn-primary flex items-center gap-2 text-sm"
                        disabled={!hasActiveFilters}
                    >
                        <BookmarkPlus className="w-4 h-4" />
                        Save Search
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search companies by name, sector, or description..."
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                        className="input-field pl-10"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="card p-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Filter by:</span>
                        </div>
                        <select
                            value={sector}
                            onChange={(e) => { setSector(e.target.value); setCurrentPage(1); }}
                            className="select-field text-sm"
                        >
                            <option value="">All Sectors</option>
                            {sectors.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            value={stage}
                            onChange={(e) => { setStage(e.target.value); setCurrentPage(1); }}
                            className="select-field text-sm"
                        >
                            <option value="">All Stages</option>
                            {stages.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            value={location}
                            onChange={(e) => { setLocation(e.target.value); setCurrentPage(1); }}
                            className="select-field text-sm"
                        >
                            <option value="">All Locations</option>
                            {locations.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="btn-ghost text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')}>
                                    Company <SortIcon column="name" />
                                </th>
                                <th onClick={() => handleSort('sector')}>
                                    Sector <SortIcon column="sector" />
                                </th>
                                <th onClick={() => handleSort('stage')}>
                                    Stage <SortIcon column="stage" />
                                </th>
                                <th onClick={() => handleSort('location')}>
                                    Location <SortIcon column="location" />
                                </th>
                                <th onClick={() => handleSort('funding')}>
                                    Funding <SortIcon column="funding" />
                                </th>
                                <th>Signals</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        No companies match your filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedCompanies.map((company) => (
                                    <tr
                                        key={company.id}
                                        onClick={() => router.push(`/companies/${company.id}`)}
                                    >
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                                                    {company.logo}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{company.name}</p>
                                                    <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                                        {company.description.substring(0, 60)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm">{company.sector}</span>
                                        </td>
                                        <td>
                                            <span className={getStageBadgeClass(company.stage)}>
                                                {company.stage}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-sm">{company.location}</span>
                                        </td>
                                        <td>
                                            <span className="text-sm font-medium">{company.funding}</span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm text-gray-500">{company.signals.length}</span>
                                                <span className="text-xs text-gray-400">signals</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)} of{' '}
                            {filteredCompanies.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn-ghost p-2 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === currentPage
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn-ghost p-2 disabled:opacity-30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Search Modal */}
            {showSaveModal && (
                <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="section-header mb-4">Save Current Search</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Save your current filters to quickly re-run this search later.
                        </p>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Search name (e.g., 'AI Seed Stage')"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="input-field"
                                autoFocus
                            />
                            <div className="text-xs text-gray-400 space-y-1">
                                {query && <p>Query: &ldquo;{query}&rdquo;</p>}
                                {sector && <p>Sector: {sector}</p>}
                                {stage && <p>Stage: {stage}</p>}
                                {location && <p>Location: {location}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowSaveModal(false)} className="btn-secondary text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSaveSearch} className="btn-primary text-sm" disabled={!searchName.trim()}>
                                Save Search
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
