import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/course_model.dart';
import '../core/theme/app_theme.dart';

class CourseCard extends StatelessWidget {
  final CourseModel course;
  final VoidCallback onTap;

  const CourseCard({super.key, required this.course, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 200,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: course.thumbnail != null && course.thumbnail!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: course.thumbnail!.startsWith('http')
                          ? course.thumbnail!
                          : 'https://finalattemptias.com/${course.thumbnail}',
                      width: double.infinity,
                      height: 110,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => _PlaceholderImage(),
                    )
                  : _PlaceholderImage(),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (course.category != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.amber.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(course.category!,
                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppTheme.amber, letterSpacing: 0.5),
                      ),
                    ),
                  const SizedBox(height: 6),
                  Text(course.title,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.group_rounded, size: 12, color: AppTheme.textMuted),
                      const SizedBox(width: 3),
                      Text('${course.enrolledCount} enrolled',
                        style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
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
  }
}

class _PlaceholderImage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 110,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
        ),
      ),
      child: const Center(
        child: Icon(Icons.school_rounded, color: AppTheme.amber, size: 36),
      ),
    );
  }
}
