# ТЕХНИЧЕСКОЕ ЗАДАНИЕ

## Мобильное приложение саммари книг — Flutter

**Версия 1.0**

**Март 2026**

---

## 1. Обзор проекта

### 1.1. Описание продукта

Кросс-платформенное приложение (iOS, Android, Web/PWA) для чтения саммари нон-фикшн книг на русском языке, построенное на Flutter. Саммари и аудио создаются вручную автором и загружаются через защищённую админ-панель внутри приложения. Пользователи получают доступ к текстовым саммари, аудиоверсиям и карточкам ключевых идей, с возможностью скачивания для полноценного офлайн-доступа.

### 1.2. Целевая аудитория

- Предприниматели и менеджеры 25–45 лет
- Студенты и самоучки, стремящиеся к развитию
- Люди, у которых нет времени читать целые книги
- Русскоязычная аудитория, не владеющая английским для Blinkist/Shortform

### 1.3. Ключевые преимущества

1. Цена в 2–3 раза ниже Smart Reading
2. Полноценный офлайн-доступ (текст + аудио) — ключевое отличие от конкурентов
3. Нативная производительность на всех платформах благодаря Flutter
4. Единая кодовая база: iOS, Android, Web

---

## 2. Дизайн-концепция

### 2.1. Стиль: «Warm Brutalism» — тёплый минимализм с характером

Вместо стандартного Material-дизайна с мягкими тенями и скруглениями, приложение использует **жёсткий, графичный стиль** с акцентом на типографику и контраст. Вдохновение: Apple Books + Readwise + брутализм в вебе.

### 2.2. Палитра цветов

| Роль | Цвет | HEX |
|------|-------|-----|
| Primary (Акцент) | Терракотовый | `#C05621` |
| Primary variant | Тёмная глина | `#9C4221` |
| Secondary | Тёплый жёлтый | `#D69E2E` |
| Background (светлая тема) | Кремовый | `#FFFAF0` |
| Surface | Песочный | `#FEFCF3` |
| On Background | Почти чёрный | `#1A202C` |
| On Surface (secondary text) | Тёплый серый | `#718096` |
| Error | Приглушённый красный | `#C53030` |
| Success | Оливковый | `#38A169` |
| Card border | Песочная рамка | `#E2D8C3` |

**Тёмная тема:**

| Роль | Цвет | HEX |
|------|-------|-----|
| Background | Тёмный графит | `#1A1A2E` |
| Surface | Чуть светлее | `#232340` |
| Primary | Светлая терракота | `#ED8936` |
| On Background | Кремовый текст | `#FEFCF3` |
| On Surface (secondary) | Приглушённый | `#A0AEC0` |

### 2.3. Типографика

- **Заголовки:** `Playfair Display` — элегантная антиквенная гарнитура, создаёт ощущение «книжности»
- **Основной текст:** `Source Sans 3` — чистый, хорошо читаемый гротеск
- **Моноширинный / UI-элементы:** `JetBrains Mono` (для счётчиков, таймеров, кода)

| Элемент | Шрифт | Размер | Вес |
|---------|-------|--------|-----|
| H1 (заголовок экрана) | Playfair Display | 28sp | Bold |
| H2 (секция) | Playfair Display | 22sp | SemiBold |
| H3 (подзаголовок) | Source Sans 3 | 18sp | SemiBold |
| Body | Source Sans 3 | 16sp | Regular |
| Caption | Source Sans 3 | 13sp | Regular |
| Button | Source Sans 3 | 15sp | SemiBold |
| Reader text | Source Serif 4 | 18–24sp (настраивается) | Regular |

### 2.4. Компоненты дизайна

**Карточки книг:**
- Прямоугольные с минимальными скруглениями (`borderRadius: 4px`)
- Тонкая рамка (`1px solid #E2D8C3`) вместо теней
- При наведении/нажатии — лёгкий сдвиг (`translate`) вместо elevation
- Обложка книги занимает ~60% высоты карточки

**Кнопки:**
- Primary: залитые терракотовым, скруглённые углы `6px`, uppercase text
- Secondary: outline с терракотовой рамкой
- Ghost: только текст, без фона
- Все кнопки без теней — плоский, графичный стиль

**Chips / Теги:**
- Прямоугольные (`borderRadius: 4px`), с тонкой рамкой
- Активный: залит терракотовым, белый текст
- Неактивный: прозрачный, терракотовая рамка

**Навигация:**
- Нижняя панель: 5 вкладок, минималистичные line-иконки
- Без тени — только верхняя разделительная линия (`1px`)
- Активная вкладка: иконка заполненная + терракотовый цвет + точка-индикатор

**Ридер:**
- Три темы: Кремовая (по умолчанию), Тёмная, Белая
- Широкие поля (horizontal: 24px)
- Антиквенный шрифт для чтения (`Source Serif 4`)
- Прогресс-бар: тонкая линия сверху экрана

**Аудиоплеер:**
- Мини-плеер: узкая полоса над нижней навигацией
- Полноэкранный: обложка книги крупно, прогресс-бар в стиле виниловой пластинки (круговой)
- Управление скоростью: горизонтальный слайдер

