// Author(s): Rhys Cleary

import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { commonStyles } from '../../assets/styles/stylesheets/common';

import DecisionDialog from '../../components/overlays/DecisionDialog';

const WorkspaceChoice = () => {
  const [showWorkspaceModal, setWorkspaceModal] = useState(true);

  return (
    <View style={commonStyles.screen}>

      <DecisionDialog
        visible={showWorkspaceModal}
        title="Workspace"
        message="Create your own workspace or join an existing one."
        showSignOut={true}
        leftActionLabel="Create"
        handleLeftAction={() => {
          setWorkspaceModal(false);
          router.navigate("/(auth)/create-workspace");
        }}
        rightActionLabel="Join"
        handleRightAction={() => {
          setWorkspaceModal(false);
          router.navigate("/(auth)/join-workspace");
        }}
      />

    </View>
  );
}

export default WorkspaceChoice;