import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/current_affairs_provider.dart';
import '../../models/current_affair_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/top_header_actions.dart';

class CurrentAffairsScreen extends ConsumerStatefulWidget {
  const CurrentAffairsScreen({super.key});

  @override
  ConsumerState<CurrentAffairsScreen> createState() => _CurrentAffairsScreenState();
}

class _CurrentAffairsScreenState extends ConsumerState<CurrentAffairsScreen> {
  DateTime _focusedMonth = DateTime.now();
  DateTime? _selectedDate;
  String _selectedCategory = 'ALL';
  String _activeLang = 'en';
  bool _isCalendarExpanded = false; // Default collapsed for clean view
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<Map<String, String>> _categories = [
    {'key': 'ALL', 'label': 'All Topics'},
    {'key': 'NATIONAL', 'label': 'National'},
    {'key': 'INTERNATIONAL', 'label': 'International'},
    {'key': 'BIHAR', 'label': 'Bihar Special'},
    {'key': 'EDITORIAL', 'label': 'Editorials & Mains'},
    {'key': 'ARUNACHAL', 'label': 'Arunachal'},
  ];

  static const List<String> _monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  List<int> get _yearsList {
    final currentYr = DateTime.now().year;
    return List.generate(7, (i) => currentYr - i);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _resetAllFilters() {
    setState(() {
      _selectedDate = null;
      _selectedCategory = 'ALL';
      _searchQuery = '';
      _searchController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = ref.watch(appLocalizationsProvider);
    final editionsAsync = ref.watch(caEditionsProvider(_activeLang));
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final borderCol = AppTheme.borderOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
              context.go('/');
            }
          },
        ),
        title: Text(
          loc.tr('daily_current_affairs'),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: textPrimary,
          ),
        ),
        actions: [
          // Language Switcher Pill (ENG / हिन्दी)
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.08) : AppColors.lightBlueBackground,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: borderCol),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildLanguageButton('en', 'ENG'),
                _buildLanguageButton('hi', 'हिन्दी'),
              ],
            ),
          ),
          const TopHeaderActions(),
          const SizedBox(width: 8),
        ],
      ),
      body: editionsAsync.when(
        data: (editions) {
          // Build set of available published dates
          final Map<String, CurrentAffairEditionModel> editionsByDate = {};
          final List<String> sortedAvailableDates = [];
          for (final ed in editions) {
            if (ed.publishDate.isNotEmpty) {
              editionsByDate[ed.publishDate] = ed;
              if (!sortedAvailableDates.contains(ed.publishDate)) {
                sortedAvailableDates.add(ed.publishDate);
              }
            }
          }
          sortedAvailableDates.sort((a, b) => b.compareTo(a));

          // Collect and filter articles based on date, topic category, and search query
          List<CurrentAffairArticleModel> allAvailableArticles = [];
          if (_selectedDate != null) {
            final dateStr = _formatDateKey(_selectedDate!);
            final matchEd = editionsByDate[dateStr];
            if (matchEd != null) {
              allAvailableArticles = matchEd.articles;
            }
          } else {
            // Flatten all articles
            for (final ed in editions) {
              allAvailableArticles.addAll(ed.articles);
            }
          }

          List<CurrentAffairArticleModel> filteredArticles = allAvailableArticles.where((art) {
            // Category filter
            if (_selectedCategory != 'ALL') {
              final cat = art.category.toUpperCase();
              if (_selectedCategory == 'EDITORIAL') {
                final isEd = cat == 'EDITORIAL' || cat == 'EDITORIALS' || cat == 'MAINS';
                if (!isEd) return false;
              } else if (cat != _selectedCategory) {
                return false;
              }
            }

            // Search query filter
            if (_searchQuery.isNotEmpty) {
              final q = _searchQuery.toLowerCase();
              final matchesTitle = art.title.toLowerCase().contains(q);
              final matchesSummary = art.summary.toLowerCase().contains(q);
              final matchesCat = art.category.toLowerCase().contains(q);
              final matchesTags = art.tags.any((t) => t.toLowerCase().contains(q));
              if (!matchesTitle && !matchesSummary && !matchesCat && !matchesTags) {
                return false;
              }
            }

            return true;
          }).toList();

          final hasActiveFilters = _selectedDate != null || _selectedCategory != 'ALL' || _searchQuery.isNotEmpty;

          return CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // 1. Featured Header / Hero Banner matching website
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0F172A), Color(0xFF1E3A8A), Color(0xFF1D4ED8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1E3A8A).withValues(alpha: 0.25),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'UPDATED DAILY',
                                style: TextStyle(
                                  color: Color(0xFF34D399),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.1,
                                ),
                              ),
                            ],
                          ),
                          // Index / Table of Contents quick action
                          GestureDetector(
                            onTap: () => _showIndexModal(context, filteredArticles),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.format_list_bulleted_rounded, size: 14, color: Colors.white),
                                  const SizedBox(width: 5),
                                  Text(
                                    'Index (${filteredArticles.length})',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Daily News & Editorial Analysis',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Comprehensive coverage for BPSC, UPSC, and State PCS Exams',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Search bar
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                        ),
                        child: TextField(
                          controller: _searchController,
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                          decoration: InputDecoration(
                            isDense: true,
                            hintText: 'Search by topic, keyword, SEBI, Bihar...',
                            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 12),
                            prefixIcon: const Icon(Icons.search, size: 18, color: Colors.white70),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.close, size: 16, color: Colors.white),
                                    onPressed: () {
                                      setState(() {
                                        _searchController.clear();
                                        _searchQuery = '';
                                      });
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                          ),
                          onChanged: (val) {
                            setState(() {
                              _searchQuery = val.trim();
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 2. Calendar Header Card with Month & Year Dropdowns (Collapsible)
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: borderCol),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Month & Year Dropdowns Bar
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
                        child: Row(
                          children: [
                            Icon(Icons.calendar_month_rounded, size: 20, color: AppColors.primaryOf(context)),
                            const SizedBox(width: 8),

                            // Month Dropdown Menu
                            DropdownButtonHideUnderline(
                              child: DropdownButton<int>(
                                value: _focusedMonth.month,
                                icon: Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: AppColors.primaryOf(context)),
                                dropdownColor: cardBg,
                                borderRadius: BorderRadius.circular(14),
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: textPrimary,
                                ),
                                items: List.generate(12, (mIdx) {
                                  return DropdownMenuItem<int>(
                                    value: mIdx + 1,
                                    child: Text(
                                      _monthsList[mIdx],
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: textPrimary,
                                      ),
                                    ),
                                  );
                                }),
                                onChanged: (newMonth) {
                                  if (newMonth != null) {
                                    setState(() {
                                      _focusedMonth = DateTime(_focusedMonth.year, newMonth, 1);
                                    });
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 4),

                            // Year Dropdown Menu
                            DropdownButtonHideUnderline(
                              child: DropdownButton<int>(
                                value: _focusedMonth.year,
                                icon: Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: AppColors.primaryOf(context)),
                                dropdownColor: cardBg,
                                borderRadius: BorderRadius.circular(14),
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: textPrimary,
                                ),
                                items: _yearsList.map((yr) {
                                  return DropdownMenuItem<int>(
                                    value: yr,
                                    child: Text(
                                      '$yr',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: textPrimary,
                                      ),
                                    ),
                                  );
                                }).toList(),
                                onChanged: (newYear) {
                                  if (newYear != null) {
                                    setState(() {
                                      _focusedMonth = DateTime(newYear, _focusedMonth.month, 1);
                                    });
                                  }
                                },
                              ),
                            ),

                            const Spacer(),

                            if (_selectedDate != null)
                              GestureDetector(
                                onTap: () => setState(() => _selectedDate = null),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  margin: const EdgeInsets.only(right: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryBlue.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(Icons.close, size: 12, color: AppColors.primaryOf(context)),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Reset Date',
                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primaryOf(context)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                            // Calendar grid toggle expand/collapse button
                            IconButton(
                              icon: Icon(
                                _isCalendarExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                size: 22,
                                color: AppColors.primaryOf(context),
                              ),
                              tooltip: _isCalendarExpanded ? 'Collapse Calendar' : 'Expand Calendar',
                              onPressed: () {
                                setState(() => _isCalendarExpanded = !_isCalendarExpanded);
                              },
                            ),
                          ],
                        ),
                      ),

                      // Collapsible Calendar Grid
                      if (_isCalendarExpanded) ...[
                        const Divider(height: 1),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          child: _buildCalendarGrid(context, editionsByDate),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 12)),

              // 3. Category Filter Bar (Top Filters Horizontal Scroll)
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 38,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _categories.length,
                    itemBuilder: (context, i) {
                      final cat = _categories[i];
                      final isSel = _selectedCategory == cat['key'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(cat['label']!),
                          selected: isSel,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _selectedCategory = cat['key']!);
                            }
                          },
                          selectedColor: AppColors.primaryBlue,
                          backgroundColor: cardBg,
                          side: BorderSide(
                            color: isSel ? AppColors.primaryBlue : borderCol,
                          ),
                          labelStyle: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isSel ? Colors.white : textPrimary,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                      );
                    },
                  ),
                ),
              ),

              // 4. Active Filters Bar
              if (hasActiveFilters)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const Text(
                          'Active:',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                        ),
                        if (_selectedDate != null)
                          Chip(
                            label: Text('Date: ${_formatDateKey(_selectedDate!)}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                            deleteIcon: const Icon(Icons.close, size: 12),
                            onDeleted: () => setState(() => _selectedDate = null),
                            visualDensity: VisualDensity.compact,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                          ),
                        if (_selectedCategory != 'ALL')
                          Chip(
                            label: Text('Topic: $_selectedCategory', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                            deleteIcon: const Icon(Icons.close, size: 12),
                            onDeleted: () => setState(() => _selectedCategory = 'ALL'),
                            visualDensity: VisualDensity.compact,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                          ),
                        if (_searchQuery.isNotEmpty)
                          Chip(
                            label: Text('Search: "$_searchQuery"', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                            deleteIcon: const Icon(Icons.close, size: 12),
                            onDeleted: () {
                              setState(() {
                                _searchController.clear();
                                _searchQuery = '';
                              });
                            },
                            visualDensity: VisualDensity.compact,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                          ),
                        TextButton(
                          onPressed: _resetAllFilters,
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text('Clear All', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFEF4444))),
                        ),
                      ],
                    ),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 10)),

              // 5. Section Header & Quick Table of Contents / Index Button
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(
                            _selectedDate != null
                                ? 'Articles for ${_formatDateKey(_selectedDate!)}'
                                : 'All Articles',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primaryOf(context).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${filteredArticles.length} items',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryOf(context)),
                            ),
                          ),
                        ],
                      ),
                      // View Index action button
                      InkWell(
                        onTap: () => _showIndexModal(context, filteredArticles),
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                          child: Row(
                            children: [
                              Icon(Icons.list_alt_rounded, size: 15, color: AppColors.primaryOf(context)),
                              const SizedBox(width: 4),
                              Text(
                                'Topic Index',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryOf(context),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 6. Articles List
              if (filteredArticles.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.article_outlined, size: 48, color: AppColors.textMuted),
                          const SizedBox(height: 12),
                          Text(
                            _selectedDate != null
                                ? 'No current affairs published on ${_formatDateKey(_selectedDate!)}'
                                : 'No articles match your search or filter',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            onPressed: _resetAllFilters,
                            icon: const Icon(Icons.refresh, size: 16),
                            label: const Text('Reset All Filters'),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        final article = filteredArticles[i];
                        return _ArticleCard(
                          article: article,
                          lang: _activeLang,
                          indexNumber: i + 1,
                        );
                      },
                      childCount: filteredArticles.length,
                    ),
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 90)),
            ],
          );
        },
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 5,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, __) => const LoadingShimmer(height: 80),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: $e', style: const TextStyle(color: AppColors.error)),
              const SizedBox(height: 10),
              ElevatedButton(
                onPressed: () => ref.invalidate(caEditionsProvider(_activeLang)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageButton(String code, String label) {
    final isSel = _activeLang == code;
    return GestureDetector(
      onTap: () {
        if (_activeLang != code) {
          setState(() {
            _activeLang = code;
          });
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(
          color: isSel ? AppColors.primaryBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: isSel ? Colors.white : AppColors.primaryOf(context),
          ),
        ),
      ),
    );
  }

  // Table of Contents / Index Modal Sheet
  void _showIndexModal(BuildContext context, List<CurrentAffairArticleModel> articles) {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      isScrollControlled: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.65,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (_, scrollController) {
            return Column(
              children: [
                // Handle bar
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
                          Icon(Icons.format_list_numbered_rounded, color: AppColors.primaryOf(context), size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Topics Index (${articles.length})',
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
                  child: articles.isEmpty
                      ? const Center(
                          child: Text('No articles available in index.', style: TextStyle(color: AppColors.textMuted)),
                        )
                      : ListView.separated(
                          controller: scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: articles.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (ctx, idx) {
                            final art = articles[idx];
                            return InkWell(
                              onTap: () {
                                Navigator.pop(ctx);
                                context.push('/current-affairs/article/${art.slug}?lang=$_activeLang');
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).brightness == Brightness.dark
                                      ? const Color(0xFF1E293B)
                                      : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: borderCol),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.primaryOf(context).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        '${idx + 1}',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: AppColors.primaryOf(context),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            art.title,
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                              color: textPrimary,
                                              height: 1.3,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              Text(
                                                art.category,
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppColors.primaryOf(context),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                art.publishedDate.isNotEmpty ? art.publishedDate : 'Today',
                                                style: TextStyle(fontSize: 10, color: AppTheme.textSecondaryOf(context)),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    Icon(Icons.arrow_forward_ios, size: 13, color: AppTheme.textSecondaryOf(context)),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildCalendarGrid(BuildContext context, Map<String, CurrentAffairEditionModel> editionsByDate) {
    final year = _focusedMonth.year;
    final month = _focusedMonth.month;
    final daysInMonth = DateTime(year, month + 1, 0).day;
    final firstDayOfWeek = DateTime(year, month, 1).weekday; // 1=Mon..7=Sun

    final weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return Column(
      children: [
        // Weekday headers
        Row(
          children: weekdays
              .map((w) => Expanded(
                    child: Center(
                      child: Text(
                        w,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 8),
        // Days Grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: (firstDayOfWeek - 1) + daysInMonth,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 4,
            crossAxisSpacing: 4,
            childAspectRatio: 1.45,
          ),
          itemBuilder: (context, idx) {
            if (idx < firstDayOfWeek - 1) {
              return const SizedBox.shrink();
            }
            final day = idx - (firstDayOfWeek - 2);
            final dateObj = DateTime(year, month, day);
            final dateStr = _formatDateKey(dateObj);
            final hasEdition = editionsByDate.containsKey(dateStr);
            final isSelected = _selectedDate != null && _formatDateKey(_selectedDate!) == dateStr;

            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedDate = null;
                  } else {
                    _selectedDate = dateObj;
                  }
                });
              },
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primaryOf(context)
                      : hasEdition
                          ? AppColors.primaryOf(context).withValues(alpha: 0.15)
                          : Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primaryOf(context)
                        : hasEdition
                            ? AppColors.primaryOf(context).withValues(alpha: 0.4)
                            : AppTheme.borderOf(context),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '$day',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: isSelected
                            ? Colors.white
                            : hasEdition
                                ? AppColors.primaryOf(context)
                                : AppTheme.textPrimaryOf(context),
                      ),
                    ),
                    if (hasEdition && !isSelected)
                      Container(
                        margin: const EdgeInsets.only(top: 2),
                        width: 4,
                        height: 4,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primaryOf(context),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  String _formatDateKey(DateTime d) {
    return "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";
  }
}

class _ArticleCard extends StatelessWidget {
  final CurrentAffairArticleModel article;
  final String lang;
  final int indexNumber;

  const _ArticleCard({
    required this.article,
    required this.lang,
    required this.indexNumber,
  });

  @override
  Widget build(BuildContext context) {
    final category = article.category.toUpperCase();
    final color = category == 'BIHAR'
        ? const Color(0xFF10B981)
        : category == 'INTERNATIONAL'
            ? const Color(0xFF3B82F6)
            : (category == 'EDITORIAL' || category == 'EDITORIALS' || category == 'MAINS')
                ? const Color(0xFFF43F5E)
                : (category == 'ARUNACHAL')
                    ? const Color(0xFF10B981)
                    : AppColors.primaryBlue;

    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderCol),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/current-affairs/article/${article.slug}?lang=$lang'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      // Article sequential index badge (e.g. #01)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        margin: const EdgeInsets.only(right: 6),
                        decoration: BoxDecoration(
                          color: textPrimary.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '#${indexNumber.toString().padLeft(2, '0')}',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          category,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 12, color: AppTheme.textSecondaryOf(context)),
                      const SizedBox(width: 4),
                      Text(
                        article.readingTime,
                        style: TextStyle(fontSize: 10, color: AppTheme.textSecondaryOf(context)),
                      ),
                      if (article.publishedDate.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Text(
                          '• ${article.publishedDate}',
                          style: TextStyle(fontSize: 10, color: AppTheme.textSecondaryOf(context)),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
              if (article.coverImageUrl != null && article.coverImageUrl!.isNotEmpty) ...[
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
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
              ],
              const SizedBox(height: 10),
              Text(
                article.title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: textPrimary,
                  height: 1.3,
                ),
              ),
              if (article.summary.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  article.summary,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryOf(context), height: 1.4),
                ),
              ],
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (article.tags.isNotEmpty)
                    Expanded(
                      child: Text(
                        article.tags.take(2).map((t) => '#$t').join(' '),
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primaryOf(context)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    )
                  else
                    const SizedBox.shrink(),
                  Row(
                    children: [
                      Text(
                        'Read Analysis',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryOf(context)),
                      ),
                      const SizedBox(width: 2),
                      Icon(Icons.arrow_forward_ios_rounded, size: 10, color: AppColors.primaryOf(context)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