### 2.5. Иконки

- Набор: **Phosphor Icons** (тонкие, геометричные) — пакет `phosphor_flutter`
- Стиль: Thin (1.5px stroke) в обычном состоянии, Fill при выборе
- Цвет: `#718096` неактивные, `#C05621` активные

### 2.6. Анимации и переходы

- Переходы между экранами: `SharedAxisTransition` (Material Motion)
- Появление карточек: `FadeIn` + лёгкий `SlideUp` (100ms stagger)
- Pull-to-refresh: кастомный индикатор в стиле книжной страницы
- Skeleton-loading: мерцание тёплого песочного цвета (не серого)
- Микро-анимации: иконки сердца (лайк), прогресс чтения

---

## 3. Функциональные требования

### 3.1. Пользовательская часть

#### 3.1.1. Главная страница (`HomeScreen`)

- **Приветствие** — «Доброе утро, {имя}» с учётом времени суток
- **Баннер** — swipeable карусель с акциями и подборками (PageView + dots indicator)
- **Секция «Продолжить чтение»** — горизонтальный список незаконченных саммари с прогресс-баром на обложке
- **Подборки по категориям** — горизонтальные ряды (бизнес, психология, здоровье, продуктивность и др.)
- **Новинки** — последние добавленные саммари
- **Популярное** — по количеству просмотров / рейтингу
- **Персональные рекомендации** — на основе истории чтения (для Pro-пользователей)

#### 3.1.2. Каталог и поиск (`SearchScreen`)

- **Поиск** — полнотекстовый по названию, автору, тегам (Supabase full-text search)
- **Фильтры** — категория (chips), время чтения, рейтинг, новизна
- **Результаты** — сетка карточек книг (обложка + название + автор + время чтения)
- **Debounce** поиска — 300ms задержка перед запросом
- **История поиска** — последние 10 запросов (Hive)

#### 3.1.3. Страница саммари (`BookDetailScreen`)

**Мета-информация:**
- Обложка книги (крупная, 60% ширины экрана)
- Название (Playfair Display, Bold)
- Автор
- Время чтения (мин) / время прослушивания (мин)
- Количество просмотров
- Рейтинг (звёзды)

**Теги категорий** — горизонтальный Wrap с chips

**Блок «О книге»** — краткое описание + разворачиваемый текст (ExpansionTile)

**Блок «Зачем читать?»** — 3–5 пунктов с иконками-маркерами

**Блок «Об авторе»** — краткая биография с аватаром (если есть)

**Блок «Ключевые мысли»** — горизонтальная карусель из 5–10 карточек:
- Каждая карточка: номер + заголовок + текст
- Snap-скролл с индикатором позиции
- Фиксированная высота 200px, ширина 85% экрана

**Sticky-кнопки внизу экрана:**
- «Читать» (primary) — открывает ридер
- «Слушать» (secondary) — открывает аудиоплеер
- «Скачать» (icon button) — загрузка для офлайн-доступа

**Секция «С этим саммари читают»** — горизонтальный ряд похожих книг

#### 3.1.4. Ридер (`ReaderScreen`)

- **Рендеринг** — Markdown через `flutter_markdown` с кастомной стилизацией
- **Прогресс чтения** — тонкий прогресс-бар сверху + процент, сохраняется автоматически в Supabase
- **Настройки (BottomSheet):**
  - Размер шрифта (слайдер 14–28sp)
  - Тема (Кремовая / Тёмная / Белая)
  - Межстрочный интервал (1.4 / 1.6 / 1.8 / 2.0)
  - Шрифт чтения (Source Serif 4 / Source Sans 3 / Literata)
- **Выделение текста** — long press → контекстное меню → сохранить цитату с выбором цвета
- **Оглавление** — drawer слева с быстрой навигацией по заголовкам H2
- **Офлайн-режим** — баннер «Вы читаете офлайн» при отсутствии сети, контент из Hive

#### 3.1.5. Аудиоплеер (`AudioPlayerScreen`)

**Мини-плеер (persistent):**
- Узкая полоса над нижней навигацией (высота 64px)
- Обложка (миниатюра) + название + кнопка play/pause + прогресс-линия
- Тап → раскрытие в полноэкранный плеер (Hero-анимация)

**Полноэкранный плеер:**
- Обложка книги крупно (с blur-фоном из цветов обложки)
- Прогресс: линейный SeekBar
- Управление: rewind 15s / play-pause / forward 15s
- Скорость воспроизведения (0.5x – 2.0x), шаг 0.25
- Таймер сна (15 / 30 / 45 / 60 мин / конец главы)
- Название текущей главы (если размечено)

**Технические требования:**
- Библиотека: `just_audio` (уже в проекте)
- Фоновое воспроизведение (через audio_service для мобильных)
- Синхронизация позиции между устройствами (Supabase `user_progress.audio_position`)
- Скачивание аудио для офлайн (сохранение в Hive / локальный файл)

#### 3.1.6. Офлайн-режим и загрузки

**Ключевая фича — полноценный офлайн-доступ.**

