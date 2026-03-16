class UserRating {
  final String id;
  final String userId;
  final String bookId;
  final int rating;
  final DateTime createdAt;

  const UserRating({
    required this.id,
    required this.userId,
    required this.bookId,
    required this.rating,
    required this.createdAt,
  });

  factory UserRating.fromJson(Map<String, dynamic> json) {
    return UserRating(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      bookId: json['book_id'] as String,
      rating: json['rating'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'book_id': bookId,
      'rating': rating,
      'created_at': createdAt.toIso8601String(),
    };
  }

  UserRating copyWith({
    String? id,
    String? userId,
    String? bookId,
    int? rating,
    DateTime? createdAt,
  }) {
    return UserRating(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      bookId: bookId ?? this.bookId,
      rating: rating ?? this.rating,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
