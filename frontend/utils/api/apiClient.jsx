import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';

async function getHeaders() {
    const session = await fetchAuthSession();
    const idToken = session.tokens.idToken.toString();
    console.log(idToken);
    
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
    };
}

async function request(method, path, body = {}, params = {}, extraHeaders = {}) {
    const headers = { ...(await getHeaders()), ...extraHeaders };

    const requestConfig = {
        method,
        url: path,
        headers,
        params
    }

    if (['post', 'put', 'patch'].includes(method)) {
        requestConfig.data = body;
    }
    
    try {
        const response = await axios(requestConfig);
        return response;
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

export async function apiPut(path, body = {}, extraHeaders = {}) {
    return request('put', path, body, {}, extraHeaders);
}

export async function apiPatch(path, body = {}) {
    return request('patch', path, body, {});
}

export async function apiDelete(path, params = {}) {
    return request('delete', path, {}, params);
}