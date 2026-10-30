import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/test_series_model.dart';
import '../core/services/api_service.dart';

// Test Series List Provider - Strictly dynamic live API fetch
final testSeriesListProvider = FutureProvider.autoDispose<List<TestSeries>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  final response = await apiService.get('/test-series');
  final data = response is Map ? (response['data'] ?? response) : response;
  if (data is List) {
    return data.map((item) => TestSeries.fromJson(item)).toList();
  }
  return [];
});

// Single Test Series Detail Provider
final testSeriesDetailProvider = FutureProvider.family.autoDispose<TestSeries, String>((ref, id) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    final response = await apiService.get('/test-series/$id');
    final data = response is Map ? (response['data'] ?? response) : response;
    if (data != null && data is Map<String, dynamic>) {
      return TestSeries.fromJson(data);
    }
  } catch (_) {}
  final list = await ref.watch(testSeriesListProvider.future);
  return list.firstWhere((item) => item.id == id || item.slug == id);
});

// Quizzes under a test series provider - Strictly dynamic live API fetch with natural sequence sorting
final testSeriesQuizzesProvider = FutureProvider.family.autoDispose<List<TestQuiz>, String>((ref, seriesId) async {
  final apiService = ref.watch(apiServiceProvider);
  final response = await apiService.get('/lms/courses/$seriesId/quizzes');
  final data = response is Map ? (response['data'] ?? response) : response;
  if (data is List) {
    final list = data.map((item) => TestQuiz.fromJson(item)).toList();
    list.sort((a, b) {
      if (a.sequenceNumber != b.sequenceNumber) {
        return a.sequenceNumber.compareTo(b.sequenceNumber);
      }
      return a.title.compareTo(b.title);
    });
    return list;
  }
  return [];
});

// Test Series Plans Provider (MINI, HALF, FULL)
final testSeriesPlansProvider = FutureProvider.family.autoDispose<List<TestSeriesPlan>, String>((ref, seriesId) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    final response = await apiService.get('/test-series-purchase/$seriesId/plans');
    final data = response is Map ? (response['data'] ?? response) : response;
    if (data is List && data.isNotEmpty) {
      return data.map((item) => TestSeriesPlan.fromJson(item)).toList();
    }
  } catch (_) {}

  // Fallback defaults if plans are not yet customized in DB
  return [
    TestSeriesPlan(
      id: 'mini-default',
      seriesId: seriesId,
      planCode: 'MINI',
      title: 'MINI Package',
      description: 'Tests 1 to 16 with solutions & rankings',
      sequenceStartNumber: 1,
      sequenceEndNumber: 16,
      price: 299,
      discountedPrice: 249,
    ),
    TestSeriesPlan(
      id: 'half-default',
      seriesId: seriesId,
      planCode: 'HALF',
      title: 'HALF Package',
      description: 'Tests 1 to 28 with sectional practice',
      sequenceStartNumber: 1,
      sequenceEndNumber: 28,
      price: 499,
      discountedPrice: 399,
    ),
    TestSeriesPlan(
      id: 'full-default',
      seriesId: seriesId,
      planCode: 'FULL',
      title: 'FULL Package',
      description: 'All 40+ tests, all sectional & full length mocks',
      sequenceStartNumber: 1,
      sequenceEndNumber: 40,
      price: 699,
      discountedPrice: 599,
    ),
  ];
});

// User Entitlements Provider
final userEntitlementsProvider = FutureProvider.family.autoDispose<List<UserEntitlement>, String>((ref, seriesId) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    final response = await apiService.get('/test-series-purchase/entitlements', params: {'seriesId': seriesId});
    final data = response is Map ? (response['data'] ?? response) : response;
    if (data is List) {
      return data.map((item) => UserEntitlement.fromJson(item)).toList();
    }
  } catch (_) {}
  return [];
});

// Interactive Test Player State Engine
class TestPlayerState {
  final TestQuiz quiz;
  final List<TestQuestion> questions;
  final int currentIndex;
  final Map<String, String> userAnswers; // questionId -> option ('A'..'E')
  final Map<String, bool> markedForReview; // questionId -> bool
  final Map<String, QuestionAttemptStatus> questionStatuses;
  final int remainingSeconds;
  final bool isHindi;
  final bool isSubmitted;
  final TestResultSummary? resultSummary;

  TestPlayerState({
    required this.quiz,
    required this.questions,
    this.currentIndex = 0,
    required this.userAnswers,
    required this.markedForReview,
    required this.questionStatuses,
    required this.remainingSeconds,
    this.isHindi = false,
    this.isSubmitted = false,
    this.resultSummary,
  });

