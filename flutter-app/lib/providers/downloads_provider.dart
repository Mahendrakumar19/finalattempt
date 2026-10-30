import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../models/downloads_model.dart';

// 1. Useful Documents Provider
final usefulDocumentsProvider = FutureProvider<List<DownloadItemModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.get('/custom-pages/downloads/useful-documents');
    if (res is Map && res['data'] != null && res['data']['downloadItems'] is List) {
      return (res['data']['downloadItems'] as List)
          .map((i) => DownloadItemModel.fromJson(i as Map<String, dynamic>))
          .toList();
    }
    // Fallback slug
    final fallbackRes = await api.get('/custom-pages/useful-documents');
    if (fallbackRes is Map && fallbackRes['data'] != null && fallbackRes['data']['downloadItems'] is List) {
      return (fallbackRes['data']['downloadItems'] as List)
          .map((i) => DownloadItemModel.fromJson(i as Map<String, dynamic>))
          .toList();
    }
  } catch (_) {}
  return [];
});

// 2. Value Added Mains Materials Provider
final valueAddedMainsProvider = FutureProvider<List<DownloadItemModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.get('/custom-pages/downloads/value-added-mains');
    if (res is Map && res['data'] != null && res['data']['downloadItems'] is List) {
      return (res['data']['downloadItems'] as List)
          .map((i) => DownloadItemModel.fromJson(i as Map<String, dynamic>))
          .toList();
    }
    final fallbackRes = await api.get('/custom-pages/value-added-mains');
    if (fallbackRes is Map && fallbackRes['data'] != null && fallbackRes['data']['downloadItems'] is List) {
      return (fallbackRes['data']['downloadItems'] as List)
          .map((i) => DownloadItemModel.fromJson(i as Map<String, dynamic>))
          .toList();
    }
  } catch (_) {}
  return [];
});

// 3. Toppers Copies Provider
final toppersCopiesProvider = FutureProvider<List<DownloadItemModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.get('/custom-pages/downloads/toppers-copies');
    if (res is Map && res['data'] != null && res['data']['downloadItems'] is List) {
      return (res['data']['downloadItems'] as List)
          .map((i) => DownloadItemModel.fromJson(i as Map<String, dynamic>))
          .toList();
    }
    final fallbackRes = await api.get('/custom-pages/toppers-copies');
    if (fallbackRes is Map && fallbackRes['data'] != null && fallbackRes['data']['downloadItems'] is List) {
      return (fallbackRes['data']['downloadItems'] as List)
          .map((i) => DownloadItemModel.fromJson(i as Map<String, dynamic>))
          .toList();
    }
  } catch (_) {}
  return [];
});

// 4. NCERT Books Provider
final ncertBooksProvider = FutureProvider<List<NCERTBookModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.get('/ncert-books?limit=500');
    if (res is Map && res['success'] == true && res['data'] is List) {
      return (res['data'] as List)
          .map((b) => NCERTBookModel.fromJson(b as Map<String, dynamic>))
          .toList();
    }
  } catch (_) {}
  return [];
});

// 5. Publications Storefront Provider
final publicationsProvider = FutureProvider<List<PublicationBookModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.get('/publications');
    if (res is Map && res['data'] is List) {
      return (res['data'] as List)
          .map((b) => PublicationBookModel.fromJson(b as Map<String, dynamic>))
          .toList();
    } else if (res is List) {
      return res.map((b) => PublicationBookModel.fromJson(b as Map<String, dynamic>)).toList();
    }
  } catch (_) {}
  return [];
});
