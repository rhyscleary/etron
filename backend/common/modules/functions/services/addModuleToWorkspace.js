const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const getAvailableModules = require("./getAvailableModules");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "Workspaces";

async function addModuleToWorkspace(workspaceId, moduleId) {
    const moduleList = await getAvailableModules();
    const moduleFound = moduleList.find(module => module.id === moduleId);
    
    if (!moduleFound) {
        throw new Error(`The moduleId ${moduleId} is not in the available list`);
    }

    const sk = `module#${moduleId}`;
    const date = new Date().toISOString();

    // check if the module is already installed
    const result = await dynamoDB.send(new GetCommand({
        TableName: tableName,
        Key: {
            workspaceId: workspaceId,
            type: sk
        }
    }));

    if (result.Item) {
        throw new Error("The module is already installed in the workspace");
    }

    // add a module to a workspace (install)
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: {
                workspaceId: workspaceId,
                type: sk,
                name: moduleFound.name,
                description: moduleFound.description, 
                enabled: true,
                addedAt: date, 
                updatedAt: date
            },
        })
    );

    return {message: "Module installed in workspace"};
}

module.exports = addModuleToWorkspace;