// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
    DynamoDBDocumentClient, 
    PutCommand, 
    GetCommand, 
    DeleteCommand, 
    UpdateCommand,
    QueryCommand 
} = require("@aws-sdk/lib-dynamodb");

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "Workspaces";


// ROLES

// add role to workspace
async function addRole(roleItem) {
    const {roleId, ...rest} = roleItem;
    const updatedRoleItem = {
        ...rest,
        sk: `role#${roleId}`
    }

    // send request to datastore
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: updatedRoleItem
        })
    );
}

// remove role from workspace
async function removeRole(workspaceId, roleId) {
    const sk = `role#${roleId}`;
    
    // send request to delete entry
    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: sk
            },
        })
    );
}

// update role in workspace
async function updateRole(workspaceId, roleId, data) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = data.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (data.permissions !== undefined) {
        updateFields.push("#permissions = :permissions");
        expressionAttributeValues[":permissions"] = data.permissions
        expressionAttributeNames["#permissions"] = "permissions";
    }

    updateFields.push("#updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    const sk = `role#${roleId}`;

    const result = await dynamoDB.send(
        new UpdateCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: sk
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "ALL_NEW"
        })
    );

    const itemAttributes = result.Attributes;
    const { sk: skValue, ...rest } = itemAttributes;

    return {
        ...rest,
        roleId: skValue.replace("role#", "")
    };
}

// get role in a workspace
async function getRoleById(workspaceId, roleId) {
    const sk = `role#${roleId}`;
    
    const result = await dynamoDB.send(
        new GetCommand({
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: sk
            }
        })
    );

    const item = result.Item;

    if (!item) {
        return null;
    }

    const { sk: skValue, ...rest } = item;
    
    return {
        ...rest,
        roleId: skValue.replace("role#", "")
    };
}

// get all roles in a workspace
async function getRolesByWorkspaceId(workspaceId) {
    // get the roles in a workspace
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: "workspaceId = :workspaceId AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":workspaceId": workspaceId,
                    ":prefix": "role#"
                }
            })
        );

    return (result.Items || null).map(({sk, ...rest}) => ({
        ...rest,
        roleId: sk.replace("role#", "")
    }));
}

// PROFILES

// add profile to workspace
async function addProfile(profileItem) {
    profileItem = (result.Attributes || []).map(({sk, ...rest}) => ({
        ...rest,
        sk: profileId.replace(`profile#${profileId}`)
    }));

    // send request to datastore
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: profileItem
        })
    );
}

// remove profile from workspace
async function removeProfile(workspaceId, profileId) {
    const sk = `profile#${profileId}`;
    
    // send request to delete entry
    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: sk
            },
        })
    );
}

// update profile in workspace
async function updateProfile(workspaceId, profileId, data) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = data.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (data.layout !== undefined) {
        updateFields.push("#layout = :layout");
        expressionAttributeValues[":layout"] = data.layout
        expressionAttributeNames["#layout"] = "layout";
    }

    updateFields.push("#updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    const sk = `profile#${profileId}`;

    const result = await dynamoDB.send(
        new UpdateCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: sk
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "ALL_NEW"
        })
    );

    const itemAttributes = result.Attributes;
    const { sk: skValue, ...rest } = itemAttributes;

    return {
        ...rest,
        profileId: skValue.replace("profile#", "")
    };
}

// get profile in a workspace
async function getProfileById(workspaceId, profileId) {
    const sk = `profile#${profileId}`;
    
    const result = await dynamoDB.send(
        new GetCommand({
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: sk
            }
        })
    );
    
    const item = result.Item;

    if (!item) {
        return null;
    }

    const { sk: skValue, ...rest } = item;
    
    return {
        ...rest,
        profileId: skValue.replace("profile#", "")
    };
}

