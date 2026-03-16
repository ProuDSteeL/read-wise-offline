import 'enums.dart';

class UserDownload {
  final String id;
  final String userId;
  final String bookId;
  final DownloadContentType contentType;
  final int? sizeBytes;
  final DateTime downloadedAt;

  const UserDownload({
    required this.id,
    required this.userId,
    required this.bookId,
    required this.contentType,
    this.sizeBytes,
    required this.downloadedAt,
  });

  factory UserDownload.fromJson(Map<String, dynamic> json) {
    return UserDownload(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      bookId: json['book_id'] as String,
      contentType: DownloadContentType.fromJson(
          json['content_type'] as String? ?? 'text'),
      sizeBytes: json['size_bytes'] as int?,
      downloadedAt: DateTime.parse(json['downloaded_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'book_id': bookId,
      'content_type': contentType.toJson(),
      'size_bytes': sizeBytes,
      'downloaded_at': downloadedAt.toIso8601String(),
    };
  }

  UserDownload copyWith({
    String? id,
    String? userId,
    String? bookId,
    DownloadContentType? contentType,
    int? sizeBytes,
    DateTime? downloadedAt,
  }) {
    return UserDownload(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      bookId: bookId ?? this.bookId,
      contentType: contentType ?? this.contentType,
      sizeBytes: sizeBytes ?? this.sizeBytes,
      downloadedAt: downloadedAt ?? this.downloadedAt,
    );
  }
}
