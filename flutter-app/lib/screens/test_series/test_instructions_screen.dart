import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/test_series_provider.dart';
import '../../core/theme/app_theme.dart';

class TestInstructionsScreen extends ConsumerStatefulWidget {
  final String quizId;

  const TestInstructionsScreen({super.key, required this.quizId});

  @override
  ConsumerState<TestInstructionsScreen> createState() => _TestInstructionsScreenState();
}

class _TestInstructionsScreenState extends ConsumerState<TestInstructionsScreen> {
  bool _agreedToTerms = false;
  String _selectedLanguage = 'en'; // 'en' or 'hi'

  @override
  Widget build(BuildContext context) {
    final questionsAsync = ref.watch(quizQuestionsProvider(widget.quizId));
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/test-series'),
        ),
        title: Text(
          'Exam Instructions & Guidelines',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
        ),
      ),
      body: questionsAsync.when(
        loading: () => const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: AppColors.primaryBlue),
              SizedBox(height: 16),
              Text('Preparing exam paper...', style: TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 48),
                const SizedBox(height: 16),
                Text(err.toString(), textAlign: TextAlign.center, style: TextStyle(color: textPrimary)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.pop(),
                  child: const Text('Go Back'),
                )
              ],
            ),
          ),
        ),
        data: (questions) {
          final notifier = ref.read(testPlayerProvider(widget.quizId).notifier);
          final quizState = ref.watch(testPlayerProvider(widget.quizId));
          final quiz = quizState.quiz;

          final totalQuestions = questions.length;
          final timeLimit = quiz.timeLimitMins > 0 ? quiz.timeLimitMins : (totalQuestions * 1.2).toInt();
          final totalMarks = quiz.totalMarks > 0 ? quiz.totalMarks : (totalQuestions * 2.0);
          final marksPerQ = totalQuestions > 0 ? (totalMarks / totalQuestions) : 2.0;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header Summary Card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1E3A8A), Color(0xFF0F172A)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryBlue.withValues(alpha: 0.25),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                'ONLINE EXAMINATION',
                                style: TextStyle(
                                  color: Color(0xFF93C5FD),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              quiz.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Stats Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildStatPill(Icons.help_outline, '$totalQuestions', 'Questions'),
                                _buildStatPill(Icons.timer_outlined, '$timeLimit Mins', 'Duration'),
                                _buildStatPill(Icons.stars_outlined, '${totalMarks.toInt()}', 'Total Marks'),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Marking Scheme Alert
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline, color: Color(0xFF1D4ED8), size: 22),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Marking Scheme',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: Color(0xFF1E40AF),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Correct Answer: +${marksPerQ.toStringAsFixed(1)} Marks | Incorrect Answer: -${(marksPerQ / 3).toStringAsFixed(2)} Marks (1/3 Negative)',
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF1E3A8A)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Instructions Section
                      Text(
                        'General Exam Rules & Instructions',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
                      ),
                      const SizedBox(height: 12),

                      _buildInstructionCard(
                        context,
                        cardBg,
                        borderCol,
                        textPrimary,
                        [
                          '1. The test clock will start as soon as you click the "Start Exam Now" button.',
                          '2. The timer at the top-right corner of the screen will show the remaining time available to complete the test.',
                          '3. Question Palette status color legend:',
                        ],
                      ),

                      const SizedBox(height: 12),

                      // Question Palette Legend
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderCol),
                        ),
                        child: Column(
                          children: [
                            _buildLegendRow(Colors.green.shade600, 'Answered', 'You have selected an answer.'),
                            const SizedBox(height: 8),
                            _buildLegendRow(Colors.purple.shade600, 'Marked for Review', 'Question marked for later review.'),
                            const SizedBox(height: 8),
                            _buildLegendRow(Colors.red.shade400, 'Unanswered', 'Visited but no answer selected.'),
                            const SizedBox(height: 8),
                            _buildLegendRow(Colors.grey.shade400, 'Not Visited', 'Question has not been opened yet.'),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      _buildInstructionCard(
                        context,
                        cardBg,
                        borderCol,
                        textPrimary,
                        [
                          '4. You can switch between English and Hindi questions at any time using the language toggle in the top bar.',
                          '5. Click "Save & Next" to record your response and proceed to the next question.',
                          '6. Do not refresh or exit the browser/app during an ongoing exam session. Your test will automatically submit when the timer expires.',
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Default Language Selection
                      Text(
                        'Choose Default Question Paper Language',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textPrimary),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: _buildLangSelector(
                              label: 'English',
                              subLabel: 'Standard English Paper',
                              value: 'en',
                              selected: _selectedLanguage == 'en',
                              onTap: () => setState(() => _selectedLanguage = 'en'),
                              cardBg: cardBg,
                              borderCol: borderCol,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildLangSelector(
                              label: 'हिन्दी माध्यम',
                              subLabel: 'Hindi Medium Paper',
                              value: 'hi',
                              selected: _selectedLanguage == 'hi',
                              onTap: () => setState(() => _selectedLanguage = 'hi'),
                              cardBg: cardBg,
                              borderCol: borderCol,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // Declaration Checkbox
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _agreedToTerms ? AppColors.lightBlueBackground : cardBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _agreedToTerms ? AppColors.primaryBlue : borderCol,
                          ),
                        ),
                        child: CheckboxListTile(
                          value: _agreedToTerms,
                          onChanged: (val) => setState(() => _agreedToTerms = val ?? false),
                          activeColor: AppColors.primaryBlue,
                          contentPadding: EdgeInsets.zero,
                          controlAffinity: ListTileControlAffinity.leading,
                          title: const Text(
                            'I have read and understood all instructions. I agree to abide by the exam regulations and start the test with full integrity.',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.4),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom Start Bar
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cardBg,
                  border: Border(top: BorderSide(color: borderCol)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -3),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: ElevatedButton(
                    onPressed: _agreedToTerms
                        ? () {
                            if (_selectedLanguage == 'hi' && !quizState.isHindi) {
                              notifier.toggleLanguage();
                            } else if (_selectedLanguage == 'en' && quizState.isHindi) {
                              notifier.toggleLanguage();
                            }
                            context.pushReplacement('/test/${widget.quizId}/attempt');
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      backgroundColor: AppColors.primaryBlue,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade300,
                      disabledForegroundColor: Colors.grey.shade600,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'I AM READY TO BEGIN',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward_rounded, size: 18),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatPill(IconData icon, String val, String label) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: const Color(0xFF93C5FD)),
            const SizedBox(width: 4),
            Text(
              val,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
        ),
      ],
    );
  }

  Widget _buildInstructionCard(
    BuildContext context,
    Color cardBg,
    Color borderCol,
    Color textPrimary,
    List<String> rules,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: rules
            .map((r) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    r,
                    style: TextStyle(fontSize: 12.5, color: textPrimary, height: 1.4),
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildLegendRow(Color color, String label, String desc) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
              Text(
                desc,
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLangSelector({
    required String label,
    required String subLabel,
    required String value,
    required bool selected,
    required VoidCallback onTap,
    required Color cardBg,
    required Color borderCol,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected ? AppColors.lightBlueBackground : cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? AppColors.primaryBlue : borderCol,
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  selected ? Icons.radio_button_checked : Icons.radio_button_off,
                  size: 18,
                  color: selected ? AppColors.primaryBlue : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: selected ? AppColors.primaryBlue : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              subLabel,
              style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
