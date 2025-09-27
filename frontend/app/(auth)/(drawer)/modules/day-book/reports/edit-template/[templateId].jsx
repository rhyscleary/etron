// Author(s): Matthew Page

import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Button, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import endpoints from "../../../../../../../utils/api/endpoints";

const TemplateView = () => {
    const { templateId } = useLocalSearchParams();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch single template
    const fetchTemplate = async () => {
        try {
            const response = await apiGet(endpoints.modules.day_book.reports.templates.getTemplate(templateId));
            if (!response.ok) {
                throw new Error("Failed to fetch template");
            }
            const data = await response.json();
            setTemplate(data);
        } catch (error) {
            console.error("Error fetching template:", error);
            Alert.alert("Error", "Failed to load template.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplate();
    }, [templateId]);

    const handleUseTemplate = () => {
        // Navigate to edit-report with prefilled template data
        router.push({
            pathname: "/reports/edit-report/new",
            params: {
                fromTemplateId: templateId,
            },
        });
    };

    if (loading) {
        return (
            <View style={commonStyles.screen}>
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            </View>
        );
    }

    if (!template) {
        return (
            <View style={commonStyles.screen}>
                <Text>Template not found.</Text>
            </View>
        );
    }

    return (
        <View style={commonStyles.screen}>
            <Header title={template.title || "Template"} showBack />

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{template.title}</Text>
                <Text style={styles.content}>{template.content}</Text>
            </ScrollView>

            <View style={styles.buttonWrapper}>
                <Button title="Use Template" onPress={handleUseTemplate} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12,
    },
    content: {
        fontSize: 16,
        lineHeight: 22,
    },
    buttonWrapper: {
        padding: 16,
    },
});

export default TemplateView;
