import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import { Menu, Text, useTheme } from "react-native-paper";

const PermissionGate = ({
	allowed,
	children,
	onAllowed,
	message = "You don't have permission to do this.",
	duration = 3000,
	dimOpacity = 0.6, 
	dimWhenBlocked = true,
	menuProps,
	contentStyle,
	textStyle,
}) => {
	const theme = useTheme();
	const [visible, setVisible] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

	const child = Children.only(children);
	const originalOnPress = child.props?.onPress;

	const handlePress = async (...args) => {
		if (!allowed) {
			setVisible(true);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => {
				setVisible(false);
				timeoutRef.current = null;
			}, duration);
			return;
		}
		if (onAllowed) return await onAllowed(...args);
		if (originalOnPress) return await originalOnPress(...args);
	};

	const wrapperStyle = dimWhenBlocked ? { opacity: allowed ? 1 : dimOpacity } : undefined;

	const renderedChild = useMemo(() => {
		const extraProps = {};
    	if ("disabled" in (child.props ?? {})) extraProps.disabled = !allowed;

    	return cloneElement(child, { ...extraProps });
	}, [child, allowed]);

	const anchor = (
		<Pressable
			onPress={handlePress}
			style={wrapperStyle}
			collapsable={false}
			onStartShouldSetResponder={() => true}
		>
			<View pointerEvents="none">{renderedChild}</View>
		</Pressable>
  );

	return (
		<Menu
			visible={visible}
			onDismiss={() => {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}
				setVisible(false);
			}}
			anchor={anchor}
			contentStyle={{
				paddingVertical: 6,
				paddingHorizontal: 10,
				borderRadius: 8,
				...(contentStyle || {}),
			}}
			{...menuProps}
		>
			<Text
				style={{
					color: theme.colors.onSurface,
					maxWidth: 240,
					lineHeight: 18,
					...(textStyle || {}),
				}}
			>
				{message}
			</Text>
		</Menu>
	);
};

export default PermissionGate;