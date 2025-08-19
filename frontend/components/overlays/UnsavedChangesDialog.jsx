// Author(s): Rhys Cleary

import { useTheme } from "react-native-paper";
import BasicDialog from "./BasicDialog";

const UnsavedChangesDialog = ({
    visible,
    onDismiss,
    handleLeftAction = () => {},
    handleRightAction = () => {}
}) => {
    const theme = useTheme();

    return (
        <BasicDialog
            visible={visible}
            onDismiss={onDismiss}
            title="Discard changes?"
            message="You have unsaved changes."
            leftActionLabel="Discard Changes"
            handleLeftAction={handleLeftAction}
            rightActionLabel="Keep Editing"
            handleRightAction={handleRightAction}
        />
    );

};

export default UnsavedChangesDialog;