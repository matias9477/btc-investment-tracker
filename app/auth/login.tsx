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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
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

  const handleTogglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
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
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative Background Elements */}
          <View style={styles.glowCircle1} />
          <View style={styles.glowCircle2} />

          <View style={styles.header}>
            <LinearGradient
              colors={['#F7931A', '#FFAB40']}
              style={styles.logoContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="logo-bitcoin" size={48} color="#FFF" />
            </LinearGradient>
            <Text style={styles.title}>BTC Tracker</Text>
            <Text style={styles.subtitle}>Manage your Bitcoin portfolio</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'email' && styles.inputContainerFocused,
                  errors.email && styles.inputContainerError
                ]}>
                  <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? '#F7931A' : '#666'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#666"
                    value={field.value}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => {
                      setFocusedInput(null);
                      field.onBlur();
                    }}
                    onChangeText={(text) => {
                      clearErrors('email');
                      clearErrors('root');
                      field.onChange(text);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>
              )}
            />
            {errors.email?.message ? (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            ) : null}

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'password' && styles.inputContainerFocused,
                  errors.password && styles.inputContainerError,
                  { marginTop: errors.email ? 4 : 16 }
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? '#F7931A' : '#666'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={field.value}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => {
                      setFocusedInput(null);
                      field.onBlur();
                    }}
                    onChangeText={(text) => {
                      clearErrors('password');
                      clearErrors('root');
                      field.onChange(text);
                    }}
                    secureTextEntry={!isPasswordVisible}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={handleTogglePasswordVisibility}
                    disabled={loading}
                  >
                    <Ionicons 
                      name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password?.message ? (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            ) : null}
            
            {errors.root?.message ? (
              <View style={styles.rootErrorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.rootErrorText}>{errors.root.message}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.forgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(handleLoginSubmit)}
              disabled={loading}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={loading ? ['#555', '#444'] : ['#F7931A', '#E87D0D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
                {!loading && <Ionicons name="arrow-forward" size={20} color="#000" style={styles.buttonIcon} />}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUpPress} disabled={loading}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
  glowCircle1: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(247, 147, 26, 0.15)',
    transform: [{ scale: 2 }],
    opacity: 0.5,
    zIndex: 0,
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(247, 147, 26, 0.1)',
    transform: [{ scale: 2 }],
    opacity: 0.5,
    zIndex: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 1,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#F7931A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  form: {
    width: '100%',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputContainerFocused: {
    borderColor: '#F7931A',
    backgroundColor: '#1A1A1A',
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  rootErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  rootErrorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 16,
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#F7931A',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F7931A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#888',
    fontSize: 15,
  },
  footerLink: {
    color: '#F7931A',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
