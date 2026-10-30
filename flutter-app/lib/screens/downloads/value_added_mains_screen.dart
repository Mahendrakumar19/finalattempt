import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/downloads_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/apple_pressable.dart';

class ValueAddedMainsScreen extends ConsumerStatefulWidget {
  const ValueAddedMainsScreen({super.key});

  @override
  ConsumerState<ValueAddedMainsScreen> createState() => _ValueAddedMainsScreenState();
}

class _ValueAddedMainsScreenState extends ConsumerState<ValueAddedMainsScreen> {
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  Future<void> _openFile(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final docsAsync = ref.watch(valueAddedMainsProvider);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final borderCol = AppTheme.borderOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/'),
        ),
        title: Text(
          'Value Added Materials — Mains',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
        ),
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: cardBg,
            child: Container(
              height: 42,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: borderCol),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
                style: TextStyle(fontSize: 13, color: textPrimary),
                decoration: InputDecoration(
                  hintText: 'Search Supreme Court judgments, data points...',
                  hintStyle: TextStyle(fontSize: 12, color: textMuted),
                  prefixIcon: Icon(Icons.search, size: 18, color: textMuted),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear, size: 16, color: textMuted),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ),
          const Divider(height: 1),

          // Mains Documents List
          Expanded(
            child: docsAsync.when(
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 5,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, __) => const LoadingShimmer(height: 80),
              ),
              error: (err, _) => Center(
                child: Text('Unable to load materials: $err', style: TextStyle(color: textMuted)),
              ),
              data: (docs) {
                var filtered = docs.where((d) {
                  if (_searchQuery.isNotEmpty) {
                    final title = d.title.toLowerCase();
                    final desc = (d.description ?? '').toLowerCase();
                    return title.contains(_searchQuery) || desc.contains(_searchQuery);
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.lightbulb_outline_rounded, size: 48, color: Color(0xFFA855F7)),
                        const SizedBox(height: 12),
                        Text('No Mains materials available right now', style: TextStyle(color: textMuted, fontSize: 13)),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  physics: const BouncingScrollPhysics(),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, idx) {
                    final item = filtered[idx];
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderCol),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFFA855F7).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.lightbulb_rounded, color: Color(0xFFA855F7), size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFA855F7).withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'MAINS ENRICHMENT',
                                        style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFFA855F7)),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      item.fileType ?? 'PDF',
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textMuted),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.title,
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (item.description != null && item.description!.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    item.description!,
                                    style: TextStyle(fontSize: 11, color: textMuted),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          ApplePressable(
                            onTap: () {
                              if (item.fileUrl != null && item.fileUrl!.isNotEmpty) {
                                _openFile(item.fileUrl!);
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('File download coming soon!')),
                                );
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFA855F7),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.download_rounded, color: Colors.white, size: 16),
                                  SizedBox(width: 4),
                                  Text(
                                    'Download',
                                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
