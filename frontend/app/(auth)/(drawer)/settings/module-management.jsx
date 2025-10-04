// Author(s): Rhys Cleary

import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import Header from "../../../../components/layout/Header";
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import BasicDialog from "../../../../components/overlays/BasicDialog";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";
import SearchBar from "../../../../components/common/input/SearchBar";
import ListCard from "../../../../components/cards/listCard";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import { Text } from "react-native-paper";
import { hasPermission } from "../../../../utils/permissions";
import CustomBottomSheet from "../../../../components/BottomSheet/bottom-sheet";

const ModuleManagement = ({ availableFilters = ['All', 'Financial', 'Employees', 'Marketing']}) => {
    const [loading, setLoading] = useState(false);
    const [modules, setModules] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [unInstallDialogVisible, setUninstallDialogVisible] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [showModuleActionsSheet, setShowModuleActionsSheet] = useState(false);

    useEffect(() => {
        const init = async () => {
            const id = await getWorkspaceId();

            // check permissions to view this screen
            const allowed = await hasPermission("app.workspace.manage_modules");
            if (!allowed) {
                router.back(); // navigate the user off the screen
                return;
            }
            
            setWorkspaceId(id);

            if (id) {
                await fetchModules(id);
            }
        };
        init();
    }, []);

    const fetchModules = async (id) => {
        if (!id) return;

        try {
            setLoading(true);

            const response = await apiGet(
                endpoints.workspace.modules.getInstalledModules(id)
            );

            console.log(response);

            setModules(response || []);
        } catch (error) {
            console.error("Error fetching modules:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredModules = useMemo(() => {
        return modules.filter((module) => {
            const matchesFilter =
                selectedFilter === "All" || (module.categories || []).includes(selectedFilter);

            const matchesSearch = 
                module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (module.keywords || []).some((key) =>
                    key.toLowerCase().includes(searchQuery.toLowerCase())
                );
            
            return matchesFilter && matchesSearch;
        });
    }, [searchQuery, selectedFilter, modules]);

    const handleModuleUnInstall = async () => {
        console.log("Uninstalling module:", selectedModule?.key);
        try {
            // call api
            await apiDelete(endpoints.workspace.modules.uninstall(workspaceId, selectedModule.key));

            // if successful remove form the list
            setModules((previous) => previous.filter((module) => module.key !== selectedModule.key));

            // background refetch
            await fetchModules(workspaceId);
        } catch (error) {
            console.error("Failed to uninstall module:", error);
            // show toast
        } finally {
            setUninstallDialogVisible(false);
            setSelectedModule(null);
        }
    };

    const handleModuleToggle = async () => {
        console.log("Toggling module:", selectedModule?.key);
        try {
            // call api
            await apiPut(endpoints.workspace.modules.toggle(workspaceId, selectedModule.key));

            // background refetch
            await fetchModules(workspaceId);
        } catch (error) {
            console.error("Failed to toggle module:", error);
            // show toast
        } finally {
            setSelectedModule(null);
        }
    };

    const renderModules = ({item}) => (
        <ListCard
            title={item.name}
            content={item.description}
            leftElement={item.icon || "puzzle"}
            rightIcon="dots-horizontal"
            onRightPress={() => {
                setSelectedModule(item);
                setShowModuleActionsSheet(true);
            }}
            cardStyle={item.cardColor ? { backgroundColor: item.cardColor } : undefined }
            titleStyle={item.fontColor ? { color: item.fontColor } : undefined }
        />
    );

    const moduleActionItems = useMemo(() => {
        if (!selectedModule) return [];

        return [
            {
                icon: selectedModule.enabled ? "toggle-switch-off" : "toggle-switch",
                label: selectedModule.enabled ? "Disable" : "Enable",
                onPress: async () => {
                    setShowModuleActionsSheet(false);
                    await handleModuleToggle();
                },
            },
            {
                icon: "trash-can-outline",
                label: "Uninstall",
                onPress: () => {
                    setShowModuleActionsSheet(false);
                    setUninstallDialogVisible(true);
                },
            },
        ];
    }, [selectedModule]);

    console.log(selectedModule, moduleActionItems)
    
    return (
		<ResponsiveScreen
			header={<Header title="Modules" showBack showPlus onRightIconPress={() => router.navigate("/settings/add-modules")} />}
			center={false}
			padded={false}
            scroll={false}
		> 
            
            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                        <Text>Loading Modules...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredModules}
                        renderItem={renderModules}
                        keyExtractor={item => item.key}
                        ItemSeparatorComponent={() => <View style={{height: 20}} />}
                        refreshing={loading}
                        onRefresh={() => fetchModules(workspaceId)}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No Modules Installed</Text>
                            </View>
                        )}
                        ListHeaderComponent={
                            <SearchBar 
                                placeholder="Search modules"
                                onSearch={setSearchQuery}
                                onFilterChange={setSelectedFilter}
                                filters={availableFilters}
                            />
                        }
                    />
                )}
            </View>

            <BasicDialog
                visible={unInstallDialogVisible}
                message={`Uninstall the ${selectedModule?.name || "selected"} module? All module data will be deleted, this can not be undone`}
                leftActionLabel="Cancel"
                handleLeftAction={() => {
                    setUninstallDialogVisible(false);
                    setSelectedModule(null);
                }}
                rightActionLabel="Uninstall"
                rightDanger={true}
                handleRightAction={handleModuleUnInstall}
            />

            {showModuleActionsSheet && selectedModule && (
                <CustomBottomSheet
                    variant="standard"
                    title={selectedModule.name}
                    showClose
                    data={moduleActionItems}
                    keyExtractor={(item) => item.label}
                    itemTitleExtractor={(item) => item.label}
                    onItemPress={(item) => item.onPress?.()}
                    onChange={(index) => { if (index === -1) setShowModuleActionsSheet(false); }}
                    onClose={() => setShowModuleActionsSheet(false)}
                />
            )}
        </ResponsiveScreen>
    )
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
    }
})

export default ModuleManagement;