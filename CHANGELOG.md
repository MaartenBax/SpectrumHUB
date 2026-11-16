
## v2.4 — begeleiders Taken: weekplanner-shell

- Custom kleurmodus voor mediënten toegevoegd: 17 gekozen algemene UI-kleurrollen, met live color picker + HEX, per demo-account opgeslagen; functionele/statuskleuren blijven vast.
- Instelling Weergave gebruikt nu Licht / Donker / Custom; Custom is niet beschikbaar voor begeleiders.
- Mijn Taken-dashboardwidget voor mediënten hersteld; gebruikt hetzelfde takenbord als de volledige Mijn Taken-pagina en blijft onderdeel van de verplaatsbare/verberg-/pinbare dashboardwidgets.
- Nieuwe begeleiderstaak ontstaat nu via **klik/sleep in de weekplanner**; de taakpopup opent pas bij loslaten en gebruikt het gekozen tijdsbereik.
- Taakpopup heeft **Taak doorplannen**: na opslaan wacht HUB op de eerstvolgende klik/sleep en maakt daarvan een gekoppeld extra tijdsblok van dezelfde taak.
- Tijdens doorplannen toont de planner een compacte actieve modus met annuleren; gekoppelde blokken krijgen een subtiele doorplan-markering.
- Begeleiders-Taken gebruikt nu een weekplanner met maandag t/m vrijdag.
- Tijdas loopt van 09:00 tot 16:30 in halve uren.
- Vrijdag na 12:30 blijft leeg.
- Mediënt-takenbord en bestaande taaklogica zijn ongemoeid gelaten.
- Uitgebreide taakblokken, drag/drop en taakbewerking volgen pas in een volgende stap.

# Changelog

- Aparte 16:9 desktop-pass voor het rooster toegevoegd: ultrawide blijft ongewijzigd, terwijl 1920×1080 compactere tabelpadding, leesbare bezette/gereserveerde kaarten en een strakkere filterbalk krijgt.

- Roosterbediening bovenaan compacter gemaakt: afdeling en lokalen nemen minder horizontale ruimte in, zodat de zoekbalk meer ruimte krijgt en alles rustiger in één balk naast elkaar staat.

- Roosterfilters werkelijk samengevoegd tot één horizontale balk: afdeling, lokaal en mediëntzoekveld staan nu naast elkaar; de oude week-toolbar override kan de balk niet meer naar losse rijen terugzetten.

- Alle kaarten in het lokaalrooster hebben nu exact dezelfde hoogte als een vrije plek. Afwijkende tijden staan rechts in de bezette kaart zodat extra informatie de rasteruitlijning niet meer verandert.

- Ochtend- en middagrij in het weekrooster visueel gelijkgetrokken: beide inhoudsrijen zijn neutraal; alleen het dagdeellabel gebruikt blauw/oranje. Bezet ochtend blijft blauw, bezet middag oranje, gereserveerd grijs en vrij neutraal.

- Roosterstatussen/dagdelen opgeschoond: vrije plekken zijn neutraal, reserveringen grijs, bezette ochtendplekken blauw en bezette middagplekken warm oranje; de middagrij zelf gebruikt alleen nog een warme scheidingscue.

- Middagdelen in het rooster hebben nu een iets donkerdere warme oranje/beige tint, zodat ochtend en middag visueel beter uit elkaar liggen zonder onrustig te worden.

- Roosterstatussen visueel sterker van elkaar onderscheiden: Vrij blijft wit/transparant met stippelrand, Gereserveerd is duidelijk grijs, en Bezet krijgt een lichtblauwe vulling met blauwe accentlijn.

- Lokaalcapaciteiten gecorrigeerd naar de werkelijke aantallen: MM1 10, MM2 10, MM3 12, IT1 10, IT2 10, IT3 11 plekken.

- Gereserveerde roosterplekken hebben nu een neutrale grijze stijl en tonen “Plek X” en “Gereserveerd” met duidelijke onderlinge ruimte, zodat ze niet meer op middagkaarten lijken.

- Bij hele-dag roosterplaatsingen worden afwijkende tijden nu alleen op het relevante dagdeel getoond: later starten alleen op het ochtendkaartje, eerder weg alleen op het middagkaartje.

- De tekst voor afwijkende tijden op roosterkaartjes is vergroot zodat later starten / eerder weg visueel duidelijker opvalt.

- Begeleiders kunnen bij een roosterplaatsing nu optioneel later starten en/of eerder vertrekken instellen met een tijd; afwijkende tijden worden opgeslagen en met een oranje indicator zichtbaar op roosterkaarten voor begeleiding en mediënt.

