'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Trash2,
    Download,
    ChevronRight,
    List,
    X,
    Building2,
    FileJson,
    FileSpreadsheet,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CompanyList, Company } from '../../lib/types';
import { getAllCompanies, getCompanyById } from '../../lib/companies';

export default function ListsPage() {
    const router = useRouter();
    const [lists, setLists] = useLocalStorage<CompanyList[]>('vc-lists', []);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [expandedListId, setExpandedListId] = useState<string | null>(null);
    const [showAddCompanyModal, setShowAddCompanyModal] = useState<string | null>(null);
    const [addSearchQuery, setAddSearchQuery] = useState('');

    const allCompanies = useMemo(() => getAllCompanies(), []);

    const handleCreateList = () => {
        if (!newListName.trim()) return;
        const newList: CompanyList = {
            id: Date.now().toString(),
            name: newListName.trim(),
            companyIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setLists((prev) => [...prev, newList]);
        setNewListName('');
        setShowCreateModal(false);
    };

    const handleDeleteList = (id: string) => {
        setLists((prev) => prev.filter((l) => l.id !== id));
        if (expandedListId === id) setExpandedListId(null);
    };

    const handleRemoveCompany = (listId: string, companyId: string) => {
        setLists((prev) =>
            prev.map((l) =>
                l.id === listId
                    ? { ...l, companyIds: l.companyIds.filter((c) => c !== companyId), updatedAt: new Date().toISOString() }
                    : l
            )
        );
    };

    const handleAddCompany = (listId: string, companyId: string) => {
        setLists((prev) =>
            prev.map((l) =>
                l.id === listId && !l.companyIds.includes(companyId)
                    ? { ...l, companyIds: [...l.companyIds, companyId], updatedAt: new Date().toISOString() }
                    : l
            )
        );
    };

    const handleExportCSV = (list: CompanyList) => {
        const companies = list.companyIds.map((id) => getCompanyById(id)).filter(Boolean) as Company[];
        const headers = ['Name', 'Sector', 'Stage', 'Location', 'Funding', 'Employees', 'Website'];
        const rows = companies.map((c) => [c.name, c.sector, c.stage, c.location, c.funding, c.employees, c.website]);
        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
        downloadFile(csv, `${list.name}.csv`, 'text/csv');
    };

    const handleExportJSON = (list: CompanyList) => {
        const companies = list.companyIds.map((id) => getCompanyById(id)).filter(Boolean) as Company[];
        const json = JSON.stringify(companies, null, 2);
        downloadFile(json, `${list.name}.json`, 'application/json');
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredCompaniesForAdd = useMemo(() => {
        if (!addSearchQuery) return allCompanies.slice(0, 10);
        const q = addSearchQuery.toLowerCase();
        return allCompanies
            .filter((c) => c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q))
            .slice(0, 10);
    }, [addSearchQuery, allCompanies]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-header">Lists</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Organize companies into custom lists for tracking and export.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary text-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create List
                </button>
            </div>

            {/* Lists */}
            {lists.length === 0 ? (
                <div className="card p-12 text-center">
                    <List className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No lists yet</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Create your first list to start organizing companies.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary text-sm"
                    >
                        Create List
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {lists.map((list) => {
                        const isExpanded = expandedListId === list.id;
                        const companies = list.companyIds
                            .map((id) => getCompanyById(id))
                            .filter(Boolean) as Company[];

                        return (
                            <div key={list.id} className="card overflow-hidden">
                                {/* List Header */}
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedListId(isExpanded ? null : list.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                            <List className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">{list.name}</h3>
                                            <p className="text-xs text-gray-400">
                                                {companies.length} companies · Updated{' '}
                                                {new Date(list.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowAddCompanyModal(list.id); }}
                                            className="btn-ghost text-xs flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleExportCSV(list); }}
                                            className="btn-ghost text-xs flex items-center gap-1"
                                            title="Export CSV"
                                        >
                                            <FileSpreadsheet className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleExportJSON(list); }}
                                            className="btn-ghost text-xs flex items-center gap-1"
                                            title="Export JSON"
                                        >
                                            <FileJson className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                            className="btn-ghost text-xs text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <ChevronRight
                                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        />
                                    </div>
                                </div>

                                {/* Expanded Companies */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100">
                                        {companies.length === 0 ? (
                                            <div className="p-6 text-center text-sm text-gray-400">
                                                No companies in this list yet.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {companies.map((company) => (
                                                    <div
                                                        key={company.id}
                                                        className="p-3 px-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div
                                                            className="flex items-center gap-3 cursor-pointer flex-1"
                                                            onClick={() => router.push(`/companies/${company.id}`)}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                                {company.logo}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{company.name}</p>
                                                                <p className="text-xs text-gray-400">{company.sector} · {company.stage}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveCompany(list.id, company.id)}
                                                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create List Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="section-header mb-4">Create New List</h3>
                        <input
                            type="text"
                            placeholder="List name (e.g., 'Top AI Startups')"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="input-field"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                        />
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateList}
                                className="btn-primary text-sm"
                                disabled={!newListName.trim()}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Company Modal */}
            {showAddCompanyModal && (
                <div className="modal-overlay" onClick={() => { setShowAddCompanyModal(null); setAddSearchQuery(''); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="section-header mb-4">Add Company to List</h3>
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={addSearchQuery}
                            onChange={(e) => setAddSearchQuery(e.target.value)}
                            className="input-field mb-3"
                            autoFocus
                        />
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {filteredCompaniesForAdd.map((company) => {
                                const isAlreadyInList = lists
                                    .find((l) => l.id === showAddCompanyModal)
                                    ?.companyIds.includes(company.id);
                                return (
                                    <button
                                        key={company.id}
                                        onClick={() => !isAlreadyInList && handleAddCompany(showAddCompanyModal, company.id)}
                                        disabled={isAlreadyInList}
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs">
                                            {company.logo}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{company.name}</p>
                                            <p className="text-xs text-gray-400">{company.sector}</p>
                                        </div>
                                        {isAlreadyInList && (
                                            <span className="text-xs text-gray-400">Added</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => { setShowAddCompanyModal(null); setAddSearchQuery(''); }}
                                className="btn-secondary text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
