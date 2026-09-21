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
  final String? background;
  final String? keyHighlights;
  final String? importantFacts;
  final String? examRelevance;
  final String? previousContext;
  final String? wayForward;
  final String? keyTakeaways;
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
    this.background,
    this.keyHighlights,
    this.importantFacts,
    this.examRelevance,
    this.previousContext,
    this.wayForward,
    this.keyTakeaways,
    this.subjects = const [],
    this.exams = const [],
    this.tags = const [],
    this.coverImageUrl,
  });

  factory CurrentAffairArticleModel.fromJson(Map<String, dynamic> json) {
    final media = json['media'] as List?;
    String? rawUrl = json['coverImage'] ??
        json['coverImageUrl'] ??
        json['featuredImage'] ??
        json['image'] ??
        json['thumbnail'] ??
        json['photo'] ??
        json['banner'];

    if ((rawUrl == null || rawUrl.toString().trim().isEmpty) && media != null && media.isNotEmpty) {
      final cover = media.firstWhere(
        (m) => m is Map && (m['type'] == 'COVER' || m['type'] == 'FEATURED' || m['type'] == 'IMAGE'),
        orElse: () => media.first,
      );
      if (cover is Map && cover['url'] != null) {
        rawUrl = cover['url'].toString();
      } else if (cover is String) {
        rawUrl = cover;
      }
    }

    final cleanedContent = _cleanHtml(json['content']);
    final cleanedWhyInNews = _cleanHtml(json['whyInNews']);
    final cleanedContext = _cleanHtml(json['context']);
    final cleanedBackground = _cleanHtml(json['background']);
    final cleanedKeyHighlights = _cleanHtml(json['keyHighlights']);

    // If no cover image was explicitly provided, attempt to extract first <img> from HTML contents
    if (rawUrl == null || rawUrl.toString().trim().isEmpty) {
      rawUrl = _extractImageFromHtml(cleanedContent) ??
          _extractImageFromHtml(cleanedWhyInNews) ??
          _extractImageFromHtml(cleanedContext) ??
          _extractImageFromHtml(cleanedKeyHighlights);
    }

    String? coverImage;
    if (rawUrl != null && rawUrl.toString().trim().isNotEmpty) {
      coverImage = _normalizeImageUrl(rawUrl.toString());
    }

    return CurrentAffairArticleModel(
      id: json['id']?.toString() ?? '',
      slug: _cleanText(json['slug']),
      title: _cleanText(json['title']),
      summary: _cleanText(json['summary']),
      category: (_cleanText(json['category'])).isEmpty ? 'NATIONAL' : _cleanText(json['category']),
      publishStatus: json['publishStatus'] ?? 'PUBLISHED',
      publishedDate: _cleanText(json['publishedDate']),
      readingTime: json['readingTime'] ?? '3 min',
      importance: json['importance'] ?? 'MEDIUM',
      content: cleanedContent.isEmpty ? null : cleanedContent,
      whyInNews: cleanedWhyInNews.isEmpty ? null : cleanedWhyInNews,
      context: cleanedContext.isEmpty ? null : cleanedContext,
      background: cleanedBackground.isEmpty ? null : cleanedBackground,
      keyHighlights: cleanedKeyHighlights.isEmpty ? null : cleanedKeyHighlights,
      importantFacts: _cleanHtml(json['importantFacts']),
      examRelevance: _cleanHtml(json['examRelevance']),
      previousContext: _cleanHtml(json['previousContext']),
      wayForward: _cleanHtml(json['wayForward']),
      keyTakeaways: _cleanHtml(json['keyTakeaways']),
      subjects: _asList(json['subjects']),
      exams: _asList(json['exams']),
      tags: _asList(json['tags']),
      coverImageUrl: coverImage,
    );
  }

  static List<String> _asList(dynamic val) {
    if (val == null) return [];
    if (val is List) return val.map((e) => _cleanText(e)).where((e) => e.isNotEmpty).toList();
    return [];
  }
}