- De vrijdagkaart in het mediëntrooster is nu exact top-aligned met de andere dagen: het ochtendblok begint op dezelfde verticale positie als de overige ochtendblokken.

- De dagkaarten in het mediëntrooster starten hun inhoud nu altijd bovenaan; hierdoor rekt vrijdag niet meer uit als er alleen een ochtendblok is en oogt die dag consistent met de rest van de week.

- De stemminggrafiek gebruikt nu weer de volle kaartbreedte, maar met een veel bredere interne aspect ratio zodat de grafiek platter blijft en geen loze zijruimte meer heeft op ultrawide schermen.

- De stemminggrafiek compacter gemaakt op desktop en ultrawide: kleinere grafiekhoogte en een begrensde maximale breedte zodat de visual niet meer gigantisch schaalt op brede schermen.

- Stemmingstrend in het mediëntprofiel toont voorlopig alleen Dagstart; dagafsluitingen blijven wel opgeslagen zodat deze later weer zichtbaar gemaakt kunnen worden.

- De 4 samenvattingskaarten bovenin het mediëntprofiel-overzicht staan op desktop nu naast elkaar in één rij in plaats van 3+1 verdeeld over twee regels.

- Kalender-dagpopup visueel opgeschoond: echte binnenpadding, betere tijd/titel/type-uitlijning en een compacte secundaire Nieuwe afspraak-knop.

- Rechter kalender uitgebreid: één klik op een dag opent een dagoverzicht met bestaande afspraken/items; dubbelklik blijft een nieuwe afspraak aanmaken.

- Begeleiding kan de data in `Spectrum gesloten` nu zelf beheren: sluitingsdagen toevoegen, bewerken en verwijderen met naam, type en datum/periode.

- Nieuwe rechter-sidebarwidget `Spectrum gesloten` toegevoegd voor komende vakanties en feestdagen; alleen toekomstige sluitingsdagen worden compact getoond.

- Rechter sidebar: Agenda hernoemd naar Upcoming en beperkt tot de komende 2 weken; datums worden per item getoond en de Uitgelicht-sectie is verwijderd.

- Na inloggen krijgen mediënten een popup voor ongelezen nieuwe berichten met `Bericht gelezen` en `Herinner me later`; gelezen zet direct de berichtstatus om, later laat het bericht ongelezen voor een volgende login.

- Gelezen/ongelezen-toggle in dashboardberichten links uitgelijnd met datum, titel en berichttekst.

- Dashboardmededelingen kunnen nu direct als gelezen/ongelezen worden gemarkeerd; bij gelezen berichten blijft de toggle volledig zichtbaar terwijl de inhoud op 14% staat.

- Titelbalkhoogte nu expliciet gelijkgetrokken: dashboard- en detailbalken zijn beide exact 50px hoog; dashboardformaat is de standaard.

- Titelbalken op detailpagina’s gelijkgetrokken met de grotere dashboardtitelbalken; dashboardformaat is nu de standaard.

- Gelezen mededelingen op zowel dashboard als Mededelingenpagina teruggebracht naar 14% opacity.

- Mediëntenrooster toont nu pauzetijden in de ochtend- en middagkaarten (10:30–11:00 en 14:30–15:00) en een lunchpauze van 12:30–13:00 tussen beide dagdelen; vrijdag blijft na 12:30 gesloten.

- Lege “Niet ingepland”-blokken in het mediëntenrooster teruggebracht naar 14% opacity zodat ze veel minder aandacht trekken.

- Mediëntenrooster: `Niet ingepland`-blokken neutraal grijs gemaakt in plaats van de ochtend-/middagkleur te behouden.

- Takenbord: omschrijving wordt nu altijd volledig in de taakkaart getoond; kaarten groeien mee met langere tekst in plaats van deze af te kappen.

- Verplaats-pijltjes uit het mediënten-takenbord verwijderd; kaarten worden uitsluitend via drag & drop tussen kolommen verplaatst.

- Doelen rich-text-toolbar opnieuw opgebouwd: uniforme 36px-knoppen, gelijke spacing/baseline, separators verwijderd en lijst/kleurknoppen visueel gelijkgetrokken.

- Uitlijning van de knoppen in de Doelen rich-text-toolbar gecorrigeerd; alle opmaakknoppen en de kleurknop delen nu dezelfde centrering en hoogte.

- Doelen-editor uitgebreid met datumkiezer en inline rich-text opmaak (vet, cursief, onderstrepen, tekstkleur, bullets en nummering); opmaak en datum worden ook in de doelkaarten weergegeven.

