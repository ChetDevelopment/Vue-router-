import { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  height?: number;
  children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({ isOpen, onClose, height = SCREEN_HEIGHT * 0.7, children }: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 220,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, height]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, { toValue: height, duration: 200, useNativeDriver: true }).start(onClose);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 25, stiffness: 220 }).start();
        }
      },
    })
  ).current;

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: translateY.interpolate({ inputRange: [0, height], outputRange: [0.5, 0] }) }]} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[styles.sheet, { height, transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 40,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    borderTopWidth: 1,
    borderColor: colors.border,
    zIndex: 50,
    overflow: 'hidden',
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
});
