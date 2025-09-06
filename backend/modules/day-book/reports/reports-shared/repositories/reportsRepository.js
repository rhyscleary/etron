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

const tableName = "Reports";


// DRAFTS

// add draft
async function addDraft(draftItem) {
    const {draftId, ...rest} = draftItem;
    const updatedDraftItem = {
        ...rest,
        sk: `draft#${draftId}`
    }

    // send request to datastore
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: updatedDraftItem
        })
    );
}

// delete draft
async function deleteDraft(workspaceId, draftId) {
    const sk = `draft#${draftId}`;
    
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

// update draft in workspace
async function updateDraft(workspaceId, draftId, data) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = data.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (data.editedBy !== undefined) {
        updateFields.push("#editedBy = :editedBy");
        expressionAttributeValues[":editedBy"] = data.editedBy;
        expressionAttributeNames["#editedBy"] = "editedBy";
    }

    updateFields.push("#lastEdited = :lastEdited");
    expressionAttributeValues[":lastEdited"] = data.lastEdited;
    expressionAttributeNames["#lastEdited"] = "lastEdited";

    const sk = `draft#${draftId}`;

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
        draftId: skValue.replace("draft#", "")
    };
}

// get draft in workspace
async function getDraftById(workspaceId, draftId) {
    const sk = `draft#${draftId}`;
    
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
        draftId: skValue.replace("draft#", "")
    };
}

// get all drafts in a workspace
async function getDraftsByWorkspaceId(workspaceId) {
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: "workspaceId = :workspaceId AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":workspaceId": workspaceId,
                    ":prefix": "draft#"
                }
            })
        );

    return (result.Items || []).map(({sk, ...rest}) => ({
        ...rest,
        draftId: sk.replace("draft#", "")
    }));
}

// TEMPLATES

// add template
async function addTemplate(templateItem) {
    const {templateId, ...rest} = templateItem;
    const updatedTemplateItem = {
        ...rest,
        sk: `template#${templateId}`
    }

    // send request to datastore
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: updatedTemplateItem
        })
    );
}

// delete template
async function deleteTemplate(workspaceId, templateId) {
    const sk = `template#${templateId}`;
    
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

// update template in workspace
async function updateTemplate(workspaceId, templateId, data) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = data.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (data.editedBy !== undefined) {
        updateFields.push("#editedBy = :editedBy");
        expressionAttributeValues[":editedBy"] = data.editedBy;
        expressionAttributeNames["#editedBy"] = "editedBy";
    }

    updateFields.push("#lastEdited = :lastEdited");
    expressionAttributeValues[":lastEdited"] = data.lastEdited;
    expressionAttributeNames["#lastEdited"] = "lastEdited";

    const sk = `template#${templateId}`;

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
        templateId: skValue.replace("template#", "")
    };
}

// get template in workspace
async function getTemplateById(workspaceId, templateId) {
    const sk = `template#${templateId}`;
    
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
        templateId: skValue.replace("template#", "")
    };
}

// get all templates in a workspace
async function getTemplatesByWorkspaceId(workspaceId) {
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: "workspaceId = :workspaceId AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":workspaceId": workspaceId,
                    ":prefix": "template#"
                }
            })
        );

    return (result.Items || []).map(({sk, ...rest}) => ({
        ...rest,
        draftId: sk.replace("template#", "")
    }));
}

module.exports = {
    addDraft,
    deleteDraft,
    updateDraft,
    getDraftById,
    getDraftsByWorkspaceId,
    addTemplate,
    deleteTemplate,
    updateTemplate,
    getTemplateById,
    getTemplatesByWorkspaceId
}