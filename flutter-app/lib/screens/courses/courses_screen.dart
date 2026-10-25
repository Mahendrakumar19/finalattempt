import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/courses_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../widgets/course_card.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/top_header_actions.dart';

class CoursesScreen extends ConsumerStatefulWidget {
  const CoursesScreen({super.key});

  @override
  ConsumerState<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends ConsumerState<CoursesScreen> {
  String _selectedExam = 'ALL';
  String _selectedCategory = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _exams = ['ALL', 'BPSC', 'Arunachal PCS'];
  final List<String> _categories = ['ALL', 'Prelims', 'Mains', 'Interview', 'Foundation'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = ref.watch(appLocalizationsProvider);
    final coursesAsync = ref.watch(coursesProvider);
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
        title: Text(
          loc.tr('all_courses'),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.3,
            color: textPrimary,
          ),
        ),
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips and Search Bar
          Container(
            color: cardBg,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
            child: Column(
              children: [
                // Search Input
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF1E293B)
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: borderCol),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: TextStyle(fontSize: 13, color: textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Search courses, subjects & batches...',
                      hintStyle: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                      prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 16),
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
                // Exam Chips (BPSC, Arunachal PCS)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _exams.map((exam) {
                      final isSelected = _selectedExam == exam;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(exam == 'ALL' ? 'All Exams' : exam),
                          selected: isSelected,
                          onSelected: (_) => setState(() => _selectedExam = exam),
                          selectedColor: AppTheme.primaryOf(context),
                          labelStyle: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isSelected ? Colors.white : AppColors.textSecondary,
                          ),
                          backgroundColor: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFF1F5F9),
                          side: BorderSide(color: isSelected ? AppTheme.primaryOf(context) : borderCol),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 6),
                // Category Chips (Prelims, Mains, Interview, Foundation)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _categories.map((cat) {
                      final isSelected = _selectedCategory == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ActionChip(
                          label: Text(cat == 'ALL' ? 'All Stages' : cat),
                          onPressed: () => setState(() => _selectedCategory = cat),
                          backgroundColor: isSelected
                              ? const Color(0xFFEFF6FF)
                              : (Theme.of(context).brightness == Brightness.dark
                                  ? const Color(0xFF0F172A)
                                  : Colors.white),
                          labelStyle: TextStyle(
                            fontSize: 10,
                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                            color: isSelected ? const Color(0xFF1D4ED8) : AppColors.textSecondary,
                          ),
                          side: BorderSide(color: isSelected ? const Color(0xFF3B82F6) : borderCol),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: borderCol),

          // Courses Grid
          Expanded(
            child: coursesAsync.when(
              data: (courses) {
                final filtered = courses.where((c) {
                  final matchesExam = _selectedExam == 'ALL' ||
                      (c.title.toLowerCase().contains(_selectedExam.toLowerCase())) ||
                      (c.category?.toLowerCase().contains(_selectedExam.toLowerCase()) ?? false);

                  final matchesCat = _selectedCategory == 'ALL' ||
                      (c.category?.toLowerCase() == _selectedCategory.toLowerCase()) ||
                      (c.title.toLowerCase().contains(_selectedCategory.toLowerCase()));

                  final matchesSearch = _searchQuery.isEmpty ||
                      c.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                      (c.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);

                  return matchesExam && matchesCat && matchesSearch;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.school_outlined, size: 48, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        Text(
                          'No courses found for selected filter',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textPrimary),
                        ),
                        const SizedBox(height: 6),
                        TextButton(
                          onPressed: () => setState(() {
                            _selectedExam = 'ALL';
                            _selectedCategory = 'ALL';
                            _searchQuery = '';
                            _searchController.clear();
                          }),
                          child: const Text('Reset All Filters', style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  );
                }

                return GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                  physics: const BouncingScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.78,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) => CourseCard(
                    course: filtered[i],
                    onTap: () => context.push('/courses/${filtered[i].id}'),
                  ),
                );
              },
              loading: () => const LoadingGrid(),
              error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
            ),
          ),
        ],
      ),
    );
  }
}
