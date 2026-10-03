import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/student_service.dart';
import 'auth_provider.dart';

class Enrollment {
  final String courseId;
  final String title;
  final String category;
  final String? thumbnailUrl;
  final String? duration;
  final String enrolledAt;
  final String? testSeriesSlug;
  final int completedLessons;
  final int totalLessons;
  final int completionPercentage;

  Enrollment({
    required this.courseId,
    required this.title,
    required this.category,
    this.thumbnailUrl,
    this.duration,
    required this.enrolledAt,
    this.testSeriesSlug,
    this.completedLessons = 0,
    this.totalLessons = 0,
    this.completionPercentage = 0,
  });

  factory Enrollment.fromJson(Map<String, dynamic> json) {
    return Enrollment(
      courseId: json['courseId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Course',
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      duration: json['duration']?.toString(),
      enrolledAt: json['enrolledAt']?.toString() ?? '',
      testSeriesSlug: json['testSeriesSlug']?.toString(),
      completedLessons: int.tryParse(json['completedLessons']?.toString() ?? '0') ?? 0,
      totalLessons: int.tryParse(json['totalLessons']?.toString() ?? '0') ?? 0,
      completionPercentage: int.tryParse(json['completionPercentage']?.toString() ?? '0') ?? 0,
    );
  }
}

final enrollmentsProvider = FutureProvider<List<Enrollment>>((ref) async {
  final isLoggedIn = ref.watch(authStateProvider).isLoggedIn;
  if (!isLoggedIn) return [];
  
  final service = ref.watch(studentServiceProvider);
  final raw = await service.getMyEnrollments();
  return raw.map((e) => Enrollment.fromJson(e as Map<String, dynamic>)).toList();
});
