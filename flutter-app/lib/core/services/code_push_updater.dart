import 'package:flutter/foundation.dart';
import 'package:shorebird_code_push/shorebird_code_push.dart';

/// Service to handle Shorebird Code Push Over-The-Air (OTA) updates.
/// Checks for new app patches silently on launch and downloads them in background.
class CodePushUpdater {
  static final _updater = ShorebirdUpdater();

  /// Silently check and download any published patch.
  /// Next time the student launches the app, the new code/UI is automatically active.
  static Future<void> checkForUpdates() async {
    if (kIsWeb) return;

    try {
      final status = await _updater.checkForUpdate();
      if (status == UpdateStatus.outdated) {
        debugPrint('[Shorebird] New patch found! Downloading in background...');
        await _updater.update();
        debugPrint('[Shorebird] Patch downloaded successfully. Will apply on next restart.');
      } else {
        debugPrint('[Shorebird] App is on latest patch: $status');
      }
    } catch (e) {
      // Graceful fallback: Never disrupt student experience if offline or network drops
      debugPrint('[Shorebird] Update check skipped: $e');
    }
  }

  /// Get current running patch number (if patched via Shorebird)
  static Future<int?> getCurrentPatchNumber() async {
    try {
      return await _updater.readCurrentPatch().then((p) => p?.number);
    } catch (_) {
      return null;
    }
  }
}
