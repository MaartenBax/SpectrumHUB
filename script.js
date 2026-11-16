(() => {
  "use strict";

  const STORAGE_KEY = "spectrumHubLiveDemoV24";
  const CALENDAR_MIN = "2026-07-01";
  const CALENDAR_MAX = "2027-12-31";
  const columnNames = { todo: "Te doen", doing: "Mee bezig", help: "Hulp/overleg nodig", done: "Klaar" };
  const roleConfig = {
    "client-mm": { label: "Multimedia-mediënt", kind: "client", department: "multimedia", fixedTrade: "lindsay", fixedProcess: "andy" },
    "client-it": { label: "IT-mediënt", kind: "client", department: "it", fixedTrade: "marjolaine", fixedProcess: "dax" },
    "staff-mm": { label: "Multimedia-begeleider", kind: "staff", department: "multimedia", caseload: ["Maarten"] },
    "staff-it": { label: "IT-begeleider", kind: "staff", department: "it", caseload: [] },
    "staff-process": { label: "Procesbegeleider", kind: "staff", department: "process", caseload: ["Maarten"] }
  };
  const accountNames = { "client-mm": "Maarten", "client-it": "Robin", "staff-mm": "Lindsay", "staff-it": "Marjolaine", "staff-process": "Andy" };
  function lucideIcon(name, className = "lucide-icon") {
    return `<svg class="${className}" aria-hidden="true" focusable="false"><use href="#icon-${name}"></use></svg>`;
  }
  const widgetNames = {
    tasks: "Planbord",
    weather: "Weer in Breda",
    attendance: "Begeleiding aanwezig",
    messages: "Mededelingen",
    diary: "Laatste dagboeknotitie",
    workspace: "Mijn werkplek",
    agenda: "Upcoming",
    closures: "Spectrum dicht",
    calendar: "Kalender"
  };
  const railWidgetNames = {
    workspace: "Mijn werkplek",
    agenda: "Upcoming",
    closures: "Spectrum dicht",
    calendar: "Kalender"
  };
  const dashboardWidgetIds = ["tasks", "messages", "attendance", "diary", "weather"];
  const auxiliaryWidgetIds = ["workspace", "agenda", "closures", "calendar"];
  const allWidgetIds = [...dashboardWidgetIds, ...auxiliaryWidgetIds];
  const permanentlyMandatoryWidgets = new Set(["messages"]);
  const categoryNames = {
    appointment: "Afspraak",
    personal: "Persoonlijk",
    reminder: "Herinnering"
  };
  const staffPlannerColors = {
    blue:   { label:"Blauw",   bg:"#eaf5fd", border:"#b8d8ee", accent:"#61a5e4", text:"#31556f", description:"#526f84", muted:"#617a8e" },
    green:  { label:"Groen",   bg:"#edf8f1", border:"#bfdfc9", accent:"#62aa78", text:"#356348", description:"#537562", muted:"#61796a" },
    teal:   { label:"Turquoise",bg:"#e9f8f7", border:"#b8dfdc", accent:"#58aaa5", text:"#2f6764", description:"#4d7472", muted:"#5b7977" },
    yellow: { label:"Geel",    bg:"#fff8e8", border:"#ead6a1", accent:"#e2b34f", text:"#755d25", description:"#806f48", muted:"#857650" },
    orange: { label:"Oranje",  bg:"#fff0e5", border:"#e7c4a7", accent:"#e59651", text:"#7a4f2b", description:"#815f43", muted:"#896c55" },
    purple: { label:"Paars",   bg:"#f2edfb", border:"#d2c3e9", accent:"#8d72c7", text:"#5c477d", description:"#6d5c82", muted:"#78698a" },
    pink:   { label:"Roze",    bg:"#fbeef4", border:"#e8c1d2", accent:"#c87598", text:"#7a4960", description:"#805e6c", muted:"#8a6c79" },
    gray:   { label:"Grijs",   bg:"#f2f5f7", border:"#d1d9df", accent:"#8092a0", text:"#4e606d", description:"#63717b", muted:"#707d86" }
  };
  const moodOptions = {
    1: { emoji: "😞", label: "Heel zwaar" },
    2: { emoji: "🙁", label: "Niet zo goed" },
    3: { emoji: "😐", label: "Neutraal" },
    4: { emoji: "🙂", label: "Goed" },
    5: { emoji: "😄", label: "Heel goed" }
  };
  const roomDays = [["ma", "Maandag"], ["di", "Dinsdag"], ["wo", "Woensdag"], ["do", "Donderdag"], ["vr", "Vrijdag"]];
  const rooms = [
    { id: "mm-1", name: "Multimedia 1", department: "multimedia", seats: 10 },
    { id: "mm-2", name: "Multimedia 2", department: "multimedia", seats: 10 },
    { id: "mm-3", name: "Multimedia 3", department: "multimedia", seats: 12 },
    { id: "it-1", name: "IT 1", department: "it", seats: 10 },
    { id: "it-2", name: "IT 2", department: "it", seats: 10 },
    { id: "it-3", name: "IT 3", department: "it", seats: 11 }
  ];

  // Demo-sluitingskalender. De exacte Spectrum-vakantiedata kunnen later centraal beheerd worden.
  const defaultSpectrumClosures = [
    { id: "christmas-break-2026", start: "2026-12-24", end: "2027-01-03", title: "Kerstvakantie", type: "Spectrum dicht" },
    { id: "kings-day-2027", start: "2027-04-27", end: "2027-04-27", title: "Koningsdag", type: "Feestdag" },
    { id: "ascension-2027", start: "2027-05-06", end: "2027-05-06", title: "Hemelvaartsdag", type: "Feestdag" },
    { id: "whit-monday-2027", start: "2027-05-17", end: "2027-05-17", title: "Tweede pinksterdag", type: "Feestdag" },
    { id: "christmas-break-2027", start: "2027-12-24", end: "2028-01-02", title: "Kerstvakantie", type: "Spectrum dicht" }
  ];

  const loginDeferredItems = new Set();
  let clientAttentionSnapshot = new Set();
  let clientAttentionPollTimer = 0;
  function loginDeferredItemKey(kind, id) { return `${kind}:${id}`; }

  const defaultState = {
    authenticated: false,
    role: "client-mm",
    sidebarCollapsed: false,
    reduceMotion: false,
    darkMode: false,
    themeModeByAccount: {},
    dashboardPreset: "standard",
    customDashboard: null,
    dashboardEditMode: false,
    rightRailState: "expanded",
    widgetSizes: { tasks: "normal", attendance: "normal", messages: "normal", weather: "normal", diary: "normal", workspace: "wide", agenda: "wide", closures: "wide", calendar: "wide" },
    widgetZones: { tasks: "main", messages: "main", attendance: "main", diary: "main", weather: "main", workspace: "right", agenda: "right", closures: "right", calendar: "right" },
    rightRailOrder: ["agenda", "calendar", "workspace", "closures"],
    hiddenRailItems: [],
    railItemSizes: { workspace:"large", agenda:"large", closures:"large", calendar:"large" },
    closures: JSON.parse(JSON.stringify(defaultSpectrumClosures)),
    widgetLayout: {
      tasks: { x: 1, y: 9, w: 12, h: 6 },
      messages: { x: 1, y: 1, w: 12, h: 8 },
      attendance: { x: 1, y: 15, w: 12, h: 4 },
      diary: { x: 1, y: 19, w: 12, h: 3 },
      weather: { x: 1, y: 22, w: 12, h: 3 },
      workspace: { x: 1, y: 25, w: 6, h: 3 },
      agenda: { x: 7, y: 25, w: 6, h: 4 },
      closures: { x: 1, y: 29, w: 6, h: 4 },
      calendar: { x: 7, y: 29, w: 6, h: 5 }
    },
    messageRead: [],
    notificationSeen: [],
    messages: [
      { id: "m-live-unread", title: "Gezamenlijke dagstart woensdag", publishedAt: "2026-09-21T09:15", text: "Woensdag starten Multimedia en IT om 09:00 gezamenlijk in de ontmoetingsruimte. Daarna gaat iedereen naar de eigen werkplek.", audience: "all", important: true },
      { id: "m-mm-portfolio", title: "Portfolio-moment Multimedia", publishedAt: "2026-09-18T14:10", text: "Donderdag 24 september is er van 10:30 tot 11:30 een open portfolio-moment in Multimedia 2. Neem werk mee waar je feedback op wilt.", audience: "multimedia", important: false },
      { id: "m-it-maintenance", title: "Kort netwerkonderhoud dinsdagmiddag", publishedAt: "2026-09-18T11:40", text: "Dinsdag tussen 15:00 en 15:30 kan de internetverbinding bij IT kort wegvallen door gepland onderhoud aan de switch.", audience: "it", important: false },
      { id: "m-all-absence", title: "Afmelden bij afwezigheid", publishedAt: "2026-09-16T10:00", text: "Kun je op een ingeplande dag niet komen? Laat het vóór 09:00 weten bij je begeleider, zodat de werkplek beschikbaar kan worden gemaakt.", audience: "all", important: false }
    ],
    agendaView: "month",
    clock: { active: false, startedAt: null },
    clocks: {
      "client-mm": { active: false, startedAt: null },
      "client-it": { active: false, startedAt: null }
    },
    sessionActivity: [],
    dailyMood: [],
    widgetOrder: ["messages", "tasks", "attendance", "diary", "weather", "agenda", "calendar", "workspace", "closures"],
    hiddenWidgets: ["weather", "diary", "closures"],
    mandatoryWidgets: ["messages"],
    pinnedWidgets: ["messages", "tasks"],
    calendarCursor: "2026-09",
    selectedDate: "2026-09-21",
    eventResponses: {},
    eventParticipants: {
      "live-bordspellen": [
        { name: "Sam", department: "multimedia", status: "yes", note: "" },
        { name: "Daan", department: "it", status: "yes", note: "" },
        { name: "Eva", department: "multimedia", status: "maybe", note: "" }
      ],
      "live-photo": [{ name: "Lina", department: "multimedia", status: "yes", note: "" }],
      "live-it-clinic": [{ name: "Yara", department: "it", status: "maybe", note: "" }],
      "live-lunch": []
    },
    profiles: {
      "client-mm": { email: "maarten@voorbeeld.nl", contactPreference: "hub", weekdays: ["ma", "wo", "vr"] },
      "staff-mm": { email: "lindsay@voorbeeld.nl", contactPreference: "both", weekdays: ["ma", "di", "wo", "do"], linkedRooms: ["mm-1"] },
      "staff-it": { email: "marjolaine@voorbeeld.nl", contactPreference: "email", weekdays: ["ma", "di", "do", "vr"], linkedRooms: ["it-1"] }
    },
    accounts: [
      { id: "client-mm", name: "Maarten", kind: "client", department: "multimedia", password: "spectrum", memberSince: "2024-09-01" },
      { id: "staff-mm", name: "Lindsay", kind: "staff", department: "multimedia", password: "spectrum", isAdmin: true },
      { id: "staff-it", name: "Marjolaine", kind: "staff", department: "it", password: "spectrum" }
    ],
    events: [], // uitsluitend behouden voor compatibiliteit met eerder opgeslagen gegevens
    goals: [
      { id: "g-martin-personal", client: "Maarten", department: "multimedia", type: "personal", title: "Zelfstandiger plannen", text: "Werk met een duidelijke starttaak en een haalbare planning. Het persoonlijke doel is de grotere ontwikkelrichting en mag daarom uitgebreider beschreven worden." },
      { id: "g-martin-sprint", client: "Maarten", department: "multimedia", type: "sprint", title: "Portfolio aanvullen", text: "Voeg twee afgeronde projecten toe en schrijf per project een korte toelichting." },
      { id: "g-robin-personal", client: "Robin", department: "it", type: "personal", title: "Meer zelfstandig problemen analyseren", text: "Probeer bij technische problemen eerst zelf de oorzaak af te bakenen en noteer welke stappen je hebt geprobeerd voordat je hulp vraagt." },
      { id: "g-robin-sprint", client: "Robin", department: "it", type: "sprint", title: "Handleiding afronden", text: "Werk deze sprint de installatiehandleiding af en laat hem door iemand testen." },
      { id: "g-lina-personal", client: "Lina", department: "multimedia", type: "personal", title: "Meer vertrouwen in eigen ontwerpkeuzes", text: "Oefen met het onderbouwen van ontwerpkeuzes zonder direct bevestiging te hoeven vragen." }
    ],
    sprintReviews: [
      { client: "Maarten", guide: "Lindsay", reviewDate: "2026-08-25", manualStatus: null },
      { client: "Sam", guide: "Chelle", reviewDate: "2026-08-03", manualStatus: null },
      { client: "Lina", guide: "Ruben", reviewDate: "2026-07-15", manualStatus: null },
      { client: "Noah", guide: "Lindsay", reviewDate: "2026-08-10", manualStatus: "purple" },
      { client: "Eva", guide: "Chelle", reviewDate: "2026-08-20", manualStatus: "blue" }
    ],
    roomTab: "multimedia",
    roomDay: "ma",
    roomView: "week",
    roomSelectedRoom: { multimedia: "mm-1", it: "it-1" },
    roomAssignments: [
      { id: "ra1", roomId: "mm-1", seat: 2, day: "ma", part: "full", client: "Sam" },
      { id: "ra2", roomId: "mm-1", seat: 3, day: "ma", part: "morning", client: "Lina" },
      { id: "ra3", roomId: "mm-2", seat: 1, day: "ma", part: "full", client: "Eva" },
      { id: "ra4", roomId: "it-1", seat: 1, day: "di", part: "full", client: "Robin" },
      { id: "ra5", roomId: "it-1", seat: 2, day: "di", part: "afternoon", client: "Yara" },
      { id: "ra6", roomId: "it-2", seat: 3, day: "do", part: "full", client: "Daan" },
      { id: "ra7", roomId: "mm-1", seat: 1, day: "ma", part: "full", client: "Maarten" },
      { id: "ra8", roomId: "mm-1", seat: 1, day: "wo", part: "full", client: "Maarten" },
      { id: "ra9", roomId: "mm-1", seat: 1, day: "vr", part: "morning", client: "Maarten" },
      { id: "ra10", roomId: "mm-2", seat: 2, day: "wo", part: "afternoon", client: "Noah" },
      { id: "ra11", roomId: "it-1", seat: 1, day: "do", part: "full", client: "Robin" }
    ],
    roomReservations: [],
    roomAudit: [
      { id: "log1", at: "2026-07-29T08:35:00", staff: "Lindsay", text: "Sam ingepland op Multimedia 1 · plek 1 · hele dag" },
      { id: "log2", at: "2026-07-29T08:40:00", staff: "Marjolaine", text: "Robin ingepland op IT 1 · plek 1 · hele dag" }
    ],
    agendaItems: [
      { id: "a-live-1", owner: "client-mm", title: "Feedbackmoment huisstijl", date: "2026-09-22", start: "10:15", end: "10:45", category: "appointment", description: "Kleurgebruik en typografie van de nieuwe projectpagina bespreken." },
      { id: "a-live-2", owner: "client-mm", title: "Portfolio-moment", date: "2026-09-24", start: "10:30", end: "11:30", category: "appointment", description: "Twee recente projecten laten zien en feedback noteren." },
      { id: "a-live-5", owner: "client-it", title: "Netwerkopdracht bespreken", date: "2026-09-22", start: "11:00", end: "11:30", category: "appointment", description: "VLAN-opzet en testresultaten met begeleiding doornemen." },
    ],
    staffPlannerTasks: [
      { id:"sp-live-1", ownerRole:"staff-mm", createdByRole:"staff-mm", assignedStaff:["staff-mm"], title:"Dagstart Multimedia", day:0, date:"2026-09-21", start:"09:00", end:"09:30", color:"blue", description:"Korte gezamenlijke start: planning, bijzonderheden en hulpvragen.", completed:false },
      { id:"sp-live-2", ownerRole:"staff-mm", createdByRole:"staff-mm", assignedStaff:["staff-mm"], title:"Voortgang Maarten", day:0, date:"2026-09-21", start:"10:00", end:"10:30", color:"green", description:"Sprintdoelen en belastbaarheid kort afstemmen.", completed:false },
      { id:"sp-live-3", ownerRole:"staff-mm", createdByRole:"staff-mm", assignedStaff:["staff-mm"], title:"Portfolio-feedback", day:1, date:"2026-09-22", start:"11:00", end:"12:00", color:"teal", description:"Feedbackrondes voor mediënten met werk voor hun portfolio.", completed:false },
      { id:"sp-live-4", ownerRole:"staff-it", createdByRole:"staff-it", assignedStaff:["staff-it"], title:"IT-vragenuur voorbereiden", day:2, date:"2026-09-23", start:"10:30", end:"11:00", color:"purple", description:"Openstaande vragen verzamelen en testomgeving klaarzetten.", completed:false },
    ],
    tasks: [
      { id: "t-mm-1", client: "Maarten", title: "Beeldselectie dienstenpagina", column: "todo", label: "Multimedia", due: "2026-09-23", description: "Kies zes beelden die samen één consistente uitstraling hebben voor de dienstenpagina." },
      { id: "t-mm-2", client: "Maarten", title: "Projectbeschrijving portfolio", column: "todo", label: "Multimedia", due: "2026-09-25", description: "Schrijf een korte toelichting bij het afgeronde huisstijlproject: vraag, aanpak en resultaat." },
      { id: "t-mm-3", client: "Maarten", title: "Homepage-banner uitwerken", column: "doing", label: "Multimedia", due: "2026-09-22", description: "Werk de gekozen compositie uit en maak een desktop- en mobiele variant.", active: true },
      { id: "t-mm-4", client: "Maarten", title: "Kleurcorrectie laten beoordelen", column: "help", label: "Multimedia", due: "2026-09-22", description: "Vraag feedback op huidtinten en contrast voordat de definitieve export wordt gemaakt." },
      { id: "t-mm-5", client: "Maarten", title: "Beeldbank opschonen", column: "done", label: "Multimedia", due: "2026-09-18", description: "Bestandsnamen en projectmappen volgens de nieuwe structuur gezet." },
      { id: "t-it-1", client: "Robin", title: "Laptop uitleverklaar maken", column: "todo", label: "IT", due: "2026-09-23", description: "Updates installeren, standaardsoftware controleren en opleverchecklist afvinken." },
      { id: "t-it-2", client: "Robin", title: "Netwerkdocumentatie controleren", column: "todo", label: "IT", due: "2026-09-24", description: "Controleer IP-adressen, poortnummers en labels in het netwerkschema." },
      { id: "t-it-3", client: "Robin", title: "Windows-installatie testen", column: "doing", label: "IT", due: "2026-09-22", description: "Test de nieuwe installatiestappen op een schone laptop en noteer afwijkingen.", active: true },
      { id: "t-it-4", client: "Robin", title: "VLAN-configuratie bespreken", column: "help", label: "IT", due: "2026-09-22", description: "Bespreek met Marjolaine waarom twee testclients nog geen adres uit het juiste VLAN krijgen." },
      { id: "t-it-5", client: "Robin", title: "Testaccount aanmaken", column: "done", label: "IT", due: "2026-09-18", description: "Testaccount aangemaakt en gecontroleerd met de standaardrechten." }
    ],
    diary: [
      { id: "d1", client: "Maarten", department: "multimedia", date: "2026-08-01T15:34:00+02:00", text: "Vandaag gewerkt aan de nieuwe websitepagina voor de dienstverlening. Tekst geschreven, beelden toegevoegd en de layout aangepast. Morgen verder met de contactpagina." },
      { id: "d2", client: "Maarten", department: "multimedia", date: "2026-07-31T12:31:00+02:00", text: "Logo-opties uitgewerkt en een korte handleiding voor de beeldbank geschreven." },
      { id: "d3", client: "Robin", department: "it", date: "2026-08-01T15:10:00+02:00", text: "De netwerkopdracht voorbereid en de stappen voor de handleiding uitgewerkt." },
      { id: "d4", client: "Yara", department: "it", date: "2026-07-31T14:45:00+02:00", text: "Aan de installatiehandleiding gewerkt en twee problemen genoteerd om te bespreken." }
    ]
  };

  const data = {
    people: [
      { id: "lindsay", name: "Lindsay", type: "staff", department: "multimedia", role: "Multimedia-begeleider", present: true, start: "08:30", until: "16:30" },
      { id: "chelle", name: "Chelle", type: "staff", department: "multimedia", role: "Multimedia-begeleider", present: true, start: "09:00", until: "16:30" },
      { id: "ruben", name: "Ruben", type: "staff", department: "multimedia", role: "Multimedia-begeleider", present: true, start: "08:30", until: "16:30" },
      { id: "marjolaine", name: "Marjolaine", type: "staff", department: "it", role: "IT-begeleider", present: true, start: "08:30", until: "16:30" },
      { id: "stefan", name: "Stefan", type: "staff", department: "it", role: "IT-begeleider", present: true, start: "09:00", until: "16:30" },
      { id: "pim", name: "Pim", type: "staff", department: "it", role: "IT-begeleider", present: true, start: "08:30", until: "16:30" },
      { id: "sil", name: "Sil", type: "staff", department: "it", role: "IT-begeleider", present: true, start: "09:00", until: "16:30" },
      { id: "andy", name: "Andy", type: "staff", department: "process", role: "Procesbegeleider", present: true, start: "08:30", until: "16:30" },
      { id: "dax", name: "Dax", type: "staff", department: "process", role: "Procesbegeleider", present: true, start: "09:00", until: "16:30" },
      { id: "nick", name: "Nick", type: "staff", department: "process", role: "Procesbegeleider", present: true, start: "08:30", until: "16:30" },
      { name: "Maarten", type: "client", department: "multimedia", status: "Afwezig", clockedIn: "" },
      { name: "Sam", type: "client", department: "multimedia", status: "Aanwezig", clockedIn: "08:42" },
      { name: "Lina", type: "client", department: "multimedia", status: "Aanwezig", clockedIn: "09:03" },
      { name: "Noah", type: "client", department: "multimedia", status: "Afwezig", clockedIn: "" },
      { name: "Eva", type: "client", department: "multimedia", status: "Aanwezig", clockedIn: "09:10" },
      { name: "Robin", type: "client", department: "it", status: "Aanwezig", clockedIn: "08:56" },
      { name: "Milan", type: "client", department: "it", status: "Afwezig", clockedIn: "" },
      { name: "Yara", type: "client", department: "it", status: "Aanwezig", clockedIn: "08:48" },
      { name: "Daan", type: "client", department: "it", status: "Aanwezig", clockedIn: "09:12" }
    ],
    messages: [
      { id: "m1", title: "Zomer BBQ op 7 augustus", date: "Vandaag · 09:15", text: "We organiseren weer een gezellige zomer-BBQ. Meer informatie volgt via een mededeling.", audience: "all", important: true },
      { id: "m2", title: "Bordspellenmiddag volgende week", date: "Gisteren · 16:42", text: "Woensdagmiddag staat de grote tafel klaar. Neem gerust je favoriete spel mee.", audience: "all" },
      { id: "m3", title: "Nieuwe workshopplanning", date: "Gisteren · 11:08", text: "De workshopplanning voor augustus staat online.", audience: "multimedia" },
      { id: "m4", title: "Werkruimte donderdag aangepast", date: "Maandag · 14:20", text: "Donderdag gebruiken we lokaal 2 voor een externe training.", audience: "it", important: true }
    ]

  };

  function seedRealisticDemoPopulation() {
    const existing = new Set(data.people.filter(person => person.type === "client").map(person => person.name));
    const mmNames = ["Alex","Amira","Bente","Bo","Bram","Cem","Demi","Elin","Fenna","Finn","Fleur","Gijs","Hanna","Ilias","Imani","Isa","Jade","Jesse","Jill","Joep","Jules","Kai","Lars","Levi","Lotte","Maud","Mees","Mila","Niek","Nina","Olivier","Puck","Ravi","Roos","Sara","Sem","Sophie","Tess","Timo","Vera","Yfke","Yuna","Zara","Zoë","Mats"];
    const itNames = ["Adam","Aisha","Anouk","Ayoub","Cas","Dani","Dex","Dylan","Emir","Esmee","Feline","Hugo","Ilse","Jasmijn","Jayden","Jens","Jip","Jonas","Julian","Kian","Liam","Liv","Lucas","Mara","Mert","Mika","Myrthe","Naomi","Nora","Omar","Pim","Quinn","Rayan","Romy","Samir","Senna","Siem","Sven","Tara","Teun","Thijs","Tygo","Valentijn","Vince","Wout","Xavi"];
    const mmGuides=["Lindsay","Chelle","Ruben"], itGuides=["Marjolaine","Stefan","Pim","Sil"], processGuides=["Andy","Dax","Nick"];
    const add=(name,department,index)=>{ if(existing.has(name)) return; const guides=department==="it"?itGuides:mmGuides; const present=index%5===0||index%7===0; data.people.push({name,type:"client",department,status:present?"Aanwezig":"Afwezig",clockedIn:present?`0${8+(index%2)}:${String(5+(index*7)%50).padStart(2,"0")}`:"",tradeGuide:guides[index%guides.length],processGuide:processGuides[index%processGuides.length],demoGenerated:true}); existing.add(name); };
    mmNames.forEach((name,index)=>add(name,"multimedia",index));
    itNames.forEach((name,index)=>add(name,"it",index));
    // Keep the visible demo at exactly 100 mediënten.
    const clients=data.people.filter(person=>person.type==="client");
    if(clients.length>100){ const generated=clients.filter(person=>person.demoGenerated); while(data.people.filter(person=>person.type==="client").length>100&&generated.length){ const remove=generated.pop(); const idx=data.people.indexOf(remove); if(idx>=0)data.people.splice(idx,1); } }
    const mmClients=data.people.filter(person=>person.type==="client"&&person.department==="multimedia");
    const itClients=data.people.filter(person=>person.type==="client"&&person.department==="it");
    // Existing named demo clients get an explicit guide too.
    mmClients.forEach((person,index)=>{ person.tradeGuide=person.tradeGuide||mmGuides[index%mmGuides.length]; person.processGuide=person.processGuide||processGuides[index%processGuides.length]; });
    itClients.forEach((person,index)=>{ person.tradeGuide=person.tradeGuide||itGuides[index%itGuides.length]; person.processGuide=person.processGuide||processGuides[index%processGuides.length]; });
    roleConfig["staff-mm"].caseload=mmClients.filter(person=>person.tradeGuide==="Lindsay").map(person=>person.name);
    roleConfig["staff-it"].caseload=itClients.filter(person=>person.tradeGuide==="Marjolaine").map(person=>person.name);
    roleConfig["staff-process"].caseload=data.people.filter(person=>person.type==="client"&&person.processGuide==="Andy").map(person=>person.name);
    // Both departments use the same sprintreview system, with their own guides/clients.
    const existingReviews = new Map(defaultState.sprintReviews.map(item => [item.client, item]));
    defaultState.sprintReviews = [...mmClients, ...itClients].map((person, index) => {
      const existing = existingReviews.get(person.name);
      if (existing) return { ...existing, client: person.name, guide: person.tradeGuide };
      const reviewDate = dateToIso(new Date(2026, 7, Math.max(1, 25 - (index % 42))));
      return { client: person.name, guide: person.tradeGuide, reviewDate,
        manualStatus: index % 23 === 0 ? "blue" : index % 31 === 0 ? "purple" : null,
        statusResetAt: reviewDate };
    });
  }
  seedRealisticDemoPopulation();

  let state = loadState();
  if (window.spectrumSampleContent) state = window.spectrumSampleContent.apply(state);
  if (!state.clientLastNames || typeof state.clientLastNames !== "object") state.clientLastNames = {};
  const demoSurnames = ["van der Heijden","de Vries","Bakker","Jansen","Vermeer","Visser","Mulder","Smit","Bos","Meijer","de Jong","van Dijk","Kok","Peters","van den Berg","Dekker","Vos","Hendriks","van Leeuwen","Groen","Prins","van Rijn","Kuiper","Post","Dijkstra","Kramer","Jacobs","Hoekstra","Willems","van Dam","Brouwer","van der Meer","Molenaar","de Wit","Blom","van Beek","Schouten","van Vliet","van Loon","van der Linden"];
  data.people.filter(person => person.type === "client").forEach((person, index) => {
    person.seedName = person.name;
    if (!state.clientLastNames[person.name]) state.clientLastNames[person.name] = demoSurnames[index % demoSurnames.length];
  });
  if (!state.clientFirstNames || typeof state.clientFirstNames !== "object") state.clientFirstNames = {};
  if (!state.clientOverrides || typeof state.clientOverrides !== "object") state.clientOverrides = {};
  for (const [seedName, fields] of Object.entries(state.clientOverrides)) {
    const person = data.people.find(item => item.type === "client" && item.name === seedName);
    if (!person) continue;
    if (fields.removed) { data.people.splice(data.people.indexOf(person), 1); continue; }
    person.seedName = seedName;
    Object.assign(person, fields);
    for (const config of Object.values(roleConfig)) {
      if (Array.isArray(config.caseload)) config.caseload = config.caseload.map(name => name === seedName ? person.name : name);
    }
  }
  // Rebuild linked guide caseloads from the persisted assignments.
  for (const [roleId, config] of Object.entries(roleConfig)) {
    if (config.kind !== "staff") continue;
    const guideName = accountNames[roleId];
    if (guideName) config.caseload = data.people.filter(person => person.type === "client" && (config.department === "process" ? person.processGuide : person.department === config.department ? person.tradeGuide : "") === guideName).map(person => person.name);
  }
  syncAccountsFromState();
  // Planbord 2.0 uses the same complete mediënten directory as the HUB overview,
  // including demo mediënten without a login account. IDs are stable across reloads.
  window.spectrumHubPlanbordDirectory = () => {
    const existingAccounts = new Map((state.accounts || []).map(account => [`${account.kind}:${account.name}`, account]));
    const all = data.people.filter(person => person.type === "client" || person.type === "staff");
    const people = all.map(person => {
      const kind = person.type === "staff" ? "staff" : "client";
      const account = existingAccounts.get(`${kind}:${person.name}`);
      return {
        id: account?.id || `pb2-${kind}-${encodeURIComponent(person.seedName || person.name)}`,
        name: kind === "client" ? clientFullName(person.name) : person.name,
        kind,
        department: person.department || ""
      };
    });
    // Include accounts which do not currently have a corresponding person row.
    for (const account of state.accounts || []) {
      if (!people.some(item => item.id === account.id)) {
        people.push({ id:account.id, name:account.kind === "client" ? clientFullName(account.name) : account.name, kind:account.kind, department:account.department || "" });
      }
    }
    return people;
  };
  let currentPage = "dashboard";
  let widgetMove = null;
  let widgetResize = null;
  let railMove = null;
  let toastTimer = null;
  let selectedClientName = "";
  let selectedClientDetailTab = "overview";
  let agendaOwnerTarget = null;
  let roomMultiSelection = [];
  let roomSelectionMode = false;
  // Cmd/Ctrl + klikken is een tijdelijke selectie; de knop 'Meerdere selecteren'
  // gebruikt afzonderlijk de blijvende selectiemodus.
  let roomModifierSelectionActive = false;
  let roomBatchOpenedFromModifier = false;
  let roomModifierDrag = null;
  let roomSuppressDragClick = false;
  let clientMoodChartRange = "week";
  const clientMoodChartVisible = { start: true, end: true };
  let selectedGoalsClientName = "";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function cloneDefaultState() { return JSON.parse(JSON.stringify(defaultState)); }
  function standardDashboardSnapshot() {
    const base = cloneDefaultState();
    return {
      widgetOrder: [...base.widgetOrder],
      hiddenWidgets: [...base.hiddenWidgets],
      pinnedWidgets: [...base.pinnedWidgets],
      widgetSizes: JSON.parse(JSON.stringify(base.widgetSizes)),
      widgetZones: JSON.parse(JSON.stringify(base.widgetZones)),
      rightRailOrder: [...base.rightRailOrder],
      hiddenRailItems: [...base.hiddenRailItems],
      railItemSizes: JSON.parse(JSON.stringify(base.railItemSizes)),
      widgetLayout: JSON.parse(JSON.stringify(base.widgetLayout))
    };
  }
  function currentDashboardSnapshot() {
    return {
      widgetOrder: [...state.widgetOrder],
      hiddenWidgets: [...state.hiddenWidgets],
      pinnedWidgets: [...state.pinnedWidgets],
      widgetSizes: JSON.parse(JSON.stringify(state.widgetSizes)),
      widgetZones: JSON.parse(JSON.stringify(state.widgetZones)),
      rightRailOrder: [...state.rightRailOrder],
      hiddenRailItems: [...(state.hiddenRailItems || [])],
      railItemSizes: JSON.parse(JSON.stringify(state.railItemSizes || {})),
      widgetLayout: JSON.parse(JSON.stringify(state.widgetLayout))
    };
  }
  // Bijwerken van bestaande dashboardindelingen nadat Mededelingen hoger is geworden.
  function normalizeMessagesLayout(layout) {
    if (!layout?.messages) return;
    const message = layout.messages;
    const oldHeight = Number(message.h) || 3;
    if (oldHeight >= 8) { message.h = 8; return; }
    const delta = 8 - oldHeight;
    const boundary = message.y + oldHeight;
    Object.entries(layout).forEach(([id, item]) => {
      if (id === "messages" || !item) return;
      // Verplaats slechts de widgets onder Mededelingen om overlap te voorkomen.
      if (item.y >= boundary) item.y += delta;
      else if (item.y + item.h > boundary && item.x < message.x + message.w && item.x + item.w > message.x) item.y += delta;
    });
    message.h = 8;
  }
  function applyDashboardSnapshot(snapshot) {
    const safe = snapshot || standardDashboardSnapshot();
    state.widgetOrder = [...safe.widgetOrder];
    state.hiddenWidgets = [...safe.hiddenWidgets];
    state.pinnedWidgets = [...safe.pinnedWidgets];
    state.widgetSizes = JSON.parse(JSON.stringify(safe.widgetSizes));
    state.widgetZones = JSON.parse(JSON.stringify(safe.widgetZones || standardDashboardSnapshot().widgetZones));
    state.rightRailOrder = [...(safe.rightRailOrder || standardDashboardSnapshot().rightRailOrder)];
    state.hiddenRailItems = [...(safe.hiddenRailItems || standardDashboardSnapshot().hiddenRailItems)];
    state.railItemSizes = JSON.parse(JSON.stringify(safe.railItemSizes || standardDashboardSnapshot().railItemSizes));
    state.widgetLayout = JSON.parse(JSON.stringify(safe.widgetLayout));
    normalizeMessagesLayout(state.widgetLayout);
  }
  function commitDashboardCustomization() {
    const becameCustom = state.dashboardPreset !== "custom";
    state.dashboardPreset = "custom";
    state.customDashboard = currentDashboardSnapshot();
    if (becameCustom) showToast("Je aangepaste dashboard is nu opgeslagen als Custom.");
  }
  function selectDashboardLayout(mode) {
    if (mode === "standard") {
      if (state.dashboardPreset === "custom") state.customDashboard = currentDashboardSnapshot();
      applyDashboardSnapshot(standardDashboardSnapshot());
      state.dashboardPreset = "standard";
      state.dashboardEditMode = false;
    } else {
      if (state.dashboardPreset === "custom") state.customDashboard = currentDashboardSnapshot();
      const custom = state.customDashboard || standardDashboardSnapshot();
      applyDashboardSnapshot(custom);
      state.customDashboard = JSON.parse(JSON.stringify(custom));
      state.dashboardPreset = "custom";
    }
    saveState();
    applyPreferences();
    renderWidgets();
  }
  function ensureDemoMoodHistory(targetState) {
    if (!Array.isArray(targetState.dailyMood)) targetState.dailyMood = [];
    const today = parseDateOnly(prototypeToday());
    const profiles = [
      { client: "Maarten", department: "multimedia", phase: 0, since: "2024-09-01" },
      { client: "Robin", department: "it", phase: 2, since: "2025-02-01" }
    ];
    profiles.forEach(profile => {
      const existing = new Set(targetState.dailyMood.filter(item => item.client === profile.client).map(item => item.date));
      const since = parseDateOnly(profile.since);
      const totalDays = Math.max(0, Math.round((today - since) / 86400000));
      for (let back = totalDays; back >= 0; back -= 7) {
        const date = new Date(today);
        date.setDate(today.getDate() - back);
        if (date < since) continue;
        if (date.getDay() === 0) date.setDate(date.getDate() + 1);
        if (date.getDay() === 6) date.setDate(date.getDate() - 1);
        const iso = dateToIso(date);
        if (existing.has(iso)) continue;
        const wave = Math.sin((back + profile.phase * 11) / 27) + Math.cos((back + profile.phase * 5) / 13) * .45;
        const start = Math.max(1, Math.min(5, Math.round(3.25 + wave * .9)));
        const end = Math.max(1, Math.min(5, Math.round(start + Math.sin((back + 7) / 9) * .8)));
        targetState.dailyMood.push({ client: profile.client, department: profile.department, date: iso, start, end, demo: true });
      }
    });
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const merged = parsed ? { ...cloneDefaultState(), ...parsed } : cloneDefaultState();
      merged.widgetOrder = [...new Set([...merged.widgetOrder, ...defaultState.widgetOrder])].filter(id => widgetNames[id]);
      merged.hiddenWidgets = merged.hiddenWidgets.filter(id => widgetNames[id]);
      merged.mandatoryWidgets = [...new Set(["messages", ...(Array.isArray(merged.mandatoryWidgets) ? merged.mandatoryWidgets : [])])].filter(id => widgetNames[id]);
      merged.pinnedWidgets = merged.pinnedWidgets.filter(id => widgetNames[id]);
      if (!Array.isArray(merged.agendaItems)) merged.agendaItems = cloneDefaultState().agendaItems;
      if (!Array.isArray(merged.staffPlannerTasks)) merged.staffPlannerTasks = [];
      const plannerMigrationWeek = plannerWeekStartIso(prototypeToday());
      merged.staffPlannerTasks.forEach(task => {
        const legacyDay = Number(task.day);
        if (!task.date && Number.isInteger(legacyDay) && legacyDay >= 0 && legacyDay <= 4) task.date = plannerDateForDay(legacyDay, plannerMigrationWeek);
        if (task.date) task.day = plannerDayIndexForDate(task.date, plannerWeekStartIso(task.date));
        if (!staffPlannerColors[task.color]) task.color = "blue";
      });
      merged.agendaItems = merged.agendaItems.filter(item => !(item.createdByKind === "staff" && item.client));
      if (!merged.eventResponses || typeof merged.eventResponses !== "object") merged.eventResponses = {};
      merged.eventParticipants = { ...cloneDefaultState().eventParticipants, ...(merged.eventParticipants || {}) };
      merged.profiles = { ...cloneDefaultState().profiles, ...(merged.profiles || {}) };
      Object.entries(merged.profiles).forEach(([accountId, profile]) => {
        if (!profile || typeof profile !== "object") return;
        const defaultRooms = defaultState.profiles[accountId]?.linkedRooms || [];
        const selection = Array.isArray(profile.linkedRooms) ? profile.linkedRooms : defaultRooms;
        profile.linkedRooms = [...new Set(selection)].filter(id => rooms.some(room => room.id === id));
      });
      const defaultAccounts = cloneDefaultState().accounts;
      if (!Array.isArray(merged.accounts)) merged.accounts = defaultAccounts;
      else {
        const storedById = new Map(merged.accounts.map(account => [account.id, account]));
        const legacyDemoIds = new Set(["client-it","staff-mm-mark","staff-mm-lisa","staff-it-thomas","staff-it-ruben","staff-it-demi","staff-process","staff-process-karel","staff-process-sophie"]);
        const defaultIds = new Set(defaultAccounts.map(account => account.id));
        const canonicalAccounts = defaultAccounts.map(account => {
          const stored = storedById.get(account.id) || {};
          return { ...account, password: stored.password || account.password, memberSince: stored.memberSince || account.memberSince, isAdmin: account.isAdmin === true };
        });
        const customAccounts = merged.accounts.filter(account => !defaultIds.has(account.id) && !legacyDemoIds.has(account.id));
        merged.accounts = [...canonicalAccounts, ...customAccounts];
      }
      if (!merged.accounts.some(account => account.id === merged.role)) merged.role = "client-mm";
      if (!Array.isArray(merged.events)) merged.events = cloneDefaultState().events;
      if (!Array.isArray(merged.goals)) merged.goals = cloneDefaultState().goals;
      if (!Array.isArray(merged.sprintReviews)) merged.sprintReviews = cloneDefaultState().sprintReviews;
      else {
        const defaults = cloneDefaultState().sprintReviews;
        const byClient = new Map(merged.sprintReviews.map(item => [item.client, item]));
        merged.sprintReviews = [
          ...defaults.map(item => ({ ...item, ...(byClient.get(item.client) || {}) })),
          ...merged.sprintReviews.filter(item => !defaults.some(base => base.client === item.client))
        ];
      }
      const renameDemoClient = value => value === "Martin" ? "Maarten" : value;
      merged.goals = (merged.goals || []).map(item => ({ ...item, client: renameDemoClient(item.client) }));
      merged.tasks = (merged.tasks || []).map(item => {
        const task = { ...item, client: renameDemoClient(item.client) };
        if (task.column === "done" && !task.completedAt) task.completedAt = new Date().toISOString();
        if (task.column !== "done") {
          task.completedAt = null;
          task.archivedAt = null;
        }
        return task;
      });
      merged.diary = (merged.diary || []).map(item => ({ ...item, client: renameDemoClient(item.client) }));
      if (Array.isArray(merged.roomAssignments)) merged.roomAssignments = merged.roomAssignments.map(item => ({ ...item, client: renameDemoClient(item.client) }));
      merged.sprintReviews = merged.sprintReviews.map(item => ({ ...item, client: renameDemoClient(item.client) }));
      Object.keys(merged.eventParticipants || {}).forEach(eventId => {
        merged.eventParticipants[eventId] = (merged.eventParticipants[eventId] || []).map(item => ({ ...item, name: renameDemoClient(item.name) }));
      });
      const tradeGuideByClient = new Map(data.people.filter(person => person.type === "client" && ["multimedia", "it"].includes(person.department)).map(person => [person.name, person.tradeGuide]));
      merged.sprintReviews = merged.sprintReviews.map(item => ({
        ...item,
        guide: tradeGuideByClient.get(item.client) || item.guide,
        statusResetAt: item.statusResetAt || item.reviewDate || null
      }));
      if (!Array.isArray(merged.roomAssignments)) merged.roomAssignments = cloneDefaultState().roomAssignments;
      if (!Array.isArray(merged.roomAudit)) merged.roomAudit = cloneDefaultState().roomAudit;
      if (!["multimedia", "it"].includes(merged.roomTab)) merged.roomTab = roleConfig[merged.role]?.department === "it" ? "it" : "multimedia";
      if (!roomDays.some(([id]) => id === merged.roomDay)) merged.roomDay = "ma";
      merged.roomView = "week";
      merged.roomSelectedRoom = { ...cloneDefaultState().roomSelectedRoom, ...(merged.roomSelectedRoom || {}) };
      merged.roomAssignments = merged.roomAssignments.map(item => {
        const clientRole = Object.keys(accountNames).find(key => roleConfig[key]?.kind === "client" && accountNames[key] === item.client);
        const day = item.day || merged.profiles[clientRole]?.weekdays?.[0] || "ma";
        return { ...item, day, part: day === "vr" && item.part !== "morning" ? "morning" : item.part };
      });
      if (!merged.themeModeByAccount || typeof merged.themeModeByAccount !== "object") merged.themeModeByAccount = {};
      if (!Array.isArray(merged.messageRead)) merged.messageRead = [];
      if (!Array.isArray(merged.notificationSeen)) merged.notificationSeen = [];
      if (!Array.isArray(merged.dailyMood)) merged.dailyMood = [];
      ensureDemoMoodHistory(merged);
      if (!Array.isArray(merged.messages)) merged.messages = cloneDefaultState().messages;
      if (!Array.isArray(merged.closures)) merged.closures = cloneDefaultState().closures;
      merged.clocks = { ...cloneDefaultState().clocks, ...(merged.clocks || {}) };
      merged.widgetSizes = { ...cloneDefaultState().widgetSizes, ...(merged.widgetSizes || {}) };
      Object.keys(merged.widgetSizes).forEach(id => { if (!["normal", "compact", "wide"].includes(merged.widgetSizes[id])) merged.widgetSizes[id] = auxiliaryWidgetIds.includes(id) ? "wide" : "normal"; });
      merged.widgetZones = { ...cloneDefaultState().widgetZones, ...(merged.widgetZones || {}) };
      Object.keys(merged.widgetZones).forEach(id => { if (!["main", "right"].includes(merged.widgetZones[id])) merged.widgetZones[id] = "main"; });
      const defaultRailOrder = cloneDefaultState().rightRailOrder;
      merged.rightRailOrder = Array.isArray(merged.rightRailOrder) ? [...merged.rightRailOrder] : [...defaultRailOrder];
      merged.rightRailOrder = [...new Set([...merged.rightRailOrder, ...defaultRailOrder])].filter(id => id !== "featured");
      merged.hiddenRailItems = Array.isArray(merged.hiddenRailItems) ? merged.hiddenRailItems.filter(id => railWidgetNames[id]) : [];
      merged.railItemSizes = { ...cloneDefaultState().railItemSizes, ...(merged.railItemSizes || {}) };
      Object.keys(merged.railItemSizes).forEach(id => { if (!["small","large"].includes(merged.railItemSizes[id])) merged.railItemSizes[id] = "large"; });
      if (merged.customDashboard?.rightRailOrder) merged.customDashboard.rightRailOrder = merged.customDashboard.rightRailOrder.filter(id => id !== "featured");
      merged.widgetLayout = { ...cloneDefaultState().widgetLayout, ...(merged.widgetLayout || {}) };
      normalizeMessagesLayout(merged.widgetLayout);
      if (merged.customDashboard && typeof merged.customDashboard === "object") {
        const customDefaults = standardDashboardSnapshot();
        merged.customDashboard.widgetOrder = [...new Set([...(merged.customDashboard.widgetOrder || []), ...customDefaults.widgetOrder])].filter(id => widgetNames[id]);
        merged.customDashboard.hiddenWidgets = (merged.customDashboard.hiddenWidgets || []).filter(id => widgetNames[id]);
        merged.customDashboard.pinnedWidgets = (merged.customDashboard.pinnedWidgets || []).filter(id => widgetNames[id]);
        merged.customDashboard.widgetSizes = { ...customDefaults.widgetSizes, ...(merged.customDashboard.widgetSizes || {}) };
        Object.keys(merged.customDashboard.widgetSizes).forEach(id => { if (!["normal", "compact", "wide"].includes(merged.customDashboard.widgetSizes[id])) merged.customDashboard.widgetSizes[id] = auxiliaryWidgetIds.includes(id) ? "wide" : "normal"; });
        merged.customDashboard.widgetZones = { ...customDefaults.widgetZones, ...(merged.customDashboard.widgetZones || {}) };
        merged.customDashboard.hiddenRailItems = Array.isArray(merged.customDashboard.hiddenRailItems) ? merged.customDashboard.hiddenRailItems.filter(id => railWidgetNames[id]) : [...customDefaults.hiddenRailItems];
        merged.customDashboard.railItemSizes = { ...customDefaults.railItemSizes, ...(merged.customDashboard.railItemSizes || {}) };
        merged.customDashboard.widgetLayout = { ...customDefaults.widgetLayout, ...(merged.customDashboard.widgetLayout || {}) };
        // Mededelingen heeft voortaan een vaste hoogte, ook in bestaande Custom-indelingen.
        normalizeMessagesLayout(merged.customDashboard.widgetLayout);
      }
      if (!["standard", "custom"].includes(merged.dashboardPreset)) merged.dashboardPreset = "standard";
      if (merged.dashboardPreset === "standard") {
        const base = standardDashboardSnapshot();
        merged.widgetOrder = [...base.widgetOrder];
        merged.hiddenWidgets = [...base.hiddenWidgets];
        merged.pinnedWidgets = [...base.pinnedWidgets];
        merged.widgetSizes = JSON.parse(JSON.stringify(base.widgetSizes));
        merged.widgetZones = JSON.parse(JSON.stringify(base.widgetZones));
        merged.rightRailOrder = [...base.rightRailOrder];
        merged.hiddenRailItems = [...base.hiddenRailItems];
        merged.railItemSizes = JSON.parse(JSON.stringify(base.railItemSizes));
        merged.widgetLayout = JSON.parse(JSON.stringify(base.widgetLayout));
      }
      if (merged.customDashboard && typeof merged.customDashboard !== "object") merged.customDashboard = null;
      if (!Array.isArray(merged.roomReservations)) merged.roomReservations = [];
      if (!isDateInRange(merged.selectedDate)) merged.selectedDate = "2026-07-29";
      if (!/^202(6|7)-\d{2}$/.test(merged.calendarCursor || "")) merged.calendarCursor = merged.selectedDate.slice(0, 7);
      return merged;
    } catch {
      const fallback = cloneDefaultState();
      ensureDemoMoodHistory(fallback);
      return fallback;
    }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { /* De demo blijft werken wanneer browseropslag niet beschikbaar is. */ }
    // Planbord 2.0 listens for saved changes to the sprint goal source of truth.
    window.dispatchEvent(new Event("spectrum-hub-state-saved"));
  }
  function currentUserIsAdmin() {
    const account = state.accounts?.find(item => item.id === state.role);
    return currentConfig().kind === "staff" && account?.isAdmin === true;
  }
  const staffWeekdays = [["ma","Maandag"],["di","Dinsdag"],["wo","Woensdag"],["do","Donderdag"],["vr","Vrijdag"]];
  function staffWeekParts(profile) {
    if (profile?.weekParts && typeof profile.weekParts === "object") return profile.weekParts;
    return Object.fromEntries(staffWeekdays.map(([day]) => [day, {
      morning: (profile?.weekdays || []).includes(day),
      afternoon: (profile?.weekdays || []).includes(day)
    }]));
  }
  // Werkrooster van de begeleiding. Niet-ingestelde demo-accounts houden
  // hun bestaande fictieve werkdagen; expliciet opgeslagen vrije dagen blijven vrij.
  function staffSchedule(person) {
    const account = state.accounts.find(item => item.kind === "staff" && item.name === person.name);
    const profile = account ? (state.profiles[account.id] || {}) : {};
    const parts = account ? staffWeekParts(profile) : Object.fromEntries(staffWeekdays.map(([day]) => [day, { morning: true, afternoon: true }]));
    return { parts, times: profile.weekTimes || {} };
  }
  function staffHoursForDay(person, day) {
    const schedule = staffSchedule(person);
    const parts = schedule.parts[day] || { morning: false, afternoon: false };
    const saved = schedule.times[day] || {};
    const defaultStart = parts.morning ? "09:00" : "13:00";
    const defaultEnd = parts.afternoon ? "16:30" : "12:30";
    const start = /^\d{2}:\d{2}$/.test(saved.start || "") ? saved.start : defaultStart;
    const end = /^\d{2}:\d{2}$/.test(saved.end || "") ? saved.end : defaultEnd;
    return { ...parts, start, end, valid: (parts.morning || parts.afternoon) && start < end };
  }
  function staffInPart(person, day, part) {
    const time = staffHoursForDay(person, day);
    if (!time.valid || !time[part]) return false;
    return part === "morning" ? time.start < "12:30" && time.end > "09:00" : time.start < "16:30" && time.end > "13:00";
  }
  function staffHoursLabel(person, day) {
    const hours = staffHoursForDay(person, day);
    if (!hours.valid) return "";
    const normalStart = hours.morning ? "09:00" : "13:00";
    const normalEnd = hours.afternoon ? "16:30" : "12:30";
    return hours.start === normalStart && hours.end === normalEnd ? "" : `${hours.start}–${hours.end}`;
  }
  function attendancePart(now = new Date()) {
    return now.getHours() < 12 || (now.getHours() === 12 && now.getMinutes() < 30) ? "morning" : "afternoon";
  }
  function currentStaffDay(now = new Date()) { return ["zo","ma","di","wo","do","vr","za"][now.getDay()]; }
  function guidanceWeekHtml() {
    const guides = data.people.filter(person => person.type === "staff");
    const departments = [["process", "PB"], ["multimedia", "MM"], ["it", "IT"]];
    return staffWeekdays.map(([day, label]) => `<section class="guidance-week-day">
      <h3>${escapeHtml(label)}</h3>
      <div class="guidance-day-parts">${["morning", "afternoon"].map(part => `<div class="guidance-week-part ${part}${guides.some(person => staffInPart(person, day, part)) ? "" : " empty"}">
        <strong>${part === "morning" ? "Ochtend" : "Middag"}</strong>
        <div class="guidance-departments">${departments.map(([department, short]) => {
          const members = guides.filter(person => person.department === department && staffInPart(person, day, part));
          return `<div class="guidance-department-row"><span class="guidance-department-tag">${short}</span><span class="guidance-department-names">${members.length ? members.map(person => {
            const hours = staffHoursLabel(person, day);
            const name = escapeHtml(person.name);
            return `<span class="guidance-person-name" title="${name}${hours ? ` · ${escapeHtml(hours)}` : ""}">${name}${hours ? ` <small>(${escapeHtml(hours)})</small>` : ""}</span>`;
          }).join('<span class="guidance-name-separator"> · </span>') : '<span class="guidance-no-staff">—</span>'}</span></div>`;
        }).join("")}</div>
      </div>`).join("")}</div>
    </section>`).join("");
  }
  function renderGuidanceWeek() {
    const grid = $("#guidanceWeekGrid");
    if (grid) grid.innerHTML = guidanceWeekHtml();
  }

  function staffPlannedToday(person) {
    const account = state.accounts.find(item => item.kind === "staff" && item.name === person.name);
    if (!account) return null;
    const profile = state.profiles[account.id] || {};
    const current = new Date();
    const weekday = ["zo","ma","di","wo","do","vr","za"][current.getDay()];
    const part = current.getHours() < 12 || (current.getHours() === 12 && current.getMinutes() < 30) ? "morning" : "afternoon";
    return { ...((staffWeekParts(profile)[weekday]) || { morning: false, afternoon: false }), part };
  }
  function accountLabel(account) {
    if (account.kind === "client") return account.department === "it" ? "IT-mediënt" : "Multimedia-mediënt";
    if (account.department === "process") return "Procesbegeleider";
    return account.department === "it" ? "IT-begeleider" : "Multimedia-begeleider";
  }
  function syncAccountsFromState() {
    if (!Array.isArray(state.accounts)) state.accounts = cloneDefaultState().accounts;
    state.accounts.forEach(account => {
      accountNames[account.id] = account.name;
      if (!roleConfig[account.id]) roleConfig[account.id] = { label: accountLabel(account), kind: account.kind, department: account.department, caseload: [] };
      else {
        roleConfig[account.id].label = accountLabel(account);
        roleConfig[account.id].kind = account.kind;
        roleConfig[account.id].department = account.department;
      }
      if (!state.profiles[account.id]) state.profiles[account.id] = { email: "", contactPreference: "hub", weekdays: [], linkedRooms: [] };
      if (account.kind === "staff" && !Array.isArray(state.profiles[account.id].linkedRooms)) {
        state.profiles[account.id].linkedRooms = [...(defaultState.profiles[account.id]?.linkedRooms || [])];
      }
      if (account.kind === "client" && !state.clocks[account.id]) state.clocks[account.id] = { active: false, startedAt: null };
      if (!data.people.some(person => person.accountId === account.id || (person.type === account.kind && person.name === account.name))) {
        data.people.push(account.kind === "client"
          ? { accountId: account.id, name: account.name, type: "client", department: account.department, status: "Afwezig", clockedIn: "" }
          : { accountId: account.id, id: account.id, name: account.name, type: "staff", department: account.department, role: accountLabel(account), present: false });
      }
    });
  }
  function renderAccountSelectors() {
    const clients = state.accounts.filter(account => account.kind === "client");
    const staff = state.accounts.filter(account => account.kind === "staff");
    const option = account => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.kind === "client" ? clientFullName(account.name) : account.name)}</option>`;
    const login = $("#loginRole");
    if (login) {
      const selected = login.value || state.role;
      login.innerHTML = `<optgroup label="Mediënten">${clients.map(option).join("")}</optgroup><optgroup label="Begeleiding">${staff.map(option).join("")}</optgroup>`;
      login.value = state.accounts.some(account => account.id === selected) ? selected : state.role;
    }
    const demo = $("#roleSelect");
    if (demo) {
      demo.innerHTML = [...clients, ...staff].map(account => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.kind === "client" ? clientFullName(account.name) : account.name)} · ${escapeHtml(accountLabel(account))}</option>`).join("");
      demo.value = state.role;
    }
  }
  function currentConfig() { return roleConfig[state.role] || roleConfig["client-mm"]; }
  function themeModeForCurrentAccount() {
    // Legacy Custom Mode settings fall back to the official light theme.
    return state.themeModeByAccount?.[state.role] === "dark" ? "dark" :
      state.themeModeByAccount?.[state.role] === "light" ? "light" :
      (state.themeModeByAccount?.[state.role] === "custom" ? "light" : (state.darkMode ? "dark" : "light"));
  }
  function applyThemeAppearance() {
    const dark = themeModeForCurrentAccount() === "dark";
    document.body.classList.toggle("dark-mode", dark);
    document.body.classList.remove("custom-theme", "custom-theme-dark", "custom-theme-square");
    state.darkMode = dark;
    // Clean up inline variables from older sessions without modifying other preferences.
    for (const property of [...document.body.style]) {
      if (property.startsWith("--theme-") || ["--ink", "--muted", "--line", "--background", "--surface", "--study-canvas", "--study-panel", "--study-line", "--study-copy"].includes(property)) {
        document.body.style.removeProperty(property);
      }
    }
  }
  function currentAccountName() { return accountNames[state.role] || state.accounts?.find(account => account.id === state.role)?.name || "Maarten"; }
  function currentClock() { return currentConfig().kind === "client" ? (state.clocks[state.role] || { active: false, startedAt: null }) : state.clock; }
  function setCurrentClock(clock) { if (currentConfig().kind === "client") state.clocks[state.role] = clock; else state.clock = clock; }
  function clientRoleForName(name) { return state.accounts?.find(account => account.kind === "client" && account.name === name)?.id || null; }
  function syncClientWeekdaysFromAssignments(name) {
    const clientRole = clientRoleForName(name);
    if (!clientRole || !state.profiles[clientRole]) return;
    state.profiles[clientRole].weekdays = roomDays.map(([day]) => day).filter(day => state.roomAssignments.some(item => item.client === name && item.day === day));
  }
  function relevantTasks() { return currentConfig().kind === "client" ? state.tasks.filter(task => task.client === currentAccountName()) : staffRelevantTasks(); }
  function messageReadKey(messageId) { return `${state.role}:${messageId}`; }
  function messageIsRead(messageId) { return state.messageRead.includes(messageReadKey(messageId)); }
  function appointmentSeenKey(appointmentId) { return `${state.role}:appointment:${appointmentId}`; }
  function createId(prefix = "id") {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  }
  function parseDateOnly(iso) { return new Date(`${iso}T12:00:00`); }
  function dateToIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function isDateInRange(iso) { return Boolean(iso && iso >= CALENDAR_MIN && iso <= CALENDAR_MAX); }
  // Spectrum is gesloten op zaterdag en zondag. Bestaande weekendafspraken blijven opgeslagen.
  function isWorkday(iso) {
    if (!isDateInRange(iso)) return false;
    const weekday = parseDateOnly(iso).getDay();
    return weekday >= 1 && weekday <= 5;
  }
  function nextWorkday(iso) {
    const date = parseDateOnly(isDateInRange(iso) ? iso : prototypeToday());
    while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
    return dateToIso(date);
  }
  function shiftCalendarWorkday(iso, direction) {
    const date = parseDateOnly(nextWorkday(iso));
    do { date.setDate(date.getDate() + direction); }
    while (date.getDay() === 0 || date.getDay() === 6);
    const target = dateToIso(date);
    return isDateInRange(target) ? target : null;
  }
  function prototypeToday() {
    const today = dateToIso(new Date());
    return isDateInRange(today) ? today : "2026-07-29";
  }
  function prototypeNow() {
    const now = new Date();
    return isDateInRange(dateToIso(now)) ? now : new Date("2026-07-29T09:30:00");
  }
  function agendaStartDate(item) {
    return new Date(`${item.date}T${item.category === "vacation" ? "00:00" : (item.start || "23:59")}:00`);
  }
  function agendaEndDate(item) {
    const end = item.category === "vacation" ? "23:59" : (item.end || item.start || "23:59");
    return new Date(`${item.endDate || item.date}T${end}:00`);
  }
  function agendaItemIsUpcoming(item, now = prototypeNow()) {
    return agendaEndDate(item) > now;
  }
  // Sluitingsdagen zijn eigen kalenderinformatie, geen bewerkbare afspraken.
  function closuresOnDate(iso) {
    return (state.closures || []).filter(item => item.start <= iso && item.end >= iso);
  }
  function closureExpiryDate(item) {
    const dayAfter = parseDateOnly(item.end);
    dayAfter.setDate(dayAfter.getDate() + 1);
    dayAfter.setHours(0, 0, 0, 0);
    return dayAfter;
  }
  function upcomingClosureItems(now = prototypeNow()) {
    const today = dateToIso(now);
    return (state.closures || [])
      .filter(item => item.end >= today)
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 2) // Alleen de twee eerstvolgende sluitingen; de rest staat in de kalender/widget.
      .map(item => ({ kind: "closure", item, sortKey: `${item.start < today ? today : item.start}T00:00:00` }));
  }
  function nextRelevantAgendaItem() {
    const now = prototypeNow();
    return visibleAgendaItems().find(item => {
      if (agendaStartDate(item) <= now) return false;
      return item.category === "appointment" || item.category === "event";
    });
  }
  function agendaRelativeLabel(item) {
    const today = prototypeToday();
    const tomorrowDate = parseDateOnly(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = dateToIso(tomorrowDate);
    const day = item.date === today ? "Vandaag" : item.date === tomorrow ? "Morgen" : formatDate(item.date);
    return `${day} · ${item.start}${item.end ? `–${item.end}` : ""}`;
  }
  function formatDate(iso) {
    if (!iso) return "Geen deadline";
    return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(parseDateOnly(iso));
  }
  function formatDateTime(iso) {
    return new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  }
  function formatLongDate(iso) {
    return new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(parseDateOnly(iso));
  }
  function formatMonthYear(year, month) {
    const label = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(new Date(year, month, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  function agendaTime(item) { return item.category === "vacation" ? "Hele dag" : item.end ? `${item.start}–${item.end}` : item.start; }
  // Toon meldingen binnen het actieve modale venster. Een hoge z-index op
  // <body> alleen kan niet boven de ::backdrop van een <dialog> komen.
  function showToast(message) {
    const toast = $("#toast");
    const openModal = [...document.querySelectorAll("dialog:modal")].at(-1);
    const host = openModal || document.body;
    if (toast.parentElement !== host) host.appendChild(toast);
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      if (toast.parentElement !== document.body) document.body.appendChild(toast);
    }, 6000);
  }

  function greetingForTime(now = new Date()) {
    const hour = now.getHours();
    return hour < 6 ? "Goedenacht" : hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  }
  let lastGreetingHour = -1;
  function updateGreetings(now = new Date()) {
    lastGreetingHour = now.getHours();
    const greeting = greetingForTime(now);
    const clientName = clientFullName(accountNames[state.role] || "Maarten");
    const staffName = accountNames[state.role] || "Lindsay";
    $("#dashboardGreeting").textContent = `${greeting}, ${clientName}`;
    $("#arrivalTitle").textContent = `${greeting}, ${clientName}`;
    $("#staffDashboardGreeting").textContent = `${greeting}, ${staffName}`;
  }


  function setPage(page) {
    const config = roleConfig[state.role] || roleConfig["client-mm"];
    if (page === "client-detail" && config.kind !== "staff") page = "dashboard";
    // Begeleiders starten bij iedere nieuwe opening van Doelen zonder geselecteerde mediënt.
    // Een zoekopdracht of afdelingsfilter mag nooit automatisch de eerste match kiezen.
    if (page === "goals" && currentPage !== "goals" && config.kind === "staff") {
      selectedGoalsClientName = "";
      const search = $("#goalsClientSearch");
      const department = $("#goalsDepartmentFilter");
      if (search) search.value = "";
      if (department) department.value = "all";
    }
    currentPage = page;
    $$(".page").forEach(panel => panel.classList.toggle("active", panel.dataset.pagePanel === page));
    $$(".nav-item[data-page]").forEach(button => {
      const active = button.dataset.page === (page === "client-detail" ? "clock" : page);
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    $("#profileButton").classList.toggle("active", page === "profile");
    if (page === "profile") $("#profileButton").setAttribute("aria-current", "page"); else $("#profileButton").removeAttribute("aria-current");
    $("#rightRail").style.display = page === "dashboard" ? "grid" : "none";
    document.body.classList.toggle("rail-hidden", page !== "dashboard");
    document.documentElement.scrollTop = 0;
    if (page === "agenda") renderAgenda();
    if (page === "rooms") renderRoomSchedule();
    if (page === "profile") renderProfile();
    if (page === "clock") renderClientList();
    if (page === "client-detail") renderClientDetail();
    if (page === "diary") renderDiary();
    if (page === "tasks") currentConfig().kind === "staff" ? renderStaffTaskPlanner() : renderKanbans();
    if (page === "messages") renderMessages();
    if (page === "goals") renderGoals();
    if (page === "sprintreviews") renderSprintReviews();
  }

  function updateSidebarScrollCue() {
    const area = $("#sidebarScrollArea");
    const cue = $("#sidebarScrollCue");
    if (!area || !cue) return;
    if (window.matchMedia("(max-width: 720px)").matches) {
      cue.classList.remove("visible");
      area.classList.remove("has-overflow");
      return;
    }
    const hasOverflow = area.scrollHeight > area.clientHeight + 4;
    const atBottom = area.scrollTop + area.clientHeight >= area.scrollHeight - 8;
    area.classList.toggle("has-overflow", hasOverflow);
    cue.classList.toggle("visible", hasOverflow && !atBottom);
  }

  function applyPreferences() {
    // Uitgefaseerde toegankelijkheidsmodi worden niet meer toegepast.
    document.body.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    document.body.classList.toggle("reduce-motion", state.reduceMotion);
    applyThemeAppearance();
    document.body.classList.toggle("dashboard-editing", state.dashboardEditMode);
    document.body.classList.toggle("dashboard-standard", state.dashboardPreset === "standard");
    document.body.classList.toggle("dashboard-custom", state.dashboardPreset === "custom");
    $("#loginScreen").classList.toggle("hidden", state.authenticated);
    $("#appShell").classList.toggle("app-locked", !state.authenticated);
    $("#motionToggle").checked = state.reduceMotion;
    const themeModeSelect = $("#themeModeSelect");
    if (themeModeSelect) themeModeSelect.value = themeModeForCurrentAccount();
    $("#dashboardPreset").value = state.dashboardPreset;
    const layoutHelp = $("#dashboardLayoutHelp");
    if (layoutHelp) layoutHelp.textContent = state.dashboardPreset === "standard"
      ? "De vaste basislayout. Aanpassingen worden automatisch als Custom opgeslagen."
      : "Jouw persoonlijke dashboardindeling. Standaard blijft altijd beschikbaar.";
    $("#editDashboardButton").textContent = state.dashboardEditMode ? "Klaar met aanpassen" : "Dashboard aanpassen";
    $("#manageWidgetsButton").classList.toggle("hidden", !state.dashboardEditMode);
    renderAccountSelectors();
    $("#roleSelect").value = state.role;
    const staffView = (roleConfig[state.role] || roleConfig["client-mm"]).kind === "staff";
    $("#roleSwitcherLabel").textContent = "Demo-profiel";
    document.body.classList.toggle("staff-mode", staffView);
    document.body.classList.toggle("client-mode", !staffView);
    $$(".staff-only").forEach(element => element.classList.toggle("hidden", !staffView));
    const sprintReviewAccess = staffView && ["multimedia", "it"].includes(currentConfig().department);
    $$(".staff-mm-only").forEach(element => element.classList.toggle("hidden", state.role !== "staff-mm"));
    $$(".staff-sprintreviews-only").forEach(element => element.classList.toggle("hidden", !sprintReviewAccess));
    if (!staffView && currentPage === "rooms") setPage("dashboard");
    if (currentPage === "sprintreviews" && !sprintReviewAccess) setPage("dashboard");
    $("#profileRole").textContent = (roleConfig[state.role] || roleConfig["client-mm"]).label;
    const accountName = accountNames[state.role] || "Maarten";
    $(".profile-copy strong").textContent = accountName.trim().split(/\s+/)[0];
    $(".avatar").textContent = accountName[0];
    updateGreetings();
    const labels = staffView
      ? { dashboard: "Dashboard", clock: "Mediënten", messages: "Mededelingen", goals: "Doelen", tasks: "Planbord", rooms: "Rooster", agenda: "Kalender", sprintreviews: "Sprintreviews" }
      : { dashboard: "Dashboard", messages: "Mededelingen", diary: "Mijn Dagboek", goals: "Mijn Doelen", tasks: "Planbord", rooms: "Rooster", agenda: "Kalender" };
    Object.entries(labels).forEach(([page, label]) => {
      const node = $(`.nav-item[data-page="${page}"] .nav-label`);
      if (!node) return;
      node.textContent = label;
    });
    $("#page-clock h1").textContent = staffView ? "Mediënten" : "In- en uitklokken";
    $("#page-clock .eyebrow").textContent = staffView ? "Overzicht & aanwezigheid" : "Aanwezigheid";
    $("#page-clock .page-intro").textContent = staffView ? "Bekijk alle mediënten, zoek op naam of filter op lokaal en aanwezigheid." : "Klok in of uit en bekijk welke relevante begeleiders vandaag aanwezig zijn.";
    $("#page-diary h1").textContent = staffView ? "Dagverslagen" : "Mijn dagboek";
    $("#page-diary .eyebrow").textContent = staffView ? "Terugkijken" : "Mijn werkdag";
    $("#page-diary .page-intro").textContent = staffView ? "Recente verslagen van alle mediënten." : "Bekijk je eerdere dagverslagen of voeg zelf een notitie toe.";
    $("#page-tasks h1").textContent = "Planbord";
    $("#page-tasks .eyebrow").textContent = staffView ? "Weekplanning" : "Werkoverzicht";
    $("#page-tasks .page-intro").textContent = staffView ? "Plan je begeleidingsweek van maandag tot en met vrijdag." : "Plan je werk, kies één actieve taak en onthoud waarbij je overleg nodig hebt.";
    $("#page-agenda h1").textContent = "Kalender";
    $("#messagesEyebrow").textContent = staffView ? "Mededelingen" : "Voor jou";
    $("#messagesPageTitle").textContent = staffView ? "Mededelingen" : "Mededelingen";
    $("#messagesPageIntro").textContent = staffView ? "Publiceer en beheer mededelingen voor de juiste doelgroep." : "Ongelezen mededelingen links, gelezen mededelingen rechts.";
    const goalsTitle = $("#goalsPageTitle");
    const goalsIntro = $("#goalsPageIntro");
    if (goalsTitle) goalsTitle.textContent = staffView ? "Doelen beheren" : "Mijn Doelen";
    if (goalsIntro) goalsIntro.textContent = staffView ? "Zoek een mediënt en beheer persoonlijke doelen en sprintdoelen." : "Je persoonlijke ontwikkelrichting links, je eigen korte sprintdoelen rechts.";
    const rosterTitle = $("#page-rooms h1");
    if (rosterTitle) rosterTitle.textContent = staffView ? "Rooster" : "Rooster";
    const dashboardEyebrow = $(".design-dashboard-header .eyebrow");
    if (dashboardEyebrow) dashboardEyebrow.textContent = staffView ? "Begeleidersomgeving" : "Persoonlijke omgeving";
    $("#sidebarToggle").setAttribute("aria-label", state.sidebarCollapsed ? "Menu uitklappen" : "Menu inklappen");
  }

  function renderRoleSummary() {
    const config = roleConfig[state.role] || roleConfig["client-mm"];
    const staffView = config.kind === "staff";
    const guides = data.people.filter(person => person.type === "staff");
    const clients = data.people.filter(person => person.type === "client");
    const helpCount = relevantTasks().filter(task => task.column === "help").length;
    const summaryCard = $("#nextAppointmentCard");
    if (staffView) {
      const caseload = clients.filter(person => (config.caseload || []).includes(person.name));
      $("#presentSummaryLabel").textContent = "Mediënten aanwezig";
      $("#presentCount").textContent = `${caseload.filter(person => effectiveClientStatus(person).status === "Aanwezig").length} van ${caseload.length}`;
      $("#staffSummaryLabel").textContent = config.department === "process" ? "Eigen caseload" : "Afdeling aanwezig";
      $("#staffCount").textContent = config.department === "process" ? caseload.length : clients.filter(person => person.department === config.department && person.status === "Aanwezig").length;
      $("#roleSummaryLabel").textContent = "Weekplanning";
      $("#roleSummaryValue").textContent = "5 dagen";
      $("#roleSummaryMeta").textContent = "Maandag t/m vrijdag";
      summaryCard.dataset.action = "tasks";
      summaryCard.removeAttribute("data-agenda-id");
      summaryCard.setAttribute("aria-label", "Weekplanning openen");
    } else {
      const trade = guides.filter(person => person.department === config.department);
      const process = guides.filter(person => person.department === "process");
      $("#presentSummaryLabel").textContent = config.department === "it" ? "IT-begeleiding" : "Multimedia-begeleiding";
      $("#presentCount").textContent = `${trade.filter(person => person.present).length} van ${trade.length}`;
      $("#staffSummaryLabel").textContent = "Procesbegeleiding";
      $("#staffCount").textContent = `${process.filter(person => person.present).length} van ${process.length}`;
      const next = nextRelevantAgendaItem();
      $("#roleSummaryLabel").textContent = next?.category === "event" ? "Volgend evenement" : "Volgende afspraak";
      $("#roleSummaryValue").textContent = next?.title || "Nog niets gepland";
      $("#roleSummaryMeta").textContent = next ? agendaRelativeLabel(next) : "Open je agenda om iets in te plannen";
      summaryCard.dataset.action = next ? "appointment" : "agenda";
      if (next) summaryCard.dataset.agendaId = next.id; else summaryCard.removeAttribute("data-agenda-id");
      summaryCard.setAttribute("aria-label", next ? `${next.title}, ${agendaRelativeLabel(next)}. Open afspraak.` : "Geen volgende afspraak. Open agenda.");
    }
  }

  function staffCaseload() {
    const config = roleConfig[state.role] || roleConfig["staff-mm"];
    return data.people.filter(person => person.type === "client" && (config.caseload || []).includes(person.name));
  }

  function staffRelevantTasks() {
    // All staff can view tasks for all clients, independent of caseload or department.
    return state.tasks;
  }

  function staffRelevantDiary() {
    // Caseload assignments are administrative, not visibility restrictions.
    return [...state.diary].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function clientMoodInfo(name, date = prototypeToday()) {
    const record = moodRecordFor(name, date);
    if (!record?.start) return null;
    return moodOptions[record.start] || null;
  }
  function clientMoodBadgeHtml(name, label = true) {
    const mood = clientMoodInfo(name);
    if (!mood) return "";
    return `<span class="client-mood-badge" title="Dagstart: ${escapeHtml(mood.label)}" aria-label="Dagstart ${escapeHtml(mood.label)}">${mood.emoji}${label ? `<small>${escapeHtml(mood.label)}</small>` : ""}</span>`;
  }

  function staffListRow({ icon = "•", title, titleHtml = null, meta, badge = "", badgeClass = "" }) {
    return `<div class="staff-list-row"><div class="person-mini-avatar">${escapeHtml(icon)}</div><div><strong>${titleHtml ? richTextHtml(titleHtml) : escapeHtml(title)}</strong><small>${escapeHtml(meta)}</small></div>${badge ? `<span class="staff-list-badge ${badgeClass}">${escapeHtml(badge)}</span>` : ""}</div>`;
  }

  function renderStaffSignals() {
    const signals = staffRelevantTasks().filter(task => task.column === "help");
    $("#staffSignalsPreview").innerHTML = signals.length
      ? signals.slice(0, 3).map(task => staffListRow({ icon: task.client?.[0] || "?", title: `${clientDisplayName(task.client)} · ${task.title}`, meta: richTextPlain(task.description), badge: task.label, badgeClass: "warning" })).join("")
      : emptyAgendaHtml("Geen hulp-/overlegsignalen gevonden.");
    $("#staffSignalsList").innerHTML = signals.length
      ? signals.map(task => `<article class="staff-signal-card"><div><p class="eyebrow">${escapeHtml(task.label)}</p><h2>${escapeHtml(clientDisplayName(task.client || "Mediënt"))}</h2></div><div><strong>${richTitleHtml(task)}</strong><div class="rich-text-content">${richTextHtml(task.description || "Geen toelichting toegevoegd.")}</div></div><span class="staff-list-badge warning">Geheugensteun</span></article>`).join("")
      : emptyAgendaHtml("Er zijn momenteel geen taken met hulp/overleg nodig.");
    $("#staffSignalCount").textContent = signals.length;
  }

  function plannerTimeOptions() {
    const values = [];
    for (let minutes = 9 * 60; minutes <= 16 * 60 + 30; minutes += 30) {
      const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
      const minute = String(minutes % 60).padStart(2, "0");
      values.push(`${hour}:${minute}`);
    }
    return values;
  }

  function plannerTimeIndex(value) {
    return plannerTimeOptions().indexOf(value);
  }

  function staffPlannerTaskAssignees(task) {
    if (Array.isArray(task?.assignedStaff) && task.assignedStaff.length) return [...new Set(task.assignedStaff.filter(Boolean))];
    return task?.ownerRole ? [task.ownerRole] : task?.createdByRole ? [task.createdByRole] : [];
  }

  function staffPlannerAccounts() {
    return (state.accounts || []).filter(account => account.kind === "staff");
  }

  function staffPlannerAccountName(accountId) {
    return state.accounts?.find(account => account.id === accountId)?.name || accountNames[accountId] || "Begeleider";
  }

  function staffPlannerInitials(name) {
    return String(name || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "?";
  }

  function plannerWeekStartIso(value = prototypeToday()) {
    const date = typeof value === "string" ? parseDateOnly(value) : new Date(value);
    const weekday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - weekday);
    return dateToIso(date);
  }

  function plannerDateForDay(dayIndex, weekStart = activeStaffPlannerWeekStart()) {
    const date = parseDateOnly(weekStart);
    date.setDate(date.getDate() + Number(dayIndex || 0));
    return dateToIso(date);
  }

  function plannerDayIndexForDate(dateIso, weekStart = activeStaffPlannerWeekStart()) {
    if (!dateIso) return -1;
    const start = parseDateOnly(weekStart);
    const date = parseDateOnly(dateIso);
    return Math.round((date - start) / 86400000);
  }

  function plannerWeekDates(weekStart = activeStaffPlannerWeekStart()) {
    return Array.from({ length:5 }, (_, index) => plannerDateForDay(index, weekStart));
  }

  function plannerRecurrenceLabel(pattern) {
    return ({ weekly:"Wekelijks", biweekly:"Elke 2 weken", fourweekly:"Elke 4 weken", monthly:"Maandelijks" })[pattern] || "Niet herhalen";
  }

  function plannerMonthlyOccurrenceDate(anchorIso, monthOffset) {
    const anchor = parseDateOnly(anchorIso);
    const weekday = anchor.getDay();
    const ordinal = Math.ceil(anchor.getDate() / 7);
    const target = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset, 1, 12, 0, 0);
    const firstWeekday = target.getDay();
    let day = 1 + ((weekday - firstWeekday + 7) % 7) + ((ordinal - 1) * 7);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12, 0, 0).getDate();
    if (day > lastDay) day -= 7;
    target.setDate(day);
    return dateToIso(target);
  }

  function plannerRecurrenceDates(startIso, pattern = "none", endIso = "") {
    if (!startIso) return [];
    if (pattern === "none") return [startIso];
    const effectiveEnd = endIso && endIso >= startIso ? (endIso < CALENDAR_MAX ? endIso : CALENDAR_MAX) : CALENDAR_MAX;
    const dates = [];
    if (pattern === "monthly") {
      for (let offset = 0; offset < 36; offset += 1) {
        const iso = plannerMonthlyOccurrenceDate(startIso, offset);
        if (iso > effectiveEnd || iso > CALENDAR_MAX) break;
        if (iso >= CALENDAR_MIN) dates.push(iso);
      }
      return dates;
    }
    const dayStep = pattern === "weekly" ? 7 : pattern === "biweekly" ? 14 : pattern === "fourweekly" ? 28 : 0;
    if (!dayStep) return [startIso];
    const cursor = parseDateOnly(startIso);
    while (dateToIso(cursor) <= effectiveEnd && dateToIso(cursor) <= CALENDAR_MAX) {
      const iso = dateToIso(cursor);
      if (iso >= CALENDAR_MIN) dates.push(iso);
      cursor.setDate(cursor.getDate() + dayStep);
    }
    return dates;
  }

  function plannerSeriesTasks(task) {
    if (!task?.seriesId) return task ? [task] : [];
    return (state.staffPlannerTasks || []).filter(item => item.seriesId === task.seriesId);
  }

  function plannerSeriesAffectedTasks(task, scope = "this") {
    if (!task?.seriesId || scope === "this") return task ? [task] : [];
    const items = plannerSeriesTasks(task);
    if (scope === "future") return items.filter(item => staffPlannerTaskDate(item) >= staffPlannerTaskDate(task));
    return items;
  }

  function plannerWeekRangeLabel(weekStart = activeStaffPlannerWeekStart()) {
    const start = parseDateOnly(weekStart);
    const end = parseDateOnly(plannerDateForDay(4, weekStart));
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const sameYear = start.getFullYear() === end.getFullYear();
    const day = new Intl.DateTimeFormat("nl-NL", { day:"numeric" });
    const month = new Intl.DateTimeFormat("nl-NL", { month:"long" });
    if (sameMonth) return `${day.format(start)}–${day.format(end)} ${month.format(end)} ${end.getFullYear()}`;
    if (sameYear) return `${day.format(start)} ${month.format(start)} – ${day.format(end)} ${month.format(end)} ${end.getFullYear()}`;
    return `${day.format(start)} ${month.format(start)} ${start.getFullYear()} – ${day.format(end)} ${month.format(end)} ${end.getFullYear()}`;
  }

  function plannerShortDateLabel(iso) {
    return new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"short" }).format(parseDateOnly(iso)).replace(".", "");
  }

  let plannerViewedStaffId = null;
  let plannerViewedWeekStart = null;

  function activeStaffPlannerWeekStart() {
    if (!plannerViewedWeekStart) plannerViewedWeekStart = plannerWeekStartIso(prototypeToday());
    return plannerViewedWeekStart;
  }

  function renderStaffPlannerWeekNavigation() {
    const weekStart = activeStaffPlannerWeekStart();
    const label = $("#staffPlannerWeekLabel");
    const prev = $("#staffPlannerPrevWeek");
    const next = $("#staffPlannerNextWeek");
    const today = $("#staffPlannerTodayWeek");
    if (label) label.textContent = plannerWeekRangeLabel(weekStart);
    const prevStart = parseDateOnly(weekStart); prevStart.setDate(prevStart.getDate() - 7);
    const nextStart = parseDateOnly(weekStart); nextStart.setDate(nextStart.getDate() + 7);
    if (prev) prev.disabled = plannerDateForDay(4, dateToIso(prevStart)) < CALENDAR_MIN;
    if (next) next.disabled = dateToIso(nextStart) > CALENDAR_MAX;
    if (today) today.disabled = weekStart === plannerWeekStartIso(prototypeToday());
  }

  function changeStaffPlannerWeek(offset) {
    const date = parseDateOnly(activeStaffPlannerWeekStart());
    date.setDate(date.getDate() + Number(offset) * 7);
    plannerViewedWeekStart = dateToIso(date);
    renderStaffTaskPlanner();
  }

  function showCurrentStaffPlannerWeek() {
    plannerViewedWeekStart = plannerWeekStartIso(prototypeToday());
    renderStaffTaskPlanner();
  }

  function activeStaffPlannerId() {
    const staff = staffPlannerAccounts();
    const ownExists = staff.some(account => account.id === state.role);
    if (!plannerViewedStaffId || !staff.some(account => account.id === plannerViewedStaffId)) {
      plannerViewedStaffId = ownExists ? state.role : (staff[0]?.id || state.role);
    }
    return plannerViewedStaffId;
  }

  function staffPlannerOwnView() {
    return activeStaffPlannerId() === state.role;
  }

  function staffPlannerTaskDate(task) {
    if (task?.date) return task.date;
    const legacyDay = Number(task?.day);
    return Number.isInteger(legacyDay) && legacyDay >= 0 && legacyDay <= 4 ? plannerDateForDay(legacyDay, plannerWeekStartIso(prototypeToday())) : "";
  }

  function currentStaffPlannerTasks(accountId = activeStaffPlannerId()) {
    if (!Array.isArray(state.staffPlannerTasks)) state.staffPlannerTasks = [];
    return state.staffPlannerTasks.filter(task => staffPlannerTaskAssignees(task).includes(accountId));
  }

  function renderStaffPlannerViewer() {
    const select = $("#staffPlannerViewer");
    const mode = $("#staffPlannerViewMode");
    if (!select) return;
    const currentId = activeStaffPlannerId();
    const accounts = staffPlannerAccounts();
    const own = accounts.find(account => account.id === state.role);
    const order = { multimedia:0, it:1, process:2 };
    const grouped = accounts
      .filter(account => account.id !== state.role)
      .slice()
      .sort((a,b) => (order[a.department] ?? 9) - (order[b.department] ?? 9) || a.name.localeCompare(b.name, "nl"))
      .reduce((groups, account) => {
        (groups[account.department] ||= []).push(account);
        return groups;
      }, {});
    const ownOption = own ? `<optgroup label="Mijn planning"><option value="${escapeHtml(own.id)}">${escapeHtml(own.name)} · mijn planning</option></optgroup>` : "";
    const groupHtml = Object.entries(grouped).map(([department, items]) => `<optgroup label="${escapeHtml(staffPlannerDepartmentName(department))}">${items.map(account => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)}</option>`).join("")}</optgroup>`).join("");
    select.innerHTML = ownOption + groupHtml;
    select.value = currentId;
    const ownView = staffPlannerOwnView();
    if (mode) {
      mode.textContent = ownView ? "Eigen planning · bewerkbaar" : `${staffPlannerAccountName(currentId)} · nieuwe taken inplannen`;
      mode.classList.toggle("readonly", !ownView);
    }
  }

  let plannerDraggedTaskId = null;
  let plannerDropTarget = null;
  let plannerResizeState = null;
  let plannerSelectionState = null;
  let plannerContinuationSourceId = null;

  function clearPlannerDropTarget() {
    if (plannerDropTarget) plannerDropTarget.classList.remove("planner-drop-target", "planner-drop-invalid");
    plannerDropTarget = null;
  }

  function plannerSlotAtPoint(grid, clientX, clientY) {
    return $$(".planner-slot", grid).find(slot => {
      const rect = slot.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }) || null;
  }

  function renderStaffPlannerContinuationBar() {
    const bar = $("#staffPlannerContinueBar");
    const title = $("#staffPlannerContinueTitle");
    if (!bar) return;
    const source = plannerContinuationSourceId ? (state.staffPlannerTasks || []).find(task => task.id === plannerContinuationSourceId) : null;
    if (!source) plannerContinuationSourceId = null;
    const visible = Boolean(source) && staffPlannerOwnView();
    bar.classList.toggle("hidden", !visible);
    if (visible && title) title.textContent = `Doorplannen: ${source.title}`;
  }

  function cancelStaffPlannerContinuation(showMessage = true) {
    if (!plannerContinuationSourceId) return;
    plannerContinuationSourceId = null;
    renderStaffPlannerContinuationBar();
    if (showMessage) showToast("Doorplannen geannuleerd.");
  }

  function plannerSelectionRange(selection = plannerSelectionState) {
    if (!selection) return null;
    const times = plannerTimeOptions();
    const startIndex = Math.min(selection.anchorIndex, selection.currentIndex);
    const endIndex = Math.max(selection.anchorIndex, selection.currentIndex) + 1;
    if (!times[startIndex] || !times[endIndex]) return null;
    const dayStart = selection.allowMultiDay ? Math.min(selection.anchorDay, selection.currentDay) : selection.day;
    const dayEnd = selection.allowMultiDay ? Math.max(selection.anchorDay, selection.currentDay) : selection.day;
    const days = Array.from({ length: dayEnd - dayStart + 1 }, (_, index) => dayStart + index);
    return {
      day:selection.day,
      date:selection.date,
      start:times[startIndex],
      end:times[endIndex],
      startIndex,
      endIndex,
      dayStart,
      dayEnd,
      days
    };
  }

  function updatePlannerSelectionPreview() {
    if (!plannerSelectionState) return;
    const range = plannerSelectionRange();
    if (!range) return;
    let preview = plannerSelectionState.preview;
    if (!preview) {
      preview = document.createElement("div");
      preview.className = `planner-selection-preview${plannerContinuationSourceId ? " continuation-selection" : ""}`;
      plannerSelectionState.layer.appendChild(preview);
      plannerSelectionState.preview = preview;
    }
    preview.style.gridColumn = plannerSelectionState.allowMultiDay ? `${range.dayStart + 2} / ${range.dayEnd + 3}` : String(range.day + 2);
    preview.style.gridRow = `${range.startIndex + 2} / ${range.endIndex + 2}`;
  }

  function handlePlannerSelectionMove(event) {
    if (!plannerSelectionState) return;
    event.preventDefault();
    const slot = plannerSlotAtPoint(plannerSelectionState.grid, event.clientX, event.clientY);
    if (!slot || slot.disabled) return;
    const slotDay = Number(slot.dataset.plannerDay);
    if (!plannerSelectionState.allowMultiDay && slotDay !== plannerSelectionState.day) return;
    const index = plannerTimeIndex(slot.dataset.plannerTime);
    if (index < 0) return;
    plannerSelectionState.currentIndex = index;
    plannerSelectionState.currentDay = plannerSelectionState.allowMultiDay ? slotDay : plannerSelectionState.day;
    updatePlannerSelectionPreview();
  }

  function createStaffPlannerContinuation(range) {
    const source = plannerContinuationSourceId ? (state.staffPlannerTasks || []).find(task => task.id === plannerContinuationSourceId) : null;
    if (!source) {
      plannerContinuationSourceId = null;
      renderStaffPlannerContinuationBar();
      return false;
    }
    const selectedDays = Array.isArray(range.days) && range.days.length ? range.days : [range.day];
    const continuationGroupId = source.continuationGroupId || createId("planner-link");
    source.continuationGroupId = continuationGroupId;
    const createdRanges = [];
    let skipped = 0;
    selectedDays.forEach(day => {
      const payload = {
        assignedStaff:staffPlannerTaskAssignees(source),
        title:source.title,
        titleHtml:source.titleHtml,
        day,
        date:plannerDateForDay(day),
        start:range.start,
        end:range.end,
        color:staffPlannerColorKey(source.color),
        description:source.description || ""
      };
      if (payload.day === 4 && (payload.start >= "12:30" || payload.end > "12:30")) {
        skipped += 1;
        return;
      }
      if (staffPlannerTaskConflict(payload)) {
        skipped += 1;
        return;
      }
      state.staffPlannerTasks.push({
        id:createId("planner-task"),
        ownerRole:source.ownerRole || state.role,
        createdByRole:source.createdByRole || state.role,
        completed:false,
        continuationGroupId,
        continuedFromId:source.id,
        ...payload
      });
      createdRanges.push(payload);
    });
    plannerContinuationSourceId = null;
    if (!createdRanges.length) {
      renderStaffPlannerContinuationBar();
      showToast("Geen geldige tijdsblokken geselecteerd voor doorplannen.");
      return false;
    }
    saveState();
    renderStaffTaskPlanner();
    const createdDays = createdRanges.length;
    const startLabel = `${range.start}–${range.end}`;
    if (createdDays === 1 && !skipped) {
      showToast(`“${source.title}” doorgepland naar ${startLabel}.`);
      return true;
    }
    const baseMessage = `“${source.title}” ${createdDays}× doorgepland (${startLabel}).`;
    showToast(skipped ? `${baseMessage} ${skipped} blok${skipped === 1 ? "" : "ken"} overgeslagen.` : baseMessage);
    return true;
  }

  function finishPlannerSelection(cancelled = false) {
    if (!plannerSelectionState) return;
    const selection = plannerSelectionState;
    const range = plannerSelectionRange(selection);
    document.removeEventListener("pointermove", handlePlannerSelectionMove);
    document.removeEventListener("pointerup", handlePlannerSelectionUp);
    document.removeEventListener("pointercancel", handlePlannerSelectionCancel);
    selection.preview?.remove();
    plannerSelectionState = null;
    if (cancelled || !range) return;
    if (plannerContinuationSourceId) {
      createStaffPlannerContinuation(range);
      return;
    }
    openStaffPlannerTaskDialog(null, range.day, range.start, range.date, range.end);
  }

  function handlePlannerSelectionUp(event) {
    if (!plannerSelectionState) return;
    event.preventDefault();
    finishPlannerSelection(false);
  }

  function handlePlannerSelectionCancel() {
    finishPlannerSelection(true);
  }

  function startPlannerSelection(event, slot) {
    if (event.button !== 0 || plannerDraggedTaskId || plannerResizeState || currentConfig().kind !== "staff" || slot.disabled) return;
    const index = plannerTimeIndex(slot.dataset.plannerTime);
    if (index < 0) return;
    const layer = $(".planner-task-layer", $("#staffWeekPlannerGrid"));
    const grid = $("#staffWeekPlannerGrid");
    if (!grid || !layer) return;
    event.preventDefault();
    event.stopPropagation();
    clearPlannerDropTarget();
    const day = Number(slot.dataset.plannerDay);
    plannerSelectionState = {
      grid,
      layer,
      day,
      date:slot.dataset.plannerDate,
      anchorDay:day,
      currentDay:day,
      allowMultiDay:Boolean(plannerContinuationSourceId),
      anchorIndex:index,
      currentIndex:index,
      preview:null
    };
    updatePlannerSelectionPreview();
    document.addEventListener("pointermove", handlePlannerSelectionMove, { passive:false });
    document.addEventListener("pointerup", handlePlannerSelectionUp, { passive:false });
    document.addEventListener("pointercancel", handlePlannerSelectionCancel);
  }

  function plannerDropPayload(task, targetDay, targetStart) {
    const times = plannerTimeOptions();
    const oldStart = plannerTimeIndex(task.start);
    const oldEnd = plannerTimeIndex(task.end);
    const newStart = plannerTimeIndex(targetStart);
    const duration = oldEnd - oldStart;
    if (oldStart < 0 || oldEnd <= oldStart || newStart < 0 || duration <= 0) return null;
    const newEndIndex = newStart + duration;
    if (newEndIndex >= times.length) return null;
    const day = Number(targetDay);
    return { ...task, day, date:plannerDateForDay(day), start:times[newStart], end:times[newEndIndex] };
  }

  function plannerDropError(payload, taskId) {
    if (!payload) return "Deze taak past niet meer binnen de werkdag.";
    if (payload.day === 4 && (payload.start >= "12:30" || payload.end > "12:30")) return "Vrijdagmiddag is Spectrum gesloten.";
    if (staffPlannerTaskConflict(payload, taskId)) return "Dit tijdvak overlapt met een andere taak.";
    return "";
  }

  function moveStaffPlannerTask(taskId, targetDay, targetStart) {
    const task = currentStaffPlannerTasks().find(item => item.id === taskId);
    if (!task) return false;
    const payload = plannerDropPayload(task, targetDay, targetStart);
    const error = plannerDropError(payload, taskId);
    if (error) { showToast(error); return false; }
    Object.assign(task, { day:payload.day, date:payload.date, start:payload.start, end:payload.end });
    saveState();
    renderStaffTaskPlanner();
    showToast(task.seriesId ? `Deze herhaling verplaatst naar ${["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag"][payload.day]} ${payload.start}.` : `Taak verplaatst naar ${["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag"][payload.day]} ${payload.start}.`);
    return true;
  }

  function plannerResizeEndIndex(grid, task, clientY) {
    const times = plannerTimeOptions();
    const startIndex = plannerTimeIndex(task.start);
    if (startIndex < 0) return -1;
    const styles = getComputedStyle(grid);
    const headerHeight = parseFloat(styles.getPropertyValue("--planner-header-height")) || 54;
    const slotHeight = parseFloat(styles.getPropertyValue("--planner-slot-height")) || 40;
    const rect = grid.getBoundingClientRect();
    const rawIndex = Math.round((clientY - rect.top - headerHeight) / slotHeight);
    const dayMax = Number(task.day) === 4 ? plannerTimeIndex("12:30") : times.length - 1;
    return Math.max(startIndex + 1, Math.min(dayMax, rawIndex));
  }

  function updatePlannerResizePreview(clientY) {
    if (!plannerResizeState) return;
    const { grid, task, block } = plannerResizeState;
    const times = plannerTimeOptions();
    const endIndex = plannerResizeEndIndex(grid, task, clientY);
    if (endIndex < 0 || !times[endIndex]) return;
    const payload = { ...task, end:times[endIndex] };
    const conflict = staffPlannerTaskConflict(payload, task.id);
    plannerResizeState.previewEnd = payload.end;
    plannerResizeState.valid = !conflict;
    block.classList.toggle("resize-invalid", conflict);
    block.style.gridRowEnd = String(endIndex + 2);
    const timeLabel = $("small", block);
    if (timeLabel) timeLabel.textContent = `${task.start}–${payload.end}`;
  }

  function finishPlannerResize(cancelled = false) {
    if (!plannerResizeState) return;
    const { task, block, previewEnd, valid } = plannerResizeState;
    document.removeEventListener("pointermove", handlePlannerResizeMove);
    document.removeEventListener("pointerup", handlePlannerResizeUp);
    document.removeEventListener("pointercancel", handlePlannerResizeCancel);
    block.classList.remove("resizing", "resize-invalid");
    block.draggable = true;
    block.dataset.justResized = "true";
    plannerResizeState = null;
    if (!cancelled && valid && previewEnd && previewEnd !== task.end) {
      task.end = previewEnd;
      saveState();
      renderStaffTaskPlanner();
      showToast(task.seriesId ? `Duur van deze herhaling aangepast naar ${task.start}–${task.end}.` : `Taakduur aangepast naar ${task.start}–${task.end}.`);
      return;
    }
    if (!cancelled && previewEnd && !valid) showToast("Deze duur overlapt met een andere taak.");
    renderStaffTaskPlanner();
  }

  function handlePlannerResizeMove(event) {
    if (!plannerResizeState) return;
    event.preventDefault();
    updatePlannerResizePreview(event.clientY);
  }

  function handlePlannerResizeUp(event) {
    if (!plannerResizeState) return;
    event.preventDefault();
    finishPlannerResize(false);
  }

  function handlePlannerResizeCancel() {
    finishPlannerResize(true);
  }

  function startPlannerResize(event, block) {
    event.preventDefault();
    event.stopPropagation();
    const task = currentStaffPlannerTasks().find(item => item.id === block.dataset.plannerTaskId);
    const grid = $("#staffWeekPlannerGrid");
    if (!task || !grid) return;
    plannerDraggedTaskId = null;
    clearPlannerDropTarget();
    block.draggable = false;
    block.classList.add("resizing");
    plannerResizeState = { grid, task, block, previewEnd:task.end, valid:true };
    document.addEventListener("pointermove", handlePlannerResizeMove, { passive:false });
    document.addEventListener("pointerup", handlePlannerResizeUp, { passive:false });
    document.addEventListener("pointercancel", handlePlannerResizeCancel);
  }

  function toggleStaffPlannerTaskComplete(taskId) {
    if (!staffPlannerOwnView()) return;
    const task = (state.staffPlannerTasks || []).find(item => item.id === taskId);
    if (!task || !staffPlannerTaskAssignees(task).includes(state.role)) return;
    task.completed = !Boolean(task.completed);
    saveState();
    renderStaffTaskPlanner();
    showToast(task.completed ? "Taak afgevinkt." : "Taak weer actief.");
  }

  function staffPlannerColorKey(value) {
    return staffPlannerColors[value] ? value : "blue";
  }

  function staffPlannerColorStyle(value) {
    const palette = staffPlannerColors[staffPlannerColorKey(value)];
    return `--task-bg:${palette.bg};--task-border:${palette.border};--task-accent:${palette.accent};--task-text:${palette.text};--task-description:${palette.description};--task-muted:${palette.muted};`;
  }

  function selectedStaffPlannerColor() {
    const selected = document.querySelector('input[name="staffPlannerTaskColor"]:checked');
    return staffPlannerColorKey(selected?.value || "blue");
  }

  function setStaffPlannerColor(value = "blue") {
    const key = staffPlannerColorKey(value);
    $$('input[name="staffPlannerTaskColor"]').forEach(input => { input.checked = input.value === key; });
  }

  function renderStaffTaskPlanner() {
    const grid = $("#staffWeekPlannerGrid");
    if (!grid) return;
    renderStaffPlannerViewer();
    renderStaffPlannerWeekNavigation();
    renderStaffPlannerContinuationBar();
    const ownView = staffPlannerOwnView();
    const viewedStaffId = activeStaffPlannerId();
    const weekStart = activeStaffPlannerWeekStart();
    const weekDates = plannerWeekDates(weekStart);
    const addButton = $("#addTaskTopButton");
    if (addButton) {
      addButton.classList.remove("hidden");
      addButton.textContent = "Nieuwe taak";
    }
    $("#staffSignalsList").innerHTML = "";

    const days = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
    const times = plannerTimeOptions();
    const parts = ['<div class="planner-corner" aria-hidden="true"></div>'];
    days.forEach((day, dayIndex) => {
      const dateIso = weekDates[dayIndex];
      const todayClass = dateIso === prototypeToday() ? " today" : "";
      parts.push(`<div class="planner-day-header${todayClass}"><span>${day}</span><small>${escapeHtml(plannerShortDateLabel(dateIso))}</small></div>`);
    });
    times.slice(0, -1).forEach((time, rowIndex) => {
      parts.push(`<div class="planner-time-label">${time}</div>`);
      days.forEach((day, dayIndex) => {
        const fridayClosed = dayIndex === 4 && rowIndex >= 7;
        const classes = ["planner-slot", fridayClosed ? "friday-closed" : ""].filter(Boolean).join(" ");
        const disabled = fridayClosed;
        const ariaLabel = fridayClosed ? "Vrijdagmiddag gesloten" : ownView ? `Taak inplannen op ${day} om ${time}` : `Taak voor ${staffPlannerAccountName(viewedStaffId)} inplannen op ${day} om ${time}`;
        parts.push(`<button type="button" class="${classes}" data-planner-day="${dayIndex}" data-planner-date="${weekDates[dayIndex]}" data-planner-time="${time}" aria-label="${escapeHtml(ariaLabel)}"${disabled ? " disabled" : ""}></button>`);
      });
    });
    parts.push(`<div class="planner-time-label planner-time-label-end">${times.at(-1)}</div>`);
    days.forEach((day, dayIndex) => parts.push(`<div class="planner-end-cap ${dayIndex === 4 ? "friday-closed" : ""}" aria-hidden="true"></div>`));
    parts.push('<div class="planner-closure-block" aria-hidden="true"><span><strong>Gesloten</strong><small>Vrijdagmiddag · vanaf 12:30</small></span></div>');

    const taskBlocks = currentStaffPlannerTasks(viewedStaffId).filter(task => weekDates.includes(staffPlannerTaskDate(task))).map(task => {
      const startIndex = plannerTimeIndex(task.start);
      const endIndex = plannerTimeIndex(task.end);
      const dayIndex = plannerDayIndexForDate(staffPlannerTaskDate(task), weekStart);
      if (startIndex < 0 || endIndex <= startIndex || dayIndex < 0 || dayIndex > 4) return "";
      const gridColumn = dayIndex + 2;
      const gridRowStart = startIndex + 2;
      const gridRowEnd = endIndex + 2;
      const assignees = staffPlannerTaskAssignees(task);
      const assigneeNames = assignees.map(staffPlannerAccountName);
      const titleText = [richTextPlain(task.description), assigneeNames.length > 1 ? `Gedeeld met: ${assigneeNames.join(", ")}` : ""].filter(Boolean).join(" · ");
      const description = titleText ? ` title="${escapeHtml(titleText)}"` : "";
      const sharedPeople = assigneeNames.length > 1
        ? `<span class="planner-task-people" aria-label="Gekoppeld aan ${escapeHtml(assigneeNames.join(", "))}">${assigneeNames.slice(0, 2).map(name => `<span class="planner-task-avatar" title="${escapeHtml(name)}">${escapeHtml(staffPlannerInitials(name))}</span>`).join("")}${assigneeNames.length > 2 ? `<span class="planner-task-avatar planner-task-avatar-more">+${assigneeNames.length - 2}</span>` : ""}</span>`
        : "";
      const sharedClass = assigneeNames.length > 1 ? " shared-task" : "";
      const readonlyClass = ownView ? "" : " readonly-task";
      const completedClass = task.completed ? " completed-task" : "";
      const compactClass = (endIndex - startIndex) === 1 ? " compact-task" : "";
      const taskLocked = Boolean(task.completed);
      const resizeHandle = ownView && !taskLocked ? '<span class="planner-resize-handle" aria-hidden="true"></span>' : "";
      const visibleDescription = task.description ? `<div class="planner-task-description rich-text-content">${richTextHtml(task.description)}</div>` : "";
      const completeLabel = task.completed ? "Taak weer actief maken" : "Taak afvinken";
      const completeToggle = ownView
        ? `<button type="button" class="planner-task-complete-toggle" draggable="false" data-planner-task-complete="${task.id}" aria-pressed="${task.completed ? "true" : "false"}" aria-label="${completeLabel}" title="${completeLabel}">${task.completed ? "✓" : ""}</button>`
        : `<span class="planner-task-complete-toggle readonly" aria-hidden="true">${task.completed ? "✓" : ""}</span>`;
      const recurrenceLabel = task.seriesId ? plannerRecurrenceLabel(task.recurrencePattern) : "";
      const recurrenceMark = task.seriesId ? `<span class="planner-task-recurrence" title="${escapeHtml(recurrenceLabel)}" aria-label="${escapeHtml(recurrenceLabel)}">↻</span>` : "";
      const continuationMark = task.continuationGroupId ? '<span class="planner-task-continuation" title="Doorgepland tijdsblok" aria-label="Doorgepland tijdsblok">↳</span>' : "";
      const cardAria = `${task.title}, ${task.start} tot ${task.end}${task.seriesId ? `, ${recurrenceLabel}` : ""}${task.continuationGroupId ? ", doorgepland" : ""}${task.completed ? ", afgerond" : ""}`;
      const cardInteractive = ownView && !taskLocked;
      const colorStyle = staffPlannerColorStyle(task.color);
      return `<div class="planner-task-block${sharedClass}${readonlyClass}${completedClass}${compactClass}" tabindex="${cardInteractive ? "0" : "-1"}" role="${cardInteractive ? "button" : "group"}" aria-label="${escapeHtml(cardAria)}" draggable="${cardInteractive ? "true" : "false"}" data-planner-task-id="${task.id}" data-planner-task-completed="${taskLocked ? "true" : "false"}" style="${colorStyle}grid-column:${gridColumn};grid-row:${gridRowStart} / ${gridRowEnd};"${description}>${completeToggle}<strong>${richTitleHtml(task)}</strong>${visibleDescription}<small>${task.start}–${task.end}${recurrenceMark}${continuationMark}</small>${sharedPeople}${resizeHandle}</div>`;
    }).join("");
    parts.push(`<div class="planner-task-layer" aria-label="Ingeplande taken">${taskBlocks}</div>`);

    grid.innerHTML = parts.join("");
    grid.ondragover = null;
    grid.ondragleave = null;
    grid.ondrop = null;
    $$(".planner-slot:not(:disabled)", grid).forEach(slot => {
      slot.addEventListener("pointerdown", event => startPlannerSelection(event, slot));
      slot.addEventListener("click", event => event.preventDefault());
      slot.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const range = {
          day:Number(slot.dataset.plannerDay),
          date:slot.dataset.plannerDate,
          start:slot.dataset.plannerTime,
          end:plannerDefaultEnd(Number(slot.dataset.plannerDay), slot.dataset.plannerTime)
        };
        if (plannerContinuationSourceId && ownView) createStaffPlannerContinuation(range);
        else openStaffPlannerTaskDialog(null, range.day, range.start, range.date, range.end);
      });
    });
    /* In een andere begeleidersplanner mogen nieuwe taken worden ingepland,
       maar bestaande taken blijven bewust alleen-lezen. */
    if (!ownView) return;

    grid.ondragover = event => {
      if (!plannerDraggedTaskId) return;
      const slot = plannerSlotAtPoint(grid, event.clientX, event.clientY);
      clearPlannerDropTarget();
      if (!slot || slot.disabled) {
        if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
        return;
      }
      const task = currentStaffPlannerTasks().find(item => item.id === plannerDraggedTaskId);
      const payload = task ? plannerDropPayload(task, Number(slot.dataset.plannerDay), slot.dataset.plannerTime) : null;
      const error = plannerDropError(payload, plannerDraggedTaskId);
      if (error) {
        slot.classList.add("planner-drop-invalid");
        plannerDropTarget = slot;
        if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
        return;
      }
      event.preventDefault();
      slot.classList.add("planner-drop-target");
      plannerDropTarget = slot;
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    };

    grid.ondragleave = event => {
      if (!grid.contains(event.relatedTarget)) clearPlannerDropTarget();
    };

    grid.ondrop = event => {
      if (!plannerDraggedTaskId) return;
      event.preventDefault();
      const slot = plannerSlotAtPoint(grid, event.clientX, event.clientY);
      const taskId = plannerDraggedTaskId;
      clearPlannerDropTarget();
      plannerDraggedTaskId = null;
      if (!slot || slot.disabled) return;
      moveStaffPlannerTask(taskId, Number(slot.dataset.plannerDay), slot.dataset.plannerTime);
    };

    $$("[data-planner-task-id]", grid).forEach(task => {
      const completeToggle = $("[data-planner-task-complete]", task);
      if (completeToggle) {
        const restoreCardDrag = () => { task.draggable = task.dataset.plannerTaskCompleted !== "true"; };
        completeToggle.addEventListener("pointerdown", event => {
          event.stopPropagation();
          task.draggable = false;
        });
        completeToggle.addEventListener("pointerup", restoreCardDrag);
        completeToggle.addEventListener("pointercancel", restoreCardDrag);
        completeToggle.addEventListener("dragstart", event => { event.preventDefault(); event.stopPropagation(); });
        completeToggle.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          toggleStaffPlannerTaskComplete(task.dataset.plannerTaskId);
        });
      }
      task.addEventListener("click", event => {
        event.stopPropagation();
        if (task.dataset.plannerTaskCompleted === "true") return;
        if (task.dataset.justDragged === "true" || task.dataset.justResized === "true") return;
        openStaffPlannerTaskDialog(task.dataset.plannerTaskId);
      });
      task.addEventListener("keydown", event => {
        if (task.dataset.plannerTaskCompleted === "true") return;
        if (event.target !== task || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        openStaffPlannerTaskDialog(task.dataset.plannerTaskId);
      });
      const resizeHandle = $(".planner-resize-handle", task);
      if (resizeHandle) resizeHandle.addEventListener("pointerdown", event => startPlannerResize(event, task));
      task.addEventListener("dragstart", event => {
        if (task.dataset.plannerTaskCompleted === "true" || plannerResizeState || task.classList.contains("resizing")) {
          event.preventDefault();
          return;
        }
        plannerDraggedTaskId = task.dataset.plannerTaskId;
        task.classList.add("dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", plannerDraggedTaskId);
        }
      });
      task.addEventListener("dragend", () => {
        task.classList.remove("dragging");
        task.dataset.justDragged = "true";
        plannerDraggedTaskId = null;
        clearPlannerDropTarget();
        setTimeout(() => { task.dataset.justDragged = "false"; }, 80);
      });
    });
  }

  function populateStaffPlannerTimeSelects(startValue = "09:00", endValue = "09:30") {
    const times = plannerTimeOptions();
    const start = $("#staffPlannerTaskStart");
    const end = $("#staffPlannerTaskEnd");
    start.innerHTML = times.slice(0, -1).map(time => `<option value="${time}">${time}</option>`).join("");
    end.innerHTML = times.slice(1).map(time => `<option value="${time}">${time}</option>`).join("");
    start.value = times.includes(startValue) && startValue !== times.at(-1) ? startValue : "09:00";
    end.value = times.includes(endValue) && endValue !== times[0] ? endValue : "09:30";
  }

  function plannerDefaultEnd(dayIndex, startValue) {
    const times = plannerTimeOptions();
    const index = times.indexOf(startValue);
    if (index < 0) return "09:30";
    const fridayMax = dayIndex === 4 ? "12:30" : "16:30";
    const next = times[Math.min(index + 1, times.length - 1)];
    return next > fridayMax ? fridayMax : next;
  }

  function staffPlannerDepartmentName(department) {
    if (department === "multimedia") return "Multimedia";
    if (department === "it") return "IT";
    return "Procesbegeleiding";
  }

  function updateStaffPlannerAssigneeSummary() {
    const summary = $("#staffPlannerAssigneeSummary");
    if (!summary) return;
    const ids = selectedStaffPlannerAssignees();
    const names = ids.map(staffPlannerAccountName);
    if (!names.length) summary.textContent = "Kies begeleiders";
    else if (names.length <= 2) summary.textContent = names.join(", ");
    else summary.textContent = `${names.length} begeleiders geselecteerd`;
  }

  function renderStaffPlannerAssigneeOptions(selectedIds = []) {
    const container = $("#staffPlannerTaskAssignees");
    if (!container) return;
    const selected = new Set(selectedIds);
    const order = { multimedia:0, it:1, process:2 };
    const staff = staffPlannerAccounts().slice().sort((a, b) => (order[a.department] ?? 9) - (order[b.department] ?? 9) || a.name.localeCompare(b.name, "nl"));
    const groups = ["multimedia", "it", "process"].map(department => {
      const accounts = staff.filter(account => account.department === department);
      if (!accounts.length) return "";
      const options = accounts.map(account => {
        const checked = selected.has(account.id) ? " checked" : "";
        const you = account.id === state.role ? '<small>Jij</small>' : `<small>${escapeHtml(accountLabel(account))}</small>`;
        return `<label class="planner-assignee-option"><input type="checkbox" value="${escapeHtml(account.id)}"${checked}><span class="planner-assignee-avatar">${escapeHtml(staffPlannerInitials(account.name))}</span><span><strong>${escapeHtml(account.name)}</strong>${you}</span></label>`;
      }).join("");
      return `<div class="planner-assignee-group"><div class="planner-assignee-group-title">${staffPlannerDepartmentName(department)}</div>${options}</div>`;
    }).join("");
    container.innerHTML = groups;
    $$('input[type="checkbox"]', container).forEach(input => input.addEventListener("change", updateStaffPlannerAssigneeSummary));
    updateStaffPlannerAssigneeSummary();
  }

  function selectedStaffPlannerAssignees() {
    return $$('#staffPlannerTaskAssignees input[type="checkbox"]:checked').map(input => input.value);
  }

  function plannerWeekdayIndex(dateIso) {
    if (!dateIso) return -1;
    const date = parseDateOnly(dateIso);
    return (date.getDay() + 6) % 7;
  }

  function setStaffPlannerTaskDate(dateIso, fallbackDay = 0) {
    const input = $("#staffPlannerTaskDate");
    const hiddenDay = $("#staffPlannerTaskDay");
    if (!input || !hiddenDay) return;
    const fallbackDate = plannerDateForDay(Math.max(0, Math.min(4, Number(fallbackDay) || 0)));
    const value = dateIso || fallbackDate;
    input.min = CALENDAR_MIN;
    input.max = CALENDAR_MAX;
    input.value = value;
    hiddenDay.value = String(plannerWeekdayIndex(value));
  }

  function syncStaffPlannerTaskDate() {
    const input = $("#staffPlannerTaskDate");
    const hiddenDay = $("#staffPlannerTaskDay");
    if (!input || !hiddenDay) return -1;
    const day = plannerWeekdayIndex(input.value);
    hiddenDay.value = String(day);
    const recurrenceEnd = $("#staffPlannerTaskRecurrenceEnd");
    if (recurrenceEnd) recurrenceEnd.min = input.value || CALENDAR_MIN;
    return day;
  }

  function updateStaffPlannerRecurrenceUi(task = null) {
    const recurrence = $("#staffPlannerTaskRecurrence");
    const endWrap = $("#staffPlannerTaskRecurrenceEndWrap");
    const endInput = $("#staffPlannerTaskRecurrenceEnd");
    const hint = $("#staffPlannerTaskRecurrenceHint");
    const scopeWrap = $("#staffPlannerSeriesScopeWrap");
    const continueOption = $("#staffPlannerContinueOption");
    const continueInput = $("#staffPlannerTaskContinue");
    const recurringExisting = Boolean(task?.seriesId);
    const active = recurrence?.value && recurrence.value !== "none";
    if (endWrap) endWrap.classList.toggle("hidden", !active);
    if (hint) {
      hint.classList.toggle("hidden", !active);
      hint.textContent = recurringExisting
        ? "Deze taak hoort bij een terugkerende reeks. Kies hieronder of je één taak, toekomstige taken of de hele reeks wilt wijzigen."
        : "Zonder einddatum loopt de herhaling door tot het einde van de prototypekalender.";
    }
    if (scopeWrap) scopeWrap.classList.toggle("hidden", !recurringExisting);
    if (recurrence) recurrence.disabled = recurringExisting;
    if (endInput) endInput.disabled = recurringExisting || !active;
    const continuationUnavailable = recurringExisting || active;
    if (continueOption) continueOption.classList.toggle("hidden", continuationUnavailable);
    if (continueInput && continuationUnavailable) continueInput.checked = false;
  }

  function openStaffPlannerTaskDialog(taskId = null, presetDay = 0, presetStart = "09:00", presetDate = null, presetEnd = null) {
    const task = currentStaffPlannerTasks().find(item => item.id === taskId);
    const taskDate = task ? staffPlannerTaskDate(task) : (presetDate || plannerDateForDay(presetDay));
    const calculatedDay = plannerWeekdayIndex(taskDate);
    const day = calculatedDay >= 0 && calculatedDay <= 4 ? calculatedDay : Number(presetDay);
    const start = task?.start || presetStart || "09:00";
    const end = task?.end || presetEnd || plannerDefaultEnd(day, start);
    $("#staffPlannerTaskDialogTitle").textContent = task ? "Taak bewerken" : "Nieuwe taak";
    $("#staffPlannerTaskId").value = task?.id || "";
    setRichTextFieldValue("staffPlannerTaskTitle", task?.titleHtml || task?.title || "");
    setStaffPlannerColor(task?.color || "blue");
    setStaffPlannerTaskDate(taskDate, day);
    populateStaffPlannerTimeSelects(start, end);
    renderStaffPlannerAssigneeOptions(task ? staffPlannerTaskAssignees(task) : [activeStaffPlannerId()]);
    const assigneeDropdown = $("#staffPlannerAssigneeDropdown");
    if (assigneeDropdown) assigneeDropdown.open = false;
    const recurrence = $("#staffPlannerTaskRecurrence");
    const recurrenceEnd = $("#staffPlannerTaskRecurrenceEnd");
    const scope = $("#staffPlannerSeriesScope");
    if (recurrence) recurrence.value = task?.recurrencePattern || "none";
    if (recurrenceEnd) {
      recurrenceEnd.value = task?.recurrenceEnd || "";
      recurrenceEnd.min = taskDate || plannerDateForDay(day);
    }
    if (scope) scope.value = "this";
    const continueInput = $("#staffPlannerTaskContinue");
    if (continueInput) continueInput.checked = false;
    updateStaffPlannerRecurrenceUi(task);
    setRichTextFieldValue("staffPlannerTaskDescription", task?.description || "");
    $("#staffPlannerTaskError").textContent = "";
    $("#staffPlannerTaskError").classList.add("hidden");
    $("#deleteStaffPlannerTaskButton").classList.toggle("hidden", !task);
    $("#staffPlannerTaskDialog").showModal();
    setTimeout(() => document.getElementById("staffPlannerTaskTitleRichEditor")?.focus(), 40);
  }

  function staffPlannerTaskConflict(payload, ignoreId = "", ignoreIds = []) {
    const start = plannerTimeIndex(payload.start);
    const end = plannerTimeIndex(payload.end);
    const assignees = staffPlannerTaskAssignees(payload);
    const ignored = new Set([ignoreId, ...(ignoreIds || [])].filter(Boolean));
    if (!assignees.length) return false;
    return (state.staffPlannerTasks || []).some(task => {
      if (ignored.has(task.id) || staffPlannerTaskDate(task) !== payload.date) return false;
      const otherAssignees = staffPlannerTaskAssignees(task);
      if (!assignees.some(accountId => otherAssignees.includes(accountId))) return false;
      const otherStart = plannerTimeIndex(task.start);
      const otherEnd = plannerTimeIndex(task.end);
      return start < otherEnd && end > otherStart;
    });
  }

  function saveStaffPlannerTaskFromForm() {
    const id = $("#staffPlannerTaskId").value;
    const existingTask = id ? state.staffPlannerTasks.find(task => task.id === id) : null;
    const assignedStaff = [...new Set(selectedStaffPlannerAssignees())];
    const selectedDate = $("#staffPlannerTaskDate")?.value || "";
    const selectedDay = plannerWeekdayIndex(selectedDate);
    $("#staffPlannerTaskDay").value = String(selectedDay);
    const recurrencePattern = $("#staffPlannerTaskRecurrence")?.value || "none";
    const recurrenceEnd = $("#staffPlannerTaskRecurrenceEnd")?.value || "";
    const scope = existingTask?.seriesId ? ($("#staffPlannerSeriesScope")?.value || "this") : "this";
    const continueAfterSave = Boolean($("#staffPlannerTaskContinue")?.checked) && recurrencePattern === "none" && !existingTask?.seriesId;
    let continuationSourceTask = null;
    const payload = {
      assignedStaff,
      title: $("#staffPlannerTaskTitle").value.trim(),
      titleHtml: getRichTitleHtml("staffPlannerTaskTitle"),
      day: selectedDay,
      date: selectedDate,
      start: $("#staffPlannerTaskStart").value,
      end: $("#staffPlannerTaskEnd").value,
      color: selectedStaffPlannerColor(),
      description: $("#staffPlannerTaskDescription").value.trim()
    };
    const error = $("#staffPlannerTaskError");
    const startIndex = plannerTimeIndex(payload.start);
    const endIndex = plannerTimeIndex(payload.end);
    let message = "";
    if (!payload.title) message = "Geef de taak een titel.";
    else if (!assignedStaff.length) message = "Koppel minimaal één begeleider aan deze taak.";
    else if (!payload.date || payload.date < CALENDAR_MIN || payload.date > CALENDAR_MAX) message = "Kies een geldige datum binnen de beschikbare kalender.";
    else if (payload.day < 0 || payload.day > 4) message = "Taken kunnen alleen van maandag t/m vrijdag worden ingepland.";
    else if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) message = "De eindtijd moet na de starttijd liggen.";
    else if (payload.day === 4 && (payload.start >= "12:30" || payload.end > "12:30")) message = "Vrijdagmiddag is Spectrum gesloten. Plan deze taak vóór 12:30.";
    else if (!existingTask?.seriesId && recurrencePattern !== "none" && recurrenceEnd && recurrenceEnd < payload.date) message = "De einddatum van de herhaling moet op of na de eerste taak liggen.";
    if (message) {
      error.textContent = message;
      error.classList.remove("hidden");
      return false;
    }

    if (existingTask?.seriesId) {
      const affected = plannerSeriesAffectedTasks(existingTask, scope);
      const affectedIds = affected.map(task => task.id);
      const dateDelta = Math.round((parseDateOnly(payload.date) - parseDateOnly(staffPlannerTaskDate(existingTask))) / 86400000);
      const proposed = affected.map(task => {
        const date = parseDateOnly(staffPlannerTaskDate(task));
        date.setDate(date.getDate() + dateDelta);
        const dateIso = dateToIso(date);
        const day = (date.getDay() + 6) % 7;
        return { task, payload:{ ...payload, date:dateIso, day } };
      });
      const invalidDate = proposed.find(item => item.payload.date < CALENDAR_MIN || item.payload.date > CALENDAR_MAX || item.payload.day > 4);
      if (invalidDate) message = "Deze wijziging zou een herhaling buiten de beschikbare werkweek plaatsen.";
      const fridayInvalid = !message && proposed.find(item => item.payload.day === 4 && (item.payload.start >= "12:30" || item.payload.end > "12:30"));
      if (fridayInvalid) message = "Vrijdagmiddag is Spectrum gesloten. Een herhaling zou na 12:30 vallen.";
      const conflict = !message && proposed.find(item => staffPlannerTaskConflict(item.payload, item.task.id, affectedIds));
      if (conflict) message = `Deze wijziging botst met een andere taak op ${new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"long" }).format(parseDateOnly(conflict.payload.date))}.`;
      if (message) {
        error.textContent = message;
        error.classList.remove("hidden");
        return false;
      }
      proposed.forEach(({ task, payload:next }) => Object.assign(task, next));
      plannerViewedWeekStart = plannerWeekStartIso(payload.date);
      saveState();
      renderStaffTaskPlanner();
      error.classList.add("hidden");
      showToast(scope === "this" ? "Deze herhaling bijgewerkt." : scope === "future" ? "Deze en toekomstige herhalingen bijgewerkt." : "Hele reeks bijgewerkt.");
      return true;
    }

    const dates = recurrencePattern === "none" ? [payload.date] : plannerRecurrenceDates(payload.date, recurrencePattern, recurrenceEnd);
    if (!dates.length) {
      error.textContent = "Er konden geen geldige herhalingen worden ingepland.";
      error.classList.remove("hidden");
      return false;
    }
    const occurrences = dates.map(date => {
      const dateObj = parseDateOnly(date);
      return { ...payload, date, day:(dateObj.getDay() + 6) % 7 };
    });
    const fridayInvalid = occurrences.find(item => item.day === 4 && (item.start >= "12:30" || item.end > "12:30"));
    if (fridayInvalid) message = "Vrijdagmiddag is Spectrum gesloten. Pas de tijd van deze herhaling aan.";
    const ignoreIds = existingTask ? [existingTask.id] : [];
    const conflict = !message && occurrences.find(item => staffPlannerTaskConflict(item, existingTask?.id || "", ignoreIds));
    if (conflict) message = `Een van de gekoppelde begeleiders heeft al een taak op ${new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"long" }).format(parseDateOnly(conflict.date))} rond dit tijdstip.`;
    if (message) {
      error.textContent = message;
      error.classList.remove("hidden");
      return false;
    }

    error.classList.add("hidden");
    if (recurrencePattern === "none") {
      if (existingTask) {
        Object.assign(existingTask, payload);
        delete existingTask.seriesId;
        delete existingTask.recurrencePattern;
        delete existingTask.recurrenceEnd;
        delete existingTask.seriesAnchorDate;
        continuationSourceTask = existingTask;
      } else {
        const createdTask = { id:createId("planner-task"), ownerRole:state.role, createdByRole:state.role, completed:false, ...payload };
        state.staffPlannerTasks.push(createdTask);
        continuationSourceTask = createdTask;
      }
    } else {
      const seriesId = existingTask?.seriesId || createId("planner-series");
      const base = {
        ownerRole: existingTask?.ownerRole || state.role,
        createdByRole: existingTask?.createdByRole || state.role,
        seriesId,
        recurrencePattern,
        recurrenceEnd,
        seriesAnchorDate:payload.date
      };
      if (existingTask) {
        Object.assign(existingTask, base, occurrences[0], { completed:Boolean(existingTask.completed) });
        occurrences.slice(1).forEach(item => state.staffPlannerTasks.push({ id:createId("planner-task"), completed:false, ...base, ...item }));
      } else {
        occurrences.forEach(item => state.staffPlannerTasks.push({ id:createId("planner-task"), completed:false, ...base, ...item }));
      }
    }
    if (continueAfterSave && continuationSourceTask) plannerContinuationSourceId = continuationSourceTask.id;
    plannerViewedWeekStart = plannerWeekStartIso(payload.date);
    saveState();
    renderStaffTaskPlanner();
    const sharedCount = assignedStaff.length;
    if (recurrencePattern !== "none") showToast(`Terugkerende taak ingepland · ${dates.length} keer.`);
    else if (continueAfterSave) showToast("Taak opgeslagen. Klik en sleep het volgende tijdsblok om door te plannen.");
    else showToast(id ? "Gedeelde taak bijgewerkt." : sharedCount > 1 ? `Taak ingepland voor ${sharedCount} begeleiders.` : "Taak ingepland.");
    return true;
  }

  function deleteCurrentStaffPlannerTask() {
    const id = $("#staffPlannerTaskId").value;
    if (!id) return;
    const task = state.staffPlannerTasks.find(item => item.id === id);
    if (!task) return;
    const scope = task.seriesId ? ($("#staffPlannerSeriesScope")?.value || "this") : "this";
    const affectedIds = new Set(plannerSeriesAffectedTasks(task, scope).map(item => item.id));
    if (plannerContinuationSourceId && affectedIds.has(plannerContinuationSourceId)) plannerContinuationSourceId = null;
    state.staffPlannerTasks = state.staffPlannerTasks.filter(item => !affectedIds.has(item.id));
    saveState();
    $("#staffPlannerTaskDialog").close();
    renderStaffTaskPlanner();
    showToast(task.seriesId ? (scope === "this" ? "Deze herhaling verwijderd." : scope === "future" ? "Deze en toekomstige herhalingen verwijderd." : "Hele reeks verwijderd.") : "Taak verwijderd.");
  }

  // Lokaalbezetting is gescheiden van een persoonlijke caseload. Een mediënt
  // verschijnt alleen als het eigen rooster op dit moment dit lokaal en deze
  // werkplek aanwijst. Niet ingeklokt betekent dus niet automatisch afwezig.
  function currentRoomBlock(now = prototypeNow()) {
    const day = [null, "ma", "di", "wo", "do", "vr", null][now.getDay()];
    if (!day) return null;
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (time >= "09:00" && time < "12:30") return { day, part: "morning", time };
    if (day !== "vr" && time >= "13:00" && time < "16:30") return { day, part: "afternoon", time };
    return null;
  }

  function linkedStaffRooms() {
    const profile = state.profiles[state.role] || {};
    const linked = Array.isArray(profile.linkedRooms) ? profile.linkedRooms : [];
    // Ook begeleiders die op een andere afdeling invallen mogen elk gekoppeld lokaal zien.
    return rooms.filter(room => linked.includes(room.id));
  }

  function roomClientsForBlock(room, block) {
    if (!block) return [];
    const knownClients = new Set(data.people.filter(person => person.type === "client").map(person => person.name));
    const seats = new Map();
    state.roomAssignments.forEach(assignment => {
      if (assignment.roomId !== room.id || assignment.day !== block.day || !knownClients.has(assignment.client)) return;
      if (!partsOverlap(assignment.part, block.part)) return;
      const range = roomAssignmentTimeRange(assignment, block.part);
      if (!range || block.time < range.start || block.time >= range.end) return;
      if (Number(assignment.seat) < 1 || Number(assignment.seat) > room.seats) return;
      // Bij oudere conflicterende gegevens maximaal één mediënt per werkplek.
      if (!seats.has(Number(assignment.seat))) seats.set(Number(assignment.seat), assignment);
    });
    return [...seats.values()].sort((a, b) => Number(a.seat) - Number(b.seat)).slice(0, 12);
  }

  // Eén mediëntenoverzicht per gekoppeld lokaal. Het rooster bepaalt wie
  // verwacht wordt; de inklokstatus en dagstart bepalen de persoonlijke kaart.
  function localClientCardHtml(entry, room) {
    const person = data.people.find(item => item.type === "client" && item.name === entry.client);
    if (!person) return "";
    const attendance = effectiveClientStatus(person);
    const present = attendance.status === "Aanwezig" && Boolean(attendance.clockedIn);
    const mood = clientMoodInfo(person.name);
    const roomLabel = `${room.department === "it" ? "IT" : "MM"} ${room.id.split("-")[1]} - ${String(entry.seat).padStart(2, "0")}`;
    const avatar = mood
      ? `<span class="staff-local-avatar has-mood" title="Dagstart: ${escapeHtml(mood.label)}" aria-label="Dagstart: ${escapeHtml(mood.label)}">${mood.emoji}</span>`
      : `<span class="staff-local-avatar no-mood" title="Nog geen dagstart" aria-label="Nog geen dagstart"><svg class="lucide-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span>`;
    return `<button class="staff-local-client" type="button" data-open-local-client="${escapeHtml(person.name)}" aria-label="${escapeHtml(clientDisplayName(person.name))}, ${escapeHtml(roomLabel)}, ${present ? `aanwezig, ingeklokt om ${escapeHtml(attendance.clockedIn)}` : "afwezig"}. Open mediëntprofiel">
      ${avatar}
      <span class="staff-local-person"><strong title="${escapeHtml(clientFullName(person.name))}">${escapeHtml(clientDisplayName(person.name))}</strong><span class="staff-local-workplace">${escapeHtml(roomLabel)}</span><small>${present ? `Ingeklokt om ${escapeHtml(attendance.clockedIn)}` : "Nog niet ingeklokt"}</small></span>
      <span class="presence-pill staff-local-status ${present ? "present" : "away"}">${present ? "Aanwezig" : "Afwezig"}</span>
    </button>`;
  }

  let lastStaffRoomMinute = "";
  function renderStaffLocalWidgets() {
    const root = $("#staffRoomSnapshot");
    if (!root || currentConfig().kind !== "staff") return;
    const block = currentRoomBlock();
    const selected = linkedStaffRooms();
    const partLabel = block ? roomPartLabel(block.part) : "Buiten roosterblok";
    root.innerHTML = selected.length ? selected.map(room => {
      const assignments = roomClientsForBlock(room, block);
      const cards = assignments.map(entry => localClientCardHtml(entry, room)).join("");
      const empty = !block ? "Er is op dit moment geen actief roosterblok." : "Voor dit dagdeel staan geen mediënten in dit lokaal ingepland.";
      return `<article class="panel staff-dashboard-panel staff-local-panel"><div class="panel-heading-row"><div><p class="eyebrow">${escapeHtml(partLabel)} · volgens rooster</p><h2>Mediënten lokaal (${escapeHtml(room.name)})</h2></div><span class="staff-local-count" aria-label="${assignments.length} van ${room.seats} werkplekken ingeroosterd">${assignments.length}/${room.seats}</span></div>${assignments.length ? `<div class="staff-local-grid">${cards}</div>` : `<p class="staff-local-empty">${empty}</p>`}</article>`;
    }).join("") : `<article class="panel staff-dashboard-panel staff-local-panel staff-local-setup"><div><p class="eyebrow">Lokalen</p><h2>Mediënten lokaal</h2><p>Koppel één of meer lokalen in je begeleidersprofiel om de ingeroosterde mediënten en hun werkplek hier te zien.</p></div><button class="secondary-button" type="button" data-configure-local-rooms>Mijn lokalen instellen</button></article>`;
    const now = prototypeNow();
    lastStaffRoomMinute = `${prototypeToday()}-${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  }

  function renderStaffDashboard() {
    const config = roleConfig[state.role] || roleConfig["staff-mm"];
    const name = accountNames[state.role] || "Lindsay";
    const clients = staffCaseload();
    const present = clients.filter(person => effectiveClientStatus(person).status === "Aanwezig");
    const reports = staffRelevantDiary().filter(entry => entry.date.slice(0, 10) >= prototypeToday());
    updateGreetings();
    $("#staffDashboardIntro").textContent = "De gekoppelde lokalen bepalen wie je tijdens het huidige dagdeel ziet.";
    $("#staffPresentCount").textContent = `${present.length} van ${clients.length}`;
    $("#staffReportCount").textContent = reports.length;
    $("#staffTodayClients").innerHTML = clients.length ? clients.map(person => {
      const status = effectiveClientStatus(person);
      const mood = clientMoodInfo(person.name);
      return staffListRow({ icon: mood?.emoji || person.name[0], title: clientDisplayName(person.name), meta: `${status.status === "Aanwezig" ? `Ingeklokt om ${status.clockedIn}` : "Vandaag niet ingeklokt"}${mood ? ` · dagstart ${mood.label.toLowerCase()}` : ""}`, badge: status.status, badgeClass: status.status === "Aanwezig" ? "success" : "" });
    }).join("") : emptyAgendaHtml("Geen mediënten toegewezen.");

    const messages = [...state.messages].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 4);
    $("#staffPlannedContent").innerHTML = messages.length ? messages.map(message => {
      const scheduled = new Date(message.publishedAt) > prototypeNow();
      return staffListRow({ icon: "●", title: message.title, titleHtml:message.titleHtml, meta: `${isEventAnnouncement(message) ? "Evenement · " : ""}${messageAudienceLabel(message.audience)} · ${formatMessageDate(message.publishedAt)}`, badge: scheduled ? "Gepland" : "Gepubliceerd", badgeClass: scheduled ? "warning" : "success" });
    }).join("") : emptyAgendaHtml("Nog geen berichten gepland.");


    renderStaffLocalWidgets();
  }

  function moodRecordFor(client = currentAccountName(), date = prototypeToday()) {
    return state.dailyMood.find(item => item.client === client && item.date === date);
  }
  function setMoodSelection(targetId, value) {
    const input = $(`#${targetId}`);
    if (!input) return;
    input.value = value ? String(value) : "";
    $$(`[data-mood-target="${targetId}"]`).forEach(button => {
      const selected = String(button.dataset.mood) === String(value || "");
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    if (targetId === "loginMood") updateLoginMoodVisibility();
  }
  function updateLoginMoodVisibility() {
    const role = $("#loginRole")?.value || state.role;
    const client = (roleConfig[role] || roleConfig["client-mm"]).kind === "client";
    const fieldset = $("#loginMoodFieldset");
    fieldset?.classList.toggle("hidden", !client);
    if (!client) {
      const input = $("#loginMood");
      if (input) input.value = "";
      $$('[data-mood-target="loginMood"]').forEach(button => { button.classList.remove("selected"); button.setAttribute("aria-pressed", "false"); });
      fieldset?.classList.remove("mood-required");
    }
    const submit = $("#loginSubmitButton");
    if (submit) {
      submit.disabled = client && !$("#loginMood")?.value;
      submit.title = submit.disabled ? "Kies eerst hoe je de dag in gaat" : "";
    }
  }
  function saveStartMood(value) {
    if (currentConfig().kind !== "client") return;
    const client = currentAccountName();
    const date = prototypeToday();
    let record = moodRecordFor(client, date);
    if (!record) {
      record = { client, department: currentConfig().department, date, start: Number(value), end: null, startedAt: new Date().toISOString(), endedAt: null };
      state.dailyMood.push(record);
    } else {
      record.start = Number(value);
      record.startedAt = record.startedAt || new Date().toISOString();
    }
  }
  function saveEndMood(value) {
    if (currentConfig().kind !== "client") return null;
    const client = currentAccountName();
    const date = prototypeToday();
    let record = moodRecordFor(client, date);
    if (!record) {
      record = { client, department: currentConfig().department, date, start: null, end: Number(value), startedAt: null, endedAt: new Date().toISOString() };
      state.dailyMood.push(record);
    } else {
      record.end = Number(value);
      record.endedAt = new Date().toISOString();
    }
    return record;
  }
  function moodPairHtml(start, end) {
    if (!start && !end) return "";
    const startMood = start ? moodOptions[start] : null;
    const endMood = end ? moodOptions[end] : null;
    return `<div class="diary-mood"><span>Start ${startMood ? `${startMood.emoji} ${escapeHtml(startMood.label)}` : "—"}</span><span aria-hidden="true">→</span><span>Einde ${endMood ? `${endMood.emoji} ${escapeHtml(endMood.label)}` : "—"}</span></div>`;
  }

  function renderClock() {
    const clock = currentClock();
    const active = clock.active && clock.startedAt;
    $("#clockStatusLabel").textContent = active ? "Ingeklokt sinds" : "Niet ingeklokt";
    $("#clockStatusValue").textContent = active
      ? new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" }).format(new Date(clock.startedAt))
      : "—";
    $("#clockButton").textContent = active ? "Uitklokken" : "Inklokken";
    $("#clockPageButton").textContent = active ? "Uitklokken" : "Inklokken";
    $("#clockPageStatus").textContent = active ? `Je bent ingeklokt sinds ${$("#clockStatusValue").textContent}.` : "Je bent niet ingeklokt.";
  }
  let lastNotificationDay = null;
  let lastGuidanceSlot = "";
  function updateLiveClock() {
    const now = new Date();
    const guidanceSlot = `${currentStaffDay(now)}-${attendancePart(now)}`;
    if (state.authenticated && guidanceSlot !== lastGuidanceSlot) {
      lastGuidanceSlot = guidanceSlot;
      renderAttendance();
    }
    $("#bigClock").textContent = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
    // Ook bij een openstaand dashboard schakelt de begroeting op het juiste uur om.
    if (now.getHours() !== lastGreetingHour) updateGreetings(now);
    // De klok loopt al iedere seconde: ververs Upcoming alleen als een afspraak
    // is afgelopen of als de kalenderdag is veranderd.
    if (state.authenticated && prototypeNow().getTime() >= nextMessagePublicationChange) {
      renderMessages();
      renderNotifications();
      if (currentConfig().kind === "staff") renderStaffDashboard();
    }
    if (state.authenticated && currentConfig().kind === "staff") {
      const stamp = `${prototypeToday()}-${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      if (stamp !== lastStaffRoomMinute) renderStaffLocalWidgets();
    }
    if (state.authenticated && prototypeToday() !== lastTaskDeadlineDay) {
      lastTaskDeadlineDay = prototypeToday();
      renderKanbans();
    }
    // Keep the board in sync if an item reaches its 30-day archive threshold while open.
    const archiveMinute = Math.floor(now.getTime() / 60000);
    if (state.authenticated && archiveMinute !== lastTaskArchiveMinute) {
      lastTaskArchiveMinute = archiveMinute;
      if (archiveCompletedTasks()) { renderKanbans(); renderRoleSummary(); }
    }
    if (state.authenticated && prototypeToday() !== lastNotificationDay) {
      lastNotificationDay = prototypeToday();
      renderNotifications();
      if (currentConfig().kind === "client") showLoginMessagePopup();
    }
    if (state.authenticated && (prototypeToday() !== lastUpcomingDay ||
      (nextUpcomingExpiry !== null && prototypeNow().getTime() >= nextUpcomingExpiry))) {
      renderUpcomingAgenda();
    }
  }
  function toggleClock() {
    if (currentClock().active) {
      prepareClockOutDialog();
      $("#clockOutDialog").showModal();
    } else {
      setCurrentClock({ active: true, startedAt: new Date().toISOString() });
      state.sessionActivity = [];
      saveState();
      renderClock();
      showToast("Je bent ingeklokt.");
    }
  }
  function prepareClockOutDialog() {
    setMoodSelection("clockOutMood", "");
    const started = [...new Set(state.sessionActivity.filter(item => item.to === "doing").map(item => item.title))];
    const completed = [...new Set(state.sessionActivity.filter(item => item.to === "done").map(item => item.title))];
    const active = relevantTasks().find(task => task.active);
    const parts = [];
    if (started.length) parts.push(`Ik ben gestart met ${started.join(", ")}.`);
    if (active) parts.push(`Ik heb vooral gewerkt aan ${active.title}.`);
    if (completed.length) parts.push(`Afgerond: ${completed.join(", ")}.`);
    setRichTextFieldValue("clockOutNote", parts.join(" ") || "Vandaag heb ik aan mijn geplande taken gewerkt.");
    setRichTextFieldValue("clockOutNext", "");
    $("#activitySuggestion").innerHTML = `<strong>Automatisch herkend</strong><br>Gestart: ${started.map(escapeHtml).join(", ") || "—"}<br>Actieve taak: ${active ? escapeHtml(active.title) : "—"}<br>Afgerond: ${completed.map(escapeHtml).join(", ") || "—"}`;
  }
  function completeClockOut(note, moodEnd) {
    const next = $("#clockOutNext").value.trim();
    const moodRecord = saveEndMood(moodEnd);
    state.diary.unshift({ id: createId("diary"), client: currentAccountName(), department: currentConfig().department, date: new Date().toISOString(), text: `${richTextHtml(note.trim())}${next ? `<p><strong>Volgende werkdag:</strong> ${richTextHtml(next)}</p>` : ""}`, moodStart: moodRecord?.start || null, moodEnd: moodRecord?.end || null });
    setCurrentClock({ active: false, startedAt: null });
    state.sessionActivity = [];
    saveState();
    renderAll();
    if (logoutAfterClockOut) {
      finishLogout();
    } else {
      showToast("Dagverslag opgeslagen. Je bent uitgeklokt.");
    }
  }

  // De kaartchecklists blijven dicht tot de gebruiker ze openklapt.
  // Bewaar deze alleen tijdens de sessie, ook wanneer het bord opnieuw rendert.
  const expandedTaskChecklists = new Set();
  let lastTaskDeadlineDay = null;
  let lastTaskArchiveMinute = null;
  const TASK_ARCHIVE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
  let taskArchiveExpanded = false;
  function taskIsArchived(task) { return Boolean(task.archivedAt); }
  function taskIsLocked(task) { return task.column === "done" || taskIsArchived(task); }
  function taskCompletionLabel(task) {
    if (!task.completedAt) return "Onbekend";
    const value = new Date(task.completedAt);
    return Number.isNaN(value.getTime()) ? "Onbekend" : new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"long", year:"numeric" }).format(value);
  }
  function archiveCompletedTasks() {
    const now = Date.now();
    let changed = false;
    state.tasks.forEach(task => {
      if (task.column !== "done" || task.archivedAt) return;
      if (!task.completedAt || Number.isNaN(Date.parse(task.completedAt))) {
        task.completedAt = new Date(now).toISOString();
        changed = true;
      }
      if (now - Date.parse(task.completedAt) >= TASK_ARCHIVE_AFTER_MS) {
        task.archivedAt = new Date(now).toISOString();
        changed = true;
      }
    });
    if (changed) saveState();
    return changed;
  }
  function resetCompletedTask(task) {
    task.column = "todo";
    task.completedAt = null;
    task.archivedAt = null;
    task.active = false;
  }
  function renderTaskArchive() {
    const toggle = $("#taskArchiveButton");
    const panel = $("#taskArchivePanel");
    const list = $("#taskArchiveList");
    if (!toggle || !panel || !list) return;
    const staff = currentConfig().kind === "staff";
    toggle.classList.toggle("hidden", staff);
    panel.classList.toggle("hidden", staff || !taskArchiveExpanded);
    $("#page-tasks").classList.toggle("task-archive-open", !staff && taskArchiveExpanded);
    if (staff) return;
    const archived = relevantTasks().filter(taskIsArchived).sort((a,b) => (b.archivedAt || "").localeCompare(a.archivedAt || ""));
    $("#taskArchiveButtonLabel").textContent = `Archief ${taskArchiveExpanded ? "verbergen" : "tonen"} (${archived.length})`;
    toggle.classList.toggle("is-open", taskArchiveExpanded);
    toggle.setAttribute("aria-expanded", String(taskArchiveExpanded));
    list.innerHTML = archived.length ? archived.map(task => `
      <article class="task-archive-item">
        <div class="task-archive-info">
          <strong>${richTitleHtml(task)}</strong>
          <span>${escapeHtml(task.label || "Geen label")} · Afgerond op ${escapeHtml(taskCompletionLabel(task))}</span>
        </div>
        <div class="task-archive-actions">
          <button type="button" class="ghost-button" data-archive-view="${escapeHtml(task.id)}">Bekijken</button>
          <button type="button" class="secondary-button" data-archive-restore="${escapeHtml(task.id)}">Terugzetten</button>
          <button type="button" class="danger-button" data-archive-delete="${escapeHtml(task.id)}">Verwijderen</button>
        </div>
      </article>`).join("") : '<p class="task-archive-empty">Er staan nog geen afgeronde taken in het archief.</p>';
  }
  function setTaskArchiveExpanded(expanded) {
    taskArchiveExpanded = expanded;
    renderTaskArchive();
    const destination = expanded ? $("#taskArchivePanel") : $("#page-tasks .page-header");
    if (destination && !destination.classList.contains("hidden")) {
      destination.scrollIntoView({ behavior: document.body.classList.contains("reduce-motion") ? "auto" : "smooth", block: "start" });
    }
  }
  function refreshTaskViews() {
    saveState();
    renderKanbans();
    renderRoleSummary();
  }
  function taskDeadlineOverdue(task, today = prototypeToday()) {
    return task.column !== "done" && Boolean(task.due) && task.due < today;
  }
  function createKanbanHtml(boardId) {
    const today = prototypeToday();
    return Object.entries(columnNames).map(([column, label]) => {
      const tasks = relevantTasks().filter(task => task.column === column && !taskIsArchived(task));
      const cards = tasks.map(task => {
        const checklist = Array.isArray(task.checklist) ? task.checklist : [];
        const finished = new Set(Array.isArray(task.checklistDone) ? task.checklistDone : []);
        const doneCount = checklist.filter((_, index) => finished.has(index)).length;
        const expanded = expandedTaskChecklists.has(task.id);
        const overdue = taskDeadlineOverdue(task, today);
        return `
        <article class="task-card ${task.active ? "active-task" : ""} ${overdue ? "task-overdue" : ""} ${task.column === "done" ? "task-completed" : ""}" draggable="true" data-task-id="${escapeHtml(task.id)}" tabindex="0">
          <div class="task-title-row"><h3>${richTitleHtml(task)}</h3><button class="task-menu" data-edit-task="${escapeHtml(task.id)}" title="${taskIsLocked(task) ? "Taak bekijken" : "Taak bewerken"}">⋮</button></div>
          ${task.active ? '<span class="active-task-badge">▶ Hier werk ik nu aan</span>' : ""}
          ${task.sourceGoalId ? '<span class="task-sprint-tag">Sprintdoel · Mijn Doelen</span>' : ""}
          ${task.description ? `<div class="task-card-description rich-text-content">${richTextHtml(task.description)}</div>` : ""}
          <div class="task-meta">
            <span class="tag ${escapeHtml(String(task.label || "").toLowerCase())}">${escapeHtml(task.label || "")}</span>
            <span class="task-deadline">▣ ${formatDate(task.due)}</span>
            ${overdue ? '<span class="task-overdue-label">Deadline verstreken</span>' : ""}
            ${task.column === "done" ? `<span class="task-completed-date">Afgerond op ${escapeHtml(taskCompletionLabel(task))}</span>` : ""}
          </div>
          ${checklist.length ? `
            <div class="task-card-checklist-wrap">
              <button type="button" class="task-card-checklist-toggle" data-toggle-task-checklist="${escapeHtml(task.id)}" aria-expanded="${expanded}" aria-controls="${boardId}-task-card-checklist-${escapeHtml(task.id)}">
                <span>Checklist <span class="task-card-checklist-count">${doneCount}/${checklist.length}</span></span>
                <span class="task-card-checklist-chevron" aria-hidden="true">⌄</span>
              </button>
              <div class="task-card-checklist" id="${boardId}-task-card-checklist-${escapeHtml(task.id)}" aria-label="Checklist" ${expanded ? "" : "hidden"}>
                ${checklist.map((item, index) => `
                  <label class="task-card-check-item ${finished.has(index) ? "is-done" : ""}">
                    <input type="checkbox" data-card-task-check="${index}" ${finished.has(index) ? "checked" : ""} ${taskIsLocked(task) ? "disabled" : ""} />
                    <span>${escapeHtml(item)}</span>
                  </label>`).join("")}
              </div>
            </div>` : ""}
        </article>`;
      }).join("");
      return `<section class="kanban-column" data-column="${column}">
        <div class="column-header"><span>${label}</span><span class="column-count">${tasks.length}</span></div>
        <div class="task-list" data-drop-column="${column}">${cards}</div>
        <button class="add-task-button" data-add-task="${column}">+ Taak toevoegen</button>
      </section>`;
    }).join("");
  }
  function renderKanbans() {
    archiveCompletedTasks();
    const staffView = currentConfig().kind === "staff";
    const title = $("#tasksPageTitle");
    const eyebrow = $("#tasksPageEyebrow");
    const intro = $("#tasksPageIntro");
    const addButton = $("#addTaskTopButton");
    if (title) title.textContent = "Planbord";
    if (eyebrow) eyebrow.textContent = staffView ? "Begeleiding" : "Persoonlijk werkbord";
    if (intro) intro.textContent = staffView ? "Klik en sleep in de planner om een tijdsblok te kiezen; daarna vul je de taak in. Vrijdagmiddag blijft bewust leeg omdat Spectrum dan gesloten is." : "Beheer je taken in Te doen, Mee bezig, Hulp/overleg nodig en Klaar.";
    if (addButton) {
      addButton.classList.remove("hidden");
      addButton.textContent = "Nieuwe taak";
    }
    const dashboardBoard = $("#dashboardKanban");
    const tasksBoard = $("#tasksPageKanban");
    if (dashboardBoard) {
      dashboardBoard.innerHTML = createKanbanHtml("dashboard");
      bindKanbanEvents(dashboardBoard);
    }
    if (tasksBoard) {
      tasksBoard.innerHTML = createKanbanHtml("tasks");
      bindKanbanEvents(tasksBoard);
    }
    renderTaskArchive();
    renderTaskSprintGoals();
  }
  function bindKanbanEvents(root) {
    $$('[data-add-task]', root).forEach(button => button.addEventListener("click", () => openTaskDialog(null, button.dataset.addTask)));
    $$('[data-edit-task]', root).forEach(button => button.addEventListener("click", event => {
      event.stopPropagation();
      const task = relevantTasks().find(item => item.id === button.dataset.editTask);
      if (taskIsLocked(task || {})) openTaskDetails(button.dataset.editTask);
      else openTaskDialog(button.dataset.editTask);
    }));
    $$('[data-toggle-task-checklist]', root).forEach(button => button.addEventListener("click", event => {
      event.stopPropagation();
      const id = button.dataset.toggleTaskChecklist;
      if (expandedTaskChecklists.has(id)) expandedTaskChecklists.delete(id);
      else expandedTaskChecklists.add(id);
      // De andere bordweergave krijgt dezelfde open-/dichtstatus.
      renderKanbans();
      const visibleRoot = root.id === "dashboardKanban" ? $("#dashboardKanban") : $("#tasksPageKanban");
      const sameCard = $$(".task-card", visibleRoot).find(card => card.dataset.taskId === id);
      sameCard?.querySelector("[data-toggle-task-checklist]")?.focus();
    }));
    // Afvinken mag rechtstreeks op het kaartje; bewerken gebeurt in taakdetails.
    $$('[data-card-task-check]', root).forEach(checkbox => checkbox.addEventListener("change", event => {
      const card = event.currentTarget.closest(".task-card");
      const task = relevantTasks().find(item => item.id === card?.dataset.taskId);
      if (!task || taskIsLocked(task) || !setTaskChecklistChecked(task, Number(event.currentTarget.dataset.cardTaskCheck), event.currentTarget.checked)) return;
      saveState();
      renderKanbans();
      renderRoleSummary();
      const visibleRoot = root.id === "dashboardKanban" ? $("#dashboardKanban") : $("#tasksPageKanban");
      const sameCard = $$(".task-card", visibleRoot).find(item => item.dataset.taskId === task.id);
      sameCard?.querySelector(`[data-card-task-check="${event.currentTarget.dataset.cardTaskCheck}"]`)?.focus();
    }));
    const clearDropIndicators = () => {
      $$(".task-card.drop-before, .task-card.drop-after", root).forEach(card => card.classList.remove("drop-before", "drop-after"));
      $$(".kanban-column.drop-target", root).forEach(column => column.classList.remove("drop-target"));
    };
    $$(".task-card", root).forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("button, label, input") || card.classList.contains("dragging")) return;
        openTaskDetails(card.dataset.taskId);
      });
      card.addEventListener("keydown", event => {
        if (event.target !== card || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        openTaskDetails(card.dataset.taskId);
      });
      card.addEventListener("dragstart", event => {
        if (event.target.closest("button, input, label") && event.target !== card) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/plain", card.dataset.taskId);
        event.dataTransfer.effectAllowed = "move";
        card.classList.add("dragging");
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        clearDropIndicators();
      });
    });
    $$('[data-drop-column]', root).forEach(zone => {
      zone.addEventListener("dragover", event => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        clearDropIndicators();
        zone.closest(".kanban-column").classList.add("drop-target");
        const target = event.target.closest(".task-card");
        if (target && zone.contains(target) && !target.classList.contains("dragging")) {
          const before = event.clientY < target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
          target.classList.add(before ? "drop-before" : "drop-after");
        }
      });
      zone.addEventListener("dragleave", event => {
        if (!zone.contains(event.relatedTarget)) clearDropIndicators();
      });
      zone.addEventListener("drop", event => {
        event.preventDefault();
        const target = event.target.closest(".task-card");
        let beforeTaskId = null;
        if (target && zone.contains(target) && !target.classList.contains("dragging")) {
          const before = event.clientY < target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
          if (before) beforeTaskId = target.dataset.taskId;
          else beforeTaskId = target.nextElementSibling?.classList.contains("task-card") ? target.nextElementSibling.dataset.taskId : null;
        }
        const taskId = event.dataTransfer?.getData("text/plain");
        clearDropIndicators();
        if (target?.dataset.taskId === taskId) return;
        moveTask(taskId, zone.dataset.dropColumn, beforeTaskId);
      });
    });
  }
  // Volgorde wordt bepaald door de reeds opgeslagen state.tasks-volgorde.
  // Zo blijven oudere taken en bestaande accounts zonder datamigratie werken.
  function moveTask(taskId, newColumn, beforeTaskId = null) {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task || !Object.hasOwn(columnNames, newColumn) || !relevantTasks().some(item => item.id === taskId)) return;
    const existing = relevantTasks().filter(item => item.column === newColumn && item.id !== taskId);
    if (!existing.some(item => item.id === beforeTaskId)) beforeTaskId = null;
    const previousColumn = task.column;
    const earlier = relevantTasks().filter(item => item.column === newColumn).map(item => item.id);
    const reordered = existing.map(item => item.id);
    reordered.splice(beforeTaskId ? reordered.indexOf(beforeTaskId) : reordered.length, 0, taskId);
    if (previousColumn === newColumn && earlier.join("|") === reordered.join("|")) return;

    const sourceIndex = state.tasks.findIndex(item => item.id === taskId);
    state.tasks.splice(sourceIndex, 1);
    if (beforeTaskId) {
      const index = state.tasks.findIndex(item => item.id === beforeTaskId);
      state.tasks.splice(index, 0, task);
    } else if (existing.length) {
      const last = state.tasks.findIndex(item => item.id === existing.at(-1).id);
      state.tasks.splice(last + 1, 0, task);
    } else {
      state.tasks.push(task);
    }
    task.column = newColumn;
    if (previousColumn !== newColumn) {
      if (newColumn === "done") {
        task.completedAt = new Date().toISOString();
        task.archivedAt = null;
        task.active = false;
      } else if (previousColumn === "done") {
        task.completedAt = null;
        task.archivedAt = null;
      }
      state.sessionActivity.push({ taskId, title: task.title, from: previousColumn, to: newColumn, at: new Date().toISOString() });
    }
    saveState();
    renderKanbans();
    renderRoleSummary();
    if (previousColumn !== newColumn) showToast(`${task.title} verplaatst naar ${columnNames[newColumn]}.`);
  }
  function setTaskChecklistChecked(task, index, checked) {
    if (!Number.isInteger(index) || index < 0 || index >= (task.checklist || []).length) return false;
    const done = new Set(task.checklistDone || []);
    if (checked) done.add(index);
    else done.delete(index);
    task.checklistDone = [...done].sort((a, b) => a - b);
    return true;
  }
  function renderTaskDetails(task) {
    const done = Array.isArray(task.checklistDone) ? task.checklistDone : [];
    const items = Array.isArray(task.checklist) ? task.checklist : [];
    const completed = items.filter((_, index) => done.includes(index)).length;
    const overdue = taskDeadlineOverdue(task);
    $("#taskDetailTitle").innerHTML = richTitleHtml(task);
    $("#taskDetailStatus").textContent = columnNames[task.column] || "Te doen";
    $("#taskDetailMeta").innerHTML = `
      <div class="task-detail-meta-item"><span>Label</span><strong>${escapeHtml(task.label || "Geen label")}</strong></div>
      <div class="task-detail-meta-item ${overdue ? "task-detail-overdue" : ""}"><span>Deadline</span><strong>${task.due ? escapeHtml(formatLongDate(task.due)) : "Geen deadline"}${overdue ? ' · Deadline verstreken' : ""}</strong></div>
      ${task.active ? '<div class="task-detail-meta-item"><span>Actief</span><strong>Hier werk ik nu aan</strong></div>' : ""}
      ${task.completedAt ? `<div class="task-detail-meta-item"><span>Afgerond op</span><strong>${escapeHtml(taskCompletionLabel(task))}</strong></div>` : ""}`;
    $("#taskDetailStatus").textContent = taskIsArchived(task) ? "Gearchiveerd" : (columnNames[task.column] || "Te doen");
    $("#taskDetailEdit").classList.toggle("hidden", taskIsLocked(task));
    $("#taskDetailLockedHint").classList.toggle("hidden", !taskIsLocked(task));
    const description = $("#taskDetailDescription");
    description.innerHTML = task.description ? richTextHtml(task.description) : '<span class="task-detail-empty">Geen omschrijving toegevoegd.</span>';
    $("#taskDetailChecklistSection").classList.toggle("hidden", !items.length);
    $("#taskDetailProgress").textContent = `${completed} van ${items.length} afgerond`;
    $("#taskDetailChecklist").innerHTML = items.map((item, index) => `
      <label class="task-detail-check-item ${done.includes(index) ? "is-done" : ""}">
        <input type="checkbox" data-task-check="${index}" ${done.includes(index) ? "checked" : ""} ${taskIsLocked(task) ? "disabled" : ""} />
        <span>${escapeHtml(item)}</span>
      </label>`).join("");
  }
  function openTaskDetails(taskId) {
    const task = relevantTasks().find(item => item.id === taskId);
    if (!task) return;
    $("#taskDetailView").dataset.taskId = task.id;
    $("#taskForm").classList.add("hidden");
    $("#taskDetailView").classList.remove("hidden");
    renderTaskDetails(task);
    if (!$("#taskDialog").open) $("#taskDialog").showModal();
    // The read-only view never has unsaved form changes, even after cancelling edit.
    dialogInitialFormValues.set($("#taskDialog"), null);
    (taskIsLocked(task) ? $("#taskDetailClose") : $("#taskDetailEdit")).focus();
  }
  function openTaskDialog(taskId = null, presetColumn = null) {
    const task = taskId ? relevantTasks().find(item => item.id === taskId) : null;
    if (taskId && !task) return;
    if (task && taskIsLocked(task)) { openTaskDetails(task.id); return; }
    $("#taskDetailView").classList.add("hidden");
    $("#taskForm").classList.remove("hidden");
    $("#taskDialogTitle").textContent = task ? "Taak bewerken" : "Nieuwe taak";
    $("#taskId").value = task?.id || "";
    setRichTextFieldValue("taskTitle", task?.titleHtml || task?.title || "");
    $("#taskColumn").value = task?.column || presetColumn || "todo";
    const departmentLabel = currentConfig().department === "it" ? "IT" : "Multimedia";
    $("#taskLabel").innerHTML = `<option>${departmentLabel}</option><option>Persoonlijk</option>`;
    $("#taskLabel").value = task?.label || departmentLabel;
    $("#taskDue").value = task?.due || "";
    $("#taskActive").checked = Boolean(task?.active);
    setRichTextFieldValue("taskDescription", task?.description || "");
    $("#taskChecklist").value = (task?.checklist || []).join("\n");
    $("#taskChecklistSection").open = false;
    $("#taskChecklistHint").textContent = task?.checklist?.length ? `${task.checklist.length} onderdelen` : "Optioneel";
    // A task created from a column already has its status; no need to choose it twice.
    $("#taskColumnField").classList.toggle("hidden", !task && presetColumn !== null);
    $("#taskExtraSection").open = Boolean(task?.active);
    $("#taskExtraSection").classList.remove("hidden");
    $("#deleteTaskButton").classList.toggle("hidden", !task);
    if (!$("#taskDialog").open) $("#taskDialog").showModal();
    // Switching from details to editing starts a new unsaved-changes baseline.
    dialogInitialFormValues.set($("#taskDialog"), dialogFormSnapshot($("#taskDialog")));
    setTimeout(() => document.getElementById("taskTitleRichEditor")?.focus(), 40);
  }
  function saveTaskFromForm() {
    const id = $("#taskId").value;
    const previous = id ? state.tasks.find(item => item.id === id) : null;
    if (previous && taskIsLocked(previous)) return false;
    const checklist = $("#taskChecklist").value.split("\n").map(item => item.trim()).filter(Boolean);
    // Preserve completed checklist items if the user edits/reorders the checklist.
    const oldItems = previous?.checklist || [];
    const oldDone = previous?.checklistDone || [];
    const matchedOldIndices = new Set();
    const checklistDone = [];
    checklist.forEach((item, index) => {
      const oldIndex = oldItems.findIndex((oldItem, oldIndex) => oldItem === item && !matchedOldIndices.has(oldIndex));
      if (oldIndex < 0) return;
      matchedOldIndices.add(oldIndex);
      if (oldDone.includes(oldIndex)) checklistDone.push(index);
    });
    const payload = {
      title: $("#taskTitle").value.trim(),
      titleHtml: getRichTitleHtml("taskTitle"),
      column: $("#taskColumn").value,
      label: $("#taskLabel").value,
      due: $("#taskDue").value,
      description: $("#taskDescription").value.trim(),
      checklist,
      checklistDone,
      active: $("#taskActive").checked
    };
    if (!payload.title) return false;
    if (payload.column === "done") {
      payload.completedAt = new Date().toISOString();
      payload.archivedAt = null;
      payload.active = false;
    } else {
      payload.completedAt = null;
      payload.archivedAt = null;
    }
    if (payload.active) relevantTasks().forEach(task => { task.active = false; });
    if (previous) Object.assign(previous, payload);
    else state.tasks.push({ id: createId("task"), client: currentAccountName(), ...payload });
    saveState();
    renderKanbans();
    renderRoleSummary();
    showToast(id ? "Taak bijgewerkt." : "Taak toegevoegd.");
    return true;
  }
  function deleteCurrentTask() {
    const id = $("#taskId").value;
    if (!id) return;
    const task = state.tasks.find(item => item.id === id);
    if (!task || taskIsLocked(task)) return;
    state.tasks = state.tasks.filter(item => item.id !== id);
    saveState();
    $("#taskDialog").close();
    renderKanbans();
    renderRoleSummary();
    showToast("Taak verwijderd.");
  }

  const attendanceDepartments = {
    multimedia: { id: "multimedia", label: "Multimedia-begeleiders", icon: "star", accent: "blue" },
    it: { id: "it", label: "IT-begeleiders", icon: "settings", accent: "deep" },
    process: { id: "process", label: "Procesbegeleiders", icon: "heart-handshake", accent: "yellow" }
  };

  function visibleDepartments() {
    const config = roleConfig[state.role] || roleConfig["client-mm"];
    if (config.kind === "client") return [attendanceDepartments.process, attendanceDepartments.multimedia, attendanceDepartments.it];
    return [attendanceDepartments[config.department]].filter(Boolean);
  }

  function guideCardHtml(person, day = currentStaffDay(), part = attendancePart()) {
    const config = roleConfig[state.role] || roleConfig["client-mm"];
    const fixed = config.kind === "client" && person.id === config.fixedProcess;
    // De geplande werktijden bepalen of iemand dit dagdeel aanwezig kan zijn.
    // Een begeleider blijft zichtbaar, ook wanneer die vrij is.
    const present = staffInPart(person, day, part) && person.present;
    const deviation = staffHoursLabel(person, day);
    const hours = deviation ? `<small>${escapeHtml(deviation)}</small>` : "";
    return `<div class="guide-card ${present ? "" : "guide-away"}">
      <div class="person-mini-avatar guide-avatar">${escapeHtml(person.name[0])}</div>
      <div class="guide-copy"><strong>${escapeHtml(person.name)} ${fixed ? '<span class="fixed-guide">★ Vast</span>' : ""}</strong>${hours}</div>
      <span class="presence-pill ${present ? "present" : "away"}">${present ? "Aanwezig" : "Afwezig"}</span>
    </div>`;
  }

  function guideSectionsHtml(compact = false) {
    const day = currentStaffDay();
    const part = attendancePart();
    const guides = data.people.filter(person => person.type === "staff");
    return visibleDepartments().map(department => {
      const members = guides.filter(person => person.department === department.id);
      const presentCount = members.filter(person => staffInPart(person, day, part) && person.present).length;
      return `<section class="attendance-section ${department.accent}">
        <header><div><span class="department-icon">${lucideIcon(department.icon)}</span><h3>${department.label}</h3></div><span>${presentCount} van ${members.length} aanwezig</span></header>
        <div class="guide-list">${members.length ? members.map(person => guideCardHtml(person, day, part)).join("") : '<p class="guidance-no-staff">Geen begeleiders</p>'}</div>
      </section>`;
    }).join("");
  }

  function effectiveClientStatus(person) {
    const role = clientRoleForName(person.name);
    if (!role) return { status: person.status, clockedIn: person.clockedIn };
    const clock = state.clocks[role] || { active: false, startedAt: null };
    return {
      status: clock.active ? "Aanwezig" : "Afwezig",
      clockedIn: clock.active && clock.startedAt ? new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" }).format(new Date(clock.startedAt)) : ""
    };
  }

  function clientLastName(name) { return state.clientLastNames?.[name] || ""; }
  function clientFirstName(name) { return state.clientFirstNames?.[name] || name; }
  function clientFullName(name) { return [clientFirstName(name), clientLastName(name)].filter(Boolean).join(" "); }
  function clientDisplayName(name, full = false) {
    const last = clientLastName(name);
    const first = clientFirstName(name);
    if (!last) return first;
    const sameFirst = data.people.filter(person => person.type === "client" && clientFirstName(person.name).toLowerCase() === first.toLowerCase()).length > 1;
    const lastPart = last.trim().split(/\s+/).pop();
    const initial = lastPart[0].toUpperCase();
    const ambiguous = data.people.filter(person => person.type === "client" && clientFirstName(person.name).toLowerCase() === first.toLowerCase() && clientLastName(person.name).trim().split(/\s+/).pop()?.[0]?.toUpperCase() === initial).length > 1;
    return full || (sameFirst && ambiguous) ? `${first} ${last}` : `${first} ${initial}`;
  }
  let clientProfileEditing = "";
  function updateClientProfileTradeOptions(selected = "") {
    const department = $("#clientProfileDepartment").value;
    const guides = data.people.filter(person => person.type === "staff" && person.department === department);
    $("#clientProfileTrade").innerHTML = `<option value="">Nog niet toegewezen</option>${guides.map(guide => `<option value="${escapeHtml(guide.name)}">${escapeHtml(guide.name)}</option>`).join("")}`;
    $("#clientProfileTrade").value = selected;
  }
  function openClientProfileDialog(name = "") {
    if (currentConfig().kind !== "staff") return;
    clientProfileEditing = name;
    const person = data.people.find(item => item.type === "client" && item.name === name);
    $("#clientProfileDialogTitle").textContent = person ? "Mediëntgegevens aanpassen" : "Nieuwe mediënt";
    $("#clientProfileFirst").value = person ? clientFirstName(person.name) : "";
    $("#clientProfileLast").value = person ? clientLastName(person.name) : "";
    $("#clientProfileDepartment").value = person?.department || "multimedia";
    const processGuides = data.people.filter(item => item.type === "staff" && item.department === "process");
    $("#clientProfileProcess").innerHTML = `<option value="">Nog niet toegewezen</option>${processGuides.map(guide => `<option value="${escapeHtml(guide.name)}">${escapeHtml(guide.name)}</option>`).join("")}`;
    $("#clientProfileProcess").value = person?.processGuide || "";
    updateClientProfileTradeOptions(person?.tradeGuide || "");
    $("#clientProfileDialog").showModal();
  }
  function saveClientProfile() {
    const first = $("#clientProfileFirst").value.trim().replace(/\s+/g, " ");
    const last = $("#clientProfileLast").value.trim().replace(/\s+/g, " ");
    const old = clientProfileEditing;
    const collides = data.people.some(person => person.type === "client" && person.name !== old && clientFirstName(person.name).toLowerCase() === first.toLowerCase());
    const name = collides ? `${first} ${last}` : first;
    const dept = $("#clientProfileDepartment").value;
    const trade = $("#clientProfileTrade").value;
    const process = $("#clientProfileProcess").value;
    if (!name || !last) { showToast("Vul een voor- en achternaam in."); return false; }
    if (data.people.some(person => person.type === "client" && person.name.toLowerCase() === name.toLowerCase() && person.name !== old)) {
      showToast("Er bestaat al een mediënt met exact deze naam."); return false;
    }
    let person = data.people.find(item => item.type === "client" && item.name === old);
    const originalSeedName = person?.seedName || person?.name || "";
    if (!person) {
      person = { name, type: "client", department: dept, status: "Afwezig", clockedIn: "", tradeGuide: trade, processGuide: process, accountId: null };
      data.people.push(person);
      const id = `client-${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
      state.accounts.push({ id, name, kind: "client", department: dept, password: "spectrum", memberSince: prototypeToday() });
      person.accountId = id;
      state.profiles[id] = { email: "", contactPreference: "hub", weekdays: [], linkedRooms: [] };
      state.clocks[id] = { active: false, startedAt: null };
    } else if (name !== old) {
      // Re-key references to the display name across the demo without removing existing records.
      const recursiveRename = (value) => {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) { value.forEach(recursiveRename); return; }
        for (const [key, item] of Object.entries(value)) {
          if (["client", "name"].includes(key) && item === old && (key !== "name" || value.kind === "client" || value.type === "client")) value[key] = name;
          else if (item && typeof item === "object") recursiveRename(item);
        }
      };
      recursiveRename(state);
      data.people.filter(item => item.type === "client" && item.name === old).forEach(item => item.name = name);
      Object.values(roleConfig).forEach(config => { if (Array.isArray(config.caseload)) config.caseload = config.caseload.map(item => item === old ? name : item); });
      if (state.clientLastNames[old]) delete state.clientLastNames[old];
      if (state.clientFirstNames[old]) delete state.clientFirstNames[old];
      if (selectedClientName === old) selectedClientName = name;
    }
    person.name = name;
    person.department = dept;
    person.tradeGuide = trade;
    person.processGuide = process;
    state.clientLastNames[name] = last;
    state.clientFirstNames[name] = first;
    if (originalSeedName) {
      // Persist edits to seeded demo mediënten, which are regenerated on reload.
      person.seedName = originalSeedName;
      state.clientOverrides[originalSeedName] = { name, department: dept, tradeGuide: trade, processGuide: process };
    }
    const account = state.accounts.find(item => item.kind === "client" && item.name === name);
    if (account) { account.department = dept; account.name = name; if (account.id) { accountNames[account.id] = name; if (roleConfig[account.id]) roleConfig[account.id].department = dept; } }
    Object.values(roleConfig).filter(config => config.kind === "staff").forEach(config => {
      config.caseload = (config.caseload || []).filter(item => item !== name);
    });
    state.accounts.filter(item => item.kind === "staff").forEach(staff => {
      if ((staff.department === "process" && staff.name === process) || (staff.department === dept && staff.name === trade)) {
        const config = roleConfig[staff.id];
        if (config) config.caseload = [...new Set([...(config.caseload || []), name])];
      }
    });
    syncAccountsFromState();
    saveState(); renderAccountSelectors(); renderAll();
    if (old) { selectedClientName = name; renderClientDetail(); }
    else openClientDetail(name);
    showToast(old ? "Mediëntgegevens bijgewerkt." : "Nieuwe mediënt aangemaakt.");
    return true;
  }

  function preferredClientListAssignment(name) {
    const entries = state.roomAssignments
      .filter(item => item.client === name)
      .sort((a, b) => {
        const dayDiff = roomDays.findIndex(([day]) => day === a.day) - roomDays.findIndex(([day]) => day === b.day);
        if (dayDiff) return dayDiff;
        const order = { full: 0, morning: 1, afternoon: 2 };
        return (order[a.part] ?? 9) - (order[b.part] ?? 9);
      });
    const block = currentRoomBlock();
    if (block) {
      const current = entries.find(item => item.day === block.day && (item.part === "full" || item.part === block.part));
      if (current) return current;
    }
    return entries[0] || null;
  }

  function clientAssignmentBadge(assignment, department) {
    if (!assignment) return department === "it" ? "IT" : "MM";
    const room = rooms.find(item => item.id === assignment.roomId);
    if (!room) return department === "it" ? "IT" : "MM";
    return `${room.department === "it" ? "IT" : "MM"} ${room.id.split("-")[1]} - ${String(assignment.seat).padStart(2, "0")}`;
  }

  function clientCardAvatarHtml(person) {
    const mood = clientMoodInfo(person.name);
    if (mood) return `<span class="staff-local-avatar has-mood" title="Dagstart: ${escapeHtml(mood.label)}" aria-label="Dagstart: ${escapeHtml(mood.label)}">${mood.emoji}</span>`;
    return `<span class="staff-local-avatar no-mood" title="Nog geen dagstart" aria-label="Nog geen dagstart"><svg class="lucide-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span>`;
  }

  function clientPersonHtml(person) {
    const effective = effectiveClientStatus(person);
    const present = effective.status === "Aanwezig" && Boolean(effective.clockedIn);
    const assignment = preferredClientListAssignment(person.name);
    const workplace = clientAssignmentBadge(assignment, person.department);
    return `<button class="staff-local-client client-row-button client-list-card" data-open-client="${escapeHtml(person.name)}" type="button" aria-label="Open profiel van ${escapeHtml(clientDisplayName(person.name, $("#clientFullNames")?.checked))}">
      ${clientCardAvatarHtml(person)}
      <span class="staff-local-person"><strong title="${escapeHtml(clientFullName(person.name))}">${escapeHtml(clientDisplayName(person.name, $("#clientFullNames")?.checked))}</strong><span class="staff-local-workplace">${escapeHtml(workplace)}</span><small>${present ? `Ingeklokt om ${escapeHtml(effective.clockedIn)}` : "Nog niet ingeklokt"}</small></span>
      <span class="presence-pill staff-local-status ${present ? "present" : "away"}">${present ? "Aanwezig" : "Afwezig"}</span>
    </button>`;
  }

  function renderAttendance() {
    const config = roleConfig[state.role] || roleConfig["client-mm"];
    const staffView = config.kind === "staff";
    $("#clientTools").classList.toggle("hidden", !staffView);

    if (staffView) {
      // Persoonlijke mediëntenwidget is vervangen door de lokaalwidgets.
      // De aparte pagina Mediënten blijft beschikbaar voor zoeken en beheer.
      $("#attendanceList").innerHTML = "";
      $("#fullAttendanceTitle").textContent = "Mediënten";
      renderClientList();
      return;
    }

    $("#attendanceWidgetTitle").textContent = "Begeleiding aanwezig";
    $("#attendanceList").innerHTML = `<div class="attendance-sections attendance-widget-sections">${guideSectionsHtml()}</div>`;
    $("#fullAttendanceTitle").textContent = "Begeleiding vandaag";
    $("#fullAttendanceList").innerHTML = `<div class="attendance-sections inline-sections">${guideSectionsHtml(false)}</div>`;
  }

  function renderClientList() {
    const config = roleConfig[state.role] || roleConfig["staff-mm"];
    if (config.kind !== "staff") return;
    const query = ($("#clientSearch")?.value || "").trim().toLowerCase();
    const filter = $("#clientFilter")?.value || "all";
    let clients = data.people.filter(person => person.type === "client");
    if (!query && filter === "local") {
      const block = currentRoomBlock();
      const names = new Set(linkedStaffRooms().flatMap(room => roomClientsForBlock(room, block).map(entry => entry.client)));
      clients = clients.filter(person => names.has(person.name));
    }
    if (!query && filter === "present") clients = clients.filter(person => effectiveClientStatus(person).status === "Aanwezig");
    if (query) clients = clients.filter(person => clientFullName(person.name).toLowerCase().includes(query));
    $("#fullAttendanceList").innerHTML = clients.length ? clients.map(clientPersonHtml).join("") : '<div class="empty-state"><p>Geen mediënten gevonden.</p></div>';
    $$("[data-open-client]", $("#fullAttendanceList")).forEach(button => button.addEventListener("click", () => openClientDetail(button.dataset.openClient)));
  }

  function clientAssignments(name) {
    return state.roomAssignments
      .filter(item => item.client === name)
      .sort((a, b) => roomDays.findIndex(([day]) => day === a.day) - roomDays.findIndex(([day]) => day === b.day));
  }

  function assignmentForPeriod(entries, part) {
    return entries.find(item => item.part === "full" || item.part === part) || null;
  }
  function schedulePeriodHtml(entries, part, { closed = false } = {}) {
    if (closed) return `<div class="client-schedule-period ${part} closed"><span class="client-schedule-break"><b>Gesloten</b><em>vanaf 12:30</em></span><strong>Vrijdagmiddag</strong><small>Spectrum gesloten</small></div>`;
    const breakTime = part === "morning" ? "10:30–11:00" : "14:30–15:00";
    const breakLabel = `<span class="client-schedule-break"><b>Pauze</b><em>${breakTime}</em></span>`;
    const assignment = assignmentForPeriod(entries, part);
    if (!assignment) return `<div class="client-schedule-period ${part} empty">${breakLabel}<strong>Niet ingepland</strong><small>Geen vaste werkplek</small></div>`;
    const room = rooms.find(item => item.id === assignment.roomId);
    return `<div class="client-schedule-period ${part}">${breakLabel}<strong>${escapeHtml(room?.name || "Lokaal")} · plek ${assignment.seat}</strong>${roomCustomTimeHtml(assignment, part)}</div>`;
  }

  function clientLunchBreakHtml({ closedAfternoon = false } = {}) {
    return closedAfternoon ? "" : '<div class="client-schedule-lunch"><b>Lunchpauze</b><span>12:30–13:00</span></div>';
  }

  function clientScheduleDaysHtml(name, compact = false) {
    const assignments = clientAssignments(name);
    return `<div class="client-schedule-list split-periods ${compact ? "compact" : ""}">${roomDays.map(([day, label]) => {
      const entries = assignments.filter(item => item.day === day);
      const friday = day === "vr";
      return `<section class="client-schedule-day"><strong class="client-schedule-day-label">${label}</strong><div class="client-schedule-periods">${schedulePeriodHtml(entries, "morning")}${clientLunchBreakHtml({ closedAfternoon: friday })}${schedulePeriodHtml(entries, "afternoon", { closed: friday })}</div></section>`;
    }).join("")}</div>`;
  }

  function clientAgendaItems(name) {
    const owner = clientRoleForName(name);
    return state.agendaItems
      .filter(item => item.client === name || (owner && item.owner === owner))
      .sort((a, b) => agendaStartDate(a) - agendaStartDate(b));
  }

  function assignedGuideName(person, department) {
    const match = Object.entries(roleConfig).find(([role, config]) =>
      config.kind === "staff" && config.department === department && (config.caseload || []).includes(person.name) && accountNames[role]
    );
    return match ? accountNames[match[0]] : "Nog niet toegewezen";
  }

  function clientDetailPermissions(person) {
    const config = currentConfig();
    const ownCaseload = (config.caseload || []).includes(person.name);
    return {
      ownCaseload,
      work: config.kind === "staff",
      diary: config.kind === "staff"
    };
  }

  function clientPlanningSummaryHtml(name, compact = false) {
    const assignments = clientAssignments(name);
    if (!assignments.length) return emptyAgendaHtml("Nog geen vaste Spectrum-dagen of werkplek ingepland.");
    return clientScheduleDaysHtml(name, compact);
  }

  function clientTaskListHtml(person, permissions) {
    const tasks = state.tasks.filter(task => task.client === person.name);
    return tasks.length ? `<div class="client-record-list">${tasks.map(task => `<article class="client-record-row"><span class="record-status ${task.column}">${escapeHtml(columnNames[task.column] || task.column)}</span><div><strong>${richTitleHtml(task)}</strong><div class="client-record-description rich-text-content">${richTextHtml(task.description || "Geen omschrijving")}</div><small>${formatDate(task.due)}</small></div>${task.active ? '<span class="active-task-badge">Hier werkt deze mediënt nu aan</span>' : ""}</article>`).join("")}</div>` : emptyAgendaHtml("Voor deze mediënt staan nog geen taken in het concept.");
  }

  function clientDiaryListHtml(person, permissions, limit = null) {
    let entries = state.diary.filter(entry => entry.client === person.name).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (limit) entries = entries.slice(0, limit);
    return entries.length ? `<div class="client-diary-list">${entries.map(entry => `<article><time>${formatDateTime(entry.date)}</time><div class="rich-text-content">${richTextHtml(entry.text)}</div>${moodPairHtml(entry.moodStart, entry.moodEnd)}</article>`).join("")}</div>` : emptyAgendaHtml("Er zijn nog geen dagverslagen voor deze mediënt.");
  }

  function clientMemberSince(name) {
    return state.accounts.find(account => account.kind === "client" && account.name === name)?.memberSince
      || state.dailyMood.filter(item => item.client === name).map(item => item.date).sort()[0]
      || prototypeToday();
  }
  function moodRangeStart(range, name) {
    const end = parseDateOnly(prototypeToday());
    if (range === "all") return parseDateOnly(clientMemberSince(name));
    const days = { week: 6, month: 29, quarter: 89, year: 364 }[range] ?? 6;
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    return start;
  }
  function moodBucketKey(date, range) {
    if (range === "week" || range === "month") return dateToIso(date);
    if (range === "quarter") {
      const monday = new Date(date);
      const day = (monday.getDay() + 6) % 7;
      monday.setDate(monday.getDate() - day);
      return dateToIso(monday);
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  function moodBucketLabel(key, range) {
    if (range === "week" || range === "month") return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(parseDateOnly(key));
    if (range === "quarter") return `wk ${new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(parseDateOnly(key))}`;
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("nl-NL", { month: "short", year: range === "all" ? "numeric" : undefined }).format(new Date(year, month - 1, 1));
  }
  function clientMoodSeries(name, range) {
    const start = moodRangeStart(range, name);
    const end = parseDateOnly(prototypeToday());
    const records = state.dailyMood
      .filter(item => item.client === name && parseDateOnly(item.date) >= start && parseDateOnly(item.date) <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
    const buckets = new Map();
    records.forEach(record => {
      const key = moodBucketKey(parseDateOnly(record.date), range);
      if (!buckets.has(key)) buckets.set(key, { key, start: [], end: [] });
      if (record.start) buckets.get(key).start.push(Number(record.start));
      if (record.end) buckets.get(key).end.push(Number(record.end));
    });
    return [...buckets.values()].map(bucket => ({
      key: bucket.key,
      label: moodBucketLabel(bucket.key, range),
      start: bucket.start.length ? bucket.start.reduce((a, b) => a + b, 0) / bucket.start.length : null,
      end: bucket.end.length ? bucket.end.reduce((a, b) => a + b, 0) / bucket.end.length : null
    }));
  }
  function moodChartHtml(name, range = clientMoodChartRange) {
    const points = clientMoodSeries(name, range);
    const ranges = [["week", "Week"], ["month", "Maand"], ["quarter", "Kwartaal"], ["year", "Jaar"], ["all", "Vanaf start"]];
    const controls = `<div class="mood-chart-controls"><div class="mood-chart-ranges">${ranges.map(([id, label]) => `<button type="button" class="${id === range ? "active" : ""}" data-mood-chart-range="${id}">${label}</button>`).join("")}</div><div class="mood-chart-legend" role="group" aria-label="Zichtbare stemmingsmomenten">${[["start", "Dagstart"], ["end", "Dageinde"]].map(([kind, label]) => `<label class="mood-chart-toggle ${kind}"><input type="checkbox" data-mood-chart-toggle="${kind}" ${clientMoodChartVisible[kind] ? "checked" : ""} ${clientMoodChartVisible[kind] && !clientMoodChartVisible[kind === "start" ? "end" : "start"] ? "disabled" : ""}><span>${label}</span></label>`).join("")}</div></div>`;
    if (!points.length || !points.some(point => point.start != null || point.end != null)) return `${controls}<div class="mood-chart-empty">Nog geen stemmingsregistraties in deze periode.</div>`;
    const width = 1400, height = 210, left = 60, right = 28, top = 14, bottom = 34;
    const plotW = width-left-right, plotH=height-top-bottom;
    const x=index=>left+(points.length===1?plotW/2:(index/(points.length-1))*plotW);
    const y=value=>top+((5-value)/4)*plotH;
    const makePath=key=>{ let path="",open=false; points.forEach((point,index)=>{ const value=point[key]; if(value==null){open=false;return;} path+=`${open?" L":"M"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`; open=true; }); return path; };
    const startPath=clientMoodChartVisible.start ? makePath("start") : "";
    const endPath=clientMoodChartVisible.end ? makePath("end") : "";
    const circles=points.map((point,index)=>["start", "end"].map(kind => {
      const value = point[kind];
      if (value == null || !clientMoodChartVisible[kind]) return "";
      const moment = kind === "start" ? "Dagstart" : "Dageinde";
      const score = Math.round(value);
      const description = moodOptions[score]?.label || "";
      return `<circle class="mood-point-${kind}" cx="${x(index).toFixed(1)}" cy="${y(value).toFixed(1)}" r="4.5"><title>${escapeHtml(point.label)} · ${moment}: ${value.toFixed(1)} / 5 (${escapeHtml(description)})</title></circle>`;
    }).join("")).join("");
    const labelIndexes=[0,Math.floor((points.length-1)/2),points.length-1].filter((value,index,array)=>array.indexOf(value)===index);
    const xLabels=labelIndexes.map(index=>`<text x="${x(index).toFixed(1)}" y="${height-12}" text-anchor="middle">${escapeHtml(points[index].label)}</text>`).join("");
    const yLabels=[5,4,3,2,1].map(value=>`<text x="28" y="${(y(value)+5).toFixed(1)}" text-anchor="middle">${moodOptions[value].emoji}</text><line x1="${left}" x2="${width-right}" y1="${y(value).toFixed(1)}" y2="${y(value).toFixed(1)}" />`).join("");
    return `${controls}<div class="mood-chart-scroll"><svg class="mood-history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Stemmingstrend van ${escapeHtml(name)}: ${clientMoodChartVisible.start && clientMoodChartVisible.end ? "dagstart en dageinde" : clientMoodChartVisible.start ? "dagstart" : "dageinde"}"><g class="mood-grid">${yLabels}${xLabels}</g><path class="mood-line mood-line-start" d="${startPath}"/><path class="mood-line mood-line-end" d="${endPath}"/>${circles}</svg></div>`;
  }

  function clientOverviewHtml(person, permissions) {
    const tasks = state.tasks.filter(task => task.client === person.name);
    const activeTask = tasks.find(task => task.active);
    const nextAppointment = clientAgendaItems(person.name).find(item => item.responseStatus !== "declined" && agendaStartDate(item) > prototypeNow());
    const tradeDepartment = person.department === "it" ? "it" : "multimedia";
    const tradeGuide = person.tradeGuide || assignedGuideName(person, tradeDepartment);
    const processGuide = person.processGuide || assignedGuideName(person, "process");
    const todayMood = moodRecordFor(person.name);
    const startMood = todayMood?.start ? moodOptions[todayMood.start] : null;
    const endMood = todayMood?.end ? moodOptions[todayMood.end] : null;
    return `<div class="client-overview-grid">
      <article class="panel client-overview-card"><p class="eyebrow">Begeleiding</p><h2>Vaste aanspreekpunten</h2><dl class="client-overview-facts"><div><dt>Vakbegeleider</dt><dd>${escapeHtml(tradeGuide)}</dd></div><div><dt>Procesbegeleider</dt><dd>${escapeHtml(processGuide)}</dd></div></dl></article>
      <article class="panel client-overview-card"><p class="eyebrow">Stemming vandaag</p><h2>Begin en einde van de dag</h2><div class="mood-today-moments"><div><small>Dagstart</small>${startMood ? `<div class="client-detail-mood"><span>${startMood.emoji}</span><strong>${escapeHtml(startMood.label)}</strong></div>` : `<p class="muted-copy">Nog niet ingevuld</p>`}</div><div><small>Dageinde</small>${endMood ? `<div class="client-detail-mood"><span>${endMood.emoji}</span><strong>${escapeHtml(endMood.label)}</strong></div>` : `<p class="muted-copy">Nog niet ingevuld</p>`}</div></div></article>
      <article class="panel client-overview-card client-overview-wide mood-history-card"><div class="panel-heading-row"><div><p class="eyebrow">Stemmingstrend</p><h2>Hoe gaat het over tijd?</h2></div><small>Dagstart en dageinde</small></div>${moodChartHtml(person.name)}</article>
      <article class="panel client-overview-card"><p class="eyebrow">Nu</p><h2>Actieve taak</h2>${activeTask ? `<div class="detail-highlight"><strong>${richTitleHtml(activeTask)}</strong><div class="rich-text-content">${richTextHtml(activeTask.description || columnNames[activeTask.column])}</div></div>` : `<p class="muted-copy">Geen actieve taak gekozen.</p>`}</article>
      <article class="panel client-overview-card"><p class="eyebrow">Agenda</p><h2>Volgende afspraak</h2>${nextAppointment ? `<div class="detail-highlight"><strong>${richTitleHtml(nextAppointment)}</strong><span>${escapeHtml(agendaRelativeLabel(nextAppointment))}</span>${nextAppointment.createdBy ? `<small>Ingepland door ${escapeHtml(nextAppointment.createdBy)}${nextAppointment.requiresResponse ? ` · ${appointmentResponseLabel(nextAppointment.responseStatus || "pending")}` : ""}</small>` : ""}</div>` : `<p class="muted-copy">Geen volgende afspraak gepland.</p>`}</article>
      <article class="panel client-overview-card client-overview-wide"><p class="eyebrow">Vaste week</p><h2>Werkplek en dagen</h2>${clientPlanningSummaryHtml(person.name, true)}</article>
      <article class="panel client-overview-card client-overview-wide"><div class="panel-heading-row"><div><p class="eyebrow">Terugkijken</p><h2>Laatste dagverslag</h2></div><button class="text-button" type="button" data-client-detail-jump="diary">Alle verslagen →</button></div>${clientDiaryListHtml(person, permissions, 1)}</article>
    </div>`;
  }

  function renderClientDetail() {
    if (currentConfig().kind !== "staff" || !selectedClientName) return;
    const person = data.people.find(item => item.type === "client" && item.name === selectedClientName);
    if (!person) return;
    const status = effectiveClientStatus(person);
    const permissions = clientDetailPermissions(person);
    const assignments = clientAssignments(person.name);
    const nextAssignment = assignments[0];
    const nextRoom = rooms.find(item => item.id === nextAssignment?.roomId);
    $("#clientDetailTitle").textContent = clientFullName(person.name);
    $("#clientDetailName").textContent = clientFullName(person.name);
    $("#clientDetailAvatar").textContent = person.name[0];
    $("#clientDetailDepartment").textContent = person.department === "it" ? "IT-mediënt" : "Multimedia-mediënt";
    $("#clientDetailSubtitle").textContent = permissions.ownCaseload ? "Mediëntgegevens" : "Mediëntgegevens";
    const detailMood = clientMoodInfo(person.name);
    $("#clientDetailFacts").innerHTML = `<div><span>Aanwezigheid</span><strong>${escapeHtml(status.status)}</strong><small>${status.status === "Aanwezig" ? `Ingeklokt om ${escapeHtml(status.clockedIn)}` : "Vandaag niet ingeklokt"}</small></div><div><span>Dagstart</span><strong class="detail-mood-value">${detailMood ? detailMood.emoji : "—"}</strong><small>${detailMood ? escapeHtml(detailMood.label) : "Nog niet ingevuld"}</small></div><div><span>Vaste dagen</span><strong>${new Set(assignments.map(item => item.day)).size}</strong><small>dagen per week</small></div><div><span>Werkplek</span><strong>${escapeHtml(nextRoom?.name || "Niet gepland")}</strong><small>${nextAssignment ? `Plek ${nextAssignment.seat}` : "Nog toe te wijzen"}</small></div>`;
    $("#clientDetailAccessNote").classList.add("hidden");
    $("#clientDetailAccessNote").textContent = "";
    $$("[data-client-detail-tab]").forEach(button => button.classList.toggle("active", button.dataset.clientDetailTab === selectedClientDetailTab));
    const content = $("#clientDetailContent");
    if (selectedClientDetailTab === "tasks") content.innerHTML = `<article class="panel client-detail-section"><div class="section-heading"><p class="eyebrow">Werk</p><h2>Taken en voortgang</h2><p>Een rustig overzicht van lopende, actieve en afgeronde taken.</p></div>${clientTaskListHtml(person, permissions)}</article>`;
    else if (selectedClientDetailTab === "diary") content.innerHTML = `<article class="panel client-detail-section"><div class="section-heading"><p class="eyebrow">Terugkijken</p><h2>Dagverslagen</h2><p>Recente verslagen van deze mediënt.</p></div>${clientDiaryListHtml(person, permissions)}</article>`;
    else if (selectedClientDetailTab === "roster") content.innerHTML = `<article class="panel client-detail-section"><div class="panel-heading-row"><div class="section-heading"><p class="eyebrow">Vast rooster</p><h2>Dagen en werkplekken</h2><p>Dit is exact dezelfde weekindeling als op de Rooster-pagina. Wijzigingen op één plek zijn direct op de andere zichtbaar.</p></div><button class="primary-button" type="button" data-edit-client-planning>Rooster aanpassen</button></div>${clientPlanningSummaryHtml(person.name)}</article>`;
    else if (selectedClientDetailTab === "goals") content.innerHTML = `<article class="panel client-detail-section client-detail-goals"><div class="panel-heading-row"><div class="section-heading"><p class="eyebrow">Ontwikkeling</p><h2>Doelen</h2><p>Persoonlijke doelen en sprintdoelen van ${escapeHtml(clientDisplayName(person.name))}.</p></div><button class="primary-button" type="button" data-add-client-goal>+ Doel toevoegen</button></div><div class="client-detail-goals-grid"><section class="client-detail-goal-column personal"><div class="goals-column-heading"><div><p class="eyebrow">Persoonlijk</p><h3>Persoonlijke doelen</h3></div></div>${goalCardsHtml(person.name, "personal")}</section><section class="client-detail-goal-column sprint"><div class="goals-column-heading"><div><p class="eyebrow">Sprint</p><h3>Sprintdoelen</h3></div></div>${goalCardsHtml(person.name, "sprint")}</section></div></article>`;
    else content.innerHTML = clientOverviewHtml(person, permissions);
    $$("[data-edit-goal]", content).forEach(button => button.addEventListener("click", () => openGoalDialog(button.dataset.editGoal)));
    $$("[data-add-client-goal]", content).forEach(button => button.addEventListener("click", () => openGoalDialog(null, "personal", person.name)));
    $$("[data-client-detail-jump]", content).forEach(button => button.addEventListener("click", () => { selectedClientDetailTab = button.dataset.clientDetailJump; renderClientDetail(); }));
    $$("[data-edit-client-planning]", content).forEach(button => button.addEventListener("click", () => openClientPlanning(person.name)));
    $$("[data-mood-chart-range]", content).forEach(button => button.addEventListener("click", () => {
      clientMoodChartRange = button.dataset.moodChartRange;
      renderClientDetail();
    }));
    $$("[data-mood-chart-toggle]", content).forEach(input => input.addEventListener("change", () => {
      const kind = input.dataset.moodChartToggle;
      if (kind !== "start" && kind !== "end") return;
      const other = kind === "start" ? "end" : "start";
      if (!input.checked && !clientMoodChartVisible[other]) { input.checked = true; return; }
      clientMoodChartVisible[kind] = input.checked;
      renderClientDetail();
    }));
  }

  function deleteClientProfile(name) {
    if (currentConfig().kind !== "staff") return;
    if (!window.confirm(`Mediëntprofiel van ${clientDisplayName(name)} verwijderen? Dit verwijdert ook het account, rooster, taken en dagverslagen uit deze demo.`)) return;
    const account=state.accounts.find(item=>item.kind === "client" && item.name === name);
    const accountId=account?.id || null;
    if (accountId) {
      state.accounts=state.accounts.filter(item=>item.id!==accountId);
      delete state.profiles[accountId]; delete state.clocks[accountId];
      state.agendaItems=state.agendaItems.filter(item=>item.owner!==accountId);
      state.messageRead=state.messageRead.filter(key=>!key.startsWith(`${accountId}:`));
      Object.keys(state.eventResponses||{}).filter(key=>key.startsWith(`${accountId}:`)).forEach(key=>delete state.eventResponses[key]);
      delete accountNames[accountId];
    }
    if (state.clientLastNames) delete state.clientLastNames[name];
    if (state.clientFirstNames) delete state.clientFirstNames[name];
    if (state.clientOverrides) {
      const client = data.people.find(person => person.type === "client" && person.name === name);
      if (client?.seedName) state.clientOverrides[client.seedName] = { removed: true, name: client.seedName };
    }
    state.roomAssignments=state.roomAssignments.filter(item=>item.client!==name);
    state.tasks=state.tasks.filter(item=>item.client!==name);
    state.diary=state.diary.filter(item=>item.client!==name);
    Object.values(roleConfig).forEach(config=>{ if(Array.isArray(config.caseload)) config.caseload=config.caseload.filter(client=>client!==name); });
    for(let i=data.people.length-1;i>=0;i-=1){ const person=data.people[i]; if(person.type === "client" && person.name === name) data.people.splice(i,1); }
    selectedClientName=null; selectedClientDetailTab="overview";
    saveState(); renderAccountSelectors(); renderAll(); setPage("clock"); showToast(`${name} is verwijderd.`);
  }

  function openClientDetail(name) {
    if (currentConfig().kind !== "staff") return;
    const person = data.people.find(item => item.type === "client" && item.name === name);
    if (!person) return;
    selectedClientName = name;
    selectedClientDetailTab = "overview";
    renderClientDetail();
    setPage("client-detail");
  }

  function openClientPlanning(name) {
    if (currentConfig().kind !== "staff") return;
    const person = data.people.find(item => item.type === "client" && item.name === name);
    if (!person) return;
    $("#clientPlanningName").value = name;
    $("#clientPlanningTitle").textContent = clientFullName(name);
    $("#clientPlanningDepartment").textContent = person.department === "it" ? "IT-mediënt" : "Multimedia-mediënt";
    $("#clientPlanningConflict").classList.add("hidden");
    const preferredDepartment = person.department === "it" ? "it" : "multimedia";
    const defaultRoom = rooms.find(item => item.department === preferredDepartment);
    $("#clientPlanningDays").innerHTML = roomDays.map(([day, label]) => {
      const entries = state.roomAssignments.filter(item => item.client === name && item.day === day);
      const slot = part => {
        const closed = day === "vr" && part === "afternoon";
        const assignment = assignmentForPeriod(entries, part);
        const room = rooms.find(item => item.id === assignment?.roomId) || defaultRoom;
        const partLabel = part === "morning" ? "Ochtend" : "Middag";
        if (closed) return "";
        return `<section class="client-planning-slot ${part} ${assignment ? "enabled" : ""}" data-client-planning-slot data-client-planning-day="${day}" data-client-planning-part="${part}">
          <label class="client-day-toggle"><input type="checkbox" ${assignment ? "checked" : ""}/><span><strong>${partLabel}</strong><small>${assignment ? `${room?.name || "Lokaal"} · plek ${assignment.seat}` : "Niet ingepland"}</small></span></label>
          <div class="client-day-fields"><label>Lokaal<select data-client-room>${rooms.map(item => `<option value="${item.id}" ${item.id === room?.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label><label>Plek<select data-client-seat>${Array.from({ length: room?.seats || 8 }, (_, index) => `<option value="${index + 1}" ${index + 1 === (assignment?.seat || 1) ? "selected" : ""}>Plek ${index + 1}</option>`).join("")}</select></label><label>Start<input type="time" data-client-start-time value="${escapeHtml(assignment?.startTime || "")}" /></label><label>Einde<input type="time" data-client-end-time value="${escapeHtml(assignment?.endTime || "")}" /></label></div>
        </section>`;
      };
      return `<section class="client-planning-day split-day" data-client-planning-day-wrapper="${day}"><header><strong>${label}</strong></header><div class="client-planning-period-grid">${slot("morning")}${slot("afternoon")}</div></section>`;
    }).join("");
    $$('[data-client-planning-slot]').forEach(row => {
      const checkbox = $('input[type=checkbox]', row);
      checkbox.addEventListener("change", () => row.classList.toggle("enabled", checkbox.checked));
      $('[data-client-room]', row).addEventListener("change", event => {
        const room = rooms.find(item => item.id === event.target.value);
        const seat = $('[data-client-seat]', row);
        seat.innerHTML = Array.from({ length: room.seats }, (_, index) => `<option value="${index + 1}">Plek ${index + 1}</option>`).join("");
      });
    });
    $("#clientPlanningDialog").showModal();
  }

  function saveClientPlanning() {
    const name = $("#clientPlanningName").value;
    const oldIds = new Set(state.roomAssignments.filter(item => item.client === name).map(item => item.id));
    const raw = $$('[data-client-planning-slot]').filter(row => $('input[type=checkbox]', row).checked).map(row => ({
      id: createId("room"), client: name, day: row.dataset.clientPlanningDay, part: row.dataset.clientPlanningPart,
      roomId: $('[data-client-room]', row).value, seat: Number($('[data-client-seat]', row).value),
      startTime: $('[data-client-start-time]', row)?.value || "", endTime: $('[data-client-end-time]', row)?.value || ""
    }));
    const planned = [];
    roomDays.forEach(([day]) => {
      const morning = raw.find(item => item.day === day && item.part === "morning");
      const afternoon = raw.find(item => item.day === day && item.part === "afternoon");
      if (morning && afternoon && morning.roomId === afternoon.roomId && morning.seat === afternoon.seat) {
        planned.push({ ...morning, id:createId("room"), part:"full" });
      } else {
        if (morning) planned.push(morning);
        if (afternoon) planned.push(afternoon);
      }
    });
    const conflict = planned.find(item => state.roomAssignments.some(existing => !oldIds.has(existing.id) && existing.day === item.day && existing.roomId === item.roomId && existing.seat === item.seat && partsOverlap(existing.part, item.part)));
    const reservationConflict = planned.find(item => roomReservationOverlaps(item.roomId, item.day, item.part, item.seat));
    if (conflict || reservationConflict) {
      const problem = conflict || reservationConflict;
      const room = rooms.find(item => item.id === problem.roomId);
      $("#clientPlanningConflict").textContent = `${room?.name || "Deze werkplek"}, plek ${problem.seat} is op ${roomDays.find(([d]) => d === problem.day)?.[1].toLowerCase()} tijdens ${roomPartLabel(problem.part).toLowerCase()} al bezet of gereserveerd.`;
      $("#clientPlanningConflict").classList.remove("hidden");
      return false;
    }
    state.roomAssignments = state.roomAssignments.filter(item => item.client !== name).concat(planned);
    syncClientWeekdaysFromAssignments(name);
    state.roomAudit.unshift({ id:createId("log"), at:new Date().toISOString(), staff:currentAccountName(), text:`Vast rooster van ${clientDisplayName(name)} bijgewerkt` });
    saveState(); renderClientList(); renderRoomSchedule(); renderStaffDashboard(); renderProfile();
    if (currentPage === "client-detail" && selectedClientName === name) renderClientDetail();
    showToast(`Rooster van ${clientDisplayName(name)} opgeslagen.`);
    return true;
  }

  // Publication state is shared by staff filters and the dashboard. Do not delete expired records.
  function messagePublicationStatus(message, now = prototypeNow()) {
    if (new Date(message.publishedAt) > now) return "scheduled";
    if (message.publishUntil && new Date(message.publishUntil) <= now) return "expired";
    return "active";
  }
  let nextMessagePublicationChange = Infinity;
  function relevantMessages() {
    const config = currentConfig();
    return [...state.messages]
      .filter(message => config.kind === "staff" || ((message.audience === "all" || message.audience === config.department)
        && messagePublicationStatus(message) === "active"))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }
  // Een evenement is een type mededeling, maar heeft een eigen reactie per mediënt.
  function eventResponseKey(id) { return `${state.role}:${id}`; }
  function eventResponseFor(message) {
    if (!message) return null;
    const existing = state.eventResponses?.[eventResponseKey(message.id)];
    if (existing && ["yes", "maybe", "no"].includes(existing.status)) return existing;
    // Aanmeldingen uit de voorgaande v2.4-versie blijven geldig.
    return eventAttendees(message).includes(state.role) ? { status: "yes", legacy: true } : null;
  }
  function eventReminderPending(message) {
    const response = eventResponseFor(message);
    return isEventAnnouncement(message) && response?.status === "maybe"
      && response.remindOn && response.remindOn <= prototypeToday()
      && eventIsUpcoming(message);
  }
  function eventReminderMessages() {
    if (currentConfig().kind !== "client") return [];
    return state.messages.filter(message => isEventAnnouncement(message)
      && (message.audience === "all" || message.audience === currentConfig().department)
      && eventReminderPending(message));
  }
  function eventResponseSummary(message) {
    const responses = new Map();
    eventAttendees(message).forEach(id => responses.set(id, "yes"));
    Object.entries(state.eventResponses || {}).forEach(([key, response]) => {
      const separator = key.lastIndexOf(":");
      if (separator < 0 || key.slice(separator + 1) !== message.id) return;
      responses.set(key.slice(0, separator), response.status);
    });
    return [...responses].filter(([, status]) => ["yes", "maybe", "no"].includes(status)).map(([id, status]) => ({
      name: state.accounts.find(person => person.id === id)?.name || "Onbekende mediënt", status
    }));
  }
  function messageAudienceLabel(audience) { return audience === "all" ? "Iedereen" : audience === "it" ? "IT" : "Multimedia"; }
  function formatMessageDate(value) {
    return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }
  function formatMessagePopupDateTime(value) {
    return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }
  function isEventAnnouncement(message) { return message?.kind === "event"; }
  function eventAttendees(message) { return [...new Set(Array.isArray(message?.attendees) ? message.attendees.filter(id => typeof id === "string") : [])]; }
  function eventAttendeeNames(message) {
    return eventAttendees(message).map(id => state.accounts.find(person => person.id === id)?.name || "Onbekende mediënt");
  }
  function announcementKindField(stem) {
    return document.querySelector(`input[name="${stem}Kind"]:checked`)?.value === "event" ? "event" : "message";
  }
  function setAnnouncementKind(stem, kind) {
    const kindValue = kind === "event" ? "event" : "message";
    const radio = document.querySelector(`input[name="${stem}Kind"][value="${kindValue}"]`);
    if (radio) radio.checked = true;
    const isEditing = stem === "manageMessage" && Boolean($("#manageMessageId")?.value);
    const heading = stem === "communication" ? $("#communicationDialogTitle") : $("#messageManageTitle");
    if (heading) heading.textContent = `${isEditing ? (kindValue === "event" ? "Evenement bewerken" : "Mededeling bewerken") : (kindValue === "event" ? "Nieuw evenement" : "Nieuwe mededeling")}`;
    $(`#${stem}EventDetails`)?.classList.toggle("hidden", kindValue !== "event");
    const date = $(`#${stem}EventAt`);
    if (date) date.required = kindValue === "event";
  }
  function eventAnnouncementDetails(message, staffView = false) {
    if (!isEventAnnouncement(message)) return "";
    const at = message.eventAt && !Number.isNaN(new Date(message.eventAt).getTime())
      ? formatMessagePopupDateTime(message.eventAt) : "Datum nog niet bekend";
    const location = message.eventLocation ? `<span>${lucideIcon("map-pin")} ${escapeHtml(message.eventLocation)}</span>` : "";
    // Begeleiding ziet alleen daadwerkelijke aanmeldingen; de andere reacties zijn privé.
    const attendees = eventResponseSummary(message).filter(reply => reply.status === "yes");
    const response = eventResponseFor(message);
    const statusLabels = { yes: "Ik ben erbij", maybe: "Ik weet het nog niet", no: "Geen interesse" };
    const signups = staffView
      ? `<div class="announcement-attendees">${attendees.length ? `<strong>${attendees.length} aangemeld</strong><span>${escapeHtml(attendees.map(item => item.name).join(" · "))}</span>` : "<strong>Nog geen aanmeldingen</strong>"}</div>`
      : `<div class="announcement-attendees">${attendees.length ? `${attendees.length} ${attendees.length === 1 ? "persoon aangemeld" : "personen aangemeld"}` : "Nog geen aanmeldingen"}${response ? ` · Jouw reactie: ${statusLabels[response.status]}` : ""}</div>`;
    const canRespond = !staffView && currentConfig().kind === "client" && eventIsUpcoming(message)
      && (messagePublicationStatus(message) === "active" || Boolean(response));
    const actions = !staffView && currentConfig().kind === "client"
      ? (canRespond ? `<div class="announcement-response-options" role="group" aria-label="Reageren op evenement">
        <button type="button" class="${response?.status === "yes" ? "primary-button selected" : "secondary-button"}" data-event-response="yes" data-event-id="${escapeHtml(message.id)}" aria-pressed="${response?.status === "yes"}">Ik ben erbij</button>
        <button type="button" class="${response?.status === "maybe" ? "primary-button selected" : "secondary-button"}" data-event-response="maybe" data-event-id="${escapeHtml(message.id)}" aria-pressed="${response?.status === "maybe"}">Ik weet het nog niet</button>
        <button type="button" class="${response?.status === "no" ? "primary-button selected" : "secondary-button"}" data-event-response="no" data-event-id="${escapeHtml(message.id)}" aria-pressed="${response?.status === "no"}">Geen interesse</button>
      </div>` : '<span class="announcement-event-ended">Reageren gesloten</span>') : "";
    return `<div class="announcement-event-info"><div class="announcement-event-heading">Evenement</div><div class="announcement-event-facts"><span>${lucideIcon("calendar-days")} ${escapeHtml(at)}</span>${location}</div>${signups}${actions}</div>`;
  }
  function respondToAnnouncementEvent(messageId, status) {
    if (currentConfig().kind !== "client" || !["yes", "maybe", "no"].includes(status)) return;
    const message = state.messages.find(item => item.id === messageId);
    const previous = eventResponseFor(message);
    if (!isEventAnnouncement(message) || !eventIsUpcoming(message)
      || (messagePublicationStatus(message) !== "active" && !previous)) {
      showToast("Reageren op dit evenement is niet meer mogelijk.");
      return;
    }
    const tomorrow = parseDateOnly(prototypeToday());
    tomorrow.setDate(tomorrow.getDate() + 1);
    state.eventResponses[eventResponseKey(messageId)] = {
      status, respondedAt: new Date().toISOString(),
      remindOn: status === "maybe" ? dateToIso(tomorrow) : ""
    };
    // Houd de aanmeldingen van oudere releases compatibel met deze keuzemogelijkheden.
    message.attendees = eventAttendees(message).filter(id => id !== state.role);
    if (status === "yes") message.attendees.push(state.role);
    const readKey = messageReadKey(messageId);
    if (!state.messageRead.includes(readKey)) state.messageRead.push(readKey);
    saveState();
    renderMessages(); renderAgenda(); renderRoleSummary(); renderNotifications();
    const popup = $("#loginMessageDialog");
    if (popup?.open && popup.dataset.itemId === messageId) {
      // De volgende openstaande mededeling wordt getoond; nooit de huidige als gelezen laten terugkomen.
      showLoginMessagePopup();
    }
    const text = status === "yes" ? "Je bent erbij! Het evenement staat in je agenda."
      : status === "maybe" ? "Je krijgt morgen een nieuwe melding om te beslissen."
      : "Geen interesse opgeslagen. Je vindt het evenement terug bij Gelezen.";
    showToast(text);
  }
  function eventIsUpcoming(message) {
    return Boolean(message?.eventAt && new Date(message.eventAt).getTime() > prototypeNow().getTime());
  }
  function bindEventResponseActions(root = document) {
    $$('[data-event-response]', root).forEach(button => button.addEventListener("click", () =>
      respondToAnnouncementEvent(button.dataset.eventId, button.dataset.eventResponse)));
  }
  function readAnnouncementEventFields(stem, existing = null) {
    const kind = announcementKindField(stem);
    return {
      kind,
      eventAt: kind === "event" ? $(`#${stem}EventAt`).value : "",
      eventLocation: kind === "event" ? $(`#${stem}EventLocation`).value.trim() : "",
      attendees: eventAttendees(existing)
    };
  }
  function validateAnnouncementEvent(message) {
    if (!isEventAnnouncement(message)) return true;
    if (!message.eventAt || Number.isNaN(new Date(message.eventAt).getTime())) {
      showToast("Vul een geldige datum en tijd voor het evenement in.");
      return false;
    }
    return true;
  }
  function showExistingEventSignups(stem, message = null) {
    const target = $(`#${stem}EventSignups`);
    if (!target) return;
    const attendees = message ? eventResponseSummary(message).filter(reply => reply.status === "yes") : [];
    target.classList.toggle("hidden", !message || !isEventAnnouncement(message));
    target.textContent = attendees.length
      ? `Aangemeld (${attendees.length}): ${attendees.map(item => item.name).join(" · ")}`
      : "Nog geen aanmeldingen.";
  }

  function messageCardHtml(message, staffView = false) {
    const publicationStatus = messagePublicationStatus(message);
    const statusLabel = { scheduled: "Gepland", expired: "Verlopen", active: "Gepubliceerd" }[publicationStatus];
    return `<article class="message-card ${!staffView && messageIsRead(message.id) ? "message-read" : ""}"><div class="message-meta">${formatMessageDate(message.publishedAt)} · ${messageAudienceLabel(message.audience)}${staffView ? ` · ${statusLabel}` : ""}</div><h2>${richTitleHtml(message)}</h2><div class="rich-text-content">${richTextHtml(message.text)}</div>${eventAnnouncementDetails(message, staffView)}${staffView ? `<button class="secondary-button" data-manage-message="${message.id}">Bewerken</button>` : `<button class="text-button" data-toggle-read="${message.id}">${messageIsRead(message.id) ? "Markeer als ongelezen" : "Markeer als gelezen"}</button>`}</article>`;
  }

  function renderMessages() {
    const staffView = currentConfig().kind === "staff";
    const relevant = relevantMessages();
    // Plan de eerstvolgende statuswisseling, ook wanneer de pagina open blijft staan.
    const nowMs = prototypeNow().getTime();
    const statusTimes = state.messages.flatMap(message => [message.publishedAt, message.publishUntil]
      .filter(Boolean).map(value => new Date(value).getTime()).filter(time => Number.isFinite(time) && time > nowMs));
    nextMessagePublicationChange = statusTimes.length ? Math.min(...statusTimes) : Infinity;
    // Geen interesse: niet meer op het dashboard, wel onder 'Gelezen' om de keuze later te wijzigen.
    const dashboardMessages = staffView ? relevant.filter(message => messagePublicationStatus(message) === "active")
      : relevant.filter(message => !isEventAnnouncement(message) || eventResponseFor(message)?.status !== "no");
    // In de dashboardwidget blijven gelezen mededelingen beknopt totdat je ze opent.
    // De volledige Mededelingen-pagina behoudt haar bestaande weergave.
    const dashboardMessageHtml = message => {
      const isRead = !staffView && messageIsRead(message.id);
      const eventDate = isEventAnnouncement(message) && message.eventAt && !Number.isNaN(new Date(message.eventAt).getTime())
        ? `<span class="dashboard-event-date">${escapeHtml(formatMessagePopupDateTime(message.eventAt))}</span>` : "";
      const heading = `<span class="dashboard-message-title-line"><strong>${richTitleHtml(message)}</strong>${eventDate}</span>`;
      const body = `<div class="dashboard-message-body"><div class="rich-text-content">${richTextHtml(message.text)}</div>${eventAnnouncementDetails(message, staffView)}</div>`;
      const readButton = staffView ? "" : `<button class="dashboard-read-toggle" type="button" data-toggle-read="${message.id}">${isRead ? "Markeer als ongelezen" : "Markeer als gelezen"}</button>`;
      if (isRead) return `<article class="dashboard-message-card message-read dashboard-message-collapsed"><details class="dashboard-message-details"><summary><span class="message-meta">${formatMessageDate(message.publishedAt)} · ${messageAudienceLabel(message.audience)}</span>${heading}</summary>${body}${readButton}</details></article>`;
      return `<article class="dashboard-message-card"><div class="dashboard-message-content"><div class="message-meta">${formatMessageDate(message.publishedAt)} · ${messageAudienceLabel(message.audience)}</div>${heading}<div class="rich-text-content">${richTextHtml(message.text)}</div></div>${eventAnnouncementDetails(message, staffView)}${readButton}</article>`;
    };
    $("#recentMessages").innerHTML = dashboardMessages.length ? dashboardMessages.map(dashboardMessageHtml).join("") : emptyAgendaHtml("Geen mededelingen voor jou.");

    const list = $("#messagesPageList");
    if (staffView) {
      const selectedStatus = $("#messageFilter").value || "active";
      const messages = selectedStatus === "all" ? relevant : relevant.filter(message => messagePublicationStatus(message) === selectedStatus);
      list.classList.remove("message-status-grid");
      list.innerHTML = messages.length ? messages.map(message => messageCardHtml(message, true)).join("") : emptyAgendaHtml("Geen berichten binnen dit filter.");
    } else {
      const unread = relevant.filter(message => !messageIsRead(message.id));
      const read = relevant.filter(message => messageIsRead(message.id));
      list.classList.add("message-status-grid");
      list.innerHTML = `
        <section class="message-status-column unread-column">
          <header class="message-status-heading"><div><span>Ongelezen</span><strong>${unread.length}</strong></div><small>Nieuwe mededelingen die nog aandacht vragen.</small></header>
          <div class="message-status-list">${unread.length ? unread.map(message => messageCardHtml(message, false)).join("") : '<div class="message-status-empty">Geen ongelezen mededelingen.</div>'}</div>
        </section>
        <section class="message-status-column read-column">
          <header class="message-status-heading"><div><span>Gelezen</span><strong>${read.length}</strong></div><small>Mededelingen die je al hebt bekeken.</small></header>
          <div class="message-status-list">${read.length ? read.map(message => messageCardHtml(message, false)).join("") : '<div class="message-status-empty">Nog geen gelezen mededelingen.</div>'}</div>
        </section>`;
    }

    $$("[data-manage-message]").forEach(button => button.addEventListener("click", () => openMessageManageDialog(button.dataset.manageMessage)));
    bindEventResponseActions($("#messagesPageList"));
    bindEventResponseActions($("#recentMessages"));
    $$("[data-toggle-read]").forEach(button => button.addEventListener("click", () => {
      const key = messageReadKey(button.dataset.toggleRead);
      state.messageRead = state.messageRead.includes(key) ? state.messageRead.filter(item => item !== key) : [...state.messageRead, key];
      saveState(); renderMessages(); renderNotifications();
    }));
  }


  function relevantClientAppointments() {
    if (currentConfig().kind !== "client") return [];
    return state.agendaItems
      .filter(item => item.requiresResponse && item.createdByKind === "staff" && item.date >= prototypeToday() && (item.owner === state.role || item.client === currentAccountName()))
      .sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
  }

  function currentNotifications() {
    if (currentConfig().kind !== "client") return [];
    const messages = relevantMessages().filter(message => !messageIsRead(message.id)).map(message => ({
      kind: "message", id: message.id, title: message.title, titleHtml:message.titleHtml, meta: `Nieuwe mededeling · ${formatMessageDate(message.publishedAt)}`
    }));
    const reminders = eventReminderMessages().map(message => ({
      kind: "event-reminder", id: message.id, title: message.title, titleHtml: message.titleHtml,
      meta: `Herinnering · Je weet nog niet of je erbij bent`
    }));
    const appointments = relevantClientAppointments().filter(item => !state.notificationSeen.includes(appointmentSeenKey(item.id))).map(item => ({
      kind: "appointment", id: item.id, title: item.title, titleHtml:item.titleHtml, meta: `Afspraak van ${item.createdBy || "begeleiding"} · ${formatDate(item.date)} om ${item.start}`
    }));
    return [...reminders, ...appointments, ...messages];
  }

  function unreadLoginMessages() {
    if (currentConfig().kind !== "client") return [];
    return relevantMessages().filter(message => !messageIsRead(message.id));
  }

  function currentClientAttentionKeys() {
    if (currentConfig().kind !== "client") return [];
    return relevantMessages().map(message => `message:${message.id}`);
  }

  function refreshClientAttentionSnapshot() {
    clientAttentionSnapshot = new Set(currentClientAttentionKeys());
  }

  function syncLiveCommunicationsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const incoming = JSON.parse(raw);
      let changed = false;
      if (Array.isArray(incoming.messages) && JSON.stringify(incoming.messages) !== JSON.stringify(state.messages)) {
        state.messages = incoming.messages;
        changed = true;
      }
      return changed;
    } catch {
      return false;
    }
  }

  // Houd gedeelde kalendergegevens bij tussen open HUB-tabbladen. De ingelogde
  // gebruiker en persoonlijke scherminstellingen blijven bewust lokaal per tab.
  function syncLiveCalendarFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const incoming = JSON.parse(raw);
      let changed = false;
      for (const key of ["closures", "agendaItems"]) {
        if (Array.isArray(incoming[key]) && JSON.stringify(incoming[key]) !== JSON.stringify(state[key])) {
          state[key] = incoming[key];
          changed = true;
        }
      }
      if (changed && state.authenticated) {
        renderAgenda();       // Kalender, Upcoming en de kleine kalenderwidget.
        renderClosures();     // Spectrum gesloten-widget.
        renderRoleSummary();  // Eerstvolgende afspraak in het dashboard.
      }
      return changed;
    } catch {
      return false;
    }
  }

  function checkForNewClientAttention({ syncStorage = true } = {}) {
    if (!state.authenticated || currentConfig().kind !== "client" || !currentClock().active) return;
    if (syncStorage) syncLiveCommunicationsFromStorage();
    const keys = currentClientAttentionKeys();
    const fresh = keys.filter(key => !clientAttentionSnapshot.has(key));
    const expired = [...clientAttentionSnapshot].some(key => !keys.includes(key));
    clientAttentionSnapshot = new Set(keys);
    if (!fresh.length && !expired) return;
    renderMessages();
    renderNotifications();
    if (expired) showLoginMessagePopup();
    if (fresh.length) {
      showToast("Nieuwe mededeling ontvangen.");
      setTimeout(showLoginMessagePopup, 60);
    }
  }

  function startClientAttentionMonitor() {
    clearInterval(clientAttentionPollTimer);
    clientAttentionPollTimer = 0;
    if (!state.authenticated || currentConfig().kind !== "client") return;
    refreshClientAttentionSnapshot();
    clientAttentionPollTimer = window.setInterval(() => checkForNewClientAttention(), 1500);
  }

  function stopClientAttentionMonitor() {
    clearInterval(clientAttentionPollTimer);
    clientAttentionPollTimer = 0;
    clientAttentionSnapshot = new Set();
  }

  function pendingLoginItems() {
    if (currentConfig().kind !== "client") return [];
    const reminders = eventReminderMessages().map(item => ({ kind:"event-reminder", item }));
    const messages = unreadLoginMessages().map(message => ({ kind:"message", item:message }));
    return [...reminders, ...messages].filter(entry => !loginDeferredItems.has(loginDeferredItemKey(entry.kind, entry.item.id)));
  }

  function showLoginMessagePopup(preferredMessageId = null) {
    const dialog = $("#loginMessageDialog");
    if (!dialog || currentConfig().kind !== "client") return;
    const pending = pendingLoginItems();
    // Een handmatig aangeklikte melding moet ook open kunnen na 'Herinner me later'.
    const preferred = preferredMessageId ? state.messages.find(item => item.id === preferredMessageId
      && (unreadLoginMessages().some(unread => unread.id === item.id)
        || eventReminderMessages().some(reminder => reminder.id === item.id)
        || (isEventAnnouncement(item) && eventResponseFor(item)?.status === "yes"))) : null;
    if (preferred && !pending.some(entry => entry.item.id === preferred.id)) pending.unshift({
      kind: eventReminderPending(preferred) ? "event-reminder" : "message", item:preferred
    });
    if (!pending.length) {
      if (dialog.open) dialog.close();
      return;
    }

    // Een nieuw bericht mag een al geopende mededeling niet vervangen.
    // Na 'Gelezen' of 'Herinner me later' wordt automatisch het volgende getoond.
    const current = (dialog.open
      ? pending.find(entry => entry.kind === dialog.dataset.itemKind && entry.item.id === dialog.dataset.itemId)
      : null) || (preferredMessageId ? pending.find(entry => entry.item.id === preferredMessageId) : null) || pending[0];
    const item = current.item;
    dialog.dataset.itemId = item.id;
    dialog.dataset.itemKind = current.kind;
    delete dialog.dataset.messageId;

    const readButton = $("#loginMessageReadButton");
    $("#loginMessageEyebrow").textContent = formatMessagePopupDateTime(item.publishedAt);
    $("#loginMessageTitle").innerHTML = richTitleHtml(item);
    $("#loginMessageMeta").textContent = `Voor: ${messageAudienceLabel(item.audience)}`;
    $("#loginMessageText").innerHTML = richTextHtml(item.text);
    const eventBox = $("#loginMessageEvent");
    eventBox.classList.toggle("hidden", !isEventAnnouncement(item));
    eventBox.innerHTML = eventAnnouncementDetails(item);
    bindEventResponseActions(eventBox);
    if (readButton) {
      const reminder = current.kind === "event-reminder";
      // Een evenement kan alleen worden afgehandeld via een van de drie reacties.
      readButton.classList.toggle("hidden", reminder || isEventAnnouncement(item));
      readButton.textContent = "Mededeling gelezen";
    }

    $("#loginMessageCounter").textContent = pending.length > 1 ? `${pending.length} nieuw` : "1 nieuw";
    if (!dialog.open) dialog.showModal();
  }

  function markLoginMessageRead() {
    const dialog = $("#loginMessageDialog");
    const id = dialog?.dataset.itemId;
    const kind = dialog?.dataset.itemKind;
    if (!id || !kind) return;

    if (kind === "event-reminder") return; // De beslissing blijft open tot de mediënt reageert.
    const key = messageReadKey(id);
    if (!state.messageRead.includes(key)) state.messageRead.push(key);

    saveState();
    renderMessages();
    renderNotifications();
    showLoginMessagePopup();
  }

  function remindLoginMessageLater() {
    const dialog = $("#loginMessageDialog");
    const id = dialog?.dataset.itemId;
    const kind = dialog?.dataset.itemKind;
    if (!id || !kind) {
      if (dialog?.open) dialog.close();
      return;
    }
    loginDeferredItems.add(loginDeferredItemKey(kind, id));
    showLoginMessagePopup();
  }

  function renderNotifications() {
    const button = $("#notificationsButton");
    const badge = $("#notificationBadge");
    const list = $("#notificationsList");
    if (!button || !badge || !list) return;
    const notifications = currentNotifications();
    badge.textContent = notifications.length > 9 ? "9+" : String(notifications.length);
    badge.classList.toggle("hidden", notifications.length === 0);
    badge.setAttribute("aria-label", `${notifications.length} nieuwe ${notifications.length === 1 ? "melding" : "meldingen"}`);
    button.setAttribute("aria-label", notifications.length ? `Meldingen openen, ${notifications.length} nieuwe ${notifications.length === 1 ? "melding" : "meldingen"}` : "Meldingen openen");
    list.innerHTML = notifications.length ? notifications.map(item => `<button class="notification-item ${item.kind}" type="button" data-notification-kind="${item.kind}" data-notification-id="${item.id}"><span class="notification-item-icon">${lucideIcon(item.kind === "message" ? "message-square-text" : item.kind === "event-reminder" ? "calendar-check" : "calendar-clock")}</span><span class="notification-item-copy"><strong>${richTitleHtml(item)}</strong><small>${escapeHtml(item.meta)}</small></span><span class="notification-item-arrow">${lucideIcon("chevron-right")}</span></button>`).join("") : emptyAgendaHtml("Je bent helemaal bij. Er zijn geen nieuwe meldingen.");
    $$("[data-notification-kind]", list).forEach(item => item.addEventListener("click", () => openNotification(item.dataset.notificationKind, item.dataset.notificationId)));
  }

  function openNotification(kind, id) {
    if (kind === "message" || kind === "event-reminder") {
      $("#notificationsDialog").close();
      // Alleen het expliciete 'Mededeling gelezen' bevestigt lezen.
      if (kind === "event-reminder" || !messageIsRead(id)) showLoginMessagePopup(id);
      else setPage("messages");
    } else {
      const key = appointmentSeenKey(id);
      if (!state.notificationSeen.includes(key)) state.notificationSeen.push(key);
      saveState();
      $("#notificationsDialog").close();
      openAppointmentResponseDialog(id);
    }
    renderNotifications();
  }

  function allGoalClients() {
    const byName = new Map();
    data.people.filter(person => person.type === "client").forEach(person => byName.set(person.name, { name: person.name, department: person.department || "multimedia" }));
    (state.accounts || []).filter(account => account.kind === "client").forEach(account => byName.set(account.name, { name: account.name, department: account.department || "multimedia" }));
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "nl"));
  }

  function sanitizeRichTextHtml(rawHtml) {
    const template = document.createElement("template");
    template.innerHTML = String(rawHtml || "");
    const allowed = new Set(["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "UL", "OL", "LI", "BR", "SPAN", "P", "DIV", "FONT", "A"]);
    const allowedFonts = new Set(["arial", "verdana", "georgia", "trebuchet ms", "courier new", "futura pt"]);
    const validColor = value => /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|[a-z]+)$/i.test(String(value || "").trim());
    const validSize = value => /^[1-7]$/.test(String(value || "").trim());
    const validCssSize = value => /^\d+(?:\.\d+)?(?:px|em|rem|%)$/i.test(String(value || "").trim());
    const cleanWalk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) return;
        if (child.nodeType !== Node.ELEMENT_NODE) { child.remove(); return; }
        if (!allowed.has(child.tagName)) {
          const fragment = document.createDocumentFragment();
          while (child.firstChild) fragment.appendChild(child.firstChild);
          child.replaceWith(fragment);
          cleanWalk(node);
          return;
        }
        if (child.tagName === "A") {
          const safeUrl = safeRichLinkUrl(child.getAttribute("href"));
          [...child.attributes].forEach(attribute => child.removeAttribute(attribute.name));
          if (safeUrl) {
            child.setAttribute("href", safeUrl);
            child.setAttribute("target", "_blank");
            child.setAttribute("rel", "noopener noreferrer");
          } else {
            const fragment = document.createDocumentFragment();
            while (child.firstChild) fragment.appendChild(child.firstChild);
            child.replaceWith(fragment);
            cleanWalk(node);
            return;
          }
        } else if (child.tagName === "SPAN") {
          const style = child.getAttribute("style") || "";
          const safe = [];
          const color = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)?.[1]?.trim();
          const size = style.match(/(?:^|;)\s*font-size\s*:\s*([^;]+)/i)?.[1]?.trim();
          const family = style.match(/(?:^|;)\s*font-family\s*:\s*([^;]+)/i)?.[1]?.replace(/["']/g, "").trim();
          if (color && validColor(color)) safe.push(`color:${color}`);
          if (size && validCssSize(size)) safe.push(`font-size:${size}`);
          if (family && allowedFonts.has(family.toLowerCase())) safe.push(`font-family:${family}`);
          [...child.attributes].forEach(attribute => child.removeAttribute(attribute.name));
          if (safe.length) child.setAttribute("style", safe.join(";"));
        } else if (child.tagName === "FONT") {
          const color = child.getAttribute("color") || "";
          const face = (child.getAttribute("face") || "").replace(/["']/g, "").trim();
          const size = child.getAttribute("size") || "";
          [...child.attributes].forEach(attribute => child.removeAttribute(attribute.name));
          if (validColor(color)) child.setAttribute("color", color);
          if (allowedFonts.has(face.toLowerCase())) child.setAttribute("face", face);
          if (validSize(size)) child.setAttribute("size", size);
        } else {
          [...child.attributes].forEach(attribute => child.removeAttribute(attribute.name));
        }
        cleanWalk(child);
      });
    };
    cleanWalk(template.content);
    return template.innerHTML.trim();
  }

  function sanitizeGoalHtml(rawHtml) { return sanitizeRichTextHtml(rawHtml); }

  function richTextHtml(value) {
    const raw = String(value || "");
    if (!raw) return "";
    if (/<(?:b|strong|i|em|u|s|strike|ul|ol|li|br|span|p|div|font|a)(?:\s|>|\/)/i.test(raw)) return sanitizeRichTextHtml(raw);
    return escapeHtml(raw).replace(/\r?\n/g, "<br>");
  }

  function richTitleHtml(item) {
    return richTextHtml(item?.titleHtml || item?.title || "");
  }

  function getRichTitleHtml(sourceId) {
    const editor = document.getElementById(`${sourceId}RichEditor`);
    return editor ? sanitizeRichTextHtml(editor.innerHTML) : richTextHtml(document.getElementById(sourceId)?.value || "");
  }

  function richTextPlain(value) {
    const template = document.createElement("template");
    template.innerHTML = sanitizeRichTextHtml(value);
    return (template.content.textContent || "").replace(/\s+/g, " ").trim();
  }

  // One editor for every free-form multi-line text field in Spectrum HUB.
  // taskChecklist remains a line-based checklist: each line is a separate checkbox.
  const universalRichTextSourceIds = [
    "taskDescription",
    "staffPlannerTaskDescription",
    "agendaDescription",
    "communicationMessageText",
    "manageMessageText",
    "clockOutNote",
    "clockOutNext",
    "diaryNote"
  ];
  // Keep titles as plain text for searches, labels, and scheduling logic;
  // their formatting lives in the separate titleHtml property.
  const universalRichTitleIds = [
    "taskTitle", "staffPlannerTaskTitle", "agendaTitle", "communicationTitle",
    "goalTitle", "manageMessageName", "manageClosureTitle"
  ];
  const richTextEditorSources = new Map();
  const richDialogActiveEditors = new WeakMap();
  const richDialogToolbars = new WeakMap();
  const richTextSelections = new WeakMap();

  const richEmojiCategories = {
    smileys: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 🙂‍↕️ 😏 😒 🙂‍↔️ 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🫣 🤭 🫢 🫡 🤫 🫠 🤥 😶 😶‍🌫️ 😐 😑 😬 🫨 🫥 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 😵‍💫 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾".split(" "),
    people: "👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 🫷 🫸 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 🫦 👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 🧓 👴 👵 🙍 🙎 🙅 🙆 💁 🙋 🧏 🙇 🤦 🤷 🧑‍⚕️ 🧑‍🎓 🧑‍🏫 🧑‍⚖️ 🧑‍🌾 🧑‍🍳 🧑‍🔧 🧑‍🏭 🧑‍💼 🧑‍🔬 🧑‍💻 🧑‍🎤 🧑‍🎨 🧑‍✈️ 🧑‍🚀 🧑‍🚒 👮 🕵️ 💂 🥷 👷 🫅 🤴 👸 👳 👲 🧕 🤵 👰 🤰 🫃 🫄 🤱 👼 🎅 🤶 🦸 🦹 🧙 🧚 🧛 🧜 🧝 🧞 🧟 💆 💇 🚶 🧍 🧎 🏃 💃 🕺 👯 🧖 🧗 🤺 🏇 ⛷️ 🏂 🏌️ 🏄 🚣 🏊 ⛹️ 🏋️ 🚴 🚵 🤸 🤼 🤽 🤾 🤹 🧘 🛀 🛌 👭 👫 👬 💏 💑 👪 🗣️ 👤 👥 🫂".split(" "),
    nature: "🐵 🐒 🦍 🦧 🐶 🐕 🦮 🐕‍🦺 🐩 🐺 🦊 🦝 🐱 🐈 🐈‍⬛ 🦁 🐯 🐅 🐆 🐴 🫎 🫏 🐎 🦄 🦓 🦌 🦬 🐮 🐂 🐃 🐄 🐷 🐖 🐗 🐽 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏 🦛 🐭 🐁 🐀 🐹 🐰 🐇 🐿️ 🦫 🦔 🦇 🐻 🐻‍❄️ 🐨 🐼 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🕊️ 🦅 🦆 🦢 🦉 🦤 🪶 🦩 🦚 🦜 🪽 🐦‍⬛ 🪿 🐸 🐊 🐢 🦎 🐍 🐲 🐉 🦕 🦖 🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🐚 🪸 🪼 🐌 🦋 🐛 🐜 🐝 🪲 🐞 🦗 🪳 🕷️ 🕸️ 🦂 🦟 🪰 🪱 🦠 💐 🌸 💮 🪷 🏵️ 🌹 🥀 🌺 🌻 🌼 🌷 🪻 🌱 🪴 🌲 🌳 🌴 🌵 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃 🍄 🪨 🪵 🌍 🌎 🌏 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌙 🌚 🌛 🌜 ☀️ 🌝 🌞 ⭐ 🌟 🌠 ☁️ ⛅ ⛈️ 🌤️ 🌥️ 🌦️ 🌧️ 🌨️ 🌩️ 🌪️ 🌫️ 🌈 ☔ ⚡ ❄️ ☃️ ⛄ 🔥 💧 🌊".split(" "),
    food: "🍏 🍎 🍐 🍊 🍋 🍋‍🟩 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🫛 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🍠 🫚 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🫘 🍯 🥛 🍼 🫖 ☕ 🍵 🧃 🥤 🧋 🫙 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉 🍾 🧊 🥄 🍴 🍽️ 🥣 🥡 🥢 🧂".split(" "),
    activity: "⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🪃 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 ⛷️ 🏂 🪂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🧗 🚵 🚴 🏆 🥇 🥈 🥉 🏅 🎖️ 🏵️ 🎗️ 🎫 🎟️ 🎪 🤹 🎭 🩰 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🎻 🪈 🎲 ♟️ 🎯 🎳 🎮 🎰 🧩".split(" "),
    travel: "🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🏍️ 🛵 🚲 🛴 🛹 🛼 🚨 🚔 🚍 🚘 🚖 🛞 🚡 🚠 🚟 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 💺 🛰️ 🚀 🛸 🚁 🛶 ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 ⚓ 🛟 ⛽ 🚧 🚦 🚥 🗺️ 🗿 🗽 🗼 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏖️ 🏝️ 🏜️ 🌋 ⛰️ 🏔️ 🗻 🏕️ ⛺ 🛖 🏠 🏡 🏢 🏥 🏦 🏨 🏪 🏫 🏬 🏭 🏯 🏛️ ⛪ 🕌 🛕 🕍 ⛩️ 🕋 🌁 🌃 🏙️ 🌄 🌅 🌆 🌇 🌉 ♨️ 🎑 🏞️".split(" "),
    objects: "⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 🖲️ 🕹️ 🗜️ 💽 💾 💿 📀 📼 📷 📸 📹 🎥 📽️ 🎞️ 📞 ☎️ 📟 📠 📺 📻 🎙️ 🎚️ 🎛️ 🧭 ⏱️ ⏲️ ⏰ 🕰️ ⌛ ⏳ 📡 🔋 🪫 🔌 💡 🔦 🕯️ 🪔 🧯 🛢️ 💸 💵 💴 💶 💷 🪙 💰 💳 💎 ⚖️ 🪜 🧰 🪛 🔧 🔨 ⚒️ 🛠️ ⛏️ 🪚 🔩 ⚙️ 🪤 🧱 ⛓️ ⛓️‍💥 🧲 🔫 💣 🧨 🪓 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🪦 ⚱️ 🏺 🔮 📿 🧿 🪬 💈 ⚗️ 🔭 🔬 🕳️ 🩹 🩺 🩻 🩼 💊 💉 🩸 🧬 🦠 🧫 🧪 🌡️ 🧹 🪠 🧺 🧻 🚽 🚿 🛁 🧼 🪥 🪒 🧽 🪣 🧴 🛎️ 🔑 🗝️ 🚪 🪑 🛋️ 🛏️ 🪞 🪟 🛍️ 🛒 🎁 🎈 🎏 🎀 🪄 🪅 🎊 🎉 🎎 🏮 🎐 🧧 ✉️ 📩 📨 📧 💌 📥 📤 📦 🏷️ 🪧 📪 📫 📬 📭 📮 📯 📜 📃 📄 📑 🧾 📊 📈 📉 🗒️ 🗓️ 📆 📅 🗑️ 📇 🗃️ 🗳️ 🗄️ 📋 📁 📂 🗂️ 🗞️ 📰 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 🧷 🔗 📎 🖇️ 📐 📏 🧮 📌 📍 ✂️ 🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓".split(" "),
    symbols: "❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🤎 🖤 🩶 🤍 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 🕎 ☯️ ☦️ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ 🆔 ⚛️ 🉑 ☢️ ☣️ 📴 📳 🈶 🈚 🈸 🈺 🈷️ ✴️ 🆚 💮 🉐 ㊙️ ㊗️ 🈴 🈵 🈹 🈲 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 〽️ ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 🈯 💹 ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 🏧 🚾 ♿ 🅿️ 🛗 🈳 🈂️ 🛂 🛃 🛄 🛅 🚹 🚺 🚼 ⚧️ 🚻 🚮 🎦 📶 🈁 🔣 ℹ️ 🔤 🔡 🔠 🆖 🆗 🆙 🆒 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔢 #️⃣ *️⃣ ⏏️ ▶️ ⏸️ ⏯️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ ⏫ ⏬ ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ ⤴️ ⤵️ 🔀 🔁 🔂 🔄 🔃 🎵 🎶 ➕ ➖ ➗ ✖️ 🟰 ♾️ 💲 💱 ™️ ©️ ®️ 👁️‍🗨️ 🔚 🔙 🔛 🔝 🔜 ✔️ ☑️ 🔘 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ ◼️ ◻️ ◾ ◽ ▪️ ▫️ 🔸 🔹 🔶 🔷 🔺 🔻 💠 🔳 🔲".split(" "),
    flags: "🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇳🇱 🇧🇪 🇩🇪 🇫🇷 🇬🇧 🇮🇪 🇪🇸 🇵🇹 🇮🇹 🇨🇭 🇦🇹 🇩🇰 🇸🇪 🇳🇴 🇫🇮 🇮🇸 🇵🇱 🇨🇿 🇬🇷 🇺🇦 🇪🇺 🇺🇸 🇨🇦 🇲🇽 🇧🇷 🇦🇷 🇯🇵 🇨🇳 🇰🇷 🇮🇳 🇦🇺 🇳🇿 🇿🇦".split(" ")
  };
  let richEmojiAllCache = null;

  function richEmojiAll() {
    if (richEmojiAllCache) return richEmojiAllCache;
    const emoji = [];
    const seen = new Set();
    const add = value => { if (value && !seen.has(value)) { seen.add(value); emoji.push(value); } };
    Object.values(richEmojiCategories).flat().forEach(add);
    try {
      const matcher = /\p{Emoji_Presentation}/u;
      [[0x2300,0x27ff],[0x1f000,0x1faff]].forEach(([from,to]) => {
        for (let cp=from; cp<=to; cp+=1) {
          if (cp >= 0x1f1e6 && cp <= 0x1f1ff) continue;
          const char=String.fromCodePoint(cp);
          if (matcher.test(char)) add(char);
        }
      });
    } catch {}
    return (richEmojiAllCache=emoji);
  }

  const richEmojiCategorySearchTerms = {
    smileys:"smiley smileys gezicht gezichten face faces emotie emoties emotion emotions lach lachen blij happy verdriet sad boos angry huil cry knipoog wink ziek sick feest party",
    people:"mens mensen persoon personen people person hand handen body lichaam gebaar gesture werk beroep job family familie baby kind child man vrouw woman",
    nature:"dier dieren animal animals natuur nature hond dog kat cat paard horse vogel bird vis fish insect bloem flower boom tree plant zon sun maan moon ster star weer weather regen rain sneeuw snow vuur fire water",
    food:"eten food drink drinken fruit groente vegetable pizza burger brood bread koffie coffee thee tea bier beer wijn wine taart cake snoep candy",
    activity:"sport sports spel game games voetbal football soccer basketbal basketball tennis muziek music kunst art film movie feest party trofee trophy",
    travel:"reizen travel vervoer transport auto car bus trein train vliegtuig plane fiets bike boot boat huis home gebouw building stad city kaart map vakantie holiday",
    objects:"object objecten objects telefoon phone computer laptop camera klok clock tijd time lamp light geld money tool tools gereedschap cadeau gift mail brief boek book pen sleutel key slot lock",
    symbols:"symbool symbol symbols hart heart liefde love check vink kruis cross waarschuwing warning vraag question info pijl arrow cirkel circle vierkant square kleur color",
    flags:"vlag vlaggen flag flags land landen country countries nederland netherlands dutch belgie belgium duitsland germany europa europe usa amerika america regenboog rainbow"
  };
  const richEmojiTermGroups = {
    "hart heart hearts liefde love": "❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🤎 🖤 🩶 🤍 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟",
    "lach smile smiling smiley happy blij grin grinning": "😀 😃 😄 😁 😆 😅 😂 🤣 😊 🙂 😉 😍 🥰 🤩 🥳",
    "feest party celebration vieren vieren verjaardag confetti": "🥳 🎉 🎊 🎈 🎂 🪅 🥂 🎁",
    "verdriet sad huil cry crying traan tears": "😞 😔 😟 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭",
    "boos angry kwaad mad": "😤 😠 😡 🤬 👿",
    "duim thumb thumbs up down goed slecht like dislike": "👍 👎",
    "hand hands zwaai wave wijzen point klap clap bidden pray": "👋 🤚 🖐️ ✋ 🖖 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 🫵 👏 🙌 🙏",
    "hond dog puppy": "🐶 🐕 🦮 🐕‍🦺 🐩",
    "kat cat kitten": "🐱 🐈 🐈‍⬛ 😺 😸 😹 😻 😼 😽 🙀 😿 😾",
    "paard horse pony eenhoorn unicorn": "🐴 🐎 🦄",
    "vogel bird birds": "🐦 🐧 🕊️ 🦅 🦆 🦢 🦉 🦤 🦩 🦚 🦜 🐦‍⬛",
    "vis fish zee sea oceaan ocean": "🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🐚 🪸 🪼 🌊",
    "bloem flower flowers plant plants": "💐 🌸 💮 🪷 🏵️ 🌹 🥀 🌺 🌻 🌼 🌷 🪻 🌱 🪴 🌿 ☘️ 🍀",
    "zon sun zonnig sunny": "☀️ 🌞 🌤️",
    "maan moon nacht night": "🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌙 🌚 🌛 🌜 🌝",
    "ster star stars sparkle": "⭐ 🌟 🌠 ✨",
    "regen rain paraplu umbrella": "🌧️ 🌦️ ☔",
    "sneeuw snow winter": "❄️ ☃️ ⛄ 🌨️",
    "vuur fire flame": "🔥",
    "pizza": "🍕",
    "burger hamburger": "🍔",
    "koffie coffee cafe": "☕",
    "bier beer": "🍺 🍻",
    "wijn wine": "🍷 🥂 🍾",
    "taart cake verjaardag birthday": "🎂 🍰 🧁 🥳 🎉 🎊 🎈",
    "voetbal football soccer": "⚽",
    "basketbal basketball": "🏀",
    "tennis": "🎾",
    "game games gaming controller": "🎮 🕹️ 🎲 ♟️ 🧩",
    "muziek music audio koptelefoon headphones": "🎵 🎶 🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🎻",
    "auto car cars": "🚗 🚕 🚙 🏎️ 🚓 🚑 🚒 🚐 🛻",
    "trein train metro": "🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉",
    "vliegtuig plane airplane flight vliegen": "✈️ 🛫 🛬 🛩️",
    "fiets bike bicycle": "🚲 🚴 🚵",
    "huis home house": "🏠 🏡 🏢",
    "telefoon phone mobile mobiel": "📱 📲 ☎️ 📞",
    "computer pc laptop keyboard toetsenbord": "💻 ⌨️ 🖥️ 🖱️",
    "camera foto photo picture": "📷 📸 📹 🎥",
    "klok clock tijd time alarm": "⌚ ⏱️ ⏲️ ⏰ 🕰️ ⌛ ⏳",
    "lamp light licht idee idea": "💡 🔦 🕯️",
    "geld money euro dollar": "💸 💵 💴 💶 💷 🪙 💰 💳",
    "cadeau gift present verjaardag birthday": "🎁 🎀 🎈 🎉",
    "mail email bericht message brief letter": "✉️ 📩 📨 📧 💌 📥 📤",
    "boek book books lezen read": "📕 📗 📘 📙 📚 📖 🔖",
    "pen pencil potlood schrijven write": "🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️",
    "check vink done klaar yes ja": "✅ ✔️ ☑️",
    "kruis cross x no nee fout wrong": "❌ ❎ ⛔ 🚫",
    "waarschuwing warning alert danger gevaar": "⚠️ 🚨 ❗ ‼️",
    "vraag question help": "❓ ❔ ⁉️",
    "info information informatie": "ℹ️",
    "pijl arrow arrows": "➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ ⤴️ ⤵️",
    "nederland netherlands dutch holland": "🇳🇱",
    "belgie belgium belgian": "🇧🇪",
    "duitsland germany german": "🇩🇪",
    "frankrijk france french": "🇫🇷",
    "engeland uk united kingdom britain british": "🇬🇧",
    "eu europa europe european": "🇪🇺",
    "amerika usa united states america american": "🇺🇸",
    "regenboog rainbow pride": "🏳️‍🌈 🌈"
  };

  function richEmojiList(category="all") {
    return category === "all" ? richEmojiAll() : (richEmojiCategories[category] || richEmojiAll());
  }

  function normalizedRichEmojiQuery(value="") {
    return String(value || "").trim().toLocaleLowerCase("nl-NL");
  }

  function richEmojiSearchResults(query, category="all") {
    const normalized=normalizedRichEmojiQuery(query);
    if (!normalized) return richEmojiList(category);
    const tokens=normalized.split(/\s+/).filter(Boolean);
    const allowed=new Set(richEmojiList(category));
    const matched=new Set();
    // Search the named emoji sets first: "cat", "heart", "party", etc.
    // Do not return entire unrelated categories when a specific name matches.
    Object.entries(richEmojiTermGroups).forEach(([terms, emojiString]) => {
      const words=terms.toLocaleLowerCase("nl-NL").split(/\s+/);
      if (tokens.every(token => words.some(word => word.startsWith(token)))) {
        emojiString.split(/\s+/).forEach(emoji => { if (allowed.has(emoji)) matched.add(emoji); });
      }
    });
    // Typing/pasting an emoji itself also finds it.
    richEmojiList(category).forEach(emoji => { if (emoji.includes(normalized)) matched.add(emoji); });
    if (matched.size) return [...matched];
    // Broad category names remain searchable, without overwhelming named results.
    const categories=category === "all" ? Object.keys(richEmojiCategories) : [category];
    categories.forEach(key => {
      const terms=`${key} ${richEmojiCategorySearchTerms[key] || ""}`.toLocaleLowerCase("nl-NL").split(/\s+/);
      if (tokens.every(token => terms.some(term => term.startsWith(token)))) {
        richEmojiCategories[key].forEach(emoji => { if (allowed.has(emoji)) matched.add(emoji); });
      }
    });
    return [...matched];
  }

  function renderRichEmojiPicker(toolbar, category="all", query=null) {
    const picker=toolbar?.querySelector("[data-rich-emoji-picker]");
    const grid=picker?.querySelector("[data-rich-emoji-grid]");
    const search=picker?.querySelector("[data-rich-emoji-search]");
    const empty=picker?.querySelector("[data-rich-emoji-empty]");
    if (!picker || !grid) return;
    picker.dataset.emojiCategory=category;
    picker.querySelectorAll("[data-rich-emoji-category]").forEach(button => button.classList.toggle("active", button.dataset.richEmojiCategory === category));
    const searchValue=query == null ? (search?.value || "") : query;
    const results=richEmojiSearchResults(searchValue, category);
    grid.innerHTML=results.map(emoji => `<button type="button" class="rich-emoji-option" data-rich-emoji="${emoji}" aria-label="Emoji ${emoji}">${emoji}</button>`).join("");
    empty?.classList.toggle("hidden", results.length > 0);
  }

  function richTextToolbarMarkup() {
    return `<div class="universal-rich-toolbar dialog-rich-toolbar" role="toolbar" aria-label="Tekstopmaak">
      <span class="rich-toolbar-context" data-rich-context>Tekstopmaak</span>
      <button type="button" class="rich-format-button" data-rich-command="bold" aria-pressed="false" title="Vet" aria-label="Vet"><b>B</b></button>
      <button type="button" class="rich-format-button" data-rich-command="italic" aria-pressed="false" title="Cursief" aria-label="Cursief"><i>I</i></button>
      <button type="button" class="rich-format-button" data-rich-command="underline" aria-pressed="false" title="Onderstrepen" aria-label="Onderstrepen"><u>U</u></button>
      <button type="button" class="rich-format-button" data-rich-command="strikeThrough" aria-pressed="false" title="Doorhalen" aria-label="Doorhalen"><s>S</s></button>
      <button type="button" class="rich-format-button rich-list-button" data-rich-command="insertUnorderedList" aria-pressed="false" title="Opsomming" aria-label="Opsomming">•≡</button>
      <button type="button" class="rich-format-button rich-list-button" data-rich-command="insertOrderedList" aria-pressed="false" title="Genummerde lijst" aria-label="Genummerde lijst">1≡</button>
      <select class="rich-format-select rich-size-select" data-rich-command="fontSize" aria-label="Tekstgrootte" title="Tekstgrootte">
        <option value="">Grootte</option><option value="1">Klein</option><option value="3">Normaal</option><option value="4">Groot</option><option value="5">Extra groot</option><option value="6">Titel</option>
      </select>
      <button type="button" class="rich-format-button rich-link-toggle" data-rich-link-toggle aria-label="Link toevoegen of aanpassen" aria-expanded="false" title="Link toevoegen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3A5 5 0 0 0 13.5 3l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3A5 5 0 0 0 10.5 21l1.7-1.7"/></svg></button>
      <div class="rich-link-picker hidden" data-rich-link-picker>
        <label>Linkadres<input type="text" inputmode="url" data-rich-link-url placeholder="https://voorbeeld.nl" autocomplete="url" /></label>
        <div class="rich-link-actions"><button type="button" class="secondary-button" data-rich-link-cancel>Annuleren</button><button type="button" class="primary-button" data-rich-link-apply>Link toevoegen</button><button type="button" class="text-button" data-rich-link-remove>Link verwijderen</button></div>
        <small data-rich-link-error class="hidden" role="alert">Voer een geldig webadres in (https:// of http://).</small>
      </div>
      <label class="rich-color-control" title="Tekstkleur"><span>A</span><input type="color" value="#17263b" data-rich-color aria-label="Tekstkleur" /></label>
      <button type="button" class="rich-format-button rich-emoji-toggle" data-rich-emoji-toggle title="Emoji invoegen" aria-label="Emoji invoegen" aria-expanded="false">🙂</button>
      <div class="rich-emoji-picker hidden" data-rich-emoji-picker aria-label="Emoji kiezen">
        <div class="rich-emoji-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input type="search" class="rich-emoji-search" data-rich-emoji-search placeholder="Zoek emoji…" autocomplete="off" aria-label="Emoji zoeken" />
        </div>
        <div class="rich-emoji-categories" role="tablist" aria-label="Emoji categorieën">
          <button type="button" data-rich-emoji-category="all" class="active" title="Alle">⌘</button>
          <button type="button" data-rich-emoji-category="smileys" title="Smileys">😀</button>
          <button type="button" data-rich-emoji-category="people" title="Mensen">👋</button>
          <button type="button" data-rich-emoji-category="nature" title="Dieren en natuur">🐾</button>
          <button type="button" data-rich-emoji-category="food" title="Eten en drinken">🍕</button>
          <button type="button" data-rich-emoji-category="activity" title="Activiteiten">⚽</button>
          <button type="button" data-rich-emoji-category="travel" title="Reizen en plaatsen">🚗</button>
          <button type="button" data-rich-emoji-category="objects" title="Objecten">💡</button>
          <button type="button" data-rich-emoji-category="symbols" title="Symbolen">❤️</button>
          <button type="button" data-rich-emoji-category="flags" title="Vlaggen">🏳️</button>
        </div>
        <div class="rich-emoji-grid" data-rich-emoji-grid role="group" aria-label="Emoji's"></div>
        <div class="rich-emoji-empty hidden" data-rich-emoji-empty>Geen emoji gevonden.</div>
      </div>
    </div>`;
  }

  function rememberRichTextSelection(editor) {
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) richTextSelections.set(editor, range.cloneRange());
  }

  function restoreRichTextSelection(editor) {
    const range = editor ? richTextSelections.get(editor)?.cloneRange() : null;
    editor?.focus();
    if (!range) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function syncRichTextSource(editor) {
    const source = richTextEditorSources.get(editor);
    if (!source) return;
    const isTitle = editor.dataset.richSingleLine === "true";
    const html = sanitizeRichTextHtml(editor.innerHTML || "");
    const plain = richTextPlain(html);
    source.value = isTitle ? (editor.textContent || "").replace(/\s+/g, " ").trim() : (plain ? html : "");
    // Rich-text fields must not impose arbitrary character limits.
    source.setCustomValidity("");
    editor.classList.toggle("rich-editor-invalid", Boolean(source.required && !plain));
  }

  function richToolbarFor(editor) {
    return richDialogToolbars.get(editor?.closest("dialog"));
  }

  function richToolbarActiveEditor(toolbar) {
    const dialog = toolbar?.closest("dialog");
    const active = dialog && richDialogActiveEditors.get(dialog);
    return active && active.isConnected ? active : null;
  }

  function setRichToolbarActive(editor) {
    const dialog = editor?.closest("dialog");
    if (!dialog) return;
    richDialogActiveEditors.set(dialog, editor);
    updateRichToolbarState(dialog);
  }

  function richQueryState(command) {
    try { return document.queryCommandState(command); } catch { return false; }
  }

  function richQueryValue(command) {
    try { return String(document.queryCommandValue(command) || ""); } catch { return ""; }
  }

  function updateRichToolbarState(dialog) {
    const toolbar = richDialogToolbars.get(dialog);
    const editor = toolbar && richToolbarActiveEditor(toolbar);
    if (!toolbar) return;
    const selection = window.getSelection();
    const selectedInEditor = Boolean(editor && selection?.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer));
    const context = toolbar.querySelector("[data-rich-context]");
    if (context) context.textContent = editor ? editor.closest(".universal-rich-field, .goal-editor-field")?.querySelector(".universal-rich-label, .goal-editor-label")?.textContent || "Tekst" : "Klik op een tekstveld";
    toolbar.querySelectorAll("button[data-rich-command]").forEach(button => {
      const command = button.dataset.richCommand;
      const isList = command === "insertUnorderedList" || command === "insertOrderedList";
      button.disabled = !editor || (isList && editor.dataset.richSingleLine === "true");
      const active = selectedInEditor && Boolean(richQueryState(command));
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const size = toolbar.querySelector('[data-rich-command="fontSize"]');
    if (size) {
      const value = selectedInEditor ? richQueryValue("fontSize") : "";
      size.value = [...size.options].some(option => option.value === value) ? value : "";
      size.disabled = !editor;
    }
    const color = toolbar.querySelector("[data-rich-color]");
    if (color) {
      color.disabled = !editor;
      const colorValue = selectedInEditor ? richQueryValue("foreColor") : "";
      const result = colorValue.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      const parsed = result ? `#${result.slice(1,4).map(part => Number(part).toString(16).padStart(2,"0")).join("")}` : /^#[0-9a-f]{6}$/i.test(colorValue) ? colorValue : "";
      if (parsed) color.value = parsed;
      toolbar.querySelector(".rich-color-control")?.style.setProperty("--rich-selected-color", color.value);
    }
    const emoji = toolbar.querySelector("[data-rich-emoji-toggle]");
    if (emoji) emoji.disabled = !editor;
    const linkButton = toolbar.querySelector("[data-rich-link-toggle]");
    if (linkButton) {
      linkButton.disabled = !editor;
      const active = Boolean(selectedInEditor && activeRichAnchor(editor));
      linkButton.classList.toggle("is-active", active);
      linkButton.setAttribute("aria-pressed", String(active));
    }
  }

  function applyRichTextCommand(editor, command, value = null) {
    if (!editor || !command || (value === "" && command === "fontSize")) return;
    if (editor.dataset.richSingleLine === "true" && ["insertOrderedList", "insertUnorderedList"].includes(command)) return;
    restoreRichTextSelection(editor);
    document.execCommand(command, false, value);
    rememberRichTextSelection(editor);
    syncRichTextSource(editor);
    updateRichToolbarState(editor.closest("dialog"));
  }

  function safeRichLinkUrl(value) {
    let url = String(value || "").trim();
    if (!url) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = `https://${url}`;
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname ? parsed.href : "";
    } catch { return ""; }
  }

  function hideRichLinkPicker(toolbar) {
    toolbar?.querySelector("[data-rich-link-picker]")?.classList.add("hidden");
    toolbar?.querySelector("[data-rich-link-toggle]")?.setAttribute("aria-expanded", "false");
  }

  function activeRichAnchor(editor) {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    const link = element?.closest?.("a[href]");
    return link && editor?.contains(link) ? link : null;
  }

  function applyRichLink(toolbar, remove = false) {
    const editor = richToolbarActiveEditor(toolbar);
    if (!editor) return;
    const urlField = toolbar.querySelector("[data-rich-link-url]");
    const error = toolbar.querySelector("[data-rich-link-error]");
    const url = remove ? "" : safeRichLinkUrl(urlField?.value);
    error?.classList.toggle("hidden", Boolean(remove || url));
    if (!remove && !url) { urlField?.focus(); return; }
    restoreRichTextSelection(editor);
    const existing = activeRichAnchor(editor);
    if (remove) {
      if (existing) {
        const parent = existing.parentNode;
        while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
        existing.remove();
      } else document.execCommand("unlink", false, null);
    } else if (existing) {
      existing.href = url;
      existing.target = "_blank";
      existing.rel = "noopener noreferrer";
    } else {
      const selection = window.getSelection();
      const range = selection?.rangeCount && selection.getRangeAt(0);
      if (range?.collapsed) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = url;
        range.insertNode(link);
        range.setStartAfter(link);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        document.execCommand("createLink", false, url);
        const created = activeRichAnchor(editor);
        if (created) { created.target = "_blank"; created.rel = "noopener noreferrer"; }
      }
    }
    rememberRichTextSelection(editor);
    syncRichTextSource(editor);
    hideRichLinkPicker(toolbar);
    updateRichToolbarState(editor.closest("dialog"));
  }

  function bindUniversalRichEditor(editor, source = null) {
    if (!editor || editor.dataset.richBound === "true") return;
    editor.dataset.richBound = "true";
    if (source) richTextEditorSources.set(editor, source);
    editor.addEventListener("focus", () => { setRichToolbarActive(editor); rememberRichTextSelection(editor); });
    ["keyup", "mouseup"].forEach(type => editor.addEventListener(type, () => {
      rememberRichTextSelection(editor);
      updateRichToolbarState(editor.closest("dialog"));
    }));
    editor.addEventListener("input", () => {
      rememberRichTextSelection(editor);
      syncRichTextSource(editor);
      updateRichToolbarState(editor.closest("dialog"));
    });
    if (editor.dataset.richSingleLine === "true") editor.addEventListener("keydown", event => {
      if (event.key === "Enter") event.preventDefault();
    });
    editor.addEventListener("paste", event => {
      event.preventDefault();
      let text = event.clipboardData?.getData("text/plain") || "";
      if (editor.dataset.richSingleLine === "true") text = text.replace(/\s*\r?\n\s*/g, " ");
      document.execCommand("insertText", false, text);
    });
    if (source) {
      source.addEventListener("invalid", event => {
        event.preventDefault();
        editor.classList.add("rich-editor-invalid");
        editor.focus();
      });
      source.form?.addEventListener("reset", () => setTimeout(() => setRichTextFieldValue(source.id, source.value), 0));
    }
  }

  function bindRichDialogToolbar(toolbar) {
    if (!toolbar || toolbar.dataset.richBound) return;
    toolbar.dataset.richBound = "true";
    const dialog = toolbar.closest("dialog");
    richDialogToolbars.set(dialog, toolbar);
    toolbar.addEventListener("mousedown", event => {
      const editor = richToolbarActiveEditor(toolbar);
      if (editor) rememberRichTextSelection(editor);
      if (event.target.closest("button[data-rich-command], button[data-rich-emoji-toggle], button[data-rich-emoji], button[data-rich-emoji-category], button[data-rich-link-toggle], button[data-rich-link-apply], button[data-rich-link-cancel], button[data-rich-link-remove]")) event.preventDefault();
    });
    toolbar.addEventListener("click", event => {
      const editor = richToolbarActiveEditor(toolbar);
      const button = event.target.closest("button[data-rich-command]");
      if (button) {
        applyRichTextCommand(editor, button.dataset.richCommand);
        toolbar.querySelector("[data-rich-emoji-picker]")?.classList.add("hidden");
        toolbar.querySelector("[data-rich-emoji-toggle]")?.setAttribute("aria-expanded", "false");
        return;
      }
      const linkToggle = event.target.closest("button[data-rich-link-toggle]");
      if (linkToggle) {
        const picker = toolbar.querySelector("[data-rich-link-picker]");
        const opening = picker?.classList.contains("hidden");
        picker?.classList.toggle("hidden", !opening);
        linkToggle.setAttribute("aria-expanded", String(Boolean(opening)));
        toolbar.querySelector("[data-rich-emoji-picker]")?.classList.add("hidden");
        toolbar.querySelector("[data-rich-emoji-toggle]")?.setAttribute("aria-expanded", "false");
        if (opening) {
          const existing = editor ? activeRichAnchor(editor) : null;
          picker.querySelector("[data-rich-link-url]").value = existing?.href || "";
          picker.querySelector("[data-rich-link-error]").classList.add("hidden");
          picker.querySelector("[data-rich-link-url]").focus();
        }
        return;
      }
      if (event.target.closest("[data-rich-link-apply]")) { applyRichLink(toolbar); return; }
      if (event.target.closest("[data-rich-link-remove]")) { applyRichLink(toolbar, true); return; }
      if (event.target.closest("[data-rich-link-cancel]")) { hideRichLinkPicker(toolbar); return; }
      const emojiToggle = event.target.closest("button[data-rich-emoji-toggle]");
      if (emojiToggle) {
        const picker = toolbar.querySelector("[data-rich-emoji-picker]");
        const opening = picker?.classList.contains("hidden");
        if (opening && !picker?.dataset.emojiReady) {
          renderRichEmojiPicker(toolbar, "all");
          if (picker) picker.dataset.emojiReady = "true";
        }
        picker?.classList.toggle("hidden", !opening);
        emojiToggle.setAttribute("aria-expanded", String(Boolean(opening)));
        if (opening) { hideRichLinkPicker(toolbar); picker?.querySelector("[data-rich-emoji-search]")?.focus(); }
        return;
      }
      const emojiCategory = event.target.closest("button[data-rich-emoji-category]");
      if (emojiCategory) {
        renderRichEmojiPicker(toolbar, emojiCategory.dataset.richEmojiCategory || "all");
        return;
      }
      const emojiButton = event.target.closest("button[data-rich-emoji]");
      if (emojiButton && editor) {
        restoreRichTextSelection(editor);
        document.execCommand("insertText", false, emojiButton.dataset.richEmoji || "");
        rememberRichTextSelection(editor);
        syncRichTextSource(editor);
        toolbar.querySelector("[data-rich-emoji-picker]")?.classList.add("hidden");
        toolbar.querySelector("[data-rich-emoji-toggle]")?.setAttribute("aria-expanded", "false");
        updateRichToolbarState(dialog);
      }
    });
    toolbar.addEventListener("input", event => {
      const search = event.target.closest("[data-rich-emoji-search]");
      if (!search) return;
      const picker = toolbar.querySelector("[data-rich-emoji-picker]");
      renderRichEmojiPicker(toolbar, picker?.dataset.emojiCategory || "all", search.value);
    });
    document.addEventListener("pointerdown", event => {
      const picker = toolbar.querySelector("[data-rich-emoji-picker]");
      if (!picker || picker.classList.contains("hidden")) return;
      const toggle = toolbar.querySelector("[data-rich-emoji-toggle]");
      if (picker.contains(event.target) || toggle?.contains(event.target)) return;
      picker.classList.add("hidden");
      toggle?.setAttribute("aria-expanded", "false");
    });
    toolbar.querySelector("[data-rich-link-url]")?.addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); applyRichLink(toolbar); }
      if (event.key === "Escape") { event.preventDefault(); hideRichLinkPicker(toolbar); }
    });
    document.addEventListener("pointerdown", event => {
      const picker = toolbar.querySelector("[data-rich-link-picker]");
      if (!picker || picker.classList.contains("hidden")) return;
      if (picker.contains(event.target) || toolbar.querySelector("[data-rich-link-toggle]")?.contains(event.target)) return;
      hideRichLinkPicker(toolbar);
    });
    toolbar.addEventListener("change", event => {
      const editor = richToolbarActiveEditor(toolbar);
      const select = event.target.closest("select[data-rich-command]");
      if (select) { applyRichTextCommand(editor, select.dataset.richCommand, select.value); return; }
      const color = event.target.closest("input[data-rich-color]");
      if (color) applyRichTextCommand(editor, "foreColor", color.value);
    });
    updateRichToolbarState(dialog);
  }

  function transformRichTextSource(sourceId, isTitle=false) {
    const source = document.getElementById(sourceId);
    if (!source || source.dataset.richTransformed === "true") return;
    const label = source.closest("label");
    if (!label) return;
    source.dataset.richTransformed = "true";
    source.classList.add("rich-text-source");
    source.tabIndex = -1;
    const labelText = [...label.childNodes].filter(node => node !== source).map(node => node.textContent || "").join(" ").replace(/\s+/g, " ").trim() || "Omschrijving";
    const wrapper = document.createElement("div");
    wrapper.className = "universal-rich-field";
    if (isTitle) wrapper.classList.add("universal-rich-title-field");
    if (label.id) wrapper.id = label.id;
    label.classList.forEach(name => wrapper.classList.add(name));
    const labelSpan = document.createElement("span");
    labelSpan.className = "universal-rich-label";
    labelSpan.textContent = labelText;
    const editor = document.createElement("div");
    editor.id = `${sourceId}RichEditor`;
    editor.className = "universal-rich-editor";
    if (isTitle) editor.dataset.richSingleLine = "true";
    editor.contentEditable = "true";
    editor.setAttribute("role", "textbox");
    editor.setAttribute("aria-multiline", String(!isTitle));
    editor.setAttribute("aria-label", labelText);
    editor.dataset.placeholder = source.placeholder || (isTitle ? "Titel invoeren…" : "Schrijf een omschrijving…");
    editor.innerHTML = richTextHtml(source.value);
    label.replaceWith(wrapper);
    wrapper.append(labelSpan, editor, source);
    bindUniversalRichEditor(editor, source);
  }

  function setRichTextFieldValue(id, value) {
    if (id === "goalText") {
      const editor = document.getElementById(id);
      if (editor) editor.innerHTML = richTextHtml(value);
      return;
    }
    const source = document.getElementById(id);
    if (!source) return;
    const isTitle = universalRichTitleIds.includes(id);
    const html = richTextHtml(value);
    source.value = isTitle ? richTextPlain(html) : String(value || "");
    const editor = document.getElementById(`${id}RichEditor`);
    if (editor) {
      editor.innerHTML = html;
      syncRichTextSource(editor);
      const dialog = editor.closest("dialog");
      if (richDialogActiveEditors.get(dialog) === editor) updateRichToolbarState(dialog);
    }
  }

  function initUniversalRichTextEditors() {
    universalRichTextSourceIds.forEach(id => transformRichTextSource(id));
    universalRichTitleIds.forEach(id => transformRichTextSource(id, true));
    const goalEditor = document.getElementById("goalText");
    const oldToolbar = document.getElementById("goalEditorToolbar");
    if (oldToolbar) oldToolbar.remove();
    if (goalEditor) {
      goalEditor.classList.add("universal-rich-editor");
      bindUniversalRichEditor(goalEditor);
    }
    document.querySelectorAll("dialog.app-dialog").forEach(dialog => {
      const editors = dialog.querySelectorAll(".universal-rich-editor");
      if (!editors.length) return;
      const holder = document.createElement("div");
      holder.innerHTML = richTextToolbarMarkup();
      const toolbar = holder.firstElementChild;
      // Prefer the edit-form header: some dialogs also have a read-only detail header.
      const header = dialog.querySelector("form .dialog-header") || dialog.querySelector(".dialog-header");
      if (header) header.after(toolbar);
      else dialog.querySelector("form")?.prepend(toolbar);
      bindRichDialogToolbar(toolbar);
      // Reset focus/active indicators when re-opening different dialogs.
      dialog.addEventListener("close", () => {
        richDialogActiveEditors.delete(dialog);
        const picker = toolbar.querySelector("[data-rich-emoji-picker]");
        picker?.classList.add("hidden");
        toolbar.querySelector("[data-rich-emoji-toggle]")?.setAttribute("aria-expanded", "false");
        hideRichLinkPicker(toolbar);
        updateRichToolbarState(dialog);
      });
    });
    document.addEventListener("selectionchange", () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const anchor = selection.anchorNode;
      const editor = (anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement)?.closest?.(".universal-rich-editor");
      if (!editor) return;
      rememberRichTextSelection(editor);
      setRichToolbarActive(editor);
    });
  }

  function goalLegacyHtml(goal) {
    if (goal?.html) return sanitizeGoalHtml(goal.html);
    return escapeHtml(goal?.text || "").replace(/\n/g, "<br>");
  }

  let goalEditorRange = null;
  function rememberGoalEditorSelection() { rememberRichTextSelection($("#goalText")); }
  function restoreGoalEditorSelection() { restoreRichTextSelection($("#goalText")); }
  function applyGoalEditorCommand(command, value = null) { applyRichTextCommand($("#goalText"), command, value); }

  // Each sprint line has a stable ID: this is the single source of truth for any linked board task.
  // Older rich-text sprint descriptions become editable lines only when that goal is opened/saved.
  function sprintGoalItems(goal) {
    if (Array.isArray(goal?.sprintItems)) return goal.sprintItems.slice(0, 5).map((item, index) => ({
      id: String(item?.id || `${goal.id}-line-${index + 1}`),
      text: String(item?.text || ""),
      onBoard: Boolean(item?.onBoard),
      done: Boolean(item?.done)
    }));
    const legacy = String(goal?.text || "").trim().split(/\r?\n/).map(text => text.trim()).filter(Boolean);
    if (legacy.length > 5) legacy.splice(4, legacy.length - 4, legacy.slice(4).join("\n"));
    return legacy.map((text, index) => ({ id: `${goal.id}-line-${index + 1}`, text, onBoard: false }));
  }

  function renderSprintGoalInputs(goal) {
    const rows = sprintGoalItems(goal);
    const container = $("#goalSprintRows");
    container.innerHTML = Array.from({ length: 5 }, (_, index) => {
      const item = rows[index];
      const id = item?.id || createId("sprint-line");
      return `<div class="goal-sprint-row" data-sprint-line-id="${escapeHtml(id)}" data-sprint-line-done="${item?.done ? 'true' : 'false'}">
        <label class="goal-sprint-line-input">Subdoel ${index + 1}<textarea rows="1" data-sprint-line-text placeholder="Omschrijf het sprintdoel…">${escapeHtml(item?.text || "")}</textarea></label>

      </div>`;
    }).join("");
  }

  function updateGoalFormMode() {
    const sprint = currentConfig().kind !== "staff" || $("#goalType").value === "sprint";
    $("#goalSprintFields").classList.toggle("hidden", !sprint);
    $("#goalDescriptionField").classList.toggle("hidden", sprint);
    // The shared dialog toolbar is only relevant to the personal goal description.
    const toolbar = $("#goalDialog .universal-rich-toolbar");
    if (toolbar) toolbar.classList.toggle("hidden", sprint);
  }

  function sprintGoalLinesHtml(goal) {
    const items = sprintGoalItems(goal).filter(item => item.text.trim());
    return items.length ? `<ul class="sprint-goal-lines">${items.map(item => `<li><label class="sprint-hub-check"><input type="checkbox" data-hub-sprint-goal="${escapeHtml(goal.id)}" data-hub-sprint-item="${escapeHtml(item.id)}" ${item.done ? 'checked' : ''}><span>${escapeHtml(item.text)}</span></label></li>`).join("")}</ul>` : '<span class="task-sprint-empty">Geen sprintdoelen ingevuld.</span>';
  }

  // Sync only this goal's task records; never create duplicates when the goal is edited.
  // Completed/archived tasks are kept as historical records and remain immutable.
  function syncSprintGoalBoardTasks(previous, goal) {
    const items = goal.type === "sprint" ? sprintGoalItems(goal) : [];
    const activeIds = new Set(items.filter(item => item.onBoard && item.text.trim()).map(item => item.id));
    const linked = state.tasks.filter(task => task.sourceGoalId === goal.id);
    const unfinished = linked.filter(task => !taskIsLocked(task));
    state.tasks = state.tasks.filter(task => task.sourceGoalId !== goal.id || taskIsLocked(task) || activeIds.has(task.sourceGoalLineId));
    for (const item of items) {
      if (!activeIds.has(item.id)) continue;
      const existing = state.tasks.find(task => task.sourceGoalId === goal.id && task.sourceGoalLineId === item.id);
      if (existing) {
        if (!taskIsLocked(existing)) {
          existing.title = item.text.trim();
          existing.titleHtml = "";
          existing.client = goal.client;
          existing.label = "Sprintdoel";
        }
      } else {
        state.tasks.push({ id: createId("task"), client: goal.client, sourceGoalId: goal.id,
          sourceGoalLineId: item.id, title: item.text.trim(), titleHtml: "",
          column: "todo", label: "Sprintdoel", due: "", description: "", checklist: [],
          checklistDone: [], active: false, completedAt: null, archivedAt: null });
      }
    }
  }

  function renderTaskSprintGoals() {
    const panel = $("#taskSprintGoalsPanel");
    const list = $("#taskSprintGoalsList");
    if (!panel || !list) return;
    const staff = currentConfig().kind === "staff";
    panel.classList.toggle("hidden", staff);
    if (staff) return;
    const goals = (state.goals || []).filter(goal => goal.client === currentAccountName() && goal.type === "sprint");
    list.innerHTML = goals.length ? goals.map(goal => `<article class="task-sprint-goal-item">
      <div class="task-sprint-goal-top"><strong>${richTitleHtml(goal)}</strong>${goal.date ? `<small>${escapeHtml(formatDate(goal.date))}</small>` : ""}</div>
      ${sprintGoalLinesHtml(goal)}
    </article>`).join("") : '<p class="task-sprint-empty">Er zijn nog geen sprintdoelen. Je kunt ze aanmaken onder Mijn Doelen.</p>';
  }

  function goalCardsHtml(clientName, type) {
    const config = currentConfig();
    const goals = (state.goals || []).filter(goal => goal.client === clientName && goal.type === type);
    if (!goals.length) return `<div class="empty-state goal-empty"><p>${type === "personal" ? "Nog geen persoonlijk doel." : "Nog geen sprintdoelen."}</p></div>`;
    return goals.map(goal => {
      const canEdit = config.kind === "staff" || (config.kind === "client" && goal.client === currentAccountName() && goal.type === "sprint");
      const dateHtml = goal.date ? `<small class="goal-card-date">${formatDate(goal.date)}</small>` : "";
      return `<article class="goal-study-card goal-study-card-expanded ${type === "personal" ? "goal-personal-card" : "goal-sprint-card"}"><div class="goal-card-kicker"><span>${type === "personal" ? "Persoonlijk doel" : "Sprintdoel"}</span>${dateHtml}</div><strong>${richTitleHtml(goal)}</strong><div class="goal-rich-content">${type === "sprint" ? sprintGoalLinesHtml(goal) : goalLegacyHtml(goal)}</div>${canEdit ? `<button class="secondary-button goal-edit-button" type="button" data-edit-goal="${escapeHtml(goal.id)}">Bewerken</button>` : ""}</article>`;
    }).join("");
  }

  function renderGoals() {
    if (!Array.isArray(state.goals)) state.goals = cloneDefaultState().goals;
    const config = currentConfig();
    const staffView = config.kind === "staff";
    const title = $("#goalsPageTitle");
    const intro = $("#goalsPageIntro");
    if (title) title.textContent = staffView ? "Doelen" : "Mijn Doelen";
    if (intro) intro.textContent = staffView ? "Zoek een mediënt en beheer persoonlijke doelen en sprintdoelen." : "Je persoonlijke ontwikkelrichting links, je eigen korte sprintdoelen rechts.";

    if (!staffView) {
      const name = currentAccountName();
      $("#clientPersonalGoals").innerHTML = goalCardsHtml(name, "personal");
      $("#clientSprintGoals").innerHTML = goalCardsHtml(name, "sprint");
    } else {
      const search = ($("#goalsClientSearch")?.value || "").trim().toLowerCase();
      const department = $("#goalsDepartmentFilter")?.value || "all";
      const clients = allGoalClients().filter(client => (!search || clientFullName(client.name).toLowerCase().includes(search)) && (department === "all" || client.department === department));
      if (!clients.some(client => client.name === selectedGoalsClientName)) selectedGoalsClientName = "";
      const searchResults = $("#goalsSearchResults");
      if (searchResults) {
        searchResults.classList.toggle("hidden", !search);
        searchResults.innerHTML = search ? (clients.length
          ? clients.map(client => `<button class="goals-search-result" type="button" data-select-goals-client="${escapeHtml(client.name)}"><strong>${escapeHtml(clientFullName(client.name))}</strong><small>${client.department === "it" ? "IT" : "Multimedia"}</small></button>`).join("")
          : `<p class="goals-search-no-results">Geen mediënten gevonden.</p>`) : "";
        $$("[data-select-goals-client]", searchResults).forEach(button => button.addEventListener("click", () => {
          selectedGoalsClientName = button.dataset.selectGoalsClient;
          // Keep the client selected while hiding the search suggestions.
          $("#goalsClientSearch").value = "";
          renderGoals();
        }));
      }
      const selected = clients.find(client => client.name === selectedGoalsClientName);
      $("#staffGoalsEmpty").classList.toggle("hidden", Boolean(selected));
      $("#staffGoalsColumns").classList.toggle("hidden", !selected);
      $("#goalsSelectedClient").textContent = selected?.name || "Selecteer een mediënt";
      $("#goalsSelectedClientMeta").textContent = selected ? `${selected.department === "it" ? "IT" : "Multimedia"} · persoonlijke en sprintdoelen` : "Persoonlijke en sprintdoelen";
      $("#staffPersonalGoals").innerHTML = selected ? goalCardsHtml(selected.name, "personal") : emptyAgendaHtml("Selecteer eerst een mediënt.");
      $("#staffSprintGoals").innerHTML = selected ? goalCardsHtml(selected.name, "sprint") : emptyAgendaHtml("Selecteer eerst een mediënt.");
      $("#addGoalForSelectedClient").disabled = !selected;
    }
    $$('[data-edit-goal]').forEach(button => button.addEventListener("click", () => openGoalDialog(button.dataset.editGoal)));
  }

  function openGoalDialog(goalId = null, preferredType = null, preferredClient = null) {
    const config = currentConfig();
    const staffView = config.kind === "staff";
    const goal = (state.goals || []).find(item => item.id === goalId);
    const clients = allGoalClients();
    const clientName = goal?.client || preferredClient || (staffView ? selectedGoalsClientName : currentAccountName());
    if (staffView && !clients.some(client => client.name === clientName)) {
      showToast("Kies eerst een mediënt.");
      return;
    }
    $("#goalId").value = goal?.id || "";
    $("#goalDialogTitle").textContent = goal ? "Doel bewerken" : "Nieuw doel";
    $("#goalClient").innerHTML = clients.map(client => `<option value="${escapeHtml(client.name)}">${escapeHtml(clientFullName(client.name))} · ${client.department === "it" ? "IT" : "Multimedia"}</option>`).join("");
    $("#goalClient").value = clientName || "";
    $("#goalClientWrap").classList.toggle("hidden", !staffView);
    const type = goal?.type || preferredType || (staffView ? "personal" : "sprint");
    $("#goalType").value = staffView ? type : "sprint";
    $("#goalType").disabled = !staffView;
    setRichTextFieldValue("goalTitle", goal?.titleHtml || goal?.title || "");
    $("#goalDate").value = goal?.date || prototypeToday();
    setRichTextFieldValue("goalText", goalLegacyHtml(goal));
    renderSprintGoalInputs(goal);
    updateGoalFormMode();
    goalEditorRange = null;
    const canDelete = Boolean(goal) && (staffView || (goal.client === currentAccountName() && goal.type === "sprint"));
    $("#deleteGoalButton").classList.toggle("hidden", !canDelete);
    $("#goalDialog").showModal();
    setTimeout(() => document.getElementById("goalTitleRichEditor")?.focus(), 30);
  }

  function saveGoal() {
    const config = currentConfig();
    const staffView = config.kind === "staff";
    const id = $("#goalId").value || createId("goal");
    const existing = (state.goals || []).find(goal => goal.id === id);
    const client = staffView ? $("#goalClient").value : currentAccountName();
    const type = staffView ? $("#goalType").value : "sprint";
    if (!staffView && type !== "sprint") return false;
    const person = allGoalClients().find(item => item.name === client);
    const editor = $("#goalText");
    let plainText = (editor?.innerText || "").trim();
    let richHtml = sanitizeGoalHtml(editor?.innerHTML || "");
    let sprintItems = null;
    if (type === "sprint") {
      sprintItems = $$("#goalSprintRows .goal-sprint-row").map(row => ({
        id: row.dataset.sprintLineId,
        text: row.querySelector("[data-sprint-line-text]").value.trim(),
        onBoard: true,
        done: row.dataset.sprintLineDone === "true"
      })).filter(item => item.text);
      plainText = sprintItems.map(item => item.text).join("\n");
      richHtml = "";
    }
    const goal = { id, client, department: person?.department || config.department, type, title: $("#goalTitle").value.trim(),
      titleHtml: getRichTitleHtml("goalTitle"), date: $("#goalDate").value, text: plainText, html: richHtml };
    if (sprintItems) {
      goal.sprintItems = sprintItems;
      goal.completed = sprintItems.length > 0 && sprintItems.every(item=>item.done);
    }
    if (!goal.title || !goal.date || !goal.text || !goal.client) {
      if (!goal.text) (type === "sprint" ? $("#goalSprintRows [data-sprint-line-text]") : editor)?.focus();
      return false;
    }
    if (!Array.isArray(state.goals)) state.goals = [];
    const index = state.goals.findIndex(item => item.id === id);
    if (index >= 0) state.goals[index] = goal; else state.goals.push(goal);
    syncSprintGoalBoardTasks(existing, goal);
    selectedGoalsClientName = client;
    saveState(); renderGoals(); renderKanbans(); renderRoleSummary();
    showToast(existing ? "Doel bijgewerkt." : (type === "sprint" ? "Sprintdoel toegevoegd." : "Persoonlijk doel toegevoegd."));
    return true;
  }

  function deleteGoal() {
    const id = $("#goalId").value;
    const goal = (state.goals || []).find(item => item.id === id);
    if (!goal) return;
    const staffView = currentConfig().kind === "staff";
    if (!staffView && !(goal.client === currentAccountName() && goal.type === "sprint")) return;
    if (!window.confirm("Wil je dit doel verwijderen?")) return;
    state.goals = state.goals.filter(item => item.id !== id);
    // A finished task stays in the archive/history; only unfinished linked tasks disappear.
    state.tasks = state.tasks.filter(task => task.sourceGoalId !== id || taskIsLocked(task));
    saveState(); renderGoals(); renderKanbans(); renderRoleSummary(); $("#goalDialog").close(); showToast("Doel verwijderd.");
  }

  document.addEventListener("change", event => {
    const target=event.target.closest?.("[data-hub-sprint-goal][data-hub-sprint-item]");
    if(!target)return;
    const goal=(state.goals||[]).find(g=>g.id===target.dataset.hubSprintGoal);
    if(!goal)return;
    const cfg=currentConfig();
    if(cfg.kind!=="staff"&&goal.client!==currentAccountName())return;
    window.spectrumHubSetSprintChecklistItem?.(goal.id,target.dataset.hubSprintItem,target.checked);
  });

  // Planbord 2.0 can check off sprint items, but edits to the source stay in Mijn Doelen.
  // No archiving: finished goals stay in state.goals and in the board's fixed column.
  window.spectrumHubSetSprintChecklistItem = (goalId, itemId, done) => {
    const goal=(state.goals||[]).find(g=>g.id===goalId&&g.type==="sprint");
    if(!goal||!Array.isArray(goal.sprintItems))return false;
    const item=goal.sprintItems.find(i=>i.id===itemId);
    if(!item)return false;
    if(Boolean(item.done)===done)return true;
    item.done=done;
    goal.completed=goal.sprintItems.filter(i=>String(i.text||'').trim()).every(i=>i.done);
    saveState();renderGoals();renderKanbans();renderRoleSummary();
    if(currentPage==="client-detail")renderClientDetail();
    return true;
  };

  function defaultMessagePublishDateTime() {
    const now = prototypeNow();
    const twoDigits = value => String(value).padStart(2, "0");
    return `${dateToIso(now)}T${twoDigits(now.getHours())}:${twoDigits(now.getMinutes())}`;
  }

  function validMessagePublishWindow(start, end) {
    if (!end || new Date(end) > new Date(start)) return true;
    showToast("'Publiceren tot' moet na 'Publiceren op' liggen.");
    return false;
  }

  function openCommunicationDialog() {
    if (currentConfig().kind !== "staff") return;
    $("#communicationForm").reset();
    setRichTextFieldValue("communicationTitle", "");
    setRichTextFieldValue("communicationMessageText", "");
    $("#communicationPublishAt").value = defaultMessagePublishDateTime();
    setAnnouncementKind("communication", "message");
    $("#communicationEventAt").value = "";
    $("#communicationEventLocation").value = "";
    showExistingEventSignups("communication");
    $("#communicationDialog").showModal();
    setTimeout(() => document.getElementById("communicationTitleRichEditor")?.focus(), 30);
  }

  function saveCommunication() {
    if (currentConfig().kind !== "staff") return false;
    const message = {
      id: createId("message"),
      title: $("#communicationTitle").value.trim(),
      titleHtml: getRichTitleHtml("communicationTitle"),
      audience: $("#communicationAudience").value,
      publishedAt: $("#communicationPublishAt").value,
      publishUntil: $("#communicationPublishUntil").value || "",
      text: $("#communicationMessageText").value.trim(),
      ...readAnnouncementEventFields("communication")
    };
    if (!message.title || !message.publishedAt || !message.text || !validMessagePublishWindow(message.publishedAt, message.publishUntil) || !validateAnnouncementEvent(message)) return false;
    state.messages.push(message);
    if (messagePublicationStatus(message) !== "active") $("#messageFilter").value = messagePublicationStatus(message);
    saveState(); renderMessages(); renderStaffDashboard(); renderNotifications();
    showToast(isEventAnnouncement(message) ? "Evenement aangemaakt." : "Mededeling aangemaakt.");
    return true;
  }

  function openMessageManageDialog(messageId = null) {
    const message = state.messages.find(item => item.id === messageId);
    $("#messageManageTitle").textContent = message ? (isEventAnnouncement(message) ? "Evenement bewerken" : "Mededeling bewerken") : "Nieuwe mededeling";
    $("#manageMessageId").value = message?.id || "";
    setAnnouncementKind("manageMessage", message?.kind || "message");
    $("#manageMessageEventAt").value = message?.eventAt || "";
    $("#manageMessageEventLocation").value = message?.eventLocation || "";
    showExistingEventSignups("manageMessage", message);
    setRichTextFieldValue("manageMessageName", message?.titleHtml || message?.title || "");
    $("#manageMessageAudience").value = message?.audience || "all";
    $("#manageMessagePublishAt").value = message?.publishedAt || defaultMessagePublishDateTime();
    setRichTextFieldValue("manageMessageText", message?.text || "");
    $("#manageMessagePublishUntil").value = message?.publishUntil || "";
    $("#deleteMessageButton").classList.toggle("hidden", !message);
    $("#messageManageDialog").showModal();
    setTimeout(() => document.getElementById("manageMessageNameRichEditor")?.focus(), 40);
  }

  function saveManagedMessage() {
    const id = $("#manageMessageId").value || createId("message");
    const oldMessage = state.messages.find(item => item.id === id);
    const message = {
      id,
      title: $("#manageMessageName").value.trim(),
      titleHtml: getRichTitleHtml("manageMessageName"),
      audience: $("#manageMessageAudience").value,
      publishedAt: $("#manageMessagePublishAt").value,
      publishUntil: $("#manageMessagePublishUntil").value || "",
      text: $("#manageMessageText").value.trim(),
      ...readAnnouncementEventFields("manageMessage", oldMessage)
    };
    if (!message.title || !message.text || !message.publishedAt || !validMessagePublishWindow(message.publishedAt, message.publishUntil) || !validateAnnouncementEvent(message)) return false;
    const index = state.messages.findIndex(item => item.id === id);
    if (index >= 0) state.messages[index] = message; else state.messages.push(message);
    $("#messageFilter").value = messagePublicationStatus(message);
    saveState(); renderMessages(); renderStaffDashboard();
    showToast(isEventAnnouncement(message) ? (index >= 0 ? "Evenement bijgewerkt." : "Evenement opgeslagen.") : (index >= 0 ? "Mededeling bijgewerkt." : "Mededeling opgeslagen."));
    return true;
  }

  function deleteManagedMessage() {
    const id = $("#manageMessageId").value;
    if (!id || !window.confirm("Wil je deze mededeling verwijderen?")) return;
    state.messages = state.messages.filter(message => message.id !== id);
    saveState(); renderMessages(); renderStaffDashboard(); $("#messageManageDialog").close();
    showToast("Mededeling verwijderd.");
  }
  function rosterShortName(name) {
    const last = clientLastName(name).trim().split(/\s+/).pop();
    return last ? `${clientFirstName(name)} ${last[0].toUpperCase()}` : clientFirstName(name);
  }
  function roomPartLabel(part) {
    return { full: "Hele dag", morning: "Ochtend", afternoon: "Middag" }[part] || part;
  }
  function roomStandardTimes(day, part) {
    if (day === "vr" || part === "morning") return { start: "09:00", end: "12:30" };
    if (part === "afternoon") return { start: "13:00", end: "16:30" };
    return { start: "09:00", end: "16:30" };
  }
  function roomAssignmentTimeRange(assignment, partOverride = null) {
    if (!assignment) return null;
    const part = partOverride || assignment.part;

    if (assignment.part === "full" && partOverride === "morning") {
      const standard = roomStandardTimes(assignment.day, "morning");
      const start = assignment.laterStart || standard.start;
      const end = standard.end;
      const custom = Boolean(assignment.laterStart);
      return { start, end, custom };
    }

    if (assignment.part === "full" && partOverride === "afternoon") {
      const standard = roomStandardTimes(assignment.day, "afternoon");
      const start = standard.start;
      const end = assignment.earlyLeave || standard.end;
      const custom = Boolean(assignment.earlyLeave);
      return { start, end, custom };
    }

    const standard = roomStandardTimes(assignment.day, part);
    const start = assignment.laterStart || standard.start;
    const end = assignment.earlyLeave || standard.end;
    const custom = Boolean(assignment.laterStart || assignment.earlyLeave);
    return { start, end, custom };
  }
  function roomCustomTimeHtml(assignment, partOverride = null) {
    const range = roomAssignmentTimeRange(assignment, partOverride);
    if (!range?.custom) return "";
    return `<span class="room-custom-time"><i aria-hidden="true"></i>${escapeHtml(range.start)}–${escapeHtml(range.end)}</span>`;
  }
  function roomRosterCustomTimeMeta(assignment, partOverride = null) {
    if (!assignment) return { className:"", tooltip:"", html:"" };
    const part = partOverride || assignment.part;
    let later = Boolean(assignment.laterStart);
    let earlier = Boolean(assignment.earlyLeave);

    // A full-day placement is rendered as two cards. Keep each exception on
    // the daypart where it actually applies.
    if (assignment.part === "full" && partOverride === "morning") earlier = false;
    if (assignment.part === "full" && partOverride === "afternoon") later = false;

    if (!later && !earlier) return { className:"", tooltip:"", html:"" };
    const className = later && earlier ? " custom-time-both" : later ? " custom-time-later" : " custom-time-earlier";
    const lines = [];
    if (later) lines.push(`Later beginnen: ${assignment.laterStart}`);
    if (earlier) lines.push(`Eerder weg: ${assignment.earlyLeave}`);
    const tooltip = lines.join(" · ");
    const html = `<span class="room-time-tooltip" role="tooltip">${lines.map(line => escapeHtml(line)).join("<br>")}</span>`;
    return { className, tooltip, html };
  }
  function updateRoomCustomTimeUi() {
    const wrap = $("#roomCustomTimes");
    if (!wrap) return;
    const mode = $("#roomAssignmentMode")?.value || "client";
    wrap.classList.toggle("hidden", mode !== "client");
    const day = $("#roomAssignmentDay")?.value || "ma";
    const part = day === "vr" ? "morning" : ($("#roomAssignmentPart")?.value || "full");
    const standard = roomStandardTimes(day, part);
    $("#roomStandardTimeHint").textContent = `Standaardtijd: ${standard.start}–${standard.end}`;
    const laterEnabled = $("#roomLaterStartEnabled").checked;
    const earlyEnabled = $("#roomEarlyLeaveEnabled").checked;
    $("#roomLaterStartTime").disabled = !laterEnabled;
    $("#roomEarlyLeaveTime").disabled = !earlyEnabled;
    if (!laterEnabled) $("#roomLaterStartTime").value = standard.start;
    if (!earlyEnabled) $("#roomEarlyLeaveTime").value = standard.end;
  }

  function roomCellKey(roomId, day, part, seat) { return `${roomId}|${day}|${part}|${seat}`; }
  function roomCellIsSelected(roomId, day, part, seat) { return roomMultiSelection.some(item => item.key === roomCellKey(roomId, day, part, seat)); }
  function toggleRoomCellSelection(cell) {
    const key = roomCellKey(cell.roomId, cell.day, cell.part, cell.seat);
    const index = roomMultiSelection.findIndex(item => item.key === key);
    if (index >= 0) roomMultiSelection.splice(index, 1); else roomMultiSelection.push({ ...cell, key });
    renderRoomSchedule();
  }
  function clearRoomMultiSelection() {
    roomMultiSelection = [];
    roomModifierSelectionActive = false;
    renderRoomSchedule();
  }

  function finishRoomModifierSelection(event) {
    if (event.key !== "Control" && event.key !== "Meta") return;
    // Wacht totdat beide modificatietoetsen los zijn.
    if (event.ctrlKey || event.metaKey) return;
    // Geen modal openen terwijl de muisknop nog ingedrukt is: dan kan de
    // pointerup/click onbedoeld een knop in het formulier activeren.
    if (roomModifierDrag) {
      roomModifierDrag.openOnRelease = true;
      return;
    }
    const hadModifierSelection = roomModifierSelectionActive;
    roomModifierSelectionActive = false;
    if (!hadModifierSelection || roomSelectionMode || !roomMultiSelection.length) return;
    if (currentConfig().kind !== "staff" || currentPage !== "rooms") return;
    if ($("#roomBatchDialog")?.open) return;
    openRoomBatchDialog(true);
  }
  function roomReservationOverlaps(roomId, day, part, seat) {
    return (state.roomReservations || []).find(item => item.roomId === roomId && item.day === day && item.seat === seat && partsOverlap(item.part, part));
  }
  function clearRoomSlot(roomId, day, part, seat) {
    state.roomAssignments = state.roomAssignments.filter(existing => !(existing.roomId === roomId && existing.day === day && existing.seat === seat && partsOverlap(existing.part, part)));
    state.roomReservations = (state.roomReservations || []).filter(existing => !(existing.roomId === roomId && existing.day === day && existing.seat === seat && partsOverlap(existing.part, part)));
  }
  function updateRoomModeUi(prefix) {
    const mode = $(`#${prefix}Mode`)?.value || "client";
    $(`#${prefix}ClientWrap`)?.classList.toggle("hidden", mode === "free");
    const label = $(`#${prefix}ClientLabel`);
    if (label) label.textContent = mode === "reserved" ? "Gereserveerd voor" : "Mediënt";
    if (prefix === "roomAssignment") {
      updateRoomCustomTimeUi();
      const submit = $("#roomAssignmentForm button[type=submit]");
      if (submit) submit.textContent = mode === "reserved" ? "Reservering opslaan" : mode === "free" ? "Werkplek vrijmaken" : "Plaatsing opslaan";
    }
    $(`#${prefix}ConflictMessage`)?.classList.add("hidden");
  }

  function renderRoomSchedule() {
    if (currentConfig().kind !== "staff") return;
    if (!["multimedia", "it"].includes(state.roomTab)) state.roomTab = currentConfig().department === "it" ? "it" : "multimedia";
    state.roomView = "week";
    $$('[data-room-department]').forEach(button => {
      const active = button.dataset.roomDepartment === state.roomTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    const departmentRooms = rooms.filter(room => room.department === state.roomTab);
    let selectedRoomId = state.roomSelectedRoom[state.roomTab];
    if (selectedRoomId !== "all" && !departmentRooms.some(room => room.id === selectedRoomId)) selectedRoomId = departmentRooms[0]?.id;
    if (!selectedRoomId) selectedRoomId = departmentRooms[0]?.id;
    state.roomSelectedRoom[state.roomTab] = selectedRoomId;
    $("#roomLocationTabs").innerHTML = [...departmentRooms, { id:"all", name:"Toon alle" }].map(room => `<button class="${selectedRoomId === room.id ? "active" : ""}" data-room-location="${room.id}">${escapeHtml(room.name)}</button>`).join("");
    const query = $("#roomSearch").value.trim().toLowerCase();
    $("#roomSearchResult").innerHTML = query ? roomSearchResultHtml(query) : "";
    $("#roomGrid").innerHTML = roomWeekHtml(selectedRoomId);
    $("#roomAuditList").innerHTML = state.roomAudit.slice(0, 12).map(log => `<div class="room-audit-row"><strong>${escapeHtml(log.staff)}</strong><span>${escapeHtml(log.text)}</span><time>${formatDateTime(log.at)}</time></div>`).join("") || '<div class="empty-state"><p>Nog geen wijzigingen.</p></div>';
    bindRoomScheduleEvents();
  }

  function roomDayHtml(selectedRoomId) { return roomWeekHtml(selectedRoomId); }
  function roomPartCell() { return ""; }

  function roomWeekHtml(selectedRoomId) {
    const room = rooms.find(item => item.id === selectedRoomId) || rooms.find(item => item.department === state.roomTab);
    const departmentRooms = rooms.filter(item => item.department === state.roomTab);
    if (selectedRoomId !== "all" && !room) return emptyAgendaHtml("Kies een lokaal.");
    if (selectedRoomId === "all" && !departmentRooms.length) return emptyAgendaHtml("Geen lokalen gevonden.");
    const query = $("#roomSearch").value.trim().toLowerCase();
    const periods = [["morning", "Ochtend"], ["afternoon", "Middag"]];
    const selectedCount = roomMultiSelection.length;
    const sections = selectedRoomId === "all"
      ? periods.map(([part, label]) => roomWeekAllPeriodGroupHtml(departmentRooms, part, label, query)).join("")
      : periods.map(([part, label]) => roomWeekPeriodHtml(room, part, label, query)).join("");
    return `<div class="room-schedule-heading room-schedule-heading-compact${selectedCount ? " has-room-selection" : ""}"><div class="room-selection-guide">${roomSelectionMode ? "Klik op vakjes om ze te selecteren of te deselecteren." : "Meerdere vakjes? Schakel selecteren in of gebruik Ctrl/Cmd + klik."}</div><div class="room-multi-actions"><button class="secondary-button room-select-mode${roomSelectionMode ? " active" : ""}" type="button" aria-pressed="${roomSelectionMode}" data-room-select-mode>${roomSelectionMode ? "Selecteren stoppen" : "Meerdere selecteren"}</button><strong aria-live="polite">${selectedCount ? `${selectedCount} geselecteerd` : "Geen selectie"}</strong><button class="secondary-button" type="button" data-room-batch-clear ${selectedCount ? "" : "disabled"}>Selectie wissen</button><button class="primary-button room-batch-apply" type="button" data-room-batch-apply ${selectedCount ? "" : "disabled"}>Selectie instellen</button></div></div><div class="room-week-matrix-wrap${selectedRoomId === "all" ? " room-week-matrix-wrap-all" : ""}">${sections}</div>`;
  }

  function roomWeekPeriodHtml(room, part, label, query) {
    const headers = roomDays.map(([, dayLabel]) => `<div class="room-matrix-day-header"><span>${dayLabel}</span></div>`).join("");
    const rows = Array.from({ length: room.seats }, (_, index) => {
      const seat = index + 1;
      const cells = roomDays.map(([day]) => `<div class="room-matrix-slot${day === "vr" && part === "afternoon" ? " friday-closed" : ""}">${roomWeekSeatHtml(room, day, part, seat, query)}</div>`).join("");
      return `<div class="room-matrix-seat-label">Plek ${seat}</div>${cells}`;
    }).join("");
    return `<section class="room-period-section room-period-${part}"><div class="room-period-title"><span>${label}</span></div><div class="room-week-matrix"><div class="room-matrix-corner" aria-hidden="true"></div>${headers}${rows}</div></section>`;
  }


  function roomWeekAllPeriodGroupHtml(departmentRooms, part, label, query) {
    return `<section class="room-period-group room-period-group-${part}"><div class="room-period-group-title">${label}</div><div class="room-period-group-rooms">${departmentRooms.map(room => roomWeekRoomSectionHtml(room, part, query)).join("")}</div></section>`;
  }

  function roomWeekRoomSectionHtml(room, part, query) {
    const headers = roomDays.map(([, dayLabel]) => `<div class="room-matrix-day-header"><span>${dayLabel}</span></div>`).join("");
    const rows = Array.from({ length: room.seats }, (_, index) => {
      const seat = index + 1;
      const cells = roomDays.map(([day]) => `<div class="room-matrix-slot${day === "vr" && part === "afternoon" ? " friday-closed" : ""}">${roomWeekSeatHtml(room, day, part, seat, query)}</div>`).join("");
      return `<div class="room-matrix-seat-label">Plek ${seat}</div>${cells}`;
    }).join("");
    return `<section class="room-period-section room-period-${part} room-period-room-section"><div class="room-period-title"><span>${escapeHtml(room.name)}</span></div><div class="room-week-matrix"><div class="room-matrix-corner" aria-hidden="true"></div>${headers}${rows}</div></section>`;
  }

  function roomWeekSeatHtml(room, day, part, seat, query) {
    if (day === "vr" && part === "afternoon") return '<div class="room-matrix-closed" aria-label="Vrijdagmiddag gesloten"></div>';
    const assignment = state.roomAssignments.find(item => item.roomId === room.id && item.day === day && item.seat === seat && (item.part === "full" || item.part === part));
    const reservation = roomReservationOverlaps(room.id, day, part, seat);
    const selected = roomCellIsSelected(room.id, day, part, seat) ? " multi-selected" : "";
    const common = `data-room-cell data-room-id="${room.id}" data-room-day="${day}" data-room-part="${part}" data-room-seat="${seat}"`;
    if (reservation && !assignment) {
      const reservedFor = reservation.reservedFor || "";
      const label = reservedFor ? rosterShortName(reservedFor) : "Gereserveerd";
      const fullLabel = reservedFor ? `Gereserveerd voor ${reservedFor}` : "Gereserveerd";
      const lockIcon = '<svg class="room-reservation-lock" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
      return `<button class="week-seat week-reserved-slot${selected}" ${common} data-room-reservation="${reservation.id}" title="${escapeHtml(fullLabel)}" aria-label="Plek ${seat}: ${escapeHtml(fullLabel)}"><strong>Plek ${seat}</strong><small class="room-reservation-label">${lockIcon}<span class="room-reservation-name">${escapeHtml(label)}</span></small></button>`;
    }
    if (!assignment) return `<button class="week-seat week-empty-slot${selected}" ${common}><strong>Plek ${seat}</strong><small>Vrij</small></button>`;
    if (query && !clientFullName(assignment.client).toLowerCase().includes(query)) return `<button class="week-seat filtered-occupied${selected}" ${common} data-room-assignment="${assignment.id}"><strong>Plek ${seat}</strong><small>Bezet</small></button>`;
    const customTime = roomRosterCustomTimeMeta(assignment, part);
    return `<button class="week-seat week-person week-person-${part}${customTime.className}${selected}" ${common} data-room-assignment="${assignment.id}"${customTime.tooltip ? ` title="${escapeHtml(customTime.tooltip)}"` : ""}><strong title="${escapeHtml(clientFullName(assignment.client))}">${escapeHtml(rosterShortName(assignment.client))}</strong><small>Plek ${seat}</small>${customTime.html}</button>`;
  }

  function roomWeekCellHtml(room, day, part, query) {
    return Array.from({ length: room.seats }, (_, index) => roomWeekSeatHtml(room, day, part, index + 1, query)).join("");
  }

  function roomSearchResultHtml(query) {
    const names = [...new Set(state.roomAssignments.map(item => item.client))].filter(name => clientFullName(name).toLowerCase().includes(query));
    if (!names.length) return `<div class="panel room-search-result"><strong>Geen mediënt gevonden</strong><span>Probeer een andere naam.</span></div>`;
    return names.map(name => `<section class="panel room-search-result"><header><div class="person-mini-avatar">${escapeHtml(name[0])}</div><div><span>Vaste weekindeling</span><h2 title="${escapeHtml(clientFullName(name))}">${escapeHtml(clientDisplayName(name))}</h2></div></header><div class="searched-week">${roomDays.map(([day, label]) => { const entries = state.roomAssignments.filter(item => item.client === name && item.day === day); const first = entries[0]; return `<button class="searched-day ${entries.length ? "present" : ""}" ${first ? `data-search-day="${day}" data-search-room="${first.roomId}"` : "disabled"}><strong>${label.slice(0, 2)}</strong>${entries.length ? entries.map(item => { const room = rooms.find(value => value.id === item.roomId); return `<span>${escapeHtml(room.name)} · plek ${item.seat}<small>${roomPartLabel(item.part)}${item.laterStart || item.earlyLeave ? ` · ${roomAssignmentTimeRange(item).start}–${roomAssignmentTimeRange(item).end}` : ""}</small></span>`; }).join("") : "<span>Niet aanwezig</span>"}</button>`; }).join("")}</div></section>`).join("");
  }

  // Ctrl/Cmd + slepen verzamelt vakken over het gevolgde muispad.
  // We passen alleen de geselecteerde DOM-vakken aan; het rooster tijdens
  // een pointergesture opnieuw renderen zou de drag onderbreken.
  function addRoomDraggedCell(button) {
    if (!button?.hasAttribute("data-room-cell") || !$("#roomGrid")?.contains(button)) return;
    const cell = {
      roomId: button.dataset.roomId, day: button.dataset.roomDay,
      part: button.dataset.roomPart, seat: Number(button.dataset.roomSeat),
      assignmentId: button.dataset.roomAssignment || null,
      reservationId: button.dataset.roomReservation || null
    };
    const key = roomCellKey(cell.roomId, cell.day, cell.part, cell.seat);
    if (roomMultiSelection.some(item => item.key === key)) return;
    roomMultiSelection.push({ ...cell, key });
    button.classList.add("multi-selected");
    $("#roomGrid .room-schedule-heading")?.classList.add("has-room-selection");
    const counter = $("#roomGrid .room-multi-actions strong");
    if (counter) counter.textContent = `${roomMultiSelection.length} geselecteerd`;
    $("[data-room-batch-clear]")?.removeAttribute("disabled");
    $("[data-room-batch-apply]")?.removeAttribute("disabled");
  }

  function beginRoomModifierDrag(event) {
    if (event.button !== 0 || !(event.ctrlKey || event.metaKey) || roomSelectionMode ||
        currentConfig().kind !== "staff" || currentPage !== "rooms" || $("#roomBatchDialog")?.open) return;
    const first = event.target.closest("button[data-room-cell]");
    if (!first || !$("#roomGrid")?.contains(first)) return;
    roomModifierDrag = {
      pointerId: event.pointerId, first, moved: false, openOnRelease: false,
      x: event.clientX, y: event.clientY
    };
    document.body.classList.add("room-modifier-drag");
  }

  function moveRoomModifierDrag(event) {
    const drag = roomModifierDrag;
    if (!drag || drag.pointerId !== event.pointerId || drag.openOnRelease || !(event.buttons & 1)) return;
    // Ook snelle bewegingen pakken de tussengelegen vakken mee.
    const distance = Math.max(Math.abs(event.clientX - drag.x), Math.abs(event.clientY - drag.y));
    const steps = Math.max(1, Math.ceil(distance / 12));
    for (let index = 1; index <= steps; index++) {
      const x = drag.x + (event.clientX - drag.x) * index / steps;
      const y = drag.y + (event.clientY - drag.y) * index / steps;
      const button = document.elementFromPoint(x, y)?.closest("button[data-room-cell]");
      if (!button || !$("#roomGrid")?.contains(button)) continue;
      if (button !== drag.first && !drag.moved) {
        drag.moved = true;
        roomModifierSelectionActive = true;
        addRoomDraggedCell(drag.first);
      }
      if (drag.moved) addRoomDraggedCell(button);
    }
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (drag.moved) event.preventDefault();
  }

  function endRoomModifierDrag(event) {
    const drag = roomModifierDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    roomModifierDrag = null;
    document.body.classList.remove("room-modifier-drag");
    if (drag.moved) {
      // Pointerup kan nog een click genereren: die mag geen plaatsing openen
      // of een geselecteerd vak weer deselecteren.
      roomSuppressDragClick = true;
      setTimeout(() => { roomSuppressDragClick = false; }, 0);
    }
    if (drag.openOnRelease && drag.moved) {
      finishRoomModifierSelection({ key:"Control", ctrlKey:false, metaKey:false });
    }
  }

  function bindRoomScheduleEvents() {
    $$('[data-room-location]').forEach(button => button.addEventListener("click", () => {
      state.roomSelectedRoom[state.roomTab] = button.dataset.roomLocation;
      roomMultiSelection = [];
      saveState(); renderRoomSchedule();
    }));
    $$('[data-room-cell]').forEach(button => button.addEventListener("click", event => {
      const cell = { roomId: button.dataset.roomId, day: button.dataset.roomDay, part: button.dataset.roomPart, seat: Number(button.dataset.roomSeat), assignmentId: button.dataset.roomAssignment || null, reservationId: button.dataset.roomReservation || null };
      if (roomSelectionMode || event.ctrlKey || event.metaKey) {
        event.preventDefault();
        if (!roomSelectionMode && (event.ctrlKey || event.metaKey)) roomModifierSelectionActive = true;
        toggleRoomCellSelection(cell);
        return;
      }
      openRoomAssignment(cell.roomId, cell.seat, cell.assignmentId, cell.part, cell.day, cell.reservationId);
    }));
    $$('[data-search-day]').forEach(button => button.addEventListener("click", () => {
      const room = rooms.find(item => item.id === button.dataset.searchRoom);
      state.roomTab = room.department;
      state.roomView = "week";
      state.roomSelectedRoom[room.department] = room.id;
      roomMultiSelection = [];
      saveState(); renderRoomSchedule();
    }));
    $('[data-room-batch-clear]')?.addEventListener("click", clearRoomMultiSelection);
    $('[data-room-select-mode]')?.addEventListener("click", () => {
      roomSelectionMode = !roomSelectionMode;
      roomModifierSelectionActive = false;
      renderRoomSchedule();
    });
    $('[data-room-batch-apply]')?.addEventListener("click", () => openRoomBatchDialog());
  }

  function openRoomBatchDialog(fromModifier = false) {
    if (currentConfig().kind !== "staff" || !roomMultiSelection.length) return;
    if ($("#roomBatchDialog").open) return;
    roomBatchOpenedFromModifier = fromModifier;
    const clients = data.people.filter(person => person.type === "client");
    $("#roomBatchClient").innerHTML = '<option value="">Kies mediënt</option>' + clients.map(client => `<option value="${escapeHtml(client.name)}">${escapeHtml(clientFullName(client.name))} · ${client.department === "it" ? "IT" : "Multimedia"}</option>`).join("");
    $("#roomBatchClient").value = "";
    $("#roomBatchMode").value = "client";
    $("#roomBatchConflictMessage").classList.add("hidden");
    updateRoomModeUi("roomBatch");
    $("#roomBatchContext").textContent = `${roomMultiSelection.length} ${roomMultiSelection.length === 1 ? "vakje" : "vakjes"} geselecteerd.`;
    $("#roomBatchDialog").showModal();
  }

  function saveRoomBatchSelection() {
    if (currentConfig().kind !== "staff" || !roomMultiSelection.length) return false;
    const mode = $("#roomBatchMode").value;
    const client = $("#roomBatchClient").value;
    const selected = [...roomMultiSelection];
    const error = $("#roomBatchConflictMessage");
    const fail = message => {
      error.textContent = message;
      error.classList.remove("hidden");
      return false;
    };
    error.classList.add("hidden");
    if ((mode === "client" || mode === "reserved") && !client) {
      return fail("Kies eerst voor welke mediënt je de vakjes wilt instellen.");
    }
    const covers = (item, cell) => item.roomId === cell.roomId && item.day === cell.day && Number(item.seat) === Number(cell.seat) && partsOverlap(item.part, cell.part);
    const replaced = item => selected.some(cell => covers(item, cell));

    if (mode === "client") {
      // A mediënt cannot be assigned twice in overlapping time slots.
      for (let i = 0; i < selected.length; i++) {
        for (let k = i + 1; k < selected.length; k++) {
          const a = selected[i], b = selected[k];
          if (a.day === b.day && partsOverlap(a.part, b.part)) {
            return fail("Er zijn overlappende tijdvakken geselecteerd voor dezelfde mediënt. Kies per dag één werkplek per dagdeel.");
          }
        }
      }
      const conflicting = state.roomAssignments.find(item => item.client === client && !replaced(item) && selected.some(cell => item.day === cell.day && partsOverlap(item.part, cell.part)));
      if (conflicting) {
        const existingRoom = rooms.find(room => room.id === conflicting.roomId);
        return fail(`${client} is op ${roomDays.find(([day]) => day === conflicting.day)?.[1] || conflicting.day} tijdens ${roomPartLabel(conflicting.part).toLowerCase()} al ingepland in ${existingRoom?.name || "een ander lokaal"}, plek ${conflicting.seat}. Pas die plaatsing eerst aan.`);
      }
    }
    const affectedEntries = state.roomAssignments.filter(replaced);
    const affectedReservations = (state.roomReservations || []).filter(replaced);
    if ((affectedEntries.length || affectedReservations.length) && !window.confirm(`Let op: op de geselecteerde tijdvakken staan ${affectedEntries.length} bestaande plaatsing(en) en ${affectedReservations.length} reservering(en). Deze worden vervangen. Doorgaan?`)) return false;

    const affectedClients = new Set(affectedEntries.map(item => item.client));
    // First clear the selection as one transaction. Never silently evict the
    // chosen mediënt from an unrelated workstation.
    selected.forEach(cell => clearRoomSlot(cell.roomId, cell.day, cell.part, cell.seat));
    if (mode === "client") {
      selected.forEach(cell => state.roomAssignments.push({ id:createId("room"), roomId:cell.roomId, seat:cell.seat, day:cell.day, part:cell.part, client }));
      affectedClients.add(client);
    } else if (mode === "reserved") {
      selected.forEach(cell => state.roomReservations.push({ id:createId("reserved"), roomId:cell.roomId, seat:cell.seat, day:cell.day, part:cell.part, reservedFor:client }));
    }
    affectedClients.forEach(syncClientWeekdaysFromAssignments);
    const text = mode === "client" ? `${client} in ${selected.length} roostervakjes ingepland` : mode === "reserved" ? `${selected.length} roostervakjes gereserveerd voor ${client}` : `${selected.length} roostervakjes vrijgemaakt`;
    state.roomAudit.unshift({ id:createId("log"), at:new Date().toISOString(), staff:currentAccountName(), text });
    roomMultiSelection = [];
    roomSelectionMode = false;
    saveState(); renderRoomSchedule(); renderStaffDashboard();
    if (currentPage === "client-detail" && selectedClientName && affectedClients.has(selectedClientName)) renderClientDetail();
    showToast(mode === "client" ? `Rooster voor ${client} bijgewerkt.` : mode === "reserved" ? "Geselecteerde plekken gereserveerd." : "Geselecteerde plekken vrijgemaakt.");
    return true;
  }

  function openRoomAssignment(roomId, seat, assignmentId = null, presetPart = "full", presetDay = state.roomDay, reservationId = null) {
    if ((roleConfig[state.role] || roleConfig["client-mm"]).kind !== "staff") return;
    const room = rooms.find(item => item.id === roomId);
    const assignment = state.roomAssignments.find(item => item.id === assignmentId);
    const chosenDay = assignment?.day || presetDay;
    const chosenPart = assignment?.part || presetPart;
    const reservation = (state.roomReservations || []).find(item => item.id === reservationId) || (!assignment ? roomReservationOverlaps(roomId, chosenDay, chosenPart, seat) : null);
    $("#roomAssignmentId").value = assignment?.id || "";
    $("#roomAssignmentRoom").value = roomId;
    $("#roomAssignmentSeat").value = seat;
    $("#roomAssignmentMode").value = assignment ? "client" : reservation ? "reserved" : "client";
    $("#roomAssignmentTitle").textContent = assignment ? "Plaatsing bewerken" : reservation ? "Reservering bewerken" : "Werkplek instellen";
    $("#roomAssignmentDay").value = chosenDay;
    const dayLabel = roomDays.find(([day]) => day === chosenDay)?.[1] || chosenDay;
    $("#roomAssignmentContext").textContent = `${room.name} · plek ${seat} · ${dayLabel} · ${roomPartLabel(chosenPart)}`;
    const clients = data.people.filter(person => person.type === "client");
    $("#roomAssignmentClient").innerHTML = '<option value="">Kies mediënt</option>' + clients.map(client => `<option value="${escapeHtml(client.name)}">${escapeHtml(clientFullName(client.name))} · ${client.department === "it" ? "IT" : "Multimedia"}</option>`).join("");
    $("#roomAssignmentClient").value = assignment?.client || reservation?.reservedFor || "";
    updateRoomPartOptions(chosenDay, chosenPart);
    const standardTimes = roomStandardTimes(chosenDay, chosenPart);
    $("#roomLaterStartEnabled").checked = Boolean(assignment?.laterStart);
    $("#roomEarlyLeaveEnabled").checked = Boolean(assignment?.earlyLeave);
    $("#roomLaterStartTime").value = assignment?.laterStart || standardTimes.start;
    $("#roomEarlyLeaveTime").value = assignment?.earlyLeave || standardTimes.end;
    // Show saved exceptions during editing; new placements start compact.
    $("#roomCustomTimes").open = Boolean(assignment?.laterStart || assignment?.earlyLeave);
    updateRoomCustomTimeUi();
    $("#deleteRoomAssignmentButton").classList.toggle("hidden", !assignment && !reservation);
    $("#roomConflictMessage").classList.add("hidden");
    updateRoomModeUi("roomAssignment");
    $("#roomAssignmentDialog").showModal();
  }

  function updateRoomPartOptions(day, selected = "full") {
    $("#roomAssignmentPart").value = day === "vr" ? "morning" : selected;
  }

  function partsOverlap(a, b) { return a === "full" || b === "full" || a === b; }
  function roomConflict(id, roomId, seat, client, part, day) {
    return state.roomAssignments.find(item => item.id !== id && item.day === day && partsOverlap(item.part, part) && ((item.roomId === roomId && item.seat === seat) || item.client === client));
  }

  function reservationIdForRoomEdit(roomId, day, part, seat) {
    return roomReservationOverlaps(roomId, day, part, seat)?.id || null;
  }

  function saveRoomAssignment() {
    if ((roleConfig[state.role] || roleConfig["client-mm"]).kind !== "staff") return false;
    const existingId = $("#roomAssignmentId").value;
    const mode = $("#roomAssignmentMode").value;
    const roomId = $("#roomAssignmentRoom").value;
    const seat = Number($("#roomAssignmentSeat").value);
    const client = $("#roomAssignmentClient").value;
    const day = $("#roomAssignmentDay").value;
    const part = day === "vr" ? "morning" : $("#roomAssignmentPart").value;
    const standardTimes = roomStandardTimes(day, part);
    const laterStart = $("#roomLaterStartEnabled").checked ? $("#roomLaterStartTime").value : "";
    const earlyLeave = $("#roomEarlyLeaveEnabled").checked ? $("#roomEarlyLeaveTime").value : "";
    const previous = state.roomAssignments.find(item => item.id === existingId);
    const existingReservationId = reservationIdForRoomEdit(roomId, day, part, seat);
    const affected = new Set(previous?.client ? [previous.client] : []);
    if ((mode === "client" || mode === "reserved") && !client) {
      $("#roomConflictMessage").textContent = "Kies voor wie je deze werkplek wilt inplannen of reserveren.";
      $("#roomConflictMessage").classList.remove("hidden");
      return false;
    }
    if (mode === "client") {
      const conflict = roomConflict(existingId, roomId, seat, client, part, day);
      const reserved = roomReservationOverlaps(roomId, day, part, seat);
      if (conflict) {
        $("#roomConflictMessage").textContent = conflict.client === client ? `${client} staat dit dagdeel al ergens ingepland.` : `Deze werkplek is dit dagdeel al bezet door ${conflict.client}.`;
        $("#roomConflictMessage").classList.remove("hidden");
        return false;
      }
      if (!client) return false;
      if (laterStart && laterStart <= standardTimes.start) {
        $("#roomConflictMessage").textContent = `Later starten moet na ${standardTimes.start} zijn.`;
        $("#roomConflictMessage").classList.remove("hidden");
        return false;
      }
      if (earlyLeave && earlyLeave >= standardTimes.end) {
        $("#roomConflictMessage").textContent = `Eerder weg moet vóór ${standardTimes.end} zijn.`;
        $("#roomConflictMessage").classList.remove("hidden");
        return false;
      }
      const effectiveStart = laterStart || standardTimes.start;
      const effectiveEnd = earlyLeave || standardTimes.end;
      if (effectiveStart >= effectiveEnd) {
        $("#roomConflictMessage").textContent = "De starttijd moet vóór de eindtijd liggen.";
        $("#roomConflictMessage").classList.remove("hidden");
        return false;
      }
    }
    clearRoomSlot(roomId, day, part, seat);
    if (existingId) state.roomAssignments = state.roomAssignments.filter(item => item.id !== existingId);
    if (mode === "client") {
      state.roomAssignments.push({ id:existingId || createId("room"), roomId, seat, day, part, client, laterStart: laterStart || null, earlyLeave: earlyLeave || null });
      affected.add(client);
    } else if (mode === "reserved") {
      state.roomReservations.push({ id:existingReservationId || createId("reserved"), roomId, seat, day, part, reservedFor:client });
    }
    affected.forEach(syncClientWeekdaysFromAssignments);
    const room=rooms.find(item=>item.id===roomId); const dayLabel=roomDays.find(([v])=>v===day)?.[1]||day;
    const customTimeText = mode === "client" && (laterStart || earlyLeave) ? ` · ${laterStart || standardTimes.start}–${earlyLeave || standardTimes.end}` : "";
    const text=mode === "client" ? `${client} ingepland op ${room.name} · plek ${seat} · ${dayLabel.toLowerCase()} ${roomPartLabel(part).toLowerCase()}${customTimeText}` : mode === "reserved" ? `${room.name} · plek ${seat} gereserveerd voor ${client} · ${dayLabel.toLowerCase()} ${roomPartLabel(part).toLowerCase()}` : `${room.name} · plek ${seat} vrijgemaakt · ${dayLabel.toLowerCase()} ${roomPartLabel(part).toLowerCase()}`;
    state.roomAudit.unshift({ id:createId("log"), at:new Date().toISOString(), staff:currentAccountName(), text });
    saveState(); renderRoomSchedule(); renderStaffDashboard();
    if (currentPage === "client-detail" && selectedClientName && affected.has(selectedClientName)) renderClientDetail();
    showToast(mode === "client" ? "Lokaalrooster bijgewerkt." : mode === "reserved" ? "Werkplek gereserveerd." : "Werkplek vrijgemaakt.");
    return true;
  }

  function deleteRoomAssignment() {
    const id=$("#roomAssignmentId").value;
    const previous=state.roomAssignments.find(item=>item.id===id);
    const roomId=$("#roomAssignmentRoom").value, seat=Number($("#roomAssignmentSeat").value), day=$("#roomAssignmentDay").value, part=day === "vr" ? "morning" : $("#roomAssignmentPart").value;
    clearRoomSlot(roomId,day,part,seat);
    if (id) state.roomAssignments=state.roomAssignments.filter(item=>item.id!==id);
    if (previous?.client) syncClientWeekdaysFromAssignments(previous.client);
    state.roomAudit.unshift({id:createId("log"),at:new Date().toISOString(),staff:currentAccountName(),text:`Werkplek vrijgemaakt · plek ${seat}`});
    saveState(); renderRoomSchedule(); renderStaffDashboard(); $("#roomAssignmentDialog").close(); showToast("Werkplek vrijgemaakt.");
  }

  // Calendar selections are ephemeral. The range can span weekends even though they are hidden.
  let calendarRange = null;
  let calendarAnchor = null;
  let calendarDrag = null;
  function normalizedCalendarRange(a, b = a) {
    return { start: a <= b ? a : b, end: a <= b ? b : a };
  }
  function markCalendarRange() {
    $$('#calendarLarge [data-calendar-date]').forEach(button => {
      const day = button.dataset.calendarDate;
      const inRange = !!calendarRange && day >= calendarRange.start && day <= calendarRange.end;
      button.classList.toggle('range-selected', inRange);
      button.classList.toggle('range-first', inRange && day === calendarRange.start);
      button.classList.toggle('range-last', inRange && day === calendarRange.end);
    });
    const help = $('#calendarHelp');
    if (help && calendarRange && calendarRange.start !== calendarRange.end) {
      help.textContent = `${formatDate(calendarRange.start)} t/m ${formatDate(calendarRange.end)} geselecteerd. Kies ‘Nieuwe afspraak’ om deze periode te gebruiken.`;
    } else if (help && !calendarRange && state.agendaView === 'month') {
      help.textContent = 'Selecteer een periode door te slepen of met Shift + klik. Klik op Nieuwe afspraak om de datums over te nemen.';
    }
  }
  function calendarItemOnDate(item, iso) {
    return item.date <= iso && (item.endDate || item.date) >= iso;
  }
  function agendaDateLabel(item) {
    return item.endDate && item.endDate > item.date
      ? `${formatDate(item.date)} t/m ${formatDate(item.endDate)}` : formatDate(item.date);
  }

  function sortedAgendaItems() {
    return [...state.agendaItems].sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
  }
  function calendarAnnouncementEvents() {
    const staffView = currentConfig().kind === "staff";
    return state.messages.filter(message => isEventAnnouncement(message)
      && message.eventAt && !Number.isNaN(new Date(message.eventAt).getTime())
      && (staffView || ((message.audience === "all" || message.audience === currentConfig().department)
        && eventResponseFor(message)?.status === "yes"))).map(message => {
      const at = new Date(message.eventAt);
      return {
        id: `announcement-${message.id}`, eventId: message.id, category: "event",
        title: message.title, titleHtml: message.titleHtml, description: message.text,
        date: dateToIso(at), start: `${String(at.getHours()).padStart(2,"0")}:${String(at.getMinutes()).padStart(2,"0")}`,
        end: "", eventLocation: message.eventLocation || ""
      };
    });
  }
  function visibleAgendaItems() {
    const normal = sortedAgendaItems().filter(item => {
      if (item.title.trim().toLowerCase() === "pauze" || item.category === "event") return false;
      if (currentConfig().kind === "staff") return item.category === "vacation" && item.createdByKind === "staff" || item.owner === state.role || item.createdByRole === state.role || (item.createdByKind === "staff" && item.createdBy === currentAccountName());
      // Vakanties van begeleiders zijn voor iedere mediënt zichtbaar, maar uitsluitend ter inzage.
      if (item.category === "vacation" && item.createdByKind === "staff") return true;
      return (item.owner === state.role || item.client === currentAccountName()) && item.responseStatus !== "declined";
    });
    return [...normal, ...calendarAnnouncementEvents()]
      .sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
  }
  function appointmentResponseLabel(status) {
    return { pending: "Reactie nodig", accepted: "Geaccepteerd", declined: "Geweigerd" }[status] || "";
  }
  function agendaEntryHtml(item, compact = false, dateInCopy = false) {
    const description = item.description ? `<div class="agenda-entry-description rich-text-content">${richTextHtml(item.description)}</div>` : "";
    const location = item.eventLocation ? `<small class="agenda-entry-location">${lucideIcon("map-pin")} ${escapeHtml(item.eventLocation)}</small>` : "";
    const rangeInfo = !compact && item.endDate && item.endDate > item.date
      ? `<small class="agenda-entry-range">${escapeHtml(agendaDateLabel(item))}</small>` : "";
    const response = item.requiresResponse ? `<span class="appointment-status status-${item.responseStatus || "pending"}">${appointmentResponseLabel(item.responseStatus || "pending")}</span>` : "";
    const inlineDate = compact && dateInCopy ? `<small class="agenda-entry-date rail-agenda-date">${agendaDateLabel(item)}</small>` : "";
    const date = compact && !dateInCopy ? `<span class="agenda-entry-date">${agendaDateLabel(item)}</span>` : "";
    const readOnlyVacation = item.category === "vacation" && currentConfig().kind === "client";
    const eventAction = readOnlyVacation ? "" : item.eventId && item.category === "event"
      ? `data-open-announcement-event="${escapeHtml(item.eventId)}"`
      : currentConfig().kind === "client" && item.requiresResponse
        ? `data-open-appointment-response="${item.id}"` : `data-edit-agenda="${item.id}"`;
    const tag = readOnlyVacation ? "article" : "button";
    return `<${tag} class="agenda-entry${compact ? " agenda-entry-compact" : ""} category-${item.category}${readOnlyVacation ? " agenda-entry-readonly" : ""}" ${eventAction}${readOnlyVacation ? "" : ` title="${item.requiresResponse ? "Afspraakvoorstel bekijken" : "Afspraak bewerken"}"`}>
      <span class="agenda-category-dot"></span>
      <span class="agenda-entry-time">${escapeHtml(agendaTime(item))}</span>
      <span class="agenda-entry-copy"><strong>${richTitleHtml(item)}</strong>${item.category === "vacation" ? `<small>Vakantie · ${escapeHtml(item.createdBy || "Begeleider")}</small>` : ""}${inlineDate}${rangeInfo}${location}${description}${response}</span>
      ${date}
      ${readOnlyVacation ? "" : '<span class="agenda-edit-mark">›</span>'}
    </${tag}>`;
  }
  function emptyAgendaHtml(message) {
    return `<div class="empty-state"><span>◷</span><p>${escapeHtml(message)}</p></div>`;
  }
  // Compacte kaarten zijn exclusief voor Upcoming; kalenderdag- en weekkaarten blijven ongemoeid.
  function upcomingTypeLabel(item) {
    return { vacation: "Vakantie", event: "Evenement", announcement: "Mededeling" }[item.category] || "Afspraak";
  }
  function upcomingTypeIcon(item) {
    return { vacation: "luggage", event: "party-popper", announcement: "message-square-text" }[item.category] || "calendar-check";
  }
  function upcomingAgendaCardHtml(item) {
    const label = upcomingTypeLabel(item);
    const kind = item.category === "vacation" ? "vacation" : item.category === "event" ? "event" : item.category === "announcement" ? "announcement" : "appointment";
    const readOnly = kind === "vacation" && currentConfig().kind === "client";
    const action = readOnly ? "" : item.eventId && kind === "event"
      ? `data-open-announcement-event="${escapeHtml(item.eventId)}"`
      : currentConfig().kind === "client" && item.requiresResponse
        ? `data-open-appointment-response="${escapeHtml(item.id)}"`
        : `data-edit-agenda="${escapeHtml(item.id)}"`;
    const tag = readOnly ? "article" : "button";
    const when = agendaDateLabel(item);
    const owner = kind === "vacation" && item.createdBy ? ` · ${escapeHtml(item.createdBy)}` : "";
    const time = kind === "vacation" ? "" : (item.start ? ` · ${escapeHtml(agendaTime(item))}` : "");
    return `<${tag} class="upcoming-mini-card upcoming-type-${kind}${readOnly ? " upcoming-readonly" : ""}" ${readOnly ? "" : `type="button" ${action}`} aria-label="${escapeHtml(label)}: ${escapeHtml(item.title)}, ${escapeHtml(when)}">
      <span class="upcoming-mini-icon" aria-hidden="true">${lucideIcon(upcomingTypeIcon(item))}</span>
      <span class="upcoming-mini-copy"><strong>${richTitleHtml(item)}</strong><small>${escapeHtml(when)}${time}${owner}</small></span>
      <span class="upcoming-mini-pill">${label}</span>
    </${tag}>`;
  }
  function upcomingClosureHtml(item, compact = false) {
    const active = item.start <= prototypeToday();
    const dateLabel = active ? `t/m ${formatDate(item.end)}` : closureDateLabel(item);
    const editable = currentConfig().kind === "staff";
    const tag = editable ? "button" : "article";
    return `<${tag} class="upcoming-mini-card upcoming-type-closure${editable ? " closure-upcoming-clickable" : " upcoming-readonly"}" ${editable ? `type="button" data-upcoming-closure="${escapeHtml(item.id)}" title="Spectrum dicht bewerken"` : ""} aria-label="Spectrum dicht: ${escapeHtml(item.title)}, ${escapeHtml(dateLabel)}">
      <span class="upcoming-mini-icon" aria-hidden="true">${lucideIcon("lock-keyhole")}</span>
      <span class="upcoming-mini-copy"><strong>${richTitleHtml(item)}</strong><small>${escapeHtml(dateLabel)}</small></span>
      <span class="upcoming-mini-pill">Gesloten</span>
    </${tag}>`;
  }
  let nextUpcomingExpiry = null;
  let lastUpcomingDay = null;
  function renderUpcomingAgenda() {
    const now = prototypeNow();
    // Sorteer afspraken en sluitingsdagen gezamenlijk; oude afspraken blijven weg.
    const entries = [
      ...visibleAgendaItems().filter(item => agendaItemIsUpcoming(item, now))
        .map(item => ({ kind: "agenda", item, sortKey: `${item.date}T${item.start || "23:59"}:00` })),
      ...upcomingClosureItems(now)
    ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    const upcoming = entries.slice(0, 8);
    const rail = entries.slice(0, 6);
    const expiryTimes = upcoming.map(entry => entry.kind === "closure"
      ? closureExpiryDate(entry.item).getTime()
      : agendaEndDate(entry.item).getTime());
    nextUpcomingExpiry = expiryTimes.length ? Math.min(...expiryTimes) : null;
    lastUpcomingDay = prototypeToday();
    const entryHtml = (entry, inRail) => entry.kind === "closure"
      ? upcomingClosureHtml(entry.item, inRail)
      : upcomingAgendaCardHtml(entry.item);
    $("#upcomingAgendaList").innerHTML = upcoming.length
      ? upcoming.map(entry => entryHtml(entry, false)).join("")
      : emptyAgendaHtml("Geen aankomende afspraken of sluitingsdagen.");
    $("#railAgenda").innerHTML = rail.length
      ? rail.map(entry => entryHtml(entry, true)).join("")
      : emptyAgendaHtml("Geen aankomende afspraken of sluitingsdagen.");
    bindAgendaEntryEvents($("#upcomingAgendaList"));
    bindAgendaEntryEvents($("#railAgenda"));
    $$("[data-upcoming-closure]").forEach(button => button.addEventListener("click", () => {
      if (currentConfig().kind === "staff") openAgendaDialog(null, null, null, null, button.dataset.upcomingClosure);
    }));
  }
  function renderAgenda() {
    renderUpcomingAgenda();
    renderCalendars();
  }

  function renderProfile() {
    const config = roleConfig[state.role] || roleConfig["client-mm"];
    const name = accountNames[state.role] || "Maarten";
    if (config.kind === "client") syncClientWeekdaysFromAssignments(name);
    const profile = { ...(cloneDefaultState().profiles[state.role] || { email: "", contactPreference: "hub", weekdays: [] }), ...(state.profiles[state.role] || {}) };
    const department = config.department === "multimedia" ? "Multimedia" : config.department === "it" ? "IT" : "Procesbegeleiding";
    const staffView = config.kind === "staff";
    const overviewCard = document.querySelector("#page-profile .profile-overview-card");
    $("#profilePageEyebrow").textContent = staffView ? "Persoonlijke omgeving" : "Mijn account";
    $("#profilePageHeading").textContent = staffView ? "Mijn instellingen" : "Profiel";
    $("#profilePageIntro").textContent = staffView
      ? "Werkdagen, werktijden en persoonlijke voorkeuren voor jouw account."
      : "Alleen de gegevens die helpen om Spectrum Hub persoonlijk en overzichtelijk te maken.";
    $("#profilePageAvatar").textContent = name[0];
    $("#profilePageName").textContent = config.kind === "client" ? clientFullName(name) : name;
    $("#profileOverviewEyebrow").textContent = staffView ? "Ingelogd als" : "Spectrum-profiel";
    $("#profilePageRole").textContent = config.label;
    $("#profilePageRole").classList.toggle("hidden", staffView);
    $("#profileFacts").classList.toggle("hidden", staffView);
    if (overviewCard) overviewCard.classList.toggle("staff-settings-summary", staffView);
    $("#profileFacts").innerHTML = `
      <div><dt>Afdeling</dt><dd>${escapeHtml(department)}</dd></div>
      <div><dt>Account</dt><dd>${config.kind === "staff" ? "Begeleiding" : "Mediënt"}</dd></div>
      <div><dt>Aanwezigheidsstatus</dt><dd>${currentClock().active ? "Ingeklokt" : "Niet ingeklokt"}</dd></div>`;

    if (config.kind === "client") {
      const people = [
        data.people.find(person => person.id === config.fixedTrade),
        data.people.find(person => person.id === config.fixedProcess)
      ].filter(Boolean);
      $("#profileGuidanceEyebrow").textContent = "Mijn begeleiding";
      $("#profileGuidanceTitle").textContent = "Vaste aanspreekpunten";
      $("#profileGuidanceList").innerHTML = people.map(person => `<div class="profile-guidance-person"><div class="avatar">${escapeHtml(person.name[0])}</div><div><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.role)} · ${person.present ? `aanwezig ${person.start}–${person.until}` : "vandaag afwezig"}${staffPlannedToday(person) ? ` · ${staffPlannedToday(person).morning ? "ochtend" : ""}${staffPlannedToday(person).morning && staffPlannedToday(person).afternoon ? " + " : ""}${staffPlannedToday(person).afternoon ? "middag" : ""}` : ""}</span></div></div>`).join("");
    } else {
      const caseload = config.caseload || [];
      $("#profileGuidanceEyebrow").textContent = "Mijn werk";
      $("#profileGuidanceTitle").textContent = "Eigen caseload";
      $("#profileGuidanceList").innerHTML = caseload.length
        ? caseload.map(client => `<div class="profile-guidance-person"><div class="avatar">${escapeHtml(client[0])}</div><div><strong>${escapeHtml(clientDisplayName(client))}</strong><span>Toegewezen mediënt</span></div></div>`).join("")
        : `<div class="empty-state"><p>Geen mediënten toegewezen.</p></div>`;
    }

    const weekdays = [["ma","Maandag"],["di","Dinsdag"],["wo","Woensdag"],["do","Donderdag"],["vr","Vrijdag"]];
    $("#clientProfileWeekdays").innerHTML = config.kind === "client" ? clientScheduleDaysHtml(name, true) : "";
    $("#profileWeekdays").innerHTML = config.kind === "staff"
      ? staffWeekdays.map(([value,label]) => {
        const parts = staffWeekParts(profile)[value] || {};
        const savedHours = profile.weekTimes?.[value] || {};
        const start = savedHours.start || (parts.morning ? "09:00" : "13:00");
        const end = savedHours.end || (parts.afternoon ? "16:30" : "12:30");
        return `<div class="staff-shift-row"><strong>${label}</strong><label><input type="checkbox" data-shift-day="${value}" data-shift-part="morning" ${parts.morning ? "checked" : ""}> Ochtend</label><label><input type="checkbox" data-shift-day="${value}" data-shift-part="afternoon" ${parts.afternoon ? "checked" : ""}> Middag</label><label class="staff-hour-field">Van <input type="time" data-shift-day="${value}" data-shift-time="start" value="${escapeHtml(start)}"></label><label class="staff-hour-field">Tot <input type="time" data-shift-day="${value}" data-shift-time="end" value="${escapeHtml(end)}"></label></div>`;
      }).join("")
      : weekdays.map(([value,label]) => `<label class="weekday-option"><input type="checkbox" value="${value}" ${(profile.weekdays || []).includes(value) ? "checked" : ""}/><span>${label}</span></label>`).join("");
    $("#profileLinkedRooms").innerHTML = config.kind === "staff"
      ? [{ id: "multimedia", label: "Multimedia" }, { id: "it", label: "IT" }].map(group => `
        <div class="staff-local-choices-heading">${group.label}</div>
        ${rooms.filter(room => room.department === group.id).map(room => `<label class="staff-local-choice"><input type="checkbox" value="${escapeHtml(room.id)}" ${(profile.linkedRooms || []).includes(room.id) ? "checked" : ""}/><span>${escapeHtml(room.name)}</span></label>`).join("")}
      `).join("")
      : "";
    $("#profileWeekdayFieldset").disabled = config.kind === "client";
    $("#profileWeekdayHelp").textContent = config.kind === "client"
      ? "Deze dagen worden door begeleiding beheerd. Neem contact op met je begeleider als iets niet klopt."
      : "Vink je dagdelen aan. Vul alleen bij afwijkende werktijden andere begin- en eindtijden in.";
    $("#profileContactPreference").value = profile.contactPreference || "hub";
    $("#profileEmail").value = profile.email || "";
    const accountCard = document.querySelector(".account-management-card");
    if (accountCard) accountCard.classList.toggle("hidden", !currentUserIsAdmin());
    const accountList = $("#accountManagementList");
    if (accountList) accountList.innerHTML = currentUserIsAdmin()
      ? state.accounts.map(account => `<div class="account-management-row"><div><strong>${escapeHtml(account.kind === "client" ? clientFullName(account.name) : account.name)}</strong><span>${escapeHtml(accountLabel(account))}${account.isAdmin ? " · Beheerder" : ""}</span></div><button class="secondary-button" type="button" data-reset-account-password="${escapeHtml(account.id)}">Wachtwoord instellen</button></div>`).join("")
      : "";
    $$('[data-reset-account-password]').forEach(button => button.addEventListener("click", () => openAccountPasswordDialog(button.dataset.resetAccountPassword)));
  }

  function saveProfile() {
    const config = roleConfig[state.role] || roleConfig["client-mm"];
    const currentProfile = { ...(cloneDefaultState().profiles[state.role] || { email: "", contactPreference: "hub", weekdays: [] }), ...(state.profiles[state.role] || {}) };
    const weekParts = config.kind === "staff"
      ? Object.fromEntries(staffWeekdays.map(([day]) => [day, {
          morning: !!$("#profileWeekdays input[data-shift-day='" + day + "'][data-shift-part='morning']")?.checked,
          afternoon: !!$("#profileWeekdays input[data-shift-day='" + day + "'][data-shift-part='afternoon']")?.checked
        }]))
      : currentProfile.weekParts;
    const weekTimes = config.kind === "staff" ? Object.fromEntries(staffWeekdays.map(([day]) => {
      const start = $("#profileWeekdays input[data-shift-day='" + day + "'][data-shift-time='start']")?.value || "";
      const end = $("#profileWeekdays input[data-shift-day='" + day + "'][data-shift-time='end']")?.value || "";
      return [day, { start, end }];
    })) : currentProfile.weekTimes;
    if (config.kind === "staff") {
      for (const [day] of staffWeekdays) {
        const chosen = weekParts[day];
        if (!chosen.morning && !chosen.afternoon) continue;
        const { start, end } = weekTimes[day];
        if (!start || !end || start >= end || (chosen.morning && (start >= "12:30" || end <= "09:00")) || (chosen.afternoon && (start >= "16:30" || end <= "13:00"))) {
          showToast(`Controleer de tijden op ${staffWeekdays.find(item => item[0] === day)[1].toLowerCase()}.`);
          return;
        }
      }
    }
    const weekdays = config.kind === "client" ? currentProfile.weekdays
      : staffWeekdays.filter(([day]) => weekParts[day].morning || weekParts[day].afternoon).map(([day]) => day);
    const allowed = new Set(rooms.map(room => room.id));
    const linkedRooms = config.kind === "staff"
      ? $$("#profileLinkedRooms input:checked").map(input => input.value).filter(id => allowed.has(id))
      : (currentProfile.linkedRooms || []);
    state.profiles[state.role] = {
      ...currentProfile,
      email: $("#profileEmail").value.trim(),
      contactPreference: $("#profileContactPreference").value,
      weekdays,
      weekParts,
      weekTimes,
      linkedRooms
    };
    saveState();
    if (config.kind === "staff") { renderStaffLocalWidgets(); renderAttendance(); renderGuidanceWeek(); }
    showToast("Je profiel is opgeslagen.");
  }
  function saveOwnPassword() {
    const password = $("#profileNewPassword").value;
    const confirm = $("#profileConfirmPassword").value;
    if (password.length < 4) { showToast("Gebruik minimaal 4 tekens voor het wachtwoord."); return false; }
    if (password !== confirm) { showToast("De wachtwoorden zijn niet hetzelfde."); return false; }
    const account = state.accounts.find(item => item.id === state.role);
    if (!account) return false;
    account.password = password;
    saveState();
    $("#profilePasswordForm").reset();
    showToast("Wachtwoord opgeslagen.");
    return true;
  }

  function updateNewAccountDepartmentOptions() {
    const kind = $("#newAccountKind").value;
    $("#newAccountDepartment").innerHTML = kind === "staff"
      ? '<option value="multimedia">Multimedia</option><option value="it">IT</option><option value="process">Procesbegeleiding</option>'
      : '<option value="multimedia">Multimedia</option><option value="it">IT</option>';
  }

  function openCreateAccountDialog() {
    if (!currentUserIsAdmin()) return;
    $("#createAccountForm").reset();
    updateNewAccountDepartmentOptions();
    $("#createAccountDialog").showModal();
    setTimeout(() => $("#newAccountName").focus(), 30);
  }

  function createAccountFromForm() {
    if (!currentUserIsAdmin()) return false;
    const name = $("#newAccountName").value.trim();
    const kind = $("#newAccountKind").value;
    const department = $("#newAccountDepartment").value;
    const password = $("#newAccountPassword").value;
    const confirm = $("#newAccountPasswordConfirm").value;
    if (!name) return false;
    if (state.accounts.some(account => account.name.toLowerCase() === name.toLowerCase())) { showToast("Er bestaat al een account met deze naam."); return false; }
    if (password.length < 4) { showToast("Gebruik minimaal 4 tekens voor het wachtwoord."); return false; }
    if (password !== confirm) { showToast("De wachtwoorden zijn niet hetzelfde."); return false; }
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "account";
    const id = `${kind}-${slug}-${Date.now().toString(36)}`;
    state.accounts.push({ id, name, kind, department, password, memberSince: kind === "client" ? prototypeToday() : null });
    state.profiles[id] = { email: "", contactPreference: "hub", weekdays: [], linkedRooms: [] };
    if (kind === "client") state.clocks[id] = { active: false, startedAt: null };
    syncAccountsFromState();
    saveState();
    renderAccountSelectors();
    renderProfile();
    showToast(`Account voor ${name} aangemaakt.`);
    return true;
  }

  function openAccountPasswordDialog(accountId) {
    if (!currentUserIsAdmin()) return;
    const account = state.accounts.find(item => item.id === accountId);
    if (!account) return;
    $("#accountPasswordTarget").value = account.id;
    $("#accountPasswordTitle").textContent = `Wachtwoord voor ${account.kind === "client" ? clientFullName(account.name) : account.name}`;
    $("#accountResetPassword").value = "";
    $("#accountResetPasswordConfirm").value = "";
    $("#accountPasswordDialog").showModal();
  }

  function saveAccountPasswordReset() {
    if (!currentUserIsAdmin()) return false;
    const account = state.accounts.find(item => item.id === $("#accountPasswordTarget").value);
    if (!account) return false;
    const password = $("#accountResetPassword").value;
    const confirm = $("#accountResetPasswordConfirm").value;
    if (password.length < 4) { showToast("Gebruik minimaal 4 tekens voor het wachtwoord."); return false; }
    if (password !== confirm) { showToast("De wachtwoorden zijn niet hetzelfde."); return false; }
    account.password = password;
    saveState();
    showToast(`Wachtwoord voor ${account.name} opgeslagen.`);
    return true;
  }

  function bindAgendaEntryEvents(root = document) {
    $$('[data-edit-agenda]', root).forEach(button => button.addEventListener("click", () => openAgendaDialog(button.dataset.editAgenda)));
    $$('[data-open-appointment-response]', root).forEach(button => button.addEventListener("click", () => openAppointmentResponseDialog(button.dataset.openAppointmentResponse)));
    $$('[data-open-announcement-event]', root).forEach(button => button.addEventListener("click", () => {
      const id = button.dataset.openAnnouncementEvent;
      // Medewerkers zien ieder georganiseerd evenement en kunnen het openen/bewerken.
      if (currentConfig().kind === "staff") openMessageManageDialog(id);
      else showLoginMessagePopup(id);
    }));
  }
  function openAppointmentResponseDialog(id) {
    const item = state.agendaItems.find(entry => entry.id === id);
    if (!item || currentConfig().kind !== "client" || !item.requiresResponse) return;
    const belongsToClient = item.owner === state.role || item.client === currentAccountName();
    if (!belongsToClient) return;
    const seenKey = appointmentSeenKey(id);
    if (!state.notificationSeen.includes(seenKey)) state.notificationSeen.push(seenKey);
    $("#appointmentResponseId").value = id;
    $("#appointmentResponseTitle").innerHTML = richTitleHtml(item);
    $("#appointmentResponseDate").textContent = `${formatLongDate(item.date)} · ${agendaTime(item)}`;
    $("#appointmentResponseDescription").innerHTML = item.description ? richTextHtml(item.description) : "Er is geen extra omschrijving toegevoegd.";
    $("#appointmentResponsePlanner").innerHTML = `<span>Ingepland door</span><strong>${escapeHtml(item.createdBy || "Begeleiding")}</strong>`;
    const response = item.responseStatus || "pending";
    $("#appointmentCurrentResponse").innerHTML = `<span class="appointment-status status-${response}">${appointmentResponseLabel(response)}</span>`;
    saveState();
    renderNotifications();
    $("#appointmentResponseDialog").showModal();
  }
  function respondToAppointment(status) {
    const id = $("#appointmentResponseId").value;
    const item = state.agendaItems.find(entry => entry.id === id);
    if (!item || currentConfig().kind !== "client" || !["accepted", "declined"].includes(status)) return;
    item.responseStatus = status;
    item.respondedAt = new Date().toISOString();
    const seenKey = appointmentSeenKey(id);
    if (!state.notificationSeen.includes(seenKey)) state.notificationSeen.push(seenKey);
    saveState();
    renderAgenda();
    renderRoleSummary();
    renderNotifications();
    $("#appointmentResponseDialog").close();
    showToast(status === "accepted" ? "Afspraak geaccepteerd." : "Afspraak geweigerd en uit je agenda gehaald.");
  }
  function updateAgendaFormMode() {
    const closure = $('#agendaCategory').value === 'closure';
    const vacation = $('#agendaCategory').value === 'vacation';
    const isStaff = currentConfig().kind === 'staff';
    if ((closure || vacation) && !isStaff) $('#agendaCategory').value = 'appointment';
    const mode = (closure || vacation) && isStaff;
    $('#agendaTimesRow').classList.toggle('hidden', mode);
    $('#agendaStart').required = !mode;
    $('#agendaDialogTitle').textContent = $('#agendaId').value || $('#agendaClosureId').value
      ? (closure ? 'Spectrum dicht bewerken' : vacation ? 'Vakantie bewerken' : 'Afspraak bewerken')
      : (closure ? 'Spectrum dicht toevoegen' : vacation ? 'Vakantie toevoegen' : 'Nieuwe afspraak');
    $('#agendaClosureHint').classList.toggle('hidden', !closure);
  }
  function openAgendaDialog(id = null, date = null, clientName = null, endDate = null, closureId = null) {
    const item = state.agendaItems.find(entry => entry.id === id);
    if (item?.category === 'vacation' && currentConfig().kind === 'client') return;
    if (item && currentConfig().kind === 'client' && item.requiresResponse) {
      openAppointmentResponseDialog(id);
      return;
    }
    const closure = closureId && currentConfig().kind === 'staff'
      ? state.closures.find(entry => entry.id === closureId) : null;
    agendaOwnerTarget = currentConfig().kind === 'staff' ? null : clientName;
    $('#agendaId').value = item?.id || '';
    $('#agendaClosureId').value = closure?.id || '';
    $('#agendaClosureType').value = 'Spectrum dicht';
    setRichTextFieldValue('agendaTitle', item?.titleHtml || item?.title || closure?.titleHtml || closure?.title || '');
    const firstAvailableDate = nextWorkday(prototypeToday());
    const chosenDate = isWorkday(date) && date >= prototypeToday() ? date : firstAvailableDate;
    $('#agendaDate').value = closure?.start || item?.date || chosenDate;
    $('#agendaDate').dataset.lastValidDate = $('#agendaDate').value;
    $('#agendaEndDate').value = closure?.end || item?.endDate || endDate || $('#agendaDate').value;
    $('#agendaStart').value = item?.start || '09:00';
    $('#agendaEnd').value = item?.end || '';
    $('#agendaVacationOption').hidden = currentConfig().kind !== 'staff';
    $('#agendaStaffVacationOption').hidden = currentConfig().kind !== 'staff';
    $('#agendaCategory').value = closure ? 'closure' : item?.category || 'appointment';
    // Bij bewerken niet stilzwijgend een item in de andere opslaglijst dupliceren.
    $('#agendaVacationOption').disabled = Boolean(item);
    $('#agendaStaffVacationOption').disabled = Boolean(closure);
    if (item?.category === 'vacation') $('#agendaStaffVacationOption').disabled = false;
    $('#agendaCategory').disabled = Boolean(closure);
    setRichTextFieldValue('agendaDescription', item?.description || closure?.description || '');
    $('#deleteAgendaButton').classList.toggle('hidden', !item && !closure);
    updateAgendaFormMode();
    $('#agendaDialog').showModal();
    setTimeout(() => document.getElementById('agendaTitleRichEditor')?.focus(), 40);
  }
  function saveAgendaFromForm() {
    const id = $('#agendaId').value;
    const closureId = $('#agendaClosureId').value;
    const creatorConfig = currentConfig();
    const targetClient = creatorConfig.kind === 'staff' ? null : agendaOwnerTarget;
    const category = $('#agendaCategory').value;
    const isClosure = category === 'closure' && creatorConfig.kind === 'staff';
    const isVacation = category === 'vacation' && creatorConfig.kind === 'staff';
    const startDate = $('#agendaDate').value;
    const endDate = $('#agendaEndDate').value || startDate;
    const title = $('#agendaTitle').value.trim();
    if (!title || !startDate || !endDate || (!(isClosure || isVacation) && !$('#agendaStart').value)) return false;
    if (!isDateInRange(startDate) || (!(isClosure || isVacation) && !isDateInRange(endDate))) {
      showToast('Kies datums tussen juli 2026 en december 2027.');
      return false;
    }
    if (endDate < startDate) {
      showToast('Tot en met mag niet vóór de begindatum liggen.');
      return false;
    }
    if (isClosure) {
      // Dezelfde opslag als de bestaande sluitingsdagen: geen tweede, dubbele kalenderlijst.
      const payload = {
        id: closureId || createId('closure'), title,
        titleHtml: getRichTitleHtml('agendaTitle'),
        type: 'Spectrum dicht',
        start: startDate, end: endDate,
        description: $('#agendaDescription').value.trim()
      };
      const index = state.closures.findIndex(entry => entry.id === payload.id);
      if (index >= 0) state.closures[index] = payload;
      else state.closures.push(payload);
      state.selectedDate = startDate;
      state.calendarCursor = startDate.slice(0, 7);
      calendarRange = null;
      saveState(); renderClosures(); renderAgenda(); renderRoleSummary();
      showToast(index >= 0 ? 'Sluitingsperiode bijgewerkt.' : 'Sluitingsperiode toegevoegd.');
      return true;
    }
    const payload = {
      title, titleHtml: getRichTitleHtml('agendaTitle'),
      date: startDate, endDate,
      start: isVacation ? '00:00' : $('#agendaStart').value, end: isVacation ? '23:59' : $('#agendaEnd').value,
      category: category === 'closure' ? 'appointment' : category,
      description: $('#agendaDescription').value.trim()
    };
    const original = id ? state.agendaItems.find(entry => entry.id === id) : null;
    if (!isVacation && ((!isWorkday(startDate) && startDate !== original?.date)
      || (!isWorkday(endDate) && endDate !== (original?.endDate || original?.date)))) {
      showToast('Kies voor afspraken een begin- en einddatum op een werkdag.');
      return false;
    }
    if (!isVacation && endDate === startDate && payload.end && payload.end <= payload.start) {
      showToast('De eindtijd moet na de starttijd liggen.');
      return false;
    }
    if (id && original) Object.assign(original, payload);
    else state.agendaItems.push({
      id: createId('agenda'),
      owner: targetClient ? clientRoleForName(targetClient) : creatorConfig.kind === 'client' ? state.role : null,
      client: targetClient || (creatorConfig.kind === 'client' ? currentAccountName() : null),
      createdBy: currentAccountName(), createdByRole: state.role,
      createdByKind: creatorConfig.kind, createdAt: new Date().toISOString(),
      requiresResponse: Boolean(targetClient && creatorConfig.kind === 'staff'),
      responseStatus: targetClient && creatorConfig.kind === 'staff' ? 'pending' : null,
      ...payload
    });
    agendaOwnerTarget = null;
    state.selectedDate = payload.date;
    state.calendarCursor = payload.date.slice(0, 7);
    calendarRange = null;
    saveState(); renderAgenda(); renderRoleSummary(); renderNotifications();
    showToast(isVacation ? (id ? 'Vakantie bijgewerkt.' : 'Vakantie toegevoegd.') : id ? 'Afspraak bijgewerkt.' : targetClient && creatorConfig.kind === 'staff'
      ? `Afspraakvoorstel naar ${targetClient} verstuurd.` : 'Afspraak ingepland.');
    return true;
  }
  function deleteCurrentAgendaItem() {
    const closureId = $('#agendaClosureId').value;
    if (closureId) {
      if (currentConfig().kind !== 'staff') return;
      const item = state.closures.find(entry => entry.id === closureId);
      if (!item || !window.confirm(`Wil je “${item.title}” verwijderen?`)) return;
      state.closures = state.closures.filter(entry => entry.id !== closureId);
      saveState(); $('#agendaDialog').close();
      renderClosures(); renderAgenda(); renderRoleSummary();
      showToast('Sluitingsperiode verwijderd.');
      return;
    }
    const id = $('#agendaId').value;
    if (!id) return;
    state.agendaItems = state.agendaItems.filter(item => item.id !== id);
    state.notificationSeen = state.notificationSeen.filter(key => !key.endsWith(`:appointment:${id}`));
    saveState(); $('#agendaDialog').close(); renderAgenda(); renderRoleSummary();
    showToast('Afspraak verwijderd.');
  }

  function cursorParts() {
    const [year, month] = state.calendarCursor.split("-").map(Number);
    return { year, month: month - 1 };
  }
  function setCalendarCursor(year, month) {
    const date = new Date(year, month, 1);
    const min = new Date(2026, 6, 1);
    const max = new Date(2027, 11, 1);
    const clamped = date < min ? min : date > max ? max : date;
    state.calendarCursor = `${clamped.getFullYear()}-${String(clamped.getMonth() + 1).padStart(2, "0")}`;
    saveState();
    renderCalendars();
  }
  function changeCalendarMonth(delta) {
    const { year, month } = cursorParts();
    setCalendarCursor(year, month + delta);
  }
  function changeCalendarPeriod(delta) {
    if (state.agendaView === "month") return changeCalendarMonth(delta);
    const selected = nextWorkday(state.selectedDate);
    let target;
    if (state.agendaView === "week") {
      const date = parseDateOnly(selected);
      date.setDate(date.getDate() + delta * 7);
      target = dateToIso(date);
    } else {
      target = shiftCalendarWorkday(selected, delta);
    }
    if (!target || !isDateInRange(target)) return;
    state.selectedDate = target;
    state.calendarCursor = target.slice(0, 7);
    saveState();
    renderCalendars();
  }
  function monthHasAgenda(year, month, day) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return visibleAgendaItems().some(item => calendarItemOnDate(item, iso));
  }
  function calendarMarkup(year, month, variant = "large") {
    const weekdays = ["Ma", "Di", "Wo", "Do", "Vr"];
    const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    const cells = [];

    weekdays.forEach(day => cells.push(`<div class="calendar-cell weekday">${day}</div>`));
    for (let index = 0; index < 42; index += 1) {
      if (index % 7 >= 5) continue; // zaterdag en zondag tonen we nergens in de kalender
      const rawDay = index - firstOffset + 1;
      let cellYear = year;
      let cellMonth = month;
      let day = rawDay;
      let muted = false;
      if (rawDay < 1) {
        cellMonth -= 1;
        if (cellMonth < 0) { cellMonth = 11; cellYear -= 1; }
        day = previousMonthDays + rawDay;
        muted = true;
      } else if (rawDay > daysInMonth) {
        cellMonth += 1;
        if (cellMonth > 11) { cellMonth = 0; cellYear += 1; }
        day = rawDay - daysInMonth;
        muted = true;
      }
      const iso = `${cellYear}-${String(cellMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const inRange = isDateInRange(iso);
      const items = visibleAgendaItems().filter(item => calendarItemOnDate(item, iso));
      const closed = closuresOnDate(iso);
      const classes = [
        "calendar-cell",
        muted ? "muted" : "",
        iso === prototypeToday() ? "today" : "",
        // Only show a live selection in the full calendar; mini/year never inherit a saved date.
        variant === "large" && calendarRange && iso === state.selectedDate ? "selected" : "",
        items.length ? "has-items" : "",
        closed.length ? "spectrum-closed-day" : "",
        !inRange ? "disabled-day" : ""
      ].filter(Boolean).join(" ");
      // Maximaal één bolletje per betekenis (afspraak, Spectrum dicht, vakantie).
      // Meerdere begeleiders met vakantie blijven één wit bolletje.
      const marks = [
        ...(items.some(item => item.category !== "vacation") ? ['<i class="category-appointment" title="Afspraak"></i>'] : []),
        ...(closed.length ? ['<i class="category-closure" title="Spectrum dicht"></i>'] : []),
        ...(items.some(item => item.category === "vacation") ? ['<i class="category-vacation" title="Vakantie"></i>'] : [])
      ];
      const dots = marks.length ? `<span class="calendar-event-dots">${marks.join("")}</span>` : "";
      const closedLabel = closed.length ? `, Spectrum dicht: ${closed.map(item => item.title).join(", ")}` : "";
      cells.push(`<button class="${classes}" ${inRange ? `data-calendar-date="${iso}"` : "disabled"} aria-label="${day} ${formatMonthYear(cellYear, cellMonth)}${closedLabel}${items.length ? `, ${items.length} gepland` : ""}"><span>${day}</span>${dots}</button>`);
    }
    return cells.join("");
  }
  function yearOverviewMarkup() {
    const months = [];
    for (let year = 2026; year <= 2027; year += 1) {
      const startMonth = year === 2026 ? 6 : 0;
      for (let month = startMonth; month < 12; month += 1) {
        months.push(`<section class="year-month-card" data-month="${year}-${month + 1}"><h3>${formatMonthYear(year, month)}</h3><div class="year-mini-calendar">${calendarMarkup(year, month, "year")}</div></section>`);
      }
    }
    return months.join("");
  }
  function calendarDayCategoryLabel(category) {
    return { appointment: "Afspraak", event: "Afspraak", personal: "Afspraak", reminder: "Afspraak", vacation: "Vakantie" }[category] || "Afspraak";
  }
  // Acties direct in het dagoverzicht: geen dubbelklik of verborgen route nodig.
  function calendarItemActions(kind, id) {
    const encoded = escapeHtml(id);
    return `<div class="calendar-item-actions">
      <button type="button" class="calendar-item-action" data-calendar-edit-${kind}="${encoded}">Bewerken</button>
      <button type="button" class="calendar-item-action calendar-item-delete" data-calendar-delete-${kind}="${encoded}">Verwijderen</button>
    </div>`;
  }
  function calendarClosureHtml(item) {
    const canEdit = currentConfig().kind === "staff";
    return `<article class="calendar-closure-notice">
      <span class="calendar-closure-icon" aria-hidden="true">●</span>
      <div class="calendar-closure-copy"><strong>Spectrum dicht · ${richTitleHtml(item)}</strong><small>Spectrum dicht · ${escapeHtml(closureDateLabel(item))}</small>
        ${canEdit ? calendarItemActions("closure", item.id) : ""}
      </div>
    </article>`;
  }
  function calendarDayItemHtml(item) {
    const location = item.eventLocation ? `<small class="agenda-entry-location">${lucideIcon("map-pin")} ${escapeHtml(item.eventLocation)}</small>` : "";
    const description = item.description ? `<div class="rich-text-content">${richTextHtml(item.description)}</div>` : "";
    const rangeInfo = item.endDate && item.endDate > item.date
      ? `<small class="agenda-entry-range">${escapeHtml(agendaDateLabel(item))}</small>` : "";
    const canEdit = !item.eventId && (currentConfig().kind === "staff" || (item.category !== "vacation" && (item.owner === state.role || item.client === currentAccountName())));
    return `<article class="calendar-day-item category-${item.category}">
      <span class="calendar-day-item-dot"></span>
      <div class="calendar-day-item-time">${escapeHtml(agendaTime(item))}</div>
      <div class="calendar-day-item-copy">
        <div class="calendar-day-item-heading"><strong>${richTitleHtml(item)}</strong><span>${calendarDayCategoryLabel(item.category)}</span></div>
        ${item.category === "vacation" ? `<small>Begeleider: ${escapeHtml(item.createdBy || "Onbekend")}</small>` : ""}
        ${rangeInfo}${description}${location}
        ${canEdit ? calendarItemActions("agenda", item.id) : ""}
      </div>
    </article>`;
  }
  function bindCalendarDayItemActions(root = document) {
    $$('[data-calendar-edit-closure]', root).forEach(button => button.addEventListener('click', () => {
      if (currentConfig().kind !== 'staff') return;
      $('#calendarDayDialog')?.close();
      openAgendaDialog(null, null, null, null, button.dataset.calendarEditClosure);
    }));
    $$('[data-calendar-edit-agenda]', root).forEach(button => button.addEventListener('click', () => {
      const item = state.agendaItems.find(entry => entry.id === button.dataset.calendarEditAgenda);
      if (!item) return;
      if (currentConfig().kind !== 'staff' && item.owner !== state.role && item.client !== currentAccountName()) return;
      $('#calendarDayDialog')?.close();
      openAgendaDialog(item.id);
    }));
    $$('[data-calendar-delete-closure]', root).forEach(button => button.addEventListener('click', () => {
      if (currentConfig().kind !== 'staff') return;
      const item = state.closures.find(entry => entry.id === button.dataset.calendarDeleteClosure);
      if (!item || !window.confirm(`Wil je de volledige sluitingsperiode “${item.title}” verwijderen?`)) return;
      state.closures = state.closures.filter(entry => entry.id !== item.id);
      saveState(); renderClosures(); renderAgenda(); renderRoleSummary();
      $('#calendarDayDialog')?.close();
      showToast('Spectrum dicht verwijderd.');
    }));
    $$('[data-calendar-delete-agenda]', root).forEach(button => button.addEventListener('click', () => {
      const item = state.agendaItems.find(entry => entry.id === button.dataset.calendarDeleteAgenda);
      if (!item || (currentConfig().kind !== 'staff' && item.owner !== state.role && item.client !== currentAccountName())) return;
      const label = item.category === 'vacation' ? 'vakantieperiode' : 'afspraak';
      if (!window.confirm(`Wil je de volledige ${label} “${item.title}” verwijderen?`)) return;
      state.agendaItems = state.agendaItems.filter(entry => entry.id !== item.id);
      state.notificationSeen = state.notificationSeen.filter(key => !key.endsWith(`:appointment:${item.id}`));
      saveState(); renderAgenda(); renderRoleSummary(); renderNotifications();
      $('#calendarDayDialog')?.close();
      showToast(item.category === 'vacation' ? 'Vakantie verwijderd.' : 'Afspraak verwijderd.');
    }));
  }
  function openCalendarDayDialog(date) {
    state.selectedDate = date;
    state.calendarCursor = date.slice(0, 7);
    saveState();
    const items = visibleAgendaItems().filter(item => calendarItemOnDate(item, date));
    const closed = closuresOnDate(date);
    $("#calendarDayDialogTitle").textContent = formatLongDate(date);
    $("#calendarDayDialogList").innerHTML = closed.map(calendarClosureHtml).join("") + (items.length
      ? items.map(calendarDayItemHtml).join("")
      : (closed.length ? "" : emptyAgendaHtml("Nog niets gepland op deze dag.")));
    $("#calendarDayAddButton").dataset.calendarDate = date;
    $("#calendarDayDialog").showModal();
    bindCalendarDayItemActions($("#calendarDayDialog"));
  }

  function bindCalendarEvents() {
    $$('[data-calendar-date]').forEach(button => {
      button.addEventListener('click', event => {
        const date = button.dataset.calendarDate;
        if (button.closest('#miniCalendar')) {
          clearTimeout(button._calendarDayClickTimer);
          button._calendarDayClickTimer = setTimeout(() => openCalendarDayDialog(date), 220);
          return;
        }
        // A drag has already established its selection on pointerup.
        if (calendarDrag?.completed) { calendarDrag = null; return; }
        if (event.shiftKey && calendarAnchor) {
          calendarRange = normalizedCalendarRange(calendarAnchor, date);
        } else {
          calendarAnchor = date;
          calendarRange = normalizedCalendarRange(date);
        }
        state.selectedDate = calendarRange.start;
        state.calendarCursor = state.selectedDate.slice(0, 7);
        saveState();
        // Vervang de dagknoppen hier niet: anders werkt dubbelklikken niet meer.
        $$('#calendarLarge [data-calendar-date], #yearCalendarGrid [data-calendar-date]')
          .forEach(dayButton => dayButton.classList.toggle('selected', dayButton.dataset.calendarDate === date));
        markCalendarRange();
      });
      button.addEventListener('dblclick', event => {
        event.preventDefault();
        clearTimeout(button._calendarDayClickTimer);
        const date = button.dataset.calendarDate;
        if (!calendarRange || date < calendarRange.start || date > calendarRange.end) {
          calendarRange = normalizedCalendarRange(date);
          calendarAnchor = date;
        }
        state.selectedDate = calendarRange.start;
        state.calendarCursor = state.selectedDate.slice(0, 7);
        saveState();
        $('#calendarDayDialog')?.close();
        const closure = currentConfig().kind === 'staff' ? closuresOnDate(date)[0] : null;
        if (closure && calendarRange.start === calendarRange.end) {
          openAgendaDialog(null, null, null, null, closure.id);
        } else openAgendaDialog(null, calendarRange.start, null, calendarRange.end);
      });
    });
    // Dragging works only on the full-sized month grid. Mini/year calendars keep click-to-open.
    const large = $('#calendarLarge');
    large.onpointerdown = event => {
      const button = event.target.closest?.('[data-calendar-date]');
      if (!button || event.button !== 0 || state.agendaView !== 'month') return;
      const day = button.dataset.calendarDate;
      const start = event.shiftKey && calendarAnchor ? calendarAnchor : day;
      if (!event.shiftKey) calendarAnchor = day;
      calendarRange = normalizedCalendarRange(start, day);
      calendarDrag = { start, first: day, end: day, moved: false, completed: false };
      markCalendarRange();
    };
    large.onpointermove = event => {
      if (!calendarDrag || calendarDrag.completed || !(event.buttons & 1)) return;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('#calendarLarge [data-calendar-date]');
      if (!target) return;
      const day = target.dataset.calendarDate;
      if (calendarDrag.end !== day) {
        calendarDrag.end = day;
        calendarDrag.moved = true;
        calendarRange = normalizedCalendarRange(calendarDrag.start, day);
        markCalendarRange();
      }
    };
    large.onpointerup = event => {
      if (!calendarDrag || calendarDrag.completed) return;
      const drag = calendarDrag;
      if (drag.moved) {
        calendarRange = normalizedCalendarRange(drag.start, drag.end);
        state.selectedDate = calendarRange.start;
        state.calendarCursor = state.selectedDate.slice(0, 7);
        drag.completed = true;
        saveState();
        markCalendarRange();
        // Markeren zonder het raster tijdens een pointerinteractie te vervangen.
      } else calendarDrag = null;
    };
    large.onpointercancel = () => { calendarDrag = null; };
  }

  function renderCalendars() {
    const { year, month } = cursorParts();
    $$("[data-agenda-view]").forEach(button => button.classList.toggle("active", button.dataset.agendaView === state.agendaView));
    const selectedIso = nextWorkday(state.selectedDate);
    if (state.agendaView !== "month" && selectedIso !== state.selectedDate) state.selectedDate = selectedIso;
    const selected = parseDateOnly(selectedIso);
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
    const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
    const periodLabel = state.agendaView === "month" ? formatMonthYear(year, month)
      : state.agendaView === "week" ? `${new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"short" }).format(monday)} – ${new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"short", year:"numeric" }).format(friday)}`
      : formatLongDate(selectedIso);
    $("#calendarMonthLabel").textContent = periodLabel;
    $("#calendarPeriodType").textContent = { month:"Maandoverzicht", week:"Weekoverzicht", day:"Dagoverzicht" }[state.agendaView];
    $("#calendarHelp").textContent = state.agendaView === "month"
      ? "Selecteer een periode door te slepen of met Shift + klik. Klik op Nieuwe afspraak om de datums over te nemen."
      : "Klik op een afspraak of sluitingsperiode om de details te bekijken.";
    $("#miniCalendarLabel").textContent = formatMonthYear(year, month);
    if (state.agendaView === "month") {
      $("#calendarLarge").className = "calendar-large interactive-calendar";
      $("#calendarLarge").innerHTML = calendarMarkup(year, month, "large");
    } else {
      const start = state.agendaView === "week" ? monday : selected;
      const days = state.agendaView === "week" ? 5 : 1;
      $("#calendarLarge").className = `agenda-${state.agendaView}-view`;
      $("#calendarLarge").innerHTML = Array.from({ length: days }, (_, index) => {
        const date = new Date(start); date.setDate(start.getDate() + index);
        const iso = dateToIso(date);
        const items = visibleAgendaItems().filter(item => calendarItemOnDate(item, iso));
        const closed = closuresOnDate(iso);
        return `<section class="agenda-day-column"><h3>${formatLongDate(iso)}</h3>${closed.map(calendarClosureHtml).join("")}${items.length ? items.map(item => agendaEntryHtml(item)).join("") : (closed.length ? "" : emptyAgendaHtml("Geen afspraken."))}</section>`;
      }).join("");
    }
    $("#miniCalendar").innerHTML = calendarMarkup(year, month, "mini");
    $("#yearCalendarGrid").innerHTML = yearOverviewMarkup();
    const atMin = year === 2026 && month === 6;
    const atMax = year === 2027 && month === 11;
    $("#miniCalendarPrevButton").disabled = atMin;
    $("#miniCalendarNextButton").disabled = atMax;
    const previous = state.agendaView === "month" ? !atMin : state.agendaView === "week"
      ? dateToIso(new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - 7)) >= CALENDAR_MIN
      : Boolean(shiftCalendarWorkday(selectedIso, -1));
    const next = state.agendaView === "month" ? !atMax : state.agendaView === "week"
      ? dateToIso(new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + 7)) <= CALENDAR_MAX
      : Boolean(shiftCalendarWorkday(selectedIso, 1));
    $("#calendarPrevButton").disabled = !previous;
    $("#calendarNextButton").disabled = !next;
    const periodUnit = { month:"maand", week:"week", day:"werkdag" }[state.agendaView];
    $("#calendarPrevButton").setAttribute("aria-label", `Vorige ${periodUnit}`);
    $("#calendarNextButton").setAttribute("aria-label", `Volgende ${periodUnit}`);
    bindCalendarEvents();
    bindAgendaEntryEvents($("#calendarLarge"));
    bindCalendarDayItemActions($("#calendarLarge"));
    markCalendarRange();
  }

  function applyDashboardPreset(preset) {
    selectDashboardLayout(preset === "custom" ? "custom" : "standard");
  }


  function exportDemo() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "spectrum-hub-fase3-demo.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importDemo(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.agendaItems)) throw new Error("Ongeldig bestand");
      state = { ...cloneDefaultState(), ...parsed };
      if (!roleConfig[state.role]) state.role = "client-mm";
      state.clocks = { ...cloneDefaultState().clocks, ...(state.clocks || {}) };
      if (!Array.isArray(state.messages)) state.messages = cloneDefaultState().messages;
      state.eventParticipants = { ...cloneDefaultState().eventParticipants, ...(state.eventParticipants || {}) };
      saveState();
      renderAll();
      showToast("Demo-instellingen geïmporteerd.");
    } catch {
      showToast("Dit is geen geldige Spectrum Hub-export.");
    }
  }



  const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=51.571&longitude=4.768&current=temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&forecast_hours=8&timezone=Europe%2FAmsterdam";

  function weatherDescription(code) {
    if (code === 0) return { icon: "☀️", label: "Helder" };
    if ([1, 2].includes(code)) return { icon: "🌤️", label: "Licht bewolkt" };
    if (code === 3) return { icon: "☁️", label: "Bewolkt" };
    if ([45, 48].includes(code)) return { icon: "🌫️", label: "Mist" };
    if ([51, 53, 55, 56, 57].includes(code)) return { icon: "🌦️", label: "Motregen" };
    if ([61, 63, 65, 66, 67].includes(code)) return { icon: "🌧️", label: "Regen" };
    if ([71, 73, 75, 77].includes(code)) return { icon: "🌨️", label: "Sneeuw" };
    if ([80, 81, 82].includes(code)) return { icon: "🌦️", label: "Buien" };
    if ([85, 86].includes(code)) return { icon: "🌨️", label: "Sneeuwbuien" };
    if ([95, 96, 99].includes(code)) return { icon: "⛈️", label: "Onweer" };
    return { icon: "🌥️", label: "Wisselend" };
  }

  function weatherTimeLabel(value) {
    const date = new Date(value);
    return new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function renderWeatherFallback() {
    const root = $("#weatherContent");
    if (!root) return;
    root.innerHTML = `
      <div class="weather-offline">
        <span class="weather-main-icon">🌥️</span>
        <div>
          <strong>Live weer niet beschikbaar</strong>
          <p>De rest van het prototype blijft gewoon werken. Open de volledige radar voor actuele neerslag.</p>
        </div>
      </div>`;
    const updated = $("#weatherUpdated");
    if (updated) updated.textContent = "Locatie: Breda · offline";
  }

  function renderWeather(payload) {
    const root = $("#weatherContent");
    if (!root || !payload.current || !payload.hourly) return;
    const current = payload.current;
    const condition = weatherDescription(Number(current.weather_code));
    const times = payload.hourly.time || [];
    const probabilities = payload.hourly.precipitation_probability || [];
    const precipitation = payload.hourly.precipitation || [];
    const codes = payload.hourly.weather_code || [];
    const hours = times.slice(0, 7).map((time, index) => ({
      time,
      probability: Number(probabilities[index] || 0),
      precipitation: Number(precipitation[index] || 0),
      condition: weatherDescription(Number(codes[index]))
    }));
    const maxProbability = Math.max(20, ...hours.map(hour => hour.probability));
    const peak = Math.max(...hours.map(hour => hour.probability), 0);
    const rainSummary = peak < 20 ? "Waarschijnlijk droog" : peak < 50 ? "Kans op een bui" : "Regen waarschijnlijk";

    root.innerHTML = `
      <div class="weather-current">
        <div class="weather-current-main">
          <span class="weather-main-icon" aria-hidden="true">${condition.icon}</span>
          <div>
            <strong class="weather-temperature">${Math.round(Number(current.temperature_2m))}°</strong>
            <span>${condition.label}</span>
          </div>
        </div>
        <div class="weather-stats">
          <div><span>Gevoel</span><strong>${Math.round(Number(current.apparent_temperature))}°</strong></div>
          <div><span>Wind</span><strong>${Math.round(Number(current.wind_speed_10m))} km/u</strong></div>
          <div><span>Nu</span><strong>${Number(current.precipitation || 0).toFixed(1)} mm</strong></div>
        </div>
      </div>
      <div class="rain-heading">
        <div><strong>Komende uren</strong><span>${rainSummary}</span></div>
        <strong>${peak}% max.</strong>
      </div>
      <div class="rain-hours" aria-label="Neerslagkans komende uren">
        ${hours.map(hour => `
          <div class="rain-hour" title="${hour.condition.label}: ${hour.precipitation.toFixed(1)} mm">
            <span>${weatherTimeLabel(hour.time)}</span>
            <div class="rain-bar-track"><i style="height:${Math.max(4, Math.round((hour.probability / maxProbability) * 100))}%"></i></div>
            <strong>${hour.probability}%</strong>
          </div>`).join("")}
      </div>`;

    const updated = $("#weatherUpdated");
    if (updated) {
      const time = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      updated.textContent = `Breda · bijgewerkt ${time}`;
    }
  }

  async function loadWeather() {
    const root = $("#weatherContent");
    if (root) root.classList.add("is-loading");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(WEATHER_API_URL, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
      const payload = await response.json();
      renderWeather(payload);
    } catch (error) {
      console.warn("Weer kon niet worden geladen:", error);
      renderWeatherFallback();
    } finally {
      clearTimeout(timeout);
      if (root) root.classList.remove("is-loading");
    }
  }

  function renderDiary() {
    const staffView = currentConfig().kind === "staff";
    const entries = staffView ? staffRelevantDiary() : state.diary.filter(entry => entry.client === currentAccountName());
    const latest = entries[0];
    $("#latestDiary").innerHTML = latest ? `${staffView ? `<strong>${escapeHtml(clientDisplayName(latest.client))}</strong><br>` : ""}<div class="rich-text-content">${richTextHtml(latest.text)}</div>${moodPairHtml(latest.moodStart, latest.moodEnd)}<small>${formatDateTime(latest.date)}</small>` : "Geen recente verslagen.";
    $("#diaryTimeline").innerHTML = entries.length ? entries.map(entry => `<article class="timeline-entry"><div class="timeline-client-row"><div class="person-mini-avatar">${escapeHtml(entry.client?.[0] || "?")}</div><div><strong>${escapeHtml(clientDisplayName(entry.client || "Mediënt"))}</strong><time>${formatDateTime(entry.date)}</time></div><span class="staff-list-badge">${escapeHtml(entry.department === "it" ? "IT" : "Multimedia")}</span></div><div class="rich-text-content">${richTextHtml(entry.text)}</div>${moodPairHtml(entry.moodStart, entry.moodEnd)}</article>`).join("") : emptyAgendaHtml("Geen dagverslagen gevonden.");
  }

  function renderWidgets() {
    const grid = $("#widgetGrid");
    const railZone = $("#rightRailWidgetZone");
    const dashboardNodes = new Map($$("[data-widget-id]", document).map(node => [node.dataset.widgetId, node]));
    const railNodes = new Map($$("[data-rail-item-id]", document).map(node => [node.dataset.railItemId, node]));
    auxiliaryWidgetIds.forEach(id => {
      const node = railNodes.get(id);
      if (node) node.dataset.widgetId = id;
    });
    const allNodes = new Map([...dashboardNodes.entries(), ...auxiliaryWidgetIds.map(id => [id, railNodes.get(id)]).filter(([, node]) => Boolean(node))]);
    state.widgetOrder.forEach(id => {
      const node = allNodes.get(id);
      if (!node) return;
      const zone = state.widgetZones?.[id] === "right" ? "right" : "main";
      if (zone === "right") {
        if (!node.dataset.railItemId) node.dataset.railItemId = `widget:${id}`;
        railZone.appendChild(node);
      } else {
        grid.appendChild(node);
      }
    });
    allNodes.forEach((node, id) => {
      const zone = state.widgetZones?.[id] === "right" ? "right" : "main";
      node.classList.remove("moving", "resizing", "invalid-layout");
      node.classList.toggle("hidden", state.hiddenWidgets.includes(id) && !widgetIsMandatoryForRole(id));
      node.classList.toggle("pinned", state.pinnedWidgets.includes(id));
      node.classList.toggle("widget-in-rail", zone === "right");
      node.classList.toggle("managed-rail-widget", auxiliaryWidgetIds.includes(id));
      node.classList.remove("widget-compact", "widget-normal", "widget-wide");
      const size = state.widgetSizes[id] || (auxiliaryWidgetIds.includes(id) ? "wide" : "normal");
      node.classList.add(`widget-${size}`);
      if (auxiliaryWidgetIds.includes(id)) {
        node.classList.toggle("rail-size-small", size === "compact");
        node.classList.toggle("rail-size-large", size !== "compact");
      }
      const layout = state.widgetLayout[id] || cloneDefaultState().widgetLayout[id];
      if (zone === "main") {
        if (state.dashboardPreset === "standard") {
          node.style.gridColumn = "1 / -1";
          node.style.gridRow = "auto";
        } else {
          node.style.gridColumn = `${layout.x} / span ${layout.w}`;
          node.style.gridRow = `${layout.y} / span ${layout.h}`;
        }
      } else {
        node.style.gridColumn = "auto";
        node.style.gridRow = "auto";
      }
      node.draggable = false;
      if (!auxiliaryWidgetIds.includes(id)) {
        let resizeHandle = $(".widget-resize-handle", node);
        if (!resizeHandle) {
          resizeHandle = document.createElement("button");
          resizeHandle.type = "button";
          resizeHandle.className = "widget-resize-handle";
          resizeHandle.setAttribute("aria-label", `${widgetNames[id]} groter of kleiner maken`);
          resizeHandle.title = id === "messages" ? "Sleep naar links of rechts om de breedte te wijzigen" : "Sleep om formaat te wijzigen";
          if (id === "messages") resizeHandle.setAttribute("aria-label", "Breedte van Mededelingen wijzigen");
          node.appendChild(resizeHandle);
        }
      }
      const button = $(`[data-pin-widget="${id}"]`, node);
      if (button) {
        button.classList.toggle("active", state.pinnedWidgets.includes(id));
        button.innerHTML = lucideIcon("pin");
        button.title = state.pinnedWidgets.includes(id) ? "Losmaken" : "Pinnen";
        button.setAttribute("aria-label", state.pinnedWidgets.includes(id) ? "Widget losmaken" : "Widget pinnen");
      }
      const dragHint = $(".drag-hint, .rail-drag-hint", node);
      if (dragHint) {
        dragHint.disabled = false;
        dragHint.title = zone === "right" ? "Versleep widget hoger of lager" : "Versleep widget";
      }
    });
    renderRightRailItems();
    renderWidgetOptions();
  }
  function dashboardSizePreset(id, size) {
    const small = size === "compact";
    if (id === "tasks") return small ? { w:6, h:4 } : { w:12, h:6 };
    if (id === "attendance") return small ? { w:6, h:3 } : { w:12, h:4 };
    if (id === "calendar") return small ? { w:6, h:4 } : { w:12, h:5 };
    if (["agenda", "closures"].includes(id)) return small ? { w:6, h:3 } : { w:12, h:4 };
    return small ? { w:6, h:3 } : { w:12, h:3 };
  }

  function applyManagedWidgetSize(id, size) {
    state.widgetSizes[id] = size === "compact" ? "compact" : "wide";
    if (auxiliaryWidgetIds.includes(id)) state.railItemSizes[id] = size === "compact" ? "small" : "large";
    if ((state.widgetZones?.[id] || "main") !== "main") return;
    const current = state.widgetLayout[id] || cloneDefaultState().widgetLayout[id];
    const dims = dashboardSizePreset(id, state.widgetSizes[id]);
    let candidate = { ...current, ...dims, x:Math.min(current.x || 1, 13 - dims.w) };
    if (!layoutIsFree(id, candidate)) {
      state.widgetLayout[id] = candidate;
      candidate = firstFreeLayout(id);
    }
    state.widgetLayout[id] = candidate;
  }

  function canManageMandatoryWidgets() {
    return ["staff", "admin"].includes(currentConfig().kind);
  }

  function widgetIsMandatoryForRole(id, role = state.role) {
    if (permanentlyMandatoryWidgets.has(id)) return true;
    const config = roleConfig[role] || currentConfig();
    return config?.kind === "client" && (state.mandatoryWidgets || []).includes(id);
  }

  function compactMainDashboardLayout(anchorId = null) {
    if (state.dashboardPreset !== "custom") return;
    const ids = state.widgetOrder
      .filter(id => id !== anchorId && widgetUsesMainLayout(id) && state.widgetLayout[id])
      .sort((a, b) => {
        const la = state.widgetLayout[a];
        const lb = state.widgetLayout[b];
        return (la.y - lb.y) || (la.x - lb.x);
      });
    ids.forEach(id => {
      const current = state.widgetLayout[id];
      if (!current || current.y <= 1) return;
      let best = current;
      for (let y = 1; y < current.y; y += 1) {
        const candidate = { ...current, y };
        if (layoutIsFree(id, candidate)) {
          best = candidate;
          break;
        }
      }
      state.widgetLayout[id] = best;
    });
  }

  // Only one widget's settings are expanded at a time; this is UI state, not a saved preference.
  let expandedWidgetOptionId = null;
  let widgetPolicyExpanded = false;

  function renderWidgetOptions() {
    const configurableWidgetIds = state.widgetOrder.filter(id => {
      const node = document.querySelector(`[data-widget-id="${id}"]`) || document.querySelector(`[data-rail-item-id="${id}"]`);
      if (!node) return false;
      const kind = currentConfig().kind;
      if (kind === "staff" && (id === "attendance" || node.classList.contains("client-only"))) return false;
      if (kind === "client" && node.classList.contains("staff-only")) return false;
      return true;
    });
    if (!configurableWidgetIds.includes(expandedWidgetOptionId)) expandedWidgetOptionId = null;

    const widgetIcons = {
      tasks:"list-checks", weather:"sun", attendance:"users", messages:"message-square-text",
      diary:"notebook-pen", workspace:"building-2", agenda:"calendar-clock",
      closures:"building-2", calendar:"calendar-days"
    };
    const activeWidgetCount = configurableWidgetIds.filter(id => widgetIsMandatoryForRole(id) || !state.hiddenWidgets.includes(id)).length;
    const widgetsSummary = `<div class="widget-library-summary"><strong>Alle widgets</strong><span>${activeWidgetCount} actief · ${configurableWidgetIds.length - activeWidgetCount} verborgen</span></div>`;
    const options = configurableWidgetIds.map(id => {
      const zone = state.widgetZones?.[id] === "right" ? "right" : "main";
      const size = state.widgetSizes?.[id] === "compact" ? "compact" : "wide";
      const mandatory = widgetIsMandatoryForRole(id);
      const enabled = mandatory || !state.hiddenWidgets.includes(id);
      const expanded = id === expandedWidgetOptionId;
      const badge = mandatory ? `<span class="widget-required-badge">Verplicht</span>` : "";
      // Locked widgets deliberately have no (disabled) toggle: an inert switch adds visual noise.
      const toggle = mandatory ? "" : `<label class="widget-library-switch" title="${enabled ? "Widget uitschakelen" : "Widget inschakelen"}">
        <input type="checkbox" data-widget-toggle="${id}" ${enabled ? "checked" : ""} aria-label="${widgetNames[id]} ${enabled ? "uitschakelen" : "inschakelen"}">
        <span aria-hidden="true"></span>
      </label>`;
      return `<article class="widget-library-card${enabled ? "" : " is-disabled"}${mandatory ? " is-required" : ""}${expanded ? " is-expanded" : ""}" data-widget-option-card="${id}">
        <div class="widget-library-card-header">
          <button type="button" class="widget-library-expand" data-widget-expand="${id}" aria-expanded="${expanded}" aria-controls="widget-settings-${id}" aria-label="Instellingen ${widgetNames[id]} ${expanded ? "sluiten" : "openen"}">
            <span class="widget-library-symbol" aria-hidden="true">${lucideIcon(widgetIcons[id] || "layout-dashboard")}</span>
            <span class="widget-library-card-title"><strong>${widgetNames[id]}</strong>${badge}</span>
          </button>
          ${toggle}
          <button type="button" class="widget-library-expand-arrow" data-widget-expand="${id}" aria-expanded="${expanded}" aria-controls="widget-settings-${id}" aria-label="Instellingen ${widgetNames[id]} ${expanded ? "sluiten" : "openen"}">
            <span class="widget-library-chevron" aria-hidden="true">${lucideIcon("chevron-down")}</span>
          </button>
        </div>
        <div class="widget-library-details" id="widget-settings-${id}" ${expanded ? "" : "hidden"}>
          <div class="widget-library-setting">
            <span>Locatie</span>
            <div class="widget-segmented" role="group" aria-label="Locatie van ${widgetNames[id]}">
              <button type="button" data-widget-set-zone="${id}" data-value="main" class="${zone === "main" ? "active" : ""}" aria-pressed="${zone === "main"}">Dashboard</button>
              <button type="button" data-widget-set-zone="${id}" data-value="right" class="${zone === "right" ? "active" : ""}" aria-pressed="${zone === "right"}">Rechterbalk</button>
            </div>
          </div>
          <div class="widget-library-setting">
            <span>Formaat</span>
            <div class="widget-segmented compact" role="group" aria-label="Formaat van ${widgetNames[id]}">
              <button type="button" data-widget-set-size="${id}" data-value="compact" class="${size === "compact" ? "active" : ""}" aria-pressed="${size === "compact"}">Klein</button>
              <button type="button" data-widget-set-size="${id}" data-value="wide" class="${size === "wide" ? "active" : ""}" aria-pressed="${size === "wide"}">Groot</button>
            </div>
          </div>
        </div>
      </article>`;
    }).join("");

    const policy = canManageMandatoryWidgets() ? `<section class="widget-policy-panel${widgetPolicyExpanded ? " is-expanded" : ""}">
      <button class="widget-policy-toggle" type="button" data-widget-policy-toggle aria-expanded="${widgetPolicyExpanded}" aria-controls="widget-policy-content">
        <span><strong>Verplicht voor mediënten</strong><small>Beheer welke widgets niet uitgezet mogen worden.</small></span>
        <span class="widget-library-chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="widget-policy-content" id="widget-policy-content" ${widgetPolicyExpanded ? "" : "hidden"}>
        <p>Mededelingen is altijd verplicht.</p>
        <div class="widget-policy-grid">${allWidgetIds.map(id => {
          const fixed = permanentlyMandatoryWidgets.has(id);
          const required = fixed || (state.mandatoryWidgets || []).includes(id);
          if (fixed) return `<div class="widget-policy-option active fixed"><span>${widgetNames[id]}</span><em>Altijd verplicht</em></div>`;
          return `<label class="widget-policy-option${required ? " active" : ""}"><input type="checkbox" data-widget-mandatory="${id}" ${required ? "checked" : ""}><span>${widgetNames[id]}</span>${required ? '<em>Verplicht</em>' : ''}</label>`;
        }).join("")}</div>
      </div>
    </section>` : "";

    const widgetList = $("#widgetOptions");
    const listScrollTop = widgetList.scrollTop;
    widgetList.innerHTML = `${widgetsSummary}${options}${policy}`;
    widgetList.scrollTop = listScrollTop;

    $$('[data-widget-expand]').forEach(button => button.addEventListener("click", () => {
      const id = button.dataset.widgetExpand;
      expandedWidgetOptionId = expandedWidgetOptionId === id ? null : id;
      renderWidgetOptions();
      // Preserve focus on the corresponding control after the accordion updates.
      const selector = button.classList.contains("widget-library-expand-arrow")
        ? `.widget-library-expand-arrow[data-widget-expand="${id}"]`
        : `.widget-library-expand[data-widget-expand="${id}"]`;
      $(selector)?.focus({ preventScroll:true });
    }));
    $('[data-widget-policy-toggle]')?.addEventListener("click", () => {
      widgetPolicyExpanded = !widgetPolicyExpanded;
      expandedWidgetOptionId = null;
      renderWidgetOptions();
      $('[data-widget-policy-toggle]')?.focus({ preventScroll:true });
    });
    $$('[data-widget-toggle]').forEach(input => input.addEventListener("change", () => {
      const id = input.dataset.widgetToggle;
      if (widgetIsMandatoryForRole(id)) {
        input.checked = true;
        showToast("Deze widget is verplicht en kan niet worden uitgeschakeld.");
        return;
      }
      if (input.checked) {
        state.hiddenWidgets = state.hiddenWidgets.filter(item => item !== id);
        if ((state.widgetZones?.[id] || "main") === "main" && !layoutIsFree(id, state.widgetLayout[id])) state.widgetLayout[id] = firstFreeLayout(id);
        compactMainDashboardLayout(id);
      } else if (!state.hiddenWidgets.includes(id)) {
        state.hiddenWidgets.push(id);
        compactMainDashboardLayout();
      }
      commitDashboardCustomization(); saveState(); applyPreferences(); renderWidgets(); bindWidgetDnD();
    }));
    $$('[data-widget-set-zone]').forEach(button => button.addEventListener("click", () => {
      const id = button.dataset.widgetSetZone;
      const nextZone = button.dataset.value === "right" ? "right" : "main";
      if ((state.widgetZones?.[id] || "main") === nextZone) return;
      state.widgetZones[id] = nextZone;
      const railId = auxiliaryWidgetIds.includes(id) ? id : `widget:${id}`;
      if (nextZone === "right" && !state.rightRailOrder.includes(railId)) state.rightRailOrder.push(railId);
      if (nextZone === "main") {
        applyManagedWidgetSize(id, state.widgetSizes?.[id] === "compact" ? "compact" : "wide");
        state.hiddenRailItems = (state.hiddenRailItems || []).filter(item => item !== id);
        compactMainDashboardLayout(id);
      } else {
        compactMainDashboardLayout();
      }
      commitDashboardCustomization(); saveState(); applyPreferences(); renderWidgets(); bindWidgetDnD();
      showToast(nextZone === "right" ? "Widget naar de rechterbalk verplaatst." : "Widget naar het hoofd-dashboard verplaatst.");
    }));
    $$('[data-widget-set-size]').forEach(button => button.addEventListener("click", () => {
      const id = button.dataset.widgetSetSize;
      const size = button.dataset.value === "compact" ? "compact" : "wide";
      if ((state.widgetSizes?.[id] === "compact" ? "compact" : "wide") === size) return;
      applyManagedWidgetSize(id, size);
      compactMainDashboardLayout(id);
      commitDashboardCustomization(); saveState(); applyPreferences(); renderWidgets(); bindWidgetDnD();
      showToast(size === "compact" ? "Widget kleiner gemaakt." : "Widget groter gemaakt.");
    }));
    $$('[data-widget-mandatory]').forEach(input => input.addEventListener("change", () => {
      if (!canManageMandatoryWidgets()) return;
      const id = input.dataset.widgetMandatory;
      if (permanentlyMandatoryWidgets.has(id)) {
        input.checked = true;
        return;
      }
      state.mandatoryWidgets = Array.isArray(state.mandatoryWidgets) ? state.mandatoryWidgets.filter(item => item !== id) : [];
      if (input.checked) state.mandatoryWidgets.push(id);
      state.mandatoryWidgets = [...new Set(["messages", ...state.mandatoryWidgets])];
      saveState();
      renderWidgetOptions();
      showToast(input.checked ? `${widgetNames[id]} is nu verplicht voor mediënten.` : `${widgetNames[id]} is niet langer verplicht.`);
    }));
  }
  function togglePin(id) {
    if (state.pinnedWidgets.includes(id)) state.pinnedWidgets = state.pinnedWidgets.filter(item => item !== id);
    else state.pinnedWidgets.push(id);
    state.widgetOrder.sort((a, b) => Number(state.pinnedWidgets.includes(b)) - Number(state.pinnedWidgets.includes(a)));
    commitDashboardCustomization();
    saveState();
    applyPreferences();
    renderWidgets();
  }
  function bindWidgetDnD() {
    $$('[data-widget-id]').forEach(widget => {
      if (widget.dataset.widgetDnDBound === "true") return;
      const dragHandle = $(".drag-hint, .rail-drag-hint", widget);
      const handle = $(".widget-resize-handle", widget);
      if (dragHandle) dragHandle.addEventListener("pointerdown", event => startWidgetMove(event, widget));
      if (handle) handle.addEventListener("pointerdown", event => startWidgetResize(event, widget));
      widget.dataset.widgetDnDBound = "true";
    });
    $$(".rail-drag-hint").forEach(handle => {
      if (handle.dataset.railDnDBound === "true") return;
      const item = handle.closest("[data-rail-item-id]");
      if (item) handle.addEventListener("pointerdown", event => startRailMove(event, item));
      handle.dataset.railDnDBound = "true";
    });
  }

  function renderRightRailItems() {
    const zone = $("#rightRailWidgetZone");
    if (!zone) return;
    const defaultOrder = cloneDefaultState().rightRailOrder;
    state.rightRailOrder = (state.rightRailOrder || []).filter(id => id !== "featured");
    if (!state.rightRailOrder.includes("closures")) {
      const calendarIndex = state.rightRailOrder.indexOf("calendar");
      if (calendarIndex >= 0) state.rightRailOrder.splice(calendarIndex, 0, "closures");
      else state.rightRailOrder.push("closures");
    }
    const known = new Set([...(state.rightRailOrder || []), ...defaultOrder]);
    state.widgetOrder.forEach(id => known.add(`widget:${id}`));
    state.rightRailOrder = [...known];
    const items = new Map($$("[data-rail-item-id]", zone).map(node => [node.dataset.railItemId, node]));
    state.rightRailOrder.forEach(id => {
      const node = items.get(id);
      if (node) zone.appendChild(node);
    });
    items.forEach((node, id) => {
      if (!state.rightRailOrder.includes(id)) {
        state.rightRailOrder.push(id);
        zone.appendChild(node);
      }
      if (railWidgetNames[id]) {
        const hidden = ((state.hiddenWidgets || []).includes(id) || (state.hiddenRailItems || []).includes(id)) && !widgetIsMandatoryForRole(id);
        node.classList.toggle("hidden", hidden || (state.widgetZones?.[id] || "right") !== "right");
        const compact = (state.widgetSizes?.[id] === "compact") || state.railItemSizes?.[id] === "small";
        node.classList.toggle("rail-size-small", compact);
        node.classList.toggle("rail-size-large", !compact);
      }
    });
  }

  function startRailMove(event, item) {
    if (!state.dashboardEditMode || !item?.dataset.railItemId) return;
    event.preventDefault();
    event.stopPropagation();
    railMove = { id: item.dataset.railItemId, node: item };
    item.classList.add("rail-moving");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function updateRailMove(event) {
    if (!railMove) return;
    const zone = $("#rightRailWidgetZone");
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-rail-item-id]");
    if (!target || target === railMove.node || !zone.contains(target)) return;
    const rect = target.getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) zone.insertBefore(railMove.node, target);
    else zone.insertBefore(railMove.node, target.nextSibling);
  }

  function finishRailMove() {
    if (!railMove) return;
    const zone = $("#rightRailWidgetZone");
    const visibleOrder = [...zone.children].filter(node => node.dataset.railItemId).map(node => node.dataset.railItemId);
    const absent = state.rightRailOrder.filter(id => !visibleOrder.includes(id));
    state.rightRailOrder = [...visibleOrder, ...absent];
    railMove.node.classList.remove("rail-moving");
    railMove = null;
    commitDashboardCustomization();
    saveState();
    applyPreferences();
    renderWidgets();
    showToast("Rechterkolom aangepast.");
  }

  function gridMetrics() {
    const grid = $("#widgetGrid");
    const rect = grid.getBoundingClientRect();
    const styles = getComputedStyle(grid);
    const columnGap = parseFloat(styles.columnGap) || 14;
    const rowGap = parseFloat(styles.rowGap) || columnGap;
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const borderLeft = parseFloat(styles.borderLeftWidth) || 0;
    const borderTop = parseFloat(styles.borderTopWidth) || 0;
    const row = parseFloat(styles.gridAutoRows) || parseFloat(styles.getPropertyValue("--dashboard-row-height")) || 72;
    const innerWidth = Math.max(1, grid.clientWidth - paddingLeft - paddingRight);
    const col = Math.max(1, (innerWidth - columnGap * 11) / 12);
    return {
      grid,
      rect,
      columnGap,
      rowGap,
      row,
      col,
      colStep:col + columnGap,
      rowStep:row + rowGap,
      contentLeft:rect.left + borderLeft + paddingLeft,
      contentTop:rect.top + borderTop + paddingTop
    };
  }
  function layoutAtPointer(event, id, grabCol = 0, grabRow = 0) {
    const { contentLeft, contentTop, colStep, rowStep } = gridMetrics();
    const current = state.widgetLayout[id];
    return {
      ...current,
      x: Math.max(1, Math.min(13 - current.w, Math.floor((event.clientX - contentLeft) / colStep) + 1 - grabCol)),
      y: Math.max(1, Math.floor((event.clientY - contentTop) / rowStep) + 1 - grabRow)
    };
  }
  function layoutsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function widgetUsesMainLayout(id) {
    if ((state.hiddenWidgets.includes(id) && !widgetIsMandatoryForRole(id)) || (state.widgetZones?.[id] || "main") === "right") return false;
    const node = document.querySelector(`[data-widget-id="${id}"]`) || document.querySelector(`[data-rail-item-id="${id}"]`);
    if (!node) return false;
    const kind = currentConfig().kind;
    if (kind === "staff" && (id === "attendance" || node.classList.contains("client-only"))) return false;
    if (kind === "client" && node.classList.contains("staff-only")) return false;
    return true;
  }
  function layoutIsFree(id, candidate) {
    return Object.entries(state.widgetLayout).every(([otherId, layout]) =>
      otherId === id || !widgetUsesMainLayout(otherId) || !layoutsOverlap(candidate, layout)
    );
  }
  function firstFreeLayout(id) {
    const current = state.widgetLayout[id];
    for (let y = 1; y < 30; y += 1) {
      for (let x = 1; x <= 13 - current.w; x += 1) {
        const candidate = { ...current, x, y };
        if (layoutIsFree(id, candidate)) return candidate;
      }
    }
    return { ...current, x: 1, y: 30 };
  }
  // Verslepen is geen botsingstest: de gesleepte widget krijgt de gekozen
  // positie; andere widgets schuiven zo nodig op en sluiten gaten aan.
  // Werk op een kopie tot pointerup, zodat annuleren niets opslaat.
  function widgetMoveLayout(id, candidate, original) {
    const active = state.widgetOrder.filter(otherId =>
      otherId !== id && widgetUsesMainLayout(otherId) && original[otherId]
    ).sort((a, b) => (original[a].y - original[b].y) ||
      (original[a].x - original[b].x));
    const result = { [id]: { ...candidate } };
    const isClear = (otherId, layout) => Object.entries(result).every(([placedId, placed]) =>
      otherId === placedId || !layoutsOverlap(layout, placed)
    );

    // Behoud bij het verschuiven de breedte, hoogte en kolom van andere widgets.
    active.forEach(otherId => {
      const position = { ...original[otherId] };
      while (!isClear(otherId, position)) position.y += 1;
      result[otherId] = position;
    });

    // Vrijgekomen ruimte bovenin opvullen zonder de gesleepte widget te verplaatsen.
    active.sort((a, b) => (result[a].y - result[b].y) ||
      (result[a].x - result[b].x));
    active.forEach(otherId => {
      const position = result[otherId];
      for (let y = 1; y < position.y; y += 1) {
        const attempt = { ...position, y };
        if (Object.entries(result).every(([placedId, placed]) =>
          placedId === otherId || !layoutsOverlap(attempt, placed))) {
          result[otherId] = attempt;
          break;
        }
      }
    });
    return result;
  }

  // Kies de widget onder de aanwijzer aan de hand van de indeling bij het
  // begin van de sleepactie. De live preview mag het doel niet laten verspringen.
  function widgetSwapTarget(event, movingId, original) {
    const { contentLeft, contentTop, colStep, rowStep, col, row } = gridMetrics();
    const px = event.clientX - contentLeft;
    const py = event.clientY - contentTop;
    return state.widgetOrder.find(id => {
      if (id === movingId || !widgetUsesMainLayout(id) || !original[id]) return false;
      const box = original[id];
      const left = (box.x - 1) * colStep;
      const top = (box.y - 1) * rowStep;
      return px >= left && px < left + box.w * col + (box.w - 1) * (colStep - col)
        && py >= top && py < top + box.h * row + (box.h - 1) * (rowStep - row);
    }) || null;
  }

  // Een echte omwisseling: A gaat naar B's positie, B naar A's positie.
  // Hun eigen afmetingen blijven behouden. Alleen bij ongelijke formaten
  // schuiven eventueel conflicterende widgets omlaag.
  function widgetSwapLayout(movingId, targetId, original) {
    const moving = original[movingId];
    const target = original[targetId];
    const moved = { ...moving, x:Math.min(target.x, 13 - moving.w), y:target.y };
    const replaced = { ...target, x:Math.min(moving.x, 13 - target.w), y:moving.y };
    const result = { [movingId]:moved };
    // Plaats de tegenpartij zo dicht mogelijk bij de oude plek van A,
    // mocht die door de verschillende afmetingen niet volledig passen.
    while (layoutsOverlap(replaced, moved)) replaced.y += 1;
    result[targetId] = replaced;
    const others = state.widgetOrder.filter(id => id !== movingId && id !== targetId
      && widgetUsesMainLayout(id) && original[id]);
    others.sort((a,b) => (original[a].y-original[b].y) || (original[a].x-original[b].x));
    others.forEach(id => {
      const next = { ...original[id] };
      while (Object.values(result).some(placed => layoutsOverlap(next, placed))) next.y += 1;
      result[id] = next;
    });
    return result;
  }

  function startWidgetMove(event, widget) {
    if (!state.dashboardEditMode) return;
    if ((state.widgetZones?.[widget.dataset.widgetId] || "main") === "right") {
      startRailMove(event, widget);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const { colStep, rowStep } = gridMetrics();
    const rect = widget.getBoundingClientRect();
    widgetMove = {
      id: widget.dataset.widgetId,
      grabCol: Math.max(0, Math.floor((event.clientX - rect.left) / colStep)),
      grabRow: Math.max(0, Math.floor((event.clientY - rect.top) / rowStep)),
      original: Object.fromEntries(Object.entries(state.widgetLayout).map(([id, layout]) => [id, { ...layout }])),
      candidate: { ...state.widgetLayout[widget.dataset.widgetId] },
      preview: null
    };
    widget.classList.add("moving");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function updateWidgetMove(event) {
    if (!widgetMove) return;
    const candidate = layoutAtPointer(event, widgetMove.id, widgetMove.grabCol, widgetMove.grabRow);
    const targetId = widgetSwapTarget(event, widgetMove.id, widgetMove.original);
    const old = widgetMove.candidate;
    if (old && old.x === candidate.x && old.y === candidate.y && widgetMove.targetId === targetId) return;
    widgetMove.candidate = candidate;
    widgetMove.targetId = targetId;
    widgetMove.preview = targetId
      ? widgetSwapLayout(widgetMove.id, targetId, widgetMove.original)
      : widgetMoveLayout(widgetMove.id, candidate, widgetMove.original);
    const grid = $("#widgetGrid");
    Object.entries(widgetMove.preview).forEach(([id, layout]) => {
      const node = $(`[data-widget-id="${id}"]`, grid);
      if (!node) return;
      node.style.gridColumn = `${layout.x} / span ${layout.w}`;
      node.style.gridRow = `${layout.y} / span ${layout.h}`;
      node.classList.remove("invalid-layout");
    });
  }
  function finishWidgetMove() {
    if (!widgetMove) return;
    const { id } = widgetMove;
    if (!widgetMove.preview) {
      widgetMove = null;
      renderWidgets();
      return;
    }
    const plan = widgetMove.preview;
    Object.assign(state.widgetLayout, plan);
    widgetMove = null;
    commitDashboardCustomization();
    saveState();
    applyPreferences();
    renderWidgets();
    showToast("Widgetpositie aangepast.");
  }
  // Hoogtegrenzen voorkomen dat widgets onbruikbaar klein of buitensporig hoog worden.
  // Afmetingen zijn aantallen dashboard-rasterrijen; de breedte blijft vrij instelbaar.
  function dashboardWidgetHeightLimits(id) {
    const limits = {
      messages: { min: 8, max: 8 },
      tasks: { min: 4, max: 10 },
      attendance: { min: 3, max: 7 },
      diary: { min: 3, max: 7 },
      weather: { min: 3, max: 5 },
      calendar: { min: 4, max: 8 },
      agenda: { min: 3, max: 8 },
      closures: { min: 3, max: 6 },
      workspace: { min: 3, max: 6 }
    };
    return limits[id] || { min: 3, max: 8 };
  }
  function startWidgetResize(event, widget) {
    if (!state.dashboardEditMode || (state.widgetZones?.[widget.dataset.widgetId] || "main") === "right") return;
    event.preventDefault();
    event.stopPropagation();
    const id = widget.dataset.widgetId;
    widgetResize = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      original: { ...state.widgetLayout[id] },
      candidate: { ...state.widgetLayout[id] }
    };
    widget.classList.add("resizing");
    widget.setPointerCapture?.(event.pointerId);
  }
  function updateWidgetResize(event) {
    if (!widgetResize) return;
    const { colStep, rowStep } = gridMetrics();
    const deltaW = Math.round((event.clientX - widgetResize.startX) / colStep);
    const deltaH = widgetResize.id === "messages" ? 0 : Math.round((event.clientY - widgetResize.startY) / rowStep);
    const original = widgetResize.original;
    const { min, max } = dashboardWidgetHeightLimits(widgetResize.id);
    const candidate = {
      ...original,
      w: Math.max(3, Math.min(13 - original.x, original.w + deltaW)),
      h: Math.max(min, Math.min(max, original.h + deltaH))
    };
    widgetResize.candidate = candidate;
    const node = $(`[data-widget-id="${widgetResize.id}"]`, $("#widgetGrid"));
    node.style.gridColumn = `${candidate.x} / span ${candidate.w}`;
    node.style.gridRow = `${candidate.y} / span ${candidate.h}`;
    node.classList.toggle("invalid-layout", !layoutIsFree(widgetResize.id, candidate));
  }
  function finishWidgetResize() {
    if (!widgetResize) return;
    const { id, candidate } = widgetResize;
    const node = $(`[data-widget-id="${id}"]`, $("#widgetGrid"));
    if (node) node.classList.remove("resizing", "invalid-layout");
    const valid = layoutIsFree(id, candidate);
    if (valid) {
      state.widgetLayout[id] = candidate;
      compactMainDashboardLayout(id);
      commitDashboardCustomization();
      saveState();
      applyPreferences();
      showToast("Widgetformaat opgeslagen.");
    } else {
      showToast("Dit formaat overlapt een andere widget.");
    }
    widgetResize = null;
    renderWidgets();
  }

  function renderOwnWorkspace() {
    const root = $("#ownWorkspaceSummary");
    if (!root || currentConfig().kind !== "client") return;
    const assignments = state.roomAssignments
      .filter(item => item.client === currentAccountName())
      .sort((a, b) => roomDays.findIndex(([day]) => day === a.day) - roomDays.findIndex(([day]) => day === b.day));
    const assignment = assignments[0];
    if (!assignment) {
      root.innerHTML = `<div class="empty-state"><p>Er staat nog geen werkplek voor je ingepland.</p></div>`;
      return;
    }
    const room = rooms.find(item => item.id === assignment.roomId);
    const dayLabel = roomDays.find(([day]) => day === assignment.day)?.[1] || assignment.day;
    root.innerHTML = `<div class="compact-row"><div class="person-mini-avatar">⌂</div><div class="compact-copy"><strong>${escapeHtml(room?.name || "Lokaal")}, plek ${assignment.seat}</strong><small>${dayLabel} · ${roomPartLabel(assignment.part)}</small></div></div>`;
  }


  function renderClientRoster() {
    const grid = $("#clientRosterGrid");
    if (!grid || currentConfig().kind !== "client") return;
    const config = currentConfig();
    const assignments = state.roomAssignments.filter(item => item.client === currentAccountName());
    const badge = $("#clientRosterDepartment");
    if (badge) badge.textContent = config.department === "it" ? "IT" : "MM";
    const heading = $("#clientRosterHeading");
    if (heading) heading.textContent = `${clientFullName(currentAccountName())} · ${config.department === "it" ? "IT" : "Multimedia"}`;
    grid.innerHTML = roomDays.map(([day, label]) => {
      const entries = assignments.filter(item => item.day === day);
      const friday = day === "vr";
      return `<article class="client-roster-day${entries.length ? "" : " empty"}"><span>${label}</span><div class="client-roster-periods">${schedulePeriodHtml(entries, "morning")}${clientLunchBreakHtml({ closedAfternoon: friday })}${schedulePeriodHtml(entries, "afternoon", { closed: friday })}</div></article>`;
    }).join("");
    renderGuidanceWeek();
  }

  function sprintReviewStatus(item) {
    if (item?.manualStatus === "purple") return { id: "purple", label: "Sprint niet mogelijk" };
    if (item?.manualStatus === "blue") return { id: "blue", label: "In de gaten houden" };
    const cycleStart = item?.statusResetAt || item?.reviewDate;
    if (!cycleStart) return { id: "red", label: "Sprint zo snel mogelijk" };
    const reset = new Date(`${cycleStart}T12:00:00`);
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
    const elapsedDays = Math.max(0, Math.floor((todayLocal - reset) / 86400000));
    if (elapsedDays >= 45) return { id: "red", label: "Sprint zo snel mogelijk" };
    if (elapsedDays >= 31) return { id: "yellow", label: "Sprint nodig" };
    return { id: "green", label: "Sprint up to date" };
  }

  function formatSprintReviewDate(value) {
    if (!value) return "Geen datum";
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function renderSprintReviews() {
    const board = $("#sprintReviewBoard");
    if (!board) return;
    const department = currentConfig().department;
    if (!["multimedia", "it"].includes(department)) return;
    const heading = $("#page-sprintreviews .eyebrow");
    if (heading) heading.textContent = department === "it" ? "IT" : "Multimedia";
    const guides = data.people.filter(person => person.type === "staff" && person.department === department);
    board.classList.toggle("sprintreview-it", department === "it");
    board.innerHTML = guides.map(guide => {
      const entries = (state.sprintReviews || []).filter(item => item.guide === guide.name);
      return `<article class="sprintreview-column" data-sprint-guide="${escapeHtml(guide.name)}">
        <header class="sprintreview-column-header">
          <div class="avatar" aria-hidden="true">${escapeHtml(guide.name[0])}</div>
          <strong class="sprintreview-guide-name">${escapeHtml(guide.name)}</strong>
        </header>
        <div class="sprintreview-client-list" data-sprint-drop-guide="${escapeHtml(guide.name)}">
          ${entries.length ? entries.map(item => {
            const status = sprintReviewStatus(item);
            return `<article class="sprintreview-client status-${status.id}" data-sprint-client="${escapeHtml(item.client)}" draggable="true">
              <strong class="sprintreview-client-name">${escapeHtml(clientDisplayName(item.client))}</strong>
              <label class="sprintreview-date-control" title="Klik om de sprintreviewdatum aan te passen">
                <span class="sr-only">Sprintreviewdatum voor ${escapeHtml(clientDisplayName(item.client))}</span>
                <input type="date" min="${dateToIso(new Date())}" value="${escapeHtml(item.reviewDate || "")}" data-sprint-review-date="${escapeHtml(item.client)}" aria-label="Sprintreviewdatum voor ${escapeHtml(clientDisplayName(item.client))}" />
              </label>
              <div class="sprintreview-status-control">
                <button class="sprintreview-status-button" type="button" data-sprint-status-toggle="${escapeHtml(item.client)}" aria-label="Status ${escapeHtml(status.label)}. Klik om aan te passen." title="${escapeHtml(status.label)}"></button>
                <div class="sprintreview-status-menu" role="menu" aria-label="Status instellen voor ${escapeHtml(item.client)}">
                  <button type="button" data-sprint-status-value="auto" data-sprint-client-status="${escapeHtml(item.client)}">Automatisch</button>
                  <button type="button" data-sprint-status-value="blue" data-sprint-client-status="${escapeHtml(item.client)}"><i class="status-blue"></i>In de gaten houden</button>
                  <button type="button" data-sprint-status-value="purple" data-sprint-client-status="${escapeHtml(item.client)}"><i class="status-purple"></i>Sprint niet mogelijk</button>
                </div>
              </div>
            </article>`;
          }).join("") : `<div class="empty-state"><p>Geen mediënten gekoppeld.</p></div>`}
        </div>
      </article>`;
    }).join("");

    let draggedSprintClient = "";
    board.ondragstart = event => {
      const card = event.target.closest('.sprintreview-client');
      if (!card) return;
      if (event.target.closest('input, button, label, .sprintreview-status-control')) {
        event.preventDefault();
        return;
      }
      draggedSprintClient = card.dataset.sprintClient || "";
      if (!draggedSprintClient) return;
      card.classList.add('dragging');
      event.dataTransfer?.setData('text/plain', draggedSprintClient);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    };
    board.ondragover = event => {
      const dropZone = event.target.closest('[data-sprint-drop-guide]');
      if (!dropZone || !draggedSprintClient) return;
      event.preventDefault();
      $$('.sprintreview-client-list.drop-target', board).forEach(list => list.classList.remove('drop-target'));
      dropZone.classList.add('drop-target');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    };
    board.ondrop = event => {
      const dropZone = event.target.closest('[data-sprint-drop-guide]');
      if (!dropZone) return;
      event.preventDefault();
      const client = draggedSprintClient || event.dataTransfer?.getData('text/plain') || "";
      const guide = dropZone.dataset.sprintDropGuide || "";
      const item = state.sprintReviews.find(entry => entry.client === client);
      $$('.sprintreview-client-list.drop-target', board).forEach(list => list.classList.remove('drop-target'));
      if (!item || !guide || item.guide === guide) {
        draggedSprintClient = "";
        return;
      }
      item.guide = guide;
      draggedSprintClient = "";
      saveState();
      renderSprintReviews();
      showToast(`${clientDisplayName(client)} is gekoppeld aan ${guide}.`);
    };
    board.ondragend = () => {
      draggedSprintClient = "";
      $$('.sprintreview-client.dragging', board).forEach(card => card.classList.remove('dragging'));
      $$('.sprintreview-client-list.drop-target', board).forEach(list => list.classList.remove('drop-target'));
    };

    board.onchange = event => {
      const input = event.target.closest('[data-sprint-review-date]');
      if (!input) return;
      const item = state.sprintReviews.find(entry => entry.client === input.dataset.sprintReviewDate);
      if (!item) return;
      const today = dateToIso(new Date());
      const chosenDate = input.value;
      // Validate before changing the review or resetting its status; a past date
      // must never accidentally make an overdue sprint green.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(chosenDate) ||
          dateToIso(parseDateOnly(chosenDate)) !== chosenDate || chosenDate < today) {
        input.value = item.reviewDate || "";
        showToast("Kies vandaag of een toekomstige datum. De sprintstatus is niet gewijzigd.");
        return;
      }
      if (chosenDate === item.reviewDate) return;
      item.reviewDate = chosenDate;
      item.statusResetAt = today;
      item.manualStatus = null;
      saveState();
      renderSprintReviews();
      showToast(`${clientDisplayName(item.client)}: sprintreviewdatum bijgewerkt. De sprintcyclus is opnieuw gestart.`);
    };

    board.onclick = event => {
      const toggle = event.target.closest('[data-sprint-status-toggle]');
      if (toggle) {
        event.stopPropagation();
        const row = toggle.closest('.sprintreview-client');
        $$('.sprintreview-client.status-menu-open', board).forEach(other => {
          if (other !== row) other.classList.remove('status-menu-open');
        });
        row?.classList.toggle('status-menu-open');
        return;
      }
      const option = event.target.closest('[data-sprint-client-status]');
      if (!option) {
        $$('.sprintreview-client.status-menu-open', board).forEach(row => row.classList.remove('status-menu-open'));
        return;
      }
      event.stopPropagation();
      const item = state.sprintReviews.find(entry => entry.client === option.dataset.sprintClientStatus);
      if (!item) return;
      const value = option.dataset.sprintStatusValue;
      item.manualStatus = value === 'auto' ? null : value;
      saveState();
      renderSprintReviews();
      const status = sprintReviewStatus(item);
      showToast(`${clientDisplayName(item.client)}: ${status.label}.`);
    };
  }

  function closureDateLabel(item) {
    const start = new Date(`${item.start}T12:00:00`);
    const end = new Date(`${item.end}T12:00:00`);
    const oneDay = item.start === item.end;
    if (oneDay) return new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"short" }).format(start);
    const startLabel = new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"short" }).format(start);
    const endLabel = new Intl.DateTimeFormat("nl-NL", { day:"numeric", month:"short" }).format(end);
    return `${startLabel} t/m ${endLabel}`;
  }

  function renderClosures() {
    const target = $("#railClosures");
    if (!target) return;
    const today = prototypeToday();
    const upcoming = state.closures
      .filter(item => item.end >= today)
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 4);
    target.innerHTML = upcoming.length
      ? upcoming.map(item => `<div class="closure-row"><div class="closure-date">${escapeHtml(closureDateLabel(item))}</div><div class="closure-copy"><strong>${richTitleHtml(item)}</strong><small>Spectrum dicht</small>${currentConfig().kind === "staff" ? `<button class="calendar-rail-edit" type="button" data-rail-edit-closure="${escapeHtml(item.id)}">Bewerken</button>` : ""}</div></div>`).join("")
      : `<div class="closure-empty">Geen komende sluitingsdagen.</div>`;
    $$('[data-rail-edit-closure]', target).forEach(button => button.addEventListener('click', () => {
      if (currentConfig().kind === 'staff') openAgendaDialog(null, null, null, null, button.dataset.railEditClosure);
    }));
  }

  function renderAll() {
    applyPreferences();
    renderRoleSummary();
    renderClock();
    renderKanbans();
    renderAttendance();
    renderMessages();
    renderGoals();
    renderNotifications();
    renderAgenda();
    renderClosures();
    renderDiary();
    renderWidgets();
    renderProfile();
    if (currentConfig().kind === "staff") {
      if (["multimedia", "it"].includes(currentConfig().department)) renderSprintReviews();
      renderStaffDashboard();
      renderRoomSchedule();
    } else {
      renderOwnWorkspace();
      renderClientRoster();
    }
    requestAnimationFrame(updateSidebarScrollCue);
  }
  function resetDemo() {
    state = cloneDefaultState();
    plannerViewedStaffId = state.role;
    data.people.splice(0, data.people.length, ...data.people.filter(person => !person.accountId));
    syncAccountsFromState();
    roomMultiSelection = [];
    saveState();
    renderAll();
    setPage("dashboard");
    showToast("De demo is teruggezet naar de beginstand.");
  }

  let logoutAfterClockOut = false;

  function login(role, moodStart = null) {
    loginDeferredItems.clear();
    state.role = role;
    plannerViewedStaffId = role;
    state.authenticated = true;
    state.dashboardEditMode = false;
    // Inloggen IS inklokken: er is voor de gebruiker geen tweede aanwezigheidsactie meer nodig.
    if (!currentClock().active) {
      setCurrentClock({ active: true, startedAt: new Date().toISOString() });
      state.sessionActivity = [];
    }
    if (currentConfig().kind === "client" && moodStart) saveStartMood(moodStart);
    // Bewaar de echte gelezenstatus; markeer geen mededelingen stilzwijgend als gelezen.
    saveState();
    renderAll();
    setPage("dashboard");
    startClientAttentionMonitor();
    lastNotificationDay = prototypeToday();
    showToast("Ingelogd en ingeklokt.");
    if (currentConfig().kind === "client") setTimeout(showLoginMessagePopup, 120);
  }

  function finishLogout() {
    stopClientAttentionMonitor();
    state.authenticated = false;
    state.dashboardEditMode = false;
    logoutAfterClockOut = false;
    saveState();
    setMoodSelection("loginMood", "");
    setMoodSelection("clockOutMood", "");
    applyPreferences();
    updateLoginMoodVisibility();
  }

  function logout() {
    const config = currentConfig();
    // Voor mediënten is uitloggen ook de bestaande uitklok-/dagboekflow.
    if (config.kind === "client" && currentClock().active) {
      logoutAfterClockOut = true;
      prepareClockOutDialog();
      $("#clockOutDialog").showModal();
      return;
    }
    // Begeleiding klokt bij uitloggen direct uit; er is geen mediënt-dagverslag nodig.
    if (currentClock().active) setCurrentClock({ active: false, startedAt: null });
    finishLogout();
  }


  /* =========================================================
     SPECTRUM TETRIS — hidden easter egg
     Trigger: seven quick clicks on the Spectrum brand.
     ========================================================= */
  const tetrisPieces = {
    I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    J:[[1,0,0],[1,1,1],[0,0,0]],
    L:[[0,0,1],[1,1,1],[0,0,0]],
    O:[[1,1],[1,1]],
    S:[[0,1,1],[1,1,0],[0,0,0]],
    T:[[0,1,0],[1,1,1],[0,0,0]],
    Z:[[1,1,0],[0,1,1],[0,0,0]]
  };
  const tetrisColors = {
    I:"#61a5e4", J:"#376a90", L:"#fbaa33", O:"#ffd17a",
    S:"#7bc0ef", T:"#416080", Z:"#f39a5a"
  };
  let tetrisGame = null;
  let tetrisAnimationFrame = 0;
  let tetrisBrandClicks = [];

  function tetrisEmptyBoard() {
    return Array.from({length:20}, () => Array(10).fill(null));
  }
  function tetrisCloneMatrix(matrix) { return matrix.map(row => row.slice()); }
  function tetrisRotateMatrix(matrix) {
    const size = matrix.length;
    return Array.from({length:size}, (_, y) => Array.from({length:size}, (_, x) => matrix[size - 1 - x][y]));
  }
  function tetrisShuffleBag() {
    const bag = Object.keys(tetrisPieces);
    for (let i=bag.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [bag[i],bag[j]]=[bag[j],bag[i]];
    }
    return bag;
  }
  function tetrisTakeType() {
    if (!tetrisGame.bag.length) tetrisGame.bag=tetrisShuffleBag();
    return tetrisGame.bag.pop();
  }
  function tetrisMakePiece(type) {
    const matrix=tetrisCloneMatrix(tetrisPieces[type]);
    return {type, matrix, x:Math.floor((10-matrix[0].length)/2), y:-1};
  }
  function tetrisCollides(piece, dx=0, dy=0, matrix=piece.matrix) {
    for (let y=0;y<matrix.length;y++) for (let x=0;x<matrix[y].length;x++) {
      if (!matrix[y][x]) continue;
      const bx=piece.x+x+dx, by=piece.y+y+dy;
      if (bx<0 || bx>=10 || by>=20) return true;
      if (by>=0 && tetrisGame.board[by][bx]) return true;
    }
    return false;
  }
  function tetrisSpawn() {
    const type=tetrisGame.nextType || tetrisTakeType();
    tetrisGame.nextType=tetrisTakeType();
    tetrisGame.piece=tetrisMakePiece(type);
    tetrisDrawNext();
    if (tetrisCollides(tetrisGame.piece,0,0)) tetrisGameOver();
  }
  function tetrisMerge() {
    const piece=tetrisGame.piece;
    piece.matrix.forEach((row,y) => row.forEach((value,x) => {
      if (!value) return;
      const by=piece.y+y;
      if (by>=0) tetrisGame.board[by][piece.x+x]=piece.type;
    }));
  }
  function tetrisClearLines() {
    let cleared=0;
    for (let y=19;y>=0;y--) {
      if (tetrisGame.board[y].every(Boolean)) {
        tetrisGame.board.splice(y,1);
        tetrisGame.board.unshift(Array(10).fill(null));
        cleared++;
        y++;
      }
    }
    if (!cleared) return;
    const points=[0,100,300,500,800][cleared] * tetrisGame.level;
    tetrisGame.score += points;
    tetrisGame.lines += cleared;
    tetrisGame.level = 1 + Math.floor(tetrisGame.lines / 10);
    tetrisGame.dropInterval = Math.max(90, 720 - (tetrisGame.level - 1) * 58);
    tetrisUpdateStats();
  }
  function tetrisLockPiece() {
    tetrisMerge();
    tetrisClearLines();
    tetrisSpawn();
  }
  function tetrisMove(dx) {
    if (!tetrisGame || tetrisGame.paused || tetrisGame.over) return;
    if (!tetrisCollides(tetrisGame.piece,dx,0)) tetrisGame.piece.x += dx;
  }
  function tetrisSoftDrop(manual=false) {
    if (!tetrisGame || tetrisGame.paused || tetrisGame.over) return;
    if (!tetrisCollides(tetrisGame.piece,0,1)) {
      tetrisGame.piece.y++;
      if (manual) { tetrisGame.score++; tetrisUpdateStats(); }
    } else {
      tetrisLockPiece();
    }
    tetrisGame.dropElapsed=0;
  }
  function tetrisHardDrop() {
    if (!tetrisGame || tetrisGame.paused || tetrisGame.over) return;
    let distance=0;
    while (!tetrisCollides(tetrisGame.piece,0,1)) { tetrisGame.piece.y++; distance++; }
    tetrisGame.score += distance*2;
    tetrisUpdateStats();
    tetrisLockPiece();
    tetrisGame.dropElapsed=0;
  }
  function tetrisRotate() {
    if (!tetrisGame || tetrisGame.paused || tetrisGame.over || tetrisGame.piece.type === "O") return;
    const rotated=tetrisRotateMatrix(tetrisGame.piece.matrix);
    for (const kick of [0,-1,1,-2,2]) {
      if (!tetrisCollides(tetrisGame.piece,kick,0,rotated)) {
        tetrisGame.piece.x += kick;
        tetrisGame.piece.matrix=rotated;
        return;
      }
    }
  }
  function tetrisGhostY() {
    let dy=0;
    while (!tetrisCollides(tetrisGame.piece,0,dy+1)) dy++;
    return tetrisGame.piece.y+dy;
  }
  function tetrisDrawCell(ctx,x,y,color,alpha=1,size=24) {
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.fillStyle=color;
    ctx.fillRect(x*size+1,y*size+1,size-2,size-2);
    ctx.fillStyle="rgba(255,255,255,.16)";
    ctx.fillRect(x*size+2,y*size+2,size-4,2);
    ctx.restore();
  }
  function tetrisDrawPiece(ctx,piece,yOverride=null,alpha=1) {
    const py=yOverride===null?piece.y:yOverride;
    piece.matrix.forEach((row,y) => row.forEach((value,x) => {
      const drawY=py+y;
      if (value && drawY>=0) tetrisDrawCell(ctx,piece.x+x,drawY,tetrisColors[piece.type],alpha);
    }));
  }
  function tetrisDraw() {
    const canvas=$("#spectrumTetrisCanvas");
    if (!canvas || !tetrisGame) return;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#091826";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle="rgba(97,165,228,.055)";
    ctx.lineWidth=1;
    for (let x=1;x<10;x++) { ctx.beginPath(); ctx.moveTo(x*24+.5,0); ctx.lineTo(x*24+.5,480); ctx.stroke(); }
    for (let y=1;y<20;y++) { ctx.beginPath(); ctx.moveTo(0,y*24+.5); ctx.lineTo(240,y*24+.5); ctx.stroke(); }
    tetrisGame.board.forEach((row,y)=>row.forEach((type,x)=>{ if(type) tetrisDrawCell(ctx,x,y,tetrisColors[type]); }));
    if (tetrisGame.piece && !tetrisGame.over) {
      tetrisDrawPiece(ctx,tetrisGame.piece,tetrisGhostY(),.18);
      tetrisDrawPiece(ctx,tetrisGame.piece);
    }
  }
  function tetrisDrawNext() {
    const canvas=$("#spectrumTetrisNext");
    if (!canvas || !tetrisGame?.nextType) return;
    const ctx=canvas.getContext("2d"), matrix=tetrisPieces[tetrisGame.nextType], cell=24;
    ctx.clearRect(0,0,120,120);
    const width=matrix[0].length*cell, height=matrix.length*cell;
    const ox=(120-width)/2, oy=(120-height)/2;
    matrix.forEach((row,y)=>row.forEach((v,x)=>{
      if (!v) return;
      ctx.fillStyle=tetrisColors[tetrisGame.nextType];
      ctx.fillRect(ox+x*cell+1,oy+y*cell+1,cell-2,cell-2);
      ctx.fillStyle="rgba(255,255,255,.16)";
      ctx.fillRect(ox+x*cell+2,oy+y*cell+2,cell-4,2);
    }));
  }
  function tetrisHighScore() {
    return Number(localStorage.getItem("spectrumHubTetrisHighScore") || 0);
  }
  function tetrisUpdateStats() {
    if (!tetrisGame) return;
    $("#spectrumTetrisScore").textContent=String(tetrisGame.score);
    $("#spectrumTetrisHighScore").textContent=String(Math.max(tetrisHighScore(),tetrisGame.score));
    $("#spectrumTetrisLevel").textContent=String(tetrisGame.level);
    $("#spectrumTetrisLines").textContent=String(tetrisGame.lines);
  }
  function tetrisSetOverlay(text="") {
    const overlay=$("#spectrumTetrisState");
    overlay.textContent=text;
    overlay.classList.toggle("hidden",!text);
  }
  function tetrisGameOver() {
    if (!tetrisGame) return;
    tetrisGame.over=true;
    const old=tetrisHighScore();
    if (tetrisGame.score>old) localStorage.setItem("spectrumHubTetrisHighScore",String(tetrisGame.score));
    tetrisUpdateStats();
    tetrisSetOverlay(`Game over · ${tetrisGame.score} punten`);
  }
  function tetrisRestart() {
    cancelAnimationFrame(tetrisAnimationFrame);
    tetrisGame={
      board:tetrisEmptyBoard(), piece:null, nextType:null, bag:[], score:0, lines:0, level:1,
      paused:false, over:false, dropInterval:720, dropElapsed:0, lastTime:performance.now()
    };
    tetrisSetOverlay("");
    tetrisSpawn();
    tetrisUpdateStats();
    tetrisDraw();
    tetrisAnimationFrame=requestAnimationFrame(tetrisLoop);
  }
  function tetrisTogglePause() {
    if (!tetrisGame || tetrisGame.over) return;
    tetrisGame.paused=!tetrisGame.paused;
    tetrisSetOverlay(tetrisGame.paused?"Pauze":"");
    tetrisGame.lastTime=performance.now();
  }
  function tetrisLoop(now) {
    if (!tetrisGame || !$("#spectrumTetrisDialog")?.open) return;
    const delta=Math.min(80,now-tetrisGame.lastTime);
    tetrisGame.lastTime=now;
    if (!tetrisGame.paused && !tetrisGame.over) {
      tetrisGame.dropElapsed += delta;
      if (tetrisGame.dropElapsed>=tetrisGame.dropInterval) tetrisSoftDrop(false);
    }
    tetrisDraw();
    tetrisAnimationFrame=requestAnimationFrame(tetrisLoop);
  }
  function openSpectrumTetris() {
    const dialog=$("#spectrumTetrisDialog");
    if (!dialog || dialog.open) return;
    dialog.showModal();
    tetrisRestart();
  }
  function closeSpectrumTetris() {
    cancelAnimationFrame(tetrisAnimationFrame);
    tetrisAnimationFrame=0;
    tetrisGame=null;
    $("#spectrumTetrisDialog")?.close();
  }
  function handleTetrisBrandClick() {
    const now=performance.now();
    tetrisBrandClicks=tetrisBrandClicks.filter(time=>now-time<2800);
    tetrisBrandClicks.push(now);
    if (tetrisBrandClicks.length>=7) {
      tetrisBrandClicks=[];
      openSpectrumTetris();
    }
  }
  function handleSpectrumTetrisKey(event) {
    if (!$("#spectrumTetrisDialog")?.open || !tetrisGame) return;
    const key=event.key.toLowerCase();
    if (["arrowleft","arrowright","arrowup","arrowdown"," ","a","d","w","s","p","r"].includes(key)) event.preventDefault();
    if (key==="arrowleft" || key==="a") tetrisMove(-1);
    else if (key==="arrowright" || key==="d") tetrisMove(1);
    else if (key==="arrowup" || key==="w") tetrisRotate();
    else if (key==="arrowdown" || key==="s") tetrisSoftDrop(true);
    else if (key===" ") tetrisHardDrop();
    else if (key==="p") tetrisTogglePause();
    else if (key==="r") tetrisRestart();
    tetrisDraw();
  }

  // A click on the dimmed backdrop is only a request to close. Saving,
  // accepting appointments and marking announcements as read remain explicit actions.
  const dialogInitialFormValues = new WeakMap();

  function dialogFormSnapshot(dialog) {
    const form = dialog.querySelector("form");
    // Widget controls apply immediately; there is no unsaved widget form to discard.
    if (!form || dialog.id === "widgetDialog" || (dialog.id === "taskDialog" && form.classList.contains("hidden"))) return null;
    const fields = [...form.querySelectorAll("input, select, textarea, [contenteditable='true']")]
      .filter(field => !field.closest(".dialog-rich-toolbar"));
    return JSON.stringify(fields.map(field => {
      if (field.isContentEditable) return ["html", field.innerHTML];
      if (field.type === "checkbox" || field.type === "radio") return ["checked", field.checked];
      if (field.tagName === "SELECT" && field.multiple) return ["selected", [...field.selectedOptions].map(option => option.value)];
      return ["value", field.value];
    }));
  }

  function dismissDialogWithoutAction(dialog) {
    if (!dialog?.open) return;
    const initial = dialogInitialFormValues.get(dialog);
    if (initial !== undefined && initial !== dialogFormSnapshot(dialog) &&
        !window.confirm("Je hebt niet-opgeslagen wijzigingen. Wil je sluiten zonder op te slaan?")) return;
    dialog.close();
  }

  function bindDialogBackdropDismissal() {
    $$('dialog').forEach(dialog => {
      // Dialogs are filled programmatically before showModal(); take the baseline
      // when the native `open` attribute changes, after the opener completes.
      const observer = new MutationObserver(() => {
        if (dialog.open) dialogInitialFormValues.set(dialog, dialogFormSnapshot(dialog));
        else dialogInitialFormValues.delete(dialog);
      });
      observer.observe(dialog, { attributes:true, attributeFilter:["open"] });
      let backdropPointer = null;
      const outside = event => {
        const rect = dialog.getBoundingClientRect();
        return event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom;
      };
      dialog.addEventListener("pointerdown", event => {
        backdropPointer = event.target === dialog && outside(event) ? event.pointerId : null;
      });
      dialog.addEventListener("pointercancel", () => { backdropPointer = null; });
      dialog.addEventListener("click", event => {
        if (event.target !== dialog || !outside(event)) return;
        const wasBackdropClick = backdropPointer !== null;
        backdropPointer = null;
        if (!wasBackdropClick) return; // Do not dismiss when dragging a selection out.
        event.preventDefault();
        event.stopPropagation();
        dismissDialogWithoutAction(dialog);
      });
      dialog.addEventListener("close", () => {
        backdropPointer = null;
        dialogInitialFormValues.delete(dialog);
      });
      // Match the backdrop behavior for the browser's native Escape action.
      dialog.addEventListener("cancel", event => {
        event.preventDefault();
        dismissDialogWithoutAction(dialog);
      });
    });
  }

  function bindGlobalEvents() {
    // Cmd/Ctrl loslaten na klikken of slepen opent één keer het inplanformulier.
    // De expliciete knopmodus blijft afhankelijk van 'Selectie instellen'.
    window.addEventListener("keyup", finishRoomModifierSelection);
    $("#roomGrid")?.addEventListener("pointerdown", beginRoomModifierDrag);
    window.addEventListener("pointermove", moveRoomModifierDrag);
    window.addEventListener("pointerup", endRoomModifierDrag);
    window.addEventListener("pointercancel", endRoomModifierDrag);
    document.addEventListener("click", event => {
      if (!roomSuppressDragClick) return;
      roomSuppressDragClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    $("#roomBatchDialog").addEventListener("close", () => {
      if (!roomBatchOpenedFromModifier) return;
      roomBatchOpenedFromModifier = false;
      // Annuleren laat geen schijnbaar actieve selectie achter. Na opslaan
      // is de selectie al door saveRoomBatchSelection leeggemaakt.
      if (roomMultiSelection.length) clearRoomMultiSelection();
    });
    // Form dialogs use custom submit handlers, so native method=dialog close buttons
    // can otherwise be swallowed by preventDefault. Make every X/Annuleren close explicitly.
    $$('dialog [aria-label="Sluiten"], dialog button[value="cancel"]').forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        button.closest("dialog")?.close();
      });
    });
    window.addEventListener("storage", event => {
      if (event.key !== STORAGE_KEY) return;
      syncLiveCalendarFromStorage();
      if (state.authenticated && currentConfig().kind === "client") {
        checkForNewClientAttention({ syncStorage:true });
      }
    });
    // Herstel de laatste kalenderstand als een tabblad lange tijd op de achtergrond stond.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") syncLiveCalendarFromStorage();
    });
    document.addEventListener("pointermove", event => {
      updateWidgetMove(event);
      updateWidgetResize(event);
      updateRailMove(event);
    });
    const finishPointerInteractions = () => {
      finishWidgetMove();
      finishWidgetResize();
      finishRailMove();
    };
    document.addEventListener("pointerup", finishPointerInteractions);
    document.addEventListener("pointercancel", finishPointerInteractions);
    $("#loginForm").addEventListener("submit", event => {
      event.preventDefault();
      const role = $("#loginRole").value;
      const config = roleConfig[role] || roleConfig["client-mm"];
      const account = state.accounts.find(item => item.id === role);
      const password = $("#loginPassword").value;
      if (!account || password !== account.password) {
        showToast("Naam of wachtwoord klopt niet.");
        return;
      }
      const mood = $("#loginMood").value;
      if (config.kind === "client" && !mood) {
        showToast("Kies eerst hoe je de dag in gaat.");
        $("#loginMoodFieldset")?.classList.add("mood-required");
        return;
      }
      $("#loginMoodFieldset")?.classList.remove("mood-required");
      login(role, mood || null);
    });
    $("#loginRole").addEventListener("change", updateLoginMoodVisibility);
    $$('[data-mood-target]').forEach(button => button.addEventListener("click", () => {
      setMoodSelection(button.dataset.moodTarget, button.dataset.mood);
      button.closest("fieldset")?.classList.remove("mood-required");
    }));
    $("#arrivalClockIn").addEventListener("click", () => {
      setCurrentClock({ active: true, startedAt: new Date().toISOString() });
      state.sessionActivity = [];
      saveState(); renderClock(); $("#arrivalDialog").close(); showToast("Je bent ingeklokt.");
    });
    $("#arrivalContinue").addEventListener("click", () => $("#arrivalDialog").close());
    $("#logoutButton").addEventListener("click", logout);
    $(".sidebar-brand")?.addEventListener("click", handleTetrisBrandClick);
    $("#spectrumTetrisClose")?.addEventListener("click", closeSpectrumTetris);
    $("#spectrumTetrisRestart")?.addEventListener("click", tetrisRestart);
    $("#spectrumTetrisDialog")?.addEventListener("close", () => { cancelAnimationFrame(tetrisAnimationFrame); tetrisAnimationFrame=0; tetrisGame=null; });
    document.addEventListener("keydown", handleSpectrumTetrisKey);
    $$(".nav-item[data-page]").forEach(button => button.addEventListener("click", () => {
      // De vaste kalenderknop brengt je naar de huidige werkdag.
      if (button.dataset.page === "agenda") {
        // A prior calendar selection is not a permanent indicator on the calendar.
        calendarRange = null;
        calendarAnchor = null;
        calendarDrag = null;
        state.selectedDate = nextWorkday(prototypeToday());
        state.calendarCursor = state.selectedDate.slice(0, 7);
        saveState();
      }
      setPage(button.dataset.page);
    }));
    $("#profileButton").addEventListener("click", () => setPage("profile"));
    $("#notificationsButton").addEventListener("click", () => { renderNotifications(); $("#notificationsDialog").showModal(); });
    $("#closeNotificationsDialog").addEventListener("click", () => $("#notificationsDialog").close());
    $("#loginMessageReadButton").addEventListener("click", markLoginMessageRead);
    $("#loginMessageLaterButton").addEventListener("click", remindLoginMessageLater);
    $$('[data-open-page]').forEach(button => button.addEventListener("click", () => {
      const page = button.dataset.openPage;
      if (page === "agenda" && button.closest('[data-rail-item-id="agenda"]')) {
        calendarRange = null;
        calendarAnchor = null;
        calendarDrag = null;
        state.selectedDate = prototypeToday();
        state.calendarCursor = state.selectedDate.slice(0, 7);
        saveState();
      }
      setPage(page);
    }));
    $("#sidebarToggle").addEventListener("click", () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      saveState();
      applyPreferences();
    });
    $("#sidebarScrollArea")?.addEventListener("scroll", updateSidebarScrollCue, { passive:true });
    window.addEventListener("resize", () => requestAnimationFrame(updateSidebarScrollCue));
    $("#roleSelect").addEventListener("change", event => {
      state.role = event.target.value;
      plannerViewedStaffId = state.role;
      saveState();
      renderAll();
      setPage("dashboard");
      showToast(`Demo-rol gewijzigd naar ${(roleConfig[state.role] || roleConfig["staff-mm"]).label}.`);
    });
    const openAttendanceFromSummary = () => {
      if ((roleConfig[state.role] || roleConfig["client-mm"]).kind === "staff") setPage("clock"); else openAttendanceDialog();
    };
    [$("#presentSummaryCard"), $("#staffSummaryCard")].forEach(card => {
      card.addEventListener("click", openAttendanceFromSummary);
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openAttendanceFromSummary(); }
      });
    });
    const openRoleSummary = () => {
      const card = $("#nextAppointmentCard");
      if (card.dataset.action === "help" || card.dataset.action === "tasks") {
        setPage("tasks");
        return;
      }
      const agendaId = card.dataset.agendaId;
      const agendaItem = agendaId ? state.agendaItems.find(item => item.id === agendaId) : null;
      if (agendaId?.startsWith("announcement-")) {
        showLoginMessagePopup(agendaId.slice("announcement-".length));
        return;
      }
      if (agendaItem) {
        openAgendaDialog(agendaId);
        return;
      }
      setPage("agenda");
    };
    $("#nextAppointmentCard").addEventListener("click", openRoleSummary);
    $("#nextAppointmentCard").addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRoleSummary(); }
    });
    $("#clientSearch").addEventListener("input", renderClientList);
    $("#clientFilter").addEventListener("change", renderClientList);
    $("#clientDetailBack").addEventListener("click", () => setPage("clock"));
    $$("[data-client-detail-tab]").forEach(button => button.addEventListener("click", () => {
      selectedClientDetailTab = button.dataset.clientDetailTab;
      renderClientDetail();
    }));
    $("#clientDetailEditProfile").addEventListener("click", () => openClientProfileDialog(selectedClientName));
    $("#clientDetailDelete").addEventListener("click", () => { if (selectedClientName) deleteClientProfile(selectedClientName); });
    $("#newClientButton").addEventListener("click", () => openClientProfileDialog());
    $("#clientFullNames").addEventListener("change", renderClientList);
    $("#clientProfileDepartment").addEventListener("change", () => updateClientProfileTradeOptions());
    $("#clientProfileForm").addEventListener("submit", event => { event.preventDefault(); if (saveClientProfile()) $("#clientProfileDialog").close(); });
    $("#clientPlanningForm").addEventListener("submit", event => { event.preventDefault(); if (saveClientPlanning()) $("#clientPlanningDialog").close(); });
    $("#openClientInRooms").addEventListener("click", () => {
      const name = $("#clientPlanningName").value;
      const assignment = state.roomAssignments.find(item => item.client === name);
      if (assignment) {
        const room = rooms.find(item => item.id === assignment.roomId);
        state.roomTab = room.department;
        state.roomDay = assignment.day;
        state.roomView = "week";
        state.roomSelectedRoom[room.department] = room.id;
        saveState();
      }
      $("#clientPlanningDialog").close();
      setPage("rooms");
    });

    $("#clockButton").addEventListener("click", toggleClock);
    $("#clockPageButton").addEventListener("click", toggleClock);
    $("#editDashboardButton").addEventListener("click", () => {
      const enteringEditMode = !state.dashboardEditMode;
      if (enteringEditMode && state.dashboardPreset !== "custom") {
        // Never switch layout systems halfway through a drag/resize. Entering
        // dashboard editing first forks the current Standard baseline to Custom,
        // so the geometry is stable before the user touches a widget.
        // Begin met de actuele standaardindeling; laad geen oudere Custom-preset.
        const custom = currentDashboardSnapshot();
        applyDashboardSnapshot(custom);
        state.customDashboard = JSON.parse(JSON.stringify(custom));
        state.dashboardPreset = "custom";
      }
      state.dashboardEditMode = enteringEditMode;
      saveState();
      applyPreferences();
      renderWidgets();
    });
    $("#manageWidgetsButton").addEventListener("click", () => { expandedWidgetOptionId = null; widgetPolicyExpanded = false; renderWidgetOptions(); $("#widgetDialog").showModal(); });
    $("#closeWidgetDialog").addEventListener("click", () => $("#widgetDialog").close());
    $("#resetDemoButton").addEventListener("click", resetDemo);
    $("#settingsResetButton").addEventListener("click", resetDemo);
    $("#newDiaryButton").addEventListener("click", () => {
      setRichTextFieldValue("diaryNote", "");
      $("#diaryDialog").showModal();
    });
    $("#addTaskTopButton").addEventListener("click", () => currentConfig().kind === "staff" ? showToast("Klik en sleep in de weekplanning om een tijdsblok te kiezen.") : openTaskDialog());
    $("#motionToggle").addEventListener("change", event => {
      state.reduceMotion = event.target.checked;
      saveState();
      applyPreferences();
    });
    $("#themeModeSelect").addEventListener("change", event => {
      const mode = event.target.value === "dark" ? "dark" : "light";
      if (!state.themeModeByAccount || typeof state.themeModeByAccount !== "object") state.themeModeByAccount = {};
      state.themeModeByAccount[state.role] = mode;
      state.darkMode = mode === "dark";
      saveState();
      applyPreferences();
    });
    $("#dashboardPreset").addEventListener("change", event => selectDashboardLayout(event.target.value));
    $("#exportDemoButton").addEventListener("click", exportDemo);
    $("#importDemoInput").addEventListener("change", event => importDemo(event.target.files?.[0]));
    $("#messageFilter").addEventListener("change", renderMessages);
    ["communication", "manageMessage"].forEach(stem => {
      $$(`input[name="${stem}Kind"]`).forEach(input => input.addEventListener("change", () => {
        setAnnouncementKind(stem, announcementKindField(stem));
      }));
    });
    const refreshWeatherButton = $("#refreshWeatherButton");
    if (refreshWeatherButton) refreshWeatherButton.addEventListener("click", () => {
      loadWeather();
      showToast("Weergegevens worden vernieuwd.");
    });
    $$('[data-pin-widget]').forEach(button => button.addEventListener("click", () => togglePin(button.dataset.pinWidget)));

    [$("#quickNewCommunication"), $("#addCommunicationButton")].filter(Boolean).forEach(button => button.addEventListener("click", openCommunicationDialog));
    $("#communicationForm").addEventListener("submit", event => { event.preventDefault(); if (saveCommunication()) $("#communicationDialog").close(); });
    $("#messageManageForm").addEventListener("submit", event => {
      event.preventDefault();
      if (saveManagedMessage()) $("#messageManageDialog").close();
    });
    $("#deleteMessageButton").addEventListener("click", deleteManagedMessage);
    $("#staffRoomSnapshot").addEventListener("click", event => {
      const clientCard = event.target.closest("[data-open-local-client]");
      if (clientCard) { openClientDetail(clientCard.dataset.openLocalClient); return; }
      if (event.target.closest("[data-configure-local-rooms]")) setPage("profile");
    });
    [$("#addSprintGoalInline")].filter(Boolean).forEach(button => button.addEventListener("click", () => openGoalDialog(null, "sprint")));
    $("#addGoalForSelectedClient").addEventListener("click", () => openGoalDialog(null, "personal", selectedGoalsClientName));
    $("#goalType").addEventListener("change", updateGoalFormMode);
    $("#goalForm").addEventListener("submit", event => { event.preventDefault(); if (saveGoal()) $("#goalDialog").close(); });
    $("#deleteGoalButton").addEventListener("click", deleteGoal);
    const goalsSearchInput = $("#goalsClientSearch");
    const goalsSearchResults = $("#goalsSearchResults");
    goalsSearchInput.addEventListener("input", () => { selectedGoalsClientName = ""; renderGoals(); });
    goalsSearchInput.addEventListener("keydown", event => {
      if (event.key !== "ArrowDown") return;
      const first = goalsSearchResults.querySelector("[data-select-goals-client]");
      if (!first || goalsSearchResults.classList.contains("hidden")) return;
      event.preventDefault();
      first.focus();
    });
    goalsSearchResults.addEventListener("keydown", event => {
      const current = event.target.closest("[data-select-goals-client]");
      if (!current || !["ArrowDown", "ArrowUp", "Escape"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Escape") { goalsSearchInput.focus(); return; }
      const options = [...goalsSearchResults.querySelectorAll("[data-select-goals-client]")];
      const nextIndex = options.indexOf(current) + (event.key === "ArrowDown" ? 1 : -1);
      if (nextIndex < 0) { goalsSearchInput.focus(); return; }
      options[Math.min(nextIndex, options.length - 1)]?.focus();
    });
    $("#goalsDepartmentFilter").addEventListener("change", () => { selectedGoalsClientName = ""; renderGoals(); });
    $$("[data-room-department]").forEach(button => button.addEventListener("click", () => { state.roomTab = button.dataset.roomDepartment; state.roomView = "week"; roomMultiSelection = []; saveState(); renderRoomSchedule(); }));
    $("#roomSearch").addEventListener("input", renderRoomSchedule);
    $("#roomAssignmentForm").addEventListener("submit", event => {
      event.preventDefault();
      if (saveRoomAssignment()) $("#roomAssignmentDialog").close();
    });
    $("#roomBatchForm").addEventListener("submit", event => {
      event.preventDefault();
      if (saveRoomBatchSelection()) $("#roomBatchDialog").close();
    });
    $("#roomAssignmentMode").addEventListener("change", () => updateRoomModeUi("roomAssignment"));
    $("#roomLaterStartEnabled").addEventListener("change", updateRoomCustomTimeUi);
    $("#roomEarlyLeaveEnabled").addEventListener("change", updateRoomCustomTimeUi);
    $("#roomAssignmentPart").addEventListener("change", updateRoomCustomTimeUi);
    $("#roomBatchMode").addEventListener("change", () => updateRoomModeUi("roomBatch"));
    $("#deleteRoomAssignmentButton").addEventListener("click", deleteRoomAssignment);
    [$("#roomAssignmentRoom"), $("#roomAssignmentSeat"), $("#roomAssignmentClient"), $("#roomAssignmentPart"), $("#roomAssignmentDay")].forEach(control => control.addEventListener("change", () => $("#roomConflictMessage").classList.add("hidden")));
    $("#roomAssignmentDay").addEventListener("change", event => {
      updateRoomPartOptions(event.target.value, $("#roomAssignmentPart").value);
      updateRoomCustomTimeUi();
    });

    $("#closeCalendarDayDialog").addEventListener("click", () => $("#calendarDayDialog").close());
    $("#calendarDayAddButton").addEventListener("click", () => {
      const date = $("#calendarDayAddButton").dataset.calendarDate || state.selectedDate;
      $("#calendarDayDialog").close();
      openAgendaDialog(null, date);
    });
    $("#addAgendaItemButton").addEventListener("click", () => openAgendaDialog(
      null, calendarRange?.start || null, null, calendarRange?.end || null));
    $('#agendaCategory').addEventListener('change', updateAgendaFormMode);
    $('#agendaEndDate').addEventListener('change', () => {
      if ($('#agendaEndDate').value < $('#agendaDate').value) {
        showToast('Tot en met mag niet vóór de begindatum liggen.');
        $('#agendaEndDate').value = $('#agendaDate').value;
      }
    });
    $("#agendaDate").addEventListener("change", event => {
      const field = event.currentTarget;
      const item = state.agendaItems.find(entry => entry.id === $('#agendaId').value);
      if (!['closure', 'vacation'].includes($('#agendaCategory').value) && !isWorkday(field.value) && field.value !== item?.date) {
        showToast("Spectrum is zaterdag en zondag gesloten. Kies een werkdag.");
        field.value = field.dataset.lastValidDate || nextWorkday(prototypeToday());
      } else {
        field.dataset.lastValidDate = field.value;
        if ($('#agendaEndDate').value < field.value) $('#agendaEndDate').value = field.value;
      }
    });
    $("#quickAddAgendaButton").addEventListener("click", () => {
      const today = prototypeToday();
      state.selectedDate = today;
      state.calendarCursor = today.slice(0, 7);
      saveState();
      openAgendaDialog(null, today);
    });
    $("#closeAppointmentResponseDialog").addEventListener("click", () => $("#appointmentResponseDialog").close());
    $("#appointmentRespondLater").addEventListener("click", () => $("#appointmentResponseDialog").close());
    $("#appointmentAccept").addEventListener("click", () => respondToAppointment("accepted"));
    $("#appointmentDecline").addEventListener("click", () => respondToAppointment("declined"));
    $("#calendarPrevButton").addEventListener("click", () => changeCalendarPeriod(-1));
    $("#calendarNextButton").addEventListener("click", () => changeCalendarPeriod(1));
    $("#miniCalendarPrevButton").addEventListener("click", () => changeCalendarMonth(-1));
    $("#miniCalendarNextButton").addEventListener("click", () => changeCalendarMonth(1));
    $$("[data-agenda-view]").forEach(button => button.addEventListener("click", () => {
      state.agendaView = button.dataset.agendaView;
      if (state.agendaView !== "month") {
        state.selectedDate = nextWorkday(state.selectedDate);
        state.calendarCursor = state.selectedDate.slice(0, 7);
      }
      $$("[data-agenda-view]").forEach(item => item.classList.toggle("active", item === button));
      saveState();
      renderCalendars();
    }));

    $("#taskForm").addEventListener("submit", event => {
      event.preventDefault();
      if (saveTaskFromForm()) $("#taskDialog").close();
    });
    $("#taskDetailClose").addEventListener("click", () => $("#taskDialog").close());
    $("#taskDetailEdit").addEventListener("click", () => openTaskDialog($("#taskDetailView").dataset.taskId));
    $("#taskEditCancel").addEventListener("click", () => {
      const id = $("#taskId").value;
      if (id && $("#taskDetailView").dataset.taskId === id) openTaskDetails(id);
      else $("#taskDialog").close();
    });
    $("#taskDetailChecklist").addEventListener("change", event => {
      const checkbox = event.target.closest("[data-task-check]");
      if (!checkbox) return;
      const task = relevantTasks().find(item => item.id === $("#taskDetailView").dataset.taskId);
      if (!task || taskIsLocked(task)) return;
      const index = Number(checkbox.dataset.taskCheck);
      if (!setTaskChecklistChecked(task, index, checkbox.checked)) return;
      saveState();
      renderTaskDetails(task);
      renderKanbans();
      renderRoleSummary();
      $("#taskDetailChecklist").querySelector(`[data-task-check="${index}"]`)?.focus();
    });
    $("#deleteTaskButton").addEventListener("click", deleteCurrentTask);
    $("#taskArchiveButton").addEventListener("click", () => setTaskArchiveExpanded(!taskArchiveExpanded));
    $("#taskArchiveCloseButton").addEventListener("click", () => setTaskArchiveExpanded(false));
    $("#taskArchiveList").addEventListener("click", event => {
      const view = event.target.closest("[data-archive-view]");
      if (view) { openTaskDetails(view.dataset.archiveView); return; }
      const restore = event.target.closest("[data-archive-restore]");
      const remove = event.target.closest("[data-archive-delete]");
      const id = restore?.dataset.archiveRestore || remove?.dataset.archiveDelete;
      if (!id || currentConfig().kind !== "client") return;
      const task = relevantTasks().find(item => item.id === id && taskIsArchived(item));
      if (!task) return;
      if (restore) {
        resetCompletedTask(task);
        refreshTaskViews();
        showToast("Taak teruggezet naar Te doen.");
      } else if (remove && window.confirm(`Wil je de taak ‘${task.title}’ definitief verwijderen?`)) {
        state.tasks = state.tasks.filter(item => item.id !== id);
        refreshTaskViews();
        showToast("Taak definitief verwijderd.");
      }
    });
    $("#staffPlannerTaskForm").addEventListener("submit", event => {
      event.preventDefault();
      if (saveStaffPlannerTaskFromForm()) $("#staffPlannerTaskDialog").close();
    });
    $("#staffPlannerTaskForm").addEventListener("keydown", event => {
      if (event.key !== "Enter" || event.isComposing) return;
      if ((event.target instanceof HTMLTextAreaElement || event.target.isContentEditable) && event.shiftKey) return;
      if (event.target.closest("button, summary")) return;
      event.preventDefault();
      event.currentTarget.requestSubmit();
    });
    $("#deleteStaffPlannerTaskButton").addEventListener("click", deleteCurrentStaffPlannerTask);
    $("#staffPlannerCancelContinue").addEventListener("click", () => cancelStaffPlannerContinuation(true));
    $("#staffPlannerViewer").addEventListener("change", event => {
      plannerViewedStaffId = event.target.value;
      renderStaffTaskPlanner();
    });
    $("#staffPlannerPrevWeek").addEventListener("click", () => changeStaffPlannerWeek(-1));
    $("#staffPlannerNextWeek").addEventListener("click", () => changeStaffPlannerWeek(1));
    $("#staffPlannerTodayWeek").addEventListener("click", showCurrentStaffPlannerWeek);
    $("#staffPlannerTaskDate").addEventListener("change", () => {
      const day = syncStaffPlannerTaskDate();
      const start = $("#staffPlannerTaskStart").value;
      if (day === 4 && start >= "12:30") {
        $("#staffPlannerTaskStart").value = "12:00";
        $("#staffPlannerTaskEnd").value = "12:30";
      }
    });
    $("#staffPlannerTaskStart").addEventListener("change", () => {
      const day = Number($("#staffPlannerTaskDay").value);
      const start = $("#staffPlannerTaskStart").value;
      const end = $("#staffPlannerTaskEnd").value;
      if (day === 4 && start >= "12:30") {
        $("#staffPlannerTaskStart").value = "12:00";
        $("#staffPlannerTaskEnd").value = "12:30";
      } else if (plannerTimeIndex(end) <= plannerTimeIndex(start)) {
        $("#staffPlannerTaskEnd").value = plannerDefaultEnd(day, start);
      }
    });
    $("#staffPlannerTaskRecurrence").addEventListener("change", () => {
      const taskId = $("#staffPlannerTaskId").value;
      const task = taskId ? state.staffPlannerTasks.find(item => item.id === taskId) : null;
      updateStaffPlannerRecurrenceUi(task);
    });
    $("#agendaForm").addEventListener("submit", event => {
      event.preventDefault();
      if (saveAgendaFromForm()) $("#agendaDialog").close();
    });
    $("#deleteAgendaButton").addEventListener("click", deleteCurrentAgendaItem);
    $("#clockOutForm").addEventListener("submit", event => {
      event.preventDefault();
      const mood = $("#clockOutMood").value;
      if (!mood) {
        showToast("Kies eerst hoe je de dag uit gaat.");
        $("#clockOutMoodPicker")?.closest("fieldset")?.classList.add("mood-required");
        return;
      }
      $("#clockOutMoodPicker")?.closest("fieldset")?.classList.remove("mood-required");
      completeClockOut($("#clockOutNote").value, mood);
      $("#clockOutDialog").close();
    });
    $("#diaryForm").addEventListener("submit", event => {
      event.preventDefault();
      const text = $("#diaryNote").value.trim();
      if (!text) return;
      state.diary.unshift({ id: createId("diary"), client: currentAccountName(), department: currentConfig().department, date: new Date().toISOString(), text });
      saveState();
      renderDiary();
      $("#diaryDialog").close();
      showToast("Dagboeknotitie opgeslagen.");
    });
    $("#profileWeekdays").addEventListener("change", event => {
      const input = event.target.closest("input[data-shift-part]");
      if (!input) return;
      const row = input.closest(".staff-shift-row");
      if (!row) return;
      const morning = row.querySelector('[data-shift-part="morning"]').checked;
      const afternoon = row.querySelector('[data-shift-part="afternoon"]').checked;
      const start = row.querySelector('[data-shift-time="start"]');
      const end = row.querySelector('[data-shift-time="end"]');
      // Pas alleen de oude standaardtijd aan; handmatig gekozen tijden blijven staan.
      if (input.dataset.shiftPart === "morning" && (start.value === "09:00" || start.value === "13:00"))
        start.value = morning ? "09:00" : "13:00";
      if (input.dataset.shiftPart === "afternoon" && (end.value === "12:30" || end.value === "16:30"))
        end.value = afternoon ? "16:30" : "12:30";
    });
    $("#profileForm").addEventListener("submit", event => {
      event.preventDefault();
      saveProfile();
    });
    $("#profilePasswordForm").addEventListener("submit", event => { event.preventDefault(); saveOwnPassword(); });
    $("#openCreateAccountButton").addEventListener("click", openCreateAccountDialog);
    $("#newAccountKind").addEventListener("change", updateNewAccountDepartmentOptions);
    $("#createAccountForm").addEventListener("submit", event => { event.preventDefault(); if (createAccountFromForm()) $("#createAccountDialog").close(); });
    $("#accountPasswordForm").addEventListener("submit", event => { event.preventDefault(); if (saveAccountPasswordReset()) $("#accountPasswordDialog").close(); });

    // Zodra een dialoog sluit, blijft een zichtbare melding bereikbaar boven de pagina.
    document.addEventListener("close", event => {
      const toast = $("#toast");
      if (toast && event.target.contains(toast)) document.body.appendChild(toast);
    }, true);
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const openDialogs = $$("dialog:modal");
      const dialog = openDialogs.at(-1);
      if (!dialog) return;
      event.preventDefault();
      dismissDialogWithoutAction(dialog);
    });
  }

  initUniversalRichTextEditors();
  bindDialogBackdropDismissal();
  bindGlobalEvents();
  updateLoginMoodVisibility();
  renderAll();
  bindWidgetDnD();
  setPage(currentPage);
  updateLiveClock();
  loadWeather();
  // Na een paginaverversing blijft een ingelogde mediënt meldingen ontvangen.
  if (state.authenticated && currentConfig().kind === "client") {
    startClientAttentionMonitor();
    setTimeout(showLoginMessagePopup, 120);
  }
  setInterval(updateLiveClock, 1000);
})();
