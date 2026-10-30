class DownloadItemModel {
  final String id;
  final String title;
  final String? description;
  final String? fileUrl;
  final String? fileSize;
  final String? fileType;
  final String? language;
  final String? examCategory;
  final String? type;
  final int downloadCount;
  final String? createdAt;

  const DownloadItemModel({
    required this.id,
    required this.title,
    this.description,
    this.fileUrl,
    this.fileSize,
    this.fileType,
    this.language,
    this.examCategory,
    this.type,
    this.downloadCount = 0,
    this.createdAt,
  });

  factory DownloadItemModel.fromJson(Map<String, dynamic> json) {
    String? resolvedUrl = json['fileUrl'] ?? json['file_url'] ?? json['url'];
    if (resolvedUrl != null && !resolvedUrl.startsWith('http')) {
      resolvedUrl = resolvedUrl.startsWith('/') 
          ? 'https://finalattemptias.com$resolvedUrl' 
          : 'https://finalattemptias.com/$resolvedUrl';
    }

    return DownloadItemModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? json['name'] ?? '',
      description: json['description'],
      fileUrl: resolvedUrl,
      fileSize: json['fileSize'] ?? json['file_size'] ?? json['size'],
      fileType: json['fileType'] ?? json['file_type'] ?? 'PDF',
      language: json['language'] ?? 'Bilingual',
      examCategory: json['examCategory'] ?? json['exam_category'] ?? json['category'],
      type: json['type'],
      downloadCount: json['downloadCount'] ?? json['download_count'] ?? 0,
      createdAt: json['createdAt']?.toString() ?? json['created_at']?.toString(),
    );
  }
}

class NCERTBookModel {
  final String id;
  final String subject;
  final int classLevel;
  final String bookName;
  final String title;
  final String language;
  final String? fileUrl;
  final String? description;
  final int sortOrder;

  const NCERTBookModel({
    required this.id,
    required this.subject,
    required this.classLevel,
    required this.bookName,
    required this.title,
    required this.language,
    this.fileUrl,
    this.description,
    this.sortOrder = 0,
  });

  factory NCERTBookModel.fromJson(Map<String, dynamic> json) {
    String? resolvedUrl = json['fileMedia'] is Map 
        ? (json['fileMedia']['url'] ?? json['fileMedia']['path'] ?? json['fileMedia']['storagePath'])
        : (json['fileUrl'] ?? json['url'] ?? json['fileMedia']?.toString());
    
    if (resolvedUrl != null && !resolvedUrl.startsWith('http')) {
      resolvedUrl = resolvedUrl.startsWith('/') 
          ? 'https://finalattemptias.com$resolvedUrl' 
          : 'https://finalattemptias.com/$resolvedUrl';
    }

    return NCERTBookModel(
      id: json['id']?.toString() ?? '',
      subject: json['subject'] ?? 'General',
      classLevel: json['classLevel'] is int ? json['classLevel'] : int.tryParse(json['classLevel']?.toString() ?? '6') ?? 6,
      bookName: json['bookName'] ?? json['book_name'] ?? json['title'] ?? '',
      title: json['title'] ?? '',
      language: json['language'] ?? 'English',
      fileUrl: resolvedUrl,
      description: json['description'],
      sortOrder: json['sortOrder'] ?? json['sort_order'] ?? 0,
    );
  }
}

class PublicationBookModel {
  final String id;
  final String title;
  final String? subtitle;
  final String? description;
  final String? author;
  final double mrp;
  final double price;
  final String? coverImage;
  final String? edition;
  final String? language;
  final int pages;
  final bool inStock;

  const PublicationBookModel({
    required this.id,
    required this.title,
    this.subtitle,
    this.description,
    this.author,
    required this.mrp,
    required this.price,
    this.coverImage,
    this.edition,
    this.language,
    this.pages = 0,
    this.inStock = true,
  });

  factory PublicationBookModel.fromJson(Map<String, dynamic> json) {
    String? img = json['coverImage'] ?? json['cover_image'] ?? json['imageUrl'] ?? json['image'];
    if (img != null && !img.startsWith('http')) {
      img = img.startsWith('/') ? 'https://finalattemptias.com$img' : 'https://finalattemptias.com/$img';
    }

    return PublicationBookModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? json['name'] ?? '',
      subtitle: json['subtitle'],
      description: json['description'],
      author: json['author'] ?? 'Final Attempt Editorial Board',
      mrp: (json['mrp'] is num) ? (json['mrp'] as num).toDouble() : (double.tryParse(json['mrp']?.toString() ?? '0') ?? 0.0),
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : (double.tryParse(json['price']?.toString() ?? '0') ?? 0.0),
      coverImage: img,
      edition: json['edition'] ?? 'Latest Edition',
      language: json['language'] ?? 'Bilingual (Hindi / English)',
      pages: json['pages'] is int ? json['pages'] : int.tryParse(json['pages']?.toString() ?? '0') ?? 0,
      inStock: json['inStock'] ?? json['in_stock'] ?? true,
    );
  }
}
