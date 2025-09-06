// Author(s): Matthew Page

import { View, Text } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import SearchBar from "../../../../../../components/common/input/SearchBar";

const ExportMetric = () => {
    const handleSearch = (query) => {
        console.log("Searching metrics for:", query);
    };

    const handleFilterChange = (filter) => {
        console.log("Metrics filter changed to:", filter);
    };

    return (
        <View style={commonStyles.screen}>
            <Header title="Select Metric" showBack />

            <SearchBar
                placeholder="Search..."
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                //filterOptions={["All","Final","Draft","Archived"]}
            />

            {/* temp list location */}
            <Text style={{ margin: 20 }}>Metric #1</Text>

        </View>
    );
};

export default ExportMetric;
