// Author(s): Rhys Cleary
const apiAdapter = require("./apiAdapter");
const ftpAdapter = require("./ftpAdapter");

function getAdapter(type) {
    switch (type) {
        case "api":
            return apiAdapter;
        case "ftp":
            return ftpAdapter;
        default:
            throw new Error(`Unknown adapter type: ${type}`);
    }
}

module.exports = {
    getAdapter
};