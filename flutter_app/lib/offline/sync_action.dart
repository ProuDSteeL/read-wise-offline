class SyncAction {
  final String id;
  final String type;
  final Map<String, dynamic> data;
  final DateTime createdAt;

  const SyncAction({
    required this.id,
    required this.type,
    required this.data,
    required this.createdAt,
  });

  factory SyncAction.fromJson(Map<String, dynamic> json) {
    return SyncAction(
      id: json['id'] as String,
      type: json['type'] as String,
      data: Map<String, dynamic>.from(json['data'] as Map),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'data': data,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
