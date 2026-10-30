import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/downloads_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/apple_pressable.dart';

class NcertBooksScreen extends ConsumerStatefulWidget {
  const NcertBooksScreen({super.key});

  @override
  ConsumerState<NcertBooksScreen> createState() => _NcertBooksScreenState();
}

class _NcertBooksScreenState extends ConsumerState<NcertBooksScreen> {
  String _selectedSubject = 'ALL';
  String _selectedClass = 'ALL';
  final String _selectedLanguage = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _subjects = [
    'ALL',
    'History',
    'Geography',
    'Polity',
    'Economics',
    'Science',
    'Sociology',
  ];

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

  @override
  Widget build(BuildContext context) {
    final booksAsync = ref.watch(ncertBooksProvider);
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
          'NCERT Textbooks (Class 6–12)',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
        ),
      ),
      body: Column(
        children: [
          // Filter & Search Header
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
                      hintText: 'Search NCERT book title or subject...',
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
                // Subjects horizontal scroll
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: _subjects.map((sub) {
                      final isSelected = _selectedSubject == sub;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(sub == 'ALL' ? 'All Subjects' : sub),
                          selected: isSelected,
                          onSelected: (_) => setState(() => _selectedSubject = sub),
                          selectedColor: const Color(0xFF10B981),
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
                const SizedBox(height: 6),
                // Class horizontal scroll
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: _classes.map((cls) {
                      final isSelected = _selectedClass == cls;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ActionChip(
                          label: Text(cls == 'ALL' ? 'All Classes' : 'Class $cls'),
                          onPressed: () => setState(() => _selectedClass = cls),
                          backgroundColor: isSelected
                              ? const Color(0xFF3B82F6)
                              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                          labelStyle: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            color: isSelected ? Colors.white : textPrimary,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
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

          // Books Grid
          Expanded(
            child: booksAsync.when(
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 6,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, __) => const LoadingShimmer(height: 75),
              ),
              error: (err, _) => Center(
                child: Text('Unable to load NCERT books: $err', style: TextStyle(color: textMuted)),
              ),
              data: (books) {
                var filtered = books.where((b) {
                  if (_selectedSubject != 'ALL' && b.subject.toLowerCase() != _selectedSubject.toLowerCase()) {
                    return false;
                  }
                  if (_selectedClass != 'ALL' && b.classLevel.toString() != _selectedClass) {
                    return false;
                  }
                  if (_selectedLanguage != 'ALL' && b.language.toLowerCase() != _selectedLanguage.toLowerCase()) {
                    return false;
                  }
                  if (_searchQuery.isNotEmpty) {
                    final title = b.title.toLowerCase();
                    final sub = b.subject.toLowerCase();
                    final bookName = b.bookName.toLowerCase();
                    return title.contains(_searchQuery) || sub.contains(_searchQuery) || bookName.contains(_searchQuery);
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.menu_book_rounded, size: 48, color: Color(0xFF10B981)),
                        const SizedBox(height: 12),
                        Text('No NCERT books match your filter', style: TextStyle(color: textMuted, fontSize: 13)),
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
                              color: const Color(0xFF10B981).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.auto_stories_rounded, color: Color(0xFF10B981), size: 24),
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
                                        color: const Color(0xFF10B981).withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'CLASS ${item.classLevel} • ${item.subject.toUpperCase()}',
                                        style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
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
                                color: const Color(0xFF10B981),
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
