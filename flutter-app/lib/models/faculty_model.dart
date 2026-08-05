class FacultyModel {
  final String id;
  final String name;
  final String? role;
  final String? experience;
  final String? bio;
  final String? avatar;
  final String? specialization;

  const FacultyModel({
    required this.id,
    required this.name,
    this.role,
    this.experience,
    this.bio,
    this.avatar,
    this.specialization,
  });

  String get resolvedAvatar {
    if (avatar == null || avatar!.isEmpty) return '';
    if (avatar!.startsWith('http')) return avatar!;
    return 'https://finalattemptias.com/$avatar';
  }

  factory FacultyModel.fromJson(Map<String, dynamic> json) => FacultyModel(
    id: json['id']?.toString() ?? '',
    name: json['name'] ?? '',
    role: json['role'] ?? json['designation'],
    experience: json['experience'],
    bio: json['bio'],
    avatar: json['avatar'] ?? json['photo'] ?? json['imageUrl'],
    specialization: json['specialization'],
  );
}

class ResultModel {
  final String id;
  final String name;
  final String? rank;
  final String? exam;
  final String? course;
  final String? service;
  final String? district;
  final String? photo;
  final int? year;
  final String? story;

  const ResultModel({
    required this.id,
    required this.name,
    this.rank,
    this.exam,
    this.course,
    this.service,
    this.district,
    this.photo,
    this.year,
    this.story,
  });

  String get resolvedPhoto {
    if (photo == null || photo!.isEmpty) return '';
    if (photo!.startsWith('http')) return photo!;
    return 'https://finalattemptias.com/$photo';
  }

  factory ResultModel.fromJson(Map<String, dynamic> json) => ResultModel(
    id: json['id']?.toString() ?? '',
    name: json['name'] ?? '',
    rank: json['rank']?.toString(),
    exam: json['exam'],
    course: json['course'],
    service: json['service'],
    district: json['district'],
    photo: json['photo'] ?? json['imageUrl'],
    year: json['year'] is int ? json['year'] : int.tryParse(json['year']?.toString() ?? ''),
    story: json['story'],
  );
}
