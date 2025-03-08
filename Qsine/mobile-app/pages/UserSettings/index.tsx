import React, {} from "react";
import { Text, TextInput, View } from "react-native";

import { KWBScreenWrapper, KWBTypography } from "@/components";

export default function UserSettings() {
    return (
        <KWBScreenWrapper headerText="User Settings">
            <KWBTypography>Allergens</KWBTypography>

            {/* Add Allergens */}
            <TextInput
                placeholder="Add Allergen"
            />

        </KWBScreenWrapper>
    )
}