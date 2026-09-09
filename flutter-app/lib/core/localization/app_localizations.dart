import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/theme_provider.dart';

class AppLocalizations {
  final String langCode;

  const AppLocalizations(this.langCode);

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'home': 'Home',
      'good_morning': 'Good Morning',
      'good_afternoon': 'Good Afternoon',
      'good_evening': 'Good Evening',
      'ready_prompt': 'Ready for your Final Attempt?',
      'quick_actions': 'Quick Actions',
      'test_series': 'Test Series',
      'current_affairs': 'Current Affairs',
      'pyqs': 'PYQs',
      'courses': 'Courses',
      'see_all': 'See all',
      'daily_current_affairs': 'Daily Current Affairs',
      'read_now': 'Read Now',
      'practice_pyq': 'Practice PYQ',
      'practice_past_papers': 'Practice Past Exam Papers',
      'solve_pyqs_sub': 'Solve official Prelims & Mains PYQs with answer keys',
      'sign_in': 'Sign In',
      'log_in': 'Log In',
      'welcome_back': 'Welcome Back',
      'featured_test': 'FEATURED TEST',
      'start_practice': 'Start Practice Test',
      'no_notifications': 'No new notifications',
      'select_language': 'Select Application Language',
      'language_desc': 'Choose your preferred language for study materials and interface.',
      'profile_settings': 'Profile & Settings',
      'student_dashboard': 'Student Dashboard',
      'logout': 'Logout',
      'test_series_catalog': 'Test Series Catalog',
      'all_courses': 'Online Courses & Classes',
      'previous_years_questions': 'Previous Year Questions (PYQs)',
      'search': 'Search',
      'search_hint': 'Search tests, courses, current affairs...',
      'all': 'All',
      'prelims': 'Prelims',
      'mains': 'Mains',
      'full_mock': 'Full Mock',
      'subject_wise': 'Subject-wise',
      'view_package': 'View Package',
      'enroll_now': 'Enroll Now',
      'free': 'Free',
      'attempt_now': 'Attempt Now',
      'my_dashboard': 'My Dashboard',
      'profile': 'Profile',
      'language_changed_en': 'Language set to English',
      'language_changed_hi': 'भाषा हिंदी में बदली गई (Language set to Hindi)',
    },
    'hi': {
      'home': 'होम',
      'good_morning': 'सुप्रभात',
      'good_afternoon': 'शुभ दोपहर',
      'good_evening': 'शुभ संध्या',
      'ready_prompt': 'क्या आप अपनी अंतिम कोशिश के लिए तैयार हैं?',
      'quick_actions': 'त्वरित विकल्प',
      'test_series': 'टेस्ट सीरीज़',
      'current_affairs': 'करेंट अफेयर्स',
      'pyqs': 'पीवाईक्यू (PYQs)',
      'courses': 'कोर्सेस',
      'see_all': 'सभी देखें',
      'daily_current_affairs': 'दैनिक करेंट अफेयर्स',
      'read_now': 'अभी पढ़ें',
      'practice_pyq': 'अभ्यास करें',
      'practice_past_papers': 'विगत वर्षों के प्रश्न पत्र हल करें',
      'solve_pyqs_sub': 'उत्तर कुंजी के साथ आधिकारिक प्रीलिम्स और मेन्स पीवाईक्यू हल करें',
      'sign_in': 'साइन इन करें',
      'log_in': 'लॉग इन करें',
      'welcome_back': 'पुनः स्वागत है',
      'featured_test': 'विशेष टेस्ट पास',
      'start_practice': 'अभ्यास टेस्ट शुरू करें',
      'no_notifications': 'कोई नया नोटिफिकेशन नहीं है',
      'select_language': 'एप्लिकेशन भाषा चुनें',
      'language_desc': 'अपनी अध्ययन सामग्री और इंटरफ़ेस की भाषा चुनें।',
      'profile_settings': 'प्रोफ़ाइल और सेटिंग्स',
      'student_dashboard': 'स्टूडेंट डैशबोर्ड',
      'logout': 'लॉग आउट',
      'test_series_catalog': 'टेस्ट सीरीज़ कैटलॉग',
      'all_courses': 'ऑनलाइन कोर्सेस व कक्षाएं',
      'previous_years_questions': 'विगत वर्षों के प्रश्न पत्र (PYQs)',
      'search': 'खोजें',
      'search_hint': 'टेस्ट, कोर्सेस, करेंट अफेयर्स खोजें...',
      'all': 'सभी',
      'prelims': 'प्रीलिम्स',
      'mains': 'मेन्स',
      'full_mock': 'फुल मॉक',
      'subject_wise': 'विषयवार',
      'view_package': 'पैकेज देखें',
      'enroll_now': 'अभी जुड़ें',
      'free': 'मुफ़्त',
      'attempt_now': 'अभी प्रयास करें',
      'my_dashboard': 'मेरा डैशबोर्ड',
      'profile': 'प्रोफ़ाइल',
      'language_changed_en': 'Language set to English',
      'language_changed_hi': 'भाषा हिंदी में बदली गई',
    },
  };

  String tr(String key) {
    return _localizedValues[langCode]?[key] ?? _localizedValues['en']![key] ?? key;
  }
}

final appLocalizationsProvider = Provider<AppLocalizations>((ref) {
  final langCode = ref.watch(appLanguageProvider);
  return AppLocalizations(langCode);
});
