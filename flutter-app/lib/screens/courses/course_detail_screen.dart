import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:flutter/foundation.dart';

import '../../providers/courses_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/api_service.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/app_toast.dart';

class CourseDetailScreen extends ConsumerStatefulWidget {
  final String courseId;
  const CourseDetailScreen({super.key, required this.courseId});

  @override
  ConsumerState<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends ConsumerState<CourseDetailScreen> {
  Razorpay? _razorpay;
  bool _isEnrolling = false;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      _razorpay = Razorpay();
      _razorpay?.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
      _razorpay?.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
      _razorpay?.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    }
  }

  @override
  void dispose() {
    if (!kIsWeb) {
      _razorpay?.clear();
    }
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.post('/payments/verify', data: {
        'razorpay_payment_id': response.paymentId,
        'razorpay_order_id': response.orderId,
        'razorpay_signature': response.signature,
        'courseId': widget.courseId,
      });

      if (mounted) {
        AppToast.success(
          context,
          'Enrollment Successful! Welcome to the course.',
          title: 'Enrolled Successfully',
        );
        ref.invalidate(courseDetailProvider(widget.courseId));
      }
    } catch (e) {
      if (mounted) {
        AppToast.error(
          context,
          'Payment confirmation failed: $e',
          title: 'Verification Failed',
        );
      }
    } finally {
      if (mounted) setState(() => _isEnrolling = false);
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (mounted) {
      setState(() => _isEnrolling = false);
      AppToast.error(
        context,
        response.message ?? 'Payment was cancelled or failed.',
        title: 'Payment Failed',
      );
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (mounted) setState(() => _isEnrolling = false);
  }

  Future<void> _startEnrollment(dynamic course) async {
    if (_isEnrolling) return;

    final authState = ref.read(authStateProvider);
    if (!authState.isLoggedIn) {
      AppToast.warning(
        context,
        'Please sign in to enroll in this course.',
        title: 'Sign In Required',
      );
      context.push('/login');
      return;
    }

    setState(() => _isEnrolling = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      final res = await apiService.post('/payments/create-order', data: {
        'courseId': widget.courseId,
        'currency': 'INR',
      });

      final data = res['data'] ?? res;
      final options = {
        'key': data['key'] ?? 'rzp_test_TTzBxGpMqc0rAD',
        'amount': data['amount'],
        'name': 'Final Attempt',
        'order_id': data['order_id'] ?? data['id'],
        'description': course.title,
        'prefill': {
          'contact': '',
          'email': authState.userEmail ?? '',
        },
        'theme': {'color': '#1D4ED8'},
      };

      if (!kIsWeb && _razorpay != null) {
        _razorpay!.open(options);
      } else {
        // Fallback simulation for non-mobile/dev environments
        final simRes = await apiService.post('/payments/verify', data: {
          'razorpay_payment_id': 'pay_sim_${DateTime.now().millisecondsSinceEpoch}',
          'razorpay_order_id': data['order_id'] ?? 'order_sim',
          'courseId': widget.courseId,
        });
        if (mounted && simRes['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF15803D),
              content: Text('Enrollment Confirmed!'),
            ),
          );
          ref.invalidate(courseDetailProvider(widget.courseId));
        }
        if (mounted) setState(() => _isEnrolling = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isEnrolling = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text('Could not start checkout: $e'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final courseAsync = ref.watch(courseDetailProvider(widget.courseId));
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        scrolledUnderElevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Course Details',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: textPrimary),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.share_rounded, color: textPrimary),
            onPressed: () {},
          ),
        ],
      ),
      body: courseAsync.when(
        data: (course) {
          if (course == null) {
            return const Center(child: Text('Course not found', style: TextStyle(color: AppColors.textMuted)));
          }
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: AppColors.primaryBlue,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(20),
                      bottomRight: Radius.circular(20),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (course.category != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            course.category!,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.6),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Text(
                        course.title,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _InfoChip(icon: Icons.group_rounded, label: '${course.enrolledCount} enrolled'),
                          const SizedBox(width: 12),
                          if (course.duration != null)
                            _InfoChip(icon: Icons.schedule_rounded, label: course.duration!),
                        ],
                      ),
                      if (course.fee != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          '₹${course.fee}',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isEnrolling ? null : () => _startEnrollment(course),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primaryBlue,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: _isEnrolling
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Text('Enroll Now', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                        ),
                      ),
                    ],
                  ),
                ),

                // Description
                if (course.description != null && course.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'About this Course',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          course.description!,
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.6),
                        ),
                      ],
                    ),
                  ),

                // Features
                if (course.features.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'What\'s Included',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                        const SizedBox(height: 10),
                        ...course.features.map((f) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                              const SizedBox(width: 8),
                              Expanded(child: Text(f, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))),
                            ],
                          ),
                        )),
                      ],
                    ),
                  ),

                // Syllabus
                if (course.syllabus.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Syllabus',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                        const SizedBox(height: 10),
                        ...course.syllabus.asMap().entries.map((e) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: cardBg,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: borderCol),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 24, height: 24,
                                decoration: BoxDecoration(
                                  color: AppColors.primaryBlue.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Center(
                                  child: Text('${e.key + 1}',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primaryBlue),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(child: Text(e.value, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))),
                            ],
                          ),
                        )),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
        loading: () => const LoadingShimmer(height: 400),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
