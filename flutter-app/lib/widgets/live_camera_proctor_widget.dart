import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';

enum ProctorViolationType {
  tabSwitch,
  windowBlur,
  cameraCovered,
  multipleFaces,
}

class ProctorViolation {
  final String id;
  final ProctorViolationType type;
  final String title;
  final String description;
  final DateTime timestamp;

  ProctorViolation({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.timestamp,
  });
}

class LiveCameraProctorWidget extends StatefulWidget {
  final bool isActive;
  final int maxViolations;
  final void Function(ProctorViolation violation, int currentCount)? onViolation;
  final void Function(String reason)? onAutoSubmitTriggered;

  const LiveCameraProctorWidget({
    super.key,
    this.isActive = true,
    this.maxViolations = 3,
    this.onViolation,
    this.onAutoSubmitTriggered,
  });

  @override
  State<LiveCameraProctorWidget> createState() => _LiveCameraProctorWidgetState();
}

class _LiveCameraProctorWidgetState extends State<LiveCameraProctorWidget>
    with WidgetsBindingObserver {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isCameraPermissionGranted = false;
  bool _isAutoSubmitting = false;
  int _violationCount = 0;
  ProctorViolation? _activeWarning;
  int _countdownToDismiss = 0;
  Timer? _dismissTimer;

  // Track position of the floating PIP camera preview
  Offset _pipPosition = const Offset(16, 80);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (widget.isActive) {
      _initFrontCamera();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _dismissTimer?.cancel();
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!widget.isActive || _isAutoSubmitting) return;

    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _triggerViolation(
        ProctorViolationType.tabSwitch,
        'App Minimized / Switch Detected',
        'You navigated away from the exam or minimized the app. Keep your focus on the test screen.',
      );
    }
  }

  Future<void> _initFrontCamera() async {
    try {
      final cameras = await availableCameras();
      CameraDescription? frontCamera;

      for (final cam in cameras) {
        if (cam.lensDirection == CameraLensDirection.front) {
          frontCamera = cam;
          break;
        }
      }

      frontCamera ??= cameras.isNotEmpty ? cameras.first : null;

      if (frontCamera == null) {
        if (mounted) {
          setState(() {
            _isCameraPermissionGranted = false;
          });
        }
        return;
      }

      final controller = CameraController(
        frontCamera,
        ResolutionPreset.low,
        enableAudio: false,
      );

      _cameraController = controller;
      await controller.initialize();

      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
          _isCameraPermissionGranted = true;
        });
      }
    } catch (e) {
      if (kDebugMode) {
        print('[Proctoring] Camera init error: $e');
      }
      if (mounted) {
        setState(() {
          _isCameraPermissionGranted = false;
        });
      }
    }
  }

  void _triggerViolation(ProctorViolationType type, String title, String description) {
    if (_isAutoSubmitting) return;

    final violation = ProctorViolation(
      id: '${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      title: title,
      description: description,
      timestamp: DateTime.now(),
    );

    final newCount = _violationCount + 1;
    setState(() {
      _violationCount = newCount;
      _activeWarning = violation;
      _countdownToDismiss = 5;
    });

    widget.onViolation?.call(violation, newCount);

    _dismissTimer?.cancel();
    _dismissTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_countdownToDismiss <= 1) {
        timer.cancel();
        setState(() {
          _countdownToDismiss = 0;
        });
      } else {
        setState(() {
          _countdownToDismiss--;
        });
      }
    });

    // Check strike limit (Default: 3 violations terminates and auto-submits)
    if (newCount >= widget.maxViolations) {
      setState(() {
        _isAutoSubmitting = true;
      });
      widget.onAutoSubmitTriggered?.call(
        'Test auto-submitted: Maximum security violations reached ($newCount/${widget.maxViolations}) - $title',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final isTerminated = _violationCount >= widget.maxViolations || _isAutoSubmitting;

    return Stack(
      children: [
        // ── Floating Live PIP Webcam Feed ──
        if (widget.isActive)
          Positioned(
            left: _pipPosition.dx.clamp(8.0, screenSize.width - 108.0),
            top: _pipPosition.dy.clamp(40.0, screenSize.height - 148.0),
            child: GestureDetector(
              onPanUpdate: (details) {
                setState(() {
                  _pipPosition += details.delta;
                });
              },
              child: Material(
                elevation: 8,
                borderRadius: BorderRadius.circular(12),
                color: Colors.black,
                child: Container(
                  width: 96,
                  height: 120,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _violationCount > 0 ? Colors.redAccent : const Color(0xFF10B981),
                      width: 2,
                    ),
                    color: Colors.black,
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    children: [
                      if (_isCameraInitialized && _cameraController != null)
                        Center(
                          child: AspectRatio(
                            aspectRatio: _cameraController!.value.aspectRatio,
                            child: CameraPreview(_cameraController!),
                          ),
                        )
                      else
                        Container(
                          color: const Color(0xFF0F172A),
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _isCameraPermissionGranted ? Icons.camera_alt : Icons.videocam_off_rounded,
                                  color: Colors.white54,
                                  size: 24,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _isCameraPermissionGranted ? 'Connecting...' : 'Camera Off',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 8.5, color: Colors.white70),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Status Badge (Top-left)
                      Positioned(
                        top: 4,
                        left: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: _isCameraInitialized ? const Color(0xFF10B981) : Colors.amber,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 3),
                              const Text(
                                'REC',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Strikes Counter (Top-right)
                      Positioned(
                        top: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: _violationCount > 0 ? Colors.red.withValues(alpha: 0.8) : Colors.black54,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '$_violationCount/${widget.maxViolations}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8.5,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),

                      // Live Proctoring label (Bottom)
                      Positioned(
                        bottom: 3,
                        left: 2,
                        right: 2,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: const Text(
                            'AI PROCTOR ACTIVE',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFF6EE7B7),
                              fontSize: 7,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

        // ── Active Warning Dialog Overlay (Strikes 1 and 2) ──
        if (_activeWarning != null && !isTerminated)
          Positioned.fill(
            child: Material(
              color: Colors.black.withValues(alpha: 0.85),
              child: Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.amber, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.amber.withValues(alpha: 0.2),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                        ),
                        child: const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 32),
                      ),
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'SECURITY WARNING ($_violationCount OF ${widget.maxViolations})',
                          style: const TextStyle(
                            color: Colors.amber,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _activeWarning!.title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _activeWarning!.description,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 12.5, color: Color(0xFFCBD5E1), height: 1.4),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.shield_outlined, color: Colors.amber, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Reaching ${widget.maxViolations} warnings will automatically terminate & submit your test.',
                                style: const TextStyle(fontSize: 11, color: Color(0xFFFDE68A)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        height: 46,
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _activeWarning = null;
                            });
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.amber,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text(
                            _countdownToDismiss > 0
                                ? 'I Understand & Resume ($_countdownToDismiss s)'
                                : 'I Understand & Resume Test',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

        // ── Auto-Submit / Test Terminated Modal (Strike 3) ──
        if (isTerminated)
          Positioned.fill(
            child: Material(
              color: Colors.black.withValues(alpha: 0.95),
              child: Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.redAccent, width: 2),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: Colors.redAccent.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
                        ),
                        child: const Icon(Icons.gpp_bad_rounded, color: Colors.redAccent, size: 36),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Exam Terminated',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Maximum security violations reached ($_violationCount/${widget.maxViolations} strikes).\nYour examination is being automatically finalized and submitted.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 13, color: Color(0xFFCBD5E1), height: 1.4),
                      ),
                      const SizedBox(height: 20),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.redAccent,
                            ),
                          ),
                          SizedBox(width: 12),
                          Text(
                            'Submitting answers to server...',
                            style: TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
