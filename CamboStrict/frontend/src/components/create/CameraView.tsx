import { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { Music, Sliders, Zap, RefreshCw, FolderOpen } from 'lucide-react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { VISUAL_FILTERS } from '../../constants/filters';

interface CameraViewProps {
  isRecording: boolean;
  isDuet: boolean;
  selectedSound: any;
  selectedFilter: any;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onMediaCapture?: (uri: string, type: 'video' | 'photo') => void;
  onTakePhoto: () => void;
  onToggleFlash: () => void;
  onFlipCamera: () => void;
  onOpenGallery: () => void;
  onOpenSounds: () => void;
  onOpenFilters: () => void;
  onSelectFilter?: (filter: any) => void;
}

export function CameraView({
  isRecording,
  isDuet,
  selectedSound,
  selectedFilter,
  onStartRecording,
  onStopRecording,
  onMediaCapture,
  onTakePhoto,
  onToggleFlash,
  onFlipCamera,
  onOpenGallery,
  onOpenSounds,
  onOpenFilters,
  onSelectFilter,
}: CameraViewProps) {
  const [cameraMode, setCameraMode] = useState<'video' | 'photo'>('video');

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.viewfinder}>
          <View style={[styles.cameraPlaceholder, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center', padding: spacing.xl }}>
              Camera not available on web
            </Text>
            <TouchableOpacity onPress={onOpenGallery} style={{ backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.lg, marginTop: spacing.md }}>
              <Text style={{ color: colors.white, fontWeight: '700' }}>Upload from device</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  const cameraRef = useRef<ExpoCameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCameraReady, setIsCameraReady] = useState(false);

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.viewfinder}>
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.placeholderText}>Loading camera...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.viewfinder}>
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.placeholderText}>Camera permission not granted</Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'));
  };

  const flipCamera = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleRecord = async () => {
    if (isRecording) {
      try { cameraRef.current?.stopRecording(); } catch (e) { console.error(e); }
      onStopRecording();
      return;
    }
    if (!isCameraReady) return;
    onStartRecording();
    try {
      const result = await cameraRef.current?.recordAsync();
      if (result?.uri) {
        onMediaCapture?.(result.uri, 'video');
      }
    } catch (e) {
      console.error('Failed to record video', e);
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web' || !isCameraReady) return;
    try {
      const result = await cameraRef.current?.takePictureAsync();
      if (result?.uri) {
        onMediaCapture?.(result.uri, 'photo');
      }
      onTakePhoto();
    } catch (e) {
      console.error('Failed to take photo', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.viewfinder}>
        {isDuet ? (
          <View style={styles.duetContainer}>
            <View style={styles.duetHalf}>
              <Text style={styles.duetLabel}>Original Clip</Text>
            </View>
            <View style={[styles.duetHalf, styles.duetCamera]}>
          <ExpoCameraView ref={cameraRef} style={styles.cameraPreview} facing={facing} flash={flash} mode={cameraMode as any} onCameraReady={() => setIsCameraReady(true)} />
            </View>
          </View>
        ) : (
          <ExpoCameraView ref={cameraRef} style={styles.cameraPreview} facing={facing} flash={flash} mode={cameraMode as any} onCameraReady={() => setIsCameraReady(true)} />
        )}

        <View style={styles.topHud}>
          <TouchableOpacity onPress={toggleFlash} style={styles.hudBtn}>
            <Zap size={15} color={flash !== 'off' ? colors.accent : colors.textMuted} fill={flash !== 'off' ? colors.accent : 'none'} />
          </TouchableOpacity>
          <Text style={{ color: colors.textMuted, fontSize: 8, position: 'absolute', top: -12, left: 8 }}>Flash</Text>
          {isRecording && (
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC</Text>
            </View>
          )}
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={flipCamera} style={styles.hudBtn}>
              <RefreshCw size={15} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={{ color: colors.textMuted, fontSize: 7, marginTop: 2 }}>Flip</Text>
          </View>
        </View>

        <View style={styles.sideToolbar}>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={onOpenSounds} style={[styles.toolBtn, selectedSound && styles.toolActive]}>
              <Music size={15} color={selectedSound ? colors.white : colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.textMuted, fontSize: 7, marginTop: 2 }}>Sound</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={onOpenFilters} style={[styles.toolBtn, selectedFilter?.id !== 'none' && styles.toolActive]}>
              <Sliders size={15} color={selectedFilter?.id !== 'none' ? colors.white : colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.textMuted, fontSize: 7, marginTop: 2 }}>Adjust</Text>
          </View>
        </View>

        {selectedFilter && selectedFilter.id !== 'none' && (
          <View style={[styles.filterLabel, { backgroundColor: colors.accent }]}>
            <Text style={styles.filterLabelText}>{selectedFilter.name}</Text>
          </View>
        )}

        <View style={styles.filterCarousel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterCarouselContent}>
            {VISUAL_FILTERS.map((f) => {
              const isActive = selectedFilter?.id === f.id;
              const filterStyles: Record<string, object> = {
                'none': { backgroundColor: '#333' },
                'sunset': { backgroundColor: '#E8753A' },
                'pepper': { backgroundColor: '#8B4513' },
                'mist': { backgroundColor: '#7B9EB0' },
                'neon': { backgroundColor: '#FF6EC7' },
                'gold': { backgroundColor: '#D4AF37' },
                'jungle': { backgroundColor: '#228B22' },
                'kep': { backgroundColor: '#FFB07C' },
                'vhs': { backgroundColor: '#6C6C6C' },
                'noir': { backgroundColor: '#1A1A1A' },
              };
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => onSelectFilter?.(f)}
                  style={[styles.filterThumb, isActive && styles.filterThumbActive]}
                >
                  <View style={[styles.filterPreview, filterStyles[f.id] || { backgroundColor: colors.bgCard }, isActive && { borderColor: colors.accent }]} />
                  <Text style={[styles.filterThumbLabel, isActive && styles.filterThumbLabelActive]}>{f.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {selectedFilter && selectedFilter.id !== 'none' && (
          <View style={[styles.filterLabel, { backgroundColor: colors.accent }]}>
            <Text style={styles.filterLabelText}>{selectedFilter.name}</Text>
          </View>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity onPress={onOpenGallery} style={styles.galleryBtn}>
            <FolderOpen size={13} color={colors.accent} />
            <Text style={styles.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <View style={styles.centerGroup}>
            <View style={styles.shutterRow}>
              <TouchableOpacity
                onPress={handleRecord}
                style={styles.shutterBtn}
              >
                <View style={[styles.shutterInner, isRecording && styles.shutterRecording]} />
              </TouchableOpacity>
              <Text style={styles.shutterLabel}>{isRecording ? 'Stop' : 'Record'}</Text>
            </View>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                onPress={() => setCameraMode('video')}
                style={cameraMode === 'video' ? styles.typeActive : styles.typeInactive}
              >
                <Text style={cameraMode === 'video' ? styles.typeActiveText : styles.typeInactiveText}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCameraMode('photo')}
                style={cameraMode === 'photo' ? styles.typeActive : styles.typeInactive}
              >
                <Text style={cameraMode === 'photo' ? styles.typeActiveText : styles.typeInactiveText}>Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ width: 44 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  viewfinder: {
    flex: 1,
    backgroundColor: colors.black,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  duetContainer: { flex: 1, flexDirection: 'row' },
  duetHalf: {
    flex: 1,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  duetCamera: { backgroundColor: '#1a1a1a' },
  duetLabel: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700' },
  cameraPreview: { flex: 1 },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  placeholderText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md },
  permissionBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  permissionBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  topHud: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  hudBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226,75,74,0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  recText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  sideToolbar: {
    position: 'absolute',
    right: spacing.md,
    top: 80,
    gap: spacing.md,
    zIndex: 10,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toolActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterLabel: {
    position: 'absolute',
    bottom: 100,
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 9999,
    zIndex: 10,
  },
  filterLabelText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  filterCarousel: {
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: spacing.xs,
  },
  filterCarouselContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterThumb: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  filterThumbActive: {},
  filterPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.border,
  },
  filterThumbLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '600' },
  filterThumbLabelActive: { color: colors.white, fontWeight: '700' },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 10,
  },
  galleryBtn: { alignItems: 'center', gap: 3 },
  galleryText: { color: colors.textMuted, fontSize: 8, fontWeight: '600' },
  shutterRow: { alignItems: 'center', gap: spacing.xs },
  centerGroup: { alignItems: 'center', gap: spacing.sm },
  shutterBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: colors.accent,
  },
  shutterRecording: { backgroundColor: colors.danger, borderRadius: 6, transform: [{ scale: 0.75 }] },
  shutterLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: borderRadius.md,
    padding: 2,
    marginTop: spacing.xs,
  },
  typeActive: { backgroundColor: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  typeActiveText: { color: colors.white, fontSize: 8, fontWeight: '700' },
  typeInactive: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  typeInactiveText: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
});
