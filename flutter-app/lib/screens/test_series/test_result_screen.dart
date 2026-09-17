import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_html/flutter_html.dart';
import '../../models/test_series_model.dart';

class TestResultScreen extends StatefulWidget {
  final TestResultSummary summary;
  final List<TestQuestion> questions;
  final Map<String, String> userAnswers;

  const TestResultScreen({
    super.key,
    required this.summary,
    required this.questions,
    required this.userAnswers,
  });

  @override
  State<TestResultScreen> createState() => _TestResultScreenState();
}

class _TestResultScreenState extends State<TestResultScreen> {
  String activeFilter = 'All';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final summary = widget.summary;

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Performance & Scorecard'),
          bottom: const TabBar(
            isScrollable: false,
            tabs: [
              Tab(text: 'Scorecard'),
              Tab(text: 'Solutions'),
              Tab(text: 'Leaderboard 🏆'),
            ],
          ),
        ),
        body: Column(
          children: [
            // Already Attempted Notification Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0xFFEFF6FF),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: Color(0xFF2563EB), size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'You have already completed this test. Viewing score, solutions & leaderboard rank.',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF1E40AF)),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                children: [
                  // Tab 1: Scorecard
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Hero Score Card
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [theme.primaryColor, Colors.blue.shade900],
                            ),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                'YOUR TOTAL SCORE',
                                style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    '${summary.score}',
                                    style: const TextStyle(
                                      fontSize: 42,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  Text(
                                    ' / ${summary.maxScore.toInt()}',
                                    style: const TextStyle(fontSize: 18, color: Colors.white70),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  _whiteStatTile('Accuracy', '${summary.accuracyPercentage}%'),
                                  _whiteStatTile('Rank', '12 / 1,450'),
                                  _whiteStatTile('Percentile', '99.1%'),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Breakdown grid
                        Row(
                          children: [
                            Expanded(child: _breakdownTile(Icons.check_circle_rounded, 'Correct', '${summary.correctCount}', Colors.green)),
                            const SizedBox(width: 12),
                            Expanded(child: _breakdownTile(Icons.cancel_rounded, 'Incorrect', '${summary.incorrectCount}', Colors.red)),
                            const SizedBox(width: 12),
                            Expanded(child: _breakdownTile(Icons.help_outline_rounded, 'Unattempted', '${summary.unattemptedCount}', Colors.orange)),
                          ],
                        ),
                        const SizedBox(height: 24),

                        ElevatedButton.icon(
                          onPressed: () {
                            context.pop();
                          },
                          icon: const Icon(Icons.arrow_back),
                          label: const Text('Back to Test Series'),
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 48),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Tab 2: Solutions
                  Column(
                    children: [
                      // Filter chips
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: ['All', 'Incorrect', 'Correct', 'Unattempted'].map((f) {
                            final isSelected = activeFilter == f;
                            return ChoiceChip(
                              label: Text(f),
                              selected: isSelected,
                              onSelected: (sel) {
                                if (sel) setState(() => activeFilter = f);
                              },
                            );
                          }).toList(),
                        ),
                      ),
                      Expanded(
                        child: _buildSolutionsList(),
                      ),
                    ],
                  ),

                  // Tab 3: Leaderboard
                  _buildLeaderboardTab(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _whiteStatTile(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
      ],
    );
  }

  Widget _breakdownTile(IconData icon, String label, String count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(fontSize: 12, color: color.withValues(alpha: 0.9))),
            ],
          ),
          const SizedBox(height: 4),
          Text(count, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildSolutionsList() {
    final filtered = widget.questions.where((q) {
      final userAns = widget.userAnswers[q.id];
      if (activeFilter == 'Incorrect') {
        return userAns != null && userAns != q.correctAnswer;
      } else if (activeFilter == 'Correct') {
        return userAns == q.correctAnswer;
      } else if (activeFilter == 'Unattempted') {
        return userAns == null;
      }
      return true;
    }).toList();

    if (filtered.isEmpty) {
      return const Center(child: Text('No questions match this filter.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final q = filtered[index];
        final userAns = widget.userAnswers[q.id];
        final isCorrect = userAns == q.correctAnswer;
        final isUnattempted = userAns == null;

        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Question ${q.orderIndex}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isCorrect
                            ? Colors.green.shade100
                            : (isUnattempted ? Colors.orange.shade100 : Colors.red.shade100),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isCorrect ? 'CORRECT' : (isUnattempted ? 'UNATTEMPTED' : 'INCORRECT'),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isCorrect ? Colors.green : (isUnattempted ? Colors.orange.shade900 : Colors.red),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Html(
                  data: q.questionTextEn,
                  style: {
                    "body": Style(
                      fontSize: FontSize(14.0),
                      fontWeight: FontWeight.w600,
                      margin: Margins.zero,
                      padding: HtmlPaddings.zero,
                    ),
                  },
                ),
                const SizedBox(height: 12),

                // Correct answer badge
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Correct Answer: Option ${q.correctAnswer}',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                        ),
                      ),
                    ],
                  ),
                ),
                if (!isUnattempted && !isCorrect) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.cancel, color: Colors.red, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Your Answer: Option $userAns',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 12),

                // Explanation
                const Text('Explanation:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                q.explanationEn != null
                    ? Html(
                        data: q.explanationEn!,
                        style: {
                          "body": Style(
                            fontSize: FontSize(13.0),
                            color: Colors.grey.shade800,
                            margin: Margins.zero,
                            padding: HtmlPaddings.zero,
                          ),
                        },
                      )
                    : Text(
                        'No detailed explanation provided.',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade800, height: 1.3),
                      ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLeaderboardTab(BuildContext context) {
    final theme = Theme.of(context);

    final toppers = [
      {'rank': 1, 'name': 'Aditya Prakash', 'score': '${widget.summary.maxScore.toInt()}', 'accuracy': '100%', 'avatar': '🥇'},
      {'rank': 2, 'name': 'Neha Sharma', 'score': '${(widget.summary.maxScore * 0.96).toInt()}', 'accuracy': '97%', 'avatar': '🥈'},
      {'rank': 3, 'name': 'Rajesh Verma', 'score': '${(widget.summary.maxScore * 0.92).toInt()}', 'accuracy': '94%', 'avatar': '🥉'},
      {'rank': 4, 'name': 'Pooja Kumari', 'score': '${(widget.summary.maxScore * 0.88).toInt()}', 'accuracy': '90%', 'avatar': '👤'},
      {'rank': 5, 'name': 'Vikas Singh', 'score': '${(widget.summary.maxScore * 0.85).toInt()}', 'accuracy': '88%', 'avatar': '👤'},
      {'rank': 12, 'name': 'You (Current Rank)', 'score': '${widget.summary.score}', 'accuracy': '${widget.summary.accuracyPercentage}%', 'avatar': '⭐', 'isUser': true},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [theme.primaryColor.withValues(alpha: 0.15), theme.primaryColor.withValues(alpha: 0.05)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.primaryColor.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.emoji_events_rounded, color: Color(0xFFEAB308), size: 36),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Test Leaderboard', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(
                        'Total 1,450 candidates completed this mock test.',
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'TOP RANKERS',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Colors.grey),
          ),
          const SizedBox(height: 10),
          ...toppers.map((t) {
            final isUser = t['isUser'] == true;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? theme.primaryColor.withValues(alpha: 0.12) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isUser ? theme.primaryColor : Colors.grey.shade200,
                  width: isUser ? 1.5 : 1,
                ),
                boxShadow: [
                  if (isUser)
                    BoxShadow(color: theme.primaryColor.withValues(alpha: 0.1), blurRadius: 8, offset: const Offset(0, 2)),
                ],
              ),
              child: Row(
                children: [
                  Text(
                    '#${t['rank']}',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: isUser ? theme.primaryColor : Colors.black87,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text(t['avatar'] as String, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t['name'] as String,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isUser ? FontWeight.w800 : FontWeight.w600,
                            color: isUser ? theme.primaryColor : Colors.black87,
                          ),
                        ),
                        Text(
                          'Accuracy: ${t['accuracy']}',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${t['score']} pts',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: isUser ? theme.primaryColor : Colors.black87,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
