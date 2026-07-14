import { Image, View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface AvatarProps {
  uri: string;
  size?: number;
  isVerified?: boolean;
  style?: ViewStyle;
}

export function Avatar({ uri, size = 40, isVerified = false, style }: AvatarProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
      {isVerified && (
        <View style={[styles.badge, { width: size * 0.35, height: size * 0.35, borderRadius: size * 0.175 }]}>
          <Image
            source={{ uri: 'https://img.icons8.com/color/48/verified-badge.png' }}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
