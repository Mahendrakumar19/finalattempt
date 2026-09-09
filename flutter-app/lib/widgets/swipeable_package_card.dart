import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';

class SwipeablePackageItem {
  final String id;
  final String title;
  final String category;
  final int totalTests;
  final int freeTests;
  final double rating;
  final int originalPrice;
  final int discountPrice;
  final List<String> highlights;
  final String badgeText;
  final Color themeColor;

  const SwipeablePackageItem({
    required this.id,
    required this.title,
    required this.category,
    required this.totalTests,
    required this.freeTests,
    required this.rating,
    required this.originalPrice,
    required this.discountPrice,
    required this.highlights,
    required this.badgeText,
    required this.themeColor,
  });
}

class SwipeablePackageDeck extends StatefulWidget {
  final List<SwipeablePackageItem> items;
  final Function(SwipeablePackageItem, bool isLiked)? onSwiped;

  const SwipeablePackageDeck({
    super.key,
    required this.items,
    this.onSwiped,
  });

  @override
  State<SwipeablePackageDeck> createState() => _SwipeablePackageDeckState();
}

class _SwipeablePackageDeckState extends State<SwipeablePackageDeck> with SingleTickerProviderStateMixin {
  late List<SwipeablePackageItem> _deck;
  Offset _dragOffset = Offset.zero;
  double _angle = 0.0;
  bool _isDragging = false;
  late AnimationController _animController;
  late Animation<Offset> _swipeAnimation;

