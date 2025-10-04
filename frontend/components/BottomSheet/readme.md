# Custom Bottom Sheet Usage
/* TODO:
- allow typing in custom content
- fix bottom search bar
- allow smaller focus view for custom content
- test haptics
*/
`@gorhom/bottom-sheet` + Reanimated + Paper theme. Use `CustomBottomSheet`.

> ℹ️ **Dynamic sizing** is enabled by default. The wrapper renders the Gorhom pre-configured primitives (`BottomSheetView`, `BottomSheetVirtualizedList`) so content height is measured automatically. Provide `maxDynamicContentSize` when you need to cap the expanded height, or disable the feature with `enableDynamicSizing={false}`.

## Import

```jsx
import CustomBottomSheet from '../components/BottomSheet';
// or
import { BottomSheet } from '../components/BottomSheet';
```

## Examples

### 1. Basic List with Search
```jsx
const items = [
  { id: 'acct', label: 'Account' },
  { id: 'notif', label: 'Notifications' },
];

<CustomBottomSheet
  header={{ title: "Settings" }}
  search={{ enabled: true }}
  data={items}
  onItemPress={(row) => console.log('tap', row)}
  onClose={() => setOpen(false)}
/>
```

### 2. Custom Header with Actions
```jsx
<CustomBottomSheet
  header={{
    title: "Quick Actions",
    actionLabel: "Edit",
    onActionPress: () => handleEdit(),
    showClose: false,
    solidBackground: true,
  }}
  search={{ enabled: true }}
  footer={{ variant: "minimal", placement: "right" }}
  data={items}
  onItemPress={(item) => item.onPress?.()}
  onClose={() => setOpen(false)}
/>
```

### 3. Custom Text Color
```jsx
<CustomBottomSheet
  header={{
    title: "Styled Sheet",
    textColor: "#FF6B6B", // Custom red color for title and list items
  }}
  data={items}
  onClose={() => setOpen(false)}
/>
```
  onClose={() => setOpen(false)}
/>
```

### 3. Custom Content (Form)
```jsx
<CustomBottomSheet
  header={{ title: "Quick Note", showClose: true }}
  footer={{ variant: "none" }}
  customContent={(
    <View style={{ flex: 1 }}>
      <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" />
      <TextInput label="Details" value={body} onChangeText={setBody} mode="outlined" multiline />
      <Button onPress={saveNote} disabled={!title && !body} mode="contained">Save</Button>
    </View>
  )}
  maxDynamicContentSize={480}
  onClose={() => setShow(false)}
/>
```

### 4. Compact Variant
```jsx
<CustomBottomSheet
  variant="compact"
  header={{ title: "Quick Actions" }}
  footer={{ variant: "translucent" }}
  data={actions}
  onClose={() => setOpen(false)}
/>
```

### 5. Search in Footer
```jsx
<CustomBottomSheet
  header={{ title: "Search Demo" }}
  search={{ 
    enabled: true, 
    position: "bottom",
    placeholder: "Filter items..."
  }}
  data={items}
  onItemPress={(item) => handleSelect(item)}
  onClose={() => setOpen(false)}
/>
```

### 6. Imperative Control (Ref)
```jsx
const sheetRef = useRef(null);

<CustomBottomSheet 
  ref={sheetRef} 
  header={{ title: "Numbers" }}
  data={[1,2,3]} 
  onClose={() => setOpen(false)} 
/>

// Programmatically control the sheet
sheetRef.current?.expand();
sheetRef.current?.collapse();
sheetRef.current?.close();
sheetRef.current?.snapToIndex(1);
```

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onChange` | `(index: number) => void` | `undefined` | Called when snap index changes. |
| `onClose` | `() => void` | `undefined` | Called on close / backdrop tap. |
| `variant` | `'standard' \| 'compact'` | `'standard'` | Compact moves title into handle. |
| `snapPoints` | `(number \| string)[]` | `['30%', '80%']` | Base snap points. |
| `initialIndex` | `number` | last index | Starting snap index. |
| `enableDynamicSizing` | `boolean` | `true` | Enables Gorhom's dynamic sizing. |
| `maxDynamicContentSize` | `number` | 80% of window | Caps dynamic sizing height. |
| `containerStyle` | `StyleProp<ViewStyle>` | `undefined` | Override container styles. |

