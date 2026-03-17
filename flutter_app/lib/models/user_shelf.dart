import 'book.dart';
import 'enums.dart';

class UserShelf {
  final String id;
  final String userId;
  final String bookId;
  final ShelfType shelf;
  final DateTime createdAt;
  final Book? book;

  const UserShelf({
    required this.id,
    required this.userId,
    required this.bookId,
    required this.shelf,
    required this.createdAt,
    this.book,
  });

  factory UserShelf.fromJson(Map<String, dynamic> json) {
    return UserShelf(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      bookId: json['book_id'] as String,
      shelf: ShelfType.fromJson(json['shelf'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
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
      'shelf': shelf.toJson(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  UserShelf copyWith({
    String? id,
    String? userId,
    String? bookId,
    ShelfType? shelf,
    DateTime? createdAt,
    Book? book,
  }) {
    return UserShelf(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      bookId: bookId ?? this.bookId,
      shelf: shelf ?? this.shelf,
      createdAt: createdAt ?? this.createdAt,
      book: book ?? this.book,
    );
  }
}
