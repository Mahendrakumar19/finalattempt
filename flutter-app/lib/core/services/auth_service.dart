import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.read(apiServiceProvider), ref.read(storageServiceProvider));
});

class AuthService {
  final ApiService _api;
  final StorageService _storage;

  AuthService(this._api, this._storage);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await _api.post('/api/auth/login', data: {
      'email': email,
      'password': password,
    });

    if (data != null && data['token'] != null) {
      await _storage.saveToken(data['token']);
      if (data['refreshToken'] != null) {
        await _storage.saveRefreshToken(data['refreshToken']);
      }
      final user = data['user'];
      if (user != null) {
        await _storage.saveUserSession(
          userId: user['id']?.toString() ?? '',
          name: user['fullName'] ?? user['name'] ?? '',
          email: user['email'] ?? email,
          role: user['role'] ?? 'student',
        );
      }
      return {'success': true, 'user': user};
    }

    return {'success': false, 'error': data?['error'] ?? 'Login failed'};
  }

  Future<Map<String, dynamic>> register({
    required String fullName,
    required String mobile,
    required String email,
    required String password,
    required String targetExam,
  }) async {
    final data = await _api.post('/api/auth/register', data: {
      'fullName': fullName,
      'mobile': mobile,
      'email': email,
      'password': password,
      'targetExam': targetExam,
    });

    if (data != null && data['token'] != null) {
      await _storage.saveToken(data['token']);
      final user = data['user'];
      if (user != null) {
        await _storage.saveUserSession(
          userId: user['id']?.toString() ?? '',
          name: user['fullName'] ?? fullName,
          email: user['email'] ?? email,
          role: user['role'] ?? 'student',
        );
      }
      return {'success': true, 'user': user};
    }

    return {'success': false, 'error': data?['error'] ?? 'Registration failed'};
  }

  Future<void> logout() async {
    await _storage.clearSession();
  }

  bool isLoggedIn() => _storage.isLoggedIn();
}
