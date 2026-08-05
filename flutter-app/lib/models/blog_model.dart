class BlogModel {
  final String id;
  final String title;
  final String? slug;
  final String? publishDate;
  final String? readTime;
  final String? category;
  final String content;
  final String? imageUrl;
  final String? coverImageUrl;
  final String? author;
  final String? authorName;
  final String? blurb;
  final String? excerpt;
  final String? status;

  const BlogModel({
    required this.id,
    required this.title,
    this.slug,
    this.publishDate,
    this.readTime,
    this.category,
    required this.content,
    this.imageUrl,
    this.coverImageUrl,
    this.author,
    this.authorName,
    this.blurb,
    this.excerpt,
    this.status,
  });

  String get displayImage => imageUrl ?? coverImageUrl ?? '';
  String get displayAuthor => authorName ?? author ?? 'Final Attempt Team';
  String get preview => blurb ?? excerpt ?? content.replaceAll(RegExp(r'<[^>]*>'), '').substring(0, content.length.clamp(0, 150));

  factory BlogModel.fromJson(Map<String, dynamic> json) {
    return BlogModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      slug: json['slug'],
      publishDate: json['publishDate'] ?? json['createdAt'],
      readTime: json['readTime'] ?? json['read_time'],
      category: json['category'],
      content: json['content'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image_url'],
      coverImageUrl: json['cover_image_url'] ?? json['coverImageUrl'],
      author: json['author'],
      authorName: json['author_name'] ?? json['authorName'],
      blurb: json['blurb'],
      excerpt: json['excerpt'],
      status: json['status'],
    );
  }
}
