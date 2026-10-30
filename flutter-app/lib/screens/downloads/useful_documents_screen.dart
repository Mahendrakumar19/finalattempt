import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/downloads_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/apple_pressable.dart';
import '../../widgets/apple_sheet.dart';
import '../../models/downloads_model.dart';

class UsefulDocumentsScreen extends ConsumerStatefulWidget {
  const UsefulDocumentsScreen({super.key});

  @override
  ConsumerState<UsefulDocumentsScreen> createState() => _UsefulDocumentsScreenState();
}

class _UsefulDocumentsScreenState extends ConsumerState<UsefulDocumentsScreen> {
  String _selectedCategory = 'ALL';
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

  void _showDocumentSheet(BuildContext context, DownloadItemModel item) {
    AppleSheet.show(
      context: context,
      initialChildSize: 0.52,
      builder: (sheetContext) {
        final textPrimary = AppTheme.textPrimaryOf(sheetContext);
        final textMuted = AppTheme.textMutedOf(sheetContext);

        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.description_rounded, color: Color(0xFFF59E0B), size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.title,
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            if (item.language != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                margin: const EdgeInsets.only(right: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  item.language!.toUpperCase(),
                                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF3B82F6)),
                                ),
                              ),
                            Text(
                              'Format: ${item.fileType ?? "PDF"}',
                              style: TextStyle(fontSize: 11, color: textMuted, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (item.description != null && item.description!.isNotEmpty) ...[
                Text(
                  'About Document',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  item.description!,
                  style: TextStyle(fontSize: 12.5, color: textMuted, height: 1.4),
                ),
                const SizedBox(height: 20),
              ],
              SizedBox(
                width: double.infinity,
                child: ApplePressable(
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    if (item.fileUrl != null && item.fileUrl!.isNotEmpty) {
                      _openFile(item.fileUrl!);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.download_rounded, color: Colors.white, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Download PDF Document',
                          style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final docsAsync = ref.watch(usefulDocumentsProvider);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final borderCol = AppTheme.borderOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppleFrostedAppBar(
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/'),
        ),
        title: Text(
          'Useful Documents & Notes',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
        ),
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            color: cardBg,
            child: Column(
              children: [
                Container(
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
                      hintText: 'Search documents, revision notes...',
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
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: ['ALL', 'Bilingual', 'English', 'Hindi'].map((cat) {
                      final isSelected = _selectedCategory == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(cat == 'ALL' ? 'All Types' : cat),
                          selected: isSelected,
                          onSelected: (_) => setState(() => _selectedCategory = cat),
                          selectedColor: const Color(0xFFF59E0B),
                          backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          labelStyle: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : textPrimary,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          side: BorderSide(color: isSelected ? Colors.transparent : borderCol),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Documents List
          Expanded(
            child: docsAsync.when(
              loading: () => const ListSkeleton(count: 6, itemHeight: 84),
              error: (err, _) => Center(
                child: Text('Unable to load documents: $err', style: TextStyle(color: textMuted)),
              ),
              data: (docs) {
                var filtered = docs.where((d) {
                  if (_selectedCategory != 'ALL' && d.language != null && d.language != _selectedCategory) {
                    return false;
                  }
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
                        Icon(Icons.folder_open_rounded, size: 48, color: textMuted),
                        const SizedBox(height: 12),
                        Text('No documents found in this section', style: TextStyle(color: textMuted, fontSize: 13)),
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
                    return ApplePressable(
                      onTap: () => _showDocumentSheet(context, item),
                      scaleDown: 0.98,
                      child: Container(
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
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.description_rounded, color: Color(0xFFF59E0B), size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    if (item.language != null)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          item.language!.toUpperCase(),
                                          style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF3B82F6)),
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
                                  const SnackBar(content: Text('File download link coming soon!')),
                                );
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B),
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
