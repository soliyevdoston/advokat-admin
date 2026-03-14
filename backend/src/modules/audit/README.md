# Audit Logs modulini ulash

## 1) SQL ni ishga tushiring

`audit.sql` faylini Postgres bazangizda bir marta ishga tushiring.

## 2) Route ni root routerga ulang

Sizdagi asosiy route faylida:

```js
import auditRouter from "./modules/audit/audit.routes.js";

router.use("/audit-logs", auditRouter);
```

## 3) Frontend bilan mos endpointlar

Frontend hozir quyidagi endpointlarni ketma-ket sinab ko'radi:

- `/audit-logs`
- `/api/audit-logs`
- `/admin/audit-logs`
- `/logs/audit`

Eng sodda yo'l: backendda aynan `/audit-logs` ni oching.
