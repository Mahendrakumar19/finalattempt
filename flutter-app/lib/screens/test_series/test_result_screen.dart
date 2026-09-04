import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Performance & Scorecard'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Scorecard'),
              Tab(text: 'Solutions & Analysis'),
            ],
          ),
        ),
        body: TabBarView(
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
                      Expanded(child: _breakdownTile('Correct', '${summary.correctCount}', Colors.green)),
                      const SizedBox(width: 12),
                      Expanded(child: _breakdownTile('Incorrect', '${summary.incorrectCount}', Colors.red)),
                      const SizedBox(width: 12),
                      Expanded(child: _breakdownTile('Unattempted', '${summary.unattemptedCount}', Colors.orange)),
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

  Widget _breakdownTile(String label, String count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(count, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 12, color: color.withOpacity(0.9))),
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
                Text(q.questionTextEn, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
                Text(
                  q.explanationEn ?? 'No detailed explanation provided.',
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade800, height: 1.3),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
