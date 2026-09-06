import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { DarkButton } from '@/components/ui/DarkButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SunsetStripe } from '@/components/ui/SunsetStripe';
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

  const handleEnterManually = () => {
    router.push({
      pathname: '/review',
      params: { category: 'Other' },
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setScanState('preview');
      }
    } catch {
      Alert.alert(
        'Capture Error',
        'Failed to capture business card photo. Please enter details manually.',
        [
          { text: 'Enter Manually', onPress: handleEnterManually },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setScanState('scan');
  };

  const handleUsePhoto = async () => {
    if (!photoUri) return;
    setScanState('ocr');

    try {
      const { parsedData } = await ocrService.processImage(photoUri);

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
          category: 'Other',
        },
      });

      setPhotoUri(null);
      setScanState('scan');
    } catch (error: any) {
      let alertTitle = "Couldn't Read Card";
      let alertMessage =
        "Couldn't read this business card clearly. Please retake the photo or enter details manually.";

      if (error.message === 'OCR_NATIVE_UNAVAILABLE') {
        alertTitle = 'Scanning Unavailable';
        alertMessage =
          'Business card scanning is unavailable in this build. Please use the QuickBiz development/installed app.';
      } else if (error.message === 'OCR_NO_TEXT') {
        alertTitle = 'No Text Detected';
        alertMessage =
          'No text could be found on this card. Please ensure the card is well lit, flat, and in sharp focus.';
      } else if (error.message === 'OCR_NOT_SUPPORTED_ON_WEB') {
        alertTitle = 'Not Supported on Web';
        alertMessage = 'Card scanning is not supported on web. Please enter details manually.';
      } else if (error.message === 'OCR_ENGINE_ERROR') {
        alertTitle = 'Recognition Engine Error';
        alertMessage =
          'The on-device text recognition engine encountered an issue. Please retake the photo.';
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
        { text: 'Retry OCR', onPress: () => setScanState('preview') },
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

  const renderManualEntryLanding = (title: string, message: string) => (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing.xl,
        },
      ]}
    >
      <View
        style={[
          styles.fallbackIconCircle,
          {
            backgroundColor: colors.surfaceCream,
            borderColor: colors.borderBeige,
          },
        ]}
      >
        <IconSymbol name="camera.fill" size={32} color={Palette.primary} />
      </View>
      <Text style={[styles.fallbackTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.fallbackSub, { color: colors.textSecondary }]}>{message}</Text>
      <PrimaryButton
        title="Enter Details Manually"
        onPress={handleEnterManually}
        style={styles.fallbackBtn}
      />
      {!isWebPlatform && (
        <TouchableOpacity onPress={requestPermission} style={{ marginTop: Spacing.lg }}>
          <Text style={{ color: Palette.primary, ...Typography.bodySmMedium }}>
            Grant Camera Permissions
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );

  if (isWebPlatform) {
    return renderManualEntryLanding(
      'Manual Entry Mode',
      'Card scanning using native camera is unavailable in web browsers. You can input contacts directly using manual entry.'
    );
  }

  if (!permission) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: Palette.surfaceCode,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="small" color={Palette.primary} />
        <Text style={[styles.loadingText, { color: Palette.onDarkMuted }]}>
          Initializing camera hardware
        </Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return renderManualEntryLanding(
      'Camera Permission Required',
      'QuickBiz requires camera access to scan business cards. You can grant access or use manual contact entry.'
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Palette.surfaceCode }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Scan Business Card</Text>
        </View>

        <TouchableOpacity
          onPress={handleEnterManually}
          style={styles.manualEntryHeaderBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Enter contact manually"
        >
          <IconSymbol name="pencil" size={13} color="#FFFFFF" />
          <Text style={styles.manualEntryHeaderText}>Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Camera / Scan state */}
      {scanState === 'scan' && (
        <View style={{ flex: 1 }}>
          <View style={styles.cameraWrapper}>
            <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} />

            <View pointerEvents="box-none" style={styles.overlay}>
              {/* Frame Viewfinder */}
              <View style={styles.viewFinderContainer} pointerEvents="none">
                <View style={styles.businessCardFrame}>
                  {/* Mistral Orange Corner Accents (#FA520F) */}
                  <View style={[styles.cornerBracket, styles.cornerTL]} />
                  <View style={[styles.cornerBracket, styles.cornerTR]} />
                  <View style={[styles.cornerBracket, styles.cornerBL]} />
                  <View style={[styles.cornerBracket, styles.cornerBR]} />

                  <View style={styles.guideBadge}>
                    <Text style={styles.guideText}>Position business card within frame</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              Hold steady in clear light. Text will be recognized on-device.
            </Text>
          </View>

          {/* Capture Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              onPress={handleCapture}
              activeOpacity={0.75}
              style={styles.captureOuterCircle}
              accessibilityRole="button"
              accessibilityLabel="Capture photo"
            >
              <View style={styles.captureInnerCircle} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Preview state */}
      {scanState === 'preview' && (
        <View style={styles.previewContainer}>
          <View style={styles.previewImageContainer}>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
            )}
          </View>

          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>Review Card Photo</Text>
            <Text style={styles.previewSubtitle}>
              Ensure card text is in sharp focus before running optical character recognition.
            </Text>
          </View>

          <View style={styles.previewControls}>
            <DarkButton
              title="Retake"
              onPress={handleRetake}
              style={styles.previewBtn}
            />
            <PrimaryButton
              title="Extract Details"
              onPress={handleUsePhoto}
              style={styles.previewBtn}
              icon={<IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />}
            />
          </View>
        </View>
      )}

      {scanState === 'ocr' && (
        <View style={[styles.ocrContainer, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.ocrPanel,
              {
                backgroundColor: colors.surfaceCream,
                borderColor: colors.borderBeige,
              },
            ]}
          >
            <ActivityIndicator size="small" color={Palette.primary} style={styles.ocrSpinner} />
            <Text style={[styles.ocrTitle, { color: colors.textPrimary }]}>
              Reading your card
            </Text>
            <Text style={[styles.ocrSubtitle, { color: colors.textSecondary }]}>
              Extracting contact details and structuring fields on-device
            </Text>

            <View style={styles.ocrSteps}>
              <View style={styles.ocrStepRow}>
                <IconSymbol name="checkmark.circle.fill" size={15} color={Palette.primary} />
                <Text style={[styles.ocrStepText, { color: colors.textPrimary }]}>
                  Reading layout geometry
                </Text>
              </View>
              <View style={styles.ocrStepRow}>
                <IconSymbol name="checkmark.circle.fill" size={15} color={Palette.primary} />
                <Text style={[styles.ocrStepText, { color: colors.textPrimary }]}>
                  Analyzing typography with ML Kit
                </Text>
              </View>
              <View style={styles.ocrStepRow}>
                <IconSymbol name="checkmark.circle.fill" size={15} color={Palette.primary} />
                <Text style={[styles.ocrStepText, { color: colors.textPrimary }]}>
                  Formatting phone, email, and address
                </Text>
              </View>
            </View>

            <View style={styles.ocrStripeWrapper}>
              <SunsetStripe height={3} />
            </View>
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
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.heading4,
    color: '#FFFFFF',
    fontSize: 16,
  },
  manualEntryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#2C2C2E',
    gap: 6,
  },
  manualEntryHeaderText: {
    color: '#FFFFFF',
    ...Typography.bodySmMedium,
    fontSize: 13,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  viewFinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  businessCardFrame: {
    width: '100%',
    aspectRatio: 1.586, // Standard 3.5" x 2" business card ratio
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Palette.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: BorderRadius.sm,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: BorderRadius.sm,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: BorderRadius.sm,
  },
  guideBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  guideText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontSize: 12,
  },
  instructionContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  instructionText: {
    ...Typography.caption,
    color: Palette.onDarkMuted,
    textAlign: 'center',
  },
  controlsContainer: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.md,
  },
  captureOuterCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Palette.primary,
  },
  previewContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  previewImageContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewInfo: {
    marginBottom: Spacing.lg,
  },
  previewTitle: {
    ...Typography.heading3,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previewSubtitle: {
    ...Typography.bodySm,
    color: Palette.onDarkMuted,
  },
  previewControls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  previewBtn: {
    flex: 1,
  },
  ocrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  ocrPanel: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  ocrSpinner: {
    marginBottom: Spacing.md,
  },
  ocrTitle: {
    ...Typography.heading1,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 6,
  },
  ocrSubtitle: {
    ...Typography.bodySm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  ocrSteps: {
    width: '100%',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  ocrStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ocrStepText: {
    ...Typography.bodySmMedium,
  },
  ocrStripeWrapper: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingText: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
  fallbackIconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  fallbackTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  fallbackSub: {
    ...Typography.bodyMd,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  fallbackBtn: {
    minWidth: 220,
  },
});
