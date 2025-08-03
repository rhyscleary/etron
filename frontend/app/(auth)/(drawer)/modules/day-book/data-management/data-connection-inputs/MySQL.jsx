import React from "react";
import ConnectionPage from "../../../../../../../components/layout/ConnectionPage";
import { MySqlFormSection } from "../../../../../../../components/layout/FormSelection";

import { 
validateMySqlForm,    
generateMySqlNameFromHostname, 
buildMySqlConnectionData 
} from "../../../../../../../utils/connectionValidators";

const MySQL = () => {

    return (
        <ConnectionPage
            connectionType="mysql"
            title="MySQL Database"
            FormComponent={MySqlFormSection}
            formValidator={validateMySqlForm}
            connectionDataBuilder={buildMySqlConnectionData}
            nameGenerator={generateMySqlNameFromHostname}
        />
    )
}

export default MySQL;