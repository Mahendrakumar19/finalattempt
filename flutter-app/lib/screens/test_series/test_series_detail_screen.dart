import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:flutter/foundation.dart';

import '../../providers/test_series_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/test_series_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/api_service.dart';
import '../../core/services/storage_service.dart';
import '../../widgets/apple_pressable.dart';
import '../../widgets/app_toast.dart';

class TestSeriesDetailScreen extends ConsumerStatefulWidget {
  final String seriesId;

  const TestSeriesDetailScreen({super.key, required this.seriesId});

  @override
  ConsumerState<TestSeriesDetailScreen> createState() => _TestSeriesDetailScreenState();
}

class _TestSeriesDetailScreenState extends ConsumerState<TestSeriesDetailScreen> {
  String _selectedFilterTab = 'ALL';
  String? _selectedPlanCode = 'FULL'; // Default to FULL package or MINI/HALF
  Razorpay? _razorpay;
  bool _isProcessingPayment = false;
  String? _pendingOrderId;

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

  // ── Helper: Evaluate highest owned entitlement ─────────────────────────────
  String _getHighestTier(List<UserEntitlement> entitlements) {
    if (entitlements.any((e) => (e.entitlementType == 'COMPLETE' || e.entitlementType == 'LEGACY_ENROLLMENT') && e.status == 'ACTIVE')) {
      return 'COMPLETE';
    }
    if (entitlements.any((e) => e.entitlementType == 'FULL' && e.status == 'ACTIVE')) {
      return 'FULL';
    }
    if (entitlements.any((e) => e.entitlementType == 'HALF' && e.status == 'ACTIVE')) {
      return 'HALF';
    }
    if (entitlements.any((e) => e.entitlementType == 'MINI' && e.status == 'ACTIVE')) {
      return 'MINI';
    }
    return 'NONE';
  }

  bool _isQuizAccessible(TestQuiz quiz, int index, TestSeries series, List<UserEntitlement> entitlements, List<TestSeriesPlan> plans) {
    if (quiz.isFree || series.isPurchased) return true;
    final seq = (quiz.sequenceNumber > 0 && quiz.sequenceNumber < 9999) ? quiz.sequenceNumber : (index + 1);

    for (final ent in entitlements) {
      if (ent.status != 'ACTIVE') continue;
      if (ent.entitlementType == 'COMPLETE' || ent.entitlementType == 'LEGACY_ENROLLMENT') {
        return true;
      }
      if (ent.entitlementType == 'FULL') {
        final plan = plans.firstWhere((p) => p.planCode == 'FULL', orElse: () => plans.first);
        return seq <= (ent.snapshotMaxSequence > 0 ? ent.snapshotMaxSequence : plan.sequenceEndNumber);
      }
      if (ent.entitlementType == 'HALF') {
        final plan = plans.firstWhere((p) => p.planCode == 'HALF', orElse: () => plans.first);
        return seq <= (ent.snapshotMaxSequence > 0 ? ent.snapshotMaxSequence : plan.sequenceEndNumber);
      }
      if (ent.entitlementType == 'MINI') {
        final plan = plans.firstWhere((p) => p.planCode == 'MINI', orElse: () => plans.first);
        return seq <= (ent.snapshotMaxSequence > 0 ? ent.snapshotMaxSequence : plan.sequenceEndNumber);
      }
      if (ent.entitlementType == 'INDIVIDUAL_TEST' && ent.quizId == quiz.id) {
        return true;
      }
    }
    return false;
  }

  // ── Handle Payment Success & Verification (Same as Web) ────────────────────
  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      
      // 1. Try Authoritative Order Verification Endpoint (Same as Web)
      if (_pendingOrderId != null && _pendingOrderId!.isNotEmpty) {
        try {
          await apiService.post('/test-series-purchase/order/verify', data: {
            'orderId': _pendingOrderId,
            'razorpayPaymentId': response.paymentId,
            'razorpayOrderId': response.orderId,
            'razorpaySignature': response.signature,
          });
        } catch (_) {
          // Fallback to legacy payments verify if standard order verify errors
          await apiService.post('/payments/verify', data: {
            'razorpay_payment_id': response.paymentId,
            'razorpay_order_id': response.orderId,
            'razorpay_signature': response.signature,
            'courseId': widget.seriesId,
          });
        }
      } else {
        await apiService.post('/payments/verify', data: {
          'razorpay_payment_id': response.paymentId,
          'razorpay_order_id': response.orderId,
          'razorpay_signature': response.signature,
          'courseId': widget.seriesId,
        });
      }

