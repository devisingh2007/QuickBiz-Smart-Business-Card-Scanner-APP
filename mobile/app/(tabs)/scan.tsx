import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ScanScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [scanState, setScanState] = useState<'scan' | 'preview' | 'ocr'>('scan');

  const handleCapture = () => {
    setScanState('preview');
  };

  const handleRetake = () => {
    setScanState('scan');
  };

  const handleUsePhoto = () => {
    setScanState('ocr');
    // Simulate OCR delay, then go to success/extracted screen or display mock details
    setTimeout(() => {
      setScanState('scan');
      alert('Mock OCR text extraction complete!\n\nName: Rahul Sharma\nDesignation: Software Engineer\nCompany: ABC Technologies\nPhone: +91 9876543210\nEmail: rahul@abc.com');
    }, 2500);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0B0F19' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Business Card</Text>
      </View>

      {scanState === 'scan' && (
        <React.Fragment>
          {/* Scanner View Finder */}
          <View style={styles.viewFinderContainer}>
            <View style={[styles.cardBorder, { borderColor: '#FFFFFF' }]}>
              <Text style={styles.helperTextInside}>Position Card Here</Text>
            </View>
          </View>
          <Text style={styles.instructionText}>Place the entire card inside the frame.</Text>

          {/* Capture Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={handleCapture} style={styles.captureOuterCircle}>
              <View style={styles.captureInnerCircle} />
            </TouchableOpacity>
          </View>
        </React.Fragment>
      )}

      {scanState === 'preview' && (
        <React.Fragment>
          {/* Image Preview Container */}
          <View style={styles.viewFinderContainer}>
            <View style={[styles.cardBorder, { borderColor: colors.primary, backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <View style={styles.mockCardTextContainer}>
                <Text style={styles.mockCardTitle}>Rahul Sharma</Text>
                <Text style={styles.mockCardSub}>Software Engineer</Text>
                <Text style={styles.mockCardSub}>ABC Technologies Pvt. Ltd.</Text>
                <Text style={styles.mockCardSub}>+91 9876543210 | rahul@abc.com</Text>
              </View>
            </View>
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
        </React.Fragment>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    marginBottom: 24,
  },
  controlsContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
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
  previewControls: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
});
