import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  String? _errorMessage;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _errorMessage = null);
    if (!_formKey.currentState!.validate()) return;
    
    final error = await ref.read(authStateProvider.notifier).login(
      _emailCtrl.text.trim(),
      _passCtrl.text,
    );
    if (!mounted) return;
    if (error == null) {
      context.go('/student/dashboard');
    } else {
      setState(() {
        _errorMessage = error;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final screenSize = MediaQuery.of(context).size;
    final accentCircleRadius = screenSize.width * 0.75;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Top-right pale blue organic accent
          Positioned(
            top: -accentCircleRadius * 0.45,
            right: -accentCircleRadius * 0.35,
            child: Container(
              width: accentCircleRadius,
              height: accentCircleRadius,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFE8F1FF),
              ),
            ),
          ),
          // Bottom-left pale blue organic accent
          Positioned(
            bottom: -accentCircleRadius * 0.45,
            left: -accentCircleRadius * 0.35,
            child: Container(
              width: accentCircleRadius,
              height: accentCircleRadius,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFEBF3FF),
              ),
            ),
          ),
          // Content Scroll
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - 32.0,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Top Header & Branding
                        Column(
                          children: [
                            const SizedBox(height: 12),
                            Image.asset(
                              'assets/images/logo_light.png',
                              height: 76,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return Image.asset(
                                  'assets/images/logo.png',
                                  height: 76,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Image.asset(
                                      'assets/images/favicon.png',
                                      height: 64,
                                      fit: BoxFit.contain,
                                    );
                                  },
                                );
                              },
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'PREPARE  •  PRACTICE  •  SUCCEED',
                              style: TextStyle(
                                color: Color(0xFF5B708B),
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 2.4,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 32),
                            const Text.rich(
                              TextSpan(
                                children: [
                                  TextSpan(
                                    text: 'Welcome ',
                                    style: TextStyle(
                                      color: Color(0xFF0F172A),
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  TextSpan(
                                    text: 'Back',
                                    style: TextStyle(
                                      color: Color(0xFF0061FF),
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                              style: TextStyle(
                                fontSize: 32,
                                height: 1.2,
                                letterSpacing: -0.5,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Log in to continue your preparation journey.',
                              style: TextStyle(
                                fontSize: 13.5,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w400,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),

                        // Form Fields Section
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24.0),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (_errorMessage != null) ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEF2F2),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: const Color(0xFFFCA5A5)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 18),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            _errorMessage!,
                                            style: const TextStyle(color: Color(0xFF991B1B), fontSize: 12.5),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],

                                // Email or Mobile Field
                                TextFormField(
                                  controller: _emailCtrl,
                                  keyboardType: TextInputType.emailAddress,
                                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14.5),
                                  decoration: InputDecoration(
                                    labelText: 'Email Address / Mobile',
                                    hintText: 'Enter your email or mobile number',
                                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
                                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13.5),
                                    filled: true,
                                    fillColor: const Color(0xFFF8FAFC),
                                    prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20, color: Color(0xFF64748B)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFF0061FF), width: 1.8),
                                    ),
                                    errorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFEF4444)),
                                    ),
                                    focusedErrorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.8),
                                    ),
                                  ),
                                  validator: (v) => (v == null || v.trim().isEmpty)
                                      ? 'Please enter your email or mobile'
                                      : null,
                                ),
                                const SizedBox(height: 18),

                                // Password Field
                                TextFormField(
                                  controller: _passCtrl,
                                  obscureText: _obscure,
                                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14.5),
                                  decoration: InputDecoration(
                                    labelText: 'Password',
                                    hintText: 'Enter your password',
                                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
                                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13.5),
                                    filled: true,
                                    fillColor: const Color(0xFFF8FAFC),
                                    prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20, color: Color(0xFF64748B)),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                        size: 20,
                                        color: const Color(0xFF64748B),
                                      ),
                                      onPressed: () => setState(() => _obscure = !_obscure),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFF0061FF), width: 1.8),
                                    ),
                                    errorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFEF4444)),
                                    ),
                                    focusedErrorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.8),
                                    ),
                                  ),
                                  validator: (v) => (v == null || v.length < 6)
                                      ? 'Password must be at least 6 characters'
                                      : null,
                                ),
                                const SizedBox(height: 8),

                                // Forgot Password Link
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Please contact support or register a new account.'),
                                          duration: Duration(seconds: 3),
                                        ),
                                      );
                                    },
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: const Text(
                                      'Forgot Password?',
                                      style: TextStyle(
                                        color: Color(0xFF0061FF),
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 24),

                                // Primary CTA Button
                                SizedBox(
                                  height: 52,
                                  child: ElevatedButton(
                                    onPressed: authState.isLoading ? null : _submit,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0061FF),
                                      foregroundColor: Colors.white,
                                      disabledBackgroundColor: const Color(0xFF93C5FD),
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                    ),
                                    child: authState.isLoading
                                        ? const SizedBox(
                                            width: 22,
                                            height: 22,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.5,
                                              color: Colors.white,
                                            ),
                                          )
                                        : const Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                'Log In',
                                                style: TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                              SizedBox(width: 8),
                                              Icon(Icons.arrow_forward_rounded, size: 18),
                                            ],
                                          ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Bottom Registration & Footer
                        Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text(
                                  "Don't have an account? ",
                                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13.5),
                                ),
                                GestureDetector(
                                  onTap: () => context.go('/register'),
                                  child: const Text(
                                    'Sign Up',
                                    style: TextStyle(
                                      color: Color(0xFF0061FF),
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: () => context.go('/'),
                              child: const Text(
                                'Continue as Guest →',
                                style: TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              "INDIA'S COMPETITIVE EXAM",
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.8,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'PREPARATION PLATFORM',
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.8,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 10),
                            Container(
                              width: 44,
                              height: 4,
                              decoration: BoxDecoration(
                                color: const Color(0xFF0061FF),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(height: 4),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}


