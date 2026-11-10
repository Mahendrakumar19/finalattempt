import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/student_service.dart';
import '../../providers/student_provider.dart';
import '../../providers/test_series_provider.dart';
import '../../widgets/apple_pressable.dart';

class UploadMainsModal extends ConsumerStatefulWidget {
  const UploadMainsModal({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const UploadMainsModal(),
    );
  }

  @override
  ConsumerState<UploadMainsModal> createState() => _UploadMainsModalState();
}

class _UploadMainsModalState extends ConsumerState<UploadMainsModal> {
  String? _selectedSeriesId;
  String? _selectedTestId;
  final TextEditingController _notesController = TextEditingController();
  PlatformFile? _pickedFile;
  bool _isUploading = false;
  String? _uploadedPdfUrl;
  String? _errorMsg;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickPdf() async {
    setState(() {
      _errorMsg = null;
    });

    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        withData: true,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.size > 50 * 1024 * 1024) {
          setState(() {
            _errorMsg = 'File size exceeds maximum 50 MB limit.';
          });
          return;
        }

        setState(() {
          _pickedFile = file;
          _isUploading = true;
        });

        Uint8List? fileBytes = file.bytes;
        if (fileBytes == null && file.path != null) {
          fileBytes = await File(file.path!).readAsBytes();
        }

        if (fileBytes == null) {
          setState(() {
            _isUploading = false;
            _errorMsg = 'Unable to read selected PDF file.';
          });
          return;
        }

        final studentService = ref.read(studentServiceProvider);
        final url = await studentService.uploadPdf(fileBytes, file.name);

