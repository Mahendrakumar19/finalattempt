import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/services/chat_service.dart';
import 'auth_provider.dart';

class ChatState {
  final SupportRoomModel? room;
  final List<ChatMessageModel> messages;
  final bool isLoading;
  final bool isConnected;
  final bool isBlocked;
  final String? error;

  ChatState({
    this.room,
    this.messages = const [],
    this.isLoading = true,
    this.isConnected = false,
    this.isBlocked = false,
    this.error,
  });

  ChatState copyWith({
    SupportRoomModel? room,
    List<ChatMessageModel>? messages,
    bool? isLoading,
    bool? isConnected,
    bool? isBlocked,
    String? error,
  }) {
    return ChatState(
      room: room ?? this.room,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isConnected: isConnected ?? this.isConnected,
      isBlocked: isBlocked ?? this.isBlocked,
      error: error ?? this.error,
    );
  }
}

final chatProvider = StateNotifierProvider.autoDispose<ChatNotifier, ChatState>((ref) {
  final authState = ref.watch(authStateProvider);
  final chatService = ref.watch(chatServiceProvider);
  return ChatNotifier(chatService, authState);
});

class ChatNotifier extends StateNotifier<ChatState> {
  final ChatService _chatService;
  final AuthState _authState;
  io.Socket? _socket;

  ChatNotifier(this._chatService, this._authState) : super(ChatState()) {
    _initChat();
  }

  Future<void> _initChat() async {
    final userId = _authState.userId ?? 'guest-user';
    final userEmail = _authState.userEmail;

    state = state.copyWith(isLoading: true, error: null);

    try {
      // 1. Fetch block status & room information
      final isBlockedFuture = _chatService.isUserBlocked(userId);
      final roomFuture = _chatService.getSupportRoom(userId, userEmail);

      final results = await Future.wait([isBlockedFuture, roomFuture]);
      final isBlocked = results[0] as bool;
      final room = results[1] as SupportRoomModel?;

      state = state.copyWith(
        isBlocked: isBlocked,
        room: room,
      );

      if (room != null) {
        // 2. Fetch history
        final history = await _chatService.getMessages(room.id);
        state = state.copyWith(messages: history, isLoading: false);

        // 3. Connect Socket.IO client
        _connectSocket(room.id);
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to connect to mentorship chat.',
      );
    }
  }

  void _connectSocket(String roomId) {
    _socket?.dispose();

    _socket = io.io(
      kSocketBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(1000)
          .build(),
    );

    _socket?.onConnect((_) {
      state = state.copyWith(isConnected: true);
      _socket?.emit('join_room', roomId);
    });

    _socket?.onDisconnect((_) {
      state = state.copyWith(isConnected: false);
    });

    _socket?.onConnectError((err) {
      state = state.copyWith(isConnected: false);
    });

    // Listen for incoming real-time messages from Admin or Mentor
    _socket?.on('new_message', (data) {
      if (data is Map<String, dynamic>) {
        final incoming = ChatMessageModel.fromJson(data);
        final currentMessages = List<ChatMessageModel>.from(state.messages);

        // Deduplicate or resolve optimistic message
        final existingIdx = currentMessages.indexWhere(
          (m) => m.id == incoming.id || (m.id.startsWith('temp-') && m.messageText == incoming.messageText),
        );

        if (existingIdx != -1) {
          currentMessages[existingIdx] = incoming;
        } else {
          currentMessages.add(incoming);
        }

        state = state.copyWith(messages: currentMessages);
      }
    });

    // Message edited event
    _socket?.on('message_edited', (data) {
      if (data is Map<String, dynamic>) {
        final msgId = data['messageId']?.toString();
        final newText = data['newMessageText']?.toString();
        if (msgId != null && newText != null) {
          final updated = state.messages.map((m) {
            if (m.id == msgId) {
              return ChatMessageModel(
                id: m.id,
                roomId: m.roomId,
                senderId: m.senderId,
                fullName: m.fullName,
                role: m.role,
                messageText: newText,
                createdAt: m.createdAt,
                isEdited: true,
              );
            }
            return m;
          }).toList();
          state = state.copyWith(messages: updated);
        }
      }
    });

    // Message deleted event
    _socket?.on('message_deleted', (data) {
      if (data is Map<String, dynamic>) {
        final msgId = data['messageId']?.toString();
        if (msgId != null) {
          final updated = state.messages.where((m) => m.id != msgId).toList();
          state = state.copyWith(messages: updated);
        }
      }
    });

    // User blocked status update
    _socket?.on('user_blocked_status', (data) {
      if (data is Map<String, dynamic>) {
        final targetUser = data['userId']?.toString();
        final isBlocked = data['isBlocked'] == true;
        if (targetUser == (_authState.userId ?? '')) {
          state = state.copyWith(isBlocked: isBlocked);
        }
      }
    });
  }

  void sendMessage(String text) {
    final room = state.room;
    if (room == null || text.trim().isEmpty || state.isBlocked) return;

    final senderId = _authState.userId ?? 'guest-user';
    final senderName = _authState.userName ?? _authState.userEmail ?? 'Student';
    final senderRole = _authState.userRole ?? 'student';
    final messageText = text.trim();

    final payload = {
      'roomId': room.id,
      'senderId': senderId,
      'senderName': senderName,
      'senderRole': senderRole,
      'messageText': messageText,
    };

    // Optimistic UI update
    final optimisticMsg = ChatMessageModel(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      roomId: room.id,
      senderId: senderId,
      fullName: senderName,
      role: senderRole,
      messageText: messageText,
      createdAt: DateTime.now().toIso8601String(),
    );

    state = state.copyWith(messages: [...state.messages, optimisticMsg]);

    _socket?.emit('send_message', payload);
  }

  Future<void> editMessage(String messageId, String newText) async {
    final room = state.room;
    if (room == null || newText.trim().isEmpty) return;

    final userId = _authState.userId ?? '';

    // Local UI update
    final updated = state.messages.map((m) {
      if (m.id == messageId) {
        return ChatMessageModel(
          id: m.id,
          roomId: m.roomId,
          senderId: m.senderId,
          fullName: m.fullName,
          role: m.role,
          messageText: newText.trim(),
          createdAt: m.createdAt,
          isEdited: true,
        );
      }
      return m;
    }).toList();

    state = state.copyWith(messages: updated);

    // Call REST endpoint
    _chatService.editMessage(messageId, newText.trim(), userId);

    // Socket emit
    _socket?.emit('edit_message', {
      'messageId': messageId,
      'roomId': room.id,
      'newMessageText': newText.trim(),
      'senderId': userId,
    });
  }

  Future<void> deleteMessage(String messageId) async {
    final room = state.room;
    if (room == null) return;

    final userId = _authState.userId ?? '';

    // Local UI update
    final updated = state.messages.where((m) => m.id != messageId).toList();
    state = state.copyWith(messages: updated);

    // Call REST endpoint
    _chatService.deleteMessage(messageId, userId);

    // Socket emit
    _socket?.emit('delete_message', {
      'messageId': messageId,
      'roomId': room.id,
      'senderId': userId,
    });
  }

  @override
  void dispose() {
    _socket?.dispose();
    super.dispose();
  }
}
