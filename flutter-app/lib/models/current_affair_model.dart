class CurrentAffairArticleModel {
  final String id;
  final String slug;
  final String title;
  final String summary;
  final String category;
  final String publishStatus;
  final String publishedDate;
  final String readingTime;
  final String importance;
  final String? content;
  final String? whyInNews;
  final String? context;
  final String? keyHighlights;
  final String? examRelevance;
  final List<String> subjects;
  final List<String> exams;
  final List<String> tags;
  final String? coverImageUrl;

  const CurrentAffairArticleModel({
    required this.id,
    required this.slug,
    required this.title,
    required this.summary,
    required this.category,
    required this.publishStatus,
    required this.publishedDate,
    required this.readingTime,
    required this.importance,
    this.content,
    this.whyInNews,
    this.context,
    this.keyHighlights,
    this.examRelevance,
    this.subjects = const [],
    this.exams = const [],
    this.tags = const [],
    this.coverImageUrl,
  });

  factory CurrentAffairArticleModel.fromJson(Map<String, dynamic> json) {
    final media = json['media'] as List?;
    String? coverImage;
    if (media != null) {
      final cover = media.firstWhere(
        (m) => m['type'] == 'COVER' || m['type'] == 'FEATURED',
        orElse: () => null,
      );
      coverImage = cover?['url'];
    }

    return CurrentAffairArticleModel(
      id: json['id']?.toString() ?? '',
      slug: json['slug'] ?? '',
      title: json['title'] ?? '',
      summary: json['summary'] ?? '',
      category: json['category'] ?? 'NATIONAL',
      publishStatus: json['publishStatus'] ?? 'PUBLISHED',
      publishedDate: json['publishedDate'] ?? '',
      readingTime: json['readingTime'] ?? '3 min',
      importance: json['importance'] ?? 'MEDIUM',
      content: json['content'],
      whyInNews: json['whyInNews'],
      context: json['context'],
      keyHighlights: json['keyHighlights'],
      examRelevance: json['examRelevance'],
      subjects: _asList(json['subjects']),
      exams: _asList(json['exams']),
      tags: _asList(json['tags']),
      coverImageUrl: coverImage,
    );
  }

  static List<String> _asList(dynamic val) {
    if (val == null) return [];
    if (val is List) return val.map((e) => e.toString()).toList();
    return [];
  }
}

class CurrentAffairEditionModel {
  final String id;
  final String publishDate;
  final String? summary;
  final List<CurrentAffairArticleModel> articles;

  const CurrentAffairEditionModel({
    required this.id,
    required this.publishDate,
    this.summary,
    this.articles = const [],
  });

  factory CurrentAffairEditionModel.fromJson(Map<String, dynamic> json) {
    final articleList = json['articles'] as List?;
    return CurrentAffairEditionModel(
      id: json['id']?.toString() ?? '',
      publishDate: json['publishDate'] ?? '',
      summary: json['summary'],
      articles: articleList
          ?.map((a) => CurrentAffairArticleModel.fromJson(a as Map<String, dynamic>))
          .toList() ?? [],
    );
  }
}