        if (url != null && url.isNotEmpty) {
          setState(() {
            _uploadedPdfUrl = url;
            _isUploading = false;
          });
        } else {
          setState(() {
            _isUploading = false;
            _errorMsg = 'Failed to upload PDF. Please check connection and try again.';
          });
        }
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
        _errorMsg = 'Error selecting file: $e';
      });
    }
  }

  Future<void> _submitCopy() async {
    if (_selectedTestId == null || _selectedTestId!.isEmpty) {
      setState(() {
        _errorMsg = 'Please select a Mains test.';
      });
      return;
    }

    if (_uploadedPdfUrl == null || _uploadedPdfUrl!.isEmpty) {
      setState(() {
        _errorMsg = 'Please select and upload a valid PDF answer copy.';
      });
      return;
    }

    setState(() {
      _isUploading = true;
      _errorMsg = null;
    });

    try {
      final studentService = ref.read(studentServiceProvider);
      final res = await studentService.submitMainsTestCopy(
        testId: _selectedTestId!,
        submissionUrl: _uploadedPdfUrl!,
        submissionText: _notesController.text.trim(),
      );

      if (mounted) {
        setState(() {
          _isUploading = false;
        });

        if (res != null) {
          ref.invalidate(studentMainsSubmissionsProvider);
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Your Mains Answer Copy has been submitted successfully for evaluation!'),
              backgroundColor: AppTheme.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        } else {
          setState(() {
            _errorMsg = 'Submission failed. Please verify and try again.';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploading = false;
          _errorMsg = 'Submission error: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final testSeriesAsync = ref.watch(testSeriesListProvider);
    final mainsTestsAsync = ref.watch(mainsTestsProvider(_selectedSeriesId));

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF43F5E).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.upload_file_rounded, color: Color(0xFFF43F5E), size: 20),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Upload Mains Copy',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                        Text(
                          'Get step-by-step mentor evaluation',
                          style: TextStyle(fontSize: 11, color: textMuted),
                        ),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(Icons.close_rounded, color: textMuted),
                ),
              ],
            ),
          ),
          Divider(height: 20, color: borderCol),

          // Form Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 30),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_errorMsg != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.error.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline_rounded, size: 18, color: AppTheme.error),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMsg!,
                              style: const TextStyle(fontSize: 12, color: AppTheme.error, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 1. Select Program / Test Series
                  Text(
                    '1. SELECT TEST PROGRAM',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderCol),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String?>(
                        value: _selectedSeriesId,
                        isExpanded: true,
                        hint: Text(
                          '-- All Open Mains Practice Sets --',
                          style: TextStyle(fontSize: 13, color: textMuted),
                        ),
                        items: [
                          DropdownMenuItem<String?>(
                            value: null,
                            child: Text(
                              '-- All Open Mains Practice Sets --',
                              style: TextStyle(fontSize: 13, color: textPrimary),
                            ),
                          ),
                          ...testSeriesAsync.maybeWhen(
                            data: (list) => list.map(
                              (s) => DropdownMenuItem<String?>(
                                value: s.id,
                                child: Text(
                                  s.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 13, color: textPrimary),
                                ),
                              ),
                            ),
                            orElse: () => [],
                          ),
                        ],
                        onChanged: (val) {
                          setState(() {
                            _selectedSeriesId = val;
                            _selectedTestId = null;
                          });
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Select Mains Test
                  Text(
                    '2. SELECT MAINS TEST *',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 6),
                  mainsTestsAsync.when(
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryBlue),
                      ),
                    ),
                    error: (_, __) => Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('Unable to load tests for selected program', style: TextStyle(fontSize: 12, color: AppTheme.warning)),
                    ),
                    data: (tests) {
                      if (tests.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderCol),
                          ),
                          child: const Text(
                            'No active Mains tests published yet.',
                            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                          ),
                        );
                      }

                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderCol),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedTestId,
                            isExpanded: true,
                            hint: Text('Select a test to submit...', style: TextStyle(fontSize: 13, color: textMuted)),
                            items: tests.map((t) {
                              final id = t['id']?.toString() ?? '';
                              final title = t['title']?.toString() ?? 'Mains Test';
                              return DropdownMenuItem<String>(
                                value: id,
                                child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: textPrimary)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setState(() {
                                _selectedTestId = val;
                              });
                            },
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // 3. Attach PDF
                  Text(
                    '3. ATTACH ANSWER COPY (PDF, MAX 50MB) *',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 6),
                  InkWell(
                    onTap: _isUploading ? null : _pickPdf,
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: _uploadedPdfUrl != null
                            ? const Color(0xFF10B981).withValues(alpha: 0.08)
                            : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC)),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _uploadedPdfUrl != null ? const Color(0xFF10B981) : borderCol,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (_isUploading) ...[
                            const CircularProgressIndicator(color: AppTheme.primaryBlue),
                            const SizedBox(height: 10),
                            const Text('Uploading PDF copy securely...', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                          ] else if (_uploadedPdfUrl != null) ...[
                            const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 36),
                            const SizedBox(height: 8),
                            Text(
                              _pickedFile?.name ?? 'Answer_Copy.pdf',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'PDF uploaded & ready. Tap to replace.',
                              style: TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
                            ),
                          ] else ...[
                            Icon(Icons.cloud_upload_outlined, color: AppColors.primaryOf(context), size: 36),
                            const SizedBox(height: 8),
                            Text(
                              'Tap to browse and upload PDF',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary),
                            ),
                            const SizedBox(height: 4),
                            Text('Scanned answer sheet or handwritten copy PDF', style: TextStyle(fontSize: 11, color: textMuted)),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 4. Aspirant Note / Questions for Evaluator
                  Text(
                    '4. NOTES FOR EVALUATOR (OPTIONAL)',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderCol),
                    ),
                    child: TextField(
                      controller: _notesController,
                      maxLines: 3,
                      style: TextStyle(fontSize: 13, color: textPrimary),
                      decoration: InputDecoration(
                        hintText: 'e.g. Please evaluate question 3 structure & GS Paper 2 diagrams...',
                        hintStyle: TextStyle(fontSize: 12, color: textMuted),
                        contentPadding: const EdgeInsets.all(12),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ApplePressable(
                      scaleDown: 0.98,
                      onTap: _isUploading ? () {} : _submitCopy,
                      child: Container(
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF4F46E5), Color(0xFF2563EB)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF4F46E5).withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: _isUploading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text(
                                'Submit Copy for Evaluation',
                                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
