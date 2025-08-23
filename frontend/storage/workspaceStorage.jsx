// Author(s): Rhys Cleary

import AsyncStorage from "@react-native-async-storage/async-storage"

// store workspace information: workspaceId, name, location, description, createdAt, UpdatedAt
const workspaceKey = "workspaceInfo";

// Try a variety of common keys and shapes to extract an ID from server responses
export function extractWorkspaceId(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const candidates = [
        obj.workspaceId,
        obj.id,
        obj.workspace_id,
        obj.WorkspaceId,
        obj.WorkspaceID,
        obj.ID,
        obj._id,
        obj.uuid,
    ].filter(Boolean);
    if (candidates.length) return String(candidates[0]);
    // look into common nesting patterns
    const nested = obj.workspace || obj.data || obj.item || obj.Item || null;
    if (nested && typeof nested === 'object') return extractWorkspaceId(nested);
    return null;
}

function normalizeWorkspaceShape(raw) {
    if (!raw) return null;
    const base = raw.workspace || raw.data || raw; // prefer nested workspace/data when present
    const id = extractWorkspaceId(base);
    const name = base.name || base.workspaceName || base.title || raw.name || null;
    const description = base.description ?? raw.description ?? null;
    const location = base.location ?? raw.location ?? null;
    // Preserve all original fields but ensure id/workspaceId are present at the top level
    const normalized = { ...base };
    if (id && !normalized.id) normalized.id = id;
    if (id && !normalized.workspaceId) normalized.workspaceId = id;
    if (name && !normalized.name) normalized.name = name;
    if (description !== undefined && normalized.description === undefined) normalized.description = description;
    if (location !== undefined && normalized.location === undefined) normalized.location = location;
    return normalized;
}

export async function saveWorkspaceInfo(workspace) {
    try {
        const normalized = normalizeWorkspaceShape(workspace) || workspace;
    console.log('[workspaceStorage] saveWorkspaceInfo.beforeSave', { receivedId: extractWorkspaceId(workspace), normalizedId: extractWorkspaceId(normalized) });
        const value = JSON.stringify(normalized);
        await AsyncStorage.setItem(workspaceKey, value);
        console.log('[workspaceStorage] saveWorkspaceInfo', { hasWorkspace: !!workspace, workspaceId: extractWorkspaceId(normalized) });
    } catch (error) {
        console.log("Error saving workspace information: ", error);
    }
}

export async function getWorkspaceInfo() {
    try {
        const value = await AsyncStorage.getItem(workspaceKey);
        const parsed = value != null ? JSON.parse(value) : null;
        const id = extractWorkspaceId(parsed);
        console.log('[workspaceStorage] getWorkspaceInfo', { exists: !!parsed, workspaceId: id });
        // If we detect a valid id but the stored shape is missing normalized keys, auto-heal storage
        if (parsed && id && (!parsed.id || !parsed.workspaceId)) {
            try {
                const healed = normalizeWorkspaceShape(parsed);
                if (healed) await AsyncStorage.setItem(workspaceKey, JSON.stringify(healed));
            } catch {}
        }
        return parsed;
    } catch (error) {
        console.log("Error occured retrieving workspace information: ", error);
        return null;
    }
}

export async function removeWorkspaceInfo() {
    try {
        await AsyncStorage.removeItem(workspaceKey);
        console.log('[workspaceStorage] removeWorkspaceInfo');
    } catch (error) {
        console.log("Error occured removing workspace information: ", error);
    }
}

// get values from the information stored
export async function getWorkspaceId() {
    const workspace = await getWorkspaceInfo();
    const id = extractWorkspaceId(workspace);
    // Auto-heal stored value to include id/workspaceId for future fast access
    if (workspace && id && (!workspace.id || !workspace.workspaceId)) {
        try { await saveWorkspaceInfo(workspace); } catch {}
    }
    console.log('[workspaceStorage] getWorkspaceId ->', id);
    return id;
}

// TESTING
/*export async function saveTestWorkspaceInfo() {
    const workspaceData = {
        id: "e676164b-7447-4d39-9118-babb5c97fbb3",
        name: "InSync",
        description: "hello this is a workspace",
        location: "Sydney"
    };

    saveWorkspaceInfo(workspaceData);
}*/

