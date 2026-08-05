import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/content_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
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

    return Scaffold(
      appBar: AppBar(title: const Text('About Us')),
      body: settingsAsync.when(
        data: (s) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 70, height: 70,
                  decoration: BoxDecoration(color: AppTheme.amber, borderRadius: BorderRadius.circular(18)),
                  child: const Center(
                    child: Text('FA', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppTheme.bgDark)),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Center(
                child: Text('Final Attempt',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
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
        error: (_, __) => const Center(child: Text('Failed to load', style: TextStyle(color: AppTheme.textMuted))),
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
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white)),
          const SizedBox(height: 8),
          Text(content, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.6)),
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
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderColor),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppTheme.amber),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
            if (onTap != null) const Icon(Icons.open_in_new_rounded, size: 14, color: AppTheme.textMuted),
          ],
        ),
      ),
    );
  }
}
