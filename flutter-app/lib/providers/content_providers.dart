import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../models/blog_model.dart';
import '../models/faculty_model.dart';
import '../models/site_settings_model.dart';

final blogsProvider = FutureProvider<List<BlogModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/api/blogs');
  if (data is List) {
    return data.map((b) => BlogModel.fromJson(b as Map<String, dynamic>)).toList();
  }
  return [];
});

final facultyProvider = FutureProvider<List<FacultyModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/api/faculty');
  if (data is List) {
    return data.map((f) => FacultyModel.fromJson(f as Map<String, dynamic>)).toList();
  }
  return [];
});

final resultsProvider = FutureProvider<List<ResultModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/api/results');
  if (data is List) {
    return data.map((r) => ResultModel.fromJson(r as Map<String, dynamic>)).toList();
  }
  return [];
});

final settingsProvider = FutureProvider<SiteSettingsModel>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/api/settings');
  if (data is Map<String, dynamic>) {
    return SiteSettingsModel.fromJson(data);
  }
  return SiteSettingsModel.fallback;
});
