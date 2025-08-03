  import React from "react";
  import ConnectionPage from "../../../../../../../components/layout/ConnectionPage";
  import { FtpFormSection } from "../../../../../../../components/layout/FormSelection";


  import { 
    validateFtpForm, 
    generateFtpNameFromHostname, 
    buildFtpConnectionData 
  } from "../../../../../../../utils/connectionValidators";

  const CustomFTP = () => {
    return (
      <ConnectionPage
        connectionType="custom-ftp"
        title="Custom FTP"
        FormComponent={FtpFormSection}
        formValidator={validateFtpForm}
        connectionDataBuilder={buildFtpConnectionData}
        nameGenerator={generateFtpNameFromHostname}
      />
    );
  };

  export default CustomFTP;