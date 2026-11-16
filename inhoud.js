/* =====================================================================
   DIT IS ASV'33 — ALLE INHOUD OP ÉÉN PLEK
   ---------------------------------------------------------------------
   Makkelijkst: pas dit aan met je eigen (privé) bewerkpagina en plak het
   resultaat hier. Met de hand kan ook: verander alleen tekst tussen de
   aanhalingstekens en laat komma's en haakjes staan.
   - Afbeeldingen staan in de map img/. "naam" betekent img/naam.webp met
     een kleine versie img/naam-klein.webp. Een naam mét extensie
     (bijv. "nieuwe-foto.jpg") gebruikt precies dat ene bestand.
   - x / y: plek op de luchtfoto (0 = links/boven, 1 = rechts/onder).
   - label / labelMobiel: plek van het naamlabel naast de stip (pixels).
   ===================================================================== */

window.ASV = {
  "site": {
    "titel": "Ontdek het ASV’33 van morgen",
    "ondertitel": "Bekijk onze plannen voor sportpark De Hut.",
    "instructie": "Tik op een locatie en ontdek wat we willen veranderen.",
    "projectnaam": "Dit is ASV’33",
    "disclaimer": "Ontwerpvoorstel voor ASV’33 — de getoonde aanpassingen zijn nog niet gerealiseerd.",
    "bron": "Luchtfoto: Google Maps",
    "introVideo": ""
  },
  "kaart": {
    "afbeelding": "img/luchtfoto-sportpark-de-hut.webp",
    "reserve": "img/luchtfoto-sportpark-de-hut.jpg",
    "breedte": 941,
    "hoogte": 1672,
    "alt": "Luchtfoto van sportpark De Hut in Aarle-Rixtel met de velden, de tribune, de kantine en de tennisbanen.",
    "sportpark": {
      "x1": 0.27,
      "y1": 0.2,
      "x2": 0.865,
      "y2": 0.68
    },
    "maxZoom": 3.2
  },
  "locaties": [
    {
      "id": "veld-c",
      "naam": "Veld C",
      "titel": "Veld C in de clubkleuren",
      "x": 0.375,
      "y": 0.308,
      "label": {
        "dx": 0,
        "dy": -34,
        "uitlijning": "midden"
      },
      "kaartZoom": 1.8,
      "hoofdbeeld": {
        "bestand": "veld-c-ontwerp-ballenvanger",
        "alt": "Ontwerp van veld C: de ballenvangerpalen zijn onderaan rood en bovenaan wit, het doel heeft een rood-wit net."
      },
      "kaartje": "veld-c-ontwerp-doel",
      "watVeranderen": "We schilderen de ballenvangerpalen rood-wit, vervangen de twee doelnetten door rood-witte netten en schilderen de twee bestaande dug-outs rood.",
      "waarom": "We willen dat ook veld C duidelijk bij ASV’33 hoort. Door de clubkleuren terug te laten komen, ontstaat meer samenhang met de rest van het sportpark. We behouden de bestaande dug-outs en knappen ze op, zodat we kosten beperken en bestaande voorzieningen hergebruiken.",
      "oplevering": "Een verzorgder en herkenbaarder veld met een duidelijke ASV’33-uitstraling.",
      "onderdelen": [
        {
          "naam": "Doel linkerkant",
          "uitleg": "Rood-wit doelnet en ballenvangerpalen die onderaan rood en bovenaan wit zijn.",
          "type": "wissel",
          "huidig": {
            "bestand": "veld-c-huidig-doel",
            "alt": "Huidige situatie: het doel aan de linkerkant van veld C, voor de bomenrij, met een wit net."
          },
          "ontwerp": {
            "bestand": "veld-c-ontwerp-doel",
            "alt": "Ontwerp: het doel aan de linkerkant met een rood-wit net en rood-witte ballenvangerpalen."
          }
        },
        {
          "naam": "Doel rechterkant",
          "uitleg": "Rood-wit doelnet en ballenvangerpalen die onderaan rood en bovenaan wit zijn.",
          "type": "wissel",
          "huidig": {
            "bestand": "veld-c-huidig-ballenvanger",
            "alt": "Huidige situatie: het doel aan de rechterkant van veld C met de hoge ballenvanger op metalen palen."
          },
          "ontwerp": {
            "bestand": "veld-c-ontwerp-ballenvanger",
            "alt": "Ontwerp: het doel aan de rechterkant met een rood-wit net en ballenvangerpalen onderaan rood en bovenaan wit."
          }
        },
        {
          "naam": "Dug-outs",
          "uitleg": "De twee bestaande dug-outs worden rood geschilderd.",
          "type": "schuif",
          "huidig": {
            "bestand": "veld-c-vergelijk-dugouts-voor",
            "alt": "Huidige situatie: twee groene dug-outs langs veld C."
          },
          "ontwerp": {
            "bestand": "veld-c-vergelijk-dugouts-na",
            "alt": "Ontwerp: dezelfde twee dug-outs rood geschilderd."
          }
        }
      ]
    },
    {
      "id": "tribune",
      "naam": "Tribune",
      "titel": "Clubgevoel langs de tribune",
      "x": 0.6716,
      "y": 0.4224,
      "label": {
        "dx": 0,
        "dy": -34,
        "uitlijning": "midden"
      },
      "kaartZoom": 2,
      "kaartje": "tribune-paneel-team",
      "watVeranderen": "We plaatsen zes grote horizontale fotopanelen achter de tribune. De beelden krijgen een samenhangende stijl met zwart-wit en rode accenten.",
      "waarom": "De beelden laten verschillende kanten van de vereniging zien: de voorbereiding in de kleedkamer, voetbal op het veld, supporters en bijzondere clubmomenten. Zo brengen we de verbondenheid tussen spelers, supporters en generaties in beeld.",
      "oplevering": "Een tribune met meer karakter en een herkenbare uitstraling. De beelden geven aanleiding tot gesprekken en laten zien wat de club voor haar leden betekent.",
      "wandTitel": "Voor en door ASV’ers",
      "herkomstUitleg": "De historische sfeerbeelden zijn met AI gemaakt. Het zijn reconstructies, geen originele archieffoto’s. Echte clubfoto’s staan apart aangegeven.",
      "panelen": [
        {
          "titel": "De voorbereiding in de kleedkamer",
          "herkomst": "ai",
          "paneel": "tribune-paneel-kleedkamer",
          "mockup": "tribune-mockup-kleedkamer",
          "alt": "Zwart-wit sfeerbeeld met rode accenten: spelers in rood-wit gestreepte shirts maken zich klaar in een oude kleedkamer."
        },
        {
          "titel": "Voetbal op het veld",
          "herkomst": "ai",
          "paneel": "tribune-paneel-veld",
          "mockup": "tribune-mockup-veld",
          "alt": "Zwart-wit sfeerbeeld met rode accenten: een speler in rood-wit shirt dribbelt langs een tegenstander op een grasveld."
        },
        {
          "titel": "Supporters langs de lijn",
          "herkomst": "ai",
          "paneel": "tribune-paneel-supporters",
          "mockup": "tribune-mockup-supporters",
          "alt": "Zwart-wit sfeerbeeld met rode accenten: supporters van verschillende generaties leunen op het hek langs het veld."
        },
        {
          "titel": "Samen vieren",
          "herkomst": "echt",
          "paneel": "tribune-paneel-team",
          "mockup": "tribune-mockup-team",
          "alt": "Echte clubfoto in zwart-wit met rode accenten: spelers van ASV’33 vieren samen een doelpunt."
        },
        {
          "titel": "Een bijzonder clubmoment",
          "herkomst": "ai",
          "paneel": "tribune-paneel-clubmoment",
          "mockup": "tribune-mockup-clubmoment",
          "alt": "Zwart-wit sfeerbeeld met rode accenten: een lint wordt doorgeknipt voor een oude tribune, met spelers en publiek eromheen."
        },
        {
          "titel": "Sportpark De Hut",
          "herkomst": "echt",
          "paneel": "tribune-paneel-entree",
          "mockup": "tribune-mockup-entree",
          "alt": "Echte foto in zwart-wit met rode accenten: de ingang van sportpark De Hut met de boog ‘Sportpark De Hut’."
        }
      ],
      "huidigeFotos": [
        {
          "bestand": "tribune-huidig-voorkant",
          "alt": "Huidige situatie: de Marthie van Alem Tribune met rode stoeltjes en reclameborden."
        },
        {
          "bestand": "tribune-huidig-overzicht",
          "alt": "Huidige situatie: het hoofdveld met de tribune aan de bosrand."
        },
        {
          "bestand": "tribune-huidig-staand",
          "alt": "Huidige situatie: de tribune vanaf het hoofdveld gezien."
        }
      ]
    },
    {
      "id": "vrijwilligerswand",
      "naam": "Vrijwilligerswand",
      "titel": "Deze mensen maken ASV’33 mogelijk",
      "x": 0.6746,
      "y": 0.5273,
      "label": {
        "dx": 26,
        "dy": 62,
        "uitlijning": "links"
      },
      "labelMobiel": {
        "dx": -12,
        "dy": -48,
        "uitlijning": "rechts"
      },
      "kaartZoom": 2.2,
      "hoofdbeeld": {
        "bestand": "vrijwilligers-ontwerp",
        "alt": "Ontwerp van de vrijwilligerswand: een rood bord met achttien portretten, namen en functies op de bakstenen muur."
      },
      "kaartje": "vrijwilligers-ontwerp",
      "watVeranderen": "Er komt een vrijwilligerswand met portretten, namen en functies. Het bord krijgt een rode basis, donkere portretachtergronden en een uniforme opmaak.",
      "waarom": "Vrijwilligers zorgen ervoor dat de vereniging dagelijks kan functioneren. Met deze wand geven we hun inzet een zichtbare plek en maken we duidelijk wie welke rol binnen de club vervult.",
      "oplevering": "Meer zichtbare waardering voor vrijwilligers en meer herkenning van de mensen achter de vereniging.",
      "notitie": "Voorbeeld met fictieve personen en namen. Bij uitvoering worden deze vervangen door echte vrijwilligers.",
      "slogan": "Voor en door ASV’ers.",
      "vergelijking": {
        "type": "wissel",
        "huidig": {
          "bestand": "vrijwilligers-huidig",
          "alt": "Huidige situatie: lege bakstenen muur tussen twee rode deuren."
        },
        "ontwerp": {
          "bestand": "vrijwilligers-ontwerp",
          "alt": "Ontwerp: de vrijwilligerswand op dezelfde muur."
        }
      },
      "extraFotos": [
        {
          "bestand": "vrijwilligers-huidig-staand",
          "alt": "Huidige situatie: dezelfde muur, staand gefotografeerd."
        }
      ]
    },
    {
      "id": "clublied",
      "naam": "Clublied op de muur",
      "titel": "Onze clubtrots op de muur",
      "x": 0.6218,
      "y": 0.5273,
      "label": {
        "dx": -26,
        "dy": 62,
        "uitlijning": "rechts"
      },
      "labelMobiel": {
        "dx": -14,
        "dy": 58,
        "uitlijning": "rechts"
      },
      "kaartZoom": 2.2,
      "hoofdbeeld": {
        "bestand": "clublied-ontwerp",
        "alt": "Ontwerp: op de achtermuur van de kantine staat in losse letters ‘ASV’ers, dat zijn wij allen, daarop zijn wij toch zo trots’, met het ASV’33-logo eronder."
      },
      "kaartje": "clublied-ontwerp",
      "watVeranderen": "We plaatsen een zin uit het clublied als losse metalen letters op afstandspinnen, met het ASV’33-logo eronder.",
      "citaat": "ASV’ers, dat zijn wij allen, daarop zijn wij toch zo trots",
      "waarom": "De tekst komt uit het clublied en sluit direct aan bij de identiteit van de vereniging. De losse letters staan iets van de muur af, waardoor diepte en schaduw ontstaan. ASV’ers krijgt een gedempte rode kleur; de overige letters worden wit.",
      "oplevering": "Een herkenbare plek die de trots en saamhorigheid van ASV’33 zichtbaar maakt.",
      "vergelijking": {
        "type": "schuif",
        "huidig": {
          "bestand": "clublied-vergelijk-voor",
          "alt": "Huidige situatie: de lege achtermuur van de kantine."
        },
        "ontwerp": {
          "bestand": "clublied-vergelijk-na",
          "alt": "Ontwerp: dezelfde muur met de tekst uit het clublied en het logo."
        }
      },
      "extraFotos": [
        {
          "bestand": "clublied-huidig-staand",
          "alt": "Huidige situatie: de achtermuur van de kantine met de grote eik ernaast."
        }
      ]
    }
  ]
};
