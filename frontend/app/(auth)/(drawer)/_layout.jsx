import React, { useState, useMemo } from "react";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Divider, useTheme, Icon } from "react-native-paper";
import { View, TouchableOpacity } from "react-native";
import { Drawer } from "expo-router/drawer";
import DescriptiveButton from "../../../components/common/buttons/DescriptiveButton";

// map route to icon
const iconMap = {
  profile: "view-dashboard",
  "day-book": "text-box-multiple",
  account: "account",
  collaboration: "account-group",
  settings: "cog",
  "data-management": "cable-data",
  metrics: "chart-timeline-variant-shimmer",
  reports: "newspaper",
  notifications: "bell-ring",
};

// split routes into nested tree structure
const buildTreeFromRoutes = (routes) => {
  const tree = {};
  routes.forEach(({ name }) => {
    const parts = name.split("/");
    let current = tree;
    parts.forEach((part, idx) => {
      if (!current[part]) {
        current[part] = {
          __path: parts.slice(0, idx + 1).join("/"),
          __children: {},
        };
      }
      current = current[part].__children;
    });
  });
  return tree;
};

// contents of folder into buttons
const FolderView = ({ node, onNavigate, onExpand, depth = 0 }) =>
  Object.entries(node).map(([key, child], i, arr) => {
    const hasChildren = Object.keys(child.__children).length > 0;
    const handlePress = () =>
      hasChildren ? onExpand(key, child) : onNavigate(child.__path);
    return (
      <View
        key={child.__path}
        style={{
          paddingLeft: depth * 20,
          marginBottom: i !== arr.length - 1 ? 10 : 0,
        }}
      >
        <DescriptiveButton
          icon={iconMap[key] || "folder"}
          label={key}
          onPress={handlePress}
          showChevron={false}
          variant="drawer"
        />
      </View>
    );
  });

// top + bottom drawer sections
const Section = ({ tree, current, onNavigate, onExpand, style }) =>
  tree ? (
    <View style={style}>
      <FolderView
        node={current ?? tree}
        onNavigate={onNavigate}
        onExpand={onExpand}
      />
    </View>
  ) : null;

// badly named static section of drawer (the bottom one)
const OtherSection = ({ onNavigate }) => (
  <>
    <Divider style={{ marginVertical: 10, backgroundColor: "white" }} />
    {["collaboration", "settings"].map((key) => (
      <View
        key={key}
        style={{ marginBottom: key === "collaboration" ? 10 : 0 }}
      >
        <DescriptiveButton
          icon={iconMap[key]}
          label={key}
          onPress={() => onNavigate(`${key}/${key}`)}
          showChevron={false}
          variant="drawer"
        />
      </View>
    ))}
  </>
);

// drawer component
export function CustomDrawer(props) {
  const routes = props.state.routes;
  const navigation = props.navigation;

  // build tree from routes
  const fullTree = useMemo(() => buildTreeFromRoutes(routes), [routes]);

  // state 4 breadcrumbs and main + module sections
  const [mainState, setMainState] = useState({
    current: null,
    breadcrumbs: [],
  });
  const [moduleState, setModuleState] = useState({
    current: null,
    breadcrumbs: [],
  });

  // close drawer
  const onNavigate = (path) => {
    navigation.navigate(path);
    navigation.closeDrawer();
  };

  // expands folder, add to breadcrumbs, set current node
  const handleExpand = (state, setState) => (key, node) =>
    setState((prev) => ({
      breadcrumbs: [...prev.breadcrumbs, key],
      current: node.__children,
    }));

  // navigate up 1 level
  const handleBack = (breadcrumbs, setState, baseTree) => {
    const newBreadcrumbs = [...breadcrumbs];
    newBreadcrumbs.pop();
    let node = baseTree;
    newBreadcrumbs.forEach((key) => {
      node = node[key].__children;
    });
    setState({
      breadcrumbs: newBreadcrumbs,
      current: newBreadcrumbs.length ? node : null,
    });
  };

  // split tree into modules + main section
  const modulesTree = fullTree["modules"]?.__children ?? null;
  const mainTree = { ...fullTree };
  delete mainTree["modules"];
  delete mainTree["collaboration"];
  delete mainTree["settings"];

  const hasOther = fullTree["collaboration"] || fullTree["settings"];
  const insideMain = mainState.breadcrumbs.length > 0;
  const insideModules = moduleState.breadcrumbs.length > 0;

  const insideFolder = insideMain || insideModules;

  return (
    <View style={{ flex: 1, backgroundColor: "#1D4364", paddingTop: 44 }}>
      {/* header (back + menu button) */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
        }}
      >
        <TouchableOpacity
          onPress={() =>
            insideModules
              ? handleBack(moduleState.breadcrumbs, setModuleState, modulesTree)
              : insideMain
              ? handleBack(mainState.breadcrumbs, setMainState, mainTree)
              : navigation.closeDrawer()
          }
          style={{
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Icon
            source={insideFolder ? "arrow-left" : "menu-open"}
            color="white"
            size={20}
          />
        </TouchableOpacity>
        <View style={{ width: 50 }} />
      </View>

      {/* scrollable section */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-start",
          paddingHorizontal: 12,
          paddingTop: 0,
        }}
      >
        {/* main section not visible inside modules */}
        {!insideModules && (
          <>
            <Section
              tree={mainTree}
              current={mainState.current}
              onNavigate={onNavigate}
              onExpand={handleExpand(mainState, setMainState)}
              style={{ marginTop: 40 }}
            />
            <Divider style={{ marginVertical: 10, backgroundColor: "white" }} />
          </>
        )}
        {/* modules section */}
        <Section
          tree={modulesTree}
          current={moduleState.current}
          onNavigate={onNavigate}
          onExpand={handleExpand(moduleState, setModuleState)}
          style={insideModules ? { marginTop: 40 } : undefined}
        />
      </DrawerContentScrollView>

      {/* fixed section */}
      {hasOther && (
        <View
          style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 56 }}
        >
          <OtherSection onNavigate={onNavigate} />
        </View>
      )}
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerHideStatusBarOnOpen: true,
        drawerStyle: {},
      }}
    />
  );
}
