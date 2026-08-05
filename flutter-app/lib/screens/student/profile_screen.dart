import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/storage_service.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/theme_provider.dart';

class StudentProfileScreen extends ConsumerWidget {
  const StudentProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storage = ref.read(storageServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 12),
            CircleAvatar(
              radius: 50,
              backgroundColor: AppTheme.amber.withOpacity(0.15),
              child: Text(
                (storage.getUserName() ?? 'A')[0].toUpperCase(),
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: AppTheme.amber),
              ),
            ),
            const SizedBox(height: 16),
            Text(storage.getUserName() ?? 'Aspirant',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text(storage.getUserEmail() ?? '',
              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.amber.withOpacity(0.3)),
              ),
              child: Text(
                (storage.getUserRole() ?? 'student').toUpperCase(),
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.amber, letterSpacing: 0.8),
              ),
            ),
            const SizedBox(height: 32),
            _ProfileItem(icon: Icons.email_rounded, label: 'Email', value: storage.getUserEmail() ?? '—'),
            _ProfileItem(icon: Icons.badge_rounded, label: 'User ID', value: storage.getUserId()?.substring(0, 8) ?? '—'),
            _ProfileItem(icon: Icons.school_rounded, label: 'Role', value: storage.getUserRole() ?? 'student'),
            const SizedBox(height: 16),
            
            // Theme preference section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderOf(context)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.palette_rounded, size: 18, color: AppTheme.amber),
                      const SizedBox(width: 10),
                      Text('App Appearance', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimaryOf(context))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Consumer(
                    builder: (context, ref, _) {
                      final currentMode = ref.watch(themeModeProvider);
                      return Row(
                        children: [
                          _ThemeOptionChip(
                            label: 'Dark',
                            icon: Icons.dark_mode_rounded,
                            selected: currentMode == ThemeMode.dark,
                            onTap: () => ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.dark),
                          ),
                          const SizedBox(width: 8),
                          _ThemeOptionChip(
                            label: 'Light',
                            icon: Icons.light_mode_rounded,
                            selected: currentMode == ThemeMode.light,
                            onTap: () => ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.light),
                          ),
                          const SizedBox(width: 8),
                          _ThemeOptionChip(
                            label: 'System',
                            icon: Icons.settings_brightness_rounded,
                            selected: currentMode == ThemeMode.system,
                            onTap: () => ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.system),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => context.go('/'),
                icon: const Icon(Icons.home_rounded, size: 16),
                label: const Text('Go to Home'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _ProfileItem({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderOf(context)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.amber),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
          const Spacer(),
          Text(value, style: TextStyle(fontSize: 13, color: AppTheme.textPrimaryOf(context), fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _ThemeOptionChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _ThemeOptionChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppTheme.amber : AppTheme.cardBgLightOf(context),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? AppTheme.amber : AppTheme.borderOf(context),
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 18,
                color: selected ? AppTheme.darkBg : AppTheme.textSecondaryOf(context),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: selected ? AppTheme.darkBg : AppTheme.textSecondaryOf(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
