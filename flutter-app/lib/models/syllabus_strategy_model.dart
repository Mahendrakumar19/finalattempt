class SyllabusItemModel {
  final String id;
  final String? examName;
  final String stage;
  final String? version;
  final String? description;
  final String? fileUrl;

  SyllabusItemModel({
    required this.id,
    this.examName,
    required this.stage,
    this.version,
    this.description,
    this.fileUrl,
  });

  factory SyllabusItemModel.fromJson(Map<String, dynamic> json) {
    String? fileUrl;
    if (json['fileMedia'] != null && json['fileMedia']['url'] != null) {
      fileUrl = json['fileMedia']['url'].toString();
    }
    return SyllabusItemModel(
      id: json['id']?.toString() ?? '',
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
  final String title;
  final String? category;
  final String? content;
  final String? videoUrl;
  final String? ctaText;
  final String? ctaUrl;
  final String? imageUrl;

  StrategyBlockModel({
    required this.id,
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
    if (json['featuredImage'] != null && json['featuredImage']['url'] != null) {
      imageUrl = json['featuredImage']['url'].toString();
    }
    return StrategyBlockModel(
      id: json['id']?.toString() ?? '',
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
