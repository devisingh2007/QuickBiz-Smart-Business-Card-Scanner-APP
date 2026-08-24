import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { IconSymbol } from './ui/icon-symbol';
import { router } from 'expo-router';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught JavaScript rendering error:', error, errorInfo);
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false });
  };

  private handleReturnHome = () => {
    this.setState({ hasError: false });
    try {
      router.replace('/');
    } catch (e) {
      console.warn('Router redirect failed in ErrorBoundary:', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
            </View>
            <Text style={styles.title}>Oops, Something Went Wrong</Text>
            <Text style={styles.message}>
              An unexpected rendering error occurred. The application has been kept stable. You can try reloading the page or return to the main dashboard.
            </Text>
            <View style={styles.actions}>
              <PrimaryButton
                title="Try Again"
                onPress={this.handleTryAgain}
                style={styles.button}
              />
              <View style={{ height: 12 }} />
              <SecondaryButton
                title="Return Home"
                onPress={this.handleReturnHome}
                style={styles.button}
              />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    paddingHorizontal: 16,
  },
  button: {
    width: '100%',
  },
});
