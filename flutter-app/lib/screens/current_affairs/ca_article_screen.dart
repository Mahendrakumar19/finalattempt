import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:go_router/go_router.dart';
import 'package:html/parser.dart' as html_parser;
import '../../providers/current_affairs_provider.dart';
import '../../models/current_affair_model.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

class _ArticleSectionItem {
  final String id;
  final String title;
  final String content;
  final bool highlight;
  final GlobalKey key;

  _ArticleSectionItem({
    required this.id,
    required this.title,
    required this.content,
    this.highlight = false,
    required this.key,
  });
}

class CAArticleScreen extends ConsumerStatefulWidget {
  final String slug;
  final String lang;

  const CAArticleScreen({super.key, required this.slug, this.lang = 'en'});

  @override
  ConsumerState<CAArticleScreen> createState() => _CAArticleScreenState();
}

class _CAArticleScreenState extends ConsumerState<CAArticleScreen> {
  late String _activeLang;
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _summaryKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _activeLang = widget.lang;
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToKey(GlobalKey key) {
    final ctx = key.currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
        alignment: 0.05,
      );
    }
  }

  List<_ArticleSectionItem> _buildSections(CurrentAffairArticleModel article) {
    final sections = <_ArticleSectionItem>[];

    void addSec(String? raw, String title, String id, {bool highlight = false}) {
      if (raw == null || raw.trim().isEmpty) return;
      final clean = _stripDuplicateTitle(raw, article.title, title, article.coverImageUrl);
      if (clean.trim().isNotEmpty) {
        sections.add(_ArticleSectionItem(
          id: id,
          title: title,
          content: clean,
          highlight: highlight,
          key: GlobalKey(),
        ));
      }
    }

    // 1. Detailed Analysis
    addSec(article.content, '📄 Detailed Analysis', 'detailed-analysis');

    // 2. Sub-headings from content if present, or modular fields
    addSec(article.whyInNews, '📢 Why in News?', 'why-in-news');
    addSec(article.context, '📌 Context & Background', 'context');
    addSec(article.keyHighlights, '🔑 Key Points', 'key-points');
    addSec(article.background, '📖 Background', 'background');
    addSec(article.importantFacts, '💡 Important Facts for Prelims', 'important-facts');
    addSec(article.examRelevance, '📝 Exam Relevance (GS / Mains)', 'exam-relevance', highlight: true);
    addSec(article.previousContext, '⏳ Historical Context', 'previous-context');
    addSec(article.wayForward, '🚀 Way Forward', 'way-forward');
    addSec(article.keyTakeaways, '🎯 Key Takeaways', 'key-takeaways');

    return sections;
  }

  // Parse H2/H3 headings inside HTML content for rich in-content table of contents
  List<String> _extractHtmlHeadings(String htmlContent) {
    try {
      final doc = html_parser.parse(htmlContent);
      final headings = doc.querySelectorAll('h1, h2, h3, h4');
      return headings
          .map((h) => h.text.trim())
          .where((t) => t.isNotEmpty && t.length > 2)
          .take(12)
          .toList();
    } catch (_) {
      return [];
    }
  }

  void _showTableOfContentsModal(BuildContext context, CurrentAffairArticleModel article, List<_ArticleSectionItem> sections) {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    // Also extract internal headings if any exist
    final htmlHeadings = article.content != null ? _extractHtmlHeadings(article.content!) : <String>[];

    showModalBottomSheet(
      context: context,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      isScrollControlled: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.60,
          minChildSize: 0.35,
          maxChildSize: 0.88,
          expand: false,
          builder: (_, sheetScrollController) {
            return Column(
              children: [
                // Top Grab Bar
                Container(
                  margin: const EdgeInsets.only(top: 10, bottom: 8),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.menu_book_rounded, color: AppColors.primaryOf(context), size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Table of Contents (Index)',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: textPrimary,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Expanded(
                  child: ListView(
                    controller: sheetScrollController,
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Overview / Summary item
                      if (article.summary.isNotEmpty) ...[
                        InkWell(
                          onTap: () {
                            Navigator.pop(ctx);
                            _scrollToKey(_summaryKey);
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: Theme.of(context).brightness == Brightness.dark
                                  ? const Color(0xFF1E293B)
                                  : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: borderCol),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryOf(context).withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '#00',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.primaryOf(context),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'Executive Summary / Overview',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textPrimary),
                                  ),
                                ),
                                Icon(Icons.arrow_forward_ios, size: 12, color: AppTheme.textSecondaryOf(context)),
                              ],
                            ),
                          ),
                        ),
                      ],

                      // Major Sections
                      ...sections.asMap().entries.map((entry) {
                        final idx = entry.key + 1;
                        final sec = entry.value;
                        return InkWell(
                          onTap: () {
                            Navigator.pop(ctx);
                            _scrollToKey(sec.key);
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: Theme.of(context).brightness == Brightness.dark
                                  ? const Color(0xFF1E293B)
                                  : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: sec.highlight ? AppColors.primaryOf(context).withValues(alpha: 0.5) : borderCol,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: (sec.highlight ? const Color(0xFFF43F5E) : AppColors.primaryOf(context))
                                        .withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '#${idx.toString().padLeft(2, '0')}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      color: sec.highlight ? const Color(0xFFF43F5E) : AppColors.primaryOf(context),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    sec.title,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: textPrimary,
                                    ),
                                  ),
                                ),
                                Icon(Icons.arrow_forward_ios, size: 12, color: AppTheme.textSecondaryOf(context)),
                              ],
                            ),
                          ),
                        );
                      }),

                      // Subtopics inside analysis
                      if (htmlHeadings.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Padding(
                          padding: const EdgeInsets.only(left: 4, bottom: 8),
                          child: Text(
                            'Topics & Headings Covered',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondaryOf(context)),
                          ),
                        ),
                        ...htmlHeadings.map((hText) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(top: 5, right: 8),
                                  child: Container(
                                    width: 5,
                                    height: 5,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: AppColors.primaryOf(context),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    hText,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textSecondaryOf(context),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final articleAsync = ref.watch(caArticleProvider((slug: widget.slug, lang: _activeLang)));
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
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
              context.go('/current-affairs');
            }
          },
        ),
        title: Text(
          'Current Affairs Analysis',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
        ),
        actions: [
          // Language Switcher (ENG / हिंदी)
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildLangBtn('en', 'ENG'),
                _buildLangBtn('hi', 'हिंदी'),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: articleAsync.maybeWhen(
        data: (article) {
          if (article == null) return null;
          final sections = _buildSections(article);
          return FloatingActionButton.extended(
            onPressed: () => _showTableOfContentsModal(context, article, sections),
            backgroundColor: AppColors.primaryOf(context),
            foregroundColor: Colors.white,
            elevation: 4,
            icon: const Icon(Icons.menu_book_rounded, size: 18),
            label: const Text(
              'Index',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 0.3),
            ),
          );
        },
        orElse: () => null,
      ),
      body: articleAsync.when(
        data: (article) {
          if (article == null) {
            return const Center(child: Text('Article not found', style: TextStyle(color: AppColors.textMuted)));
          }

          final category = article.category.toUpperCase();
          final categoryColor = category == 'BIHAR'
              ? const Color(0xFF10B981)
              : category == 'INTERNATIONAL'
                  ? const Color(0xFF3B82F6)
                  : (category == 'EDITORIAL' || category == 'EDITORIALS' || category == 'MAINS')
                      ? const Color(0xFFF43F5E)
                      : (category == 'ARUNACHAL')
                          ? const Color(0xFF10B981)
                          : AppColors.primaryBlue;

          final sections = _buildSections(article);

          return SingleChildScrollView(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Tag Bar & Quick Table of Contents Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: categoryColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: categoryColor.withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            category,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: categoryColor,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Theme.of(context).brightness == Brightness.dark
                                ? const Color(0xFF1E293B)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${article.importance} importance',
                            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                    // Quick Index Button
                    GestureDetector(
                      onTap: () => _showTableOfContentsModal(context, article, sections),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.primaryOf(context).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.primaryOf(context).withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.list_alt_rounded, size: 14, color: AppColors.primaryOf(context)),
                            const SizedBox(width: 4),
                            Text(
                              'Index (${sections.length})',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryOf(context),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Main Article Title
                Text(
                  article.title,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: textPrimary,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 8),

                // Reading time & publication date
                Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(article.readingTime, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    if (article.publishedDate.isNotEmpty) ...[
                      const SizedBox(width: 12),
                      const Icon(Icons.calendar_today_rounded, size: 13, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(article.publishedDate, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ],
                ),
                Divider(height: 24, color: borderCol),

                // Featured Cover Image (matching website article view)
                if (article.coverImageUrl != null && article.coverImageUrl!.isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                      aspectRatio: 16 / 9,
                      child: Image.network(
                        article.coverImageUrl!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Summary / Context Box
                if (article.summary.isNotEmpty) ...[
                  Container(
                    key: _summaryKey,
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderCol),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.lightbulb_outline_rounded, size: 16, color: AppColors.primaryOf(context)),
                            const SizedBox(width: 6),
                            Text(
                              'Overview',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primaryOf(context)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          article.summary,
                          style: TextStyle(fontSize: 13, color: AppTheme.textSecondaryOf(context), height: 1.6),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // All Dynamic Article Sections (with GlobalKeys for accurate scroll jumping)
                ...sections.map((sec) {
                  return Container(
                    key: sec.key,
                    margin: const EdgeInsets.only(bottom: 4),
                    child: _Section(
                      title: sec.title,
                      content: sec.content,
                      highlight: sec.highlight,
                    ),
                  );
                }),

                // Tags
                if (article.tags.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: article.tags.map((t) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: borderCol),
                      ),
                      child: Text('#$t', style: TextStyle(fontSize: 10, color: AppTheme.textSecondaryOf(context), fontWeight: FontWeight.w600)),
                    )).toList(),
                  ),
                ],
                const SizedBox(height: 110), // Padding to clear bottom FAB and dock
              ],
            ),
          );
        },
        loading: () => const LoadingShimmer(height: 500),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
      ),
    );
  }

  Widget _buildLangBtn(String code, String label) {
    final isSel = _activeLang == code;
    return GestureDetector(
      onTap: () => setState(() => _activeLang = code),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSel ? AppColors.primaryBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: isSel ? Colors.white : AppColors.primaryBlue,
          ),
        ),
      ),
    );
  }

  String _stripDuplicateTitle(String htmlContent, String articleTitle, [String? sectionName, String? coverImageUrl]) {
    String text = htmlContent.trim();

    // 0. Sanitize single-letter vertical breaks & escapes
    text = text
        .replaceAll(r'\r\n', ' ')
        .replaceAll(r'\n', ' ')
        .replaceAll(r'\r', ' ')
        .replaceAll(r'\t', ' ')
        .replaceAll(r'\"', '"')
        .replaceAll(r"\'", "'")
        .replaceAll(r'\\', r'\');

    // Remove duplicate cover image from HTML
    if (coverImageUrl != null && coverImageUrl.isNotEmpty) {
      final uri = Uri.tryParse(coverImageUrl);
      if (uri != null && uri.pathSegments.isNotEmpty) {
        final filename = uri.pathSegments.last;
        final escaped = RegExp.escape(filename);
        text = text.replaceAll(RegExp("<img[^>]+(src|data-src|data-lazy-src)=[\"'][^\"']*$escaped[^\"']*[\"'][^>]*>", caseSensitive: false), '');
      }
    }

    text = text
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&amp;', '&')
        .replaceAll('&nbsp;', ' ');

    text = text.replaceAllMapped(
      RegExp(r'([A-Za-z0-9\u0900-\u097F])\s*<br\s*/?>\s*([A-Za-z0-9\u0900-\u097F])', caseSensitive: false),
      (m) => '${m[1]} ${m[2]}',
    );

    String clean(String s) {
      return s.replaceAll(RegExp(r'<[^>]*>'), '')
              .replaceAll('&nbsp;', ' ')
              .replaceAll(RegExp(r'[\r\n\t]+'), ' ')
              .replaceAll(RegExp(r'[^\w\s\u0900-\u097F]'), '')
              .toLowerCase()
              .trim();
    }

    final artTitleClean = clean(articleTitle);
    final secNameClean = sectionName != null ? clean(sectionName) : '';

    bool isDuplicateHeader(String tagHtml) {
      final innerText = clean(tagHtml);
      if (innerText.isEmpty) return false;

      if (artTitleClean.isNotEmpty && (innerText.contains(artTitleClean) || artTitleClean.contains(innerText))) {
        return true;
      }

      String secName = secNameClean;
      if (secName.contains('detailed analysis')) secName = 'detailed analysis';
      if (secName.contains('why in news')) secName = 'why in news';
      if (secName.contains('context')) secName = 'context';
      if (secName.contains('key points')) secName = 'key points';
      if (secName.contains('background')) secName = 'background';
      if (secName.contains('important facts')) secName = 'important facts';
      if (secName.contains('exam relevance')) secName = 'exam relevance';
      if (secName.contains('way forward')) secName = 'way forward';
      if (secName.contains('key takeaways')) secName = 'key takeaways';

      if (secName.isNotEmpty && (innerText.contains(secName) || secName.contains(innerText))) {
        return true;
      }

      const commonHeaders = [
        'why in news',
        'in news',
        'context',
        'background',
        'detailed analysis',
        'analysis',
        'key highlights',
        'key points',
        'important facts',
        'exam relevance',
        'way forward',
        'key takeaways',
        'खबरों में क्यों',
        'चर्चा में क्यों',
        'विस्तृत विश्लेषण',
        'विश्लेषण',
        'संदर्भ',
        'पृष्ठभूमि',
        'मुख्य बिंदु',
        'महत्वपूर्ण तथ्य',
        'आगे की राह',
      ];

      for (final h in commonHeaders) {
        if (innerText.contains(h)) {
          return true;
        }
      }
      return false;
    }

    // 1. Check leading <h1..6> tag
    RegExp hReg = RegExp(r'^\s*<h[1-6][^>]*>(.*?)</h[1-6]>', caseSensitive: false, dotAll: true);
    Match? hMatch = hReg.firstMatch(text);
    if (hMatch != null && isDuplicateHeader(hMatch.group(1)!)) {
      text = text.substring(hMatch.end).trim();
    }

    // 2. Check leading <p><strong>...</strong></p> or <p><b>...</b></p> tag
    RegExp pReg = RegExp(r'^\s*<p[^>]*>\s*<(strong|b)[^>]*>(.*?)</\1>\s*</p>', caseSensitive: false, dotAll: true);
    Match? pMatch = pReg.firstMatch(text);
    if (pMatch != null && isDuplicateHeader(pMatch.group(2)!)) {
      text = text.substring(pMatch.end).trim();
    }

    return text;
  }
}

