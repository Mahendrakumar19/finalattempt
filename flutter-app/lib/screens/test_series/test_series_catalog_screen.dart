import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/test_series_provider.dart';
import '../../models/test_series_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../widgets/swipeable_package_card.dart';
import '../../widgets/top_header_actions.dart';

class TestSeriesCatalogScreen extends ConsumerStatefulWidget {
  const TestSeriesCatalogScreen({super.key});

  @override
  ConsumerState<TestSeriesCatalogScreen> createState() => _TestSeriesCatalogScreenState();
}

class _TestSeriesCatalogScreenState extends ConsumerState<TestSeriesCatalogScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'All';
  bool _isSwipeView = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = ref.watch(appLocalizationsProvider);
    final testSeriesAsync = ref.watch(testSeriesListProvider);
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
              context.go('/');
            }
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              loc.tr('test_series_catalog'),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: textPrimary,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: _isSwipeView ? 'Switch to List View' : 'Switch to Swipe Cards View',
            icon: Icon(
              _isSwipeView ? Icons.view_list_rounded : Icons.swipe_rounded,
              color: AppTheme.primaryOf(context),
            ),
            onPressed: () {
              setState(() {
                _isSwipeView = !_isSwipeView;
              });
            },
          ),
          const TopHeaderActions(),
          const SizedBox(width: 8),
        ],
      ),
      body: Stack(
        children: [
          // Background organic accent circle
          Positioned(
            top: -60,
            right: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF1E293B)
                    : const Color(0xFFE8F1FF),
              ),
            ),
          ),
          RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(testSeriesListProvider);
            },
            child: Column(
              children: [
                // Top Search & Category Filter Section
                Container(
                  color: cardBg,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                  child: Column(
                    children: [
                      // Search Bar
                      Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: borderCol),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) {
                            setState(() {
                              _searchQuery = val.trim();
                            });
                          },
                          style: TextStyle(fontSize: 14, color: textPrimary),
                          decoration: InputDecoration(
                            hintText: 'Search exam or test series...',
                            hintStyle: TextStyle(fontSize: 13, color: AppTheme.textMutedOf(context)),
                            prefixIcon: Icon(Icons.search, size: 20, color: AppTheme.textMutedOf(context)),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? IconButton(
                                    icon: Icon(Icons.clear, size: 18, color: AppTheme.textMutedOf(context)),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {
                                        _searchQuery = '';
                                      });
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Categories Horizontal Bar
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        child: Row(
                          children: ['All', 'BPSC', 'UPSC', 'Bihar Daroga', 'STET', 'SSC', 'Banking'].map((cat) {
                            final isSelected = _selectedCategory == cat;
                            final primaryCol = AppTheme.primaryOf(context);
                            final isDark = Theme.of(context).brightness == Brightness.dark;

                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: InkWell(
                                onTap: () {
                                  setState(() {
                                    _selectedCategory = cat;
                                  });
                                },
                                borderRadius: BorderRadius.circular(20),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? primaryCol
                                        : (isDark
                                            ? const Color(0xFF1E293B)
                                            : const Color(0xFFF1F5F9)),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: isSelected ? primaryCol : borderCol,
                                    ),
                                  ),
                                  child: Text(
                                    cat,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                      color: isSelected
                                          ? (isDark ? Colors.black : Colors.white)
                                          : AppTheme.textPrimaryOf(context),
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

                Divider(height: 1, color: borderCol),

                // Catalog List Area
                Expanded(
                  child: testSeriesAsync.when(
                    loading: () => _buildSkeletonLoading(context),
                    error: (err, stack) => _buildErrorState(context, err.toString()),
                    data: (list) {
                      var filtered = list.where((item) {
                        final matchesCategory = _selectedCategory == 'All' ||
                            item.examCategory.toLowerCase().contains(_selectedCategory.toLowerCase()) ||
                            item.title.toLowerCase().contains(_selectedCategory.toLowerCase());
                        final matchesQuery = _searchQuery.isEmpty ||
                            item.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                            item.examCategory.toLowerCase().contains(_searchQuery.toLowerCase());
                        return matchesCategory && matchesQuery;
                      }).toList();

                      if (filtered.isEmpty) {
                        return _buildEmptyState(context);
                      }

                      if (_isSwipeView) {
                        final swipeItems = filtered.map((s) => SwipeablePackageItem(
                          id: s.id,
                          title: s.title,
                          category: s.examCategory,
                          totalTests: s.totalTests,
                          freeTests: s.freeTestsCount,
                          rating: 4.8,
                          originalPrice: s.price > 0 ? s.price.toInt() : 499,
                          discountPrice: s.discountedPrice != null ? s.discountedPrice!.toInt() : (s.price > 0 ? s.price.toInt() : 0),
                          highlights: [
                            '${s.fullLengthCount} Full-length mock tests included',
                            'Language: ${s.language}',
                            'All India Rank & Performance Analytics',
                          ],
                          badgeText: s.isPurchased ? 'UNLOCKED' : 'PASS PRO',
                          themeColor: AppTheme.primaryBlue,
                        )).toList();

                        return SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: SwipeablePackageDeck(
                            items: swipeItems,
                            onSwiped: (item, isLiked) {
                              final action = isLiked ? 'Pass Saved' : 'Pass Skipped';
                              ScaffoldMessenger.of(context).hideCurrentSnackBar();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('$action: ${item.title}'),
                                  duration: const Duration(seconds: 1),
                                  behavior: SnackBarBehavior.floating,
                                  margin: const EdgeInsets.all(16),
                                ),
                              );
                            },
                          ),
                        );
                      }

                      return ListView.builder(
                        padding: const EdgeInsets.all(16),
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final series = filtered[index];
                          return _buildTestSeriesCard(context, series);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTestSeriesCard(BuildContext context, TestSeries series) {
    final hasDiscount = series.discountedPrice != null && series.discountedPrice! < series.price;
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderCol),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          context.push('/test-series/${series.id}');
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.lightBlueBackground,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      series.examCategory.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.primaryBlue,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  if (series.isPurchased)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle, size: 12, color: Color(0xFF15803D)),
                          SizedBox(width: 4),
                          Text(
                            'UNLOCKED',
                            style: TextStyle(
                              color: Color(0xFF15803D),
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    )
                  else if (series.freeTestsCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${series.freeTestsCount} FREE TESTS',
                        style: const TextStyle(
                          color: Color(0xFFB45309),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),

              Text(
                series.title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: textPrimary,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF1E293B)
                      : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildMetric(context, Icons.assignment_outlined, '${series.totalTests}', 'Total Tests'),
                    _buildVerticalDivider(borderCol),
                    _buildMetric(context, Icons.quiz_outlined, '${series.fullLengthCount}', 'Full Length'),
                    _buildVerticalDivider(borderCol),
                    _buildMetric(context, Icons.translate, series.language.contains('Bilingual') ? 'Hindi & Eng' : series.language, 'Language'),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (hasDiscount)
                        Text(
                          '₹${series.price.toInt()}',
                          style: const TextStyle(
                            decoration: TextDecoration.lineThrough,
                            color: AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            hasDiscount ? '₹${series.discountedPrice!.toInt()}' : '₹${series.price.toInt()}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            'Validity',
                            style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () {
                      context.push('/test-series/${series.id}');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: series.isPurchased ? const Color(0xFF15803D) : AppColors.primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(
                      series.isPurchased ? 'View Tests →' : 'View Series →',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetric(BuildContext context, IconData icon, String value, String label) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: AppColors.primaryBlue),

            const SizedBox(width: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimaryOf(context),
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
        ),

      ],
    );
  }

  Widget _buildVerticalDivider(Color borderCol) {
    return Container(
      height: 24,
      width: 1,
      color: borderCol,
    );
  }

  Widget _buildSkeletonLoading(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          height: 180,
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderCol),
          ),
          child: const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 16, width: 80, child: DecoratedBox(decoration: BoxDecoration(color: Color(0xFFF1F5F9)))),
                SizedBox(height: 12),
                SizedBox(height: 20, width: double.infinity, child: DecoratedBox(decoration: BoxDecoration(color: Color(0xFFF1F5F9)))),
                SizedBox(height: 16),
                SizedBox(height: 40, width: double.infinity, child: DecoratedBox(decoration: BoxDecoration(color: Color(0xFFF1F5F9)))),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off_outlined, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(
              'No Test Series Found',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimaryOf(context)),
            ),
            const SizedBox(height: 6),
            Text(
              _searchQuery.isNotEmpty
                  ? 'No results match "$_searchQuery". Try searching another term.'
                  : 'No test series currently available under this category.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFFEF4444)),
            const SizedBox(height: 12),
            Text(
              'Unable to Load Catalog',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimaryOf(context)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Please check your internet connection or try again.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                ref.invalidate(testSeriesListProvider);
              },
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlue,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


