import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError('Override in ProviderScope');
});

final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) async {
  return SharedPreferences.getInstance();
});

class StorageService {
  final SharedPreferences _prefs;

  StorageService(this._prefs);

  SharedPreferences get prefs => _prefs;

  static const _keyToken = 'auth_token';
  static const _keyRefreshToken = 'refresh_token';
  static const _keyUserId = 'user_id';
  static const _keyUserName = 'user_name';
  static const _keyUserEmail = 'user_email';
  static const _keyUserRole = 'user_role';

  Future<void> saveToken(String token) async {
    await _prefs.setString(_keyToken, token);
  }

  Future<String?> getToken() async => _prefs.getString(_keyToken);

  Future<void> saveRefreshToken(String token) async {
    await _prefs.setString(_keyRefreshToken, token);
  }

  Future<String?> getRefreshToken() async => _prefs.getString(_keyRefreshToken);

  Future<void> saveUserSession({
    required String userId,
    required String name,
    required String email,
    required String role,
  }) async {
    await _prefs.setString(_keyUserId, userId);
    await _prefs.setString(_keyUserName, name);
    await _prefs.setString(_keyUserEmail, email);
    await _prefs.setString(_keyUserRole, role);
  }

  String? getUserId() => _prefs.getString(_keyUserId);
  String? getUserName() => _prefs.getString(_keyUserName);
  String? getUserEmail() => _prefs.getString(_keyUserEmail);
  String? getUserRole() => _prefs.getString(_keyUserRole);

  bool isLoggedIn() {
    final token = _prefs.getString(_keyToken);
    return token != null && token.isNotEmpty;
  }

  Future<void> clearSession() async {
    await _prefs.remove(_keyToken);
    await _prefs.remove(_keyRefreshToken);
    await _prefs.remove(_keyUserId);
    await _prefs.remove(_keyUserName);
    await _prefs.remove(_keyUserEmail);
    await _prefs.remove(_keyUserRole);
  }
}
