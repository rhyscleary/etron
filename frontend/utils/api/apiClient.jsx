import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';
import { Platform } from 'react-native';

// Normalize localhost URLs for React Native emulators (Android uses 10.0.2.2)
function normalizeUrlForRN(url) {
    try {
        if (typeof url !== 'string') return url;
        const isAndroid = Platform && Platform.OS === 'android';
        if (!isAndroid) return url;

        // Map localhost/127.0.0.1 to Android emulator host
        if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
            const normalized = url.replace('http://localhost', 'http://10.0.2.2').replace('http://127.0.0.1', 'http://10.0.2.2');
            console.warn('[apiClient] Rewriting localhost URL for Android emulator:', normalized);
            return normalized;
        }
        if (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1')) {
            const normalized = url.replace('https://localhost', 'https://10.0.2.2').replace('https://127.0.0.1', 'https://10.0.2.2');
            console.warn('[apiClient] Rewriting localhost URL for Android emulator (https):', normalized);
            return normalized;
        }
        return url;
    } catch {
        return url;
    }
}

async function getHeaders() {
    const session = await fetchAuthSession();
    const idToken = session.tokens.idToken.toString();
    // Avoid logging full tokens to the console; if needed, log a short prefix in dev only
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
        try {
            const preview = idToken?.slice(0, 12) || '';
            console.log(`[apiClient] Using idToken (preview): ${preview}...`);
        } catch {}
    }
    
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
    };
}

async function request(method, path, body = {}, params = {}) {
    const headers = await getHeaders();

    const url = normalizeUrlForRN(path);
    const requestConfig = {
        method,
        url,
        headers,
        params
    }

    if (['post', 'put'].includes(method)) {
        requestConfig.data = body;
    }
    
    try {
    const response = await axios(requestConfig);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`Server error ${error.response.status}: ${JSON.stringify(error.response.data)}`)
        }
        throw new Error(error.message);
    }
}

export async function apiPost(path, body = {}, params = {}) {
    return request('post', path, body, params);
}

export async function apiGet(path, params = {}) {
    return request('get', path, {}, params);
}

export async function apiPut(path, body = {}, params = {}) {
    return request('put', path, body, params);
}

export async function apiDelete(path, params = {}) {
    return request('delete', path, {}, params);
}