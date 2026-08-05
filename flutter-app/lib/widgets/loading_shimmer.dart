import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../core/theme/app_theme.dart';

class LoadingShimmer extends StatelessWidget {
  final double height;
  final double? width;
  final BorderRadius? borderRadius;

  const LoadingShimmer({
    super.key,
    required this.height,
    this.width,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Shimmer.fromColors(
        baseColor: AppTheme.bgCard,
        highlightColor: AppTheme.bgCardLight,
        child: Container(
          height: height,
          width: width ?? double.infinity,
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: borderRadius ?? BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

class LoadingGrid extends StatelessWidget {
  final int count;
  const LoadingGrid({super.key, this.count = 6});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      childAspectRatio: 1.4,
      children: List.generate(count, (_) =>
        Shimmer.fromColors(
          baseColor: AppTheme.bgCard,
          highlightColor: AppTheme.bgCardLight,
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ),
    );
  }
}
