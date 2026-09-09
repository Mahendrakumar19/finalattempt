import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../widgets/app_logo.dart';
import '../../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _scaleAnim = Tween<double>(begin: 0.92, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;
    // Check auth state: Go to Login if not authenticated
    final isLoggedIn = ref.read(authStateProvider).isLoggedIn;
    if (isLoggedIn) {
      context.go('/');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accentCircleRadius = (screenSize.width * 0.75).clamp(300.0, 700.0);
    final logoHeight = (screenSize.height * 0.1).clamp(64.0, 96.0);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      body: Stack(
        children: [
          // Top-left pale blue organic accent
          Positioned(
            top: -accentCircleRadius * 0.45,
            left: -accentCircleRadius * 0.35,
            child: Container(
              width: accentCircleRadius,
              height: accentCircleRadius,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE8F1FF),
              ),
            ),
          ),
          // Bottom-right pale blue organic accent
          Positioned(
            bottom: -accentCircleRadius * 0.45,
            right: -accentCircleRadius * 0.35,
            child: Container(
              width: accentCircleRadius,
              height: accentCircleRadius,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEBF3FF),
              ),
            ),
          ),
          // Responsive Content Area
          SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 24.0),
                  child: FadeTransition(
                    opacity: _fadeAnim,
                    child: ScaleTransition(
                      scale: _scaleAnim,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Spacer(flex: 2),

                          // 1. Logo & Sub-branding
                          AppLogo(height: logoHeight),
                          const SizedBox(height: 16),
                          Text(
                            'PREPARE  •  PRACTICE  •  SUCCEED',
                            style: TextStyle(
                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF5B708B),
                              fontSize: (screenSize.width * 0.025).clamp(10.0, 12.0),
                              fontWeight: FontWeight.w600,
                              letterSpacing: 2.4,
                            ),
                            textAlign: TextAlign.center,
                          ),

                          const Spacer(flex: 2),

                          // 2. Main Hero Tagline
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Same Aspirations',
                                style: TextStyle(
                                  color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF4A5568),
                                  fontSize: (screenSize.height * 0.028).clamp(20.0, 26.0),
                                  fontWeight: FontWeight.w400,
                                  letterSpacing: 0.1,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 6),
                              Text.rich(
                                TextSpan(
                                  children: [
                                    TextSpan(
                                      text: 'Stronger ',
                                      style: TextStyle(
                                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const TextSpan(
                                      text: 'You',
                                      style: TextStyle(
                                        color: Color(0xFF0061FF),
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ],
                                ),
                                style: TextStyle(
                                  fontSize: (screenSize.height * 0.042).clamp(30.0, 40.0),
                                  height: 1.2,
                                  letterSpacing: -0.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),

                          const Spacer(flex: 2),

                          // 3. Progress Indicator
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const SizedBox(
                                width: 36,
                                height: 36,
                                child: CircularProgressIndicator(
                                  strokeWidth: 3.0,
                                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF0061FF)),
                                  backgroundColor: Color(0xFFE2E8F0),
                                ),
                              ),
                              const SizedBox(height: 14),
                              Text(
                                'Loading...',
                                style: TextStyle(
                                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),

                          const Spacer(flex: 2),

                          // 4. Platform Branding Footer
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                "INDIA'S COMPETITIVE EXAM",
                                style: TextStyle(
                                  color: isDark ? const Color(0xFF64748B) : const Color(0xFF64748B),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 1.8,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'PREPARATION PLATFORM',
                                style: TextStyle(
                                  color: isDark ? const Color(0xFF64748B) : const Color(0xFF64748B),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 1.8,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 12),
                              Container(
                                width: 44,
                                height: 4,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0061FF),
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

