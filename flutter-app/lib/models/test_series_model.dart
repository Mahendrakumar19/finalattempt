import 'dart:convert';

class TestSeries {
  final String id;
  final String title;
  final String slug;
  final String examCategory;
  final String language;
  final String? bannerUrl;
  final String? thumbnailUrl;
  final double price;
  final double? discountedPrice;
  final int totalTests;
  final int fullLengthCount;
  final int sectionalCount;
  final int chapterCount;
  final int freeTestsCount;
  final String? description;
  final List<String> highlights;
  final int validityDays;
  final int enrolledCount;
  final bool isPurchased;

  TestSeries({
    required this.id,
    required this.title,
    required this.slug,
    required this.examCategory,
    this.language = 'Bilingual (Hindi & English)',
    this.bannerUrl,
    this.thumbnailUrl,
    required this.price,
    this.discountedPrice,
    required this.totalTests,
    this.fullLengthCount = 0,
    this.sectionalCount = 0,
    this.chapterCount = 0,
    this.freeTestsCount = 1,
    this.description,
    this.highlights = const [],
    this.validityDays = 180,
    this.enrolledCount = 0,
    this.isPurchased = false,
  });

  factory TestSeries.fromJson(Map<String, dynamic> json) {
    return TestSeries(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      examCategory: json['examCategory'] ?? json['category'] ?? 'BPSC',
      language: json['language'] ?? 'Bilingual (Hindi & English)',
      bannerUrl: json['bannerUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      discountedPrice: (json['discountedPrice'] as num?)?.toDouble(),
      totalTests: json['totalTests'] ?? 0,
      fullLengthCount: json['fullLengthCount'] ?? 0,
      sectionalCount: json['sectionalCount'] ?? 0,
      chapterCount: json['chapterCount'] ?? 0,
      freeTestsCount: json['freeTestsCount'] ?? 1,
      description: json['description'],
      highlights: (json['highlights'] as List?)?.map((e) => e.toString()).toList() ?? [],
      validityDays: json['validityDays'] ?? 180,
      enrolledCount: json['enrolledCount'] ?? 0,
      isPurchased: json['isPurchased'] ?? false,
    );
  }
}

class TestQuiz {
  final String id;
  final String courseId;
  final String title;
  final String? description;
  final int timeLimitMins;
  final int totalQuestions;
  final double totalMarks;
  final String testCategory; // 'FULL', 'SECTIONAL', 'CHAPTER', 'PYQ'
  final bool isFree;
  final bool isAttempted;
  final double? lastScore;

  TestQuiz({
    required this.id,
    required this.courseId,
    required this.title,
    this.description,
    this.timeLimitMins = 60,
    this.totalQuestions = 150,
    this.totalMarks = 150.0,
    this.testCategory = 'FULL',
    this.isFree = false,
    this.isAttempted = false,
    this.lastScore,
  });

  factory TestQuiz.fromJson(Map<String, dynamic> json) {
    return TestQuiz(
      id: json['id'] ?? '',
      courseId: json['courseId'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      timeLimitMins: json['timeLimitMins'] ?? 60,
      totalQuestions: json['totalQuestions'] ?? json['questionCount'] ?? 150,
      totalMarks: (json['totalMarks'] as num?)?.toDouble() ?? 150.0,
      testCategory: json['test_tier_category'] ?? json['testCategory'] ?? 'FULL',
      isFree: json['isFree'] ?? json['is_standalone_purchasable'] == false,
      isAttempted: json['isAttempted'] ?? false,
      lastScore: (json['lastScore'] as num?)?.toDouble(),
    );
  }
}

class TestQuestion {
  final String id;
  final String quizId;
  final String questionTextEn;
  final String? questionTextHi;
  final String optionAEn;
  final String? optionAHi;
  final String optionBEn;
  final String? optionBHi;
  final String optionCEn;
  final String? optionCHi;
  final String optionDEn;
  final String? optionDHi;
  final String? optionEEn;
  final String? optionEHi;
  final String correctAnswer; // 'A', 'B', 'C', 'D', 'E'
  final String? explanationEn;
  final String? explanationHi;
  final double marks;
  final double negativeMarks;
  final int orderIndex;

  TestQuestion({
    required this.id,
    required this.quizId,
    required this.questionTextEn,
    this.questionTextHi,
    required this.optionAEn,
    this.optionAHi,
    required this.optionBEn,
    this.optionBHi,
    required this.optionCEn,
    this.optionCHi,
    required this.optionDEn,
    this.optionDHi,
    this.optionEEn,
    this.optionEHi,
    required this.correctAnswer,
    this.explanationEn,
    this.explanationHi,
    this.marks = 1.0,
    this.negativeMarks = 0.33,
    this.orderIndex = 1,
  });

  factory TestQuestion.fromJson(Map<String, dynamic> json) {
    return TestQuestion(
      id: json['id'] ?? '',
      quizId: json['quizId'] ?? '',
      questionTextEn: json['questionText'] ?? json['questionTextEn'] ?? '',
      questionTextHi: json['questionTextHi'],
      optionAEn: json['optionA'] ?? json['optionAEn'] ?? '',
      optionAHi: json['optionAHi'],
      optionBEn: json['optionB'] ?? json['optionBEn'] ?? '',
      optionBHi: json['optionBHi'],
      optionCEn: json['optionC'] ?? json['optionCEn'] ?? '',
      optionCHi: json['optionCHi'],
      optionDEn: json['optionD'] ?? json['optionDEn'] ?? '',
      optionDHi: json['optionDHi'],
      optionEEn: json['optionE'] ?? json['optionEEn'],
      optionEHi: json['optionEHi'],
      correctAnswer: json['correctAnswer'] ?? 'A',
      explanationEn: json['explanation'] ?? json['explanationEn'],
      explanationHi: json['explanationHi'],
      marks: (json['marks'] as num?)?.toDouble() ?? 1.0,
      negativeMarks: (json['negativeMarks'] as num?)?.toDouble() ?? 0.33,
      orderIndex: json['orderIndex'] ?? 1,
    );
  }
}

enum QuestionAttemptStatus {
  notVisited,
  unanswered,
  answered,
  markedForReview,
  answeredAndMarked,
}

class TestResultSummary {
  final String quizId;
  final String quizTitle;
  final double score;
  final double maxScore;
  final int totalQuestions;
  final int correctCount;
  final int incorrectCount;
  final int unattemptedCount;
  final double accuracyPercentage;
  final int timeTakenSeconds;

  TestResultSummary({
    required this.quizId,
    required this.quizTitle,
    required this.score,
    required this.maxScore,
    required this.totalQuestions,
    required this.correctCount,
    required this.incorrectCount,
    required this.unattemptedCount,
    required this.accuracyPercentage,
    required this.timeTakenSeconds,
  });
}
