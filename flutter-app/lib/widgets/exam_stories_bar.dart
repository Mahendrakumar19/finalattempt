import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';

class ExamStoryItem {
  final String id;
  final String title;
  final String category;
  final String author;
  final String timeAgo;
  final String iconEmoji;
  final Color themeColor;
  final String contentText;
  final String actionLabel;
  final String actionRoute;

  const ExamStoryItem({
    required this.id,
    required this.title,
    required this.category,
    required this.author,
    required this.timeAgo,
    required this.iconEmoji,
    required this.themeColor,
    required this.contentText,
    required this.actionLabel,
    required this.actionRoute,
  });
}

class ExamStoriesBar extends StatefulWidget {
  const ExamStoriesBar({super.key});

  @override
  State<ExamStoriesBar> createState() => _ExamStoriesBarState();
}

class _ExamStoriesBarState extends State<ExamStoriesBar> {
  final Set<String> _viewedStories = {};

  final List<ExamStoryItem> _stories = const [
    ExamStoryItem(
      id: 'story-1',
      title: '70th BPSC Prelims Strategy & Cut-off Analysis',
      category: 'BPSC SPECIAL',
      author: 'Final Attempt Editorial',
      timeAgo: '2h ago',
      iconEmoji: '🎯',
      themeColor: AppTheme.primaryBlue,
      contentText: 'Key focus areas for 70th BPSC Prelims: Modern History of Bihar, Indian Polity & Current Affairs (Last 12 Months).\n\nPractice 150+ full mocks on Final Attempt Pass Pro to boost speed and accuracy!',
      actionLabel: 'Explore BPSC Pass Pro',
      actionRoute: '/test-series',
    ),
    ExamStoryItem(
      id: 'story-2',
      title: 'Daily Current Affairs — Today\'s Must Read Articles',
      category: 'DAILY CURRENT AFFAIRS',
      author: 'CA Desk',
      timeAgo: '4h ago',
      iconEmoji: '📰',
      themeColor: Color(0xFF10B981),
      contentText: 'Today\'s key topics for Prelims & Mains:\n1. RBI Policy Interest Rates update\n2. G20 Renewable Energy Summit takeaways\n3. Bihar Economic Survey Highlights.\n\nRead full edition with memory keypoints!',
      actionLabel: 'Read Today\'s CA',
      actionRoute: '/current-affairs',
    ),
    ExamStoryItem(
      id: 'story-3',
      title: 'UPSC Mains GS-II Answer Writing Blueprint',
      category: 'MAINS TIP',
      author: 'IAS Toppers Team',
      timeAgo: '6h ago',
      iconEmoji: '📝',
      themeColor: Color(0xFF8B5CF6),
      contentText: 'Structure your GS-II answers efficiently:\n• Introduction with Constitutional Article / Case Law\n• 3-4 distinct subheadings with bullet points\n• Way Forward & Balanced Conclusion.\n\nPractice official PYQs with model solutions!',
      actionLabel: 'Practice PYQ Papers',
      actionRoute: '/pyq',
    ),
    ExamStoryItem(
      id: 'story-4',
      title: 'Special 50% Discount on Final Attempt Pass',
      category: 'PASS OFFER',
      author: 'Pass Desk',
      timeAgo: '1d ago',
      iconEmoji: '⚡',
      themeColor: Color(0xFFF59E0B),
      contentText: 'Unlock 500+ Mock Tests & Bihar Exam Test Series with Final Attempt Pass Pro!\n\nIncludes All India Rank Predictor, Detailed Solutions & Bilingual Hindi & English PDFs.',
      actionLabel: 'Get Pass Pro Now',
      actionRoute: '/test-series',
    ),
  ];

