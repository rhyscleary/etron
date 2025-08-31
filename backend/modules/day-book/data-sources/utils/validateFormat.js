// validate the format of the data fetched
function validateFormat(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return { valid: false, error: "Data must be a non-empty array of sets" };
    }

    // loop through data sets
    for (let s = 0; s < data.length; s++) {
        const set = data[s];

        if (!Array.isArray(set) || set.length === 0) {
            return { valid: false, error: `Set ${s} must be a non-empty array of rows` };
        }

        const headerKeys = Object.keys(set[0]);
        const headerKeySet = new Set(headerKeys);

        // ensure that the keys are unique
        const uniqueKeys = new Set(headerKeys);
        if (uniqueKeys.size !== headerKeys.length) {
            return { valid: false, error: `Duplicate headers found in set ${s}`};
        }

        // validate each row
        for (let r = 0; r < set.length; r++) {
            const row = set[r];

            if (typeof row !== "object" || row === null || Array.isArray(row)) {
                return { valid: false, error: `Row ${r} in set ${s} is not an object` };
            }

            for (const [key, value] of Object.entries(row)) {
                if (value === null || value === undefined || value === "") {
                    return { valid: false, error: `Empty field for ${key} in set ${s}, row ${r}`};
                }
            }

            // ensure the keys (headers) in each row are consistent with the first
            const rowKeys = Object.keys(row);
            if (rowKeys.length !== headerKeys.length || !rowKeys.every(heading => headerKeySet.has(heading))) {
                return { valid: false, error: `Row ${r} in set ${s} has inconsistent headings with the first row`};
            }
        }

    }

    return { valid: true };
}

module.exports = {
    validateFormat
};