- Donkerblauwe dubbele `+ Sprintdoel`-knop uit de Doelen-header verwijderd; de inline Sprintdoel-knop blijft staan.

- Letterspacing van kleine rechterrail-labels zoals VANDAAG teruggebracht naar dezelfde compactere tracking als de dashboard-contextlabels.

- Dashboard-contextlabel exact gecorrigeerd: Persoonlijke omgeving / Begeleidersomgeving gebruikt nu .035em tracking via de daadwerkelijke .design-dashboard-header .eyebrow selector.

- Letterspacing van de kleine contexttitel boven de paginatitel nog verder verlaagd voor een duidelijk compacter resultaat.

- Letterspacing van de kleine contexttitel boven de paginatitel verlaagd voor zowel Persoonlijke omgeving als Begeleidersomgeving.

- Werkelijke dashboardtitelbalken aangepast: titeltekst staat nu duidelijk verder van de linker ronde rand met ruimere horizontale inset.

- Tekst in de gekleurde titelbalken verder van de linkerrand gezet; padding links, boven en onder meer in balans gebracht.

- Profielkaart linker sidebar uit de globale pill-radius gehaald; gebruikt nu dezelfde normale kaart-radius als de rest van de interface.

- Linker sidebar-profielkaart gecorrigeerd naar een echte afgeronde rechthoek met normale radius, volledige border en subtiele achtergrond.

- Profielknop/-selector in de linker sidebar aangepast naar een afgeronde rechthoek met dezelfde normale radius als de rest van de interface.

- Rechter dashboardrail exact uitgelijnd met de bovenkant van het Dashboard-kader; eerdere te hoge positie gecorrigeerd.

- Dashboardrechterrail uitgelijnd met het dashboardhoofdblok en breder gemaakt, zodat tijdsblokken in de agenda naast elkaar passen.

- Rollback van de 2026-09-08 MEGA-feedbackpass. Alleen de realistische populatie van 100 mediënten en de compacte Sprintreviews-opzet zijn behouden; overige wijzigingen zijn teruggezet naar de voorgaande v2.4-basis.

- Grote feedbackpass: UI-polish, rich goal editor, vaste taakomschrijvingen, staff takenagenda, Upcoming/closures/calendar-info, roster-capaciteiten/tijden, 100-demo-mediënten en compacte Sprintreviews.

- Sprintreviews en Mijn Taken visueel gelijkgetrokken; sprintreview-kaarten zijn nu versleepbaar tussen begeleiderkolommen en wijzigen daarmee de begeleiderkoppeling.
- Nummer-badges verwijderd uit Sprintreviews en de begeleider-Doelenweergave.
- Begeleider → Doelen gebruikt nu zoeken + afdelingsfilter + één mediënt-dropdown in plaats van een lange genummerde mediëntenlijst.

- Dashboardwidgets nu content-driven: in Standaard groeien/krimpen ze automatisch met hun preview; in Custom kan een widget niet kleiner worden dan de zichtbare inhoud. Footers kunnen daardoor niet meer over berichten, mediënten of evenementen heen vallen.

- Dashboard-previewwidgets aangepast: Mededelingen, Mijn mediënten vandaag en Aankomende evenementen hebben nu een losse footer-sectie voor de doorklik-link; previews tonen alleen volledige items en ogen niet meer als scrollvlakken.

- Sprintreviews-legenda vereenvoudigd: kleurnamen verwijderd, alleen de betekenis per kleur blijft zichtbaar.

- Sprintreviews kolomkoppen definitief opgeschoond: functietitel wordt hard verborgen; alleen avatar, naam en aantal blijven zichtbaar. Cache-busting toegevoegd voor lokale CSS/JS.

- Sprintreviews: functietitel “Multimedia-begeleider” uit de kolomkoppen verwijderd; alleen de begeleidersnaam en het aantal mediënten blijven staan.

- Sprintreviews aangepast naar de Photoshop-mockup: compacte horizontale statusrijen, datum gecentreerd en klikbare statusdot voor blauw/paars/automatisch.
- Sprintstatuslogica gecorrigeerd: iedere handmatige datumwijziging zet de mediënt direct op groen en start een nieuwe 31-dagen-groen + 14-dagen-geel cyclus, onafhankelijk van de ingevulde sprintdatum.

- Sprintreviews uitgewerkt als statusbord met drie Multimedia-begeleiderkolommen, automatische groen/geel/rood-veroudering, klikbare reviewdatum en handmatige blauw/paars-status.

