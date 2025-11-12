# 📱 Cómo Compartir tu App iOS GRATIS (Sin pagar $99/año)

## 🎯 Opción 1: Expo Go + Expo Publish (Recomendado) ⭐

### Paso 1: Crear cuenta en Expo (Gratis)
```bash
npx expo login
# O crea cuenta en: https://expo.dev/signup
```

### Paso 2: Publicar tu app
```bash
cd /Users/lucaalonso/code/sleep_app
npx expo publish
```

### Paso 3: Compartir
Te dará un link como: `exp://exp.host/@tuusuario/sleep-app`

**Cualquier persona puede:**
1. Descargar Expo Go (gratis) desde el App Store
2. Abrir tu link
3. ¡Usar tu app!

**✅ Ventajas:**
- Totalmente gratis
- Sin límite de usuarios
- Actualizaciones instantáneas
- No necesitas tener tu computadora prendida

**❌ Limitaciones:**
- Necesitan tener Expo Go instalado
- No aparece como app independiente
- No tiene tu propio ícono en la pantalla principal

---

## 🎯 Opción 2: TestFlight con Build Standalone (Gratis hasta 10,000 testers)

### Paso 1: Crear una cuenta Apple ID (Gratis)
Ya tienes una si usas App Store

### Paso 2: Crear el build
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
npx eas login

# Configurar el proyecto
npx eas build:configure

# Crear build para iOS (gratis en simulador, limites en físico)
npx eas build --platform ios --profile preview
```

### Paso 3: Subir a TestFlight
```bash
npx eas submit --platform ios
```

**✅ Ventajas:**
- Parece app "real"
- Hasta 10,000 testers beta
- Se instala como app independiente
- Tu propio ícono

**⚠️ Limitaciones:**
- Solo para pruebas beta (90 días por build)
- Proceso más complejo
- Necesitas renovar cada 90 días

---

## 🎯 Opción 3: Instalación Directa con Xcode (Gratis, 3 dispositivos)

Si tienes Xcode instalado:

### Paso 1: Conecta tu iPhone al Mac

### Paso 2: Corre el proyecto
```bash
cd /Users/lucaalonso/code/sleep_app
npx expo run:ios
```

### Paso 3: Confía en tu cuenta en el iPhone
- Ve a **Ajustes** → **General** → **VPN y gestión de dispositivos**
- Confía en tu Apple ID

**✅ Ventajas:**
- Completamente gratis
- App instalada de forma nativa
- No necesita internet después

**❌ Limitaciones:**
- Solo 3 dispositivos simultáneos
- Necesitas Xcode
- Debes reinstalar cada 7 días (firma vence)
- Debes conectar físicamente cada dispositivo a tu Mac

---

## 🎯 Opción 4: Web App (PWA) - Funciona en cualquier dispositivo

Puedes convertir tu app en una Progressive Web App:

```bash
cd /Users/lucaalonso/code/sleep_app
npx expo export:web
```

Luego súbela gratis a:
- **Vercel** (vercel.com) - Gratis
- **Netlify** (netlify.com) - Gratis
- **GitHub Pages** - Gratis

**Los usuarios:**
1. Abren el link en Safari
2. Tocan el botón "Compartir"
3. Seleccionan "Añadir a pantalla de inicio"
4. ¡Listo! Funciona como app nativa

**✅ Ventajas:**
- 100% gratis
- Funciona en iOS y Android
- Sin límite de usuarios
- No necesita App Store

**❌ Limitaciones:**
- No todas las funciones nativas disponibles
- No está en el App Store

---

## 🎯 Opción 5: Expo Development Builds (Gratis, ilimitados usuarios)

Similar a Expo Go pero con tu propia app:

```bash
# Crear development build
npx eas build --profile development --platform ios

# Compartir el archivo .ipa con amigos
# Ellos lo instalan y pueden probar
```

**✅ Ventajas:**
- Completamente personalizado
- Puedes usar librerías nativas personalizadas
- Gratis e ilimitado

**❌ Limitaciones:**
- Más complejo de configurar
- Los usuarios necesitan instalar tu "Expo Go personalizado"

---

## 📊 Comparación Rápida

| Método | Costo | Usuarios | Complejidad | Recomendado para |
|--------|-------|----------|-------------|------------------|
| **Expo Go + Publish** | Gratis | Ilimitado | ⭐ Fácil | Demos, testing rápido |
| **TestFlight** | Gratis* | 10,000 | ⭐⭐ Media | Beta testers |
| **Xcode directo** | Gratis | 3 | ⭐⭐⭐ Difícil | Tu propio iPhone |
| **PWA (Web)** | Gratis | Ilimitado | ⭐⭐ Media | Distribución amplia |
| **App Store** | $99/año | Ilimitado | ⭐⭐⭐⭐ Difícil | Publicación oficial |

\* TestFlight necesita cuenta de $99/año para producción, pero puedes usar modo desarrollo gratis

---

## 🎯 Mi Recomendación para ti

### Para empezar YA (hoy mismo):
```bash
cd /Users/lucaalonso/code/sleep_app
npx expo login
npx expo publish
```

Comparte el link con amigos → Ellos descargan Expo Go → ¡Listo!

### Para algo más "profesional" (próxima semana):
Crea una PWA y súbela a Vercel:
```bash
npx expo export:web
# Luego conecta con Vercel
```

### Para el futuro (cuando quieras monetizar):
Paga los $99/año y publica en App Store oficial

---

## 🚀 Comandos Rápidos

### Compartir ahora mismo (Expo Go):
```bash
npx expo publish
```

### Crear versión web:
```bash
npx expo export:web
```

### Crear build para TestFlight:
```bash
npm install -g eas-cli
npx eas build --platform ios
```

---

¿Preguntas? Revisa la documentación:
- [Expo Publishing](https://docs.expo.dev/workflow/publishing/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [TestFlight](https://developer.apple.com/testflight/)

