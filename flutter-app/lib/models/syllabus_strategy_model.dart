class SyllabusItemModel {
  final String id;
  final String? examId;
  final String? examName;
  final String stage;
  final String? version;
  final String? description;
  final String? fileUrl;

  SyllabusItemModel({
    required this.id,
    this.examId,
    this.examName,
    required this.stage,
    this.version,
    this.description,
    this.fileUrl,
  });

  factory SyllabusItemModel.fromJson(Map<String, dynamic> json) {
    String? fileUrl;
    if (json['fileMedia'] != null) {
      final p = json['fileMedia']['url'] ?? json['fileMedia']['storagePath'];
      if (p != null) {
        final pStr = p.toString();
        if (pStr.startsWith('http')) {
          fileUrl = pStr;
        } else {
          fileUrl = 'https://finalattemptias.com/${pStr.replaceAll(RegExp(r'^/'), '')}';
        }
      }
    }
    return SyllabusItemModel(
      id: json['id']?.toString() ?? '',
      examId: json['examId']?.toString() ?? json['exam']?['id']?.toString(),
      examName: json['exam'] != null ? json['exam']['name']?.toString() : null,
      stage: json['stage']?.toString() ?? 'PRELIMS',
      version: json['version']?.toString(),
      description: json['description']?.toString(),
      fileUrl: fileUrl,
    );
  }
}

class StrategyBlockModel {
  final String id;
  final String? examId;
  final String title;
  final String? category;
  final String? content;
  final String? videoUrl;
  final String? ctaText;
  final String? ctaUrl;
  final String? imageUrl;

  StrategyBlockModel({
    required this.id,
    this.examId,
    required this.title,
    this.category,
    this.content,
    this.videoUrl,
    this.ctaText,
    this.ctaUrl,
    this.imageUrl,
  });

  factory StrategyBlockModel.fromJson(Map<String, dynamic> json) {
    String? imageUrl;
    if (json['featuredImage'] != null) {
      final p = json['featuredImage']['url'] ?? json['featuredImage']['storagePath'];
      if (p != null) {
        final pStr = p.toString();
        if (pStr.startsWith('http')) {
          imageUrl = pStr;
        } else {
          imageUrl = 'https://finalattemptias.com/${pStr.replaceAll(RegExp(r'^/'), '')}';
        }
      }
    }
    return StrategyBlockModel(
      id: json['id']?.toString() ?? '',
      examId: json['examId']?.toString(),
      title: json['title']?.toString() ?? 'BPSC Strategy Guide',
      category: json['category']?.toString(),
      content: json['content']?.toString(),
      videoUrl: json['videoUrl']?.toString(),
      ctaText: json['ctaText']?.toString(),
      ctaUrl: json['ctaUrl']?.toString(),
      imageUrl: imageUrl,
    );
  }
}