  @override
  void initState() {
    super.initState();
    _deck = List.from(widget.items);
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _animController.addListener(() {
      setState(() {
        _dragOffset = _swipeAnimation.value;
        _angle = (_dragOffset.dx / 300) * (pi / 12);
      });
    });
    _animController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _onSwipeCompleted();
      }
    });
  }

  @override
  void didUpdateWidget(covariant SwipeablePackageDeck oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.items != oldWidget.items && _deck.isEmpty) {
      setState(() {
        _deck = List.from(widget.items);
      });
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _onSwipeCompleted() {
    if (_deck.isNotEmpty) {
      final swipedItem = _deck.removeAt(0);
      final isLiked = _dragOffset.dx > 0;
      widget.onSwiped?.call(swipedItem, isLiked);
    }
    setState(() {
      _dragOffset = Offset.zero;
      _angle = 0.0;
    });
    _animController.reset();
  }

  void _swipeCard(bool swipeRight) {
    if (_deck.isEmpty || _animController.isAnimating) return;
    final targetX = swipeRight ? 500.0 : -500.0;
    _swipeAnimation = Tween<Offset>(
      begin: _dragOffset,
      end: Offset(targetX, _dragOffset.dy),
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _animController.forward(from: 0.0);
  }

  void _resetDeck() {
    setState(() {
      _deck = List.from(widget.items);
      _dragOffset = Offset.zero;
      _angle = 0.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_deck.isEmpty) {
      return Container(
        height: 380,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppTheme.cardBgOf(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppTheme.borderOf(context)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.style_rounded, size: 36, color: AppTheme.primaryBlue),
            ),
            const SizedBox(height: 16),
            Text(
              'All Featured Packages Swiped!',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimaryOf(context),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Explore all test series or reload the deck to review options.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _resetDeck,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Reload Card Deck'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: 390,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Underneath card preview (Card #2 if available)
              if (_deck.length > 1)
                Positioned.fill(
                  child: Transform.scale(
                    scale: 0.94,
                    child: Transform.translate(
                      offset: const Offset(0, 16),
                      child: Opacity(
                        opacity: 0.7,
                        child: _PackageCardWidget(item: _deck[1]),
                      ),
                    ),
                  ),
                ),

              // Top card (Card #1 - Draggable & Swipeable)
              Positioned.fill(
                child: GestureDetector(
                  onPanStart: (_) {
                    setState(() {
                      _isDragging = true;
                    });
                  },
                  onPanUpdate: (details) {
                    setState(() {
                      _dragOffset += details.delta;
                      _angle = (_dragOffset.dx / 300) * (pi / 12);
                    });
                  },
                  onPanEnd: (details) {
                    setState(() {
                      _isDragging = false;
                    });
                    if (_dragOffset.dx.abs() > 100) {
                      _swipeCard(_dragOffset.dx > 0);
                    } else {
                      _swipeAnimation = Tween<Offset>(
                        begin: _dragOffset,
                        end: Offset.zero,
                      ).animate(CurvedAnimation(parent: _animController, curve: Curves.elasticOut));
                      _animController.forward(from: 0.0);
                    }
                  },
                  child: Transform.translate(
                    offset: _dragOffset,
                    child: Transform.rotate(
                      angle: _angle,
                      child: Stack(
                        children: [
                          _PackageCardWidget(item: _deck.first, isDragging: _isDragging),
                          // Swipe Right Like Indicator
                          if (_dragOffset.dx > 20)
                            Positioned(
                              top: 20,
                              left: 20,
                              child: Transform.rotate(
                                angle: -pi / 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.green, width: 2.5),
                                    borderRadius: BorderRadius.circular(8),
                                    color: Colors.green.withValues(alpha: 0.15),
                                  ),
                                  child: const Text(
                                    'SELECT PASS',
                                    style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1),
                                  ),
                                ),
                              ),
                            ),
                          // Swipe Left Skip Indicator
                          if (_dragOffset.dx < -20)
                            Positioned(
                              top: 20,
                              right: 20,
                              child: Transform.rotate(
                                angle: pi / 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.red, width: 2.5),
                                    borderRadius: BorderRadius.circular(8),
                                    color: Colors.red.withValues(alpha: 0.15),
                                  ),
                                  child: const Text(
                                    'SKIP',
                                    style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Action controls bar
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Skip button
            IconButton.filledTonal(
              onPressed: () => _swipeCard(false),
              icon: const Icon(Icons.close_rounded, color: Colors.redAccent),
              style: IconButton.styleFrom(
                backgroundColor: Colors.red.withValues(alpha: 0.1),
                padding: const EdgeInsets.all(12),
              ),
            ),
            const SizedBox(width: 16),
            // Reset deck button
            IconButton.filledTonal(
              onPressed: _resetDeck,
              icon: const Icon(Icons.replay_rounded, color: AppTheme.primaryBlue),
              style: IconButton.styleFrom(
                backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
                padding: const EdgeInsets.all(10),
              ),
            ),
            const SizedBox(width: 16),
            // Select Pass button
            IconButton.filledTonal(
              onPressed: () => _swipeCard(true),
              icon: const Icon(Icons.check_rounded, color: Colors.green),
              style: IconButton.styleFrom(
                backgroundColor: Colors.green.withValues(alpha: 0.1),
                padding: const EdgeInsets.all(12),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _PackageCardWidget extends StatelessWidget {
  final SwipeablePackageItem item;
  final bool isDragging;

  const _PackageCardWidget({required this.item, this.isDragging = false});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final discountPercent = (((item.originalPrice - item.discountPrice) / item.originalPrice) * 100).round();

    return Material(
      color: Colors.transparent,
      clipBehavior: Clip.antiAlias,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.cardBgOf(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppTheme.borderOf(context)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDragging ? (isDark ? 0.45 : 0.15) : (isDark ? 0.3 : 0.08)),
              blurRadius: isDragging ? 24 : 16,
              offset: Offset(0, isDragging ? 10 : 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category & Badge row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: item.themeColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        item.category.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: item.themeColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 16),
                        const SizedBox(width: 3),
                        Text(
                          '${item.rating}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimaryOf(context),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Title
                Text(
                  item.title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimaryOf(context),
                    height: 1.25,
                  ),
                ),

                const SizedBox(height: 8),

                // Highlights pills
                Row(
                  children: [
                    _FeaturePill(icon: Icons.assignment_outlined, text: '${item.totalTests} Mocks'),
                    const SizedBox(width: 8),
                    _FeaturePill(icon: Icons.lock_open_rounded, text: '${item.freeTests} Free Mocks'),
                  ],
                ),

                const SizedBox(height: 14),

                // Highlights checklist
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: item.highlights.map((h) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle_rounded, color: AppTheme.primaryOf(context), size: 15),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            h,
                            style: TextStyle(fontSize: 12, color: AppTheme.textMutedOf(context), height: 1.2),
                          ),
                        ),
                      ],
                    ),
                  )).toList(),
                ),
              ],
            ),

            // Pricing & CTA Footer
            Container(
              padding: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: AppTheme.borderOf(context))),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            '₹${item.originalPrice}',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMutedOf(context),
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '$discountPercent% OFF',
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '₹${item.discountPrice}',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryOf(context),
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () {
                      context.push('/test-series/${item.id}');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryOf(context),
                      foregroundColor: Theme.of(context).brightness == Brightness.dark ? Colors.black : Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    child: const Text('Explore Pass'),
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

class _FeaturePill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _FeaturePill({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final primaryCol = AppTheme.primaryOf(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: primaryCol.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: primaryCol),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: primaryCol),
          ),
        ],
      ),
    );
  }
}
