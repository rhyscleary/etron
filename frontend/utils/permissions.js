// Author(s): Rhys Cleary

import { getPermissions, isOwnerRole } from "../storage/permissionsStorage";

export async function hasPermission(requiredPermissions) {
    try {
        // if owner return true
        if (await isOwnerRole()) return true;

        const userPermissions = await getPermissions();
        if (!userPermissions) return false; // default to false

        // normalise the required prmissions to an array
        const requiredList = Array.isArray(requiredPermissions) 
            ? requiredPermissions 
            : [requiredPermissions];

        // if the user has everything that's required return true
        return requiredList.every(permission => userPermissions.includes(permission));
    } catch (error) {
        console.error("Error checking permissions:", error);
        return false;
    }
}