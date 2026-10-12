// ignore_for_file: deprecated_member_use, avoid_web_libraries_in_flutter
import 'dart:html' as html;

String? getWebToken() {
  final token = html.window.localStorage['token'] ?? html.window.localStorage['access_token'];
  return token;
}
