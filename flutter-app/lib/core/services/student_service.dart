import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';

final studentServiceProvider = Provider<StudentService>((ref) {
  return StudentService(ref.read(apiServiceProvider));
});

class StudentService {
  final ApiService _api;
  StudentService(this._api);

  Future<List<dynamic>> getMyEnrollments() async {
    try {
      final res = await _api.get('/lms/enrollments/me');
      if (res != null && res['success'] == true && res['data'] != null) {
        return res['data'] as List<dynamic>;
      }
    } catch (e) {
      // Return empty list on error
    }
    return [];
  }

  Future<Map<String, dynamic>?> getCourseDetails(String courseId) async {
    try {
      final res = await _api.get('/lms/courses/$courseId/sections');
      if (res != null && res['success'] == true && res['data'] != null) {
        return res['data'] as Map<String, dynamic>;
      }
    } catch (e) {
      // Return null on error
    }
    return null;
  }

  Future<List<dynamic>> getCourseQuizzes(String courseId) async {
    try {
      final res = await _api.get('/lms/courses/$courseId/quizzes');
      if (res != null && res['success'] == true && res['data'] != null) {
        return res['data'] as List<dynamic>;
      }
    } catch (e) {
      // Return empty list on error
    }
    return [];
  }

  Future<List<dynamic>> getCourseAssignments(String courseId) async {
    try {
      final res = await _api.get('/lms/courses/$courseId/assignments');
      if (res != null && res['success'] == true && res['data'] != null) {
        return res['data'] as List<dynamic>;
      }
    } catch (e) {
      // Return empty list on error
    }
    return [];
  }

  Future<bool> saveProgress(String courseId, String lessonId) async {
    try {
      final res = await _api.post('/lms/progress/$courseId', data: {
        'lessonId': lessonId,
        'completed': true,
      });
      return res != null && res['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> submitMainsAnswer({
    required String assignmentId,
    required String fileUrl,
    String? notes,
  }) async {
    try {
      final res = await _api.post('/lms/assignments/$assignmentId/submit', data: {
        'fileUrl': fileUrl,
        'notes': notes ?? '',
      });
      if (res != null && res['success'] == true) {
        return res['data'] as Map<String, dynamic>;
      }
    } catch (e) {
      // handle error
    }
    return null;
  }
}
