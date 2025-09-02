// Author(s): Rhys Cleary

const { localFileConversion } = require("../services/dataSourceService");

exports.handler = async () => {
    let statusCode = 200;
    
    try {
        

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: error.message})
        }
    }

    return {
        statusCode,
        body: JSON.stringify({message: "File successfully copied and converted"}),
    };
};