import 'enums.dart';

class UserRole {
  final String id;
  final String userId;
  final AppRole role;

  const UserRole({
    required this.id,
    required this.userId,
    required this.role,
  });

  factory UserRole.fromJson(Map<String, dynamic> json) {
    return UserRole(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      role: AppRole.fromJson(json['role'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'role': role.toJson(),
    };
  }
}
