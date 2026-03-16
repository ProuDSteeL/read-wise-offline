class KeyIdea {
  final String id;
  final String bookId;
  final String title;
  final String content;
  final int orderIndex;
  final DateTime createdAt;

  const KeyIdea({
    required this.id,
    required this.bookId,
    required this.title,
    required this.content,
    required this.orderIndex,
    required this.createdAt,
  });

  factory KeyIdea.fromJson(Map<String, dynamic> json) {
    return KeyIdea(
      id: json['id'] as String,
      bookId: json['book_id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      orderIndex: json['order_index'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'book_id': bookId,
      'title': title,
      'content': content,
      'order_index': orderIndex,
      'created_at': createdAt.toIso8601String(),
    };
  }

  KeyIdea copyWith({
    String? id,
    String? bookId,
    String? title,
    String? content,
    int? orderIndex,
    DateTime? createdAt,
  }) {
    return KeyIdea(
      id: id ?? this.id,
      bookId: bookId ?? this.bookId,
      title: title ?? this.title,
      content: content ?? this.content,
      orderIndex: orderIndex ?? this.orderIndex,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
