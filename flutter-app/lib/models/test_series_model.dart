
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

  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  factory TestSeries.fromJson(Map<String, dynamic> json) {
    return TestSeries(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      examCategory: json['examCategory'] ?? json['category'] ?? 'BPSC',
      language: json['language'] ?? 'Bilingual (Hindi & English)',
      bannerUrl: json['bannerUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      price: _parseDouble(json['price']) ?? 0.0,
      discountedPrice: _parseDouble(json['discountedPrice']),
      totalTests: json['totalTests'] ?? 0,
      fullLengthCount: json['fullLengthCount'] ?? 0,
      sectionalCount: json['sectionalCount'] ?? 0,
      chapterCount: json['chapterCount'] ?? 0,
      freeTestsCount: json['freeTestsCount'] ?? 1,
      description: json['description'],
      highlights: (json['highlights'] as List?)?.map((e) => e.toString()).toList() ?? [],
      validityDays: json['validityDays'] ?? 180,
      enrolledCount: json['enrolledCount'] ?? 0,
      isPurchased: json['isPurchased'] == true || json['isPurchased'] == 1,
    );
  }
}

class TestSeriesPlan {
  final String id;
  final String seriesId;
  final String planCode; // 'MINI', 'HALF', 'FULL', 'COMPLETE'
  final String title;
  final String? description;
  final int sequenceStartNumber;
  final int sequenceEndNumber;
  final double price;
  final double? discountedPrice;
  final String? includedQuizIds;
  final bool isActive;

  TestSeriesPlan({
    required this.id,
    required this.seriesId,
    required this.planCode,
    required this.title,
    this.description,
    this.sequenceStartNumber = 1,
    this.sequenceEndNumber = 40,
    required this.price,
    this.discountedPrice,
    this.includedQuizIds,
    this.isActive = true,
  });

  double get sellingPrice {
    if (discountedPrice != null && discountedPrice! > 0) {
      return discountedPrice! < price ? discountedPrice! : price;
    }
    return price;
  }

  double? get originalMrp {
    if (discountedPrice != null && discountedPrice! > 0 && discountedPrice! < price) {
      return price;
    }
    return null;
  }

  int get testCount {
    if (includedQuizIds != null && includedQuizIds!.isNotEmpty) {
      try {
        final List<dynamic> ids = (includedQuizIds!.startsWith('[') && includedQuizIds!.endsWith(']'))
            ? (includedQuizIds!.replaceAll(RegExp(r'[\[\]" ]'), '').split(',').where((s) => s.isNotEmpty).toList())
            : [];
        if (ids.isNotEmpty) return ids.length;
      } catch (_) {}
    }
    return (sequenceEndNumber - sequenceStartNumber + 1).clamp(0, 999);
  }

  factory TestSeriesPlan.fromJson(Map<String, dynamic> json) {
    return TestSeriesPlan(
      id: json['id'] ?? '',
      seriesId: json['series_id'] ?? json['seriesId'] ?? '',
      planCode: (json['plan_code'] ?? json['planCode'] ?? 'FULL').toString().toUpperCase(),
      title: json['title'] ?? '',
      description: json['description'],
      sequenceStartNumber: json['sequence_start_number'] ?? json['sequenceStartNumber'] ?? 1,
      sequenceEndNumber: json['sequence_end_number'] ?? json['sequenceEndNumber'] ?? 40,
      price: TestSeries._parseDouble(json['price']) ?? 0.0,
      discountedPrice: TestSeries._parseDouble(json['discounted_price'] ?? json['discountedPrice']),
      includedQuizIds: json['included_quiz_ids']?.toString() ?? json['includedQuizIds']?.toString(),
      isActive: json['is_active'] == null || json['is_active'] == true || json['is_active'] == 1,
    );
  }
}

class UserEntitlement {
  final String id;
  final String seriesId;
  final String entitlementType; // 'MINI', 'HALF', 'FULL', 'COMPLETE', 'LEGACY_ENROLLMENT', 'INDIVIDUAL_TEST'
  final int maxSequenceNumber;
  final int snapshotMaxSequence;
  final String status;
  final String? quizId;

  UserEntitlement({
    required this.id,
    required this.seriesId,
    required this.entitlementType,
    this.maxSequenceNumber = 999,
    this.snapshotMaxSequence = 999,
    this.status = 'ACTIVE',
    this.quizId,
  });

  factory UserEntitlement.fromJson(Map<String, dynamic> json) {
    return UserEntitlement(
      id: json['id'] ?? '',
      seriesId: json['series_id'] ?? json['seriesId'] ?? '',
      entitlementType: (json['entitlement_type'] ?? json['entitlementType'] ?? 'FULL').toString().toUpperCase(),
      maxSequenceNumber: json['max_sequence_number'] ?? json['maxSequenceNumber'] ?? 999,
      snapshotMaxSequence: json['snapshot_max_sequence'] ?? json['snapshotMaxSequence'] ?? 999,
      status: json['status'] ?? 'ACTIVE',
      quizId: json['quiz_id'] ?? json['quizId'],
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
      totalMarks: TestSeries._parseDouble(json['totalMarks']) ?? 150.0,
      testCategory: json['test_tier_category'] ?? json['testCategory'] ?? 'FULL',
      isFree: json['isFree'] == true || json['isFree'] == 1 || json['is_standalone_purchasable'] == false,
      isAttempted: json['isAttempted'] == true || json['isAttempted'] == 1,
      lastScore: TestSeries._parseDouble(json['lastScore']),
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

  static String? _parseString(dynamic val) {
    if (val == null) return null;
    final str = val.toString();
    return str.isEmpty ? null : str;
  }

  TestQuestion copyWith({
    String? correctAnswer,
    String? explanationEn,
    String? explanationHi,
  }) {
    return TestQuestion(
      id: id,
      quizId: quizId,
      questionTextEn: questionTextEn,
      questionTextHi: questionTextHi,
      optionAEn: optionAEn,
      optionAHi: optionAHi,
      optionBEn: optionBEn,
      optionBHi: optionBHi,
      optionCEn: optionCEn,
      optionCHi: optionCHi,
      optionDEn: optionDEn,
      optionDHi: optionDHi,
      optionEEn: optionEEn,
      optionEHi: optionEHi,
      correctAnswer: correctAnswer ?? this.correctAnswer,
      explanationEn: explanationEn ?? this.explanationEn,
      explanationHi: explanationHi ?? this.explanationHi,
      marks: marks,
      negativeMarks: negativeMarks,
      orderIndex: orderIndex,
    );
  }

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
      optionEEn: _parseString(json['optionE'] ?? json['optionEEn']),
      optionEHi: _parseString(json['optionEHi']),
      correctAnswer: json['correctAnswer'] ?? 'A',
      explanationEn: _parseString(json['explanation'] ?? json['explanationEn']),
      explanationHi: _parseString(json['explanationHi']),
      marks: TestSeries._parseDouble(json['marks']) ?? 1.0,
      negativeMarks: TestSeries._parseDouble(json['negativeMarks']) ?? 0.33,
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
