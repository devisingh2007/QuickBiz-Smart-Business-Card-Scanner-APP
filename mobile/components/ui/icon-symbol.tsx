// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Partial<Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'phone.fill': 'phone',
  'envelope.fill': 'email',
  'camera.fill': 'photo-camera',
  'gearshape.fill': 'settings',
  'person.2.fill': 'people',
  'person.fill': 'person',
  'magnifyingglass': 'search',
  'plus': 'add',
  'trash.fill': 'delete',
  'doc.on.doc.fill': 'content-copy',
  'globe': 'public',
  'building.2.fill': 'business',
  'minus.circle.fill': 'remove-circle',
  'arrow.up.right.square': 'open-in-new',
  'photo.on.rectangle': 'photo-library',
  'photo.fill': 'photo',
  'checkmark.circle.fill': 'check-circle',
  'pencil': 'edit',
  'arrow.triangle.2.circlepath': 'sync',
  'info.circle.fill': 'info',
  'rectangle.portrait.and.arrow.right': 'logout',
  'xmark': 'close',
  'bolt.fill': 'flash-on',
  'bolt.slash.fill': 'flash-off',
  'viewfinder': 'crop-free',
  'sparkles': 'auto-awesome',
  'lock.fill': 'lock',
  'arrow.left': 'arrow-back',
  'doc.text.viewfinder': 'document-scanner',
  'tag': 'local-offer',
  'tag.fill': 'local-offer',
  'checkmark': 'check',
  'checkmark.seal.fill': 'verified',
  'folder.fill': 'folder',
  'externaldrive.fill': 'storage',
  'xmark.circle.fill': 'cancel',
  'briefcase.fill': 'work',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