### Header Configuration

Pass as `header={{ ... }}` object:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string \| ReactNode` | `undefined` | Header title (standard) or handle text (compact). |
| `component` | `ReactNode` | `undefined` | Full custom header (overrides internal). |
| `actionLabel` | `string` | `undefined` | Right action button label. |
| `onActionPress` | `() => void` | `undefined` | Handler for header action button. |
| `showClose` | `boolean` | `true` | Show close icon. |
| `closeIcon` | `string` | `'close'` | Icon name for close button. |
| `solidBackground` | `boolean` | `false` | Force solid handle background. |
| `children` | `ReactNode` | `undefined` | Extra inline header elements. |
| `textColor` | `string` | `undefined` | Custom text color for title and list items. Accepts any valid color string (e.g., `'#FF0000'`, `'rgb(255,0,0)'`, `'red'`). |

### Search Configuration

Pass as `search={{ ... }}` object:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable client-side search. |
| `placeholder` | `string` | `'Search'` | Search input placeholder. |
| `position` | `'top' \| 'bottom'` | `'top'` | Where to show search (header or footer). |
| `autoExpandOnFocus` | `boolean` | `true` | Expand to max on search focus. |
| `autoExpandOnKeyboard` | `boolean` | `true` | Expand when keyboard opens. |

### Footer Configuration

Pass as `footer={{ ... }}` object:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'translucent' \| 'minimal' \| 'none'` | `'default'` | Footer style or hide. |
| `placement` | `'left' \| 'center' \| 'right'` | `'right'` | Footer horizontal position. |

### List Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `any[]` | `[1,2,3]` | List data (ignored if `customContent`). |
| `renderItem` | `({item,index}) => ReactNode` | internal row | Custom list row renderer. |
| `keyExtractor` | `(item,index) => string` | item.id / index | Virtualized list key extractor. |
| `getItem` | `(data,index) => any` | `(arr,i) => arr[i]` | Override VirtualizedList getItem. |
| `getItemCount` | `(data) => number` | `arr.length` | Override VirtualizedList getItemCount. |
| `onItemPress` | `(item,index) => void` | `undefined` | Default row press callback. |
| `itemTitleExtractor` | `(item,index) => string` | heuristic | Derive label for default row + search. |
| `emptyComponent` | `ReactNode` | `undefined` | Shown when list is empty. |

### Custom Content

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `customContent` | `ReactNode` | `undefined` | Custom body; bypasses list rendering. |

## Migration Guide

The component now uses grouped configuration objects for better organization:

**Before:**
```jsx
<CustomBottomSheet
  title="Settings"
  showClose={false}
  closeIcon="close"
  handleSolidBackground={true}
  enableSearch={true}
  searchPlaceholder="Search..."
  footerVariant="minimal"
  footerPlacement="right"
/>
```

**After:**
```jsx
<CustomBottomSheet
  header={{
    title: "Settings",
    showClose: false,
    closeIcon: "close",
    solidBackground: true,
  }}
  search={{
    enabled: true,
    placeholder: "Search...",
  }}
  footer={{
    variant: "minimal",
    placement: "right",
  }}
/>
```

## Notes

* Use `customContent` for UI other than list rendering.
* When dynamic sizing is enabled, Gorhom adds the intrinsic content height as a snap point.
* The sheet clamps to the snap index it opens with. Provide a higher `initialIndex` for a taller default state.
* All header, search, and footer props are optional - provide only what you need.
* The old flat prop structure is still supported for backwards compatibility, but the grouped structure is recommended.