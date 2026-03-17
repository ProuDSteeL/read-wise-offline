import 'enums.dart';

class Book {
  final String id;
  final String title;
  final String author;
  final String? aboutAuthor;
  final String? description;
  final String? coverUrl;
  final List<String>? categories;
  final List<String>? tags;
  final int? readTimeMin;
  final int? listenTimeMin;
  final double? rating;
  final int? viewsCount;
  final BookStatus status;
  final Map<String, dynamic>? whyRead;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Book({
    required this.id,
    required this.title,
    required this.author,
    this.aboutAuthor,
    this.description,
    this.coverUrl,
    this.categories,
    this.tags,
    this.readTimeMin,
    this.listenTimeMin,
    this.rating,
    this.viewsCount,
    required this.status,
    this.whyRead,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'] as String,
      title: json['title'] as String,
      author: json['author'] as String,
      aboutAuthor: json['about_author'] as String?,
      description: json['description'] as String?,
      coverUrl: json['cover_url'] as String?,
      categories: _toStringList(json['categories']),
      tags: _toStringList(json['tags']),
      readTimeMin: _toInt(json['read_time_min']),
      listenTimeMin: _toInt(json['listen_time_min']),
      rating: _toDouble(json['rating']),
      viewsCount: _toInt(json['views_count']),
      status: BookStatus.fromJson(json['status'] as String? ?? 'draft'),
      whyRead: _toMap(json['why_read']),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  static List<String>? _toStringList(dynamic value) {
    if (value == null) return null;
    if (value is List) return value.map((e) => e.toString()).toList();
    return null;
  }

  static Map<String, dynamic>? _toMap(dynamic value) {
    if (value == null) return null;
    if (value is Map) return Map<String, dynamic>.from(value);
    return null;
  }

  static int? _toInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString());
  }

  static double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'author': author,
      'about_author': aboutAuthor,
      'description': description,
      'cover_url': coverUrl,
      'categories': categories,
      'tags': tags,
      'read_time_min': readTimeMin,
      'listen_time_min': listenTimeMin,
      'rating': rating,
      'views_count': viewsCount,
      'status': status.toJson(),
      'why_read': whyRead,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Book copyWith({
    String? id,
    String? title,
    String? author,
    String? aboutAuthor,
    String? description,
    String? coverUrl,
    List<String>? categories,
    List<String>? tags,
    int? readTimeMin,
    int? listenTimeMin,
    double? rating,
    int? viewsCount,
    BookStatus? status,
    Map<String, dynamic>? whyRead,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Book(
      id: id ?? this.id,
      title: title ?? this.title,
      author: author ?? this.author,
      aboutAuthor: aboutAuthor ?? this.aboutAuthor,
      description: description ?? this.description,
      coverUrl: coverUrl ?? this.coverUrl,
      categories: categories ?? this.categories,
      tags: tags ?? this.tags,
      readTimeMin: readTimeMin ?? this.readTimeMin,
      listenTimeMin: listenTimeMin ?? this.listenTimeMin,
      rating: rating ?? this.rating,
      viewsCount: viewsCount ?? this.viewsCount,
      status: status ?? this.status,
      whyRead: whyRead ?? this.whyRead,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
