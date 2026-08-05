import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';
import '../core/services/auth_service.dart';

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.read(authServiceProvider),
    ref.read(storageServiceProvider),
  );
});

class AuthState {
  final bool isLoggedIn;
  final String? userId;
  final String? userName;
  final String? userEmail;
  final String? userRole;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isLoggedIn = false,
    this.userId,
    this.userName,
    this.userEmail,
    this.userRole,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isLoggedIn,
    String? userId,
    String? userName,
    String? userEmail,
    String? userRole,
    bool? isLoading,
    String? error,
  }) => AuthState(
    isLoggedIn: isLoggedIn ?? this.isLoggedIn,
    userId: userId ?? this.userId,
    userName: userName ?? this.userName,
    userEmail: userEmail ?? this.userEmail,
    userRole: userRole ?? this.userRole,
    isLoading: isLoading ?? this.isLoading,
    error: error,
  );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final StorageService _storage;

  AuthNotifier(this._authService, this._storage) : super(const AuthState()) {
    _init();
  }

  void _init() {
    if (_storage.isLoggedIn()) {
      state = state.copyWith(
        isLoggedIn: true,
        userId: _storage.getUserId(),
        userName: _storage.getUserName(),
        userEmail: _storage.getUserEmail(),
        userRole: _storage.getUserRole(),
      );
    }
  }

  Future<String?> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _authService.login(email, password);
      if (result['success'] == true) {
        state = state.copyWith(
          isLoggedIn: true,
          isLoading: false,
          userId: _storage.getUserId(),
          userName: _storage.getUserName(),
          userEmail: _storage.getUserEmail(),
          userRole: _storage.getUserRole(),
        );
        return null;
      } else {
        state = state.copyWith(isLoading: false, error: result['error']);
        return result['error']?.toString() ?? 'Login failed';
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return e.toString();
    }
  }

  Future<String?> register({
    required String fullName,
    required String mobile,
    required String email,
    required String password,
    required String targetExam,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _authService.register(
        fullName: fullName,
        mobile: mobile,
        email: email,
        password: password,
        targetExam: targetExam,
      );
      if (result['success'] == true) {
        state = state.copyWith(
          isLoggedIn: true,
          isLoading: false,
          userId: _storage.getUserId(),
          userName: _storage.getUserName(),
          userEmail: _storage.getUserEmail(),
          userRole: _storage.getUserRole(),
        );
        return null;
      } else {
        state = state.copyWith(isLoading: false, error: result['error']);
        return result['error']?.toString() ?? 'Registration failed';
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return e.toString();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState();
  }
}
