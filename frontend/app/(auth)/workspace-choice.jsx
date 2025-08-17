// Author(s): Rhys Cleary

import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { commonStyles } from '../../assets/styles/stylesheets/common';

import WorkspaceDialog from '../../components/overlays/WorkspaceDialog';

const WorkspaceChoice = () => {
  const [showWorkspaceModal, setWorkspaceModal] = useState(true);

  return (
    <View style={commonStyles.screen}>

        <WorkspaceDialog
          visible={showWorkspaceModal}
          setWorkspaceModal={setWorkspaceModal}
          router={router}
          showGoBack={false}
        />

    </View>
  );
}

export default WorkspaceChoice;