- Begeleiders hebben nu een hoofditem **Mediënten** in de sidebar; standaard worden alle mediënten getoond en een klik opent het profiel.
- Mediëntprofielen hebben voor begeleiders nu ook een **Doelen**-tab naast Overzicht, Taken, Dagverslagen en Rooster.
- Het rooster in een mediëntprofiel staat horizontaal per weekdag in plaats van als verticale lijst.
- Vrijdagmiddag is volledig leeg/gesloten in alle roosterweergaven en kan niet ingepland worden.
- Alleen Multimedia-begeleiders zien voorlopig het sidebar-item **Sprintreviews** met een placeholderpagina voor latere uitwerking.

- Doelen herwerkt: persoonlijke doelen prominent links met geel/oranje accent; sprintdoelen apart rechts.
- Mediënten kunnen zelf sprintdoelen toevoegen en bewerken.
- Begeleiders krijgen een zoek/filterbare mediëntenlijst op Doelen en kunnen per mediënt persoonlijke en sprintdoelen beheren.
- Nieuwe mededeling/evenement gebruikt nu één gedeelde composer met radio-keuze voor het type.

- Evenementflow gerepareerd: nieuwe evenementen gebruiken geen verouderde standaarddatum meer, verschijnen direct in Aankomende evenementen en leveren voor relevante mediënten een nieuwe notificatie op; persoonlijke agenda blijft afhankelijk van inschrijving.

- Notificaties-knop in de sidebar weer zichtbaar gemaakt voor mediënten, inclusief badge met nieuwe meldingen.

- Begeleiders kunnen nu vanuit de zichtbare Mededelingen-pagina een nieuw evenement aanmaken; de evenementenwidget opent voortaan het volledige evenementenbeheer.
- De buitenste afronding van de rechter dashboardkolom is verwijderd voor zowel mediënt als begeleiding; de losse kaarten behouden de normale panel-radius.
- Mediëntprofielen tonen voor begeleiding nu een stemmingstrendgrafiek met Dagstart en Dagafsluiting en filters Week, Maand, Kwartaal, Jaar en Vanaf start.
- Demo-mediënten hebben historische smileydata zodat alle grafiekperiodes in het prototype beoordeeld kunnen worden; nieuwe accounts bouwen deze historie vanaf hun aanmaakdatum op.

- Teamfeedback verwerkt: dashboardradii consistenter en titelvlak gelijk aan widgets.
- Dagstart-smiley zichtbaar voor begeleiding in mediëntenlijsten en het mediëntoverzicht; dagstart is verplicht bij mediënt-login.
- Dialog-kruisjes en Annuleren sluiten nu expliciet (uitklokken, berichten, evenementen en overige modals).
- Mediëntnavigatie gebruikt Mijn Doelen, Mijn Taken en Mijn Rooster.
- Mediëntroosters tonen aparte ochtend- (blauw) en middagblokken (geel/oranje), ook in profiel en begeleider-overzicht; roostereditor werkt per dagdeel.
- Begeleiderdashboard gebruikt nu dezelfde modulaire widgetlayout en rechter agenda/kalenderkolom als het mediëntdashboard.
- Evenementen verschijnen voor mediënten pas in de agenda na inschrijving; bij Misschien verschijnt een beslis-reminder in de agenda.

- UI-radius cleanup: vaste radius-hiërarchie ingevoerd; echte geneste vlakken volgen nu de buitenradius minus inset, met aparte niveaus voor panels, kaarten, controls en pills.

- Vastgepinde dashboardwidgets gebruiken nu dezelfde neutrale border als andere widgets; de blauwe outline is verwijderd.

- Sidebar is nu één effen Spectrum-blauw; gradient en decoratieve overlay zijn verwijderd.
- Actieknoppen zijn omgezet naar pill-vorm.
- Kalenderbolletjes zijn groter en gebruiken per categorie uitsluitend Spectrum-huisstijlkleuren.
- Begeleiders kunnen een mediëntprofiel verwijderen.
- Roosterplekken kunnen per plek en via Ctrl/Cmd-multiselect op Mediënt / Gereserveerd / Vrij worden gezet.

