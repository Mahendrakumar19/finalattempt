import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../providers/downloads_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/downloads_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/api_service.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/apple_pressable.dart';
import '../../widgets/apple_sheet.dart';
import '../../widgets/app_toast.dart';

class FaPublicationsScreen extends ConsumerStatefulWidget {
  const FaPublicationsScreen({super.key});

  @override
  ConsumerState<FaPublicationsScreen> createState() => _FaPublicationsScreenState();
}

class _FaPublicationsScreenState extends ConsumerState<FaPublicationsScreen> {
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  Razorpay? _razorpay;
  PublicationBookModel? _activePurchasingBook;
  Map<String, dynamic>? _activeShippingAddress;
  String? _pendingOrderId;
  bool _isProcessingPayment = false;

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
    _searchController.dispose();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final book = _activePurchasingBook;
      final address = _activeShippingAddress;

      await apiService.post('/payments/verify-publication-order', data: {
        'razorpayPaymentId': response.paymentId,
        'razorpayOrderId': response.orderId ?? _pendingOrderId,
        'razorpaySignature': response.signature ?? '',
        'bookTitle': book?.title ?? 'Publication Book',
        'bookId': book?.id,
        'editionYear': book?.edition,
        'language': book?.language,
        'price': book?.price ?? 0,
        'deliveryFee': 0,
        'amount': book?.price ?? 0,
        'shippingAddress': address ?? {},
      });

