import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/storage_service.dart';

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier(ref.read(storageServiceProvider));
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final StorageService _storage;
  static const _keyThemeMode = 'theme_mode_preference';

  ThemeModeNotifier(this._storage) : super(ThemeMode.dark) {
    _loadTheme();
  }

  void _loadTheme() {
    final saved = _storage.prefs.getString(_keyThemeMode);
    if (saved == 'light') {
      state = ThemeMode.light;
    } else if (saved == 'dark') {
      state = ThemeMode.dark;
    } else if (saved == 'system') {
      state = ThemeMode.system;
    } else {
      state = ThemeMode.dark; // Default to dark theme
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    await _storage.prefs.setString(_keyThemeMode, mode.name);
  }

  void toggleTheme() {
    if (state == ThemeMode.dark) {
      setThemeMode(ThemeMode.light);
    } else {
      setThemeMode(ThemeMode.dark);
    }
  }
}
