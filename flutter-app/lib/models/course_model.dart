class CourseModel {
  final String id;
  final String title;
  final String? category;
  final String? description;
  final String? duration;
  final String? fee;
  final String? thumbnail;
  final int enrolledCount;
  final String? schedule;
  final List<String> features;
  final List<String> syllabus;
  final bool isActive;

  const CourseModel({
    required this.id,
    required this.title,
    this.category,
    this.description,
    this.duration,
    this.fee,
    this.thumbnail,
    this.enrolledCount = 0,
    this.schedule,
    this.features = const [],
    this.syllabus = const [],
    this.isActive = true,
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    return CourseModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      category: json['category'],
      description: json['description'],
      duration: json['duration'],
      fee: json['fee']?.toString(),
      thumbnail: json['thumbnail'] ?? json['thumbnailUrl'] ?? json['imageUrl'],
      enrolledCount: json['enrolledCount'] ?? 0,
      schedule: json['schedule'],
      features: _parseStringList(json['features']),
      syllabus: _parseStringList(json['syllabus']),
      isActive: json['isActive'] ?? json['isPublished'] ?? true,
    );
  }

  static List<String> _parseStringList(dynamic val) {
    if (val == null) return [];
    if (val is List) return val.map((e) => e.toString()).toList();
    return [];
  }
}