- Begeleiders kunnen geen afspraken meer met mediënten inplannen; de actie is uit het mediëntprofiel verwijderd en oude begeleider→mediënt-afspraakvoorstellen worden niet meer meegenomen.
- In het mediëntprofiel van begeleiding heet Planning nu Rooster; dit gebruikt dezelfde `roomAssignments` als de Rooster-pagina en blijft dus tweerichtings gesynchroniseerd.
- Rooster is voor begeleiding nu uitsluitend een weekweergave; de dagweergave en dag/week-toggle zijn verwijderd.
- Weekrooster ondersteunt Ctrl/Cmd + klik voor meervoudige vakselectie en batchgewijs een mediënt instellen.
- Begeleiders hebben accountbeheer in Profiel: nieuwe mediënt-/begeleideraccounts aanmaken en wachtwoorden instellen/resetten.
- Iedere gebruiker, inclusief mediënten, kan het eigen wachtwoord wijzigen in Profiel; inloggen controleert nu daadwerkelijk het opgeslagen wachtwoord.

- Spectrum HUB-logo vervangen door een outlined SVG-versie, zodat de tekst niet meer afhankelijk is van lokale fonts of serif-fallbacks.

- Spectrum HUB-logo opnieuw 1-op-1 vanuit de aangeleverde SVG geplaatst; SVG-viewport verruimd zodat de B van HUB niet meer wordt afgesneden.

- Standaard dashboardlayout gewijzigd: dashboardwidgets staan voortaan onder elkaar en vullen de volledige breedte van het hoofdvlak.

- Bij Begeleiding aanwezig wordt “★ Vast” nu alleen nog bij de vaste procesbegeleider getoond; vakbegeleiders krijgen deze markering niet meer.

- Doelenpagina aangepast: voortgangsbalken en percentages verwijderd; doelen staan nu als ruimere tekstblokken onder elkaar.

- Agenda in de rechterkolom luchtiger gemaakt: ruimere tekstverdeling en de redundante datum bij 'Vandaag' verwijderd.

- Sidebar-branding aangepast: uitgeklapt toont nu Spectrum HUB; ingeklapt toont alleen het lampje.

- Inklapknop uit de sidebar gehaald en in het contentgedeelte geplaatst, zoals in de PDF-richting.
- Uitgeklapte sidebar toont nu het volledige Spectrum-logo gecentreerd; ingeklapte sidebar toont alleen het lamp-icoon.

# Changelog — PDF Layout Study v2.4

## Laatste update
- Begeleidersweekplanning ondersteunt nu **gedeelde taken**: één taak kan aan één of meerdere begeleiders worden gekoppeld en verschijnt bij alle gekoppelde accounts.
- Gedeelde taken blijven één object: bewerken, verplaatsen, resizen en verwijderen werkt voor alle gekoppelde begeleiders tegelijk; overlapcontrole houdt rekening met ieders planning.
- Voor mediënten is **+ Doel toevoegen** volledig verborgen; alleen begeleiders zien de beheeractie.
- **Mededelingen & Doelen** opgesplitst in twee aparte hoofditems: **Mededelingen** en **Doelen**.
- De pagina Mededelingen bevat alleen nog mededelingen; doelen hebben een eigen pagina gekregen.
- Op het compacte inlogscherm is voor mediënten een vijfstaps smiley-keuze toegevoegd voor **Hoe ga je de dag in?**.
- In de uitlog-/dagboekflow is dezelfde vijfstaps keuze toegevoegd voor **Hoe ga je de dag uit?**.
- De twee dagindicaties worden lokaal bij de werkdag opgeslagen en verschijnen bij het dagverslag als start → einde.
- Voor begeleiders wordt de smiley-vraag bij het inloggen verborgen; de dagindicatie is bedoeld voor mediënten.

## Reeds in v2.4
- De rechter dashboardkolom is onderdeel van **Dashboard aanpassen**.
- Widgets kunnen tussen **Hoofdvlak** en **Rechterkolom** worden geplaatst.
- Bestaande kaarten in de rechterkolom zijn in bewerkmodus verticaal versleepbaar.
- Een wijziging maakt automatisch een **Custom**-layout; **Standaard** blijft onaangetast.
- Roosterbediening verder aangescherpt: de witte pill-achtergronden van afdeling en lokalen schalen nu op inhoud in plaats van onnodig breed uit te rekken.
- Roosterkop compacter gemaakt: de overbodige bloktekst met "Vaste weekindeling", lokaalnaam en selectie-uitleg is verwijderd zodat de tabel directer begint en minder verticale ruimte inneemt.


## v2.5 — visuele consistentie
- Gekleurde titelbalken van widgets en lokalen hebben dezelfde afgeronde rechthoekvorm.
- Knoppen en statuspillen behouden/ontvangen pilvorm.
- Upcoming: slot (Spectrum dicht), koffer (vakantie), feesticoon (evenement), kalender met vinkje (afspraak), tekstballon (mededeling).
- Opslagsleutel blijft v2.4 om bestaande demo-instellingen te behouden.
