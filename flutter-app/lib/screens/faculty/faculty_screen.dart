import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/content_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

class FacultyScreen extends ConsumerWidget {
  const FacultyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final facultyAsync = ref.watch(facultyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Our Faculty')),
      body: facultyAsync.when(
        data: (faculty) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.82,
          ),
          itemCount: faculty.length,
          itemBuilder: (_, i) {
            final f = faculty[i];
            return Container(
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderColor),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppTheme.bgCardLight,
                    backgroundImage: f.resolvedAvatar.isNotEmpty
                        ? CachedNetworkImageProvider(f.resolvedAvatar)
                        : null,
                    child: f.resolvedAvatar.isEmpty
                        ? Text(f.name[0].toUpperCase(),
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.amber))
                        : null,
                  ),
                  const SizedBox(height: 10),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Column(
                      children: [
                        Text(f.name, textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
                          maxLines: 2, overflow: TextOverflow.ellipsis,
                        ),
                        if (f.role != null) ...[
                          const SizedBox(height: 4),
                          Text(f.role!, textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 10, color: AppTheme.amber, fontWeight: FontWeight.w600),
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        if (f.experience != null) ...[
                          const SizedBox(height: 4),
                          Text(f.experience!, textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
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
