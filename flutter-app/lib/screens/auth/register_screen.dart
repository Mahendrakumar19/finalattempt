import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  String _targetExam = 'BPSC';
  bool _obscure = true;
  bool _agreeTerms = true;
  String? _errorMessage;

  static const _exams = ['BPSC', 'BSSC', 'UPPSC', 'MPPSC', 'JPSC', 'Other'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _mobileCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _errorMessage = null);
    if (!_formKey.currentState!.validate()) return;
    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please accept the Terms of Service & Privacy Policy to continue.'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    final error = await ref.read(authStateProvider.notifier).register(
      fullName: _nameCtrl.text.trim(),
      mobile: _mobileCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text,
      targetExam: _targetExam,
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
          // Content
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - 24.0,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Top Header Bar & Branding
                        Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
                                  onPressed: () => context.go('/login'),
                                ),
                                Row(
                                  children: [
                                    const Text(
                                      'Already have an account? ',
                                      style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5),
                                    ),
                                    GestureDetector(
                                      onTap: () => context.go('/login'),
                                      child: const Text(
                                        'Login',
                                        style: TextStyle(
                                          color: Color(0xFF0061FF),
                                          fontWeight: FontWeight.w800,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Image.asset(
                              'assets/images/logo_light.png',
                              height: 70,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return Image.asset(
                                  'assets/images/logo.png',
                                  height: 70,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Image.asset(
                                      'assets/images/favicon.png',
                                      height: 60,
                                      fit: BoxFit.contain,
                                    );
                                  },
                                );
                              },
                            ),
                            const SizedBox(height: 10),
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
                            const SizedBox(height: 24),
                            const Text.rich(
                              TextSpan(
                                children: [
                                  TextSpan(
                                    text: 'Create Your ',
                                    style: TextStyle(
                                      color: Color(0xFF0F172A),
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  TextSpan(
                                    text: 'Account',
                                    style: TextStyle(
                                      color: Color(0xFF0061FF),
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                              style: TextStyle(
                                fontSize: 30,
                                height: 1.2,
                                letterSpacing: -0.5,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Join thousands of aspirants and start your preparation journey.',
                              style: TextStyle(
                                fontSize: 13,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w400,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),

                        // Form Section
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 20.0),
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
                                  const SizedBox(height: 14),
                                ],

                                // Full Name Field
                                TextFormField(
                                  controller: _nameCtrl,
                                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                                  decoration: InputDecoration(
                                    labelText: 'Full Name',
                                    hintText: 'Enter your full name',
                                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                                    filled: true,
                                    fillColor: const Color(0xFFF8FAFC),
                                    prefixIcon: const Icon(Icons.person_outline_rounded, size: 20, color: Color(0xFF64748B)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter your full name' : null,
                                ),
                                const SizedBox(height: 14),

                                // Mobile Number Field
                                TextFormField(
                                  controller: _mobileCtrl,
                                  keyboardType: TextInputType.phone,
                                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                                  decoration: InputDecoration(
                                    labelText: 'Mobile Number',
                                    hintText: 'Enter your 10-digit mobile number',
                                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                                    filled: true,
                                    fillColor: const Color(0xFFF8FAFC),
                                    prefixIcon: const Icon(Icons.phone_outlined, size: 20, color: Color(0xFF64748B)),
                                    prefixText: '+91  ',
                                    prefixStyle: const TextStyle(color: Color(0xFF0F172A), fontSize: 14, fontWeight: FontWeight.w600),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                                  validator: (v) => (v == null || v.trim().length < 10) ? 'Enter a valid 10-digit mobile number' : null,
                                ),
                                const SizedBox(height: 14),

                                // Email Address Field
                                TextFormField(
                                  controller: _emailCtrl,
                                  keyboardType: TextInputType.emailAddress,
                                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                                  decoration: InputDecoration(
                                    labelText: 'Email Address',
                                    hintText: 'Enter your email address',
                                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                                    filled: true,
                                    fillColor: const Color(0xFFF8FAFC),
                                    prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20, color: Color(0xFF64748B)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                                  validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email address' : null,
                                ),
                                const SizedBox(height: 14),

                                // Target Exam Dropdown Field
                                DropdownButtonFormField<String>(
                                  initialValue: _targetExam,
                                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                                  dropdownColor: Colors.white,
                                  decoration: InputDecoration(
                                    labelText: 'Target Exam',
                                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                                    filled: true,
                                    fillColor: const Color(0xFFF8FAFC),
                                    prefixIcon: const Icon(Icons.school_outlined, size: 20, color: Color(0xFF64748B)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFF0061FF), width: 1.8),
                                    ),
                                  ),
                                  items: _exams.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                                  onChanged: (v) => setState(() => _targetExam = v ?? 'BPSC'),
                                ),
                                const SizedBox(height: 14),

                                // Create Password Field
                                TextFormField(
                                  controller: _passCtrl,
                                  obscureText: _obscure,
                                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                                  decoration: InputDecoration(
                                    labelText: 'Create a Password',
                                    hintText: 'Minimum 6 characters',
                                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
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
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                                  validator: (v) => (v == null || v.length < 6) ? 'Password must be at least 6 characters' : null,
                                ),
                                const SizedBox(height: 12),

                                // Terms Agreement Checkbox
                                Row(
                                  children: [
                                    SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: Checkbox(
                                        value: _agreeTerms,
                                        onChanged: (v) => setState(() => _agreeTerms = v ?? false),
                                        activeColor: const Color(0xFF0061FF),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    const Expanded(
                                      child: Text.rich(
                                        TextSpan(
                                          children: [
                                            TextSpan(text: 'I agree to the ', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                                            TextSpan(text: 'Terms of Service ', style: TextStyle(color: Color(0xFF0061FF), fontWeight: FontWeight.w600, fontSize: 12)),
                                            TextSpan(text: 'and ', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                                            TextSpan(text: 'Privacy Policy', style: TextStyle(color: Color(0xFF0061FF), fontWeight: FontWeight.w600, fontSize: 12)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),

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
                                                'Create Account',
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

                        // Footer Platform Branding
                        Column(
                          children: [
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

