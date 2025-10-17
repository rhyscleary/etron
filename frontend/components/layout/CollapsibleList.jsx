import React, { useState } from 'react';
import { View } from 'react-native';
import { List, useTheme } from 'react-native-paper';

const CollapsibleList = ({ items = [], canCloseFormAccordion = true }) => {
  const theme = useTheme();

  const firstExpandedKey =
    items.find(item => item.defaultExpanded)?.key || (items[0] && items[0].key);
  const [expandedKey, setExpandedKey] = useState(firstExpandedKey);

  const handleAccordionToggle = (key) => {
    if (expandedKey === key) {
      if (key === 'form' && !canCloseFormAccordion) return;
      const otherItem = items.find(item => item.key !== key && !item.disabled);
      if (otherItem) {
        setExpandedKey(otherItem.key);
      } else {
        setExpandedKey(key);
      }
    } else {
      if (expandedKey === 'form' && !canCloseFormAccordion) return;
      setExpandedKey(key);
    }
  };

  return (
    <View>
      {items.map(({ key, title, description, icon, disabled, content }) => {
        const isDisabled = key !== 'form' && !canCloseFormAccordion;
        const lowOpacityColor = theme.colors.lowOpacityButton || theme.colors.backdrop;

        return (
          <View key={key} pointerEvents={isDisabled ? 'none' : 'auto'}>
            <List.Accordion
                title={title}
                description={description}
                left={(props) => (
                    <List.Icon
                    {...props}
                    icon={icon}
                    color={isDisabled ? theme.colors.onSurfaceDisabled : props.color}
                    />
                )}
                expanded={expandedKey === key}
                onPress={() => handleAccordionToggle(key)}
                style={{
                    backgroundColor: isDisabled
                    ? lowOpacityColor
                    : theme.colors.surface,
                    borderRadius: 4,
                }}
                titleStyle={{
                    color: theme.colors.onSurface,
                    opacity: isDisabled ? 0.4 : 1,
                }}
                descriptionStyle={{
                    color: theme.colors.onSurfaceVariant,
                    opacity: isDisabled ? 0.4 : 1,
                }}
                >
                  {content}
                </List.Accordion>
          </View>
        );
      })}
    </View>
  );
};

export default CollapsibleList;
