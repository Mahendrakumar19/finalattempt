import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';

class LiveClassItem {
  final String id;
  final String title;
  final String instructor;
  final String targetExam;
  final String time;
  final bool isLiveNow;
  final Color themeColor;

  const LiveClassItem({
    required this.id,
    required this.title,
    required this.instructor,
    required this.targetExam,
    required this.time,
    required this.isLiveNow,
    required this.themeColor,
  });
}

class LiveClassesCarousel extends StatefulWidget {
  const LiveClassesCarousel({super.key});

  @override
  State<LiveClassesCarousel> createState() => _LiveClassesCarouselState();
}

class _LiveClassesCarouselState extends State<LiveClassesCarousel> {
  final Set<String> _reminders = {};

  final List<LiveClassItem> _classes = const [
    LiveClassItem(
      id: 'live-1',
      title: '70th BPSC Special: Ancient History of Bihar Top 50 MCQ Discussion',
      instructor: 'Dr. Anand Verma',
      targetExam: '70th BPSC Prelims',
      time: 'LIVE NOW',
      isLiveNow: true,
      themeColor: AppTheme.primaryBlue,
    ),
    LiveClassItem(
      id: 'live-2',
      title: 'UPSC Mains GS-III Economy & Budget Masterclass 2025',
      instructor: 'Prof. S. K. Roy',
      targetExam: 'UPSC IAS Mains',
      time: 'Today • 6:00 PM',
      isLiveNow: false,
      themeColor: Color(0xFF10B981),
    ),
    LiveClassItem(
      id: 'live-3',
      title: 'Bihar Daroga SI Quantitative Aptitude Shortcut Tricks',
      instructor: 'Vikram Singh',
      targetExam: 'Bihar Daroga SI',
      time: 'Today • 8:30 PM',
      isLiveNow: false,
      themeColor: Color(0xFFF59E0B),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SuperCoaching Live Classes',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDarkPrimary),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Join top educators for live interactive sessions',
                    style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                ],
              ),
              TextButton(
                onPressed: () => context.push('/courses'),
                child: const Text('All Courses', style: TextStyle(color: AppTheme.primaryBlue, fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 165,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _classes.length,
            itemBuilder: (context, index) {
              final item = _classes[index];
              final isReminded = _reminders.contains(item.id);

              return Container(
                width: 280,
                margin: const EdgeInsets.only(right: 14),
                decoration: BoxDecoration(
                  color: AppTheme.cardBgOf(context),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderOf(context)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: item.isLiveNow ? Colors.red.withValues(alpha: 0.12) : AppTheme.primaryBlue.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Row(
                                  children: [
                                    if (item.isLiveNow)
                                      Container(
                                        width: 6,
                                        height: 6,
                                        margin: const EdgeInsets.only(right: 5),
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.red,
                                        ),
                                      ),
                                    Text(
                                      item.time,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: item.isLiveNow ? Colors.red : AppTheme.primaryBlue,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                item.targetExam,
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            item.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimaryOf(context),
                              height: 1.25,
                            ),
                          ),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 12,
                                backgroundColor: item.themeColor.withValues(alpha: 0.15),
                                child: Text(
                                  item.instructor[0],
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: item.themeColor),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                item.instructor,
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                          if (item.isLiveNow)
                            ElevatedButton(
                              onPressed: () {
                                context.push('/courses');
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Join Live', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            )
                          else
                            IconButton(
                              icon: Icon(
                                isReminded ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
                                color: isReminded ? AppTheme.primaryBlue : AppTheme.textMuted,
                                size: 20,
                              ),
                              onPressed: () {
                                setState(() {
                                  if (isReminded) {
                                    _reminders.remove(item.id);
                                  } else {
                                    _reminders.add(item.id);
                                  }
                                });
                                ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(isReminded ? 'Reminder removed' : 'Reminder set for ${item.title}'),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              },
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
}
