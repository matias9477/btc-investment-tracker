import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

const { width } = Dimensions.get('window');

const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

/**
 * Sign up screen for creating new accounts
 */
export default function SignUpScreen() {
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  const handleSignUpSubmit = async (values: SignupFormValues) => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      Alert.alert(
        'Account Created',
        'We\'ve sent you a confirmation email. Please check your inbox and click the confirmation link to activate your account.\n\nIf you don\'t see the email, please check your spam folder.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      console.error('Sign up failed:', error);
      setError('root', { message: error.message || 'Failed to create account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.back();
  };

  /** Triggers Google OAuth flow and surfaces any errors in the form UI. */
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Google sign-in failed. Please try again.',
      });
    }
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking your Bitcoin investments</Text>
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
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
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

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'confirmPassword' && styles.inputContainerFocused,
                  errors.confirmPassword && styles.inputContainerError,
                  { marginTop: errors.password ? 4 : 16 }
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'confirmPassword' ? '#F7931A' : '#666'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#666"
                    value={field.value}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => {
                      setFocusedInput(null);
                      field.onBlur();
                    }}
                    onChangeText={(text) => {
                      clearErrors('confirmPassword');
                      clearErrors('root');
                      field.onChange(text);
                    }}
                    secureTextEntry={!isConfirmPasswordVisible}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    disabled={loading}
                  >
                    <Ionicons 
                      name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword?.message ? (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            ) : null}
            
            {errors.root?.message ? (
              <View style={styles.rootErrorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.rootErrorText}>{errors.root.message}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(handleSignUpSubmit)}
              disabled={loading}
              style={[styles.buttonWrapper, { marginTop: 32 }]}
            >
              <LinearGradient
                colors={loading ? ['#555', '#444'] : ['#F7931A', '#E87D0D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
                {!loading && <Ionicons name="arrow-forward" size={20} color="#000" style={styles.buttonIcon} />}
              </LinearGradient>
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={[styles.googleButton, (loading || googleLoading) && styles.googleButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#FFF" style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLoginPress} disabled={loading || googleLoading}>
                <Text style={styles.footerLink}>Sign In</Text>
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
    textAlign: 'center',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  dividerText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
