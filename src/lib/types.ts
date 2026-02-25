export interface Company {
  id: string;
  name: string;
  description: string;
  sector: string;
  stage: string;
  location: string;
  website: string;
  founded: number;
  funding: string;
  employees: string;
  logo: string;
  signals: Signal[];
}

export interface Signal {
  id: string;
  type: 'funding' | 'hire' | 'product' | 'press' | 'partnership';
  title: string;
  date: string;
  description: string;
}

export interface EnrichmentResult {
  summary: string;
  whatTheyDo: string[];
  keywords: string[];
  derivedSignals: DerivedSignal[];
  sources: EnrichmentSource[];
  timestamp: string;
  companyId: string;
}

export interface DerivedSignal {
  signal: string;
  present: boolean;
}

export interface EnrichmentSource {
  url: string;
  title: string;
}

export interface CompanyList {
  id: string;
  name: string;
  companyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface SearchFilters {
  query: string;
  sector: string;
  stage: string;
  location: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
