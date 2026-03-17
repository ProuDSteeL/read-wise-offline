import 'package:flutter/material.dart';

class PaywallPrompt extends StatelessWidget {
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool showBenefits;

  const PaywallPrompt({
    super.key,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.showBenefits = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.primary.withOpacity(0.2)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lock_outline, color: colorScheme.primary, size: 32),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurface,
            ),
          ),
          if (showBenefits) ...[
            const SizedBox(height: 16),
            _BenefitRow(
              icon: Icons.menu_book,
              text: 'Неограниченные саммари',
              color: colorScheme.primary,
            ),
            const SizedBox(height: 8),
            _BenefitRow(
              icon: Icons.headphones,
              text: 'Аудио версии всех книг',
              color: colorScheme.primary,
            ),
            const SizedBox(height: 8),
            _BenefitRow(
              icon: Icons.download,
              text: 'Офлайн загрузка',
              color: colorScheme.primary,
            ),
            const SizedBox(height: 8),
            _BenefitRow(
              icon: Icons.format_quote,
              text: 'Безлимитные цитаты и заметки',
              color: colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: colorScheme.outlineVariant.withOpacity(0.5),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Column(
                    children: [
                      Text(
                        '299 \u20BD/мес',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      Text(
                        'Ежемесячно',
                        style: TextStyle(
                          fontSize: 12,
                          color: colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 1,
                    height: 36,
                    color: colorScheme.outlineVariant.withOpacity(0.5),
                  ),
                  Column(
                    children: [
                      Text(
                        '1 990 \u20BD/год',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: colorScheme.primary,
                        ),
                      ),
                      Text(
                        'Экономия 45%',
                        style: TextStyle(
                          fontSize: 12,
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          if (actionLabel != null) ...[
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: onAction,
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary,
                foregroundColor: colorScheme.onPrimary,
              ),
              child: Text(actionLabel!),
            ),
          ],
        ],
      ),
    );
  }
}

class _BenefitRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const _BenefitRow({
    required this.icon,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 10),
        Text(
          text,
          style: TextStyle(
            fontSize: 14,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}
