class UserHighlight {
  final String id;
  final String userId;
  final String bookId;
  final String text;
  final String? note;
  final String? color;
  final DateTime createdAt;

  const UserHighlight({
    required this.id,
    required this.userId,
    required this.bookId,
    required this.text,
    this.note,
    this.color,
    required this.createdAt,
  });

  factory UserHighlight.fromJson(Map<String, dynamic> json) {
    return UserHighlight(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      bookId: json['book_id'] as String,
      text: json['text'] as String,
      note: json['note'] as String?,
      color: json['color'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'book_id': bookId,
      'text': text,
      'note': note,
      'color': color,
      'created_at': createdAt.toIso8601String(),
    };
  }

  UserHighlight copyWith({
    String? id,
    String? userId,
    String? bookId,
    String? text,
    String? note,
    String? color,
    DateTime? createdAt,
  }) {
    return UserHighlight(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      bookId: bookId ?? this.bookId,
      text: text ?? this.text,
      note: note ?? this.note,
      color: color ?? this.color,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
