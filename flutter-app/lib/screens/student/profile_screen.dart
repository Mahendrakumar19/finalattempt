import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/storage_service.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/top_header_actions.dart';

class StudentProfileScreen extends ConsumerWidget {
  const StudentProfileScreen({super.key});

  void _showEditProfileModal(BuildContext context, WidgetRef ref, StorageService storage) {
    final nameCtrl = TextEditingController(text: storage.getUserName() ?? '');
    final mobileCtrl = TextEditingController(text: storage.getUserMobile() ?? '');
    String selectedExam = storage.getTargetExam() ?? 'BPSC';
    final examsList = ['BPSC', 'BSSC', 'UPSC', 'Bihar Daroga', 'STET', 'SSC', 'Banking', 'Other'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer(
        builder: (ctx, ref, _) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.cardBgOf(ctx),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade400,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Row(
                      children: [
                        Icon(Icons.edit_note_rounded, color: AppTheme.primaryBlue, size: 24),
                        SizedBox(width: 10),
                        Text(
                          'Edit Profile Details',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Update your profile information and target exam settings.',
                      style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 20),

                    // Full Name
                    TextFormField(
                      controller: nameCtrl,
                      style: TextStyle(fontSize: 14, color: AppTheme.textPrimaryOf(ctx)),
                      decoration: InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: const Icon(Icons.person_outline_rounded, size: 20, color: AppTheme.primaryBlue),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Phone / Mobile
                    TextFormField(
                      controller: mobileCtrl,
                      keyboardType: TextInputType.phone,
                      style: TextStyle(fontSize: 14, color: AppTheme.textPrimaryOf(ctx)),
                      decoration: InputDecoration(
                        labelText: 'Mobile Number',
                        prefixIcon: const Icon(Icons.phone_outlined, size: 20, color: AppTheme.primaryBlue),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Target Exam Dropdown
                    DropdownButtonFormField<String>(
                      initialValue: examsList.contains(selectedExam) ? selectedExam : 'BPSC',
                      style: TextStyle(fontSize: 14, color: AppTheme.textPrimaryOf(ctx)),
                      dropdownColor: AppTheme.cardBgOf(ctx),
                      decoration: InputDecoration(
                        labelText: 'Target Exam',
                        prefixIcon: const Icon(Icons.school_outlined, size: 20, color: AppTheme.primaryBlue),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                      ),
                      items: examsList.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                      onChanged: (val) {
                        if (val != null) selectedExam = val;
                      },
                    ),
                    const SizedBox(height: 24),

                    // Save CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final newName = nameCtrl.text.trim();
                          if (newName.isEmpty) return;

                          await ref.read(authStateProvider.notifier).updateProfile(
                            name: newName,
                            mobile: mobileCtrl.text.trim(),
                            targetExam: selectedExam,
                          );

                          if (ctx.mounted) {
                            Navigator.of(ctx).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Profile updated successfully!'),
                                backgroundColor: Colors.green,
                                duration: Duration(seconds: 2),
                              ),
                            );
                          }
                        },
                        icon: const Icon(Icons.check_circle_rounded, size: 18),
                        label: const Text('Save Profile Details', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryBlue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storage = ref.watch(storageServiceProvider);
    final authState = ref.watch(authStateProvider);
    final userName = authState.userName ?? storage.getUserName() ?? 'Aspirant';
    final userEmail = storage.getUserEmail() ?? 'student@finalattempt.com';
    final userRole = storage.getUserRole() ?? 'student';
    final userMobile = storage.getUserMobile() ?? 'Not updated';
    final targetExam = storage.getTargetExam() ?? 'BPSC';
    final userId = storage.getUserId() ?? 'usr_demo';

    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        scrolledUnderElevation: 0.5,
        title: Text(
          'Student Profile',
          style: TextStyle(color: textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
        ),
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
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 8),
        ],
      ),
      body: Stack(
        children: [
          Positioned(
            top: -60,
            right: -60,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE8F1FF),
              ),
            ),
          ),
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(
              children: [
                // Profile Avatar & Header Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: borderCol),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 46,
                        backgroundColor: AppTheme.primaryBlue,
                        child: Text(
                          userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                          style: const TextStyle(
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        userName,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        userEmail,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppTheme.primaryBlue.withValues(alpha: 0.2)),
                            ),
                            child: Text(
                              userRole.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryBlue,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
                            ),
                            child: Text(
                              'TARGET: $targetExam',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF10B981),
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Edit Profile CTA Tile
                InkWell(
                  onTap: () => _showEditProfileModal(context, ref, storage),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryBlue.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.primaryBlue.withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryBlue,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.edit_outlined, color: Colors.white, size: 18),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Edit Profile Details',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryBlue,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Update full name, phone number & target exam',
                                style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.primaryBlue),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Account Information Section
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Account Information',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: textPrimary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                _ProfileDetailCard(
                  icon: Icons.person_outline_rounded,
                  label: 'Full Name',
                  value: userName,
                ),
                _ProfileDetailCard(
                  icon: Icons.email_outlined,
                  label: 'Email Address',
                  value: userEmail,
                ),
                _ProfileDetailCard(
                  icon: Icons.phone_outlined,
                  label: 'Mobile Number',
                  value: userMobile,
                ),
                _ProfileDetailCard(
                  icon: Icons.school_outlined,
                  label: 'Target Exam',
                  value: targetExam,
                ),
                _ProfileDetailCard(
                  icon: Icons.badge_outlined,
                  label: 'User ID',
                  value: userId.length > 12 ? userId.substring(0, 12) : userId,
                ),
                const _ProfileDetailCard(
                  icon: Icons.verified_user_outlined,
                  label: 'Account Status',
                  value: 'ACTIVE STUDENT',
                  valueColor: Color(0xFF10B981),
                ),

                const SizedBox(height: 24),

                // Sign Out Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await ref.read(authStateProvider.notifier).logout();
                      if (context.mounted) {
                        context.go('/');
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Logged out successfully')),
                        );
                      }
                    },
                    icon: const Icon(Icons.logout_rounded, color: Colors.red, size: 18),
                    label: const Text(
                      'Sign Out of Account',
                      style: TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.red.shade300),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileDetailCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _ProfileDetailCard({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderCol),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlue.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: AppTheme.primaryBlue),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: valueColor ?? textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

