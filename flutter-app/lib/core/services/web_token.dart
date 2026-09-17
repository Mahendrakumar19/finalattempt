import 'dart:html' as html;

String? getWebToken() {
  final token = html.window.localStorage['token'] ?? html.window.localStorage['access_token'];
  return token;
}
