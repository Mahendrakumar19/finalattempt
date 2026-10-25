import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/notifications_provider.dart';
import '../core/theme/app_theme.dart';
import '../models/notification_model.dart';
import 'apple_pressable.dart';

class NotificationsModal {
  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _NotificationsSheet(),
    );
  }
}

class _NotificationsSheet extends ConsumerWidget {
  const _NotificationsSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final notificationsAsync = ref.watch(notificationsProvider);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final primaryCol = AppTheme.primaryOf(context);

    return SafeArea(
      child: Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: BoxDecoration(
          color: AppTheme.cardBgOf(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(
            color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 24,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            // Drag handle
            Center(
              child: Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white30 : Colors.grey.shade400,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: primaryCol.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.notifications_active_rounded, color: primaryCol, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Notifications & Alerts',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () {
                      ref.read(notificationNotifierProvider.notifier).markAllAsRead();
                    },
                    child: Text(
                      'Mark all read',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: primaryCol),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Divider(height: 1, color: isDark ? Colors.white12 : Colors.grey.shade200),

            // List of notifications
            Expanded(
              child: notificationsAsync.when(
                data: (notifications) {
                  if (notifications.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_none_rounded, size: 56, color: textMuted.withValues(alpha: 0.5)),
                          const SizedBox(height: 14),
                          Text(
                            'No new announcements',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textPrimary),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Official announcements and test releases will appear here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: textMuted),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    itemCount: notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final notif = notifications[index];
                      return _NotificationItemCard(notification: notif);
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                error: (e, _) => Center(
                  child: Text('Failed to load notifications: $e', style: const TextStyle(color: Colors.red, fontSize: 12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationItemCard extends ConsumerWidget {
  final AppNotificationModel notification;
  const _NotificationItemCard({required this.notification});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);

    final isOffer = notification.isOfferNotification;
    final iconBg = isOffer ? const Color(0xFFFEF3C7) : const Color(0xFFEFF6FF);
    final iconColor = isOffer ? const Color(0xFFD97706) : AppTheme.primaryBlue;
    final dateStr = DateFormat('dd MMM, hh:mm a').format(notification.createdAt);

    return ApplePressable(
      onTap: () {
        ref.read(notificationNotifierProvider.notifier).markAsRead(notification.id);
        if (notification.courseId != null && notification.courseId!.isNotEmpty) {
          Navigator.of(context).pop();
          context.push('/courses/${notification.courseId}');
        } else if (notification.actionUrl != null && notification.actionUrl!.isNotEmpty) {
          Navigator.of(context).pop();
          context.push(notification.actionUrl!);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isOffer ? Icons.local_offer_rounded : Icons.campaign_rounded,
                size: 18,
                color: iconColor,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        dateStr,
                        style: TextStyle(fontSize: 10, color: textMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
