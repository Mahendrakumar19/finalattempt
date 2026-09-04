import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../models/pyq_model.dart';

// Filter state
class PyqFilter {
  final String examId;
  final String year;
  final String search;

  const PyqFilter({
    this.examId = 'ALL',
    this.year = 'ALL',
    this.search = '',
  });

  PyqFilter copyWith({String? examId, String? year, String? search}) => PyqFilter(
    examId: examId ?? this.examId,
    year: year ?? this.year,
    search: search ?? this.search,
  );
}

final pyqFilterProvider = StateProvider<PyqFilter>((ref) => const PyqFilter());

final pyqExamsProvider = FutureProvider<List<PyqExamModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/syllabus-strategy/exams');
  if (data is Map && data['success'] == true && data['data'] is List) {
    return (data['data'] as List)
        .map((e) => PyqExamModel.fromJson(e as Map<String, dynamic>))
        .where((e) => e.isActive)
        .toList();
  }
  return [];
});

final pyqListProvider = FutureProvider<List<PyqModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final filter = ref.watch(pyqFilterProvider);

  final params = <String, dynamic>{'limit': '500'};
  if (filter.examId != 'ALL') params['examId'] = filter.examId;
  if (filter.year != 'ALL') params['year'] = filter.year;
  if (filter.search.isNotEmpty) params['search'] = filter.search;

  final data = await api.get('/pyqs', params: params);
  if (data is Map && data['success'] == true && data['data'] is List) {
    return (data['data'] as List)
        .map((e) => PyqModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});
