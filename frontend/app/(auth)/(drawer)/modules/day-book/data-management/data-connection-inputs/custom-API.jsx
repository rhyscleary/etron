  import React from "react";
  import ConnectionPage from "../../../../../../../components/layout/ConnectionPage";
  import { ApiFormSection } from "../../../../../../../components/layout/FormSelection";

  import { 
    validateApiForm, 
    generateApiNameFromUrl, 
    buildApiConnectionData 
  } from "../../../../../../../utils/connectionValidators";

  const CustomAPI = () => {
    return (
      <ConnectionPage
        connectionType="custom-api"
        title="Custom API"
        FormComponent={ApiFormSection}
        formValidator={validateApiForm}
        connectionDataBuilder={buildApiConnectionData}
        nameGenerator={generateApiNameFromUrl}
      />
    );
  };

  export default CustomAPI;