      if (mounted) {
        AppToast.success(
          context,
          'Test Series unlocked! You have full access to your tests.',
          title: 'Payment Successful',
        );
        ref.invalidate(testSeriesDetailProvider(widget.seriesId));
        ref.invalidate(userEntitlementsProvider(widget.seriesId));
        ref.invalidate(testSeriesQuizzesProvider(widget.seriesId));
      }
    } catch (e) {
      if (mounted) {
        AppToast.error(
          context,
          'Verification failed: $e',
          title: 'Verification Failed',
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessingPayment = false;
          _pendingOrderId = null;
        });
      }
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (mounted) {
      setState(() {
        _isProcessingPayment = false;
        _pendingOrderId = null;
      });
      AppToast.error(
        context,
        response.message ?? 'Payment was cancelled or failed.',
        title: 'Payment Incomplete',
      );
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (mounted) {
      setState(() {
        _isProcessingPayment = false;
        _pendingOrderId = null;
      });
    }
  }

  // ── Initiate Checkout with Selected Plan or Individual Test ───────────────
  Future<void> _startPayment({TestSeriesPlan? planOverride, TestQuiz? individualQuiz}) async {
    if (_isProcessingPayment) return;

    final authState = ref.read(authStateProvider);
    if (!authState.isLoggedIn) {
      AppToast.warning(
        context,
        'Please sign in to unlock test series packages.',
        title: 'Sign In Required',
      );
      context.push('/login');
      return;
    }

    setState(() => _isProcessingPayment = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      final plans = await ref.read(testSeriesPlansProvider(widget.seriesId).future);
      final entitlements = await ref.read(userEntitlementsProvider(widget.seriesId).future);
      final highestTier = _getHighestTier(entitlements);

      final userUid = authState.userId ?? 'user';
      final idempotencyKey = 'idemp_${userUid}_${widget.seriesId}_${DateTime.now().millisecondsSinceEpoch}';

      dynamic orderRes;
      String orderDescription = '';
      int expectedSellingPrice = 0;

      if (individualQuiz != null) {
        // Individual Single Test Purchase
        final singlePrice = (individualQuiz.individualPrice != null && individualQuiz.individualPrice! > 0)
            ? individualQuiz.individualPrice!.toInt()
            : 49;
        expectedSellingPrice = singlePrice;
        orderDescription = 'Single Test: ${individualQuiz.title}';

        try {
          orderRes = await apiService.post('/test-series-purchase/order/create', data: {
            'seriesId': widget.seriesId,
            'items': [
              {
                'itemType': 'INDIVIDUAL_TEST',
                'quizId': individualQuiz.id,
              }
            ],
            'idempotencyKey': idempotencyKey,
          });
        } catch (e) {
          orderRes = await apiService.post('/payments/create-order', data: {
            'courseId': widget.seriesId,
            'quizId': individualQuiz.id,
            'amount': singlePrice,
            'currency': 'INR',
          });
        }
      } else {
        // Determine selected plan (MINI, HALF, FULL)
        final series = ref.read(testSeriesDetailProvider(widget.seriesId)).valueOrNull;
        final targetPlanCode = planOverride?.planCode ?? _selectedPlanCode ?? 'FULL';
        final selectedPlan = plans.firstWhere(
          (p) => p.planCode == targetPlanCode,
          orElse: () => plans.isNotEmpty ? plans.first : TestSeriesPlan(
            id: 'default',
            seriesId: widget.seriesId,
            planCode: 'FULL',
            title: series?.title ?? 'FULL Package',
            price: (series?.discountedPrice != null && series!.discountedPrice! > 0)
                ? series.discountedPrice!
                : (series?.price ?? 0),
            discountedPrice: series?.discountedPrice,
          ),
        );

        final isUpgrade = highestTier == 'MINI' || highestTier == 'HALF' || highestTier == 'FULL';
        final itemType = isUpgrade ? 'UPGRADE_PLAN' : 'PACKAGE_PLAN';
        expectedSellingPrice = selectedPlan.sellingPrice.toInt();
        orderDescription = '${selectedPlan.title} (${selectedPlan.planCode})';

        try {
          orderRes = await apiService.post('/test-series-purchase/order/create', data: {
            'seriesId': widget.seriesId,
            'items': [
              {
                'itemType': itemType,
                'planCode': selectedPlan.planCode,
              }
            ],
            'idempotencyKey': idempotencyKey,
          });
        } catch (e) {
          orderRes = await apiService.post('/payments/create-order', data: {
            'courseId': widget.seriesId,
            'amount': selectedPlan.sellingPrice,
            'currency': 'INR',
          });
        }
      }

      final data = orderRes['data'] ?? orderRes;
      final orderId = data['orderId'] ?? data['id'] ?? data['order_id'];
      _pendingOrderId = orderId?.toString();

      // Zero-amount fulfillment check (Free or 100% upgrade credit)
      if (orderRes['message']?.toString().contains('Zero payable amount') == true ||
          data['isFreeFulfillment'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF15803D),
              content: Text('Access Granted Instantly!'),
            ),
          );
          ref.invalidate(testSeriesDetailProvider(widget.seriesId));
          ref.invalidate(userEntitlementsProvider(widget.seriesId));
          ref.invalidate(testSeriesQuizzesProvider(widget.seriesId));
          setState(() => _isProcessingPayment = false);
        }
        return;
      }

      final gatewayOrderId = data['gatewayOrderId'] ?? data['order_id'] ?? data['id'];
      final rawAmount = data['netAmount'] != null
          ? (data['netAmount'] * 100).toInt()
          : (data['amount'] ?? (expectedSellingPrice * 100));
      final razorpayKey = data['key'] ?? 'rzp_test_TTzBxGpMqc0rAD';

      final userMobile = authState.userMobile ?? ref.read(storageServiceProvider).getUserMobile() ?? '';

      final options = {
        'key': razorpayKey,
        'amount': rawAmount,
        'currency': data['currency'] ?? 'INR',
        'name': 'Final Attempt',
        'order_id': gatewayOrderId,
        'description': orderDescription,
        'prefill': {
          'contact': userMobile,
          'email': authState.userEmail ?? ref.read(storageServiceProvider).getUserEmail() ?? '',
        },
        'theme': {'color': '#15803D'},
      };

      if (!kIsWeb && _razorpay != null) {
        _razorpay!.open(options);
      } else {
        // Fallback or web simulation: call verification directly
        final simVerify = await apiService.post('/test-series-purchase/order/verify', data: {
          'orderId': orderId,
          'razorpayPaymentId': 'pay_sim_${DateTime.now().millisecondsSinceEpoch}',
          'razorpayOrderId': gatewayOrderId,
        });

        if (simVerify['success'] == true) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                backgroundColor: Color(0xFF15803D),
                content: Text('Payment Verified! Access granted.'),
              ),
            );
            ref.invalidate(testSeriesDetailProvider(widget.seriesId));
            ref.invalidate(userEntitlementsProvider(widget.seriesId));
            ref.invalidate(testSeriesQuizzesProvider(widget.seriesId));
          }
        }
        if (mounted) setState(() => _isProcessingPayment = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessingPayment = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text('Could not initiate checkout: $e'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final seriesAsync = ref.watch(testSeriesDetailProvider(widget.seriesId));
    final quizzesAsync = ref.watch(testSeriesQuizzesProvider(widget.seriesId));
    final plansAsync = ref.watch(testSeriesPlansProvider(widget.seriesId));
    final entitlementsAsync = ref.watch(userEntitlementsProvider(widget.seriesId));

    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: bg,
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
                context.go('/test-series');
              }
            },
          ),
          title: seriesAsync.when(
            data: (series) => Text(
              series.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: textPrimary,
              ),
            ),
            loading: () => const Text('Loading...'),
            error: (_, __) => const Text('Test Series Details'),
          ),
          bottom: const TabBar(
            labelColor: AppColors.primaryBlue,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primaryBlue,
            indicatorWeight: 3,
            labelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
            tabs: [
              Tab(text: 'Tests List'),
              Tab(text: 'Packages & Overview'),
            ],
          ),
        ),
        body: seriesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue)),
          error: (err, _) => _buildErrorState(context, err.toString()),
          data: (series) {
            final entitlements = entitlementsAsync.value ?? [];
            final plans = plansAsync.value ?? [];

            return TabBarView(
              children: [
                // Tab 1: Test List
                quizzesAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue)),
                  error: (e, _) => _buildErrorState(context, e.toString()),
                  data: (quizzes) => _buildTestList(context, series, quizzes, entitlements, plans),
                ),
                // Tab 2: Packages & Overview
                _buildOverviewTab(context, series, plans, entitlements),
              ],
            );
          },
        ),
        bottomNavigationBar: seriesAsync.when(
          data: (series) {
            final entitlements = entitlementsAsync.value ?? [];
            final plans = plansAsync.value ?? [];
            return _buildBottomBuyBar(context, series, plans, entitlements);
          },
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const SizedBox.shrink(),
        ),
      ),
    );
  }

  // ── Tab 1: Tests List ──────────────────────────────────────────────────────
  Widget _buildTestList(
    BuildContext context,
    TestSeries series,
    List<TestQuiz> quizzes,
    List<UserEntitlement> entitlements,
    List<TestSeriesPlan> plans,
  ) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    // Filter quizzes by category/demo filter
    final filteredQuizzes = quizzes.where((q) {
      if (_selectedFilterTab == 'ALL') return true;
      if (_selectedFilterTab == 'FULL') return q.testCategory.toUpperCase() == 'FULL';
      if (_selectedFilterTab == 'SECTIONAL') return q.testCategory.toUpperCase() == 'SECTIONAL' || q.testCategory.toUpperCase() == 'CHAPTER';
      if (_selectedFilterTab == 'PYQ') {
        final cat = q.testCategory.toUpperCase();
        final title = q.title.toLowerCase();
        return cat == 'PYQ' || title.contains('pyq') || title.contains('previous year') || title.contains('पूर्व वर्ष');
      }
      if (_selectedFilterTab == 'CURRENT') {
        final cat = q.testCategory.toUpperCase();
        final title = q.title.toLowerCase();
        return cat == 'CURRENT' || cat == 'CURRENT_AFFAIRS' || title.contains('current') || title.contains('करेंट') || title.contains('समसामयिक');
      }
      if (_selectedFilterTab == 'FREE') return q.isFree;
      return true;
    }).toList();

    return Column(
      children: [
        // Sub-filter bar (All, Full Mock, Sectional, PYQ, Current Affairs, Free)
        Container(
          color: cardBg,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(context, 'ALL', 'All Tests (${quizzes.length})'),
                _buildFilterChip(context, 'FULL', 'Full Mocks'),
                _buildFilterChip(context, 'SECTIONAL', 'Sectional'),
                _buildFilterChip(context, 'PYQ', 'PYQ Tests'),
                _buildFilterChip(context, 'CURRENT', 'Current Affairs'),
                _buildFilterChip(context, 'FREE', 'Free Demo'),
              ],
            ),
          ),
        ),
        Divider(height: 1, color: borderCol),

        // Test List
        Expanded(
          child: filteredQuizzes.isEmpty
              ? _buildEmptyQuizState(context)
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  itemCount: filteredQuizzes.length,
                  itemBuilder: (context, index) {
                    final quiz = filteredQuizzes[index];
                    final canAttempt = _isQuizAccessible(quiz, index, series, entitlements, plans);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderCol),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    if (quiz.isFree)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        margin: const EdgeInsets.only(right: 8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDCFCE7),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'FREE DEMO',
                                          style: TextStyle(
                                            color: Color(0xFF15803D),
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).brightness == Brightness.dark
                                            ? const Color(0xFF1E293B)
                                            : const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        quiz.testCategory.toUpperCase(),
                                        style: const TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                if (quiz.isAttempted)
                                  const Row(
                                    children: [
                                      Icon(Icons.check_circle_outline, size: 14, color: AppColors.primaryBlue),
                                      SizedBox(width: 4),
                                      Text(
                                        'Attempted',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.primaryBlue,
                                        ),
                                      ),
                                    ],
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              quiz.title,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: textPrimary,
                              ),
                            ),
                            if (quiz.description != null && quiz.description!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                quiz.description!,
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                              ),
                            ],
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.help_outline, size: 14, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text('${quiz.totalQuestions} Qs', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    const SizedBox(width: 12),
                                    const Icon(Icons.timer_outlined, size: 14, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text('${quiz.timeLimitMins} Mins', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    const SizedBox(width: 12),
                                    const Icon(Icons.stars_outlined, size: 14, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text('${quiz.totalMarks.toInt()} Marks', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                  ],
                                ),
                                ElevatedButton(
                                  onPressed: canAttempt
                                      ? () {
                                          context.push('/test/${quiz.id}/instructions');
                                        }
                                      : () {
                                          _showUnlockOptionsModal(context, quiz, plans, series);
                                        },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF15803D),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      if (!canAttempt) const Icon(Icons.lock_open_rounded, size: 13, color: Colors.white),
                                      if (!canAttempt) const SizedBox(width: 4),
                                      Text(
                                        canAttempt
                                            ? (quiz.isAttempted ? 'Re-attempt' : 'Start Test')
                                            : 'Unlock (₹' + ((quiz.individualPrice != null && quiz.individualPrice! > 0) ? quiz.individualPrice!.toInt().toString() : '49') + ')',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(BuildContext context, String key, String label) {
    final isSelected = _selectedFilterTab == key;
    final borderCol = AppTheme.borderOf(context);

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedFilterTab = key;
          });
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.lightBlueBackground
                : (Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF1E293B)
                    : const Color(0xFFF1F5F9)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.primaryBlue : borderCol,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? AppColors.primaryBlue : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  void _showUnlockOptionsModal(BuildContext context, TestQuiz quiz, List<TestSeriesPlan> plans, TestSeries series) {
    final singlePrice = (quiz.individualPrice != null && quiz.individualPrice! > 0) ? quiz.individualPrice!.toInt() : 49;
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(ctx).padding.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'UNLOCK TEST',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                quiz.title,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: () {
                  Navigator.pop(ctx);
                  _startPayment(individualQuiz: quiz);
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7).withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF15803D), width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFF15803D),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.flash_on_rounded, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Buy Single Test Only',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                            ),
                            Text(
                              'Instant access to this specific test paper & solutions',
                              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '₹' + singlePrice.toString(),
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF15803D)),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (plans.isNotEmpty)
                InkWell(
                  onTap: () {
                    Navigator.pop(ctx);
                    final fullPlan = plans.firstWhere((p) => p.planCode == 'FULL', orElse: () => plans.first);
                    _startPayment(planOverride: fullPlan);
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.borderOf(ctx)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E3A8A),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.all_inclusive_rounded, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Unlock All Tests (' + series.totalTests.toString() + ' Tests)',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary),
                              ),
                              const Text(
                                'Full package pass with all future mocks & ranking',
                                style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '₹' + plans.firstWhere((p) => p.planCode == 'FULL', orElse: () => plans.first).sellingPrice.toInt().toString(),
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
  // ── Tab 2: Packages & Overview (Matches Website Options: MINI, HALF, FULL) ──
  Widget _buildOverviewTab(
    BuildContext context,
    TestSeries series,
    List<TestSeriesPlan> plans,
    List<UserEntitlement> entitlements,
  ) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final highestTier = _getHighestTier(entitlements);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner / Header Card
          if (series.bannerUrl != null || series.thumbnailUrl != null) ...[
            Builder(
              builder: (context) {
                String imgUrl = series.bannerUrl ?? series.thumbnailUrl!;
                if (imgUrl.isNotEmpty) {
                  if (!imgUrl.startsWith('http')) {
                    imgUrl = imgUrl.startsWith('/') ? 'https://finalattemptias.com$imgUrl' : 'https://finalattemptias.com/$imgUrl';
                  }
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: AspectRatio(
                        aspectRatio: 16 / 7,
                        child: Image.network(
                          imgUrl,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                        ),
                      ),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ],

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryBlue,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  series.examCategory.toUpperCase(),
                  style: const TextStyle(
                    color: Color(0xFF93C5FD),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  series.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.assignment, color: Colors.white70, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      '${series.totalTests} Tests (${series.fullLengthCount} Full Length)',
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── SECTION: CHOOSE PACKAGE TIER (MINI, HALF, FULL) ───────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Choose Package Tier',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.flash_on, size: 12, color: Color(0xFFD97706)),
                    SizedBox(width: 4),
                    Text(
                      'ALL OPTIONS',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFFD97706)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Select cumulative package or upgrade with instant credit adjustment:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),

          // Package Cards List (MINI, HALF, FULL)
          ...plans.map((plan) {
            final isPlanSelected = _selectedPlanCode == plan.planCode;
            final isOwned = _isPlanOwned(plan.planCode, highestTier);
            final isUpgradeCandidate = _isUpgradeCandidate(plan.planCode, highestTier);

            return ApplePressable(
              onTap: isOwned
                  ? null
                  : () {
                      setState(() {
                        _selectedPlanCode = plan.planCode;
                      });
                    },
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isPlanSelected
                        ? const Color(0xFFF59E0B)
                        : (isOwned ? const Color(0xFF10B981) : borderCol),
                    width: isPlanSelected ? 2 : 1.2,
                  ),
                  boxShadow: [
                    if (isPlanSelected)
                      BoxShadow(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: _getPlanBadgeBg(plan.planCode),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${plan.planCode} PACKAGE',
                                  style: TextStyle(
                                    color: _getPlanBadgeColor(plan.planCode),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  'Tests ${plan.sequenceStartNumber}–${plan.sequenceEndNumber}',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isPlanSelected
                                ? const Color(0xFFF59E0B)
                                : (isOwned ? const Color(0xFF10B981) : (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
                          ),
                          child: Icon(
                            isOwned ? Icons.check : (isPlanSelected ? Icons.check : Icons.circle_outlined),
                            size: 14,
                            color: (isPlanSelected || isOwned) ? Colors.white : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      plan.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                      ),
                    ),
                    if (plan.description != null && plan.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        plan.description!,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.3),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '₹${plan.sellingPrice.toInt()}',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: textPrimary,
                              ),
                            ),
                            if (plan.originalMrp != null) ...[
                              const SizedBox(width: 6),
                              Text(
                                '₹${plan.originalMrp!.toInt()}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textMuted,
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            ],
                            const SizedBox(width: 6),
                            const Text(
                              'cumulative',
                              style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        if (isOwned)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.check_circle, size: 12, color: Color(0xFF15803D)),
                                SizedBox(width: 4),
                                Text(
                                  'ACTIVE ACCESS',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF15803D)),
                                ),
                              ],
                            ),
                          )
                        else if (isUpgradeCandidate)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Upgrade from $highestTier',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFFD97706)),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 16),

          // Highlights Section
          Text(
            'Package Highlights',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: textPrimary),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderCol),
            ),
            child: Column(
              children: (series.highlights.isNotEmpty
                      ? series.highlights
                      : [
                          'Full-length mock tests based on latest exam pattern',
                          'Detailed explanations & bilingual questions (Hindi & English)',
                          'Real-time percentile ranking & speed analytics',
                          'Sectional tests for targeted subject practice',
                        ])
                  .map((h) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle, color: Color(0xFF15803D), size: 18),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                h,
                                style: TextStyle(fontSize: 13, color: textPrimary, height: 1.3),
                              ),
                            ),
                          ],
                        ),
                      ))
                  .toList(),
            ),
          ),
          const SizedBox(height: 20),

          // Description Section
          Text(
            'Description',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: textPrimary),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderCol),
            ),
            child: Text(
              series.description ?? 'Prepare for your competitive exams with comprehensive mock test series designed by expert educators. Features real exam simulation with instant performance diagnostics.',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
            ),
          ),
          const SizedBox(height: 20),

          // Specifications
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderCol),
            ),
            child: Column(
              children: [
                _buildSpecRow(context, 'Validity', '${series.validityDays} Days access from enrollment'),
                Divider(height: 16, color: borderCol),
                _buildSpecRow(context, 'Language', series.language),
                Divider(height: 16, color: borderCol),
                _buildSpecRow(context, 'Total Enrolled', '${series.enrolledCount}+ Students'),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  bool _isPlanOwned(String planCode, String highestTier) {
    if (highestTier == 'COMPLETE' || highestTier == 'LEGACY_ENROLLMENT') return true;
    if (planCode == 'MINI') return highestTier == 'MINI' || highestTier == 'HALF' || highestTier == 'FULL';
    if (planCode == 'HALF') return highestTier == 'HALF' || highestTier == 'FULL';
    if (planCode == 'FULL') return highestTier == 'FULL';
    return false;
  }

  bool _isUpgradeCandidate(String planCode, String highestTier) {
    if (highestTier == 'MINI' && (planCode == 'HALF' || planCode == 'FULL')) return true;
    if (highestTier == 'HALF' && planCode == 'FULL') return true;
    return false;
  }

  Color _getPlanBadgeBg(String planCode) {
    switch (planCode) {
      case 'MINI':
        return const Color(0xFFFEF3C7);
      case 'HALF':
        return const Color(0xFFE0E7FF);
      case 'FULL':
      default:
        return const Color(0xFFDCFCE7);
    }
  }

  Color _getPlanBadgeColor(String planCode) {
    switch (planCode) {
      case 'MINI':
        return const Color(0xFFD97706);
      case 'HALF':
        return const Color(0xFF4338CA);
      case 'FULL':
      default:
        return const Color(0xFF15803D);
    }
  }

  Widget _buildSpecRow(BuildContext context, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimaryOf(context))),
      ],
    );
  }

  // ── Bottom Buy Bar ─────────────────────────────────────────────────────────
  Widget _buildBottomBuyBar(
    BuildContext context,
    TestSeries series,
    List<TestSeriesPlan> plans,
    List<UserEntitlement> entitlements,
  ) {
    final highestTier = _getHighestTier(entitlements);

    if (series.isPurchased || highestTier == 'COMPLETE' || highestTier == 'FULL') {
      return Container(
        margin: const EdgeInsets.only(bottom: 84),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        color: const Color(0xFFDCFCE7),
        child: const Row(
          children: [
            Icon(Icons.verified, color: Color(0xFF15803D)),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'You have full access to this Test Series Pass.',
                style: TextStyle(color: Color(0xFF15803D), fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          ],
        ),
      );
    }

    // Determine currently selected plan
    final activePlan = plans.firstWhere(
      (p) => p.planCode == _selectedPlanCode,
      orElse: () => plans.isNotEmpty ? plans.first : TestSeriesPlan(
        id: 'default',
        seriesId: widget.seriesId,
        planCode: 'FULL',
        title: 'FULL Package',
        price: series.discountedPrice ?? series.price,
      ),
    );

    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 84),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        border: Border(top: BorderSide(color: borderCol)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${activePlan.planCode} PLAN SELECTED',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF16A34A), letterSpacing: 0.5),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '₹${activePlan.sellingPrice.toInt()}',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                      if (activePlan.originalMrp != null) ...[
                        const SizedBox(width: 6),
                        Text(
                          '₹${activePlan.originalMrp!.toInt()}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted, decoration: TextDecoration.lineThrough),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            ApplePressable(
              onTap: _isProcessingPayment ? null : () => _startPayment(planOverride: activePlan),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFF16A34A),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF16A34A).withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: _isProcessingPayment
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(
                        'Buy ${activePlan.planCode} (₹${activePlan.sellingPrice.toInt()})',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyQuizState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.assignment_outlined, size: 44, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(
              'No tests found in this category',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimaryOf(context)),
            ),
            const SizedBox(height: 4),
            const Text(
              'Try selecting another filter tab above.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: Color(0xFFEF4444)),
            const SizedBox(height: 12),
            Text(
              'Unable to load Test Details',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimaryOf(context)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Please check connection and tap retry below.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                ref.invalidate(testSeriesDetailProvider(widget.seriesId));
                ref.invalidate(testSeriesQuizzesProvider(widget.seriesId));
                ref.invalidate(testSeriesPlansProvider(widget.seriesId));
                ref.invalidate(userEntitlementsProvider(widget.seriesId));
              },
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlue,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
