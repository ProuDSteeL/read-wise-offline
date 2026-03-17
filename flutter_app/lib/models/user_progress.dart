import 'book.dart';

class UserProgress {
  final String id;
  final String userId;
  final String bookId;
  final double? progressPercent;
  final double? audioPosition;
  final String? lastPosition;
  final DateTime updatedAt;
  final Book? book;

  const UserProgress({
    required this.id,
    required this.userId,
    required this.bookId,
    this.progressPercent,
    this.audioPosition,
    this.lastPosition,
    required this.updatedAt,
    this.book,
  });

  factory UserProgress.fromJson(Map<String, dynamic> json) {
    return UserProgress(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      bookId: json['book_id'] as String,
      progressPercent: json['progress_percent'] is num
          ? (json['progress_percent'] as num).toDouble()
          : null,
      audioPosition: json['audio_position'] is num
          ? (json['audio_position'] as num).toDouble()
          : null,
      lastPosition: json['last_position'] as String?,
      updatedAt: DateTime.parse(json['updated_at'] as String),
      book: json['books'] is Map
          ? Book.fromJson(Map<String, dynamic>.from(json['books'] as Map))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'book_id': bookId,
      'progress_percent': progressPercent,
      'audio_position': audioPosition,
      'last_position': lastPosition,
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  UserProgress copyWith({
    String? id,
    String? userId,
    String? bookId,
    double? progressPercent,
    double? audioPosition,
    String? lastPosition,
    DateTime? updatedAt,
    Book? book,
  }) {
    return UserProgress(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      bookId: bookId ?? this.bookId,
      progressPercent: progressPercent ?? this.progressPercent,
      audioPosition: audioPosition ?? this.audioPosition,
      lastPosition: lastPosition ?? this.lastPosition,
      updatedAt: updatedAt ?? this.updatedAt,
      book: book ?? this.book,
    );
  }
}
