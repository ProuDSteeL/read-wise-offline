import 'enums.dart';

class Profile {
  final String id;
  final String userId;
  final String? name;
  final String? avatarUrl;
  final SubscriptionType subscriptionType;
  final DateTime? subscriptionExpiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Profile({
    required this.id,
    required this.userId,
    this.name,
    this.avatarUrl,
    required this.subscriptionType,
    this.subscriptionExpiresAt,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isPro =>
      subscriptionType != SubscriptionType.free && !isExpired;

  bool get isExpired =>
      subscriptionExpiresAt != null &&
      subscriptionExpiresAt!.isBefore(DateTime.now());

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      subscriptionType: SubscriptionType.fromJson(
          json['subscription_type'] as String? ?? 'free'),
      subscriptionExpiresAt: json['subscription_expires_at'] != null
          ? DateTime.parse(json['subscription_expires_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'avatar_url': avatarUrl,
      'subscription_type': subscriptionType.toJson(),
      'subscription_expires_at': subscriptionExpiresAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Profile copyWith({
    String? id,
    String? userId,
    String? name,
    String? avatarUrl,
    SubscriptionType? subscriptionType,
    DateTime? subscriptionExpiresAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Profile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      subscriptionType: subscriptionType ?? this.subscriptionType,
      subscriptionExpiresAt:
          subscriptionExpiresAt ?? this.subscriptionExpiresAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
