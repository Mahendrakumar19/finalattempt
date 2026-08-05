import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';

class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  static const _tabs = [
    (path: '/', icon: Icons.home_rounded, label: 'Home'),
    (path: '/courses', icon: Icons.school_rounded, label: 'Courses'),
    (path: '/current-affairs', icon: Icons.newspaper_rounded, label: 'Current Affairs'),
    (path: '/pyq', icon: Icons.library_books_rounded, label: 'PYQs'),
    (path: '/blog', icon: Icons.article_rounded, label: 'Blog'),
  ];

  int _selectedIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
      if (i == 0 && loc == '/') return 0;
      if (i > 0 && loc.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _selectedIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          border: const Border(top: BorderSide(color: AppTheme.borderColor)),
        ),
        child: NavigationBar(
          selectedIndex: idx,
          onDestinationSelected: (i) => context.go(_tabs[i].path),
          destinations: _tabs
              .map((t) => NavigationDestination(
                    icon: Icon(t.icon),
                    label: t.label,
                  ))
              .toList(),
        ),
      ),
    );
  }
}
