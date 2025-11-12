# 📤 Cómo Compartir tu App con EAS Update

## Método 1: EAS Update (Reemplazo de expo publish)

### Paso 1: Instalar EAS CLI
```bash
npm install -g eas-cli
```

### Paso 2: Login en EAS
```bash
cd /Users/lucaalonso/code/sleep_app
eas login
```

### Paso 3: Configurar el proyecto
```bash
eas build:configure
```

### Paso 4: Crear tu primera actualización
```bash
eas update --branch production --message "Primera versión"
```

### Paso 5: Compartir
Te dará un link como: `exp+sleep-app://expo-development-client/?url=https://u.expo.dev/...`

**Cualquier persona con Expo Go puede:**
- Escanear el QR
- O abrir el link directamente

---

## Método 2: Expo Dev Client (App personalizada)

### Paso 1: Crear un development build
```bash
eas build --profile development --platform ios
```

### Paso 2: Instalar en tu iPhone
Esto te dará un archivo `.ipa` o un link para instalar

### Paso 3: Compartir actualizaciones
```bash
eas update --branch development
```

**✅ Ventajas:**
- Tu propia app "branded"
- Funciona sin Expo Go
- Actualizaciones instantáneas

---

## Método 3: Expo Start con Túnel (Temporal, pero fácil)

### Iniciar servidor
```bash
cd /Users/lucaalonso/code/sleep_app
npx expo start --tunnel
```

### Compartir
- Comparte el código QR que aparece
- O comparte el link `exp://...` que se genera

**✅ Ventajas:**
- Inmediato, sin configuración
- Gratis e ilimitado

**❌ Limitaciones:**
- Necesitas mantener tu computadora corriendo
- Cuando apagas el servidor, nadie puede acceder

---

## ¿Cuál elegir?

| Método | Complejidad | Permanente | Costo |
|--------|-------------|------------|-------|
| **expo start --tunnel** | ⭐ Fácil | ❌ No | Gratis |
| **eas update** | ⭐⭐ Media | ✅ Sí | Gratis |
| **eas build + dev client** | ⭐⭐⭐ Difícil | ✅ Sí | Gratis |

---

## Recomendación

### Para probar ahora (5 minutos):
```bash
npx expo start --tunnel
# Comparte el QR/link que aparece
```

### Para compartir permanentemente (20 minutos):
```bash
npm install -g eas-cli
eas login
eas update:configure
eas update --branch production --message "Primera versión"
```

---

## Comandos Útiles

### Ver quién está usando tu app
```bash
eas update:list
```

### Publicar una nueva versión
```bash
eas update --branch production --message "Nueva funcionalidad"
```

### Ver estadísticas
```bash
eas analytics
```

