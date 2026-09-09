import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';

const String kSocketBaseUrl = 'https://finalattemptias.com';

final chatServiceProvider = Provider<ChatService>((ref) {
  return ChatService(ref.read(apiServiceProvider));
});

class ChatMessageModel {
  final String id;
  final String roomId;
  final String senderId;
  final String fullName;
  final String role;
  final String messageText;
  final String createdAt;
  final bool isEdited;

  ChatMessageModel({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.fullName,
    required this.role,
    required this.messageText,
    required this.createdAt,
    this.isEdited = false,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id']?.toString() ?? '',
      roomId: json['roomId']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? json['userId']?.toString() ?? '',
      fullName: json['fullName'] ?? json['senderName'] ?? json['userEmail'] ?? 'User',
      role: json['role'] ?? json['senderRole'] ?? 'student',
      messageText: json['messageText'] ?? '',
      createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      isEdited: json['isEdited'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'roomId': roomId,
      'senderId': senderId,
      'fullName': fullName,
      'role': role,
      'messageText': messageText,
      'createdAt': createdAt,
      'isEdited': isEdited,
    };
  }
}

class SupportRoomModel {
  final String id;
  final String title;
  final String type;
  final bool isDirect;

  SupportRoomModel({
    required this.id,
    required this.title,
    required this.type,
    required this.isDirect,
  });

  factory SupportRoomModel.fromJson(Map<String, dynamic> json) {
    return SupportRoomModel(
      id: json['id']?.toString() ?? 'admin-support-general',
      title: json['title'] ?? 'Direct Chat with Admin & Mentors',
      type: json['type'] ?? 'admin_support',
      isDirect: json['isDirect'] != false,
    );
  }
}

class ChatService {
  final ApiService _api;

  ChatService(this._api);

  /// Fetch user's support room from backend
  Future<SupportRoomModel?> getSupportRoom(String userId, String? email) async {
    try {
      final res = await _api.get('/chats/support-room', params: {
        'studentId': userId,
      });
      if (res is Map && res['success'] == true && res['data'] != null) {
        return SupportRoomModel.fromJson(res['data']);
      }
    } catch (_) {}
    return SupportRoomModel(
      id: 'support-$userId',
      title: 'Direct Chat with Admin & Mentors',
      type: 'admin_support',
      isDirect: true,
    );
  }

  /// Get past message history for a specific room
  Future<List<ChatMessageModel>> getMessages(String roomId) async {
    try {
      final res = await _api.get('/chats/messages/$roomId');
      if (res is Map && res['success'] == true && res['data'] is List) {
        return (res['data'] as List)
            .map((item) => ChatMessageModel.fromJson(item))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  /// Check if specific user is blocked
  Future<bool> isUserBlocked(String userId) async {
    try {
      final res = await _api.get('/chats/blocked-users/check/$userId');
      if (res is Map && res['isBlocked'] != null) {
        return res['isBlocked'] == true;
      }
    } catch (_) {}
    return false;
  }

  /// Edit existing message
  Future<bool> editMessage(String messageId, String messageText, String userId) async {
    try {
      final res = await _api.put('/chats/messages/$messageId', data: {
        'messageText': messageText,
        'senderId': userId,
      });
      return res is Map && res['success'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Delete message
  Future<bool> deleteMessage(String messageId, String userId) async {
    try {
      final res = await _api.put('/chats/messages/$messageId', data: {
        'senderId': userId,
      });
      return res is Map && res['success'] == true;
    } catch (_) {
      return false;
    }
  }
}
