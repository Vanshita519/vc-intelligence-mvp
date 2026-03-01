'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Globe,
    MapPin,
    Users,
    DollarSign,
    Calendar,
    Sparkles,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ExternalLink,
    ListPlus,
    StickyNote,
    Clock,
    TrendingUp,
    Briefcase,
    Newspaper,
    Handshake,
    Package,
    Tag,
    Link as LinkIcon,
} from 'lucide-react';
import { getCompanyById } from '../../../lib/companies';
import { Company, EnrichmentResult, CompanyList, Signal } from '../../../lib/types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const signalIcons: Record<string, typeof TrendingUp> = {
    funding: DollarSign,
    hire: Briefcase,
    product: Package,
    press: Newspaper,
    partnership: Handshake,
};

const signalColors: Record<string, string> = {
    funding: 'bg-green-500',
    hire: 'bg-blue-500',
    product: 'bg-purple-500',
    press: 'bg-amber-500',
    partnership: 'bg-rose-500',
};

export default function CompanyProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [company, setCompany] = useState<Company | null>(null);

    // Notes
    const [notes, setNotes] = useLocalStorage<Record<string, string>>('vc-company-notes', {});

    // Lists
    const [lists, setLists] = useLocalStorage<CompanyList[]>('vc-lists', []);
    const [showListDropdown, setShowListDropdown] = useState(false);

    // Enrichment
    const [enrichmentCache, setEnrichmentCache] = useLocalStorage<Record<string, EnrichmentResult>>('vc-enrichment-cache', {});
    const [enrichmentLoading, setEnrichmentLoading] = useState(false);
    const [enrichmentError, setEnrichmentError] = useState<string | null>(null);

    useEffect(() => {
        const c = getCompanyById(id);
        if (c) setCompany(c);
    }, [id]);

    const enrichment = enrichmentCache[id] || null;

    const handleEnrich = async () => {
        if (!company || enrichment) return;
        setEnrichmentLoading(true);
        setEnrichmentError(null);

        try {
            const res = await fetch('/api/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: company.website, companyName: company.name }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Enrichment failed');
            }

            const data: EnrichmentResult = await res.json();
            data.companyId = id;
            setEnrichmentCache((prev) => ({ ...prev, [id]: data }));
        } catch (err) {
            setEnrichmentError(err instanceof Error ? err.message : 'Enrichment failed');
        } finally {
            setEnrichmentLoading(false);
        }
    };

    const handleAddToList = (listId: string) => {
        setLists((prev) =>
            prev.map((l) =>
                l.id === listId && !l.companyIds.includes(id)
                    ? { ...l, companyIds: [...l.companyIds, id], updatedAt: new Date().toISOString() }
                    : l
            )
        );
        setShowListDropdown(false);
    };

    const isInList = (listId: string) => {
        return lists.find((l) => l.id === listId)?.companyIds.includes(id) || false;
    };

    if (!company) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Company not found</p>
                    <button onClick={() => router.push('/companies')} className="btn-primary text-sm mt-4">
                        Back to Companies
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Back button */}
            <button
                onClick={() => router.push('/companies')}
                className="btn-ghost text-sm flex items-center gap-1 -ml-3"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Companies
            </button>

            {/* Header */}
            <div className="card p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg sm:text-xl shrink-0">
                            {company.logo}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{company.name}</h1>
                            <p className="text-gray-500 mt-1 text-sm sm:text-base line-clamp-2">{company.description}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                                <span className="badge-blue">{company.sector}</span>
                                <span className="badge-green">{company.stage}</span>
                                <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {company.location}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Save to List */}
                        <div className="relative">
                            <button
                                onClick={() => setShowListDropdown(!showListDropdown)}
                                className="btn-secondary text-xs sm:text-sm flex items-center gap-2"
                            >
                                <ListPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Save to List</span>
                                <span className="sm:hidden">Save</span>
                            </button>
                            {showListDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-10 py-1">
                                    {lists.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-400">
                                            No lists yet. Create one in the Lists page.
                                        </div>
                                    ) : (
                                        lists.map((list) => (
                                            <button
                                                key={list.id}
                                                onClick={() => handleAddToList(list.id)}
                                                disabled={isInList(list.id)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between disabled:opacity-50"
                                            >
                                                <span>{list.name}</span>
                                                {isInList(list.id) && (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Enrich */}
                        <button
                            onClick={handleEnrich}
                            disabled={enrichmentLoading || !!enrichment}
                            className={`text-xs sm:text-sm flex items-center gap-2 ${enrichment
                                ? 'btn-secondary text-green-600 border-green-200 bg-green-50'
                                : 'btn-primary'
                                }`}
                        >
                            {enrichmentLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : enrichment ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {enrichmentLoading ? 'Enriching...' : enrichment ? 'Enriched' : 'Enrich'}
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs text-gray-400">Funding</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900">{company.funding}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs text-gray-400">Employees</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900">{company.employees}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs text-gray-400">Founded</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900">{company.founded}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs text-gray-400">Website</p>
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                Visit <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left column: Signals + Notes */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Signals Timeline */}
                    <div className="card p-4 sm:p-6">
                        <h2 className="section-header flex items-center gap-2 mb-4 sm:mb-5">
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                            Signals Timeline
                        </h2>
                        <div className="space-y-0">
                            {company.signals.map((signal: Signal, index: number) => {
                                const Icon = signalIcons[signal.type] || TrendingUp;
                                return (
                                    <div key={signal.id} className="flex gap-3 sm:gap-4 relative">
                                        {/* Timeline line */}
                                        {index < company.signals.length - 1 && (
                                            <div className="absolute left-[13px] sm:left-[15px] top-[28px] sm:top-[30px] w-0.5 h-[calc(100%)] bg-gray-200" />
                                        )}
                                        {/* Dot */}
                                        <div className={`w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] rounded-full ${signalColors[signal.type]} flex items-center justify-center shrink-0 z-10`}>
                                            <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                                        </div>
                                        {/* Content */}
                                        <div className="pb-5 sm:pb-6 min-w-0 flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                                                <p className="text-sm font-medium text-gray-900">{signal.title}</p>
                                                <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(signal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{signal.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Enrichment Results */}
                    {enrichmentError && (
                        <div className="card p-4 sm:p-6 border-red-200 bg-red-50">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-semibold text-red-800">Enrichment Failed</h3>
                                    <p className="text-sm text-red-600 mt-1">{enrichmentError}</p>
                                    <button onClick={handleEnrich} className="btn-secondary text-sm mt-3 text-red-600 border-red-200">
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {enrichmentLoading && (
                        <div className="card p-6 sm:p-8">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-900">Enriching {company.name}...</p>
                                    <p className="text-xs text-gray-400 mt-1">Fetching website data and generating insights</p>
                                </div>
                                <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {enrichment && (
                        <div className="space-y-4">
                            <div className="card p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                    <h2 className="section-header flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary-500" />
                                        AI Enrichment
                                    </h2>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(enrichment.timestamp).toLocaleString()}
                                    </span>
                                </div>

                                {/* Summary */}
                                <div className="mb-5">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Summary</h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">{enrichment.summary}</p>
                                </div>

                                {/* What they do */}
                                <div className="mb-5">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">What They Do</h3>
                                    <ul className="space-y-2">
                                        {enrichment.whatTheyDo.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Keywords */}
                                <div className="mb-5">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Keywords</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {enrichment.keywords.map((keyword, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                                <Tag className="w-3 h-3" />
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Derived Signals */}
                                <div className="mb-5">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Derived Signals</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {enrichment.derivedSignals.map((signal, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50">
                                                {signal.present ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-gray-300" />
                                                )}
                                                <span className={signal.present ? 'text-gray-700' : 'text-gray-400'}>
                                                    {signal.signal}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sources */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources</h3>
                                    <div className="space-y-1.5">
                                        {enrichment.sources.map((source, i) => (
                                            <a
                                                key={i}
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg p-1.5 -ml-1.5 transition-colors"
                                            >
                                                <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{source.title}</span>
                                                <ExternalLink className="w-3 h-3 ml-auto shrink-0 text-gray-300" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column: Notes */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="card p-4 sm:p-6">
                        <h2 className="section-header flex items-center gap-2 mb-4">
                            <StickyNote className="w-5 h-5 text-gray-400" />
                            Notes
                        </h2>
                        <textarea
                            placeholder="Add your notes about this company..."
                            value={notes[id] || ''}
                            onChange={(e) =>
                                setNotes((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                            className="input-field min-h-[150px] sm:min-h-[200px] resize-y text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Notes are saved automatically to your browser.
                        </p>
                    </div>

                    {/* Quick Info */}
                    <div className="card p-4 sm:p-6">
                        <h2 className="section-header mb-4">Quick Info</h2>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-xs text-gray-400">Sector</dt>
                                <dd className="text-sm font-medium text-gray-900">{company.sector}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-400">Stage</dt>
                                <dd className="text-sm font-medium text-gray-900">{company.stage}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-400">Total Funding</dt>
                                <dd className="text-sm font-medium text-gray-900">{company.funding}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-400">Team Size</dt>
                                <dd className="text-sm font-medium text-gray-900">{company.employees}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-400">Founded</dt>
                                <dd className="text-sm font-medium text-gray-900">{company.founded}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-400">Location</dt>
                                <dd className="text-sm font-medium text-gray-900">{company.location}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