  void _openStory(BuildContext context, int initialIndex) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'StoryViewer',
      barrierColor: Colors.black.withValues(alpha: 0.92),
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (context, anim1, anim2) {
        return _StoryViewerDialog(
          stories: _stories,
          initialIndex: initialIndex,
          onStoryViewed: (id) {
            setState(() {
              _viewedStories.add(id);
            });
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Exam Stories & Updates',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textDarkPrimary),
              ),
              Text(
                'Tap to view',
                style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 84,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _stories.length,
            itemBuilder: (context, index) {
              final story = _stories[index];
              final isViewed = _viewedStories.contains(story.id);

              return GestureDetector(
                onTap: () => _openStory(context, index),
                child: Padding(
                  padding: const EdgeInsets.only(right: 14),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(2.5),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: isViewed
                              ? const LinearGradient(colors: [Colors.grey, Colors.grey])
                              : LinearGradient(
                                  colors: [story.themeColor, story.themeColor.withValues(alpha: 0.6)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                        ),
                        child: Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Theme.of(context).brightness == Brightness.dark
                                ? const Color(0xFF1E293B)
                                : Colors.white,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: Center(
                            child: Text(
                              story.iconEmoji,
                              style: const TextStyle(fontSize: 22),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      SizedBox(
                        width: 64,
                        child: Text(
                          story.category,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: isViewed ? FontWeight.normal : FontWeight.bold,
                            color: isViewed ? AppTheme.textMuted : AppTheme.textDarkPrimary,
                          ),
                        ),
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
}

class _StoryViewerDialog extends StatefulWidget {
  final List<ExamStoryItem> stories;
  final int initialIndex;
  final Function(String id) onStoryViewed;

  const _StoryViewerDialog({
    required this.stories,
    required this.initialIndex,
    required this.onStoryViewed,
  });

  @override
  State<_StoryViewerDialog> createState() => _StoryViewerDialogState();
}

class _StoryViewerDialogState extends State<_StoryViewerDialog> with SingleTickerProviderStateMixin {
  late int _currentIndex;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    );

    _animController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _nextStory();
      }
    });

    _startCurrentStory();
  }

  void _startCurrentStory() {
    widget.onStoryViewed(widget.stories[_currentIndex].id);
    _animController.forward(from: 0.0);
  }

  void _nextStory() {
    if (_currentIndex < widget.stories.length - 1) {
      setState(() {
        _currentIndex++;
      });
      _startCurrentStory();
    } else {
      Navigator.of(context).pop();
    }
  }

  void _previousStory() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
      });
      _startCurrentStory();
    } else {
      _animController.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final story = widget.stories[_currentIndex];

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: Stack(
          children: [
            // Story Content Card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      story.themeColor.withValues(alpha: 0.95),
                      const Color(0xFF0F172A),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Header info
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  story.category,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Text(
                                story.timeAgo,
                                style: const TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Text(story.iconEmoji, style: const TextStyle(fontSize: 32)),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  story.title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'By ${story.author}',
                            style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),

                      // Body text
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                        ),
                        child: Text(
                          story.contentText,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            height: 1.5,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ),

                      // Bottom CTA Button
                      ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          context.push(story.actionRoute);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: story.themeColor,
                          minimumSize: const Size(double.infinity, 48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        child: Text(story.actionLabel),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Top Animated Progress Indicators
            Positioned(
              top: 8,
              left: 24,
              right: 24,
              child: Row(
                children: List.generate(widget.stories.length, (index) {
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: AnimatedBuilder(
                        animation: _animController,
                        builder: (context, child) {
                          double progress = 0.0;
                          if (index < _currentIndex) {
                            progress = 1.0;
                          } else if (index == _currentIndex) {
                            progress = _animController.value;
                          }
                          return LinearProgressIndicator(
                            value: progress,
                            backgroundColor: Colors.white30,
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                            minHeight: 3,
                          );
                        },
                      ),
                    ),
                  );
                }),
              ),
            ),

            // Close button top-right
            Positioned(
              top: 36,
              right: 24,
              child: IconButton(
                icon: const Icon(Icons.close_rounded, color: Colors.white, size: 26),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),

            // Left & Right tap gesture detectors for story switching
            Positioned.fill(
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.translucent,
                      onTap: _previousStory,
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.translucent,
                      onTap: _nextStory,
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
