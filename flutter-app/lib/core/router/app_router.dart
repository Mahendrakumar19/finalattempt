import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../screens/splash/splash_screen.dart';
import '../../screens/home/home_screen.dart';
import '../../screens/courses/courses_screen.dart';
import '../../screens/courses/course_detail_screen.dart';
import '../../screens/pyq/pyq_screen.dart';
import '../../screens/current_affairs/current_affairs_screen.dart';
import '../../screens/current_affairs/ca_article_screen.dart';
import '../../screens/blog/blog_screen.dart';
import '../../screens/blog/blog_detail_screen.dart';
import '../../screens/faculty/faculty_screen.dart';
import '../../screens/achievers/achievers_screen.dart';
import '../../screens/about/about_screen.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/auth/register_screen.dart';
import '../../screens/student/dashboard_screen.dart';
import '../../screens/student/profile_screen.dart';
import '../../widgets/app_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isLoggedIn = authState.isLoggedIn;
      final isOnAuth = state.matchedLocation.startsWith('/login') ||
          state.matchedLocation.startsWith('/register');
      final isOnStudent = state.matchedLocation.startsWith('/student');

      if (isOnStudent && !isLoggedIn) return '/login';
      if (isOnAuth && isLoggedIn) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/courses', builder: (_, __) => const CoursesScreen()),
          GoRoute(path: '/pyq', builder: (_, __) => const PYQScreen()),
          GoRoute(path: '/current-affairs', builder: (_, __) => const CurrentAffairsScreen()),
          GoRoute(path: '/blog', builder: (_, __) => const BlogScreen()),
        ],
      ),
      GoRoute(
        path: '/courses/:id',
        builder: (_, state) => CourseDetailScreen(courseId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/current-affairs/article/:slug',
        builder: (_, state) => CAArticleScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/blog/:id',
        builder: (_, state) => BlogDetailScreen(blogId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/faculty', builder: (_, __) => const FacultyScreen()),
      GoRoute(path: '/achievers', builder: (_, __) => const AchieversScreen()),
      GoRoute(path: '/about', builder: (_, __) => const AboutScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/student/dashboard', builder: (_, __) => const StudentDashboardScreen()),
      GoRoute(path: '/student/profile', builder: (_, __) => const StudentProfileScreen()),
    ],
  );
});
