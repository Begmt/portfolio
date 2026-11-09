# Обработанная 3D-модель

Первоначальное превью одобрено для интеграции. После сообщения пользователя исправлена выступающая боковая поверхность головы. Актуальные изменения, ограничения и проверки: [отчёт интеграции](../avatar-integration/REPORT.md).

Модель: [avatar-animated.glb](avatar-animated.glb), 2271244 байт, 134484 треугольников. SHA-256: 1bb1e790dc1a875e827cb15574cda750dcc102363abdb6b3d2daa17aa917d963. Исходник сохранён. Цветовая текстура совпадает побайтно с исходной.

[Манифест](manifest.json), [проверки геометрии и внешности](verification.json), [валидатор](validator-decoded.json), [видео](preview.mp4), [боковой ракурс без наушников](off-side.png).

Воспроизведение: prepare.cjs → build.cjs (использует repair-head.cjs) → validate.cjs → verify.cjs. Для сайта: ../avatar-integration/build.cjs. Зависимости перечислены в build-manifest.json, лицензии входят в assets/guide/3d-licenses.txt. Платные сервисы не использовались.
