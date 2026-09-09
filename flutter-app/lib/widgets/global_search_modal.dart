import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';

class GlobalSearchModal extends StatefulWidget {
  const GlobalSearchModal({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const GlobalSearchModal(),
    );
  }

  @override
  State<GlobalSearchModal> createState() => _GlobalSearchModalState();
}

class _GlobalSearchModalState extends State<GlobalSearchModal> {
  final TextEditingController _controller = TextEditingController();
  String _query = '';
  String _activeFilter = 'All';

  final List<String> _filters = const ['All', 'Mock Tests', 'Current Affairs', 'PYQs', 'Courses'];
  final List<String> _recentSearches = const ['BPSC 70th Prelims', 'UPSC CSAT Mocks', 'Bihar Special Current Affairs', 'SSC CGL Tier 1', 'STET Exam Paper'];

  final List<Map<String, String>> _allMockItems = const [
    {
      'title': '70th BPSC Prelims Full Mock Test 01',
      'category': 'Mock Tests',
      'sub': '150 Qs • 120 Mins • Bilingual',
      'route': '/test-series/test-series-bpsc-70th',
    },
    {
      'title': 'Daily Current Affairs — Today\'s Edition',
      'category': 'Current Affairs',
      'sub': 'Exam Relevant Daily Digest with Notes',
      'route': '/current-affairs',
    },
    {
      'title': '69th BPSC Prelims Official Question Paper',
      'category': 'PYQs',
      'sub': 'Official Answer Key & Explanations',
      'route': '/pyq',
    },
    {
      'title': 'UPSC IAS Prelims GS Paper I Foundation',
      'category': 'Courses',
      'sub': 'SuperCoaching Live Video Lectures',
      'route': '/courses',
    },
    {
      'title': 'SSC CGL General Awareness & Reasoning Drills',
      'category': 'Mock Tests',
      'sub': '100 Qs • Speed Practice Test',
      'route': '/test-series/test-series-ssc-cgl-2024',
    },
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    final results = _allMockItems.where((item) {
      final matchesFilter = _activeFilter == 'All' || item['category'] == _activeFilter;
      final matchesQuery = _query.isEmpty ||
          item['title']!.toLowerCase().contains(_query.toLowerCase()) ||
          item['sub']!.toLowerCase().contains(_query.toLowerCase());
      return matchesFilter && matchesQuery;
    }).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Top drag handle & header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 46,
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderCol),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.search, size: 20, color: AppTheme.primaryBlue),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: _controller,
                                autofocus: true,
                                onChanged: (val) {
                                  setState(() {
                                    _query = val.trim();
                                  });
                                },
                                style: TextStyle(fontSize: 14, color: textPrimary),
                                decoration: const InputDecoration(
                                  hintText: 'Search mock tests, current affairs, PYQs...',
                                  hintStyle: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                                  border: InputBorder.none,
                                  isDense: true,
                                ),
                              ),
                            ),
                            if (_query.isNotEmpty)
                              IconButton(
                                icon: const Icon(Icons.clear, size: 18, color: AppTheme.textMuted),
                                onPressed: () {
                                  _controller.clear();
                                  setState(() {
                                    _query = '';
                                  });
                                },
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel', style: TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Filter horizontal tags
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: _filters.map((f) {
                      final isSelected = _activeFilter == f;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(f),
                          selected: isSelected,
                          onSelected: (_) {
                            setState(() {
                              _activeFilter = f;
                            });
                          },
                          selectedColor: AppTheme.primaryBlue,
                          backgroundColor: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFF1F5F9),
                          labelStyle: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? Colors.white : AppTheme.textPrimaryOf(context),
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          Divider(height: 1, color: borderCol),

          // Search Body Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Recent Searches Pills (shown when query is empty)
                  if (_query.isEmpty) ...[
                    const Text(
                      'Popular Searches',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDarkPrimary),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _recentSearches.map((s) {
                        return InkWell(
                          onTap: () {
                            _controller.text = s;
                            setState(() {
                              _query = s;
                            });
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryBlue.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppTheme.primaryBlue.withValues(alpha: 0.15)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.history_rounded, size: 14, color: AppTheme.primaryBlue),
                                const SizedBox(width: 6),
                                Text(
                                  s,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Search Results List
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _query.isEmpty ? 'Recommended Results' : 'Search Results (${results.length})',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDarkPrimary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (results.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 36),
                      child: Center(
                        child: Column(
                          children: [
                            const Icon(Icons.search_off_rounded, size: 40, color: AppTheme.textMuted),
                            const SizedBox(height: 8),
                            Text(
                              'No results found for "$_query"',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: results.length,
                      separatorBuilder: (_, __) => Divider(height: 1, color: borderCol),
                      itemBuilder: (context, i) {
                        final res = results[i];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                          onTap: () {
                            Navigator.of(context).pop();
                            context.push(res['route']!);
                          },
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryBlue.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.arrow_outward_rounded, color: AppTheme.primaryBlue, size: 18),
                          ),
                          title: Text(
                            res['title']!,
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textPrimary),
                          ),
                          subtitle: Text(
                            '${res['category']} • ${res['sub']}',
                            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                          ),
                          trailing: const Icon(Icons.chevron_right_rounded, color: AppTheme.textMuted, size: 20),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
