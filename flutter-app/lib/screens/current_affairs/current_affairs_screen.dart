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
  bool _isCalendarExpanded = true;

  final List<Map<String, String>> _categories = [
    {'key': 'ALL', 'label': 'All Topics'},
    {'key': 'NATIONAL', 'label': 'National'},
    {'key': 'INTERNATIONAL', 'label': 'International'},
    {'key': 'BIHAR', 'label': 'Bihar Special'},
    {'key': 'EDITORIAL', 'label': 'Editorials'},
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
  Widget build(BuildContext context) {
    final loc = ref.watch(appLocalizationsProvider);
    final editionsAsync = ref.watch(caEditionsProvider(_activeLang));
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final borderCol = AppTheme.borderOf(context);

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
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
        ),
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 8),
        ],
      ),
      body: editionsAsync.when(
        data: (editions) {
          // Build set of available published dates
          final Map<String, CurrentAffairEditionModel> editionsByDate = {};
          for (final ed in editions) {
            if (ed.publishDate.isNotEmpty) {
              editionsByDate[ed.publishDate] = ed;
            }
          }

          // Filter articles based on selected date or selected category
          List<CurrentAffairArticleModel> filteredArticles = [];
          if (_selectedDate != null) {
            final dateStr = _formatDateKey(_selectedDate!);
            final matchEd = editionsByDate[dateStr];
            if (matchEd != null) {
              filteredArticles = matchEd.articles;
            }
          } else {
            // Flatten all articles
            for (final ed in editions) {
              filteredArticles.addAll(ed.articles);
            }
          }

          if (_selectedCategory != 'ALL') {
            filteredArticles = filteredArticles.where((art) {
              final cat = art.category.toUpperCase();
              if (_selectedCategory == 'EDITORIAL') {
                return cat == 'EDITORIAL' || cat == 'EDITORIALS' || cat == 'MAINS';
              }
              return cat == _selectedCategory;
            }).toList();
          }

          return CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // 1. Calendar Header Card with Month & Year Dropdowns
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.all(16),
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
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: textPrimary,
                                ),
                                items: List.generate(12, (mIdx) {
                                  return DropdownMenuItem<int>(
                                    value: mIdx + 1,
                                    child: Text(
                                      _monthsList[mIdx],
                                      style: TextStyle(
                                        fontSize: 14,
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
                            const SizedBox(width: 6),

                            // Year Dropdown Menu
                            DropdownButtonHideUnderline(
                              child: DropdownButton<int>(
                                value: _focusedMonth.year,
                                icon: Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: AppColors.primaryOf(context)),
                                dropdownColor: cardBg,
                                borderRadius: BorderRadius.circular(14),
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: textPrimary,
                                ),
                                items: _yearsList.map((yr) {
                                  return DropdownMenuItem<int>(
                                    value: yr,
                                    child: Text(
                                      '$yr',
                                      style: TextStyle(
                                        fontSize: 14,
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

              // 2. Category Filter Bar (Top Filters)
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

              const SliverToBoxAdapter(child: SizedBox(height: 14)),

              // 3. Section Title
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _selectedDate != null
                            ? 'Articles for ${_formatDateKey(_selectedDate!)}'
                            : 'All Current Affairs Articles',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        '${filteredArticles.length} items',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ),

              // 4. Articles List
              if (filteredArticles.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.article_outlined, size: 48, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        Text(
                          _selectedDate != null
                              ? 'No current affairs published on ${_formatDateKey(_selectedDate!)}'
                              : 'No articles found in this category',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        final article = filteredArticles[i];
                        return _ArticleCard(article: article, lang: _activeLang);
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
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
      ),
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
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
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

  const _ArticleCard({required this.article, required this.lang});

  @override
  Widget build(BuildContext context) {
    final category = article.category.toUpperCase();
    final color = category == 'BIHAR'
        ? const Color(0xFF10B981)
        : category == 'INTERNATIONAL'
            ? const Color(0xFF3B82F6)
            : (category == 'EDITORIAL' || category == 'EDITORIALS' || category == 'MAINS')
                ? const Color(0xFFF43F5E)
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
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 12, color: AppTheme.textSecondaryOf(context)),
                      const SizedBox(width: 4),
                      Text(
                        article.readingTime,
                        style: TextStyle(fontSize: 10, color: AppTheme.textSecondaryOf(context)),
                      ),
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
            ],
          ),
        ),
      ),
    );
  }
}
