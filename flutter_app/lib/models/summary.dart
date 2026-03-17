class Summary {
  final String id;
  final String bookId;
  final String? content;
  final String? audioUrl;
  final int? audioSizeBytes;
  final DateTime? publishedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Summary({
    required this.id,
    required this.bookId,
    this.content,
    this.audioUrl,
    this.audioSizeBytes,
    this.publishedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Summary.fromJson(Map<String, dynamic> json) {
    return Summary(
      id: json['id'] as String,
      bookId: json['book_id'] as String,
      content: json['content'] as String?,
      audioUrl: json['audio_url'] as String?,
      audioSizeBytes: json['audio_size_bytes'] is int
          ? json['audio_size_bytes'] as int
          : (json['audio_size_bytes'] is num
              ? (json['audio_size_bytes'] as num).toInt()
              : null),
      publishedAt: json['published_at'] != null
          ? DateTime.parse(json['published_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'book_id': bookId,
      'content': content,
      'audio_url': audioUrl,
      'audio_size_bytes': audioSizeBytes,
      'published_at': publishedAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Summary copyWith({
    String? id,
    String? bookId,
    String? content,
    String? audioUrl,
    int? audioSizeBytes,
    DateTime? publishedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Summary(
      id: id ?? this.id,
      bookId: bookId ?? this.bookId,
      content: content ?? this.content,
      audioUrl: audioUrl ?? this.audioUrl,
      audioSizeBytes: audioSizeBytes ?? this.audioSizeBytes,
      publishedAt: publishedAt ?? this.publishedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
