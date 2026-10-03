import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/student_service.dart';
import '../../core/theme/app_theme.dart';

class CourseViewerScreen extends ConsumerStatefulWidget {
  final String courseId;
  final String courseTitle;

  const CourseViewerScreen({
    super.key,
    required this.courseId,
    required this.courseTitle,
  });

  @override
  ConsumerState<CourseViewerScreen> createState() => _CourseViewerScreenState();
}

class _CourseViewerScreenState extends ConsumerState<CourseViewerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;
  List<dynamic> _sections = [];
  List<dynamic> _quizzes = [];
  List<dynamic> _assignments = [];
  Map<String, dynamic>? _activeLesson;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadCourseData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadCourseData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final service = ref.read(studentServiceProvider);

    try {
      final data = await service.getCourseDetails(widget.courseId);
      final quizzes = await service.getCourseQuizzes(widget.courseId);
      final assignments = await service.getCourseAssignments(widget.courseId);

      if (mounted) {
        if (data != null) {
          setState(() {
            _sections = data['sections'] ?? [];
            _quizzes = quizzes;
            _assignments = assignments;
            _isLoading = false;

            // Pick first unlocked lesson as initial playing lesson
            for (var sec in _sections) {
              final lessons = sec['lessons'] as List<dynamic>? ?? [];
              for (var les in lessons) {
                if (les['isLocked'] != true) {
                  _activeLesson = les;
                  break;
                }
              }
              if (_activeLesson != null) break;
            }
          });
        } else {
          setState(() {
            _error = 'Failed to load course details from server.';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Error connecting to service: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _playLesson(Map<String, dynamic> lesson) {
    if (lesson['isLocked'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('This lesson is locked. Please complete prior lessons.'),
          backgroundColor: Colors.amber,
        ),
      );
      return;
    }

    setState(() {
      _activeLesson = lesson;
    });

    // Save lesson progress
    ref.read(studentServiceProvider).saveProgress(widget.courseId, lesson['id'].toString());
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0,
        title: Text(
          widget.courseTitle,
          style: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue))
          : _error != null
              ? _buildErrorWidget()
              : Column(
                  children: [
                    // Active Video Player Banner / Container
                    _buildVideoContainer(),
                    
                    // Course Navigation Tabs
                    Container(
                      color: cardBg,
                      child: TabBar(
                        controller: _tabController,
                        isScrollable: true,
                        indicatorColor: AppTheme.primaryBlue,
                        labelColor: AppTheme.primaryBlue,
                        unselectedLabelColor: AppTheme.textMuted,
                        tabs: [
                          Tab(text: 'Curriculum (${_sections.length})'),
                          const Tab(text: 'Live Classes'),
                          Tab(text: 'Quizzes (${_quizzes.length})'),
                          Tab(text: 'Mains Assignments (${_assignments.length})'),
                        ],
                      ),
                    ),

                    // Tab View Contents
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildCurriculumTab(),
                          _buildLiveClassesTab(),
                          _buildQuizzesTab(),
                          _buildAssignmentsTab(),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 50, color: AppTheme.error),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Unknown error',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _loadCourseData,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryBlue),
              child: const Text('Try Again', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoContainer() {
    if (_activeLesson == null) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: Container(
          color: Colors.black,
          child: const Center(
            child: Text(
              'Select a lesson to begin learning',
              style: TextStyle(color: Colors.white60, fontSize: 14),
            ),
          ),
        ),
      );
    }

    final title = _activeLesson!['title']?.toString() ?? 'Lesson';
    final videoUrl = _activeLesson!['videoUrl']?.toString() ?? _activeLesson!['recordingUrl']?.toString();
    final isLive = _activeLesson!['type'] == 'live';

    return Container(
      width: double.infinity,
      color: Colors.black,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Video background simulation/thumbnail
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blueGrey.shade900, Colors.black],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          isLive ? Icons.sensors : Icons.play_circle_fill,
                          size: 64,
                          color: isLive ? Colors.redAccent : AppTheme.primaryBlue,
                        ),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            title,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          videoUrl != null ? 'Tap to stream content' : 'No direct video stream linked',
                          style: const TextStyle(color: Colors.white54, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ),
                if (isLive)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.redAccent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.circle, size: 8, color: Colors.white),
                          SizedBox(width: 6),
                          Text('LIVE SESSION', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Text(
                    _activeLesson!['duration']?.toString() ?? 'Lecture',
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurriculumTab() {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    if (_sections.isEmpty) {
      return const Center(
        child: Text('No curriculum published for this course yet.', style: TextStyle(color: AppTheme.textMuted)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _sections.length,
      itemBuilder: (context, sIndex) {
        final sec = _sections[sIndex];
        final lessons = sec['lessons'] as List<dynamic>? ?? [];

        return Card(
          color: cardBg,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ExpansionTile(
            initiallyExpanded: sIndex == 0,
            iconColor: AppTheme.primaryBlue,
            collapsedIconColor: AppTheme.textMuted,
            title: Text(
              sec['title']?.toString() ?? 'Chapter ${sIndex + 1}',
              style: TextStyle(color: textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            subtitle: Text(
              '${lessons.length} items',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
            children: lessons.map((les) {
              final isSelected = _activeLesson != null && _activeLesson!['id'] == les['id'];
              final isLocked = les['isLocked'] == true;
              final isLive = les['type'] == 'live';

              return ListTile(
                selected: isSelected,
                selectedTileColor: AppTheme.primaryBlue.withValues(alpha: 0.15),
                leading: Icon(
                  isLocked
                      ? Icons.lock
                      : isLive
                          ? Icons.sensors
                          : Icons.play_circle_outline,
                  color: isLocked
                      ? Colors.grey
                      : isLive
                          ? Colors.redAccent
                          : AppTheme.primaryBlue,
                ),
                title: Text(
                  les['title']?.toString() ?? 'Untitled Lesson',
                  style: TextStyle(
                    color: isLocked ? AppTheme.textMuted : textPrimary,
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                subtitle: Text(
                  les['duration']?.toString() ?? (isLive ? 'Live Stream' : 'Video'),
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                ),
                trailing: isSelected
                    ? const Icon(Icons.volume_up, color: AppTheme.primaryBlue, size: 18)
                    : null,
                onTap: () => _playLesson(les),
              );
            }).toList(),
          ),
        );
      },
    );
  }

  Widget _buildLiveClassesTab() {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    final liveLessons = <Map<String, dynamic>>[];
    for (var sec in _sections) {
      final lessons = sec['lessons'] as List<dynamic>? ?? [];
      for (var les in lessons) {
        if (les['type'] == 'live') {
          liveLessons.add(les as Map<String, dynamic>);
        }
      }
    }

    if (liveLessons.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.sensors_off, size: 48, color: Colors.grey.shade600),
              const SizedBox(height: 12),
              Text('No Live Classes Scheduled Right Now', style: TextStyle(color: textPrimary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text(
                'Check back during batch class hours or view recorded lectures in the curriculum tab.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: liveLessons.length,
      itemBuilder: (context, index) {
        final les = liveLessons[index];
        return Card(
          color: cardBg,
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const CircleAvatar(
              backgroundColor: Colors.redAccent,
              child: Icon(Icons.live_tv, color: Colors.white, size: 20),
            ),
            title: Text(les['title']?.toString() ?? 'Live Session', style: TextStyle(color: textPrimary, fontWeight: FontWeight.bold)),
            subtitle: Text(les['liveScheduledAt']?.toString() ?? 'Scheduled Live', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
            trailing: ElevatedButton(
              onPressed: () => _playLesson(les),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
              child: const Text('Join Now', style: TextStyle(color: Colors.white, fontSize: 12)),
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuizzesTab() {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    if (_quizzes.isEmpty) {
      return const Center(
        child: Text('No quizzes assigned to this course.', style: TextStyle(color: AppTheme.textMuted)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _quizzes.length,
      itemBuilder: (context, index) {
        final quiz = _quizzes[index];
        return Card(
          color: cardBg,
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const Icon(Icons.quiz, color: AppTheme.primaryBlue, size: 28),
            title: Text(quiz['title']?.toString() ?? 'Practice Quiz', style: TextStyle(color: textPrimary, fontWeight: FontWeight.bold)),
            subtitle: Text('${quiz['totalQuestions'] ?? 10} Questions • ${quiz['duration'] ?? '15 mins'}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
            trailing: ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Starting ${quiz['title']}...')),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryBlue),
              child: const Text('Start Quiz', style: TextStyle(color: Colors.white, fontSize: 12)),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAssignmentsTab() {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    if (_assignments.isEmpty) {
      return const Center(
        child: Text('No Mains assignments uploaded for this course.', style: TextStyle(color: AppTheme.textMuted)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _assignments.length,
      itemBuilder: (context, index) {
        final assign = _assignments[index];
        return Card(
          color: cardBg,
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const Icon(Icons.assignment, color: Colors.amber, size: 28),
            title: Text(assign['title']?.toString() ?? 'Mains Answer Copy', style: TextStyle(color: textPrimary, fontWeight: FontWeight.bold)),
            subtitle: Text('Due: ${assign['dueDate'] ?? 'Open Submission'}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
            trailing: OutlinedButton.icon(
              icon: const Icon(Icons.upload_file, size: 16, color: AppTheme.primaryBlue),
              label: const Text('Submit', style: TextStyle(color: AppTheme.primaryBlue, fontSize: 12)),
              onPressed: () => _showUploadDialog(assign['id']?.toString() ?? ''),
            ),
          ),
        );
      },
    );
  }

  void _showUploadDialog(String assignmentId) {
    final textController = TextEditingController();
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: cardBg,
        title: Text('Submit Mains Answer Sheet', style: TextStyle(color: textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Paste your scanned PDF drive link or file URL below for evaluation:',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              style: TextStyle(color: textPrimary),
              decoration: const InputDecoration(
                hintText: 'https://drive.google.com/file/d/...',
                hintStyle: TextStyle(color: AppTheme.textMuted),
                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: AppTheme.borderDark)),
                focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: AppTheme.primaryBlue)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              final url = textController.text.trim();
              if (url.isEmpty) return;

              Navigator.of(dialogContext).pop();
              final res = await ref.read(studentServiceProvider).submitMainsAnswer(
                assignmentId: assignmentId,
                fileUrl: url,
              );

              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(res != null ? 'Answer sheet submitted successfully!' : 'Submission saved.'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryBlue),
            child: const Text('Submit PDF', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
