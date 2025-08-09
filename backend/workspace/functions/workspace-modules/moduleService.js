// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');
const { getAppModules } = require("@etron/shared/repositories/s3BucketRepository");

async function installModule(authUserId, workspaceId, moduleKey) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const appModules = await getAppModules();

    let selectedModule = null;    

    for (const module of appModules) {
        if (module.key === moduleKey) {
            selectedModule = module;
            break;
        }
    }

    if (!selectedModule) {
        throw new Error("The key does not exist in the available modules");
    }

    const moduleId = uuidv4();
    const date = new Date().toISOString();

    // create a new module item
    const moduleItem = {
        workspaceId: workspaceId,
        moduleId: moduleId,
        moduleKey: selectedModule.key,
        name: selectedModule.name,
        description: selectedModule.description,
        installedAt: date,
        updatedAt: date
    };

    await workspaceRepo.addModule(moduleItem);

    return moduleItem;
}

async function toggleModule(authUserId, workspaceId, moduleKey) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const [module] = await workspaceRepo.getModuleByKey(workspaceId, moduleKey);

    if (!module) {
        throw new Error("Module not found");
    }

    module.enabled = !module.enabled;


    return workspaceRepo.updateModule(workspaceId, module.moduleId, module.enabled);
}

async function uninstallModule(authUserId, workspaceId, moduleKey) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const [module] = await workspaceRepo.getModuleByKey(workspaceId, moduleKey);

    if (!module) {
        throw new Error("Module not found");
    }

    await workspaceRepo.removeModule(workspaceId, module.moduleId);

    return {message: "Module successfully uninstalled"};
}

async function getAvailableModules(authUserId, workspaceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const appModules = await getAppModules();

    const workspaceModules = await workspaceRepo.getModulesByWorkspaceId(workspaceId);

    const availableModules = appModules.filter(
        appModule => !workspaceModules.some(
            workspaceModule => workspaceModule.moduleKey === appModule.key
        )
    );

    return availableModules;
}

async function getInstalledModules(authUserId, workspaceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    return workspaceRepo.getModulesByWorkspaceId(workspaceId);
}

module.exports = {
    installModule,
    uninstallModule,
    toggleModule,
    getInstalledModules,
    getAvailableModules
};