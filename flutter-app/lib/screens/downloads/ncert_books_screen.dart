import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/downloads_provider.dart';
import '../../models/downloads_model.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/apple_pressable.dart';

class NcertBooksScreen extends ConsumerStatefulWidget {
  const NcertBooksScreen({super.key});

  @override
  ConsumerState<NcertBooksScreen> createState() => _NcertBooksScreenState();
}

class _NcertBooksScreenState extends ConsumerState<NcertBooksScreen> {
  String _modalClassFilter = 'ALL';
  String _modalLanguageFilter = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _classes = ['ALL', '6', '7', '8', '9', '10', '11', '12'];

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

  void _openSubjectVault(BuildContext context, String subject, Color subjectColor) {
    setState(() {
      _modalClassFilter = 'ALL';
      _modalLanguageFilter = 'ALL';
      _searchQuery = '';
      _searchController.clear();
    });
    _showSubjectVaultModal(context, subject, subjectColor);
  }

  void _showSubjectVaultModal(BuildContext context, String subject, Color subjectColor) {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final borderCol = AppTheme.borderOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            final booksAsync = ref.watch(ncertBooksProvider);

            return Container(
              height: MediaQuery.of(context).size.height * 0.88,
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Drag Handle
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: subjectColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.menu_book_rounded, color: subjectColor, size: 22),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$subject NCERT Vault',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: textPrimary,
                                  ),
                                ),
                                Text(
                                  'Class 6 to 12 Textbook PDFs (Hindi & English)',
                                  style: TextStyle(fontSize: 11, color: textMuted),
                                ),
                              ],
                            ),
                          ],
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          icon: Icon(Icons.close_rounded, color: textMuted),
                        ),
                      ],
                    ),
                  ),
                  Divider(height: 20, color: borderCol),

                  // Filters inside Modal
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        // Search Box
                        Container(
                          height: 40,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: borderCol),
                          ),
                          child: TextField(
                            controller: _searchController,
                            onChanged: (val) {
                              setModalState(() {
                                _searchQuery = val.trim().toLowerCase();
                              });
                            },
                            style: TextStyle(fontSize: 13, color: textPrimary),
                            decoration: InputDecoration(
                              hintText: 'Search $subject books...',
                              hintStyle: TextStyle(fontSize: 12, color: textMuted),
                              prefixIcon: Icon(Icons.search, size: 18, color: textMuted),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),

                        // Class Level Filter Chips (All Classes, Class 6 to 12)
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: _classes.map((cls) {
                              final isSel = _modalClassFilter == cls;
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: InkWell(
                                  onTap: () {
                                    setModalState(() {
                                      _modalClassFilter = cls;
                                    });
                                  },
                                  borderRadius: BorderRadius.circular(14),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: isSel ? subjectColor : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: isSel ? subjectColor : borderCol),
                                    ),
                                    child: Text(
                                      cls == 'ALL' ? 'All Classes' : 'Class $cls',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                                        color: isSel ? Colors.white : textPrimary,
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Language Toggle Filter (All, Hindi, English)
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: [
                              {'val': 'ALL', 'label': 'All Mediums'},
                              {'val': 'Hindi', 'label': 'Hindi Medium'},
                              {'val': 'English', 'label': 'English Medium'},
                            ].map((lang) {
                              final isSel = _modalLanguageFilter == lang['val'];
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: InkWell(
                                  onTap: () {
                                    setModalState(() {
                                      _modalLanguageFilter = lang['val']!;
                                    });
                                  },
                                  borderRadius: BorderRadius.circular(14),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isSel
                                          ? (isDark ? Colors.white : const Color(0xFF0F172A))
                                          : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: isSel ? Colors.transparent : borderCol),
                                    ),
                                    child: Text(
                                      lang['label']!,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                                        color: isSel ? (isDark ? Colors.black : Colors.white) : textPrimary,
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Divider(height: 1, color: borderCol),

                  // Books List
                  Expanded(
                    child: booksAsync.when(
                      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
                      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
                      data: (books) {
                        // Filter books by this subject
                        var subjectBooks = books.where((b) => b.subject.toLowerCase() == subject.toLowerCase()).toList();

                        // Filter by class
                        if (_modalClassFilter != 'ALL') {
                          subjectBooks = subjectBooks.where((b) => b.classLevel.toString() == _modalClassFilter).toList();
                        }

                        // Filter by language
                        if (_modalLanguageFilter != 'ALL') {
                          subjectBooks = subjectBooks.where((b) => b.language.toLowerCase() == _modalLanguageFilter.toLowerCase()).toList();
                        }

                        // Filter by search query
                        if (_searchQuery.isNotEmpty) {
                          subjectBooks = subjectBooks.where((b) {
                            final title = b.title.toLowerCase();
                            final bookName = b.bookName.toLowerCase();
                            return title.contains(_searchQuery) || bookName.contains(_searchQuery);
                          }).toList();
                        }

                        if (subjectBooks.isEmpty) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.menu_book_rounded, size: 48, color: textMuted),
                                  const SizedBox(height: 10),
                                  Text('No NCERT Books Found', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textPrimary)),
                                  const SizedBox(height: 4),
                                  Text('Try clearing the class or language filter.', style: TextStyle(fontSize: 11, color: textMuted)),
                                ],
                              ),
                            ),
                          );
                        }

                        return ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          physics: const BouncingScrollPhysics(),
                          itemCount: subjectBooks.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, idx) {
                            final item = subjectBooks[idx];
                            return _buildBookRow(context, item, subjectColor, cardBg, borderCol, textPrimary, textMuted, isDark);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildBookRow(
    BuildContext context,
    NCERTBookModel item,
    Color subjectColor,
    Color cardBg,
    Color borderCol,
    Color textPrimary,
    Color textMuted,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderCol),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: subjectColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.auto_stories_rounded, color: subjectColor, size: 24),
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
                        color: subjectColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'CLASS ${item.classLevel} • ${item.subject.toUpperCase()}',
                        style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: subjectColor),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      item.language,
                      style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: textMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  item.title.isNotEmpty ? item.title : item.bookName,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
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
                  const SnackBar(content: Text('Free PDF textbook opening...')),
                );
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: subjectColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.download_rounded, color: Colors.white, size: 16),
                  SizedBox(width: 4),
                  Text(
                    'PDF',
                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final booksAsync = ref.watch(ncertBooksProvider);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Palette for subjects matching website
    final subjectPalettes = <String, Color>{
      'history': const Color(0xFFD97706),
      'geography': const Color(0xFF2563EB),
      'polity': const Color(0xFF10B981),
      'economics': const Color(0xFF7C3AED),
      'science': const Color(0xFF0D9488),
      'sociology': const Color(0xFFF43F5E),
      'environment': const Color(0xFF059669),
    };

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
          'NCERT Textbooks (Class 6–12)',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
        ),
      ),
      body: booksAsync.when(
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 4,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, __) => const LoadingShimmer(height: 110),
        ),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Unable to load NCERT books: $err', style: TextStyle(color: textMuted)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(ncertBooksProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (books) {
          // Group books by subject
          final Map<String, List<NCERTBookModel>> grouped = {};
          for (final b in books) {
            final subName = b.subject.trim();
            final key = subName.isEmpty ? 'General' : subName;
            grouped.putIfAbsent(key, () => []).add(b);
          }

          final sortedSubjects = grouped.keys.toList()
            ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Vault Banner
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [const Color(0xFF064E3B), const Color(0xFF022C22)]
                          : [const Color(0xFFD1FAE5), const Color(0xFFA7F3D0)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: const Color(0xFF10B981).withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.school_rounded, color: Color(0xFF059669), size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'NCERT Subject Vaults',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white : const Color(0xFF065F46),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Select a subject folder below to browse and download Class 6th to 12th textbook PDFs in Hindi & English.',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.white70 : const Color(0xFF047857),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Section Title
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Subject Folders (${sortedSubjects.length})',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${books.length} Total Books',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // SUBJECT FOLDER CARDS (Matching website colorful cards)
                ...sortedSubjects.map((sub) {
                  final subBooks = grouped[sub] ?? [];
                  final subKey = sub.toLowerCase();
                  final subjectColor = subjectPalettes[subKey] ?? const Color(0xFF10B981);

                  // Extract available classes for this subject
                  final availableClasses = subBooks.map((b) => b.classLevel).toSet().toList()..sort();
                  final hindiCount = subBooks.where((b) => b.language.toLowerCase() == 'hindi').length;
                  final englishCount = subBooks.where((b) => b.language.toLowerCase() == 'english').length;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: subjectColor.withValues(alpha: 0.3),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ApplePressable(
                      scaleDown: 0.98,
                      onTap: () => _openSubjectVault(context, sub, subjectColor),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                // Subject Icon Box
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: subjectColor.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: subjectColor.withValues(alpha: 0.25)),
                                  ),
                                  child: Center(
                                    child: Icon(Icons.folder_rounded, color: subjectColor, size: 26),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        sub,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w800,
                                          color: textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        '${subBooks.length} Textbook PDFs Available',
                                        style: TextStyle(fontSize: 12, color: textMuted, fontWeight: FontWeight.w500),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(Icons.arrow_forward_ios_rounded, size: 14, color: textMuted),
                              ],
                            ),
                            const SizedBox(height: 14),
                            const Divider(height: 1),
                            const SizedBox(height: 10),

                            // Tags Row (Class levels and languages)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    if (availableClasses.isNotEmpty)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: subjectColor.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          'Class ${availableClasses.first}th - ${availableClasses.last}th',
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: subjectColor),
                                        ),
                                      ),
                                    const SizedBox(width: 6),
                                    if (hindiCount > 0 && englishCount > 0)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF6366F1).withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Text(
                                          'Hindi & English',
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF6366F1)),
                                        ),
                                      ),
                                  ],
                                ),
                                Text(
                                  'Explore &rarr;',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: subjectColor),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          );
        },
      ),
    );
  }
}

