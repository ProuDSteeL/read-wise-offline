enum BookStatus {
  draft,
  published,
  archived;

  String toJson() => name;

  static BookStatus fromJson(String value) {
    return BookStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => BookStatus.draft,
    );
  }
}

enum ShelfType {
  favorite,
  read,
  wantToRead;

  String toJson() {
    switch (this) {
      case ShelfType.favorite:
        return 'favorite';
      case ShelfType.read:
        return 'read';
      case ShelfType.wantToRead:
        return 'want_to_read';
    }
  }

  static ShelfType fromJson(String value) {
    switch (value) {
      case 'favorite':
        return ShelfType.favorite;
      case 'read':
        return ShelfType.read;
      case 'want_to_read':
        return ShelfType.wantToRead;
      default:
        return ShelfType.favorite;
    }
  }

  String get label {
    switch (this) {
      case ShelfType.favorite:
        return 'Избранное';
      case ShelfType.read:
        return 'Прочитано';
      case ShelfType.wantToRead:
        return 'Хочу прочитать';
    }
  }
}

enum SubscriptionType {
  free,
  proMonthly,
  proYearly;

  String toJson() {
    switch (this) {
      case SubscriptionType.free:
        return 'free';
      case SubscriptionType.proMonthly:
        return 'pro_monthly';
      case SubscriptionType.proYearly:
        return 'pro_yearly';
    }
  }

  static SubscriptionType fromJson(String value) {
    switch (value) {
      case 'pro_monthly':
        return SubscriptionType.proMonthly;
      case 'pro_yearly':
        return SubscriptionType.proYearly;
      default:
        return SubscriptionType.free;
    }
  }

  String get label {
    switch (this) {
      case SubscriptionType.free:
        return 'Free';
      case SubscriptionType.proMonthly:
        return 'Pro Monthly';
      case SubscriptionType.proYearly:
        return 'Pro Yearly';
    }
  }
}

enum DownloadContentType {
  text,
  audio,
  both;

  String toJson() => name;

  static DownloadContentType fromJson(String value) {
    return DownloadContentType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => DownloadContentType.text,
    );
  }
}

enum AppRole {
  admin,
  user;

  String toJson() => name;

  static AppRole fromJson(String value) {
    return AppRole.values.firstWhere(
      (e) => e.name == value,
      orElse: () => AppRole.user,
    );
  }
}
