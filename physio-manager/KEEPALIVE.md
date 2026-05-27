# Keepalive de Supabase — Cómo configurarlo

Supabase pausa los proyectos del plan **gratuito** después de **7 días sin actividad**. Si tu proyecto se pausa, la app de Selah deja de funcionar hasta que tú vuelvas al dashboard de Supabase y lo reactives manualmente.

Para evitarlo, este repo incluye **3 capas de keepalive complementarias**:

| Capa | Cuándo corre | Requiere setup |
|------|--------------|----------------|
| 1️⃣ **Frontend heartbeat** (`app.js`) | Cuando alguien abre la PWA + cada 6h mientras esté abierta | Ninguno (ya activo) |
| 2️⃣ **GitHub Actions cron** | Automático cada 5 días, sin importar si alguien usa la app | Configurar 2 secrets ⬇ |
| 3️⃣ **Script manual** (`ping_supabase.js`) | Cuando tú lo corres | Variables de entorno locales |

---

## 1️⃣ Frontend heartbeat (ya activo)

Cada vez que un usuario abre `https://pyshiomanager.online`, el código en `app.js` hace un ping ligero a Supabase (cuenta filas de `patients`) y luego repite el ping cada 6 horas mientras la pestaña esté abierta.

**No requiere configuración**. Ya está activo.

Si quieres ver los pings en acción, abre la consola del navegador (F12) y verás:
```
🏓 Keepalive ping ok → 2026-04-23T19:34:37.073Z
```

> ⚠️ Esta capa **solo funciona si alguien abre la app**. Si la clínica no usa la app durante una semana, no es suficiente. Por eso necesitas también la capa 2.

---

## 2️⃣ GitHub Actions cron (recomendado, totalmente automático)

El archivo [`.github/workflows/keep_supabase_alive.yml`](../.github/workflows/keep_supabase_alive.yml) define un workflow que corre cada 5 días automáticamente en los servidores de GitHub. No necesitas mantener nada encendido.

### Configuración (una sola vez)

**Paso 1 — Crear los secrets en GitHub**

Abre este enlace:
```
https://github.com/whoami-avi/selah-fisioterapia/settings/secrets/actions
```

Click en **"New repository secret"** y crea estos **2 secrets**:

| Nombre | Valor |
|--------|-------|
| `SUPABASE_URL` | `https://uomwyiapknnplqxmglnv.supabase.co` |
| `SUPABASE_ANON_KEY` | (tu anon key — la que está en `app.js` línea 9) |

> 💡 ¿Por qué guardar la anon key como secret si igual está en `app.js`? Por buenas prácticas: si en el futuro la cambias o la mueves a env vars, este workflow seguirá funcionando sin que tengas que tocar nada en el código.

**Paso 2 — Verifica que esté funcionando**

1. Entra a: `https://github.com/whoami-avi/selah-fisioterapia/actions`
2. Verás un workflow llamado **"Keep Supabase Alive"**
3. Click en él → click en **"Run workflow"** (botón derecho) → **"Run workflow"** (botón verde)
4. Espera ~30 segundos y verás un check verde ✅
5. Click en el run para ver el log: debería mostrar los 5 ✅ por tabla

### Programación

El workflow corre automáticamente:
- **Cada 5 días** a las 12:00 UTC (07:00 hora Colombia / Bogotá)
- También puedes correrlo **manualmente** cuando quieras desde la pestaña Actions

> ℹ️ GitHub Actions cron jobs son **gratuitos** para repos públicos. Para repos privados, tienes 2000 minutos/mes gratis y este job consume ~30 segundos por ejecución.

---

## 3️⃣ Script manual

Si quieres correr el ping desde tu computadora (por ejemplo, después de volver de vacaciones largas):

```bash
cd physio-manager
yarn install

SUPABASE_URL=https://uomwyiapknnplqxmglnv.supabase.co \
SUPABASE_ANON_KEY=tu-anon-key-aqui \
node ping_supabase.js
```

**Output esperado:**
```
🏓 Selah Supabase Keepalive Ping
   Timestamp: 2026-04-23T19:34:37.073Z
   Project:   https://uomwyiapknnplqxmglnv.supabase.co

   ✅ patients        → 5 fila(s)
   ✅ appointments    → 5 fila(s)
   ✅ users           → 0 fila(s)
   ✅ templates       → 0 fila(s)
   ✅ messages        → 0 fila(s)

🎉 Ping exitoso. Supabase activo. Próximo ping recomendado: en 5 días.
```

---

## 🚨 ¿Y si Supabase ya está pausado?

Si tu proyecto ya está pausado:
1. Entra a https://supabase.com/dashboard/projects
2. Selecciona el proyecto Selah
3. Click en **"Restore project"** (azul, arriba a la derecha)
4. Espera ~2 minutos a que vuelva online
5. Una vez activo, los keepalives evitarán que se vuelva a pausar

---

## 🔧 Troubleshooting

### El workflow de GitHub Actions falla con "Faltan variables de entorno"
→ No configuraste los secrets. Vuelve al [Paso 1 del setup](#configuración-una-sola-vez).

### El workflow falla con "fetch failed" o timeout
→ Probablemente Supabase está pausado. Restáuralo manualmente desde el dashboard.

### El workflow se ejecuta pero algunas tablas muestran ❌
→ Es posible que esa tabla aún no exista o tenga RLS que bloquea SELECT. Crea las tablas faltantes con el SQL del [README principal](./README.md#configuración-de-la-base-de-datos).

### Quiero correr el ping más seguido (cada día por ejemplo)
→ Edita el cron en `.github/workflows/keep_supabase_alive.yml`:
```yaml
# Diario a las 12:00 UTC
- cron: '0 12 * * *'
```
Otros ejemplos:
- `'0 */6 * * *'` — Cada 6 horas
- `'0 12 * * 1'` — Cada lunes a las 12:00 UTC

---

## 📈 Monitoreo

En la pestaña **Actions** de GitHub puedes ver el historial de todos los pings:
- ✅ Verde = ping exitoso
- ❌ Rojo = falló (revisar logs)
- 🟡 Amarillo = en ejecución

Si quieres notificaciones cuando falle, GitHub te las envía por email automáticamente a la dirección asociada a tu cuenta.

---

Ver también: [`ping_supabase.js`](./ping_supabase.js) · [`.github/workflows/keep_supabase_alive.yml`](../.github/workflows/keep_supabase_alive.yml)
