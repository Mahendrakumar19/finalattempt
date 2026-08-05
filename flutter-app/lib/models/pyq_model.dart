class PyqExamModel {
  final String id;
  final String name;
  final String? code;
  final String? slug;
  final bool isActive;

  const PyqExamModel({
    required this.id,
    required this.name,
    this.code,
    this.slug,
    this.isActive = true,
  });

  factory PyqExamModel.fromJson(Map<String, dynamic> json) => PyqExamModel(
    id: json['id']?.toString() ?? '',
    name: json['name'] ?? '',
    code: json['code'],
    slug: json['slug'],
    isActive: json['isActive'] ?? true,
  );
}

class PyqModel {
  final String id;
  final String examId;
  final PyqExamModel? exam;
  final int year;
  final String stage;
  final String paperName;
  final String? questionPaperPath;
  final String? answerKeyPath;
  final String? solutionPath;
  final String? description;
  final int sortOrder;

  const PyqModel({
    required this.id,
    required this.examId,
    this.exam,
    required this.year,
    required this.stage,
    required this.paperName,
    this.questionPaperPath,
    this.answerKeyPath,
    this.solutionPath,
    this.description,
    this.sortOrder = 0,
  });

  String _resolveMediaPath(Map<String, dynamic>? mediaObj) {
    if (mediaObj == null) return '';
    final p = mediaObj['storagePath'] ?? mediaObj['url'] ?? mediaObj['path'] ?? '';
    if (p.isEmpty) return '';
    if (p.startsWith('http')) return p;
    return 'https://finalattemptias.com/$p';
  }

  factory PyqModel.fromJson(Map<String, dynamic> json) {
    final instance = PyqModel(
      id: json['id']?.toString() ?? '',
      examId: json['examId']?.toString() ?? '',
      exam: json['exam'] != null ? PyqExamModel.fromJson(json['exam']) : null,
      year: json['year'] ?? 0,
      stage: json['stage'] ?? 'PRELIMS',
      paperName: json['paperName'] ?? '',
      description: json['description'],
      sortOrder: json['sortOrder'] ?? 0,
    );
    // Resolve media paths
    return PyqModel(
      id: instance.id,
      examId: instance.examId,
      exam: instance.exam,
      year: instance.year,
      stage: instance.stage,
      paperName: instance.paperName,
      questionPaperPath: instance._resolveMediaPath(json['questionPaper'] as Map<String, dynamic>?),
      answerKeyPath: instance._resolveMediaPath(json['answerKey'] as Map<String, dynamic>?),
      solutionPath: instance._resolveMediaPath(json['solution'] as Map<String, dynamic>?),
      description: instance.description,
      sortOrder: instance.sortOrder,
    );
  }
}
