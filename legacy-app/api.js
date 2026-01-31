// API Client for Aspen-Lite
// Handles all communication with the Flask backend
// Uses window.location.origin to work in both local dev and Codespaces

const API_BASE = `${window.location.origin}/api`;

// Cache configuration (TTL in milliseconds)
const CACHE_CONFIG = {
    schools: { ttl: 5 * 60 * 1000 },      // 5 minutes
    students: { ttl: 2 * 60 * 1000 },     // 2 minutes
    filters: { ttl: 10 * 60 * 1000 },     // 10 minutes
    individual: { ttl: 5 * 60 * 1000 }    // 5 minutes
};

// In-memory cache storage
const cache = new Map();

// In-flight request tracking (prevent duplicate requests)
const inFlightRequests = new Map();

/**
 * Cache entry structure: { data, timestamp }
 */
function getCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return sortedParams ? `${endpoint}?${sortedParams}` : endpoint;
}

function isCacheValid(cacheEntry, ttl) {
    if (!cacheEntry) return false;
    const age = Date.now() - cacheEntry.timestamp;
    return age < ttl;
}

function setCache(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

function getCache(key, ttl) {
    const entry = cache.get(key);
    if (isCacheValid(entry, ttl)) {
        return entry.data;
    }
    // Clean up expired cache
    if (entry) {
        cache.delete(key);
    }
    return null;
}

/**
 * Generic fetch with caching and deduplication
 */
async function fetchWithCache(endpoint, params = {}, ttl = 0) {
    const cacheKey = getCacheKey(endpoint, params);

    // Check cache first
    if (ttl > 0) {
        const cachedData = getCache(cacheKey, ttl);
        if (cachedData) {
            return cachedData;
        }
    }

    // Check if request is already in flight
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
    }

    // Build URL with query params
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = new URL(`${API_BASE}/${cleanEndpoint}`);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });

    // Make request
    const requestPromise = fetch(url.toString())
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Cache successful response
            if (ttl > 0) {
                setCache(cacheKey, data);
            }
            // Remove from in-flight tracking
            inFlightRequests.delete(cacheKey);
            return data;
        })
        .catch(error => {
            // Remove from in-flight tracking
            inFlightRequests.delete(cacheKey);
            throw error;
        });

    // Track in-flight request
    inFlightRequests.set(cacheKey, requestPromise);

    return requestPromise;
}

/**
 * POST request helper
 */
async function postRequest(endpoint, body) {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = new URL(`${API_BASE}/${cleanEndpoint}`);

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

// ============================================================================
// PUBLIC API METHODS
// ============================================================================

/**
 * Get list of schools with optional search and pagination
 *
 * @param {Object} options
 * @param {string} options.search - Search query
 * @param {number} options.limit - Results per page (default: 100, max: 200)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @returns {Promise<{schools: Array, total: number, hasMore: boolean}>}
 */
export async function getSchools({ search = '', limit = 100, offset = 0 } = {}) {
    return fetchWithCache('/schools', { search, limit, offset }, CACHE_CONFIG.schools.ttl);
}

/**
 * Get favorite schools by IDs
 *
 * @param {Array<number>} schoolIds - Array of school IDs
 * @returns {Promise<{schools: Array}>}
 */
export async function getFavoriteSchools(schoolIds) {
    if (!schoolIds || schoolIds.length === 0) {
        return { schools: [] };
    }
    return postRequest('/schools/favorites', { schoolIds });
}

/**
 * Get students for a specific school with filters and pagination
 *
 * @param {number} schoolId - School ID
 * @param {Object} options
 * @param {number} options.limit - Results per page (default: 50, max: 200)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {number} options.grade - Filter by grade (9-12)
 * @param {string} options.gender - Filter by gender
 * @param {string} options.ethnicity - Filter by ethnicity
 * @param {string} options.search - Search by name or student ID
 * @returns {Promise<{students: Array, total: number, hasMore: boolean, school: Object}>}
 */
export async function getSchoolStudents(schoolId, {
    limit = 50,
    offset = 0,
    grade,
    gender,
    ethnicity,
    search = ''
} = {}) {
    const endpoint = `/schools/${schoolId}/students`;
    const params = { limit, offset, grade, gender, ethnicity, search };
    return fetchWithCache(endpoint, params, CACHE_CONFIG.students.ttl);
}

/**
 * Get individual student details
 *
 * @param {string} studentId - Student ID (8-digit string)
 * @returns {Promise<{student: Object}>}
 */
export async function getStudent(studentId) {
    const endpoint = `/students/${studentId}`;
    return fetchWithCache(endpoint, {}, CACHE_CONFIG.individual.ttl);
}

/**
 * Get available filter options for a school (grades, genders, ethnicities)
 *
 * @param {number} schoolId - School ID
 * @returns {Promise<{grades: Array, genders: Array, ethnicities: Array}>}
 */
export async function getSchoolFilters(schoolId) {
    const endpoint = `/schools/${schoolId}/filters`;
    return fetchWithCache(endpoint, {}, CACHE_CONFIG.filters.ttl);
}

/**
 * Search students across all schools
 *
 * @param {string} query - Search query (name or student ID)
 * @param {Object} options
 * @param {number} options.schoolId - Filter to specific school (optional)
 * @param {number} options.limit - Results per page (default: 50, max: 200)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @returns {Promise<{students: Array, total: number, hasMore: boolean}>}
 */
export async function searchStudents(query, {
    schoolId,
    limit = 50,
    offset = 0
} = {}) {
    return fetchWithCache('/search/students', { q: query, schoolId, limit, offset }, 0);
}

/**
 * Health check endpoint
 * @returns {Promise<{status: string, studentsCount: number, schoolsCount: number}>}
 */
export async function healthCheck() {
    return fetchWithCache('/health', {}, 0);
}

/**
 * Clear all cached data
 */
export function clearCache() {
    cache.clear();
    console.log('API cache cleared');
}

/**
 * Clear cache for specific endpoint
 */
export function clearCacheForEndpoint(endpoint, params = {}) {
    const cacheKey = getCacheKey(endpoint, params);
    cache.delete(cacheKey);
}
