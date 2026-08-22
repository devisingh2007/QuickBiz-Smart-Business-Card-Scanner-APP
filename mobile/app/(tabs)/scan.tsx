import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/api.service';
import { ocrService } from '@/services/ocr.service';

export default function ScanScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const cameraRef = useRef<any>(null);
  const photoBase64Ref = useRef<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [scanState, setScanState] = useState<'scan' | 'preview' | 'ocr'>('scan');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [simulatedMode, setSimulatedMode] = useState(Platform.OS === 'web');

  const handleCapture = async () => {
    if (simulatedMode) {
      setPhotoUri('mock-uri');
      photoBase64Ref.current = null;
      setScanState('preview');
      return;
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          skipProcessing: false,
        });
        if (photo && photo.uri) {
          setPhotoUri(photo.uri);
          photoBase64Ref.current = photo.base64 || null;
          setScanState('preview');
        }
      } catch (err: any) {
        Alert.alert('Capture Error', 'Failed to capture card photo. Switching to Simulated Mode.', [
          { text: 'OK', onPress: () => setSimulatedMode(true) }
        ]);
      }
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    photoBase64Ref.current = null;
    setScanState('scan');
  };

  const handleUsePhoto = async () => {
    if (simulatedMode || !photoUri || !photoBase64Ref.current) {
      // Manual entry fallback
      router.push('/review');
      setPhotoUri(null);
      photoBase64Ref.current = null;
      setScanState('scan');
      return;
    }

    if (!apiService.isAuthenticated()) {
      Alert.alert(
        'Offline Mode',
        'Cloud OCR requires a signed-in session. You can enter contact details manually.',
        [
          {
            text: 'Enter Manually',
            onPress: () => {
              router.push('/review');
              setPhotoUri(null);
              photoBase64Ref.current = null;
              setScanState('scan');
            }
          },
          { text: 'Cancel', style: 'cancel', onPress: () => setScanState('preview') }
        ]
      );
      return;
    }

    setScanState('ocr');

    try {
      // Process card image using the OCR service abstraction
      const { parsedData } = await ocrService.processImage(photoUri, photoBase64Ref.current || undefined);
      
      // Navigate to the review screen and pass parsed contact details
      router.push({
        pathname: '/review',
        params: { ...parsedData },
      });
      
      // Reset state for when they come back
      setPhotoUri(null);
      photoBase64Ref.current = null;
      setScanState('scan');
    } catch (error: any) {
      Alert.alert('OCR Error', error.message || 'Couldn\'t read this business card. Please enter manually.', [
        {
          text: 'Enter Manually',
          onPress: () => {
            router.push('/review');
            setPhotoUri(null);
            photoBase64Ref.current = null;
            setScanState('scan');
          }
        },
        { text: 'Retry', onPress: () => setScanState('preview') }
      ]);
    }
  };

  if (!permission && !simulatedMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: '#FFFFFF', marginTop: 12 }}>Loading Camera...</Text>
      </SafeAreaView>
    );
  }

  if ((!permission || !permission.granted) && !simulatedMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <IconSymbol name="camera.fill" size={64} color="#94A3B8" style={{ marginBottom: 20 }} />
        <Text style={[styles.permissionTitle, { color: '#FFFFFF' }]}>Camera Permission Required</Text>
        <Text style={styles.permissionSub}>QuickBiz needs camera access to capture and scan business cards.</Text>
        <PrimaryButton title="Grant Camera Permission" onPress={requestPermission} style={styles.permissionBtn} />
        <TouchableOpacity onPress={() => setSimulatedMode(true)} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Use Simulated Mode for Testing</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0B0F19' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {simulatedMode ? 'Scan Card (Simulated)' : 'Scan Business Card'}
        </Text>
        <TouchableOpacity onPress={() => setSimulatedMode(!simulatedMode)} style={styles.toggleSimBtn}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
            {simulatedMode ? 'Use Real Camera' : 'Simulate'}
          </Text>
        </TouchableOpacity>
      </View>

      {scanState === 'scan' && (
        <View style={{ flex: 1 }}>
          {simulatedMode ? (
            <View style={styles.viewFinderContainer}>
              <View style={[styles.cardBorder, { borderColor: colors.primary }]}>
                <IconSymbol name="camera.fill" size={32} color={colors.primary} style={{ marginBottom: 12 }} />
                <Text style={styles.helperTextInside}>Simulated View Finder</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>Tapping capture loads mock card</Text>
              </View>
            </View>
          ) : (
            <CameraView style={styles.camera} ref={cameraRef}>
              <View style={styles.overlay}>
                <View style={styles.viewFinderContainer}>
                  <View style={[styles.cardBorder, { borderColor: '#FFFFFF' }]}>
                    <Text style={styles.helperTextInside}>Position Card Here</Text>
                  </View>
                </View>
              </View>
            </CameraView>
          )}

          <Text style={styles.instructionText}>Place the entire card inside the frame.</Text>

          {/* Capture Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={handleCapture} style={styles.captureOuterCircle}>
              <View style={styles.captureInnerCircle} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {scanState === 'preview' && (
        <View style={{ flex: 1 }}>
          {/* Image Preview Container */}
          <View style={styles.viewFinderContainer}>
            {simulatedMode || !photoUri ? (
              <View style={[styles.cardBorder, { borderColor: colors.primary, backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <View style={styles.mockCardTextContainer}>
                  <Text style={styles.mockCardTitle}>[Business Card Image]</Text>
                  <Text style={styles.mockCardSub}>Simulating camera capture preview...</Text>
                </View>
              </View>
            ) : (
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
            )}
          </View>
          
          <Text style={styles.instructionText}>Confirm if the photo is sharp and readable.</Text>

          {/* Preview Controls */}
          <View style={styles.previewControls}>
            <TouchableOpacity onPress={handleRetake} style={[styles.previewButton, { borderColor: '#FFFFFF', borderWidth: 1 }]}>
              <Text style={styles.previewButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUsePhoto} style={[styles.previewButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.previewButtonText, { color: '#FFFFFF' }]}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {scanState === 'ocr' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Analyzing Business Card...</Text>
          <Text style={styles.loadingSub}>Extracting contact information using OCR</Text>
          
          <View style={styles.ocrStatusList}>
            <Text style={styles.ocrStatusItem}>✓ Full Name</Text>
            <Text style={styles.ocrStatusItem}>✓ Phone Number</Text>
            <Text style={styles.ocrStatusItem}>✓ Email Address</Text>
            <Text style={[styles.ocrStatusItem, { opacity: 0.5 }]}>○ Company Name</Text>
            <Text style={[styles.ocrStatusItem, { opacity: 0.5 }]}>○ Designation</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleSimBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  viewFinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardBorder: {
    width: '100%',
    aspectRatio: 1.586, // standard business card aspect ratio
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperTextInside: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
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
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mockCardTextContainer: {
    padding: 16,
    alignItems: 'center',
  },
  mockCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  mockCardSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
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
  ocrStatusItem: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  permissionSub: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionBtn: {
    width: '100%',
  },
});
