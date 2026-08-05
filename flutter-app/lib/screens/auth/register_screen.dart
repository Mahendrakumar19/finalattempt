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

  static const _exams = ['BPSC', 'UPSC', 'UPPSC', 'MPPSC', 'JPSC', 'Other'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _mobileCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppTheme.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Create Account', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white)),
              const SizedBox(height: 4),
              Text('Start your preparation journey today',
                style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.5)),
              ),
              const SizedBox(height: 28),
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _nameCtrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: Icon(Icons.person_rounded, size: 18, color: AppTheme.textMuted),
                      ),
                      validator: (v) => (v == null || v.isEmpty) ? 'Enter your full name' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _mobileCtrl,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Mobile Number',
                        prefixIcon: Icon(Icons.phone_rounded, size: 18, color: AppTheme.textMuted),
                        prefixText: '+91 ',
                        prefixStyle: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                      ),
                      validator: (v) => (v == null || v.length < 10) ? 'Enter valid mobile number' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Email Address',
                        prefixIcon: Icon(Icons.email_rounded, size: 18, color: AppTheme.textMuted),
                      ),
                      validator: (v) => (v == null || !v.contains('@')) ? 'Enter valid email' : null,
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      value: _targetExam,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      dropdownColor: AppTheme.bgCard,
                      decoration: const InputDecoration(
                        labelText: 'Target Exam',
                        prefixIcon: Icon(Icons.school_rounded, size: 18, color: AppTheme.textMuted),
                      ),
                      items: _exams.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                      onChanged: (v) => setState(() => _targetExam = v ?? 'BPSC'),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _passCtrl,
                      obscureText: _obscure,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_rounded, size: 18, color: AppTheme.textMuted),
                        suffixIcon: IconButton(
                          icon: Icon(_obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                            size: 18, color: AppTheme.textMuted),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (v) => (v == null || v.length < 6) ? 'Minimum 6 characters' : null,
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: authState.isLoading ? null : _submit,
                        child: authState.isLoading
                            ? const SizedBox(
                                width: 20, height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.bgDark),
                              )
                            : const Text('Create Account', style: TextStyle(fontSize: 15)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Already have an account? ', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: const Text('Sign In', style: TextStyle(color: AppTheme.amber, fontWeight: FontWeight.w800, fontSize: 13)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