**Реализация:**
- Кнопка «Скачать» на странице каждого саммари — загружает текст + аудио
- Раздел «Мои загрузки» (`DownloadsScreen`) — список скачанных саммари
- Индикатор процесса загрузки (CircularProgressIndicator с процентом)
- Статус скачивания: иконка облака (не скачано / загрузка / скачано / ошибка)
- Общий размер загрузок + индикатор заполнения хранилища
- Удаление отдельных загрузок свайпом (Dismissible)
- Автоудаление старых загрузок при превышении лимита (настраиваемый, по умолчанию 500 МБ)

**Техническая реализация:**
- Текст саммари (markdown) — сохраняется в Hive (малый объём, ~5–50 КБ)
- Аудиофайлы — скачиваются через HTTP, сохраняются в app documents directory
- Обложки — кешируются через `cached_network_image` (автоматически)
- Метаданные скачанных книг — Hive box `downloads`
- Мониторинг сети — `connectivity_plus` (уже в проекте)
- При потере сети — автоматический роутинг на экран загрузок
- При восстановлении сети — синхронизация прогресса чтения

**Для Web/PWA:**
- Service Worker регистрируется в `flutter_app/web/index.html`
- Аудио кешируется через Cache API / IndexedDB
- Текст кешируется через стандартный Flutter web cache

#### 3.1.7. Профиль и полки

**Профиль (`ProfileScreen`):**
- Аватар + имя + email
- Тип подписки (Free / Pro) с кнопкой «Улучшить»
- Статистика: прочитано книг, дней подряд, общее время чтения

**Полки (`ShelvesScreen`):**
- Табы: Избранное / Прочитано / Хочу прочитать
- Сетка карточек книг в каждой полке
- Добавление книги на полку — иконка сердца / закладки на карточке

**Мои загрузки:**
- Табы или переключатель: Текст / Аудио / Всё
- Для каждой загрузки: обложка, название, размер, дата скачивания
- Общий объём загрузок / лимит
- Кнопка «Очистить всё»

**Цитаты и заметки:**
- Список сохранённых выделений с цветовой маркировкой
- Группировка по книгам
- Экспорт цитат (копирование / поделиться)

**Настройки:**
- Тема приложения (светлая / тёмная / системная)
- Лимит хранилища загрузок
- Уведомления
- Выход из аккаунта

### 3.2. Загрузка контента (админ-панель)

Контент создаётся вручную автором проекта. Админ-панель — внутри приложения, доступна только пользователю с ролью `admin`.

#### 3.2.1. Список книг (`AdminBookListScreen`)

- Таблица / список всех книг с фильтром по статусу (черновик / опубликовано / архив)
- Поиск по названию
- Кнопки: добавить книгу, редактировать, удалить (с подтверждением)

#### 3.2.2. Форма книги (`AdminBookFormScreen`)

**Основная информация:**
- Название книги (обязательно)
- Автор(ы) (обязательно)
- Обложка — загрузка изображения через `file_picker` (jpg/png/webp, до 5 МБ)
- Категории — мультиселект из существующих + добавление новых
- Теги — chips с возможностью добавления
- Описание книги (textarea)
- Блок «Зачем читать?» — динамический список из 3–5 текстовых полей (+ / −)
- Об авторе (textarea)
- Статус: Черновик / Опубликовано / Архив (dropdown)

