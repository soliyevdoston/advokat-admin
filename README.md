# Advokat Admin Frontend

Admin panel backend API bilan to'liq ishlashga tayyor holatga keltirilgan.

## Sozlash

`.env` fayl:

```env
VITE_API_BASE_URL=https://advokat-1.onrender.com
VITE_ENABLE_LOCAL_FALLBACK=false
VITE_SOCKET_BASE_URL=https://advokat-1.onrender.com
VITE_SOCKET_PATH=/socket.io
```

## Ishga tushirish

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Muhim endpointlar

- `POST /auth/login` - email/parol bilan kirish
- `POST /users/create_admin` - admin yaratish
- `GET /users/` - foydalanuvchilar ro'yxati (admin)
- `GET /ping` - server holati
- `GET/POST /chats` - chatlar
- `GET /constitution`, `GET /constitution/sections`, `GET /constitution/pdf`, `GET /constitution/search`

