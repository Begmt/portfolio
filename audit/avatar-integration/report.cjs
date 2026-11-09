const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const model=read('audit/avatar-animation/manifest.json'),verify=read('audit/avatar-animation/verification.json'),local=read('audit/avatar-integration/local-checks.json');
const geometry=verify.results[0].geometry;
const text=`# Аватар в блоке «Обо мне»

Пользователь одобрил превью и разрешил интеграцию, коммит и публикацию. Затем указал на выступающий участок кожи сбоку головы. Исправление выполнено локально бесплатными инструментами, без генерации другого персонажа. Все файлы изменены только внутри portfolio. Реальная фотография не используется.

## Геометрия

| Before | After |
|---|---|
| Радиальная заплатка выступала за щёку и выглядела как отделённая кожа. | repair-head.cjs строит заднюю поверхность между срезом лица и фактическим контуром шеи. Исходное лицо и шея сохраняются; нормали и цвет согласованы на стыках. Задняя часть волос восстановлена гладкой поверхностью. |
| Уши оставались на расстоянии от восстановленной поверхности. | Основание ушей приближено к голове. Чашки, дужка и жесты сохранены. |
| Исходный файл: ${model.sourceBytes} байт, ${model.originalTriangles} треугольников. | ${model.outputBytes} байт, ${model.outputTriangles} треугольников; уменьшение размера на ${model.byteReductionPercent.toFixed(2)}%. Meshopt, WebP, четыре вызова отрисовки. |
| Статическая слитая сетка без анимаций. | Отдельные тело, исходная кисть, ноутбук, наушники; четыре сустава и три клипа: Wave, HeadphonesOff, HeadphonesOn. Цветовая текстура исходника сохранена побайтно. |

GLB SHA-256: \`${model.modelSHA256}\`. Исходный SHA-256: \`${model.sourceSHA256}\`, файл не перезаписывался.

## Интеграция и управление

| Before | After |
|---|---|
| В блоке была картинка 192 × 192. | Резервируемая квадратная 3D-сцена до 320 px на компьютере, до 340 px на телефоне; на широком экране опыт и образование занимают правую колонку рядом с аватаром, на телефоне блоки идут последовательно; темы на CSS-токенах, картинка для резервного отображения. |
| Нельзя повернуть персонажа. | Горизонтальное перетаскивание, стрелки клавиатуры, Home и кнопка возврата лицом. Вертикальный свайп и масштабирование страницы сохраняются. |
| Жесты доступны только в отдельном превью. | Помахать; снять/надеть наушники кнопкой. Наведение мышью снимает наушники, уход надевает обратно. Изменение направления во время жеста продолжает его с текущей позиции. |
| Загружаемая 3D-библиотека могла утяжелить первый экран. | Малый avatar3d.js загружает локальный модуль и модель только около блока. Версия GLB в URL связана с SHA. Нет внешнего CDN. |
| Постоянная отрисовка расходовала бы ресурсы. | Кадры только при взаимодействии, анимации и изменении размера. Скрытая вкладка и уход сцены за экран останавливают цикл. DPR ограничен 1,5. |
| Не было вариантов при ограничениях браузера. | Уменьшение движения даёт статические позы; экономия трафика требует явной загрузки; без JS/WebGL остаётся иллюстрированный аватар. Ошибка загрузки позволяет повторить попытку. |
| Интерактивная область без подсказок и доступных состояний. | Фокус, подписи клавиатуры, aria-pressed, спокойный статус, кнопки не меньше 44 px, мягкое нажатие scale(.96), отдельная подсказка для телефона. Знакомство через существующего проводника сохранено. |
| Проверка публикации не учитывала новые файлы. | Lighthouse CI проверяет HTML, CSS, старые скрипты, bootstrap, модуль, GLB и лицензии по содержимому. Требование каждого из десяти Mobile-прогонов ≥90 по четырём категориям и CLS <0,1 сохранено. |

## Проверки

- Интеграция: ${local.contexts.length} сочетаний тем и ширин 320–1920; мышь, реальные кадры жестов, разворот/реверс, клавиатура, остановка вне экрана, отсутствие цикла в покое, touch-свайп через canvas, экономия трафика, отсутствие JS/WebGL. Ошибок JS/HTTP нет, axe нарушений в блоке нет.
- Общая страница: 18 сочетаний темы/ширины, короткое окно, пять ширин без JS; меню, модальная заявка, email, копирование, ROI и карточки. Проводник: 12 сочетаний × 10 блоков. Регрессий не обнаружено.
- GLB: валидатор декодированной модели — 0 ошибок и предупреждений. ${geometry.faceSamples} контрольных точек головы (включая бока и затылок), кисть и ноутбук проверены в семи позах. Голова и ноутбук неподвижны; ошибка сохранения формы кисти менее 6e-8.
- Центральный участок лица против исходного GLB: MAE ${verify.results[0].appearance.centralFaceMAE255.toFixed(3)}/255. Это проверка указанного участка, не идентичность всех ракурсов. У скрытых поверхностей исходника нет достоверного фото-референса.
- Видео перезаписано с итоговым GLB; SHA совпадает. Автономное превью проверено без сети. Микродефекты исходной текстуры не ретушировались, отдельного сгибания пальцев нет. Проверки мобильной версии выполняются в Chrome с эмуляцией; FPS физического телефона не измерялся.

Публикация и финальные отчёты: см. published-checks.json и lighthouse/results.json после завершения проверки. audit исключён из GitHub Pages.
`;
fs.writeFileSync(path.join(__dirname,'REPORT.md'),text);
fs.writeFileSync(path.join(root,'audit/avatar-animation/REPORT.md'),`# Обработанная 3D-модель\n\nПервоначальное превью одобрено для интеграции. После сообщения пользователя исправлена выступающая боковая поверхность головы. Актуальные изменения, ограничения и проверки: [отчёт интеграции](../avatar-integration/REPORT.md).\n\nМодель: [avatar-animated.glb](avatar-animated.glb), ${model.outputBytes} байт, ${model.outputTriangles} треугольников. SHA-256: ${model.modelSHA256}. Исходник сохранён. Цветовая текстура совпадает побайтно с исходной.\n\n[Манифест](manifest.json), [проверки геометрии и внешности](verification.json), [валидатор](validator-decoded.json), [видео](preview.mp4), [боковой ракурс без наушников](off-side.png).\n\nВоспроизведение: prepare.cjs → build.cjs (использует repair-head.cjs) → validate.cjs → verify.cjs. Для сайта: ../avatar-integration/build.cjs. Зависимости перечислены в build-manifest.json, лицензии входят в assets/guide/3d-licenses.txt. Платные сервисы не использовались.\n`);
console.log({headSamples:geometry.faceSamples,modelSHA:model.modelSHA256,localContexts:local.contexts.length});
if(fs.existsSync(path.join(__dirname,'lighthouse/results.json'))){
 const assert=require('assert/strict'),lh=read('audit/avatar-integration/lighthouse/results.json'),deployment=read('audit/avatar-integration/deployment.json'),ciDeployment=read('audit/avatar-integration/lighthouse/deployment.json'),published=read('audit/avatar-integration/published-checks.json'),touch=read('audit/avatar-integration/published-touch-checks.json');
 assert.equal(lh.sourceCommit,deployment.sourceCommit);assert.equal(ciDeployment.sourceCommit,lh.sourceCommit);assert.equal(lh.runs.length,10);
 assert.ok(lh.runs.every(r=>r.actualTheme===r.theme&&r.passed&&Object.values(r.scores).every(s=>s>=.9)&&r.CLS<.1));
 assert.ok(deployment.checks.every(c=>c.matches)&&ciDeployment.checks.every(c=>c.matches));assert.equal(deployment.checks.find(c=>c.file.endsWith('.glb')).publishedSHA256,model.modelSHA256);
 assert.equal(published.contexts.length,12);assert.deepEqual(published.errors,[]);assert.deepEqual(published.httpErrors,[]);assert.ok(touch.length===2&&touch.every(c=>Math.abs(c.touchAngle)>.4&&c.verticalScroll>50&&c.contextLossFallback));
 const publication={url:'https://begmt.github.io/portfolio/#about',releaseCommit:lh.sourceCommit,modelSHA256:model.modelSHA256,verifiedAt:new Date().toISOString(),pagesRun:'https://github.com/Begmt/portfolio/actions/runs/42697950150',lighthouseRun:'https://github.com/Begmt/portfolio/actions/runs/42697952525',allTenMobileRunsPassed:true,themes:lh.themes,publishedInteractionContexts:published.contexts.length,touch};
 fs.writeFileSync(path.join(__dirname,'publication.json'),JSON.stringify(publication,null,2));
 model.sitePublished=true;model.publishedCommit=lh.sourceCommit;model.publishedVerification='../../audit/avatar-integration/publication.json';model.limitations[model.limitations.length-1]='Published Chrome checks and ten standard Lighthouse Mobile runs passed. No physical-device FPS measurement.';
 fs.writeFileSync(path.join(root,'audit/avatar-animation/manifest.json'),JSON.stringify(model,null,2));
 let final=`\n## Опубликованная версия\n\nРелиз: ${lh.sourceCommit}. [Сайт](${publication.url}), [успешный Lighthouse](${publication.lighthouseRun}), [Pages](${publication.pagesRun}). Все десять файлов публикации совпадают с релизом, включая GLB.\n\n| Тема | Performance (все пять) | Accessibility min | Best Practices min | SEO min | CLS max |\n|---|---|---:|---:|---:|---:|\n`;
 for(const[theme,r]of Object.entries(lh.themes))final+=`| ${theme} | ${r.performance.join(', ')} | ${r.minAccessibility} | ${r.minBestPractices} | ${r.minSEO} | ${r.maxCLS.toFixed(6)} |\n`;
 final+='\nКаждый прогон отдельно выполнил порог ≥90 по всем категориям и CLS <0,1. Это не оценка по медиане. Стандартный Mobile, CPU ×4, RTT 150 мс, пять холодных профилей на тему.\n\nНа опубликованном сайте дополнительно прошли 12 проверок 3D, 18 проверок адаптивности, пять ширин без JS и 12 × 10 проверок проводника. В обоих touch-контекстах горизонтальный свайп повернул модель, вертикальный прокрутил страницу, потеря WebGL вернула запасное изображение. [JSON публикации](publication.json), [сырые данные Lighthouse](lighthouse/results.json).\n';
 fs.appendFileSync(path.join(__dirname,'REPORT.md'),final);console.log({published:publication.url,passed:lh.passed,themes:lh.themes});
}
