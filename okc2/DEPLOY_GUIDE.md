# 🥝 Kiwi Music — Полный гайд по запуску и деплою

---

## Что уже есть в проекте

| Компонент | Статус |
|-----------|--------|
| Авторизация (email + пароль) | ✅ Supabase Auth |
| База данных | ✅ Supabase (твой проект) |
| Музыка | ✅ Jamendo API (c01865fc) |
| Поиск треков | ✅ Реальный поиск |
| Плеер с кешем | ✅ Запоминает трек |
| KiwiFlow блок | ✅ Анимированный градиент |
| Ивенты | ✅ Из Supabase |

---

## ШАГ 1 — Настройка Supabase

### 1.1 Выполни SQL схему

1. Открой https://kswsvpnhnowvvakgfkjz.supabase.co
2. Слева: **SQL Editor → New query**
3. Вставь и выполни твой файл `kiwi_music_schema_fixed.sql`

### 1.2 Добавь триггер автосоздания профиля

В SQL Editor выполни:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.3 Выдай себе роль admin

После того как зарегистрируешься на сайте, выполни в SQL Editor:

```sql
-- Замени YOUR_EMAIL на свою почту
UPDATE profiles
SET role = 'admin'
WHERE email = 'YOUR_EMAIL@gmail.com';
```

### 1.4 Настрой Email (отправка кодов)

1. В Supabase: **Authentication → Email Templates**
2. Убедись что шаблоны на русском (можешь отредактировать)
3. **Authentication → Providers → Email**:
   - ✅ Enable Email provider — ON
   - Confirm email — по желанию (выключи для теста)

---

## ШАГ 2 — Локальный запуск

```bash
# Распакуй архив
cd app/

# Установи зависимости
npm install

# Запусти
npm run dev
```

Открой http://localhost:5173

---

## ШАГ 3 — Загрузка на GitHub

```bash
# Инициализируй git в папке app/
cd app/
git init
git add .
git commit -m "Kiwi Music — initial commit"

# Создай репозиторий на github.com (кнопка New Repository)
# Потом выполни (замени YOUR_USERNAME):
git remote add origin https://github.com/YOUR_USERNAME/kiwi-music.git
git push -u origin main
```

---

## ШАГ 4 — Деплой на Vercel

1. Открой https://vercel.com → **Add New → Project**
2. Выбери твой репозиторий `kiwi-music`
3. **Framework Preset**: Vite
4. **Root Directory**: `app` (важно! если у тебя структура app/)
5. В разделе **Environment Variables** добавь:

| Ключ | Значение |
|------|----------|
| `VITE_SUPABASE_URL` | `https://kswsvpnhnowvvakgfkjz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (полный ключ) |

6. Нажми **Deploy**

После деплоя получишь ссылку типа `https://kiwi-music-xxx.vercel.app`

---

## ШАГ 5 — Обновить Supabase URL

После деплоя на Vercel:

1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://kiwi-music-xxx.vercel.app`
3. **Redirect URLs**: добавь `https://kiwi-music-xxx.vercel.app/**`
4. Сохрани

---

## ШАГ 6 — Обновления (после изменений кода)

```bash
git add .
git commit -m "Update: описание изменений"
git push
```

Vercel автоматически передеплоит при каждом push в main.

---

## Структура файлов (что куда)

```
app/
├── src/
│   ├── lib/
│   │   ├── supabase.ts      ← все запросы к БД
│   │   └── jamendo.ts       ← музыкальное API
│   ├── hooks/
│   │   ├── useAuth.tsx      ← авторизация
│   │   └── usePlayer.tsx    ← плеер
│   ├── pages/
│   │   ├── AuthPage.tsx     ← страница входа/регистрации
│   │   ├── HomePage.tsx     ← главная
│   │   ├── SearchPage.tsx   ← поиск
│   │   └── ProfilePage.tsx  ← профиль
│   └── components/
│       ├── player/          ← MiniPlayer, FullPlayer
│       └── BottomNav.tsx    ← нижняя навигация
└── .env                     ← ключи (НЕ загружай в git!)
```

---

## Важно: .env не должен попасть в GitHub

Создай файл `.gitignore` в папке `app/`:

```
node_modules/
dist/
.env
.env.local
```

---

## Частые проблемы

**"Invalid API key"** — проверь VITE_SUPABASE_ANON_KEY в Vercel env vars

**Треки не играют** — Jamendo даёт прямые mp3 ссылки, они должны работать. Проверь консоль браузера.

**Не приходит email** — Supabase бесплатный план имеет лимит 3 письма/час. Для теста выключи подтверждение email.

**Профиль не создаётся** — убедись что выполнил SQL триггер из Шага 1.2
