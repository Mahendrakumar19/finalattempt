import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/storage_service.dart';

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier(ref.read(storageServiceProvider));
});

final appLanguageProvider = StateNotifierProvider<AppLanguageNotifier, String>((ref) {
  return AppLanguageNotifier(ref.read(storageServiceProvider));
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final StorageService _storage;
  static const _keyThemeMode = 'theme_mode_preference';

  ThemeModeNotifier(this._storage) : super(ThemeMode.light) {
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
      state = ThemeMode.light; // Default to light theme matching visual design reference
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

class AppLanguageNotifier extends StateNotifier<String> {
  final StorageService _storage;
  static const _keyLanguage = 'app_language_preference';

  AppLanguageNotifier(this._storage) : super('en') {
    _loadLanguage();
  }

  void _loadLanguage() {
    final saved = _storage.prefs.getString(_keyLanguage);
    if (saved != null && saved.isNotEmpty) {
      state = saved;
    } else {
      state = 'en';
    }
  }

  Future<void> setLanguage(String langCode) async {
    state = langCode;
    await _storage.prefs.setString(_keyLanguage, langCode);
  }
}
