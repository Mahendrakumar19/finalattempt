import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/test_series_provider.dart';
import '../../models/test_series_model.dart';
import 'test_result_screen.dart';

class TestPlayerScreen extends ConsumerWidget {
  final String quizId;

  const TestPlayerScreen({super.key, required this.quizId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playerState = ref.watch(testPlayerProvider(quizId));
    final notifier = ref.read(testPlayerProvider(quizId).notifier);
    final theme = Theme.of(context);

    // If submitted, show result screen directly
    if (playerState.isSubmitted && playerState.resultSummary != null) {
      return TestResultScreen(
        summary: playerState.resultSummary!,
        questions: playerState.questions,
        userAnswers: playerState.userAnswers,
      );
    }

    final currentQ = playerState.questions[playerState.currentIndex];
    final questionText = playerState.isHindi
        ? (currentQ.questionTextHi ?? currentQ.questionTextEn)
        : currentQ.questionTextEn;

    final mins = (playerState.remainingSeconds ~/ 60).toString().padLeft(2, '0');
    final secs = (playerState.remainingSeconds % 60).toString().padLeft(2, '0');
    final isLowTime = playerState.remainingSeconds < 300;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldLeave = await _showExitConfirmDialog(context);
        if (shouldLeave == true && context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: Text(
            playerState.quiz.title,
            style: const TextStyle(fontSize: 14),
            overflow: TextOverflow.ellipsis,
          ),
          actions: [
            // Language switch
            Container(
              margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white54),
                borderRadius: BorderRadius.circular(20),
              ),
              child: InkWell(
                onTap: notifier.toggleLanguage,
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  child: Row(
                    children: [
                      const Icon(Icons.language, size: 14, color: Colors.white),
                      const SizedBox(width: 4),
                      Text(
                        playerState.isHindi ? 'हिन्दी' : 'ENG',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Palette drawer trigger
            IconButton(
              icon: const Icon(Icons.grid_view),
              onPressed: () => _openQuestionPalette(context, ref, notifier, playerState),
            ),
          ],
        ),
        body: Column(
          children: [
            // Timer & Question counter bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: isLowTime ? Colors.red.shade50 : Colors.blue.shade50,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Question ${playerState.currentIndex + 1} of ${playerState.questions.length}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Row(
                    children: [
                      Icon(
                        Icons.timer_outlined,
                        size: 16,
                        color: isLowTime ? Colors.red : theme.primaryColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$mins:$secs',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: isLowTime ? Colors.red : theme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Question content & options
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Q${playerState.currentIndex + 1}. $questionText',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildOptionTile(context, notifier, playerState, 'A', currentQ.optionAEn, currentQ.optionAHi),
                    _buildOptionTile(context, notifier, playerState, 'B', currentQ.optionBEn, currentQ.optionBHi),
                    _buildOptionTile(context, notifier, playerState, 'C', currentQ.optionCEn, currentQ.optionCHi),
                    _buildOptionTile(context, notifier, playerState, 'D', currentQ.optionDEn, currentQ.optionDHi),
                    if (currentQ.optionEEn != null)
                      _buildOptionTile(context, notifier, playerState, 'E', currentQ.optionEEn!, currentQ.optionEHi),
                  ],
                ),
              ),
            ),

            // Bottom Action Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 6,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Clear response
                  OutlinedButton(
                    onPressed: notifier.clearResponse,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                    ),
                    child: const Text('Clear', style: TextStyle(fontSize: 12)),
                  ),
                  const SizedBox(width: 8),
                  // Mark for review
                  OutlinedButton(
                    onPressed: notifier.toggleMarkForReview,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      side: BorderSide(
                        color: (playerState.markedForReview[currentQ.id] ?? false) ? Colors.purple : Colors.grey,
                      ),
                    ),
                    child: Text(
                      (playerState.markedForReview[currentQ.id] ?? false) ? 'Unmark' : 'Mark Review',
                      style: TextStyle(
                        fontSize: 12,
                        color: (playerState.markedForReview[currentQ.id] ?? false) ? Colors.purple : Colors.black87,
                      ),
                    ),
                  ),
                  const Spacer(),
                  // Previous
                  if (playerState.currentIndex > 0)
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios, size: 18),
                      onPressed: notifier.previousQuestion,
                    ),
                  // Next / Submit
                  ElevatedButton(
                    onPressed: () {
                      if (playerState.currentIndex < playerState.questions.length - 1) {
                        notifier.nextQuestion();
                      } else {
                        _showSubmitConfirmation(context, notifier, playerState);
                      }
                    },
                    child: Text(
                      playerState.currentIndex < playerState.questions.length - 1 ? 'Save & Next' : 'Submit Test',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionTile(
    BuildContext context,
    TestPlayerNotifier notifier,
    TestPlayerState state,
    String optionKey,
    String textEn,
    String? textHi,
  ) {
    final currentQ = state.questions[state.currentIndex];
    final isSelected = state.userAnswers[currentQ.id] == optionKey;
    final text = state.isHindi ? (textHi ?? textEn) : textEn;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => notifier.selectOption(optionKey),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isSelected ? Colors.blue.shade50 : Colors.grey.shade50,
            border: Border.all(
              color: isSelected ? Colors.blue.shade700 : Colors.grey.shade300,
              width: isSelected ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? Colors.blue.shade700 : Colors.white,
                  border: Border.all(color: isSelected ? Colors.blue.shade700 : Colors.grey),
                ),
                child: Center(
                  child: Text(
                    optionKey,
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  text,
                  style: TextStyle(
                    fontSize: 14,
                    color: isSelected ? Colors.blue.shade900 : Colors.black87,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openQuestionPalette(
    BuildContext context,
    WidgetRef ref,
    TestPlayerNotifier notifier,
    TestPlayerState state,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          height: MediaQuery.of(context).size.height * 0.7,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Question Palette', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              // Status Legends
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  _legendItem(Colors.green, 'Answered'),
                  _legendItem(Colors.purple, 'Marked'),
                  _legendItem(Colors.red.shade300, 'Unanswered'),
                  _legendItem(Colors.grey.shade300, 'Not Visited'),
                ],
              ),
              const SizedBox(height: 16),
              // Grid
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 5,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemCount: state.questions.length,
                  itemBuilder: (context, index) {
                    final qId = state.questions[index].id;
                    final status = state.questionStatuses[qId] ?? QuestionAttemptStatus.notVisited;
                    final isCurrent = state.currentIndex == index;

                    Color tileColor;
                    Color textColor = Colors.white;

                    switch (status) {
                      case QuestionAttemptStatus.answered:
                      case QuestionAttemptStatus.answeredAndMarked:
                        tileColor = Colors.green;
                        break;
                      case QuestionAttemptStatus.markedForReview:
                        tileColor = Colors.purple;
                        break;
                      case QuestionAttemptStatus.unanswered:
                        tileColor = Colors.red.shade400;
                        break;
                      case QuestionAttemptStatus.notVisited:
                        tileColor = Colors.grey.shade300;
                        textColor = Colors.black87;
                        break;
                    }

                    return InkWell(
                      onTap: () {
                        notifier.selectQuestion(index);
                        Navigator.pop(context);
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: tileColor,
                          shape: BoxShape.circle,
                          border: isCurrent ? Border.all(color: Colors.black, width: 3) : null,
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              color: textColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _showSubmitConfirmation(context, notifier, state);
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text('Submit Test'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    );
  }

  void _showSubmitConfirmation(BuildContext context, TestPlayerNotifier notifier, TestPlayerState state) {
    int answered = 0;
    int unanswered = 0;
    int marked = 0;

    for (var q in state.questions) {
      final st = state.questionStatuses[q.id];
      if (st == QuestionAttemptStatus.answered || st == QuestionAttemptStatus.answeredAndMarked) {
        answered++;
      } else if (st == QuestionAttemptStatus.markedForReview) {
        marked++;
      } else {
        unanswered++;
      }
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit Test?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Answered: $answered'),
            Text('Unanswered: $unanswered'),
            Text('Marked for Review: $marked'),
            const SizedBox(height: 12),
            const Text('Are you sure you want to submit your test now?'),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Resume')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              notifier.submitTest();
            },
            child: const Text('Yes, Submit'),
          ),
        ],
      ),
    );
  }

  Future<bool?> _showExitConfirmDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Quit Test?'),
        content: const Text('Your progress will be lost if you leave without submitting.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Exit')),
        ],
      ),
    );
  }
}
