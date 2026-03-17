class Collection {
  final String id;
  final String title;
  final String? description;
  final String? coverUrl;
  final List<String>? bookIds;
  final bool? isFeatured;
  final int? orderIndex;
  final DateTime createdAt;

  const Collection({
    required this.id,
    required this.title,
    this.description,
    this.coverUrl,
    this.bookIds,
    this.isFeatured,
    this.orderIndex,
    required this.createdAt,
  });

  factory Collection.fromJson(Map<String, dynamic> json) {
    return Collection(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      coverUrl: json['cover_url'] as String?,
      bookIds: json['book_ids'] is List
          ? (json['book_ids'] as List).map((e) => e.toString()).toList()
          : null,
      isFeatured: json['is_featured'] as bool?,
      orderIndex: json['order_index'] is int
          ? json['order_index'] as int
          : (json['order_index'] is num
              ? (json['order_index'] as num).toInt()
              : null),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'cover_url': coverUrl,
      'book_ids': bookIds,
      'is_featured': isFeatured,
      'order_index': orderIndex,
      'created_at': createdAt.toIso8601String(),
    };
  }

  Collection copyWith({
    String? id,
    String? title,
    String? description,
    String? coverUrl,
    List<String>? bookIds,
    bool? isFeatured,
    int? orderIndex,
    DateTime? createdAt,
  }) {
    return Collection(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      coverUrl: coverUrl ?? this.coverUrl,
      bookIds: bookIds ?? this.bookIds,
      isFeatured: isFeatured ?? this.isFeatured,
      orderIndex: orderIndex ?? this.orderIndex,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
