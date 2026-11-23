class SiteSettingsModel {
  final String heroTitle;
  final String heroSubtitle;
  final String? tagline;
  final String? heroImageUrl;
  final String? contactAddress;
  final String? contactPhone;
  final String? contactEmail;
  final String? whatsappLink;
  final String? telegramLink;
  final String? aboutTitle;
  final String? aboutSubtitle;
  final String? aboutMission;
  final String? aboutVision;
  final int? visitorsCount;
  final Map<String, dynamic>? featureFlags;

  const SiteSettingsModel({
    required this.heroTitle,
    required this.heroSubtitle,
    this.tagline,
    this.heroImageUrl,
    this.contactAddress,
    this.contactPhone,
    this.contactEmail,
    this.whatsappLink,
    this.telegramLink,
    this.aboutTitle,
    this.aboutSubtitle,
    this.aboutMission,
    this.aboutVision,
    this.visitorsCount,
    this.featureFlags,
  });

  bool get isCameraProctorEnabled {
    if (featureFlags == null) return false;
    final val = featureFlags!['cameraProctoring'] ?? featureFlags!['camera_proctoring'] ?? featureFlags!['enableCameraProctor'];
    return val == true || val == 'true' || val == 1;
  }

  factory SiteSettingsModel.fromJson(Map<String, dynamic> json) => SiteSettingsModel(
    heroTitle: json['heroTitle'] ?? 'Final Attempt — & BPSC Mentorship',
    heroSubtitle: json['heroSubtitle'] ?? 'Your journey to success starts here.',
    tagline: json['tagline'],
    heroImageUrl: json['heroImageUrl'],
    contactAddress: json['contactAddress'],
    contactPhone: json['contactPhone'],
    contactEmail: json['contactEmail'],
    whatsappLink: json['whatsappLink'],
    telegramLink: json['telegramLink'],
    aboutTitle: json['aboutTitle'],
    aboutSubtitle: json['aboutSubtitle'],
    aboutMission: json['aboutMission'],
    aboutVision: json['aboutVision'],
    visitorsCount: json['visitorsCount'],
    featureFlags: json['featureFlags'] is Map<String, dynamic> ? json['featureFlags'] as Map<String, dynamic> : null,
  );

  static SiteSettingsModel get fallback => const SiteSettingsModel(
    heroTitle: 'Final Attempt — & BPSC Mentorship',
    heroSubtitle: 'Empowering aspirants through personalized mentorship and high-quality content.',
    tagline: "Let's Make Your Attempt Final",
  );
}
