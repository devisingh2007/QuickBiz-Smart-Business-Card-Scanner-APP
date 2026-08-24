import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Image, Alert, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ocrService } from '@/services/ocr.service';

export default function ScanScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [scanState, setScanState] = useState<'scan' | 'preview' | 'ocr'>('scan');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const isWebPlatform = Platform.OS === 'web';

  const handleEnterManually = async () => {
    try {
      const defaultCategory = await AsyncStorage.getItem('@quickbiz_default_category') || 'Other';
      router.push({
        pathname: '/review',
        params: { category: defaultCategory }
      });
    } catch {
      router.push('/review');
    }
  };

  // ── Capture ────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      console.log('[SCANNER] cameraReady: true');
      console.log('[SCANNER] permissionStatus: granted');
      console.log('[SCANNER] captureStarted: true');

      const startTime = Date.now();
      // base64 not needed — ML Kit reads directly from the file URI
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      const captureTime = Date.now() - startTime;

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        console.log('[SCANNER] captureCompleted: true');
        console.log('[SCANNER] imageUri: valid');
        console.log(`[SCANNER] imageWidth: ${photo.width}`);
        console.log(`[SCANNER] imageHeight: ${photo.height}`);
        console.log(`[SCANNER] processingTime: ${captureTime}ms`);
        setScanState('preview');
      }
    } catch (err: any) {
      console.error('[SCANNER] Image Capture failed:', err.message);
      Alert.alert(
        'Capture Error',
        'Failed to take business card photo. Please enter details manually.',
        [
          { text: 'Enter Manually', onPress: handleEnterManually },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setScanState('scan');
  };

  // ── OCR — on-device ML Kit, no network ────────────────────────────────────
  const handleUsePhoto = async () => {
    if (!photoUri) return;
    setScanState('ocr');

    try {
      console.log('[OCR] Starting on-device ML Kit OCR...');
      const { parsedData } = await ocrService.processImage(photoUri);
      const defaultCategory = await AsyncStorage.getItem('@quickbiz_default_category') || 'Other';

      router.push({
        pathname: '/review',
        params: {
          name: parsedData.name || '',
          company: parsedData.company || '',
          designation: parsedData.designation || '',
          officeAddress: parsedData.officeAddress || '',
          phonesJson: JSON.stringify(parsedData.phones || []),
          emailsJson: JSON.stringify(parsedData.emails || []),
          websitesJson: JSON.stringify(parsedData.websites || []),
          extractionQualityScore: String(parsedData.extractionQualityScore || 0),
          category: defaultCategory,
        },
      });

      setPhotoUri(null);
      setScanState('scan');
    } catch (error: any) {
      console.error('[OCR] ML Kit OCR failed:', error.message);

      let alertTitle = "Couldn't Read Card";
      let alertMessage =
        "Couldn't read this business card. Please try again or enter details manually.";

      if (error.message === 'OCR_NO_TEXT') {
        alertTitle = 'No Text Found';
        alertMessage =
          'No text could be detected on this card. Make sure the card is well-lit and the text is clearly in focus.';
      } else if (error.message === 'OCR_NOT_SUPPORTED_ON_WEB') {
        alertTitle = 'Not Supported';
        alertMessage = 'Card scanning is not supported on web. Please enter details manually.';
      } else if (error.message === 'OCR_ENGINE_ERROR') {
        alertTitle = 'Scanner Error';
        alertMessage =
          'The text recognition engine encountered an error. Please retake the photo.';
      }

      Alert.alert(alertTitle, alertMessage, [
        {
          text: 'Enter Manually',
          onPress: async () => {
            await handleEnterManually();
            setPhotoUri(null);
            setScanState('scan');
          },
        },
        { text: 'Retry', onPress: () => setScanState('preview') },
        {
          text: 'Retake',
          onPress: () => {
            setPhotoUri(null);
            setScanState('scan');
          },
        },
      ]);
    }
  };

  // ── Manual-entry fallback UI ───────────────────────────────────────────────
  const renderManualEntryLanding = (title: string, message: string) => (
    <SafeAreaView
      style={[styles.container, { backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center', padding: 24 }]}
    >
      <IconSymbol name="camera.fill" size={64} color="#94A3B8" style={{ marginBottom: 20 }} />
      <Text style={[styles.permissionTitle, { color: '#FFFFFF' }]}>{title}</Text>
      <Text style={styles.permissionSub}>{message}</Text>
      <PrimaryButton
        title="Enter Details Manually"
        onPress={handleEnterManually}
        style={styles.permissionBtn}
      />
      {!isWebPlatform && (
        <TouchableOpacity onPress={requestPermission} style={{ marginTop: 24 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Grant Camera Permissions</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (isWebPlatform) {
    return renderManualEntryLanding(
      'Manual Entry Mode',
      'Card scanning is disabled in web browsers. Tap the button below to enter contact details directly.',
    );
  }

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: '#FFFFFF', marginTop: 12 }}>Loading Camera...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return renderManualEntryLanding(
      'Manual Entry Mode',
      'Camera access is disabled. Please grant camera permission to scan business cards or use Manual Entry Mode.',
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0B0F19' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Business Card</Text>
        <TouchableOpacity onPress={handleEnterManually} style={styles.toggleSimBtn}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Manual Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Camera / Scan state */}
      {scanState === 'scan' && (
        <View style={{ flex: 1 }}>
          <CameraView style={styles.camera} ref={cameraRef}>
            <View style={styles.overlay}>
              <View style={styles.viewFinderContainer}>
                <View style={[styles.cardBorder, { borderColor: '#FFFFFF' }]}>
                  <Text style={styles.helperTextInside}>Position Card Here</Text>
                </View>
              </View>
            </View>
          </CameraView>

          <Text style={styles.instructionText}>Place the entire card inside the frame.</Text>

          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={handleCapture} style={styles.captureOuterCircle}>
              <View style={styles.captureInnerCircle} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Preview state */}
      {scanState === 'preview' && (
        <View style={{ flex: 1 }}>
          <View style={styles.viewFinderContainer}>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} />}
          </View>

          <Text style={styles.instructionText}>Confirm if the photo is sharp and readable.</Text>

          <View style={styles.previewControls}>
            <TouchableOpacity
              onPress={handleRetake}
              style={[styles.previewButton, { borderColor: '#FFFFFF', borderWidth: 1 }]}
            >
              <Text style={styles.previewButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUsePhoto}
              style={[styles.previewButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.previewButtonText, { color: '#FFFFFF' }]}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* OCR processing state */}
      {scanState === 'ocr' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Analyzing Business Card...</Text>
          <Text style={styles.loadingSub}>Extracting contact information on-device</Text>

          <View style={styles.ocrStatusList}>
            <Text style={styles.ocrStatusItem}>✓ Running ML Kit OCR...</Text>
            <Text style={styles.ocrStatusItem}>✓ Reconstructing text structures...</Text>
            <Text style={styles.ocrStatusItem}>✓ Parsing contact fields...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  toggleSimBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  viewFinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardBorder: {
    width: '100%',
    aspectRatio: 1.586,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperTextInside: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },
  instructionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginVertical: 16,
  },
  controlsContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  captureOuterCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  previewControls: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  previewButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 32,
    textAlign: 'center',
  },
  ocrStatusList: {
    alignSelf: 'stretch',
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  ocrStatusItem: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  permissionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  permissionSub: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionBtn: { width: '100%' },
});
