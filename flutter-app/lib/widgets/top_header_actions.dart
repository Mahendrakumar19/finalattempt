import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../core/theme/app_theme.dart';

class TopHeaderActions extends ConsumerWidget {
  const TopHeaderActions({super.key});

  void _showLanguageSelector(BuildContext context, WidgetRef ref, String currentLang) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.cardBgOf(context),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Icon(Icons.language_rounded, color: AppTheme.primaryBlue, size: 22),
                  SizedBox(width: 10),
                  Text(
                    'Select Application Language',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDarkPrimary),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Choose your preferred language for study materials and interface.',
                style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),

              // English Option
              _LanguageOptionTile(
                title: 'English',
                subtitle: 'Default language',
                code: 'en',
                isSelected: currentLang == 'en',
                onTap: () {
                  ref.read(appLanguageProvider.notifier).setLanguage('en');
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Language set to English'), duration: Duration(seconds: 1)),
                  );
                },
              ),
              const SizedBox(height: 8),

              // Hindi Option
              _LanguageOptionTile(
                title: 'हिंदी (Hindi)',
                subtitle: 'हिंदी माध्यम',
                code: 'hi',
                isSelected: currentLang == 'hi',
                onTap: () {
                  ref.read(appLanguageProvider.notifier).setLanguage('hi');
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('भाषा हिंदी में बदली गई (Language set to Hindi)'), duration: Duration(seconds: 1)),
                  );
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final currentLang = ref.watch(appLanguageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final userName = (authState.userName != null && authState.userName!.isNotEmpty)
        ? authState.userName!.split(' ').first
        : 'User';

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 1. Dark/Light Theme Toggle Button
        IconButton(
          tooltip: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
          icon: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
            child: Icon(
              isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
              key: ValueKey(isDark),
              color: isDark ? const Color(0xFFF59E0B) : AppTheme.primaryBlue,
              size: 20,
            ),
          ),
          onPressed: () {
            ref.read(themeModeProvider.notifier).toggleTheme();
          },
        ),

        const SizedBox(width: 4),

        // 2. Language Change Button
        InkWell(
          onTap: () => _showLanguageSelector(context, ref, currentLang),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlue.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.primaryBlue.withValues(alpha: 0.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.language_rounded, color: AppTheme.primaryBlue, size: 14),
                const SizedBox(width: 4),
                Text(
                  currentLang == 'hi' ? 'हिंदी' : 'EN',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(width: 4),

        // 4. User Account / Settings Button
        if (authState.isLoggedIn)
          PopupMenuButton<String>(
            tooltip: 'User Settings & Profile',
            offset: const Offset(0, 42),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            onSelected: (val) {
              if (val == 'chat') {
                context.push('/chat');
              } else if (val == 'profile') {
                context.push('/student/profile');
              } else if (val == 'dashboard') {
                context.push('/student/dashboard');
              } else if (val == 'logout') {
                ref.read(authStateProvider.notifier).logout();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Logged out successfully')),
                );
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'chat',
                child: Row(
                  children: [
                    Icon(Icons.chat_bubble_outline_rounded, size: 18, color: AppTheme.primaryBlue),
                    SizedBox(width: 10),
                    Text('Mentorship Chat', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    const Icon(Icons.person_outline_rounded, size: 18, color: AppTheme.primaryBlue),
                    const SizedBox(width: 10),
                    Text('Profile & Settings ($userName)', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'dashboard',
                child: Row(
                  children: [
                    Icon(Icons.dashboard_outlined, size: 18, color: AppTheme.primaryBlue),
                    SizedBox(width: 10),
                    Text('Student Dashboard', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout_rounded, size: 18, color: Colors.red),
                    SizedBox(width: 10),
                    Text('Logout', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.red)),
                  ],
                ),
              ),
            ],
            child: CircleAvatar(
              radius: 17,
              backgroundColor: AppTheme.primaryBlue,
              child: Text(
                userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          )
        else
          ElevatedButton.icon(
            onPressed: () => context.push('/login'),
            icon: const Icon(Icons.login_rounded, size: 14),
            label: const Text('Sign In'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
      ],
    );
  }
}

class _LanguageOptionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String code;
  final bool isSelected;
  final VoidCallback onTap;

  const _LanguageOptionTile({
    required this.title,
    required this.subtitle,
    required this.code,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryBlue.withValues(alpha: 0.08) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryBlue : AppTheme.borderOf(context),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? AppTheme.primaryBlue : AppTheme.textPrimaryOf(context),
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
              ],
            ),
            if (isSelected)
              const Icon(Icons.check_circle_rounded, color: AppTheme.primaryBlue, size: 20),
          ],
        ),
      ),
    );
  }
}