String _cleanText(dynamic val) {
  if (val == null) return '';
  String str = val.toString().trim();
  if (str.isEmpty) return '';

  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    if (str.length > 2) {
      str = str.substring(1, str.length - 1);
    }
  }

  // Unescape escape sequences
  str = str
      .replaceAll(r'\r\n', ' ')
      .replaceAll(r'\n', ' ')
      .replaceAll(r'\r', ' ')
      .replaceAll(r'\t', ' ')
      .replaceAll(r'\"', '"')
      .replaceAll(r"\'", "'")
      .replaceAll(r'\\', r'\');

  // Fix vertical character splitting (e.g. B\ni\nh\na\nr -> Bihar)
  str = str.replaceAllMapped(
    RegExp(r'([A-Za-z0-9\u0900-\u097F])\s*[\r\n]+\s*([A-Za-z0-9\u0900-\u097F])'),
    (m) => '${m.group(1)}${m.group(2)}',
  );

  // Replace remaining newlines with spaces
  str = str.replaceAll('\n', ' ').replaceAll('\r', ' ');

  // Collapse multiple spaces into one
  str = str.replaceAll(RegExp(r'\s+'), ' ').trim();

  return str;
}

String _cleanHtml(dynamic val) {
  if (val == null) return '';
  String html = val.toString().trim();
  if (html.isEmpty) return '';

  if ((html.startsWith('"') && html.endsWith('"')) || (html.startsWith("'") && html.endsWith("'"))) {
    if (html.length > 2) {
      html = html.substring(1, html.length - 1);
    }
  }

  // 1. Unescape escape sequences
  html = html
      .replaceAll(r'\r\n', ' ')
      .replaceAll(r'\n', ' ')
      .replaceAll(r'\r', ' ')
      .replaceAll(r'\t', ' ')
      .replaceAll(r'\"', '"')
      .replaceAll(r"\'", "'")
      .replaceAll(r'\\', r'\');

  // 2. Unescape HTML entities
  html = html
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&amp;', '&')
      .replaceAll('&nbsp;', ' ');

  // 3. Remove <br> or <br/> tags between single letters (e.g. B<br>i<br>h<br>a<br>r -> Bihar)
  html = html.replaceAllMapped(
    RegExp(r'([A-Za-z0-9\u0900-\u097F])\s*<br\s*/?>\s*([A-Za-z0-9\u0900-\u097F])', caseSensitive: false),
    (m) => '${m.group(1)}${m.group(2)}',
  );

  // 4. Unwrap single-letter HTML tags like <p>B</p><p>i</p> or <span>B</span>
  html = html.replaceAllMapped(
    RegExp(r'<(p|div|span|h[1-6])[^>]*>\s*([A-Za-z0-9\u0900-\u097F])\s*</\1>', caseSensitive: false),
    (m) => m.group(2)!,
  );

  // 5. Fix vertical character splitting inside text (e.g. B\ni\nh\na\nr -> Bihar)
  html = html.replaceAllMapped(
    RegExp(r'([A-Za-z0-9\u0900-\u097F])\s*[\r\n]+\s*([A-Za-z0-9\u0900-\u097F])'),
    (m) => '${m.group(1)}${m.group(2)}',
  );

  // 6. Replace remaining literal newlines with spaces
  html = html.replaceAll('\n', ' ').replaceAll('\r', ' ');

  // 7. Strip all inline style attributes (e.g. style="width: 50px;" or max-width) which force narrow text columns
  html = html.replaceAll(RegExp('style=["\'][^"\']*["\']', caseSensitive: false), '');

  // 8. Collapse multiple spaces
  html = html.replaceAll(RegExp(r' {2,}'), ' ');

  // 9. Normalize image tags src attributes
  html = html.replaceAllMapped(
    RegExp(r'''<img[^>]+src=["']([^"']+)["']''', caseSensitive: false),
    (match) {
      String fullMatch = match.group(0)!;
      String src = match.group(1)!;
      String cleanSrc = _normalizeImageUrl(src);
      return fullMatch.replaceAll(src, cleanSrc);
    },
  );

  return html.trim();
}

String _normalizeImageUrl(String rawUrl) {
  String url = rawUrl.trim().replaceAll(r'\"', '').replaceAll(r'"', '');
  if (url.isEmpty) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return 'https://finalattemptias.com$url';
  }
  return 'https://finalattemptias.com/$url';
}

String? _extractImageFromHtml(String? html) {
  if (html == null || html.isEmpty) return null;
  final match = RegExp(r'''<img[^>]+src=["']([^"']+)["']''', caseSensitive: false).firstMatch(html);
  if (match != null && match.group(1) != null) {
    return _normalizeImageUrl(match.group(1)!);
  }
  return null;
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
      publishDate: _cleanText(json['publishDate']),
      summary: _cleanText(json['summary']),
      articles: articleList
          ?.map((a) => CurrentAffairArticleModel.fromJson(a as Map<String, dynamic>))
          .toList() ?? [],
    );
  }
}

