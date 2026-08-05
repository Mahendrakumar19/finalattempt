import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/content_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

class AchieversScreen extends ConsumerWidget {
  const AchieversScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resultsAsync = ref.watch(resultsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Our Achievers')),
      body: resultsAsync.when(
        data: (results) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: results.length,
          itemBuilder: (_, i) {
            final r = results[i];
            return Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderColor),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 14),
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundColor: AppTheme.bgCardLight,
                        backgroundImage: r.resolvedPhoto.isNotEmpty
                            ? CachedNetworkImageProvider(r.resolvedPhoto)
                            : null,
                        child: r.resolvedPhoto.isEmpty
                            ? Text(r.name[0].toUpperCase(),
                                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.amber))
                            : null,
                      ),
                      if (r.rank != null)
                        Positioned(
                          bottom: 0, right: 0,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.amber,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('Rank ${r.rank}',
                              style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppTheme.bgDark),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Column(
                      children: [
                        Text(r.name, textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
                          maxLines: 2, overflow: TextOverflow.ellipsis,
                        ),
                        if (r.exam != null) ...[
                          const SizedBox(height: 4),
                          Text(r.exam!, textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 10, color: AppTheme.amber, fontWeight: FontWeight.w600),
                          ),
                        ],
                        if (r.service != null) ...[
                          const SizedBox(height: 2),
                          Text(r.service!, textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                          ),
                        ],
                        if (r.year != null) ...[
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.amber.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text('Batch ${r.year}',
                              style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppTheme.amber),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        loading: () => const LoadingGrid(),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
      ),
    );
  }
}
