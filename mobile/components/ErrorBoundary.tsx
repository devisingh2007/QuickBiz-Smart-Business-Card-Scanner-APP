import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { SunsetStripe } from './ui/SunsetStripe';
import { IconSymbol } from './ui/icon-symbol';
import { Palette, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallbackView({ onTryAgain, onReturnHome }: { onTryAgain: () => void; onReturnHome: () => void }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: colors.surfaceCream,
              borderColor: colors.borderBeige,
            },
          ]}
        >
          <IconSymbol
            name="exclamationmark.triangle.fill"
            size={32}
            color={Palette.primary}
          />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>System Interruption</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          An unexpected display exception occurred. Application state has been
          kept isolated. You can reload this view or return to the main dashboard.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton
            title="Try Again"
            onPress={onTryAgain}
            style={styles.button}
          />
          <SecondaryButton
            title="Return to Dashboard"
            onPress={onReturnHome}
            variant="outline"
            style={styles.button}
          />
        </View>
      </View>
      <SunsetStripe height={4} style={styles.bottomStripe} />
    </SafeAreaView>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
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
        <ErrorFallbackView
          onTryAgain={this.handleTryAgain}
          onReturnHome={this.handleReturnHome}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 420,
    width: '100%',
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg, // 12px
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 26,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  message: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
  bottomStripe: {
    width: '100%',
  },
});
