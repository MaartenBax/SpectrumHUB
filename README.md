# Spectrum Hub — PDF Layout Study v2.4

Werkende layout-study gebaseerd op de bestaande Spectrum Hub-productlogica en de aangeleverde PDF-richting.

Nieuw in deze bijgewerkte v2.4:
- **Mededelingen** en **Doelen** zijn twee losse hoofdschermen.
- Mediënten geven bij **inloggen/inklokken** met een smiley aan hoe ze de dag ingaan.
- Bij **uitloggen/uitklokken** wordt opnieuw een smiley gekozen voor hoe de dag wordt afgesloten.
- Start- en eindindicatie worden bij de werkdag opgeslagen en bij het dagverslag weergegeven.
- De rechter dashboardkolom blijft onderdeel van dezelfde personaliseerbare dashboardlayout en is verticaal versleepbaar in **Dashboard aanpassen**.

Open `index.html` in een moderne browser.

- Op de Doelen-pagina zien mediënten geen knop om doelen toe te voegen; beheeracties zijn alleen voor begeleiders zichtbaar.

- Sidebar-branding: open = Spectrum HUB, dicht = alleen lampje.

## Begeleidergerichte v2.4-aanpassingen
- Geen afspraakplanning tussen begeleiding en mediënten.
- Mediëntprofiel en Rooster delen één vaste weekindeling.
- Rooster voor begeleiding is week-only en ondersteunt Ctrl/Cmd-multiselect.
- Accountbeheer voor begeleiding; eigen wachtwoord wijzigen voor alle gebruikers.

- Radius system: shells → panels → cards → controls, with concentric inner radii where a nested surface follows its parent perimeter.


## Planbord 2.0 integratie (prototype)
- Planbord 2.0 opent als zelfstandige module binnen de bestaande HUB Planbord-pagina.
- In een kolom via Bewerken: **Weergeven op dashboard**. De widget toont geselecteerde kolommen uit meerdere borden met bronbord-label.
- Archief is binnen Planbord 2.0 bereikbaar; import/export/themaschakelaar en dubbele zijbalk zijn verborgen.
- De bestaande HUB-taakdata blijft in de bestaande browseropslag bewaard, maar wordt niet automatisch gemigreerd; Planbord 2.0 gebruikt eigen prototype-opslag. Maak een backup voor verdere wijzigingen.
- De geïntegreerde oplossing is een browserprototype, geen gedeelde backend met beveiligde multi-user synchronisatie.

### Planbord 2.0 — bordleden (integratieprototype)
- Borden hebben nu een eigenaar (`ownerId`) en een ledenlijst (`access`) met rechten `view` of `edit`.
- Begeleiders die een bord bezitten kunnen in **Bord bewerken** andere mediënten of begeleiders toegang geven.
- Mediënten kunnen hun eigen borden, kolommen en taken beheren, maar geen leden toevoegen of taken aan personen toewijzen.
- Alleen-lezen-leden kunnen kaarten bekijken, maar niet aanmaken, bewerken, verplaatsen of archiveren.
- Deze versie gebruikt nog steeds **lokale browseropslag**. De rolbeperkingen in het prototype zijn geen serverbeveiliging en delen geen data tussen verschillende apparaten.
