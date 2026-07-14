import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, Image as ImageIcon, Music, Sliders, Zap, RefreshCw, FolderOpen } from 'lucide-react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

interface CameraViewProps {
  isRecording: boolean;
  isDuet: boolean;
  selectedSound: any;
  selectedFilter: any;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTakePhoto: () => void;
  onToggleFlash: () => void;
  onFlipCamera: () => void;
  onOpenGallery: () => void;
  onOpenSounds: () => void;
  onOpenFilters: () => void;
}

export function CameraView({
  isRecording,
  isDuet,
  selectedSound,
  selectedFilter,
  onStartRecording,
  onStopRecording,
  onTakePhoto,
  onToggleFlash,
  onFlipCamera,
  onOpenGallery,
  onOpenSounds,
  onOpenFilters,
}: CameraViewProps) {
  const [flashOn, setFlashOn] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.viewfinder}>
        {isDuet ? (
          <View style={styles.duetContainer}>
            <View style={styles.duetHalf}>
              <Text style={styles.duetLabel}>Original Clip</Text>
            </View>
            <View style={[styles.duetHalf, styles.duetCamera]}>
              <Text style={styles.duetLabel}>Your Camera</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cameraPreview}>
            <View style={styles.cameraPlaceholder}>
              <Camera size={40} color={colors.textMuted} />
              <Text style={styles.placeholderText}>Camera Preview</Text>
            </View>
          </View>
        )}

        <View style={styles.topHud}>
          <TouchableOpacity onPress={() => setFlashOn(!flashOn)} style={styles.hudBtn}>
            <Zap size={15} color={flashOn ? colors.accent : colors.textMuted} fill={flashOn ? colors.accent : 'none'} />
          </TouchableOpacity>
          {isRecording && (
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC 00:{recordingDuration}</Text>
            </View>
          )}
          <TouchableOpacity onPress={onFlipCamera} style={styles.hudBtn}>
            <RefreshCw size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.sideToolbar}>
          <TouchableOpacity onPress={onOpenSounds} style={[styles.toolBtn, selectedSound && styles.toolActive]}>
            <Music size={15} color={selectedSound ? colors.white : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenFilters} style={[styles.toolBtn, selectedFilter?.id !== 'none' && styles.toolActive]}>
            <Sliders size={15} color={selectedFilter?.id !== 'none' ? colors.white : colors.text} />
          </TouchableOpacity>
        </View>

        {selectedFilter && selectedFilter.id !== 'none' && (
          <View style={styles.filterLabel}>
            <Text style={styles.filterLabelText}>Filter: {selectedFilter.name}</Text>
          </View>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity onPress={onOpenGallery} style={styles.galleryBtn}>
            <FolderOpen size={13} color={colors.accent} />
            <Text style={styles.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <View style={styles.shutterRow}>
            <TouchableOpacity onPress={onTakePhoto} disabled={isDuet} style={styles.photoBtn}>
              <ImageIcon size={14} color={isDuet ? colors.textMuted : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={isRecording ? onStopRecording : onStartRecording}
              style={styles.shutterBtn}
            >
              <View style={[styles.shutterInner, isRecording && styles.shutterRecording]} />
            </TouchableOpacity>
            <Text style={styles.shutterLabel}>{isRecording ? 'Stop' : 'Record'}</Text>
          </View>

          <View style={styles.typeToggle}>
            <TouchableOpacity style={styles.typeActive}>
              <Text style={styles.typeActiveText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.typeInactive}>
              <Text style={styles.typeInactiveText}>Photo</Text>
            </TouchableOpacity>
          </View>
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
  filterLabelText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700' },
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
  photoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  },
  typeActive: { backgroundColor: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  typeActiveText: { color: colors.white, fontSize: 8, fontWeight: '700' },
  typeInactive: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  typeInactiveText: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
});
