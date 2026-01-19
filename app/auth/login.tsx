import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Login screen with email/password and social auth options
 */
export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  /**
   * Maps authentication errors to user-friendly messages.
   */
  const getLoginErrorMessage = (error: { message?: string } | null) => {
    if (!error?.message) {
      return 'Something went wrong. Please try again.';
    }

    const normalizedMessage = error.message.toLowerCase();
    if (normalizedMessage.includes('invalid login credentials')) {
      return 'Incorrect email or password.';
    }
    
    if (
      normalizedMessage.includes('email not confirmed') ||
      normalizedMessage.includes('email_not_confirmed') ||
      normalizedMessage.includes('not confirmed')
    ) {
      return 'Please confirm your email address before signing in. Check your inbox for the confirmation email, and don\'t forget to check your spam folder if you don\'t see it.';
    }

    return error.message;
  };

  /**
   * Attempts login with email and password.
   */
  const handleLoginSubmit = async (values: LoginFormValues) => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (!error) {
        return;
      }

      const message = getLoginErrorMessage(error);
      console.error('Login failed:', error);
      setError('root', { message });
    } finally {
      setLoading(false);
    }
  };

  const eyeIconLabel = useMemo(
    () => (isPasswordVisible ? 'Hide password' : 'Show password'),
    [isPasswordVisible]
  );

  const handleTogglePasswordVisibility = () => {
    setIsPasswordVisible((previousValue) => !previousValue);
  };

  const handleSignUpPress = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <Text style={styles.logo}>₿</Text>
          <Text style={styles.title}>BTC Tracker</Text>
          <Text style={styles.subtitle}>Track your Bitcoin investments</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({
              field,
            }: {
              field: {
                onChange: (text: string) => void;
                onBlur: () => void;
                value: string;
              };
            }) => (
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={(text) => {
                  clearErrors('email');
                  clearErrors();
                  field.onChange(text);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            )}
          />
          {errors.email?.message ? (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          ) : null}

          <View style={styles.passwordRow}>
            <Controller
              control={control}
              name="password"
              render={({
                field,
              }: {
                field: {
                  onChange: (text: string) => void;
                  onBlur: () => void;
                  value: string;
                };
              }) => (
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={(text) => {
                    clearErrors('password');
                    clearErrors();
                    field.onChange(text);
                  }}
                  secureTextEntry={!isPasswordVisible}
                  editable={!loading}
                />
              )}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={handleTogglePasswordVisibility}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={eyeIconLabel}
              accessibilityHint="Toggles password visibility"
            >
              <Text style={styles.eyeIcon}>{isPasswordVisible ? '👁️' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password?.message ? (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          ) : null}
          {errors.root?.message ? (
            <Text style={styles.errorText}>{errors.root.message}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(handleLoginSubmit)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleSignUpPress}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F7931A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#FFF',
  },
  passwordRow: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 52,
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#F7931A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#999',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#F7931A',
    fontWeight: 'bold',
  },
});
