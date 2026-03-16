import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BottomNav extends StatelessWidget {
  final int currentIndex;

  const BottomNav({super.key, required this.currentIndex});

  static const _items = [
    BottomNavigationBarItem(
      icon: Icon(Icons.home_outlined),
      activeIcon: Icon(Icons.home),
      label: 'Главная',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.search),
      activeIcon: Icon(Icons.search),
      label: 'Поиск',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.bookmark_border),
      activeIcon: Icon(Icons.bookmark),
      label: 'Полки',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.download_outlined),
      activeIcon: Icon(Icons.download),
      label: 'Загрузки',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.person_outline),
      activeIcon: Icon(Icons.person),
      label: 'Профиль',
    ),
  ];

  static const _routes = ['/', '/search', '/shelves', '/downloads', '/profile'];

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      items: _items,
      onTap: (index) {
        if (index != currentIndex) {
          context.go(_routes[index]);
        }
      },
    );
  }
}
