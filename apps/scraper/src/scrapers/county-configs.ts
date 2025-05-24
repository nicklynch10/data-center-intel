import type { CountySource } from '../types/index.js';

export const countyConfigs: Record<string, CountySource> = {
  'loudoun-va': {
    name: 'Loudoun County, VA',
    baseUrl: 'https://www.loudoun.gov',
    searchEndpoint: '/search',
    documentSelector: 'a[href*=".pdf"], a[href*="/documents/"]',
    requiresJavaScript: true,
    searchTerms: ['data center', 'server farm', 'colocation facility'],
  },
  'fairfax-va': {
    name: 'Fairfax County, VA',
    baseUrl: 'https://www.fairfaxcounty.gov',
    searchEndpoint: '/search/site/',
    documentSelector: '.search-result a, a[href*=".pdf"]',
    requiresJavaScript: true,
    searchTerms: ['data center', 'technology facility', 'server farm'],
  },
  'prince-william-va': {
    name: 'Prince William County, VA',
    baseUrl: 'https://www.pwcva.gov',
    documentSelector: 'a[href*=".pdf"], .document-link',
    requiresJavaScript: true,
    searchTerms: ['data center', 'digital infrastructure'],
  },
  'douglas-ga': {
    name: 'Douglas County, GA',
    baseUrl: 'https://www.douglascountyga.gov',
    documentSelector: 'a[href*=".pdf"], .minutes-link',
    requiresJavaScript: true,
    searchTerms: ['data center', 'technology park'],
  },
  'mesa-az': {
    name: 'Mesa, AZ',
    baseUrl: 'https://www.mesaaz.gov',
    searchEndpoint: '/Home/Search?searchPhrase=',
    documentSelector: '.search-result-link, a[href*=".pdf"]',
    requiresJavaScript: true,
    searchTerms: ['data center', 'server facility'],
  },
  'chandler-az': {
    name: 'Chandler, AZ',
    baseUrl: 'https://www.chandleraz.gov',
    documentSelector: 'a[href*=".pdf"], .document-link',
    requiresJavaScript: true,
    searchTerms: ['data center', 'technology campus'],
  },
  'phoenix-az': {
    name: 'Phoenix, AZ',
    baseUrl: 'https://www.phoenix.gov',
    searchEndpoint: '/search?q=',
    documentSelector: '.search-result a, a[href*=".pdf"]',
    requiresJavaScript: true,
    searchTerms: ['data center', 'colocation'],
  },
  'columbus-oh': {
    name: 'Columbus, OH',
    baseUrl: 'https://www.columbus.gov',
    documentSelector: 'a[href*=".pdf"], .doc-link',
    requiresJavaScript: true,
    searchTerms: ['data center', 'server farm', 'technology facility'],
  },
  'des-moines-ia': {
    name: 'Des Moines, IA',
    baseUrl: 'https://www.dsm.city',
    documentSelector: 'a[href*=".pdf"], .agenda-link',
    requiresJavaScript: true,
    searchTerms: ['data center', 'technology hub'],
  },
  'quincy-wa': {
    name: 'Quincy, WA',
    baseUrl: 'https://www.quincywa.gov',
    documentSelector: 'a[href*=".pdf"], .document-link',
    requiresJavaScript: true,
    searchTerms: ['data center', 'server facility', 'cloud computing'],
  },
};

export function getCountyConfig(countyKey: string): CountySource | undefined {
  return countyConfigs[countyKey.toLowerCase()];
}

export function listCounties(): string[] {
  return Object.keys(countyConfigs);
}