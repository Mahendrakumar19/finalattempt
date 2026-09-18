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
    try {
      final data = await _api.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (data != null && data['success'] == true) {
        final responseData = data['data'] ?? {};
        final token = responseData['accessToken'] ?? data['token'];
        if (token != null && token.toString().isNotEmpty) {
          await _storage.saveToken(token.toString());
        }
        if (responseData['refreshToken'] != null) {
          await _storage.saveRefreshToken(responseData['refreshToken']);
        }
        final user = responseData['user'] ?? data['user'] ?? {
          'id': 'usr_demo_1',
          'fullName': email.contains('@') ? email.split('@').first : email,
          'email': email,
          'role': 'student',
        };
        await _storage.saveUserSession(
          userId: user['id']?.toString() ?? 'usr_demo_1',
          name: (user['fullName'] ?? user['name'] ?? email.split('@').first).toString(),
          email: user['email'] ?? email,
          role: user['role'] ?? 'student',
        );
        return {'success': true, 'user': user};
      }
      
      if (data != null && data['error'] != null) {
        return {'success': false, 'error': data['error'].toString()};
      }
    } catch (e) {
      if (e is String && e.isNotEmpty) {
        return {'success': false, 'error': e};
      }
    }

    return {'success': false, 'error': 'Login failed. Please check your credentials.'};
  }

  Future<Map<String, dynamic>> register({
    required String fullName,
    required String mobile,
    required String email,
    required String password,
    required String targetExam,
  }) async {
    try {
      final data = await _api.post('/auth/register', data: {
        'fullName': fullName,
        'mobile': mobile,
        'email': email,
        'password': password,
        'targetExam': targetExam,
      });

      if (data != null && data['success'] == true) {
        final responseData = data['data'] ?? {};
        final token = responseData['accessToken'] ?? data['token'];
        if (token != null && token.toString().isNotEmpty) {
          await _storage.saveToken(token.toString());
        }
        if (responseData['refreshToken'] != null) {
          await _storage.saveRefreshToken(responseData['refreshToken']);
        }
        final user = responseData['user'] ?? data['user'] ?? {
          'id': 'usr_demo_1',
          'fullName': fullName,
          'email': email,
          'role': 'student',
        };
        await _storage.saveUserSession(
          userId: user['id']?.toString() ?? 'usr_demo_1',
          name: (user['fullName'] ?? user['name'] ?? fullName).toString(),
          email: user['email'] ?? email,
          role: user['role'] ?? 'student',
        );
        return {'success': true, 'user': user};
      }
      
      if (data != null && data['error'] != null) {
        return {'success': false, 'error': data['error'].toString()};
      }
    } catch (e) {
      if (e is String && e.isNotEmpty) {
        return {'success': false, 'error': e};
      }
    }

    return {'success': false, 'error': 'Registration failed. Please try again.'};
  }

  Future<void> logout() async {
    await _storage.clearSession();
  }

  /// Request password reset OTP
  Future<String?> requestPasswordReset(String email) async {
    try {
      final data = await _api.post('/auth/forgot-password', data: {
        'email': email,
      });
      if (data != null && data['success'] == true) {
        return null;
      }
    } catch (e) {
      return e.toString();
    }
    return 'Failed to send reset OTP. Please try again.';
  }

  /// Verify OTP and reset password
  Future<String?> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      final data = await _api.post('/auth/reset-password', data: {
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
      });
      if (data != null && data['success'] == true) {
        return null;
      }
      if (data != null && data['error'] != null) {
        return data['error'].toString();
      }
    } catch (e) {
      return e.toString();
    }
    return 'Password reset failed. Check your OTP and try again.';
  }

  bool isLoggedIn() => _storage.isLoggedIn();
}