**Текст саммари:**
- Загрузка файла (Markdown / TXT) через `file_picker` или ввод в текстовый редактор
- Поддержка Markdown: заголовки (##), **выделение**, > цитаты, списки
- Предпросмотр — рендеринг через `flutter_markdown` (как в ридере)
- Время чтения — автоматический расчёт: `words / 200` (средняя скорость на русском)

**Аудио:**
- Загрузка файла (MP3/M4A, до 100 МБ) через `file_picker`
- Автоопределение длительности (парсинг заголовков файла или серверная функция)
- Файл загружается в Supabase Storage (bucket: `audio`)
- Прогресс загрузки с возможностью отмены

**Ключевые идеи:**
- Динамический список из 5–10 карточек
- Каждая: порядковый номер + заголовок + текст
- ReorderableListView для drag-and-drop сортировки
- Предпросмотр карусели

#### 3.2.3. Управление коллекциями (`AdminCollectionsScreen`)

- Создание/редактирование тематических подборок
- Название + описание + обложка
- Добавление книг в подборку (поиск + мультиселект)
- Сортировка подборок (порядок отображения на главной)
- Пометка «Featured» — показывается в баннере на главной

#### 3.2.4. Управление категориями (`AdminCategoriesScreen`)

- CRUD категорий
- Иконка для каждой категории (выбор из Phosphor Icons)
- Порядок отображения

---

## 4. Технический стек

### 4.1. Flutter-стек

| Компонент | Технология | Версия |
|-----------|------------|--------|
| **Framework** | Flutter | 3.x (stable) |
| **Язык** | Dart | 3.2+ |
| **State Management** | Riverpod | 2.5+ (`flutter_riverpod`) |
| **Навигация** | GoRouter | 14.x |
| **Backend / БД** | Supabase | `supabase_flutter` 2.5+ |
| **Офлайн-хранилище** | Hive | 2.2+ (`hive_flutter`) |
| **Аудио** | just_audio | 0.9+ |
| **Markdown** | flutter_markdown | 0.7+ |
| **Сеть** | connectivity_plus | 6.0+ |
| **Изображения** | cached_network_image | 3.3+ |
| **Шрифты** | google_fonts | 6.2+ |
| **Файлы** | file_picker | 8.0+ |
| **Shimmer** | shimmer | 3.0+ |
| **Иконки** | phosphor_flutter | 2.1+ |

### 4.2. Backend — Supabase

| Компонент | Описание |
|-----------|----------|
| **Auth** | Email + пароль, Google OAuth, Apple Sign-In |
| **Database** | PostgreSQL с Row-Level Security |
| **Storage** | Бакеты: `covers` (изображения), `audio` (MP3/M4A), `summaries` (MD-файлы) |
| **Edge Functions** | Webhook'и для ЮKassa, расчёт рекомендаций, обработка платежей |
| **Realtime** | Подписка на обновления прогресса между устройствами |

### 4.3. Платежи

| Рынок | Провайдер | Интеграция |
|-------|-----------|------------|
| Россия | ЮKassa | Edge Function webhook + redirect flow |
| Международный | Stripe | Edge Function webhook |
| iOS | In-App Purchase | `in_app_purchase` пакет (Apple требует для подписок) |
| Android | Google Play Billing | `in_app_purchase` пакет |

### 4.4. CI/CD и деплой

| Платформа | Инструмент |
|-----------|------------|
| Web | GitHub Actions → Firebase Hosting / Vercel |
| Android | GitHub Actions → Google Play (Fastlane) |
| iOS | GitHub Actions → TestFlight / App Store (Fastlane) |
| Тесты | `flutter test`, `integration_test` |

---

## 5. Структура базы данных (Supabase / PostgreSQL)

### 5.1. Основные таблицы

```sql
-- Профили пользователей (расширение Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro_monthly', 'pro_yearly')),
  subscription_expires_at TIMESTAMPTZ,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  reads_count INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  total_reading_time_min INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Книги
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  about_author TEXT,
  description TEXT,
  cover_url TEXT,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  read_time_min INT,
  listen_time_min INT,
  rating NUMERIC(3,2) DEFAULT 0,
  views_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  why_read JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Саммари (текст + аудио для книги)
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  content TEXT, -- Markdown-текст саммари
  audio_url TEXT,
  audio_size_bytes BIGINT,
  audio_duration_sec INT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ключевые идеи
CREATE TABLE key_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Прогресс чтения / прослушивания
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  last_scroll_position NUMERIC DEFAULT 0,
  audio_position_sec NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Полки пользователя
CREATE TABLE user_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  shelf_type TEXT NOT NULL CHECK (shelf_type IN ('favorite', 'read', 'want_to_read')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id, shelf_type)
);

-- Выделения / цитаты
CREATE TABLE user_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  note TEXT,
  color TEXT DEFAULT 'yellow',
  position_start INT,
  position_end INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Загрузки (трекинг для аналитики, фактические данные на устройстве)
CREATE TABLE user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'audio', 'both')),
  size_bytes BIGINT DEFAULT 0,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Рейтинги
CREATE TABLE user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Коллекции / подборки
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  book_ids UUID[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Категории
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- имя Phosphor-иконки
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Платежи
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'RUB',
  payment_method TEXT, -- 'yukassa', 'stripe', 'apple', 'google'
  external_id TEXT, -- ID во внешней системе
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  subscription_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2. Row-Level Security (RLS)

```sql
-- Книги: все авторизованные видят published, admin видит всё
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published books visible to all" ON books FOR SELECT
  USING (status = 'published' OR auth.jwt() ->> 'role' = 'admin');

-- Прогресс: пользователь видит только свой
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own progress only" ON user_progress FOR ALL
  USING (auth.uid() = user_id);

-- Аналогично для user_shelves, user_highlights, user_downloads, user_ratings
```

---

## 6. Архитектура приложения

### 6.1. Структура проекта

```
flutter_app/lib/
├── main.dart                    # Точка входа
├── app.dart                     # MaterialApp + Router + Theme
│
├── core/
│   ├── constants.dart           # Supabase URL/Key, лимиты
│   ├── theme.dart               # AppTheme (light/dark + reader themes)
│   ├── router.dart              # GoRouter с guard'ами
│   ├── extensions.dart          # Extension-методы для BuildContext, DateTime и пр.
│   └── typography.dart          # Текстовые стили (Playfair + Source Sans)
│
├── models/
│   ├── book.dart                # Book model + fromJson/toJson
│   ├── summary.dart             # Summary model
│   ├── key_idea.dart            # KeyIdea model
│   ├── user_progress.dart       # UserProgress model
│   ├── user_shelf.dart          # UserShelf model
│   ├── user_highlight.dart      # UserHighlight model
│   ├── user_download.dart       # UserDownload model
│   ├── user_rating.dart         # UserRating model
│   ├── collection.dart          # Collection model
│   ├── profile.dart             # Profile model
│   ├── enums.dart               # BookStatus, ShelfType, SubscriptionType, etc.
│   └── push_subscription.dart   # PushSubscription model
│
├── providers/
│   ├── auth_provider.dart       # AuthState + Supabase Auth
│   ├── book_providers.dart      # Books list, book detail, search
│   ├── user_data_providers.dart # Progress, shelves, highlights
│   ├── offline_providers.dart   # Download state, storage usage
│   ├── reader_settings_provider.dart  # Font size, theme, line height
│   ├── subscription_provider.dart     # Subscription status, access check
│   ├── access_control_provider.dart   # Freemium gates
│   ├── connectivity_provider.dart     # Online/offline status
│   ├── recommendations_provider.dart  # Personalized recs
│   ├── categories_provider.dart       # Categories CRUD
│   ├── admin_provider.dart            # Admin operations
│   └── push_provider.dart             # Push notifications
│
├── services/
│   ├── supabase_service.dart    # Supabase client wrapper
│   ├── book_service.dart        # CRUD книг, поиск, фильтрация
│   ├── progress_service.dart    # Сохранение/загрузка прогресса
│   ├── shelf_service.dart       # Операции с полками
│   ├── highlight_service.dart   # CRUD цитат
│   ├── push_service.dart        # Push-уведомления
│   ├── pwa_service.dart         # PWA install prompt (web)
│   └── toast_service.dart       # Snackbar/Toast уведомления
│
├── offline/
│   ├── download_service.dart    # Скачивание текста + аудио
│   ├── offline_storage_service.dart  # Hive операции, лимиты хранилища
│   ├── sync_service.dart        # Синхронизация прогресса при восстановлении сети
│   ├── sync_action.dart         # Модель отложенного действия
│   ├── hive_boxes.dart          # Названия Hive-боксов
│   └── connectivity_sync_handler.dart  # Riverpod провайдер для auto-sync
│
├── screens/
│   ├── home/
│   │   └── home_screen.dart
│   ├── search/
│   │   └── search_screen.dart
│   ├── book_detail/
│   │   └── book_detail_screen.dart
│   ├── reader/
│   │   └── reader_screen.dart
│   ├── audio_player/
│   │   └── audio_player_screen.dart
│   ├── shelves/
│   │   └── shelves_screen.dart
│   ├── downloads/
│   │   └── downloads_screen.dart
│   ├── profile/
│   │   └── profile_screen.dart
│   ├── offline_reader/
│   │   └── offline_reader_screen.dart
│   ├── auth/
│   │   ├── auth_screen.dart
│   │   └── reset_password_screen.dart
│   └── admin/
│       ├── admin_book_list_screen.dart
│       ├── admin_book_form_screen.dart
│       ├── admin_collections_screen.dart
│       └── admin_categories_screen.dart
│
└── widgets/
    ├── book_card.dart           # Карточка книги (в каталоге, на главной)
    ├── continue_card.dart       # Карточка «Продолжить чтение» с прогрессом
    ├── section_header.dart      # Заголовок секции с кнопкой «Все»
    ├── shimmer_loading.dart     # Skeleton-загрузка тёплого цвета
    ├── paywall_prompt.dart      # Модалка «Перейти на Pro»
    └── layout/
        ├── app_shell.dart       # Scaffold с bottom nav + mini player
        └── bottom_nav.dart      # Нижняя навигация
```

### 6.2. Архитектурные паттерны

**State Management — Riverpod:**
- `StateNotifierProvider` для изменяемого состояния (auth, player, reader settings)
- `FutureProvider` для загрузки данных из Supabase
- `StreamProvider` для realtime-подписок
- `Provider` для computed-значений и сервисов

**Слои:**
```
UI (Screens/Widgets)
     ↓ ref.watch / ref.read
Providers (Riverpod)
     ↓
Services (business logic)
     ↓
Supabase Client / Hive / just_audio
```

**Offline-first подход:**
1. При загрузке данных → сначала проверяем Hive (кеш), отдаём мгновенно
2. Параллельно запрашиваем Supabase (если online)
3. При получении свежих данных → обновляем Hive + UI
4. При офлайн → работаем только с Hive
5. Действия пользователя (прогресс, лайки) → записываем в Hive + queue
6. При восстановлении сети → sync queue → Supabase

---

## 7. Модель монетизации

### 7.1. Тарифные планы

| Параметр | Free | Pro (месяц) | Pro (год) |
|----------|------|-------------|-----------|
| **Цена** | 0 ₽ | 200 ₽/мес | 1 200 ₽/год (100 ₽/мес) |
| **Полные саммари** | 5 штук | Безлимит | Безлимит |
| **Превью саммари** | Все (первые 20%) | Все (полные) | Все (полные) |
| **Аудио** | Нет | Да | Да |
| **Офлайн-загрузка** | Нет | До 20 книг | Безлимит |
| **Ключевые идеи** | Да | Да | Да |
| **Сохранение цитат** | До 10 | Безлимит | Безлимит |
| **Персон. рекомендации** | Нет | Да | Да |

### 7.2. Логика ограничений (AccessControlProvider)

```dart
// Проверка доступа к полному тексту
bool canReadFull(Book book) {
  if (subscription.isActive) return true;
  if (freeReadsUsed < freeReadsLimit) return true;
  return false;
}

// Проверка доступа к аудио
bool canListen() => subscription.isActive;

// Проверка доступа к скачиванию
bool canDownload() => subscription.isActive;
int get downloadsLeft => subscription.isYearly ? 999 : max(0, 20 - downloadsCount);
```

### 7.3. Paywall

При попытке доступа к заблокированному контенту — показываем `PaywallPrompt` (BottomSheet):
- Заголовок: «Откройте полный доступ»
- Перечисление преимуществ Pro
- Два варианта: месячная / годовая подписка
- Кнопка «Попробовать бесплатно» (если первая подписка — 7 дней trial)

---

## 8. Ключевые экраны (детальное описание UI)

### 8.1. Главная

```
┌──────────────────────────────┐
│  Доброе утро, Александр       │
│  ─────────────────────────── │
│ ┌──────────────────────────┐ │
│ │  [Баннер: Подборка       │ │
│ │   "Книги для лидеров"]   │ │
│ │          • ○ ○            │ │
│ └──────────────────────────┘ │
│                              │
│  Продолжить чтение     Все → │
│ ┌─────┐ ┌─────┐ ┌─────┐     │
│ │cover│ │cover│ │cover│ ►    │
│ │─────│ │─────│ │─────│      │
│ │▓▓▓░░│ │▓▓░░░│ │▓░░░░│     │
│ │64%  │ │38%  │ │12%  │     │
│ └─────┘ └─────┘ └─────┘     │
│                              │
│  Бизнес               Все → │
│ ┌─────┐ ┌─────┐ ┌─────┐     │
│ │     │ │     │ │     │ ►    │
│ │cover│ │cover│ │cover│      │
│ │     │ │     │ │     │      │
│ │Title│ │Title│ │Title│      │
│ │Auth.│ │Auth.│ │Auth.│      │
│ └─────┘ └─────┘ └─────┘     │
│                              │
│  Новинки              Все → │
│  ...                         │
│                              │
├──────────────────────────────┤
│ 🏠  🔍  📚  ⬇️  👤          │
│Home Search Shelves DL  Prof. │
└──────────────────────────────┘
```

### 8.2. Страница книги

```
┌──────────────────────────────┐
│  ← Назад                     │
│                              │
│      ┌──────────────┐        │
│      │              │        │
│      │   Обложка    │        │
│      │   книги      │        │
│      │              │        │
│      └──────────────┘        │
│                              │
│  Атомные привычки            │
│  Джеймс Клир                 │
│                              │
│  ⏱ 12 мин  🎧 18 мин        │
│  ⭐ 4.8    👁 1.2K           │
│                              │
│  ┌────────┐ ┌──────────┐     │
│  │Привычки│ │Мышление  │     │
│  └────────┘ └──────────┘     │
│                              │
│  О книге                     │
│  Практическое руководство    │
│  по формированию хороших...  │
│  [Развернуть]                │
│                              │
│  Зачем читать?               │
│  ✦ Научитесь строить системы │
│  ✦ Поймёте, как работают...  │
│  ✦ Получите пошаговый план.. │
│                              │
│  Об авторе                   │
│  Джеймс Клир — писатель...   │
│                              │
│  Ключевые мысли              │
│ ┌──────────────────────┐     │
│ │  1. Маленькие         │◄►  │
│ │  привычки приводят    │    │
│ │  к большим результатам│    │
│ │  ─────────────────── │     │
│ │  Улучшение на 1% каж-│    │
│ │  дый день за год...   │    │
│ └──────────────────────┘     │
│         • ○ ○ ○ ○            │
│                              │
│  С этим саммари читают       │
│  ┌─────┐ ┌─────┐ ┌─────┐    │
│  │cover│ │cover│ │cover│ ►   │
│  └─────┘ └─────┘ └─────┘    │
│                              │
├──────────────────────────────┤
│ [  Читать  ] [Слушать] [⬇]  │
└──────────────────────────────┘
```

### 8.3. Ридер

```
┌──────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 64%   │
│  ← Назад    ≡ Оглавление  ⚙ │
│                              │
│                              │
│   Глава 2: Как привычки      │
│   формируют вашу личность    │
│                              │
│   Многие люди начинают       │
│   менять свои привычки,      │
│   фокусируясь на том,        │
│   чего они хотят достичь.    │
│   Это приводит к привычкам,  │
│   основанным на результате.  │
│                              │
│   ██████████████████████     │
│   █ Ключевой вывод:    █     │
│   █ Настоящие изменения █    │
│   █ начинаются с        █    │
│   █ идентичности.       █    │
│   ██████████████████████     │
│                              │
│   Альтернатива — строить     │
│   привычки, основанные на    │
│   идентичности. При таком    │
│   подходе вы начинаете с     │
│   того, кем хотите стать.    │
│                              │
│                              │
│                              │
│                              │
└──────────────────────────────┘
```

### 8.4. Аудиоплеер (полноэкранный)

```
┌──────────────────────────────┐
│  ▼ Свернуть                  │
│                              │
│                              │
│      ┌──────────────┐        │
│      │              │        │
│      │              │        │
│      │   Обложка    │        │
│      │   книги      │        │
│      │   (крупно)   │        │
│      │              │        │
│      │              │        │
│      └──────────────┘        │
│                              │
│  Атомные привычки            │
│  Джеймс Клир                 │
│                              │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░       │
│  05:42 ──────────── 18:30    │
│                              │
│                              │
│     ⏪15    ▶️     ⏩15       │
│                              │
│                              │
│  1.0x    🔉 ━━━━━━━━ 🔊     │
│                              │
│   ⬇️ Скачать    💤 Таймер   │
│                              │
└──────────────────────────────┘
```

---

## 9. Нефункциональные требования

### 9.1. Производительность

- Время первой загрузки (web): < 3 сек на 3G
- Время открытия книги: < 500ms (с кешем)
- Размер Flutter web bundle: < 5 МБ (gzipped)
- FPS: 60fps на средних устройствах
- Lazy-loading изображений и списков (ListView.builder)

### 9.2. Надёжность

- Graceful degradation при потере сети
- Retry с exponential backoff для API-запросов
- Error boundaries на уровне каждого экрана
- Crash reporting (Firebase Crashlytics / Sentry)

### 9.3. Безопасность

- Row-Level Security (RLS) на все таблицы Supabase
- JWT-авторизация для всех API-запросов
- Валидация загружаемых файлов (тип, размер)
- Sanitization Markdown-контента перед рендерингом
- HTTPS only

### 9.4. Доступность (Accessibility)

- Semantic labels на всех интерактивных элементах
- Поддержка TalkBack (Android) и VoiceOver (iOS)
- Минимальный контраст текста 4.5:1 (WCAG AA)
- Масштабирование шрифтов (уважение системных настроек)

### 9.5. Локализация

- Основной язык: русский
- Все строки вынесены в отдельные файлы (intl / easy_localization)
- Подготовка к добавлению английского языка в будущем

---

## 10. План разработки

### 10.1. Фаза 0: Настройка (1 неделя)

1. Инициализация Flutter-проекта, настройка CI/CD
2. Настройка Supabase: таблицы, RLS-политики, Storage-бакеты
3. Базовая тема (Warm Brutalism), подключение шрифтов
4. Навигация (GoRouter) + базовый AppShell с нижней навигацией
5. Авторизация (email + Google)

### 10.2. Фаза 1: MVP (4–5 недель)

1. **Неделя 1–2:** Главная + Каталог + Поиск
   - Карточки книг, горизонтальные списки, баннер
   - Поиск с debounce, фильтры по категориям
   - Shimmer-загрузка

2. **Неделя 2–3:** Страница книги + Ридер
   - BookDetailScreen со всеми блоками
   - ReaderScreen с Markdown-рендерингом
   - Сохранение прогресса чтения
   - Настройки ридера (шрифт, тема, размер)

3. **Неделя 3–4:** Админ-панель (загрузка контента)
   - Форма создания/редактирования книги
   - Загрузка обложек, аудио, текста саммари
   - Управление ключевыми идеями
   - Управление категориями и коллекциями

4. **Неделя 4–5:** Полки + Профиль
   - Избранное / Прочитано / Хочу прочитать
   - Профиль со статистикой
   - Freemium-логика (5 бесплатных саммари)

5. **Наполнение:** 30–50 саммари вручную

### 10.3. Фаза 2: Аудио + Платежи (3–4 недели)

1. **Неделя 1–2:** Аудиоплеер
   - Мини-плеер + полноэкранный
   - Управление скоростью, перемотка, таймер сна
   - Сохранение позиции прослушивания

2. **Неделя 2–3:** Платежи
   - Интеграция ЮKassa (Edge Function)
   - Paywall UI
   - Управление подпиской в профиле

3. **Неделя 3–4:** Доработки
   - Карточки ключевых идей (карусель)
   - Подборки и рекомендации на главной
   - Расширить каталог до 100+ саммари

### 10.4. Фаза 3: Офлайн (3–4 недели)

1. **Неделя 1–2:** Скачивание контента
   - DownloadService: скачивание текста в Hive, аудио на диск
   - Индикаторы загрузки, статусы
   - Экран «Мои загрузки» с управлением

2. **Неделя 2–3:** Офлайн-режим
   - ConnectivitySyncHandler: обнаружение сети
   - OfflineReaderScreen: чтение из Hive
   - Offline AudioPlayer: воспроизведение локальных файлов
   - Баннер «Вы читаете офлайн»

3. **Неделя 3–4:** Синхронизация
   - SyncService: очередь отложенных действий
   - Автоматическая синхронизация при восстановлении сети
   - PWA Service Worker для web-версии
   - Лимиты хранилища, автоочистка

### 10.5. Фаза 4: Полировка и запуск (2–3 недели)

1. Цитаты и заметки (выделение текста + сохранение)
2. Push-уведомления (новые саммари, напоминания)
3. Тестирование (unit + widget + integration)
4. Оптимизация производительности
5. Публикация в Google Play + App Store + Web

### 10.6. Фаза 5: Рост (ongoing)

1. AI-персонализация рекомендаций
2. Геймификация (серии чтения, ачивки, уровни)
3. Социальные функции (поделиться цитатой)
4. A/B-тестирование paywall'а
5. Расширение каталога: 300+ саммари

---

## 11. Тестирование

### 11.1. Unit-тесты

- Модели: `fromJson` / `toJson` для всех моделей
- Сервисы: бизнес-логика (access control, download limits, search)
- Провайдеры: состояние (auth, subscription, offline)

### 11.2. Widget-тесты

- BookCard: отображение данных, тап
- ReaderScreen: переключение тем, изменение шрифта
- PaywallPrompt: отображение планов, тап на кнопку
- AudioPlayer: управление, отображение прогресса

### 11.3. Integration-тесты

- Полный flow: регистрация → каталог → чтение → сохранение прогресса
- Офлайн flow: скачать → отключить сеть → прочитать → включить сеть → синхронизация
- Admin flow: создание книги → загрузка контента → публикация → видимость в каталоге

---

## 12. Аналитика

### 12.1. События для трекинга

| Событие | Параметры |
|---------|-----------|
| `book_opened` | book_id, source (home/search/shelf) |
| `reading_started` | book_id |
| `reading_progress` | book_id, percent (каждые 25%) |
| `reading_completed` | book_id, duration_min |
| `audio_started` | book_id |
| `audio_completed` | book_id |
| `book_downloaded` | book_id, content_type, size_mb |
| `book_added_to_shelf` | book_id, shelf_type |
| `highlight_saved` | book_id |
| `search_performed` | query, results_count |
| `paywall_shown` | source, trigger |
| `subscription_started` | plan, method |
| `subscription_cancelled` | plan, reason |

### 12.2. Инструменты

- **Firebase Analytics** — основная аналитика (бесплатно, кросс-платформенно)
- **Yandex Metrica** — web-версия, SEO-аналитика (для РФ)
- **PostHog** — product analytics, funnels, feature flags (опционально)

---

## 13. Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Авторские права на книги | Средняя | Высокое | Саммари = производное произведение. Консультация с юристом. Публиковать disclaimer |
| Медленное наполнение каталога | Высокая | Высокое | Начать с топ-50 книг, темп 5–10 саммари/неделю |
| Отклонение App Store / Google Play | Средняя | Высокое | Убедиться в compliance: нет обхода In-App Purchase, privacy policy, content rating |
| Большой размер Flutter web bundle | Средняя | Среднее | Tree-shaking, deferred loading, canvaskit vs html renderer |
| Переполнение хранилища устройств | Низкая | Среднее | Лимит 500 МБ, автоочистка, уведомления |
| Низкий органический трафик | Высокая | Высокое | SEO (web), ASO (stores), Telegram-канал, контент-маркетинг |
| Конкуренция Smart Reading | Средняя | Среднее | Ниже цена, офлайн-доступ, лучший UX, Flutter-нативность |

---

## 14. Ключевые метрики успеха

**Фаза 1 — MVP (месяц 1–2):**
- 500+ регистраций
- 50+ WAU (weekly active users)
- 30–50 саммари в каталоге
- Средний рейтинг > 4.0

**Фаза 2 — V1.0 (месяц 3–4):**
- 2 000+ пользователей
- 200+ подписчиков Pro
- 100+ саммари
- Retention D7 > 30%

**Фаза 3 — V1.5 (месяц 5–6):**
- 5 000+ пользователей
- 30%+ Pro-пользователей используют офлайн
- 200+ саммари
- NPS > 40

**Фаза 4 — V2.0 (месяц 7–10):**
- 10 000+ пользователей
- 1 000+ подписчиков
- 300+ саммари
- Выход на окупаемость
- Присутствие в App Store + Google Play

---

## Приложение A: Отличия от React-версии ТЗ

| Аспект | Оригинал (React) | Эта версия (Flutter) |
|--------|-------------------|----------------------|
| **Платформы** | Web (PWA) only | iOS + Android + Web |
| **UI Framework** | React + Tailwind + shadcn/ui | Flutter + Material 3 + custom theme |
| **Дизайн** | Indigo (#6C5CE7), мягкие тени, скруглённые | Терракота (#C05621), жёсткие рамки, книжный стиль |
| **Шрифты** | Inter | Playfair Display + Source Sans 3 |
| **State** | React hooks / context | Riverpod |
| **Офлайн** | Service Worker + IndexedDB | Hive + local files + SW (web) |
| **Аудио** | HTML5 Audio API | just_audio (+ audio_service) |
| **Билд** | Lovable + Vite + Vercel | Flutter build + Fastlane + Firebase Hosting |
| **Магазины** | N/A | Google Play + App Store |
| **Платежи (мобильные)** | N/A | In-App Purchase (обязательно для iOS) |