  TestPlayerState copyWith({
    List<TestQuestion>? questions,
    int? currentIndex,
    Map<String, String>? userAnswers,
    Map<String, bool>? markedForReview,
    Map<String, QuestionAttemptStatus>? questionStatuses,
    int? remainingSeconds,
    bool? isHindi,
    bool? isSubmitted,
    TestResultSummary? resultSummary,
  }) {
    return TestPlayerState(
      quiz: quiz,
      questions: questions ?? this.questions,
      currentIndex: currentIndex ?? this.currentIndex,

      userAnswers: userAnswers ?? this.userAnswers,
      markedForReview: markedForReview ?? this.markedForReview,
      questionStatuses: questionStatuses ?? this.questionStatuses,
      remainingSeconds: remainingSeconds ?? this.remainingSeconds,
      isHindi: isHindi ?? this.isHindi,
      isSubmitted: isSubmitted ?? this.isSubmitted,
      resultSummary: resultSummary ?? this.resultSummary,
    );
  }
}

class TestPlayerNotifier extends StateNotifier<TestPlayerState> {
  final dynamic apiService;
  Timer? _timer;

  TestPlayerNotifier(this.apiService, TestQuiz quiz, List<TestQuestion> questions)
      : super(TestPlayerState(
          quiz: quiz,
          questions: questions,
          userAnswers: {},
          markedForReview: {},
          questionStatuses: {
            for (var q in questions) q.id: QuestionAttemptStatus.notVisited
          },
          remainingSeconds: quiz.timeLimitMins * 60,
        )) {
    _startTimer();
    // Mark initial question as visited
    if (questions.isNotEmpty) {
      _markVisited(0);
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.remainingSeconds <= 1) {
        timer.cancel();
        submitTest();
      } else {
        state = state.copyWith(remainingSeconds: state.remainingSeconds - 1);
      }
    });
  }

  void _markVisited(int index) {
    if (index < 0 || index >= state.questions.length) return;
    final qId = state.questions[index].id;
    if (state.questionStatuses[qId] == QuestionAttemptStatus.notVisited) {
      final updatedStatuses = Map<String, QuestionAttemptStatus>.from(state.questionStatuses);
      updatedStatuses[qId] = QuestionAttemptStatus.unanswered;
      state = state.copyWith(questionStatuses: updatedStatuses);
    }
  }

  void selectQuestion(int index) {
    _markVisited(index);
    state = state.copyWith(currentIndex: index);
  }

  void toggleLanguage() {
    state = state.copyWith(isHindi: !state.isHindi);
  }

  void selectOption(String option) {
    final qId = state.questions[state.currentIndex].id;
    final updatedAnswers = Map<String, String>.from(state.userAnswers);
    updatedAnswers[qId] = option;

    _updateStatusForQuestion(qId, updatedAnswers, state.markedForReview);
    state = state.copyWith(userAnswers: updatedAnswers);
  }

  void clearResponse() {
    final qId = state.questions[state.currentIndex].id;
    final updatedAnswers = Map<String, String>.from(state.userAnswers);
    updatedAnswers.remove(qId);

    _updateStatusForQuestion(qId, updatedAnswers, state.markedForReview);
    state = state.copyWith(userAnswers: updatedAnswers);
  }

  void toggleMarkForReview() {
    final qId = state.questions[state.currentIndex].id;
    final updatedMarked = Map<String, bool>.from(state.markedForReview);
    final isCurrentlyMarked = updatedMarked[qId] ?? false;
    updatedMarked[qId] = !isCurrentlyMarked;

    _updateStatusForQuestion(qId, state.userAnswers, updatedMarked);
    state = state.copyWith(markedForReview: updatedMarked);
  }

  void _updateStatusForQuestion(
    String qId,
    Map<String, String> answers,
    Map<String, bool> marked,
  ) {
    final hasAnswer = answers.containsKey(qId);
    final isMarked = marked[qId] ?? false;

    QuestionAttemptStatus status;
    if (hasAnswer && isMarked) {
      status = QuestionAttemptStatus.answeredAndMarked;
    } else if (hasAnswer) {
      status = QuestionAttemptStatus.answered;
    } else if (isMarked) {
      status = QuestionAttemptStatus.markedForReview;
    } else {
      status = QuestionAttemptStatus.unanswered;
    }

    final updatedStatuses = Map<String, QuestionAttemptStatus>.from(state.questionStatuses);
    updatedStatuses[qId] = status;
    state = state.copyWith(questionStatuses: updatedStatuses);
  }

  void nextQuestion() {
    if (state.currentIndex < state.questions.length - 1) {
      selectQuestion(state.currentIndex + 1);
    }
  }

  void previousQuestion() {
    if (state.currentIndex > 0) {
      selectQuestion(state.currentIndex - 1);
    }
  }

  Future<void> submitTest() async {
    _timer?.cancel();

    try {
      final response = await apiService.post(
        '/quizzes/${state.quiz.id}/submit',
        data: {'answers': state.userAnswers},
      );

      final data = response is Map ? (response['data'] ?? response) : response;
      if (data == null) throw Exception("No data returned from submit.");

      final summary = TestResultSummary(
        quizId: state.quiz.id,
        quizTitle: state.quiz.title,
        score: double.tryParse(data['score']?.toString() ?? '0') ?? 0.0,
        maxScore: double.tryParse(data['maxScore']?.toString() ?? '0') ?? state.quiz.totalMarks,
        totalQuestions: data['totalQuestions'] ?? state.questions.length,
        correctCount: _countStatus(data['details'], true),
        incorrectCount: _countStatus(data['details'], false),
        unattemptedCount: _countUnattempted(data['details'], state.questions.length),
        accuracyPercentage: _calculateAccuracy(data['details']),
        timeTakenSeconds: (state.quiz.timeLimitMins * 60) - state.remainingSeconds,
      );

      // Update state.questions with correct answers and explanations from the backend
      final detailsList = data['details'] as List? ?? [];
      final updatedQuestions = state.questions.map((q) {
        final detail = detailsList.firstWhere(
          (d) => d['questionId'] == q.id,
          orElse: () => null,
        );
        if (detail == null) return q;
        return q.copyWith(
          correctAnswer: detail['correctAnswer'],
          explanationEn: detail['explanation'],
          explanationHi: detail['explanationHi'],
        );
      }).toList();

      state = state.copyWith(
        isSubmitted: true,
        resultSummary: summary,
        questions: updatedQuestions,
      );
    } catch (_) {
      // For fallback, we just mark it submitted with 0s if offline submission completely failed
      state = state.copyWith(
        isSubmitted: true,
        resultSummary: TestResultSummary(
          quizId: state.quiz.id,
          quizTitle: state.quiz.title,
          score: 0.0,
          maxScore: state.quiz.totalMarks,
          totalQuestions: state.questions.length,
          correctCount: 0,
          incorrectCount: 0,
          unattemptedCount: state.questions.length,
          accuracyPercentage: 0.0,
          timeTakenSeconds: (state.quiz.timeLimitMins * 60) - state.remainingSeconds,
        ),
      );
    }
  }

  int _countStatus(dynamic details, bool isCorrectStatus) {
    if (details is! List) return 0;
    return details.where((d) => d['isCorrect'] == isCorrectStatus && d['studentAnswer'] != null).length;
  }

  int _countUnattempted(dynamic details, int total) {
    if (details is! List) return total;
    return details.where((d) => d['studentAnswer'] == null).length;
  }

  double _calculateAccuracy(dynamic details) {
    if (details is! List) return 0.0;
    final totalAtt = details.where((d) => d['studentAnswer'] != null).length;
    if (totalAtt == 0) return 0.0;
    final correctCount = _countStatus(details, true);
    final acc = (correctCount / totalAtt) * 100;
    return double.parse(acc.toStringAsFixed(1));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

// Dynamic Live Questions & Test Attempt Provider
final quizQuestionsProvider = FutureProvider.family.autoDispose<List<TestQuestion>, String>((ref, quizId) async {
  final apiService = ref.watch(apiServiceProvider);
  try {
    // If daily quiz ID or slug
    if (quizId.startsWith('daily') || quizId.contains('quiz')) {
      final dailyRes = await apiService.get('/quizzes/daily/$quizId/start');
      final dData = dailyRes is Map ? (dailyRes['data'] ?? dailyRes) : dailyRes;
      if (dData is Map && dData.containsKey('questions')) {
        final questionsList = dData['questions'] as List;
        return questionsList.map((q) => TestQuestion.fromJson(q)).toList();
      }
    }

    final response = await apiService.get('/quizzes/$quizId/start');
    final data = response is Map ? (response['data'] ?? response) : response;
    if (data is Map && data.containsKey('questions')) {
      final questionsList = data['questions'] as List;
      return questionsList.map((q) => TestQuestion.fromJson(q)).toList();
    } else if (data is List) {
      return data.map((q) => TestQuestion.fromJson(q)).toList();
    }
  } catch (_) {
    // Fallback: try daily endpoint if standard failed
    try {
      final fallbackRes = await apiService.get('/quizzes/daily/$quizId/start');
      final fData = fallbackRes is Map ? (fallbackRes['data'] ?? fallbackRes) : fallbackRes;
      if (fData is Map && fData.containsKey('questions')) {
        final questionsList = fData['questions'] as List;
        return questionsList.map((q) => TestQuestion.fromJson(q)).toList();
      }
    } catch (_) {}
  }
  return [];
});

final testPlayerProvider = StateNotifierProvider.family.autoDispose<TestPlayerNotifier, TestPlayerState, String>((ref, quizId) {
  final questionsAsync = ref.watch(quizQuestionsProvider(quizId));
  final questions = questionsAsync.valueOrNull ?? [];

  final quiz = TestQuiz(
    id: quizId,
    courseId: '',
    title: 'Dynamic Test Attempt',
    timeLimitMins: 60,
    totalQuestions: questions.length,
    totalMarks: questions.length.toDouble(),
  );

  final apiService = ref.watch(apiServiceProvider);
  return TestPlayerNotifier(apiService, quiz, questions);
});