class _Section extends StatelessWidget {
  final String title;
  final String content;
  final bool highlight;
  const _Section({required this.title, required this.content, this.highlight = false});

  @override
  Widget build(BuildContext context) {
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textSecondary = AppTheme.textSecondaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary)),
          const SizedBox(height: 8),
        ],
        Html(
          data: content,
          extensions: [
            TagExtension(
              tagsToExtend: {'img'},
              builder: (extensionContext) {
                String? src = extensionContext.attributes['src'];
                if (src == null || src.isEmpty || src.startsWith('data:image/')) {
                  src = extensionContext.attributes['data-src'] ?? 
                        extensionContext.attributes['data-lazy-src'] ?? 
                        extensionContext.attributes['data-orig-file'];
                }
                if (src == null || src.isEmpty) return const SizedBox.shrink();
                String resolvedUrl = src.trim().replaceAll(r'\"', '').replaceAll(r'"', '');
                if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
                  if (resolvedUrl.startsWith('/')) {
                    resolvedUrl = 'https://finalattemptias.com$resolvedUrl';
                  } else {
                    resolvedUrl = 'https://finalattemptias.com/$resolvedUrl';
                  }
                }
                return Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(vertical: 10),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      resolvedUrl,
                      width: double.infinity,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                );
              },
            ),
          ],
          style: {
            'html': Style(
              margin: Margins.zero,
              padding: HtmlPaddings.zero,
            ),
            'body': Style(
              color: textSecondary,
              fontSize: FontSize(14),
              lineHeight: const LineHeight(1.6),
              margin: Margins.zero,
              padding: HtmlPaddings.zero,
            ),
            'div': Style(
              margin: Margins.zero,
              padding: HtmlPaddings.zero,
            ),
            'span': Style(
              fontSize: FontSize(14),
              lineHeight: const LineHeight(1.6),
            ),
            'p': Style(
              fontSize: FontSize(14),
              lineHeight: const LineHeight(1.6),
              color: textSecondary,
              margin: Margins.only(bottom: 10),
            ),
            'h1': Style(fontSize: FontSize(18), fontWeight: FontWeight.w800, color: textPrimary, margin: Margins.only(top: 8, bottom: 8)),
            'h2': Style(fontSize: FontSize(16), fontWeight: FontWeight.w800, color: textPrimary, margin: Margins.only(top: 8, bottom: 8)),
            'h3': Style(fontSize: FontSize(15), fontWeight: FontWeight.w700, color: textPrimary, margin: Margins.only(top: 6, bottom: 6)),
            'strong': Style(color: textPrimary, fontWeight: FontWeight.w700),
            'b': Style(color: textPrimary, fontWeight: FontWeight.w700),
            'ul': Style(padding: HtmlPaddings.only(left: 16), margin: Margins.only(bottom: 10)),
            'ol': Style(padding: HtmlPaddings.only(left: 16), margin: Margins.only(bottom: 10)),
            'li': Style(color: textSecondary, fontSize: FontSize(13.5), lineHeight: const LineHeight(1.5), margin: Margins.only(bottom: 4)),
            'table': Style(
              border: Border.all(color: borderCol, width: 1),
              margin: Margins.only(top: 8, bottom: 8),
            ),
            'td': Style(padding: HtmlPaddings.all(8), border: Border.all(color: borderCol, width: 0.5)),
            'th': Style(padding: HtmlPaddings.all(8), backgroundColor: borderCol.withValues(alpha: 0.3), fontWeight: FontWeight.bold),
          },
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
