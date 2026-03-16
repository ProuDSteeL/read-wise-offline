class PushSubscription {
  final String id;
  final String userId;
  final String endpoint;
  final String p256dh;
  final String auth;
  final DateTime createdAt;

  const PushSubscription({
    required this.id,
    required this.userId,
    required this.endpoint,
    required this.p256dh,
    required this.auth,
    required this.createdAt,
  });

  factory PushSubscription.fromJson(Map<String, dynamic> json) {
    return PushSubscription(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      endpoint: json['endpoint'] as String,
      p256dh: json['p256dh'] as String,
      auth: json['auth'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'endpoint': endpoint,
      'p256dh': p256dh,
      'auth': auth,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
