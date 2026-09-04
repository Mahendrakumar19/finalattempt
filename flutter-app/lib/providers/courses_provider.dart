import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../models/course_model.dart';

final coursesProvider = FutureProvider<List<CourseModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/lms/courses');
  if (data is Map && data['success'] == true && data['data'] is List) {
    return (data['data'] as List)
        .map((c) => CourseModel.fromJson(c as Map<String, dynamic>))
        .toList();
  }
  return [];
});

final courseDetailProvider = FutureProvider.family<CourseModel?, String>((ref, courseId) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/lms/courses/$courseId');
  if (data is Map) {
    final courseData = data['data'] ?? data;
    if (courseData is Map<String, dynamic>) {
      return CourseModel.fromJson(courseData);
    }
  }
  return null;
});
