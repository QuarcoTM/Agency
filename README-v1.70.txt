ДЕН И НОЩ — v1.70
==================

Clean URL структура за целия публичен сайт.

Примери:
- https://deninosht.bg/uslugi/
- https://deninosht.bg/traurni-stoki/
- https://deninosht.bg/nekrolozi/
- https://deninosht.bg/zadushnitsi/
- https://deninosht.bg/kalkulator-pomeni/
- https://deninosht.bg/kontakti/

Как е направено:
- Всяка публична страница има реална папка /slug/index.html, така че clean URL работи и при refresh.
- Всички менюта и вътрешни линкове сочат към clean URL адресите.
- Canonical, Open Graph URL и structured data URL адресите са обновени.
- sitemap.xml съдържа clean URL адресите.
- Старите .html адреси са оставени като redirect страници към новите адреси, за да не се губят стари линкове/bookmarks.
- Старият kategoriya.html?category=... запазва query параметъра при пренасочването.
- Каталогът вече отваря /kategoriya/?category=...
- Админ панелът е обновен да отваря clean URL адресите.
- Началната остава https://deninosht.bg/
- /admin/ остава clean адресът на админ панела.
- 404.html остава специалният системен 404 файл за GitHub Pages.

Бележка:
На статичен GitHub Pages няма сървърни 301 правила/.htaccess. Затова старите .html URL-и
използват незабавно client-side redirect и canonical към новите clean URL-и.
