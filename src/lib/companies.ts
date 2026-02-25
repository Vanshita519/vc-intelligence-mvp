import { Company, SearchFilters } from './types';
import companiesData from '../data/companies.json';

const companies: Company[] = companiesData as Company[];

export function getAllCompanies(): Company[] {
    return companies;
}

export function getCompanyById(id: string): Company | undefined {
    return companies.find((c) => c.id === id);
}

export function getUniqueSectors(): string[] {
    return [...new Set(companies.map((c) => c.sector))].sort();
}

export function getUniqueStages(): string[] {
    return [...new Set(companies.map((c) => c.stage))].sort();
}

export function getUniqueLocations(): string[] {
    return [...new Set(companies.map((c) => c.location))].sort();
}

export function filterAndSortCompanies(filters: SearchFilters): Company[] {
    let result = [...companies];

    if (filters.query) {
        const q = filters.query.toLowerCase();
        result = result.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.sector.toLowerCase().includes(q)
        );
    }

    if (filters.sector) {
        result = result.filter((c) => c.sector === filters.sector);
    }

    if (filters.stage) {
        result = result.filter((c) => c.stage === filters.stage);
    }

    if (filters.location) {
        result = result.filter((c) => c.location === filters.location);
    }

    if (filters.sortBy) {
        result.sort((a, b) => {
            const aVal = a[filters.sortBy as keyof Company] as string;
            const bVal = b[filters.sortBy as keyof Company] as string;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return filters.sortOrder === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            return 0;
        });
    }

    return result;
}