      if (mounted) {
        _showOrderSuccessDialog(response.paymentId ?? '');
      }
    } catch (e) {
      if (mounted) {
        AppToast.error(context, 'Payment verification failed: $e', title: 'Payment Error');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessingPayment = false;
          _activePurchasingBook = null;
          _activeShippingAddress = null;
          _pendingOrderId = null;
        });
      }
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (mounted) {
      setState(() => _isProcessingPayment = false);
      AppToast.error(context, response.message ?? 'Payment was cancelled or failed.', title: 'Payment Failed');
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (mounted) {
      AppToast.info(context, 'Redirected to wallet: ${response.walletName}');
    }
  }

  void _showOrderSuccessDialog(String paymentId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: AppTheme.cardBgOf(context),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 28),
            SizedBox(width: 10),
            Text('Order Confirmed!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your book parcel order has been successfully placed. Our team will pack and dispatch your book shortly.',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'Payment ID: $paymentId',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Great, Done', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _startInAppOrder(PublicationBookModel book) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final pincodeCtrl = TextEditingController();
    final cityCtrl = TextEditingController();
    final stateCtrl = TextEditingController(text: 'Bihar');

    final authState = ref.read(authStateProvider);
    if (authState.userName != null && authState.userName!.isNotEmpty) {
      nameCtrl.text = authState.userName!;
    }

    AppleSheet.show(
      context: context,
      initialChildSize: 0.85,
      builder: (sheetContext) {
        final textPrimary = AppTheme.textPrimaryOf(sheetContext);
        final textMuted = AppTheme.textMutedOf(sheetContext);
        final borderCol = AppTheme.borderOf(sheetContext);

        return StatefulBuilder(
          builder: (context, setSheetState) {
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(sheetContext).viewInsets.bottom + 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.local_shipping_rounded, color: Color(0xFFD97706), size: 22),
                          const SizedBox(width: 8),
                          Text(
                            'Delivery Details',
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: textPrimary),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.of(sheetContext).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Order: ${book.title}',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: textMuted),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        'Total Payable: ₹${book.price.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF10B981)),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('Free Shipping', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildAddressField('Full Name *', nameCtrl, Icons.person_outline, borderCol, textPrimary, textMuted),
                  const SizedBox(height: 10),
                  _buildAddressField('Mobile Number (for Courier Tracking) *', phoneCtrl, Icons.phone_outlined, borderCol, textPrimary, textMuted, keyboardType: TextInputType.phone),
                  const SizedBox(height: 10),
                  _buildAddressField('Complete House / Street Address *', addressCtrl, Icons.home_outlined, borderCol, textPrimary, textMuted, maxLines: 2),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _buildAddressField('Pincode *', pincodeCtrl, Icons.pin_drop_outlined, borderCol, textPrimary, textMuted, keyboardType: TextInputType.number),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildAddressField('City / District *', cityCtrl, Icons.location_city_outlined, borderCol, textPrimary, textMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _buildAddressField('State *', stateCtrl, Icons.map_outlined, borderCol, textPrimary, textMuted),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ApplePressable(
                      onTap: () async {
                        if (nameCtrl.text.trim().isEmpty ||
                            phoneCtrl.text.trim().isEmpty ||
                            addressCtrl.text.trim().isEmpty ||
                            pincodeCtrl.text.trim().isEmpty ||
                            cityCtrl.text.trim().isEmpty) {
                          AppToast.error(context, 'Please fill all required delivery details.');
                          return;
                        }

                        Navigator.of(sheetContext).pop();
                        await _processBookPayment(
                          book,
                          {
                            'fullName': nameCtrl.text.trim(),
                            'mobile': phoneCtrl.text.trim(),
                            'address': addressCtrl.text.trim(),
                            'pincode': pincodeCtrl.text.trim(),
                            'city': cityCtrl.text.trim(),
                            'state': stateCtrl.text.trim(),
                          },
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.lock_outline_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'Pay ₹${book.price.toStringAsFixed(0)} & Place Order',
                              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildAddressField(
    String label,
    TextEditingController controller,
    IconData icon,
    Color borderCol,
    Color textPrimary,
    Color textMuted, {
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: textMuted)),
        const SizedBox(height: 5),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: TextStyle(fontSize: 13, color: textPrimary),
          decoration: InputDecoration(
            isDense: true,
            prefixIcon: Icon(icon, size: 18, color: textMuted),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: borderCol)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: borderCol)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD97706), width: 1.5)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
      ],
    );
  }

  Future<void> _processBookPayment(PublicationBookModel book, Map<String, dynamic> shippingAddress) async {
    setState(() {
      _isProcessingPayment = true;
      _activePurchasingBook = book;
      _activeShippingAddress = shippingAddress;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final authState = ref.read(authStateProvider);

      final orderRes = await apiService.post('/payments/create-publication-order', data: {
        'bookTitle': book.title,
        'price': book.price,
        'deliveryFee': 0,
      });

      final data = orderRes['data'] ?? orderRes;
      final gatewayOrderId = data['id'] ?? data['orderId'];
      _pendingOrderId = gatewayOrderId?.toString();

      final razorpayKey = data['key'] ?? 'rzp_test_TTzBxGpMqc0rAD';
      final rawAmount = (book.price * 100).toInt();

      final options = {
        'key': razorpayKey,
        'amount': rawAmount,
        'name': 'Final Attempt Publications',
        'order_id': gatewayOrderId,
        'description': book.title,
        'prefill': {
          'contact': shippingAddress['mobile'] ?? '',
          'email': authState.userEmail ?? '',
        },
        'theme': {'color': '#D97706'},
      };

      if (!kIsWeb && _razorpay != null) {
        _razorpay!.open(options);
      } else {
        final simVerify = await apiService.post('/payments/verify-publication-order', data: {
          'razorpayPaymentId': 'pay_sim_${DateTime.now().millisecondsSinceEpoch}',
          'razorpayOrderId': gatewayOrderId,
          'bookTitle': book.title,
          'bookId': book.id,
          'editionYear': book.edition,
          'language': book.language,
          'price': book.price,
          'deliveryFee': 0,
          'amount': book.price,
          'shippingAddress': shippingAddress,
        });

        if (simVerify['success'] == true) {
          if (mounted) _showOrderSuccessDialog('SIMULATED_SUCCESS');
        }
      }
    } catch (e) {
      if (mounted) {
        AppToast.error(context, 'Unable to initialize payment: $e');
        setState(() => _isProcessingPayment = false);
      }
    }
  }

  void _showTrackOrderModal() {
    final trackCtrl = TextEditingController();
    bool isSearching = false;
    List<dynamic> foundOrders = [];
    String? searchMsg;

    AppleSheet.show(
      context: context,
      initialChildSize: 0.75,
      builder: (sheetContext) {
        final textPrimary = AppTheme.textPrimaryOf(sheetContext);
        final textMuted = AppTheme.textMutedOf(sheetContext);
        final borderCol = AppTheme.borderOf(sheetContext);

        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(sheetContext).viewInsets.bottom + 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.local_shipping_rounded, color: Color(0xFFEC4899), size: 22),
                          const SizedBox(width: 8),
                          Text(
                            'Track Book Order',
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: textPrimary),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.of(sheetContext).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Enter your Order ID, Payment ID, or 10-digit mobile number to track status:',
                    style: TextStyle(fontSize: 12, color: textMuted),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: trackCtrl,
                          style: TextStyle(fontSize: 13, color: textPrimary),
                          decoration: InputDecoration(
                            isDense: true,
                            hintText: 'Order ID / Mobile Number',
                            hintStyle: TextStyle(fontSize: 12, color: textMuted),
                            prefixIcon: Icon(Icons.search, size: 18, color: textMuted),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: borderCol)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: borderCol)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFEC4899), width: 1.5)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: isSearching
                            ? null
                            : () async {
                                final q = trackCtrl.text.trim();
                                if (q.isEmpty) return;

                                setModalState(() {
                                  isSearching = true;
                                  searchMsg = null;
                                  foundOrders = [];
                                });

                                try {
                                  final api = ref.read(apiServiceProvider);
                                  final res = await api.get('/payments/track-book-order?query=$q');
                                  final data = res is Map ? (res['data'] ?? res['orders'] ?? []) : res;

                                  setModalState(() {
                                    isSearching = false;
                                    if (data is List && data.isNotEmpty) {
                                      foundOrders = data;
                                    } else {
                                      searchMsg = 'No book orders found matching "$q".';
                                    }
                                  });
                                } catch (e) {
                                  setModalState(() {
                                    isSearching = false;
                                    searchMsg = 'No active shipments found for this query.';
                                  });
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEC4899),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        child: isSearching
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Track', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (searchMsg != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text(searchMsg!, style: TextStyle(color: textMuted, fontSize: 12.5)),
                      ),
                    ),
                  if (foundOrders.isNotEmpty)
                    Flexible(
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: foundOrders.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (ctx, i) {
                          final o = foundOrders[i] as Map<String, dynamic>;
                          final status = (o['deliveryStatus'] ?? o['status'] ?? 'PROCESSING').toString().toUpperCase();
                          final courier = o['courierPartner'] ?? o['courier_partner'];
                          final trackingNum = o['trackingNumber'] ?? o['tracking_number'];

                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.cardBgOf(context),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: borderCol),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        o['bookTitle']?.toString() ?? 'Publication Order',
                                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textPrimary),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: (status == 'DELIVERED' ? Colors.green : Colors.amber).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: status == 'DELIVERED' ? Colors.green : Colors.amber[800],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Order ID: ${o['orderId'] ?? o['id']}',
                                  style: TextStyle(fontSize: 11, color: textMuted),
                                ),
                                if (courier != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    'Courier: $courier (AWB: ${trackingNum ?? "Pending"})',
                                    style: const TextStyle(fontSize: 11, color: Color(0xFFD97706), fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showBookSheet(BuildContext context, PublicationBookModel book) {
    AppleSheet.show(
      context: context,
      initialChildSize: 0.65,
      builder: (sheetContext) {
        final textPrimary = AppTheme.textPrimaryOf(sheetContext);
        final textMuted = AppTheme.textMutedOf(sheetContext);

        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 64,
                    height: 84,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD97706).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFD97706).withValues(alpha: 0.25)),
                    ),
                    child: book.coverImage != null && book.coverImage!.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(9),
                            child: Image.network(book.coverImage!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.book_rounded, color: Color(0xFFD97706))),
                          )
                        : const Icon(Icons.book_rounded, color: Color(0xFFD97706), size: 32),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          book.title,
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                        const SizedBox(height: 4),
                        if (book.author != null)
                          Text(
                            'By ${book.author}',
                            style: TextStyle(fontSize: 12, color: textMuted),
                          ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Text(
                              '₹${book.price.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF10B981),
                              ),
                            ),
                            if (book.mrp > book.price) ...[
                              const SizedBox(width: 8),
                              Text(
                                '₹${book.mrp.toStringAsFixed(0)}',
                                style: TextStyle(
                                  fontSize: 13,
                                  decoration: TextDecoration.lineThrough,
                                  color: textMuted,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              if (book.description != null && book.description!.isNotEmpty) ...[
                Text(
                  'Book Overview',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  book.description!,
                  style: TextStyle(fontSize: 12.5, color: textMuted, height: 1.4),
                ),
                const SizedBox(height: 20),
              ],
              SizedBox(
                width: double.infinity,
                child: ApplePressable(
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    _startInAppOrder(book);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Order Official Book Copy',
                          style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final booksAsync = ref.watch(publicationsProvider);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final borderCol = AppTheme.borderOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppleFrostedAppBar(
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/'),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/images/favicon.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'FA Publications & Books',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.local_shipping_outlined, color: Color(0xFFD97706)),
            tooltip: 'Track Order',
            onPressed: _showTrackOrderModal,
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // Order Tracking & Search Banner
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                color: cardBg,
                child: Column(
                  children: [
                    // Track Order Quick Bar
                    ApplePressable(
                      onTap: _showTrackOrderModal,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEC4899).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFEC4899).withValues(alpha: 0.3)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.local_shipping_rounded, color: Color(0xFFEC4899), size: 20),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Track an existing physical book parcel order',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFEC4899)),
                              ),
                            ),
                            Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFFEC4899), size: 14),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Search Bar
                    Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderCol),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
                        style: TextStyle(fontSize: 13, color: textPrimary),
                        decoration: InputDecoration(
                          hintText: 'Search publication books, notes...',
                          hintStyle: TextStyle(fontSize: 12, color: textMuted),
                          prefixIcon: Icon(Icons.search, size: 18, color: textMuted),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: Icon(Icons.clear, size: 16, color: textMuted),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              // Books Catalog
              Expanded(
                child: booksAsync.when(
                  loading: () => const ListSkeleton(count: 4, itemHeight: 130),
                  error: (err, _) => Center(
                    child: Text('Unable to load book catalog: $err', style: TextStyle(color: textMuted)),
                  ),
                  data: (books) {
                    final fallbackBooks = [
                      const PublicationBookModel(
                        id: 'fa-book-1',
                        title: 'BPSC Prelims 71st Sprint Revision Compendium',
                        subtitle: 'Comprehensive 1500+ MCQs & Bihar Special Factsheet',
                        mrp: 499,
                        price: 299,
                        edition: '2025–26 Edition',
                        language: 'Bilingual (Hindi / English)',
                        pages: 340,
                      ),
                      const PublicationBookModel(
                        id: 'fa-book-2',
                        title: 'BPSC Mains GS Paper I & II Model Answers Bank',
                        subtitle: '7-Year Topic-Wise Evaluated Answer Frameworks',
                        mrp: 699,
                        price: 449,
                        edition: '2025 Edition',
                        language: 'Hindi & English Separate',
                        pages: 480,
                      ),
                      const PublicationBookModel(
                        id: 'fa-book-3',
                        title: 'Bihar Special Integrated GS & Economic Survey',
                        subtitle: 'Complete Bihar History, Geography, Budget & Govt Schemes',
                        mrp: 399,
                        price: 249,
                        edition: 'Latest Edition',
                        language: 'Bilingual',
                        pages: 260,
                      ),
                    ];

                    final activeBooks = books.isNotEmpty ? books : fallbackBooks;

                    var filtered = activeBooks.where((b) {
                      if (_searchQuery.isNotEmpty) {
                        final title = b.title.toLowerCase();
                        final sub = (b.subtitle ?? '').toLowerCase();
                        return title.contains(_searchQuery) || sub.contains(_searchQuery);
                      }
                      return true;
                    }).toList();

                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 140),
                      physics: const BouncingScrollPhysics(),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (context, idx) {
                        final book = filtered[idx];
                        return ApplePressable(
                          onTap: () => _showBookSheet(context, book),
                          scaleDown: 0.98,
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: cardBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: borderCol),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Cover / Icon
                                Container(
                                  width: 75,
                                  height: 105,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEC4899).withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFFEC4899).withValues(alpha: 0.2)),
                                  ),
                                  child: book.coverImage != null
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(10),
                                          child: Image.network(
                                            book.coverImage!,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => const Center(
                                              child: Icon(Icons.book_rounded, color: Color(0xFFEC4899), size: 36),
                                            ),
                                          ),
                                        )
                                      : const Center(
                                          child: Icon(Icons.auto_stories_rounded, color: Color(0xFFEC4899), size: 36),
                                        ),
                                ),
                                const SizedBox(width: 14),
                                // Details
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEC4899).withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          book.edition ?? 'OFFICIAL PUBLICATION',
                                          style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFFEC4899)),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        book.title,
                                        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: textPrimary),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      if (book.subtitle != null) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          book.subtitle!,
                                          style: TextStyle(fontSize: 11, color: textMuted),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                      const SizedBox(height: 10),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        crossAxisAlignment: WrapCrossAlignment.center,
                                        alignment: WrapAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                '₹${book.price.toInt()}',
                                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFFEC4899)),
                                              ),
                                              if (book.mrp > book.price) ...[
                                                const SizedBox(width: 8),
                                                Text(
                                                  '₹${book.mrp.toInt()}',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: textMuted,
                                                    decoration: TextDecoration.lineThrough,
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                          ApplePressable(
                                            onTap: () => _startInAppOrder(book),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFEC4899),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: const Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 14),
                                                  SizedBox(width: 4),
                                                  Text(
                                                    'Order Book',
                                                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
          if (_isProcessingPayment)
            Container(
              color: Colors.black.withValues(alpha: 0.4),
              child: const Center(
                child: CircularProgressIndicator(color: Color(0xFFD97706)),
              ),
            ),
        ],
      ),
    );
  }
}
