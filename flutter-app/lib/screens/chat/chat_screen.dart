import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../core/services/chat_service.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/top_header_actions.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String? _editingMsgId;

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  void _handleSend() {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    if (_editingMsgId != null) {
      ref.read(chatProvider.notifier).editMessage(_editingMsgId!, text);
      setState(() {
        _editingMsgId = null;
      });
    } else {
      ref.read(chatProvider.notifier).sendMessage(text);
    }

    _inputController.clear();
    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final chatState = ref.watch(chatProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryCol = AppTheme.primaryOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    // Auto-scroll on new messages
    ref.listen(chatProvider, (previous, next) {
      if (previous?.messages.length != next.messages.length) {
        Future.delayed(const Duration(milliseconds: 150), _scrollToBottom);
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        scrolledUnderElevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 17,
                  backgroundColor: primaryCol.withValues(alpha: 0.15),
                  child: Icon(Icons.support_agent_rounded, color: primaryCol, size: 20),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: chatState.isConnected ? const Color(0xFF10B981) : Colors.amber,
                      shape: BoxShape.circle,
                      border: Border.all(color: cardBg, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Mentorship & Support',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textPrimary),
                  ),
                  Text(
                    chatState.isConnected ? 'Admin & Mentors Online' : 'Connecting server...',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: chatState.isConnected ? const Color(0xFF10B981) : AppTheme.textMutedOf(context),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Officer Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                border: Border(bottom: BorderSide(color: borderCol)),
              ),
              child: Row(
                children: [
                  Icon(Icons.verified_user_rounded, color: primaryCol, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Direct Line with Admin & Support. Post your doubts anytime.',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textPrimary),
                    ),
                  ),
                ],
              ),
            ),

            // Blocked user banner warning
            if (chatState.isBlocked)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                color: Colors.red.shade900.withValues(alpha: 0.2),
                child: const Row(
                  children: [
                    Icon(Icons.block_rounded, color: Colors.redAccent, size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'You are blocked from sending messages by Admin. Contact support for resolution.',
                        style: TextStyle(fontSize: 11, color: Colors.redAccent, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),

            // Chat Messages Body
            Expanded(
              child: chatState.isLoading
                  ? Center(child: CircularProgressIndicator(color: primaryCol, strokeWidth: 2))
                  : chatState.messages.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.chat_bubble_outline_rounded, size: 48, color: AppTheme.textMutedOf(context)),
                                const SizedBox(height: 12),
                                Text(
                                  'No messages yet',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textPrimary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Type your query below to start direct conversation with our officers & mentors.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 12, color: AppTheme.textMutedOf(context)),
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          itemCount: chatState.messages.length,
                          itemBuilder: (context, i) {
                            final msg = chatState.messages[i];
                            final isSelf = msg.senderId == (authState.userId ?? 'guest-user');

                            return _ChatMessageBubble(
                              msg: msg,
                              isSelf: isSelf,
                              onEdit: () {
                                setState(() {
                                  _editingMsgId = msg.id;
                                  _inputController.text = msg.messageText;
                                });
                              },
                              onDelete: () {
                                ref.read(chatProvider.notifier).deleteMessage(msg.id);
                              },
                            );
                          },
                        ),
            ),

            // Editing indicator banner
            if (_editingMsgId != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                color: primaryCol.withValues(alpha: 0.1),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Editing message...', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryCol)),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 16),
                      onPressed: () {
                        setState(() {
                          _editingMsgId = null;
                          _inputController.clear();
                        });
                      },
                    ),
                  ],
                ),
              ),

            // Bottom Input Bar
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              decoration: BoxDecoration(
                color: cardBg,
                border: Border(top: BorderSide(color: borderCol)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: borderCol),
                      ),
                      child: TextField(
                        controller: _inputController,
                        enabled: !chatState.isBlocked,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _handleSend(),
                        style: TextStyle(fontSize: 13, color: textPrimary),
                        decoration: InputDecoration(
                          hintText: chatState.isBlocked ? 'Sending disabled' : 'Type your doubt or query...',
                          hintStyle: TextStyle(fontSize: 12, color: AppTheme.textMutedOf(context)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: chatState.isBlocked ? null : _handleSend,
                    icon: const Icon(Icons.send_rounded, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: primaryCol,
                      foregroundColor: isDark ? Colors.black : Colors.white,
                      padding: const EdgeInsets.all(12),
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

class _ChatMessageBubble extends StatelessWidget {
  final ChatMessageModel msg;
  final bool isSelf;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ChatMessageBubble({
    required this.msg,
    required this.isSelf,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryCol = AppTheme.primaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isSelf ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isSelf) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: primaryCol.withValues(alpha: 0.2),
              child: Text(
                msg.fullName.isNotEmpty ? msg.fullName[0].toUpperCase() : 'A',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: primaryCol),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isSelf ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isSelf)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2, left: 4),
                    child: Text(
                      msg.fullName,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMutedOf(context)),
                    ),
                  ),
                PopupMenuButton<String>(
                  enabled: isSelf,
                  offset: const Offset(0, 30),
                  onSelected: (val) {
                    if (val == 'edit') onEdit();
                    if (val == 'delete') onDelete();
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          Icon(Icons.edit_outlined, size: 16),
                          SizedBox(width: 8),
                          Text('Edit Message', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_outline_rounded, size: 16, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Delete', style: TextStyle(fontSize: 12, color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelf
                          ? primaryCol
                          : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: Radius.circular(isSelf ? 16 : 4),
                        bottomRight: Radius.circular(isSelf ? 4 : 16),
                      ),
                      border: isSelf ? null : Border.all(color: borderCol),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          msg.messageText,
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.3,
                            color: isSelf
                                ? (isDark ? Colors.black : Colors.white)
                                : AppTheme.textPrimaryOf(context),
                          ),
                        ),
                        if (msg.isEdited)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              '(edited)',
                              style: TextStyle(
                                fontSize: 9,
                                fontStyle: FontStyle.italic,
                                color: isSelf
                                    ? (isDark ? Colors.black87 : Colors.white70)
                                    : AppTheme.textMutedOf(context),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatTime(msg.createdAt),
                  style: TextStyle(fontSize: 9, color: AppTheme.textMutedOf(context)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(String isoString) {
    try {
      final dt = DateTime.parse(isoString).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }
}
