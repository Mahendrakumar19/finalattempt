class AppNotificationModel {
  final String id;
  final String title;
  final String message;
  final String? targetAudience;
  final String? courseId;
  final String? actionUrl;
  final String? imageUrl;
  final bool isOfferNotification;
  final String? offerId;
  final bool isRead;
  final DateTime createdAt;

  const AppNotificationModel({
    required this.id,
    required this.title,
    required this.message,
    this.targetAudience,
    this.courseId,
    this.actionUrl,
    this.imageUrl,
    this.isOfferNotification = false,
    this.offerId,
    this.isRead = false,
    required this.createdAt,
  });

  factory AppNotificationModel.fromJson(Map<String, dynamic> json) {
    return AppNotificationModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? 'Announcement',
      message: json['message'] ?? '',
      targetAudience: json['targetAudience'],
      courseId: json['courseId'],
      actionUrl: json['actionUrl'],
      imageUrl: json['imageUrl'],
      isOfferNotification: json['isOfferNotification'] == true || json['isOfferNotification'] == 1,
      offerId: json['offerId'],
      isRead: json['isRead'] == true || json['isRead'] == 1,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
