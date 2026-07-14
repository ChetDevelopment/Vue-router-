import { View, Text } from 'react-native';
import { colors } from '../../src/constants/theme';

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.text }}>Login Screen</Text>
    </View>
  );
}
