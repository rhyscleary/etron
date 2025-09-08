// Author(s): Matthew Page

import { useState, useEffect } from "react";
import { View, Text, Button, FlatList, Alert, ActivityIndicator } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import SearchBar from "../../../../../../components/common/input/SearchBar";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import endpoints from "../../../../../../utils/api/endpoints";

// Hardcoded token for testing
const TEST_TOKEN = `eyJraWQiOiJLNytiMXNGOXhwXC9PTytSVTRGYm5XNWlQM2RkSmdranUrVVBjUkJHUFE4ND0iLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiSFZEU3ZoNkh4REc4MHd5bk13NVMtQSIsInN1YiI6IjY5M2U5NGU4LTYwMzEtNzBiYy0yMzFhLTE2OWVlMDExNGMzNCIsImNvZ25pdG86Z3JvdXBzIjpbImFwLXNvdXRoZWFzdC0yX1E0RWdhUVM4Nl9Hb29nbGUiXSwiZW1haWxfdmVyaWZpZWQiOnRydWUsImN1c3RvbTpoYXNfd29ya3NwYWNlIjoidHJ1ZSIsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMl9RNEVnYVFTODYiLCJjb2duaXRvOnVzZXJuYW1lIjoiZ29vZ2xlXzEwNDYwMzMxOTkwMjYzMjc5MTkxNiIsImdpdmVuX25hbWUiOiJNYXR0YmlsbHBhZ2UiLCJub25jZSI6Il9SbVNvb1RMMUpibXNybmVOci1YY2kyYnItdG5GSkpwcjgyWDcyaUJ1RF94VUVvQ1lXLUJISXlNVWVvYmNxcVo4SjF5NFJNOUNLVXVGNURVNDE1THQzQlNacldBMjRNZEZSRHZfUDVqSkVkUmptNC1fQzl4dGp4UmhQUzJTbC1QcGZSZE85aFMxQUZhOTVvZDllVkJxbmNZZzMwQ2JiR1dldVRFVEZicjdFVSIsIm9yaWdpbl9qdGkiOiI2NTNhNTA3Yi05NmY4LTQzZDctYWQ4ZS00MDNkYzcxYTUzODgiLCJhdWQiOiJub3IwajJza2pvbHIyM3FrYnQyZmVodWhwIiwiaWRlbnRpdGllcyI6W3siZGF0ZUNyZWF0ZWQiOiIxNzU2MTAwOTkzNzAyIiwidXNlcklkIjoiMTA0NjAzMzE5OTAyNjMyNzkxOTE2IiwicHJvdmlkZXJOYW1lIjoiR29vZ2xlIiwicHJvdmlkZXJUeXBlIjoiR29vZ2xlIiwiaXNzdWVyIjpudWxsLCJwcmltYXJ5IjoidHJ1ZSJ9XSwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NTczNzQ2NjksImV4cCI6MTc1NzM3ODI2OSwiaWF0IjoxNzU3Mzc0NjY5LCJmYW1pbHlfbmFtZSI6IlBhZ2UiLCJqdGkiOiIxZTQ1ZjYyYS1jYjNmLTQ0YTAtOThmNC0yZDk1ZTAxNTc1YWMiLCJlbWFpbCI6Im15bWF0dGJpbGxAZ21haWwuY29tIn0.OT7tFi_K53DUIS3T40__C0iZENDO8HWK9SsJ4t8DnkFgK5QqoIRWwXXVSzZXw6vqX-a_BTPxr8zLONpD05_xzSg5zXEVplKTL2mDxzyDiyWB9F-4XmdkTk29F5qQdI7p2s9pox1smao3cPgml4NajzKxN_VuWB8qKw51ZIso30GW-Tvn3FqetcqrW4v2GDbqVcIuWu25RQ4MULsHjpJH0c-WIHBmXtJXRloN31h0ZLCTCCHaMYWNL-oG0jxl1p34V7NWq3mjFNIp1qswAEfnBtvdjVSL2ldIb7dLBTf_2w1XdD-sazUBMFKFCvVLzgJ2hkg990W7ax3y6qACfLZNbQ`;

const Reports = () => {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch workspace ID from storage
  const fetchWorkspaceId = async () => {
    try {
      const id = await getWorkspaceId();
      setWorkspaceId(id);
    } catch (error) {
      console.error("Error fetching workspace ID:", error);
      Alert.alert("Error", "Failed to fetch workspace ID");
      setLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const response = await fetch(endpoints.modules.day_book.reports.getDrafts(workspaceId), {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch reports: ${response.status}`);

      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error("Fetch error:", err);
      Alert.alert("Error", "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  // Create a test report
  const createTestReport = async () => {
    if (!workspaceId) return;
    try {
      const response = await fetch(endpoints.modules.day_book.reports.createDraft, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          workspaceId,
          name: "My Report 1",
        }),
      });

      const contentType = response.headers.get("content-type");
      const text = await response.text();
      console.log("Create report response:", text);

      if (!response.ok) {
        throw new Error(`Failed to create report: ${response.status} ${text}`);
      }

      let newReport = {};
      if (contentType && contentType.includes("application/json")) {
        newReport = JSON.parse(text);
      }

      Alert.alert(
        "Success",
        `Report created: ${newReport.draftId || newReport.name || "Unknown"}`
      );

      fetchReports();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message);
    }
  };

  useEffect(() => {
    fetchWorkspaceId();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      fetchReports();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <View style={commonStyles.screen}>
        <Header title="Reports" showBack />
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={commonStyles.screen}>
      <Header title="Reports" showBack />

      <SearchBar
        placeholder="Search..."
        onSearch={(q) => console.log("Searching reports for:", q)}
        onFilterChange={(f) => console.log("Reports filter changed to:", f)}
        filterOptions={["All", "Final", "Draft", "Archived"]}
      />

      <Button title="Create Test Report" onPress={createTestReport} />

      <FlatList
        data={reports}
        keyExtractor={(item) => item.draftId.toString()}
        renderItem={({ item }) => (
          <View style={{ margin: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
            <Text>
              Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
            </Text>
            <Text>
              Last Edited: {item.lastEdited ? new Date(item.lastEdited).toLocaleString() : "N/A"}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default Reports;
