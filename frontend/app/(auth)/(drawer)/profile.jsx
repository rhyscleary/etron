import { View, ScrollView } from "react-native";
import { useState, useCallback, useMemo } from "react";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import StackLayout from "../../../components/layout/StackLayout";
import DescriptiveButton from "../../../components/common/buttons/DescriptiveButton";
import { useTheme, Avatar, List, Divider, TextInput, Button, HelperText } from "react-native-paper";
import CustomBottomSheet from "../../../components/BottomSheet/bottom-sheet";

const Profile = () => {
    const theme = useTheme();
    const [showSheet, setShowSheet] = useState(false); // standard bottom sheet (existing example)
    const [showCompactSheet, setShowCompactSheet] = useState(false); // compact bottom sheet (existing example)
    // NEW EXAMPLE SHEETS
    const [showProfileActionsSheet, setShowProfileActionsSheet] = useState(false); // custom header + search + icons
    const [showQuickIconSheet, setShowQuickIconSheet] = useState(false); // compact style with custom renderItem (icon grid style list)
    const [showQuickNoteSheet, setShowQuickNoteSheet] = useState(false); // NEW: custom content (no list) example

    // quick note form state
    const [noteTitle, setNoteTitle] = useState("");
    const [noteBody, setNoteBody] = useState("");

    // Example data for new sheets
    const profileActionItems = useMemo(() => ([
        { icon: 'account-edit', label: 'Account Details', onPress: () => router.navigate('/settings/account/account') },
        { icon: 'image-edit', label: 'Personal Details', onPress: () => router.navigate('/settings/account/personal-details') },
        { icon: 'bell-ring', label: 'Notification Settings', onPress: () => router.navigate('/modules/day-book/notifications/notifications') },
        { icon: 'shield-account', label: 'Password & Security', onPress: () => router.navigate('/settings/account/password-security') },
        { icon: 'logout-variant', label: 'Sign Out', onPress: () => { /* does nothing */ } },
    ]), [router]);

    const quickIconActions = useMemo(() => ([
        { icon: 'plus-box', label: 'New Entry', onPress: () => router.navigate('/modules/day-book/data-management/new-entry') },
        { icon: 'chart-timeline-variant', label: 'View Metrics', onPress: () => router.navigate('/modules/day-book/metrics/metric-management') },
        { icon: 'file-chart', label: 'Reports', onPress: () => router.navigate('/modules/day-book/reports/report-management') },
        { icon: 'bell', label: 'Alerts', onPress: () => router.navigate('/modules/day-book/notifications/notifications') },
        { icon: 'account-multiple-plus', label: 'Invite User', onPress: () => router.navigate('/collaboration/collaboration') },
    ]), [router]);

    const settingOptionButtons = [
        { icon: "cog", label: "Settings", onPress: () => router.navigate("/settings/settings")},
        { icon: "database", label: "Data Sources", onPress: () => router.navigate("/modules/day-book/data-management/data-management") },
        { icon: "chart-line", label: "Metrics", onPress: () => router.navigate("/modules/day-book/metrics/metric-management") },
        { icon: "bell", label: "Notifications", onPress: () => router.navigate("/modules/day-book/notifications/notifications") },
        { icon: "account-group", label: "Collaboration", onPress: () => router.navigate("/collaboration/collaboration") },
        { icon: "poll", label: "Testing - Example Graph Display", onPress: () => router.navigate("/graphs") },
        { icon: "file-chart", label: "Reports", onPress:() => router.navigate("/modules/day-book/reports/report-management") },
        // Testing Bottom Screen
        { icon: "tray-arrow-up", label: "Testing - Example Bottom Sheet", onPress: () => { setShowSheet(true); setShowCompactSheet(false);} }, // standard style
        { icon: "view-compact", label: "Testing - Compact Bottom Sheet", onPress: () => { setShowCompactSheet(true); setShowSheet(false);} }, // compact style
        { icon: "account-box", label: "Testing - Profile Actions Sheet", onPress: () => { setShowProfileActionsSheet(true); } },
        { icon: "flash", label: "Testing - Quick Icon Actions Sheet", onPress: () => { setShowQuickIconSheet(true); } },
        { icon: "note-plus", label: "Testing - Quick Note Sheet (Custom)", onPress: () => { 
            // close others to avoid multiple mounted sheets
            setShowSheet(false);
            setShowCompactSheet(false);
            setShowProfileActionsSheet(false);
            setShowQuickIconSheet(false);
            setShowQuickNoteSheet(true); 
        } },
    ];
    // custom content for quick note sheet with no list rendering
    const quickNoteContent = (
        <View style={{ flex: 1 }}>
            <TextInput
                mode="outlined"
                label="Title"
                value={noteTitle}
                onChangeText={setNoteTitle}
                style={{ marginBottom: 12 }}
            />
            <TextInput
                mode="outlined"
                label="Details"
                value={noteBody}
                onChangeText={setNoteBody}
                multiline
                numberOfLines={5}
                style={{ marginBottom: 8 }}
            />
            <HelperText type={noteTitle.length ? "info" : "error"} visible>
                {noteTitle.length ? `${noteTitle.length} chars in title` : 'Title is recommended'}
            </HelperText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button onPress={() => { setShowQuickNoteSheet(false); setNoteTitle(''); setNoteBody(''); }} style={{ marginRight: 8 }}>Cancel</Button>
                <Button
                    mode="contained"
                    disabled={!noteTitle.trim() && !noteBody.trim()}
                    onPress={() => {
                        // does nothing
                        setShowQuickNoteSheet(false);
                        setNoteTitle('');
                        setNoteBody('');
                    }}
                >
                    Save
                </Button>
            </View>
        </View>
    );

    // custom renderers for new sheets
    const renderProfileActionItem = useCallback(({ item }) => (
        <List.Item
            title={item.label}
            left={(props) => <List.Icon {...props} icon={item.icon} />}
            onPress={() => { setShowProfileActionsSheet(false); item.onPress?.(); }}
        />
    ), []);

    const renderQuickIconItem = useCallback(({ item }) => (
        <List.Item
            title={item.label}
            left={(props) => <List.Icon {...props} icon={item.icon} />}
            style={{ paddingVertical: 4 }}
            onPress={() => { setShowQuickIconSheet(false); item.onPress?.(); }}
        />
    ), []);

    const profileHeaderChildren = (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar.Text size={36} label="ON" style={{ marginRight: 12 }} />
            <View>
                <List.Subheader style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 }}>Onion</List.Subheader>
            </View>
        </View>
    );
    
    return (
        <View style={commonStyles.screen}>
            <Header title="Dashboard" showMenu />            
            <ScrollView style={{backgroundColor: theme.colors.background}} contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
                    {settingOptionButtons.map((item) => (
                        <DescriptiveButton 
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            onPress={item.onPress}
                        />
                ))}
                </StackLayout>
            </ScrollView>
            {showSheet && (
                <CustomBottomSheet
                    variant="standard"
                    title="Quick Actions"
                    headerActionLabel="Edit"
                    onHeaderActionPress={() => {/* does nothing */}}
                    showClose={false}
                    closeIcon="close"
                    handleSolidBackground={true}
                    enableSearch={true}
                    footerVariant="minimal"
                    footerPlacement="right"
                    onChange={(index) => {
                        if (index === -1) setShowSheet(false);
                    }}
                    onClose={() => setShowSheet(false)}
                    data={settingOptionButtons.filter((b) => !b.label.includes("Testing - Example Bottom Sheet"))}
                    keyExtractor={(item) => item.label}
                    itemTitleExtractor={(item) => item.label}
                    onItemPress={(item) => {
                        setShowSheet(false);
                        if (typeof item.onPress === 'function') item.onPress();
                    }}
                />
            )}
            {showCompactSheet && (
                <CustomBottomSheet
                    variant="compact"
                    title="Quick Actions"
                    closeIcon="close"
                    handleSolidBackground={true}
                    footerVariant="translucent"
                    onChange={(index) => {
                        if (index === -1) setShowCompactSheet(false);
                    }}
                    onClose={() => setShowCompactSheet(false)}
                    data={settingOptionButtons.filter((b) => !b.label.includes("Testing - Compact Bottom Sheet"))}
                    keyExtractor={(item) => item.label}
                    itemTitleExtractor={(item) => item.label}
                    onItemPress={(item) => {
                        setShowCompactSheet(false);
                        if (typeof item.onPress === 'function') item.onPress();
                    }}
                />
            )}
           
            {showProfileActionsSheet && (
                <CustomBottomSheet
                    variant="standard"
                    title="Profile"
                    showClose={false}
                    headerChildren={profileHeaderChildren}
                    enableSearch
                    searchPlaceholder="Filter actions"
                    data={profileActionItems}
                    keyExtractor={(item) => item.label}
                    itemTitleExtractor={(item) => item.label}
                    renderItem={renderProfileActionItem}
                    onChange={(index) => { if (index === -1) setShowProfileActionsSheet(false); }}
                    onClose={() => setShowProfileActionsSheet(false)}
                />
            )}
            
            {showQuickIconSheet && (
                <CustomBottomSheet
                    variant="compact"
                    title="Actions"
                    footerVariant="minimal"
                    enableSearch={false}
                    data={quickIconActions}
                    keyExtractor={(item) => item.label}
                    itemTitleExtractor={(item) => item.label}
                    renderItem={renderQuickIconItem}
                    onChange={(index) => { if (index === -1) setShowQuickIconSheet(false); }}
                    onClose={() => setShowQuickIconSheet(false)}
                />
            )}
            
            {showQuickNoteSheet && (
                <CustomBottomSheet
                    variant="standard"
                    footerVariant="none"
                    title="Quick Note"
                    showClose
                    snapPoints={[320, 520]}
                    customContent={quickNoteContent}
                    onChange={(index) => { if (index === -1) setShowQuickNoteSheet(false); }}
                    onClose={() => setShowQuickNoteSheet(false)}
                />
            )}
        </View>
    )
}

export default Profile;