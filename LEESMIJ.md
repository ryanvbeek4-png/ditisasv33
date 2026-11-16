# Dit is ASV’33 — website

## Zelf teksten en foto’s aanpassen (alleen op jouw pc)

1. Pak het zip-bestand uit in een map op je pc.
2. Dubbelklik op **index.html**. De website opent dan in je browser. Gebruik bij voorkeur **Chrome** of **Edge**.
3. Klik rechtsonder op **✏️ Bewerken**.
   - **Tekst:** klik op een tekst met een stippellijn en typ. Wat je verandert, zie je meteen.
   - **Foto:** klik op een foto (‘📷 Vervang foto’) en kies een nieuwe foto op je pc. De foto wordt automatisch verkleind voor mobiel.
4. Klik bovenaan op **Opslaan op deze pc**. De eerste keer vraagt de browser welke map hij mag gebruiken. Kies de map waarin **index.html** staat en klik op *Toestaan / Wijzigingen opslaan*.
   - Dan wordt **inhoud.js** bijgewerkt en komen nieuwe foto’s in de map **img/**.
   - In Firefox of Safari worden de bestanden gedownload. Zet ze dan zelf in de map: `inhoud.js` in de hoofdmap en de foto’s in `img/`.
5. Klik op **Klaar**.

De knop **Bewerken** zie je alleen als je de website op je eigen pc opent. Op de openbare website staat hij niet, dus niemand anders kan iets veranderen.

## Online zetten (vaste https-link voor de QR-code)

**Netlify Drop (gratis, ongeveer 2 minuten)**
1. Ga naar https://app.netlify.com/drop en maak een gratis account aan.
2. Sleep de hele map met `index.html` erin naar het vak.
3. Kies onder *Site configuration → Change site name* een vaste naam, bijvoorbeeld `ditisasv33`. Je link wordt dan `https://ditisasv33.netlify.app`.
4. Later iets aangepast? Sleep de map opnieuw naar *Deploys*. De link en de QR-code blijven hetzelfde.

Stuur de definitieve link naar Claude. Dan wordt de QR-code gemaakt, als SVG voor drukwerk en als PNG in hoge resolutie.

## Wat zit erin?

| Bestand / map | Wat is het? |
|---|---|
| `index.html` | De pagina |
| `inhoud.js` | Alle teksten, afbeeldingsnamen en kaartposities. Dit bestand wordt bijgewerkt door de bewerkmodus. |
| `bewerken.js` | De bewerkmodus (werkt alleen op je eigen pc) |
| `app.js`, `style.css` | De werking en de opmaak |
| `img/` | Alle afbeeldingen |
| `fonts/` | Het lettertype Inter (vrij te gebruiken) |

## Goed om te weten

- De vóór/na-schuif bij de dug-outs en het clublied werkt alleen als foto en ontwerp precies dezelfde uitsnede hebben. Daarom kun je die twee beelden niet via de bewerkmodus vervangen.
- Directe links: `#veld-c`, `#tribune`, `#vrijwilligerswand`, `#clublied`.
- Luchtfoto: Google Maps. De historische tribunebeelden zijn AI-sfeerbeelden, geen archieffoto’s. De vrijwilligerswand toont fictieve personen.
