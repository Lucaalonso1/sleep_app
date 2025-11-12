# 🌙 Sleep App - Inicio Rápido

## ✅ Instalación completada

Tu proyecto Sleep App está listo para ejecutarse. Todas las dependencias han sido instaladas correctamente.

## 🚀 Cómo arrancar la app

### Opción 1: Iniciar en modo desarrollo (Recomendado)
```bash
npm start
```

Luego escanea el código QR con:
- **iOS**: Usa la app de Expo Go desde el App Store
- **Android**: Usa la app de Expo Go desde Google Play

### Opción 2: Iniciar en iOS Simulator (requiere Mac + Xcode)
```bash
npm run ios
```

### Opción 3: Iniciar en Android Emulator (requiere Android Studio)
```bash
npm run android
```

### Opción 4: Iniciar en el navegador web
```bash
npm run start-web
```

### Opción 5: Usar túnel (si tienes problemas de red)
```bash
npm run start-tunnel
```

## 📱 Estructura del Proyecto

- `app/` - Pantallas de la aplicación
  - `(tabs)/` - Navegación por pestañas
    - `index.tsx` - Pantalla principal de seguimiento de sueño
    - `history.tsx` - Historial de registros
    - `insights.tsx` - Estadísticas y análisis
    - `sounds.tsx` - Sonidos relajantes
- `contexts/` - Context API de React
  - `SleepContext.tsx` - Estado global de la app
- `types/` - Definiciones de tipos TypeScript
- `constants/` - Constantes y colores

## 🔧 Configuración Completada

✅ Dependencias instaladas (1033 paquetes)
✅ package.json configurado
✅ app.json configurado
✅ tsconfig.json configurado
✅ Tipos TypeScript creados
✅ ESLint configurado

## 📦 Tecnologías Principales

- **Expo 54** - Framework de React Native
- **React Native 0.81** - Framework móvil
- **React 19** - Librería UI
- **TypeScript** - Tipado estático
- **Expo Router** - Navegación basada en archivos
- **React Query** - Gestión de estado del servidor
- **Zustand** - Gestión de estado
- **NativeWind** - Estilos con Tailwind

## 🎨 Características de la App

- 🌙 Registro de sesiones de sueño
- 📊 Estadísticas y análisis de patrones
- 🎵 Sonidos relajantes para dormir
- 📅 Historial completo de sueño
- 💡 Insights personalizados

## ⚠️ Notas Importantes

- Se ha instalado con `--legacy-peer-deps` para resolver conflictos de dependencias
- Las imágenes en `assets/images/` están pendientes (puedes agregar tus propios iconos)
- La app está configurada para soportar iOS, Android y Web

## 🆘 Solución de Problemas

Si tienes problemas al iniciar:

1. **Limpia caché de Expo**:
   ```bash
   npx expo start -c
   ```

2. **Reinstala dependencias**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **Verifica que Expo CLI esté actualizado**:
   ```bash
   npm install -g expo-cli
   ```

## 📚 Recursos Útiles

- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de React Native](https://reactnative.dev/)
- [Expo Router Docs](https://expo.github.io/router/docs/)

---

¡Tu app está lista! Ejecuta `npm start` para comenzar 🎉