// get all profiles in a workspace
async function getProfilesByWorkspaceId(workspaceId) {
    // get the profiles in a workspace
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: "workspaceId = :workspaceId AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":workspaceId": workspaceId,
                    ":prefix": "profile#"
                }
            })
        );

    return (result.Items || null).map(({sk, ...rest}) => ({
        ...rest,
        profileId: sk.replace("profile#", "")
    }));
}

// WORKSPACE

// add a new workspace entry
async function addWorkspace(workspaceItem) {
    // send request to datastore
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: workspaceItem
        })
    );
}

// remove workspace
async function removeWorkspace(workspaceId) {    
    // send request to delete entry
    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: "meta"
            },
        })
    );
}

// get workspace by id
async function getWorkspaceById(workspaceId) {
    const result = await dynamoDB.send(
        new GetCommand({
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: "meta"
            }
        })
    );
    
    return result.Item || null;
}

// get workspace by id
async function updateWorkspace(workspaceId, data) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = data.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (data.location !== undefined) {
        updateFields.push("#location = :location");
        expressionAttributeValues[":location"] = data.location;
        expressionAttributeNames["#location"] = "location";
    }

    if (data.description !== undefined) {
        updateFields.push("#description = :description");
        expressionAttributeValues[":description"] = data.description;
        expressionAttributeNames["#description"] = "description";
    }

    if (updateFields.length === 0) {
        throw new Error("No fields to update");
    }

    updateFields.push("#updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    const result = await dynamoDB.send(
        new UpdateCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: "meta"
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "ALL_NEW"
        })
    );
    
    return result;
}

// MODULES

// add module to workspace
async function addModule(moduleItem) {
    const {moduleId, ...rest} = moduleItem;
    const updatedModuleItem = {
        ...rest,
        sk: `module#${moduleId}`
    }

    // send request to datastore
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: updatedModuleItem
        })
    );
}

// remove module from workspace
async function removeModule(workspaceId, moduleId) {
    const sk = `module#${moduleId}`;
    
    // send request to delete entry
    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: sk
            },
        })
    );
}

// update module in workspace
async function updateModule(workspaceId, moduleId, enabled) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    updateFields.push("#enabled = :enabled");
    expressionAttributeValues[":enabled"] = enabled
    expressionAttributeNames["#enabled"] = "enabled";

    updateFields.push("#updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    const sk = `module#${moduleId}`;

    const result = await dynamoDB.send(
        new UpdateCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: sk
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "ALL_NEW"
        })
    );

    const itemAttributes = result.Attributes;
    const { sk: skValue, ...rest } = itemAttributes;

    return {
        ...rest,
        moduleId: skValue.replace("module#", "")
    };
}

// get all modules in a workspace
async function getModulesByWorkspaceId(workspaceId) {
    // get the modules in a workspace
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: "workspaceId = :workspaceId AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":workspaceId": workspaceId,
                    ":prefix": "module#"
                }
            })
        );

    return (result.Items || null).map(({sk, ...rest}) => ({
        ...rest,
        moduleId: sk.replace("module#", "")
    }));
}

// get all modules in a workspace by key
async function getModuleByKey(workspaceId, moduleKey) {
    // get the modules in a workspace
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: tableName,
                IndexName: "workspaceId-moduleKey-index",
                KeyConditionExpression: "workspaceId = :workspaceId AND moduleKey = :moduleKey",
                ExpressionAttributeValues: {
                    ":workspaceId": workspaceId,
                    ":moduleKey": moduleKey
                }
            })
        );

    return (result.Items || null).map(({sk, ...rest}) => ({
        ...rest,
        moduleId: sk.replace("module#", "")
    }));
}

module.exports = {
    addRole,
    updateRole,
    removeRole,
    getRoleById,
    getRolesByWorkspaceId,
    addProfile,
    updateProfile,
    removeProfile,
    getProfileById,
    getProfilesByWorkspaceId,
    addWorkspace,
    removeWorkspace,
    getWorkspaceById,
    updateWorkspace,
    addModule,
    updateModule,
    removeModule,
    getModulesByWorkspaceId,
    getModuleByKey
}