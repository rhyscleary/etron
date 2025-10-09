// Author(s): Rhys Cleary

import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import BasicDialog from "../../../../../components/overlays/BasicDialog";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import SearchBar from "../../../../../components/common/input/SearchBar";
import ListCard from "../../../../../components/cards/listCard";
import { apiGet, apiPost } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import { Text } from "react-native-paper";
import { hasPermission } from "../../../../../utils/permissions";
import { FlashList } from "@shopify/flash-list";
import PlaceholderBoard from "../../../../../components/skeleton/PlaceholderBoard";

const AddModules = ({ availableFilters = ['All', 'Financial', 'Employees', 'Marketing']}) => {
    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [installDialogVisible, setInstallDialogVisible] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);

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
            const response = await apiGet(
                endpoints.workspace.modules.getUninstalledModules(id)
            );
            console.log(response);

            setModules((response || []).sort((a, b) => a.name.localeCompare(b.name)));
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

    const handleModuleInstallation = async () => {
        console.log("Installing module:", selectedModule?.key);
        try {
            // call api
            await apiPost(endpoints.workspace.modules.install(workspaceId, selectedModule.key));

            // if successful remove form the list
            setModules((previous) => previous.filter((module) => module.key !== selectedModule.key));

            // background refetch
            await fetchModules(workspaceId);
        } catch (error) {
            console.error("Failed to install module:", error);
            // show toast
        } finally {
            setInstallDialogVisible(false);
            setSelectedModule(null);
        }
    };

    const renderModules = ({item}) => (
        <ListCard
            title={item.name}
            content={item.description}
            leftElement={item.icon || "puzzle"}
            rightIcon="download"
            onPress={() => {
                setSelectedModule(item);
                setInstallDialogVisible(true);
            }}
            cardStyle={item.cardColor ? { backgroundColor: item.cardColor } : undefined }
            titleStyle={item.fontColor ? { color: item.fontColor } : undefined }
        />
    );
    
    return (
		<ResponsiveScreen
			header={<Header title="Add Modules" showBack />}
			center={false}
			padded={false}
            scroll={false}
		> 
            
            <View style={styles.contentContainer}>
                {/* Search bar and filter */}
                <SearchBar 
                    placeholder="Search modules"
                    onSearch={setSearchQuery}
                    onFilterChange={setSelectedFilter}
                    filters={availableFilters}
                />

                <View style={styles.listContainer}>
                    <FlashList
                        data={loading ? Array.from({ length: 5 }) : filteredModules}
                        renderItem={loading ? () => <PlaceholderBoard size="small" /> : renderModules}
                        keyExtractor={(item, index) => loading ? `placeholder-${index}` : item.key}
                        estimatedItemSize={100}
                        drawDistance={1}
                        ItemSeparatorComponent={() => <View style={{height: 20}} />}
                        onRefresh={async () => {
                            setLoading(true);
                            await fetchModules(workspaceId);
                        }}
                        ListEmptyComponent={
                            !loading ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No Modules Available</Text>
                                </View>
                            ) : null
                        }
                    />
                </View>
            </View>
            
            <BasicDialog
                visible={installDialogVisible}
                message={`Install the ${selectedModule?.name || "selected"} module?`}
                leftActionLabel="Cancel"
                handleLeftAction={() => {
                    setInstallDialogVisible(false);
                    setSelectedModule(null);
                }}
                rightActionLabel="Install"
                handleRightAction={handleModuleInstallation}
            />
        </ResponsiveScreen>
    )
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
        position: "relative",
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

export default AddModules;