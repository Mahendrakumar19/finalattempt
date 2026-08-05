import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../models/current_affair_model.dart';

final caEditionsProvider = FutureProvider<List<CurrentAffairEditionModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/api/dynamic-current-affairs/editions');
  if (data is List) {
    return data
        .map((e) => CurrentAffairEditionModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});

final caArticleProvider = FutureProvider.family<CurrentAffairArticleModel?, String>((ref, slug) async {
  final api = ref.read(apiServiceProvider);
  final data = await api.get('/api/dynamic-current-affairs/article/$slug');
  if (data is Map<String, dynamic> && data['id'] != null) {
    return CurrentAffairArticleModel.fromJson(data);
  }
  return null;
});
