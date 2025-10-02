# Custom Bottom Sheet Usage

`@gorhom/bottom-sheet` + Reanimated + Paper theme. Use `CustomBottomSheet`.

> ℹ️ **Dynamic sizing** is enabled by default. The wrapper renders the Gorhom pre-configured primitives (`BottomSheetView`, `BottomSheetVirtualizedList`) so content height is measured automatically. Provide `maxDynamicContentSize` when you need to cap the expanded height, or disable the feature with `enableDynamicSizing={false}`.

## Examples
Other examples are implemented in profile.jsx

### 1. Basic List
```jsx
const items = [
  { id: 'acct', label: 'Account' },
  { id: 'notif', label: 'Notifications' },
];

<CustomBottomSheet
  title="Settings"
  data={items}
  enableSearch
  onItemPress={(row) => console.log('tap', row)}
  onClose={() => setOpen(false)}
/>;
```

### 2. Custom Render (Icon Grid)
```jsx
const actions = [
  { icon: 'plus-box', label: 'New Entry', onPress: () => router.navigate('/modules/day-book/data-management/new-entry') },
  { icon: 'file-chart', label: 'Reports', onPress: () => router.navigate('/modules/day-book/reports/report-management') },
  { icon: 'bell', label: 'Alerts', onPress: () => router.navigate('/modules/day-book/notifications/notifications') },
];

<CustomBottomSheet
  title="Day Book"
  data={actions}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.gridItem} onPress={item.onPress}>
      <Icon source={item.icon} size={30} />
      <Text style={styles.gridLabel}>{item.label}</Text>
    </TouchableOpacity>
  )}
  itemTitleExtractor={(i) => i.label}
  enableSearch
  footerVariant="translucent"
  onClose={() => setOpen(false)}
/>;
```

### 3. Custom Content (Form)
```jsx
<CustomBottomSheet
  title="Quick Note"
  customContent={(
    <View style={{ flex: 1 }}>
      <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" />
      <TextInput label="Details" value={body} onChangeText={setBody} mode="outlined" multiline />
      <Button onPress={saveNote} disabled={!title && !body} mode="contained">Save</Button>
    </View>
  )}
  footerVariant="none"
  maxDynamicContentSize={480}
  onClose={() => setShow(false)}
/>;
```

### 4. Compact Variant
```jsx
<CustomBottomSheet
  variant="compact"
  title="Quick Actions"
  data={[ 'One', 'Two', 'Three' ]}
  onClose={() => setOpen(false)}
/>;
```

### 5. Imperative (Ref)
```jsx
const sheetRef = useRef(null);

<CustomBottomSheet ref={sheetRef} data={[1,2,3]} title="Numbers" onClose={() => setOpen(false)} />;

// later
sheetRef.current?.expand();
sheetRef.current?.collapse();
sheetRef.current?.close();
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onChange` | `(index: number) => void` | `undefined` | Called when snap index changes (gorhom mirror). |
| `data` | `any[]` | `[1,2,3]` | List data (ignored if `customContent`). |
| `renderItem` | `({item,index}) => ReactNode` | internal row | Custom list row renderer. |
| `keyExtractor` | `(item,index)=>string` | item.id / index | Virtualized list key extractor. |
| `getItem` | `(data,index)=>any` | `(arr,i)=>arr[i]` | Override VirtualizedList getItem. |
| `getItemCount` | `(data)=>number` | `arr.length` | Override VirtualizedList getItemCount. |
| `snapPoints` | `(number \| string)[]` | `['30%', '100%']` | Base snap points. When dynamic sizing is enabled, the sheet injects the intrinsic content height as an additional snap point. |
| `enableDynamicSizing` | `boolean` | `true` | Enables Gorhom's dynamic sizing behaviour. Set to `false` to opt-out. |
| `maxDynamicContentSize` | `number` | window height minus safe-area inset | Caps dynamic sizing so the sheet never grows beyond the provided height. |
| `initialIndex` | `number` | derived | Starting index (validated). |
| `title` | `string | ReactNode` | `undefined` | Header (standard) or handle text (compact). |
| `headerComponent` | `ReactNode` | `undefined` | Full custom header (overrides internal). |
| `headerActionLabel` | `string` | `undefined` | Right action button label. |
| `onHeaderActionPress` | `() => void` | `undefined` | Handler for header action button. |
| `showClose` | `boolean` | `true` | Show close icon. |
| `onClose` | `() => void` | `undefined` | Called on close / backdrop tap. |
| `closeIcon` | `string` | `'close'` | Icon name for close. |
| `headerChildren` | `ReactNode` | `undefined` | Extra inline header elements. |
| `variant` | `'standard' | 'compact'` | `'standard'` | Compact moves title into handle. |
| `handleSolidBackground` | `boolean` | `false` | Force solid handle background. |
| `onItemPress` | `(item,index)=>void` | `undefined` | Default row press callback. |
| `itemTitleExtractor` | `(item,index)=>string` | heuristic | Derive label for default row + search. |
| `emptyComponent` | `ReactNode` | `undefined` | Shown when list (after filter) empty. |
| `enableSearch` | `boolean` | `false` | Enable client search bar. |
| `searchPlaceholder` | `string` | `'Search'` | Search input placeholder. |
| `footerVariant` | `'default' | 'translucent' | 'minimal' | 'none'` | `'default'` | Footer control style or hide. |
| `footerPlacement` | `'left' | 'center' | 'right'` | `'right'` | Footer horizontal position. |
| `autoExpandOnSearchFocus` | `boolean` | `true` | Expand to max on search focus. |
| `autoExpandOnKeyboardShow` | `boolean` | `true` | Expand to max when keyboard opens (search). |
| `customContent` | `ReactNode` | `undefined` | Custom body; bypass list/search. |
| `...props` | any | — | Passed to underlying gorhom BottomSheet. |

## Notes
* Use `customContent` UI other than list.
* When dynamic sizing is enabled, Gorhom adds the intrinsic content height as a snap point. Keep this in mind when targeting snap indices imperatively.