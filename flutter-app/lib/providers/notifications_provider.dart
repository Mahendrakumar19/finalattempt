import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';
import '../models/notification_model.dart';

final notificationsProvider = FutureProvider<List<AppNotificationModel>>((ref) async {
  try {
    final api = ref.read(apiServiceProvider);
    final res = await api.get('/notifications');
    if (res != null && res['success'] == true && res['data'] is List) {
      final list = (res['data'] as List)
          .map((item) => AppNotificationModel.fromJson(item as Map<String, dynamic>))
          .toList();
      return list;
    }
    return [];
  } catch (_) {
    return [];
  }
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notifsAsync = ref.watch(notificationsProvider);
  final storage = ref.watch(storageServiceProvider);
  final readIds = storage.prefs.getStringList('read_notification_ids') ?? [];

  return notifsAsync.when(
    data: (list) => list.where((n) => !readIds.contains(n.id)).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});

final notificationNotifierProvider = StateNotifierProvider<NotificationNotifier, AsyncValue<List<AppNotificationModel>>>((ref) {
  return NotificationNotifier(ref);
});

class NotificationNotifier extends StateNotifier<AsyncValue<List<AppNotificationModel>>> {
  final Ref _ref;
  NotificationNotifier(this._ref) : super(const AsyncValue.loading()) {
    fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    try {
      final api = _ref.read(apiServiceProvider);
      final res = await api.get('/notifications');
      if (res != null && res['success'] == true && res['data'] is List) {
        final list = (res['data'] as List)
            .map((item) => AppNotificationModel.fromJson(item as Map<String, dynamic>))
            .toList();
        state = AsyncValue.data(list);
      } else {
        state = const AsyncValue.data([]);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markAsRead(String id) async {
    final storage = _ref.read(storageServiceProvider);
    final readIds = storage.prefs.getStringList('read_notification_ids') ?? [];
    if (!readIds.contains(id)) {
      readIds.add(id);
      await storage.prefs.setStringList('read_notification_ids', readIds);
      _ref.invalidate(notificationsProvider);
    }
  }

  Future<void> markAllAsRead() async {
    final storage = _ref.read(storageServiceProvider);
    final currentList = state.value ?? [];
    final allIds = currentList.map((n) => n.id).toList();
    await storage.prefs.setStringList('read_notification_ids', allIds);
    _ref.invalidate(notificationsProvider);
  }
}
