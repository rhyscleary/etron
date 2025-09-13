// Author(s): Rhys Cleary

const { fetchData } = require("./pollService");

exports.handler = async () => {
    let statusCode = 200;
    
    try {
        await fetchData();

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: error.message})
        }
    }

    return {
        statusCode,
        body: JSON.stringify({message: "Polling completed for all data sources"}),
    };
};