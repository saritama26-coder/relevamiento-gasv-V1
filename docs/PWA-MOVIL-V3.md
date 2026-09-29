# Relevamiento Arquitectónico GASV — PWA móvil V3

## Objetivo
Esta rama prepara GASV como aplicación web instalable (PWA) para levantamiento arquitectónico en campo, antes de implementar la transferencia PC ↔ móvil.

## Estado
- Base React/Vite existente conservada.
- VitePWA ya está configurado con manifest y service worker.
- IndexedDB/localForage es la persistencia local.
- Incluye botón de instalación y modo offline.

## Criterios de esta fase
1. Priorizar uso en teléfono.
2. No introducir sincronización ni transferencia de datos todavía.
3. No romper el modelo de datos ni las funciones de escritorio.
4. Mejorar instalación, offline, cámara/fotografía y ergonomía táctil.
5. Verificar build antes de pasar a main.

## Próximo hito
Probar la PWA en un dispositivo real mediante HTTPS, instalar desde Safari/Chrome y validar:
- apertura standalone;
- persistencia local;
- captura de fotografías;
- funcionamiento sin conexión;
- recuperación después de cerrar y reabrir.
