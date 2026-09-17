import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../models/syllabus_strategy_model.dart';

final syllabusListProvider = FutureProvider<List<SyllabusItemModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.get('/syllabus-strategy/syllabus');
  if (res is Map && res['success'] == true && res['data'] is List) {
    return (res['data'] as List)
        .map((item) => SyllabusItemModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }
  return [];
});

final strategyListProvider = FutureProvider<List<StrategyBlockModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.get('/syllabus-strategy/strategy');
  if (res is Map && res['success'] == true && res['data'] is List) {
    return (res['data'] as List)
        .map((item) => StrategyBlockModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }
  return [];
});
