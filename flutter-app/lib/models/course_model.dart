class CourseModel {
  final String id;
  final String title;
  final String? category;
  final String? description;
  final String? duration;
  final String? fee;
  final double? discountedPrice;
  final double? originalPrice;
  final String? discount;
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
    this.discountedPrice,
    this.originalPrice,
    this.discount,
    this.thumbnail,
    this.enrolledCount = 0,
    this.schedule,
    this.features = const [],
    this.syllabus = const [],
    this.isActive = true,
  });

  /// Formatted display price taking into account discounted price and raw fee
  String get displayPrice {
    if (discountedPrice != null && discountedPrice! > 0) {
      return '₹${discountedPrice!.toInt()}';
    }
    if (fee != null && fee!.trim().isNotEmpty) {
      final str = fee!.trim();
      if (str.startsWith('₹')) return str;
      final parsed = double.tryParse(str.replaceAll(RegExp(r'[^0-9.]'), ''));
      if (parsed != null && parsed > 0) {
        return '₹${parsed.toInt()}';
      }
      return str;
    }
    return '₹0';
  }

  /// Evaluates effective numeric price in Rupees
  double get numericPrice {
    if (discountedPrice != null && discountedPrice! > 0) {
      return discountedPrice!;
    }
    if (fee != null && fee!.trim().isNotEmpty) {
      return double.tryParse(fee!.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
    }
    return 0.0;
  }

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    final rawFee = json['fee']?.toString() ?? json['price']?.toString();
    final rawDisc = json['discountedPrice'] ?? json['discounted_price'] ?? json['discount'];
    final rawOrig = json['originalPrice'] ?? json['original_price'] ?? json['mrp'];

    return CourseModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      category: json['category'],
      description: json['description'],
      duration: json['duration'],
      fee: rawFee,
      discountedPrice: rawDisc != null ? double.tryParse(rawDisc.toString()) : null,
      originalPrice: rawOrig != null ? double.tryParse(rawOrig.toString()) : null,
      discount: json['discount']?.toString(),
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
