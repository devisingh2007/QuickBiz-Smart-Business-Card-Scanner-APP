import React, { useState, useRef, } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Image, Alert, Platform, Linking, StatusBar, } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets, } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, } from 'expo-camera';
import { useRouter, } from 'expo-router';
import { Spacing, Typography, BorderRadius, } from '@/constants/theme';
import { PrimaryButton, } from '@/components/ui/PrimaryButton';
import { DarkButton, } from '@/components/ui/DarkButton';
import { IconSymbol, } from '@/components/ui/icon-symbol';
import { SunsetStripe, } from '@/components/ui/SunsetStripe';
import { ocrService, } from '@/services/ocr.service';
export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState('scan');
  const [photoUri, setPhotoUri] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const isWebPlatform = Platform.OS === 'web';
  const handleEnterManually = () => {
    router.push({
      pathname: '/review',
      params: {
        category: 'Other'
      }
    });
  };
  const handlePickFromGallery = async () => {
    try {
      const {
        status
      } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo Library Access Required', 'QuickBiz requires permission to access your photo gallery to select business card images for on-device recognition.', [{
          text: 'Cancel',
          style: 'cancel'
        }, {
          text: 'Open Settings',
          onPress: () => Linking.openSettings()
        }]);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false
      });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      const selectedUri = result.assets[0].uri;
      if (selectedUri) {
        setPhotoUri(selectedUri);
        setScanState('preview');
      }
    } catch (err) {
      console.warn('Gallery picker error:', err);
      Alert.alert('Gallery Error', 'Could not open photo library. Please try again or enter details manually.', [{
        text: 'Enter Manually',
        onPress: handleEnterManually
      }, {
        text: 'OK',
        style: 'default'
      }]);
    }
  };
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false
      });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setScanState('preview');
      }
    } catch {
      Alert.alert('Capture Error', 'Failed to capture business card photo. Please enter details manually.', [{
        text: 'Enter Manually',
        onPress: handleEnterManually
      }, {
        text: 'Cancel',
        style: 'cancel'
      }]);
    }
  };
  const handleRetake = () => {
    setPhotoUri(null);
    setScanState('scan');
  };
  const toggleFlash = () => {
    setFlashOn(prev => !prev);
  };
  const handleUsePhoto = async () => {
    if (!photoUri) return;
    setScanState('ocr');
    try {
      const {
        parsedData
      } = await ocrService.processImage(photoUri);
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
          category: 'Other'
        }
      });
      setPhotoUri(null);
      setScanState('scan');
    } catch (error) {
      let alertTitle = "Couldn't Read Card";
      let alertMessage = "Couldn't read this business card clearly. Please retake the photo, choose another image from gallery, or enter details manually.";
      if (error.message === 'OCR_NATIVE_UNAVAILABLE') {
        alertTitle = 'Scanning Unavailable';
        alertMessage = 'Business card scanning is unavailable in this build. Please use the QuickBiz development/installed app.';
      } else if (error.message === 'OCR_NO_TEXT') {
        alertTitle = 'No Text Detected';
        alertMessage = 'No text could be found on this card. Please ensure the card is well lit, flat, and in sharp focus.';
      } else if (error.message === 'OCR_NOT_SUPPORTED_ON_WEB') {
        alertTitle = 'Not Supported on Web';
        alertMessage = 'Card scanning is not supported on web. Please enter details manually.';
      } else if (error.message === 'OCR_ENGINE_ERROR') {
        alertTitle = 'Recognition Engine Error';
        alertMessage = 'The on-device text recognition engine encountered an issue. Please retake the photo or select another image.';
      }
      Alert.alert(alertTitle, alertMessage, [{
        text: 'Choose from Gallery',
        onPress: async () => {
          setPhotoUri(null);
          setScanState('scan');
          await handlePickFromGallery();
        }
      }, {
        text: 'Enter Manually',
        onPress: async () => {
          await handleEnterManually();
          setPhotoUri(null);
          setScanState('scan');
        }
      }, {
        text: 'Retry OCR',
        onPress: () => setScanState('preview')
      }, {
        text: 'Retake',
        onPress: () => {
          setPhotoUri(null);
          setScanState('scan');
        }
      }]);
    }
  };
  const renderManualEntryLanding = (title, message) => <SafeAreaView style={[styles.container, {
    backgroundColor: '#11101C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl
  }]}>
      <StatusBar barStyle="light-content" backgroundColor="#11101C" />
      <View style={[styles.fallbackIconCircle, {
      backgroundColor: '#252431',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    }]}>
        <IconSymbol name="camera.fill" size={32} color="#FA520F" />
      </View>
      <Text style={[styles.fallbackTitle, {
      color: '#FFFFFF'
    }]}>{title}</Text>
      <Text style={[styles.fallbackSub, {
      color: '#D0D0D5'
    }]}>{message}</Text>

      <View style={{
      gap: Spacing.md,
      width: '100%',
      maxWidth: 280,
      alignItems: 'center'
    }}>
        <PrimaryButton title="Choose from Gallery" onPress={handlePickFromGallery} icon={<IconSymbol name="photo.on.rectangle" size={16} color="#FFFFFF" />} style={{
        width: '100%'
      }} />
        <DarkButton title="Enter Details Manually" onPress={handleEnterManually} style={{
        width: '100%'
      }} />
      </View>

      {!isWebPlatform && <TouchableOpacity onPress={requestPermission} style={{
      marginTop: Spacing.lg
    }}>
          <Text style={{
        color: '#FA520F',
        ...Typography.bodySmMedium
      }}>
            Grant Camera Permissions
          </Text>
        </TouchableOpacity>}
    </SafeAreaView>;
  if (isWebPlatform) {
    return renderManualEntryLanding('Manual & Gallery Mode', 'Direct camera scanning is unavailable in web browsers. You can select an existing card photo from gallery or enter details manually.');
  }
  if (!permission) {
    return <SafeAreaView style={[styles.container, {
      backgroundColor: '#11101C',
      justifyContent: 'center',
      alignItems: 'center'
    }]}>
        <StatusBar barStyle="light-content" backgroundColor="#11101C" />
        <ActivityIndicator size="small" color="#FA520F" />
        <Text style={[styles.loadingText, {
        color: '#D0D0D5'
      }]}>
          Initializing camera hardware...
        </Text>
      </SafeAreaView>;
  }
  if (!permission.granted) {
    return renderManualEntryLanding('Camera Permission Required', 'QuickBiz can scan cards using your camera or import photos directly from your device gallery.');
  }
  return <SafeAreaView style={[styles.container, {
    backgroundColor: '#11101C'
  }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#11101C" />

      {/* 1. Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
          <IconSymbol name="arrow.left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scanner</Text>

        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={styles.headerUserBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Account settings">
          <IconSymbol name="person.fill" size={17} color="#D0D0D5" />
        </TouchableOpacity>
      </View>

      {/* 2. Main Viewport / Camera / Preview / OCR */}
      {scanState === 'scan' && <View style={styles.scannerBody}>
          {/* Live Camera View */}
          <View style={styles.cameraWrapper}>
            <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} enableTorch={flashOn} />

            {/* Dark Camera Overlay with Detection Frame & Top Controls */}
            <View pointerEvents="box-none" style={styles.cameraOverlay}>
              {/* Top Scanner Controls Bar */}
              <View style={styles.topControlsRow}>
                {/* Left: Close / Reset button */}
                <TouchableOpacity onPress={() => router.back()} style={styles.topControlCircle} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Close scanner">
                  <IconSymbol name="xmark" size={16} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Center: On-Device OCR status pill */}
                <View style={styles.autoDetectPill}>
                  <IconSymbol name="sparkles" size={13} color="#FA520F" />
                  <Text style={styles.autoDetectText}>ON-DEVICE OCR</Text>
                </View>

                {/* Right: Flash toggle button */}
                <TouchableOpacity onPress={toggleFlash} style={[styles.topControlCircle, flashOn && styles.topControlActive]} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={flashOn ? 'Turn off flash' : 'Turn on flash'}>
                  <IconSymbol name={flashOn ? 'bolt.fill' : 'bolt.slash.fill'} size={16} color={flashOn ? '#FA520F' : '#FFFFFF'} />
                </TouchableOpacity>
              </View>

              {/* Status Indicator Pill */}
              <View style={styles.statusPillWrapper}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>Hold steady • Align edges inside frame</Text>
                </View>
              </View>

              {/* Business Card Detection Frame */}
              <View style={styles.viewFinderContainer} pointerEvents="none">
                <View style={styles.businessCardFrame}>
                  {/* QuickBiz Sunset Orange Corner Accents (#FA520F) */}
                  <View style={[styles.cornerBracket, styles.cornerTL]} />
                  <View style={[styles.cornerBracket, styles.cornerTR]} />
                  <View style={[styles.cornerBracket, styles.cornerBL]} />
                  <View style={[styles.cornerBracket, styles.cornerBR]} />
                </View>
              </View>

              {/* Instructions below frame */}
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionTitle}>
                  Place the business card inside the frame
                </Text>
                <View style={styles.instructionSubRow}>
                  <IconSymbol name="lock.fill" size={12} color="#D0D0D5" />
                  <Text style={styles.instructionSubtitle}>
                    Google ML Kit On-Device Recognition • 100% Private
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3. Bottom Action Controls Bar */}
          <View style={[styles.bottomControlsBar, {
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
            {/* Gallery Action */}
            <TouchableOpacity onPress={handlePickFromGallery} activeOpacity={0.75} style={styles.bottomActionButton} accessibilityRole="button" accessibilityLabel="Choose card from Gallery">
              <View style={styles.bottomActionCircle}>
                <IconSymbol name="photo.on.rectangle" size={21} color="#FFFFFF" />
              </View>
              <Text style={styles.bottomActionLabel}>Gallery</Text>
            </TouchableOpacity>

            {/* Center Primary Capture Button */}
            <TouchableOpacity onPress={handleCapture} activeOpacity={0.75} style={styles.shutterOuterRing} accessibilityRole="button" accessibilityLabel="Take business card photo">
              <View style={styles.shutterInnerDisc}>
                <IconSymbol name="camera.fill" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Manual Action */}
            <TouchableOpacity onPress={handleEnterManually} activeOpacity={0.75} style={styles.bottomActionButton} accessibilityRole="button" accessibilityLabel="Enter contact details manually">
              <View style={styles.bottomActionCircle}>
                <IconSymbol name="pencil" size={19} color="#FFFFFF" />
              </View>
              <Text style={styles.bottomActionLabel}>Manual</Text>
            </TouchableOpacity>
          </View>
        </View>}

      {/* Preview State */}
      {scanState === 'preview' && <View style={[styles.previewContainer, {
      paddingBottom: Math.max(insets.bottom, 16)
    }]}>
          <View style={styles.previewImageContainer}>
            {photoUri && <Image source={{
          uri: photoUri
        }} style={styles.previewImage} resizeMode="contain" />}
          </View>

          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>Review Card Photo</Text>
            <Text style={styles.previewSubtitle}>
              Ensure contact information, name, and phone are sharp and clear before running on-device recognition.
            </Text>
          </View>

          <View style={styles.previewControls}>
            <DarkButton title="Retake" onPress={handleRetake} style={styles.previewBtn} />
            <PrimaryButton title="Extract Details" onPress={handleUsePhoto} style={styles.previewBtn} icon={<IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />} />
          </View>
        </View>}

      {/* OCR Processing State */}
      {scanState === 'ocr' && <View style={[styles.ocrContainer, {
      backgroundColor: '#11101C'
    }]}>
          <View style={styles.ocrPanel}>
            <ActivityIndicator size="small" color="#FA520F" style={styles.ocrSpinner} />
            <Text style={styles.ocrTitle}>Reading your card</Text>
            <Text style={styles.ocrSubtitle}>
              Extracting contact details and structuring fields on-device
            </Text>

            <View style={styles.ocrSteps}>
              <View style={styles.ocrStepRow}>
                <IconSymbol name="checkmark.circle.fill" size={15} color="#FA520F" />
                <Text style={styles.ocrStepText}>Reading layout geometry</Text>
              </View>
              <View style={styles.ocrStepRow}>
                <IconSymbol name="checkmark.circle.fill" size={15} color="#FA520F" />
                <Text style={styles.ocrStepText}>Analyzing typography with ML Kit</Text>
              </View>
              <View style={styles.ocrStepRow}>
                <IconSymbol name="checkmark.circle.fill" size={15} color="#FA520F" />
                <Text style={styles.ocrStepText}>Formatting phone, email, and address</Text>
              </View>
            </View>

            <View style={styles.ocrStripeWrapper}>
              <SunsetStripe height={3} />
            </View>
          </View>
        </View>}
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11101C'
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#11101C',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252431'
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2
  },
  headerUserBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252431'
  },
  scannerBody: {
    flex: 1
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000'
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 16, 28, 0.35)',
    justifyContent: 'space-between'
  },
  topControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md
  },
  topControlCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#252431',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  topControlActive: {
    borderColor: '#FA520F',
    backgroundColor: 'rgba(250, 82, 15, 0.15)'
  },
  autoDetectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 36, 49, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6
  },
  autoDetectText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6
  },
  statusPillWrapper: {
    alignItems: 'center',
    marginTop: 4
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 16, 28, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FA520F'
  },
  statusPillText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
    color: '#D0D0D5'
  },
  viewFinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg
  },
  businessCardFrame: {
    width: '92%',
    maxWidth: 360,
    aspectRatio: 1.586,
    // Standard 3.5" x 2" business card ratio
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cornerBracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FA520F'
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 6
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 6
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 6
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 6
  },
  instructionContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    gap: 4
  },
  instructionTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center'
  },
  instructionSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  instructionSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: '#D0D0D5',
    textAlign: 'center'
  },
  bottomControlsBar: {
    backgroundColor: '#11101C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  bottomActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    gap: 6
  },
  bottomActionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#252431',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  bottomActionLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
    color: '#D0D0D5'
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#FA520F',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6
  },
  shutterInnerDisc: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FA520F',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
    backgroundColor: '#11101C'
  },
  previewImageContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  previewInfo: {
    marginBottom: Spacing.lg
  },
  previewTitle: {
    ...Typography.heading3,
    color: '#FFFFFF',
    marginBottom: 4
  },
  previewSubtitle: {
    ...Typography.bodySm,
    color: '#D0D0D5'
  },
  previewControls: {
    flexDirection: 'row',
    gap: Spacing.md
  },
  previewBtn: {
    flex: 1
  },
  ocrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: '#11101C'
  },
  ocrPanel: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#252431',
    padding: Spacing.xl,
    alignItems: 'center'
  },
  ocrSpinner: {
    marginBottom: Spacing.md
  },
  ocrTitle: {
    ...Typography.heading1,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6
  },
  ocrSubtitle: {
    ...Typography.bodySm,
    color: '#D0D0D5',
    textAlign: 'center',
    marginBottom: Spacing.xl
  },
  ocrSteps: {
    width: '100%',
    gap: 12,
    marginBottom: Spacing.xl
  },
  ocrStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  ocrStepText: {
    ...Typography.bodySmMedium,
    color: '#FFFFFF'
  },
  ocrStripeWrapper: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden'
  },
  loadingText: {
    ...Typography.caption,
    marginTop: Spacing.sm
  },
  fallbackIconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg
  },
  fallbackTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.xs,
    textAlign: 'center'
  },
  fallbackSub: {
    ...Typography.bodyMd,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    maxWidth: 300
  }
});