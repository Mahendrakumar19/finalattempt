import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/content_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/app_logo.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutScreen extends ConsumerWidget {
  const AboutScreen({super.key});

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(settingsProvider);
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        scrolledUnderElevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: Text(
          'About Us',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
        ),
      ),
      body: Stack(
        children: [
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 180,
              height: 180,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFE8F1FF),
              ),
            ),
          ),
          settingsAsync.when(
            data: (s) => SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Center(
                    child: AppLogo(height: 80),
                  ),

                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'Final Attempt',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textPrimary),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Center(
                    child: Text(
                      'PREPARE • PRACTICE • SUCCEED',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryBlue, letterSpacing: 1.0),
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (s.aboutMission != null) _InfoCard(title: '🎯 Our Mission', content: s.aboutMission!),
                  if (s.aboutVision != null) _InfoCard(title: '🔭 Our Vision', content: s.aboutVision!),
                  if (s.contactAddress != null)
                    _ContactItem(icon: Icons.location_on_rounded, label: s.contactAddress!),
                  if (s.contactPhone != null)
                    _ContactItem(icon: Icons.phone_rounded, label: s.contactPhone!, onTap: () => _launch('tel:${s.contactPhone}')),
                  if (s.contactEmail != null)
                    _ContactItem(icon: Icons.email_rounded, label: s.contactEmail!, onTap: () => _launch('mailto:${s.contactEmail}')),
                  if (s.whatsappLink != null)
                    _ContactItem(icon: Icons.chat_rounded, label: 'WhatsApp Community', onTap: () => _launch(s.whatsappLink!)),
                  if (s.telegramLink != null)
                    _ContactItem(icon: Icons.telegram_rounded, label: 'Telegram Channel', onTap: () => _launch(s.telegramLink!)),
                ],
              ),
            ),
            loading: () => const LoadingShimmer(height: 400),
            error: (_, __) => const Center(child: Text('Failed to load', style: TextStyle(color: AppColors.textSecondary))),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final String content;
  const _InfoCard({required this.title, required this.content});

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary)),
          const SizedBox(height: 8),
          Text(content, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.6)),
        ],
      ),
    );
  }
}

class _ContactItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _ContactItem({required this.icon, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderCol),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.primaryBlue),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))),
            if (onTap != null) const Icon(Icons.open_in_new_rounded, size: 14, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

