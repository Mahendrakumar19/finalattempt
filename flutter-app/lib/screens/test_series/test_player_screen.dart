import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/test_series_provider.dart';
import '../../models/test_series_model.dart';
import '../../core/theme/app_theme.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_html/flutter_html.dart';
import 'test_result_screen.dart';

class TestPlayerScreen extends ConsumerWidget {
  final String quizId;

  const TestPlayerScreen({super.key, required this.quizId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playerState = ref.watch(testPlayerProvider(quizId));
    final notifier = ref.read(testPlayerProvider(quizId).notifier);
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    // If submitted, show result screen directly
    if (playerState.isSubmitted && playerState.resultSummary != null) {
      return TestResultScreen(
        summary: playerState.resultSummary!,
        questions: playerState.questions,
        userAnswers: playerState.userAnswers,
      );
    }

    final questionsAsync = ref.watch(quizQuestionsProvider(quizId));

    if (questionsAsync.hasError) {
      return Scaffold(
        backgroundColor: bg,
        appBar: AppBar(
          backgroundColor: cardBg,
          elevation: 0.5,
          title: Text('Access Error', style: TextStyle(color: textPrimary, fontSize: 16)),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded, color: Colors.red, size: 48),
                const SizedBox(height: 16),
                Text(
                  questionsAsync.error.toString(),
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: textPrimary),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    if (Navigator.of(context).canPop()) {
                      Navigator.of(context).pop();
                    } else {
                      context.go('/');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlue,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Go Back'),
                )
              ],
            ),
          ),
        ),
      );
    }

    if (playerState.questions.isEmpty) {
      return Scaffold(
        backgroundColor: bg,
        appBar: AppBar(
          backgroundColor: cardBg,
          elevation: 0.5,
          title: Text('Loading Exam Paper...', style: TextStyle(color: textPrimary, fontSize: 16)),
        ),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: AppColors.primaryBlue),
              SizedBox(height: 16),
              Text('Fetching questions from secure server...', style: TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ),
      );
    }

    final currentQ = playerState.questions[playerState.currentIndex];
    final questionText = playerState.isHindi
        ? (currentQ.questionTextHi ?? currentQ.questionTextEn)
        : currentQ.questionTextEn;

    final mins = (playerState.remainingSeconds ~/ 60).toString().padLeft(2, '0');
    final secs = (playerState.remainingSeconds % 60).toString().padLeft(2, '0');
    final isLowTime = playerState.remainingSeconds < 300; // < 5 mins

    // Count answered questions for top header palette badge
    int answeredCount = 0;
    for (var q in playerState.questions) {
      final st = playerState.questionStatuses[q.id];
      if (st == QuestionAttemptStatus.answered || st == QuestionAttemptStatus.answeredAndMarked) {
        answeredCount++;
      }
    }

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
        backgroundColor: bg,
        appBar: AppBar(
          backgroundColor: cardBg,
          elevation: 0.5,
          scrolledUnderElevation: 0.5,
          automaticallyImplyLeading: false,
          title: Row(
            children: [
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
                onPressed: () async {
                  final shouldLeave = await _showExitConfirmDialog(context);
                  if (shouldLeave == true && context.mounted) {
                    Navigator.of(context).pop();
                  }
                },
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  playerState.quiz.title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          actions: [
            // Bilingual Language Switcher Pill
            Container(
              margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              decoration: BoxDecoration(
                color: AppColors.primaryBlue.withValues(alpha: 0.08),
                border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(20),
              ),
              child: InkWell(
                onTap: notifier.toggleLanguage,
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.translate, size: 14, color: AppColors.primaryBlue),
                      const SizedBox(width: 4),
                      Text(
                        playerState.isHindi ? 'हिन्दी' : 'ENG',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlue,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Question Palette Drawer Button with Badge
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.grid_view_rounded, color: AppColors.primaryBlue),
                  tooltip: 'Question Palette',
                  onPressed: () => _openQuestionPalette(context, ref, notifier, playerState),
                ),
                Positioned(
                  right: 4,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$answeredCount/${playerState.questions.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 6),
          ],
        ),
        body: Column(
          children: [
            // Sub-Header: Progress & Countdown Timer Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isLowTime ? const Color(0xFFFEF2F2) : cardBg,
                border: Border(bottom: BorderSide(color: borderCol)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Question Counter Chip
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryBlue,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'Q ${playerState.currentIndex + 1} / ${playerState.questions.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          '+2.0, -0.66',
                          style: TextStyle(
                            color: Color(0xFF15803D),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Timer Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: isLowTime ? const Color(0xFFDC2626) : const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: (isLowTime ? Colors.red : Colors.black).withValues(alpha: 0.15),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.timer_outlined,
                          size: 15,
                          color: isLowTime ? Colors.white : const Color(0xFF38BDF8),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '$mins:$secs',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: isLowTime ? Colors.white : const Color(0xFF38BDF8),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Question Content & Options Container
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Question Box Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: borderCol),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryBlue.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'QUESTION ${playerState.currentIndex + 1}',
                                  style: const TextStyle(
                                    color: AppColors.primaryBlue,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              if (playerState.markedForReview[currentQ.id] == true)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.purple.shade50,
                                    border: Border.all(color: Colors.purple.shade200),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(Icons.bookmark, size: 11, color: Colors.purple.shade700),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Marked for Review',
                                        style: TextStyle(
                                          color: Colors.purple.shade800,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Html(
                            data: questionText,
                            style: {
                              "body": Style(
                                fontSize: FontSize(15.5),
                                fontWeight: FontWeight.w600,
                                color: textPrimary,
                                lineHeight: LineHeight(1.5),
                                margin: Margins.zero,
                                padding: HtmlPaddings.zero,
                              ),
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Section Heading
                    Text(
                      'Select Choice:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textSecondary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Options List
                    _buildOptionTile(context, notifier, playerState, 'A', currentQ.optionAEn, currentQ.optionAHi, cardBg, textPrimary, borderCol),
                    _buildOptionTile(context, notifier, playerState, 'B', currentQ.optionBEn, currentQ.optionBHi, cardBg, textPrimary, borderCol),
                    _buildOptionTile(context, notifier, playerState, 'C', currentQ.optionCEn, currentQ.optionCHi, cardBg, textPrimary, borderCol),
                    _buildOptionTile(context, notifier, playerState, 'D', currentQ.optionDEn, currentQ.optionDHi, cardBg, textPrimary, borderCol),
                    if (currentQ.optionEEn != null)
                      _buildOptionTile(context, notifier, playerState, 'E', currentQ.optionEEn!, currentQ.optionEHi, cardBg, textPrimary, borderCol),
                  ],
                ),
              ),
            ),

            // Bottom Action Navigation Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: cardBg,
                border: Border(top: BorderSide(color: borderCol)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    // Clear response
                    OutlinedButton(
                      onPressed: notifier.clearResponse,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        side: BorderSide(color: borderCol),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Clear', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                    ),
                    const SizedBox(width: 8),

                    // Mark for review
                    OutlinedButton(
                      onPressed: notifier.toggleMarkForReview,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        side: BorderSide(
                          color: (playerState.markedForReview[currentQ.id] ?? false) ? Colors.purple : borderCol,
                        ),
                        backgroundColor: (playerState.markedForReview[currentQ.id] ?? false) ? Colors.purple.shade50 : null,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(
                        (playerState.markedForReview[currentQ.id] ?? false) ? '🟣 Marked' : 'Mark Review',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: (playerState.markedForReview[currentQ.id] ?? false) ? Colors.purple.shade700 : textPrimary,
                        ),
                      ),
                    ),
                    const Spacer(),

                    // Previous Button
                    if (playerState.currentIndex > 0)
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
                        onPressed: notifier.previousQuestion,
                        color: textPrimary,
                        tooltip: 'Previous Question',
                      ),

                    const SizedBox(width: 4),

                    // Next / Submit Button
                    ElevatedButton(
                      onPressed: () {
                        if (playerState.currentIndex < playerState.questions.length - 1) {
                          notifier.nextQuestion();
                        } else {
                          _showSubmitConfirmation(context, notifier, playerState);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryBlue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                      child: Row(
                        children: [
                          Text(
                            playerState.currentIndex < playerState.questions.length - 1 ? 'Save & Next' : 'Submit Test',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 6),
                          Icon(
                            playerState.currentIndex < playerState.questions.length - 1
                                ? Icons.arrow_forward_rounded
                                : Icons.check_circle_rounded,
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
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
    Color cardBg,
    Color textPrimary,
    Color borderCol,
  ) {
    final currentQ = state.questions[state.currentIndex];
    final isSelected = state.userAnswers[currentQ.id] == optionKey;
    final text = state.isHindi ? (textHi ?? textEn) : textEn;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => notifier.selectOption(optionKey),
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.lightBlueBackground : cardBg,
            border: Border.all(
              color: isSelected ? AppColors.primaryBlue : borderCol,
              width: isSelected ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primaryBlue.withValues(alpha: 0.1),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    )
                  ]
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? AppColors.primaryBlue : Colors.transparent,
                  border: Border.all(
                    color: isSelected ? AppColors.primaryBlue : AppColors.textSecondary.withValues(alpha: 0.4),
                    width: isSelected ? 2 : 1.5,
                  ),
                ),
                child: Center(
                  child: isSelected
                      ? const Icon(Icons.check, size: 18, color: Colors.white)
                      : Text(
                          optionKey,
                          style: TextStyle(
                            color: textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Html(
                  data: text,
                  style: {
                    "body": Style(
                      fontSize: FontSize(14.0),
                      color: isSelected ? AppColors.primaryBlue : textPrimary,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      margin: Margins.zero,
                      padding: HtmlPaddings.zero,
                    ),
                  },
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
    int answered = 0;
    int marked = 0;
    int unanswered = 0;
    int notVisited = 0;

    for (var q in state.questions) {
      final st = state.questionStatuses[q.id];
      if (st == QuestionAttemptStatus.answered || st == QuestionAttemptStatus.answeredAndMarked) {
        answered++;
      } else if (st == QuestionAttemptStatus.markedForReview) {
        marked++;
      } else if (st == QuestionAttemptStatus.unanswered) {
        unanswered++;
      } else {
        notVisited++;
      }
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.cardBgOf(context),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(18),
          height: MediaQuery.of(context).size.height * 0.75,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Question Palette', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 8),

              // Status Summary Chips
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _statusChip(Colors.green.shade600, '$answered', 'Answered'),
                  _statusChip(Colors.purple.shade600, '$marked', 'Marked'),
                  _statusChip(Colors.red.shade400, '$unanswered', 'Unanswered'),
                  _statusChip(Colors.grey.shade400, '$notVisited', 'Not Visited'),
                ],
              ),
              const SizedBox(height: 16),

              // Grid of Questions
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 5,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
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
                        tileColor = Colors.green.shade600;
                        break;
                      case QuestionAttemptStatus.markedForReview:
                        tileColor = Colors.purple.shade600;
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
                      borderRadius: BorderRadius.circular(24),
                      child: Container(
                        decoration: BoxDecoration(
                          color: tileColor,
                          shape: BoxShape.circle,
                          border: isCurrent ? Border.all(color: AppColors.primaryBlue, width: 3) : null,
                          boxShadow: isCurrent
                              ? [
                                  BoxShadow(
                                    color: AppColors.primaryBlue.withValues(alpha: 0.4),
                                    blurRadius: 6,
                                    spreadRadius: 1,
                                  )
                                ]
                              : null,
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              color: textColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _showSubmitConfirmation(context, notifier, state);
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                  backgroundColor: AppColors.primaryBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('SUBMIT TEST NOW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _statusChip(Color color, String count, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(count, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
        ],
      ),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.assignment_turned_in, color: AppColors.primaryBlue),
            SizedBox(width: 8),
            Text('Submit Test Confirmation', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to submit your test now?', style: TextStyle(fontSize: 13)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  _summaryRow(Colors.green, 'Answered Questions', '$answered'),
                  const SizedBox(height: 6),
                  _summaryRow(Colors.purple, 'Marked for Review', '$marked'),
                  const SizedBox(height: 6),
                  _summaryRow(Colors.red.shade400, 'Unanswered Questions', '$unanswered'),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Resume Test'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              notifier.submitTest();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlue,
              foregroundColor: Colors.white,
            ),
            child: const Text('Yes, Submit'),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(Color color, String label, String val) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontSize: 12)),
          ],
        ),
        Text(val, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
      ],
    );
  }

  Future<bool?> _showExitConfirmDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Quit Test?', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Your current progress will be lost if you leave without submitting.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Exit Test'),
          ),
        ],
      ),
    );
  }
}
