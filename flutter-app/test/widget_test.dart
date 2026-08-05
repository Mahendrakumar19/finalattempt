import 'package:flutter_test/flutter_test.dart';
import 'package:final_attempt_app/main.dart';

void main() {
  testWidgets('App launch smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FinalAttemptApp());
    expect(find.byType(FinalAttemptApp), findsOneWidget);
  });
}
