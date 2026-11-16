/* Realistische fictieve inhoud voor de normale HUB-accounts.
   Eenmalige vervanging van testinhoud. De oorspronkelijke browserdata blijft als back-up behouden.
   Geen aparte demomodus of demo-account. */
(() => {
  'use strict';
  const HUB = 'spectrumHubLiveDemoV24';
  const PB = 'spectrum-hub-planbord-2-v1';
  const CACHE = 'spectrum-hub-planbord2-widget-cache-v1';
  const ORDER = 'spectrum-hub-planbord2-dashboard-order-v1';
  const FLAG = 'spectrum-hub-realistische-inhoud-v2';
  const BACKUP = 'spectrum-hub-original-before-realistic-content-v2';
  const date = (days = 0) => {const d = new Date();d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
  const localTime = (days = 0, time = '09:00') => `${date(days)}T${time}`;
  const item = (id,text,done=false) => ({id,text,done});
  const card = (id,title,description,labels,checklist=[],days=0,members=[]) => ({
    id,title,description,labels,members,due:days?date(days):'',checklist,
    comments:[{id:`comment-${id}`,author:'Lindsay',text:'Neem de voortgang mee in het eerstvolgende overleg.',at:new Date().toISOString()}],
    activity:[],completed:false,archived:false
  });
  const column = (id,title,cards,showOnDashboard=false) => ({id,title,color:'#579bd0',cards,showOnDashboard});
  const labels = () => [
    {id:'priority',name:'Prioriteit',color:'#f1be68',fg:'#493409'},
    {id:'design',name:'Vormgeving',color:'#a9d5f5',fg:'#163c5c'},
    {id:'review',name:'Feedback',color:'#b9e4cc',fg:'#23583d'},
    {id:'development',name:'Uitvoering',color:'#c8baf0',fg:'#3c3066'},
    {id:'hub-sprint-label',name:'Sprintdoel',color:'#579bd0',fg:'#fff'}
  ];
  function demoBoards() {
    const personalBoard = (id,title,description,color,cols) => ({id,title,description,ownerId:'client-mm',color,access:[],labels:labels(),columns:cols});
    return {version:1,selected:'spectrum-hub-project',theme:'light',labels:labels(),
      mainBoards:{'client-mm':'spectrum-hub-project','staff-mm':'spectrum-team-projects'},
      dashboardChoices:{
        'client-mm':{'spectrum-hub-project:todo':true,'spectrum-hub-project:doing':true,'illustrator-plugin:todo':true},
        'staff-mm':{'spectrum-team-projects:todo':true,'spectrum-team-projects:doing':true}
      },
      boards:[
      personalBoard('spectrum-hub-project','Spectrum HUB afmaken',
        'Doorontwikkeling en gebruikerstesten van de interne omgeving.','#3989c0',[
        column('todo','Te doen',[
          card('hub-task-1','Dashboard op verschillende schermformaten testen',
            'Controleer of de widgets en het Planbord goed uitlijnen op een laptop en een groter beeldscherm. Noteer afwijkingen met een screenshot en korte toelichting.',
            ['review'],[item('ht1a','Dashboard op laptopformaat bekijken',true),item('ht1b','Widgets op groot scherm nalopen'),item('ht1c','Gevonden afwijkingen noteren')],3,['Maarten']),
          card('hub-task-2','Teksten en labels in HUB nalopen',
            'Controleer of namen van knoppen en onderdelen consequent zijn: Mededelingen, Kalender, Planbord en Rooster. Let vooral op wat een nieuwe gebruiker direct begrijpt.',
            ['design'],[item('ht2a','Navigatiemenu nalopen'),item('ht2b','Knopteksten controleren'),item('ht2c','Onduidelijkheden verzamelen')],5,['Maarten']),
          card('hub-task-3','Feedbackformulier voor testers voorbereiden',
            'Maak een kort formulier met vragen over duidelijkheid, gebruiksgemak en gemiste functies. Houd ruimte vrij voor opmerkingen.',
            ['priority'],[item('ht3a','Vragen opstellen',true),item('ht3b','Formulier laten controleren')],7,['Maarten'])
        ],true),
        column('doing','Mee bezig',[
          card('hub-task-4','Planbord 2.0 verder verfijnen',
            'Werk de laatste verbeterpunten in Planbord 2.0 uit. Controleer het verslepen van kolommen en kijk of de nieuwe dropzones in Light en Dark Mode duidelijk blijven.',
            ['development'],[item('ht4a','Kolommen kunnen stapelen',true),item('ht4b','Gestapelde kolommen losmaken',true),item('ht4c','Dropzones visueel controleren'),item('ht4d','Korte gebruikstest uitvoeren')],4,['Maarten'])
        ],true),
        column('review','Ter controle',[
          card('hub-task-5','Mijn instellingen laten beoordelen',
            'Bekijk samen met de begeleiding of de instellingenpagina logisch is ingedeeld. Controleer de werkweek, lokalen en de wachtwoordsectie.',
            ['review'],[item('ht5a','Nieuwe indeling laten zien',true),item('ht5b','Feedback bespreken')],2,['Maarten'])
        ]),
        column('done','Afgerond',[
          {...card('hub-task-6','Custom thema-opties vereenvoudigd',
            'De thema-instellingen zijn teruggebracht naar de officiële Light en Dark Mode van Spectrum.',
            ['development'],[item('ht6a','Custom Mode verwijderen',true),item('ht6b','Light en Dark controleren',true)],0,['Maarten']),completed:true}
        ])
      ]),
      personalBoard('illustrator-plugin','Illustrator plug-in uitwerken',
        'Ontwikkeling en test van gereedschappen voor Adobe Illustrator.','#8c77be',[
        column('todo','Te doen',[
          card('ill-task-1','Bediening van de plug-in verbeteren',
            'Maak de belangrijkste acties bereikbaar met duidelijke knoppen. Controleer dat de gebruiker kan zien welke optie actief is.',
            ['design'],[item('it1a','Huidige interface bekijken',true),item('it1b','Knoppen en labels verbeteren'),item('it1c','Nieuwe indeling testen')],6,['Maarten']),
          card('ill-task-2','Testbestand met voorbeeldvormen maken',
            'Maak een Illustrator-bestand met rechthoeken, schuine vormen en verschillende paneelverdelingen om de plug-in consistent te testen.',
            ['development'],[item('it2a','Basisvormen verzamelen'),item('it2b','Testscenario’s uitschrijven')],4,['Maarten'])
        ],true),
        column('doing','In uitvoering',[
          card('ill-task-3','Panelen splitsen en opnieuw testen',
            'Controleer het splitsen van geselecteerde panelen in horizontale en verticale richtingen. Controleer ook de undo-functie en behoud van bestaande vormen.',
            ['development'],[item('it3a','Horizontale verdeling testen',true),item('it3b','Verticale verdeling testen',true),item('it3c','Undo en herhalen controleren')],3,['Maarten'])
        ],true),
        column('review','Feedback',[
          card('ill-task-4','Prototype laten uitproberen',
            'Laat iemand anders de plug-in gebruiken zonder uitgebreide uitleg. Noteer waar bediening of terminologie niet vanzelfsprekend is.',
            ['review'],[],5,['Maarten'])
        ])
      ]),
      {id:'spectrum-team-projects',title:'Multimedia – werkoverzicht',
       description:'Lopende werkzaamheden voor de begeleiding.',ownerId:'staff-mm',color:'#4d95a3',access:[],labels:labels(),columns:[
        column('todo','Te doen',[
          card('staff-task-1','Testmoment voor Spectrum HUB plannen',
            'Kies een geschikt moment waarop mediënten en begeleiding de huidige HUB-versie kunnen uitproberen. Verzamel daarna de belangrijkste bevindingen.',
            ['priority'],[item('st1a','Deelnemers benaderen',true),item('st1b','Testmoment inplannen'),item('st1c','Feedback verzamelen')],5,['Lindsay']),
          card('staff-task-2','Kerstactiviteiten communiceren',
            'Controleer of alle informatie over de kerstborrel en kerstvakantie duidelijk terug te vinden is onder Mededelingen en Kalender.',
            ['review'],[],7,['Lindsay'])
        ],true),
        column('doing','Bezig',[
          card('staff-task-3','Voorbereiding tevredenheidsonderzoek',
            'Zorg dat de vragen begrijpelijk zijn en verzamel aandachtspunten uit het team voordat het onderzoek wordt uitgezet.',
            ['development'],[item('st3a','Conceptvragen controleren',true),item('st3b','Laatste opmerkingen verwerken')],4,['Lindsay'])
        ],true),
        column('review','Ter controle',[
          card('staff-task-4','Overzicht nieuwe werkafspraken',
            'Controleer of de meest recente afspraken op één plek terug te vinden zijn.',
            ['review'],[],6,['Lindsay'])
        ])
      ]}
    ]};
  }
  function demoHub(existing) {
    const hub = {...existing};
    hub.messages = [
      {id:'spectrum-msg-boardgames',title:'Bordspellenmiddag',publishedAt:localTime(-1,'09:20'),
        text:'We willen binnenkort weer een gezellige bordspellenmiddag organiseren. Heb je een leuk spel dat je graag samen met anderen speelt? Laat het weten bij de begeleiding. De exacte datum en verdere informatie volgen nog.',
        audience:'all',important:false,kind:'message'},
      {id:'spectrum-msg-christmas',title:'Kerstborrel – woensdag 23 december',publishedAt:localTime(-2,'10:15'),
        text:'Op woensdagmiddag 23 december organiseren we een kerstborrel bij Spectrum. Een gezellig moment om samen het jaar af te sluiten. Meer informatie over het programma volgt via de begeleiding.',
        audience:'all',important:true,kind:'event',eventAt:'2026-12-23T13:30',eventLocation:'Spectrum'},
      {id:'spectrum-msg-holiday',title:'Kerstvakantie – 24 december t/m 4 januari',publishedAt:localTime(-3,'09:10'),
        text:'Spectrum is gesloten van donderdag 24 december 2026 tot en met maandag 4 januari 2027. Vanaf dinsdag 5 januari gaan de normale werkzaamheden weer verder. Houd hier rekening mee bij het plannen van je opdrachten en afspraken.',
        audience:'all',important:true,kind:'message'},
      {id:'spectrum-msg-survey',title:'Tevredenheidsonderzoek',publishedAt:localTime(-4,'11:35'),
        text:'We willen graag weten hoe jij Spectrum ervaart. Wat gaat goed en wat kan beter? Binnenkort kun je deelnemen aan een tevredenheidsonderzoek. Je feedback helpt ons om de begeleiding en de werkomgeving te verbeteren. Meer informatie volgt zodra het onderzoek beschikbaar is.',
        audience:'all',important:false,kind:'message'}
    ];
    hub.messageRead=[];hub.notificationSeen=[];hub.eventResponses={};
    hub.goals = [
      {id:'spectrum-goal-personal',client:'Maarten',department:'multimedia',type:'personal',
       title:'Projecten zelfstandig plannen',text:'Grote opdrachten opdelen in overzichtelijke stappen en tijdig bespreken wanneer ondersteuning nodig is.'},
      {id:'spectrum-goal-hub',client:'Maarten',department:'multimedia',type:'sprint',
       title:'Spectrum HUB – Dashboard verbeteren',text:'',completed:false,sprintItems:[
        item('sg-hub-1','Dashboardindeling controleren',true),
        item('sg-hub-2','Widgets testen',true),
        item('sg-hub-3','Feedback van begeleiding verzamelen'),
        item('sg-hub-4','Gevonden bugs oplossen'),
        item('sg-hub-5','Wijzigingen laten controleren')]},
      {id:'spectrum-goal-illustrator',client:'Maarten',department:'multimedia',type:'sprint',
       title:'Illustrator plug-in ontwikkelen',text:'',completed:false,sprintItems:[
        item('sg-ill-1','Functionaliteiten bepalen',true),
        item('sg-ill-2','Eerste prototype bouwen',true),
        item('sg-ill-3','Plug-in testen in Illustrator'),
        item('sg-ill-4','Problemen oplossen'),
        item('sg-ill-5','Werkende versie opleveren')]},
      {id:'spectrum-goal-it',client:'Robin',department:'it',type:'sprint',
       title:'Installatiehandleiding afronden',text:'',completed:false,sprintItems:[
        item('sg-it-1','Installatiestappen uitschrijven',true),
        item('sg-it-2','Screenshots toevoegen'),
        item('sg-it-3','Handleiding laten controleren')]}
    ];
    hub.agendaItems = [
      {id:'spectrum-agenda-1',owner:'client-mm',title:'Voortgang HUB en Planbord',date:date(2),start:'10:00',end:'10:30',category:'appointment',
        description:'Samen met de begeleiding de huidige sprintdoelen en openstaande taken bespreken.'},
      {id:'spectrum-agenda-2',owner:'client-mm',title:'Feedback Illustrator plug-in',date:date(4),start:'11:00',end:'11:30',category:'appointment',
        description:'Laat het prototype zien en bespreek de belangrijkste verbeterpunten.'},
      {id:'spectrum-agenda-3',owner:'client-it',title:'Handleiding doornemen',date:date(3),start:'13:30',end:'14:00',category:'appointment',
        description:'De eerste versie van de installatiehandleiding samen controleren.'}
    ];
    return hub;
  }

  function apply(current) {
    if (localStorage.getItem(FLAG) === 'ready') return current;
    try {
      // Back up existing content once; do not erase account credentials, layouts or preferences.
      if (localStorage.getItem(BACKUP) === null) {
        localStorage.setItem(BACKUP, JSON.stringify(Object.fromEntries(
          [HUB, PB, CACHE, ORDER].map(key => [key,localStorage.getItem(key)])
        )));
      }
      const updated = demoHub(current);
      const boards = demoBoards();
      const previousBoards = (() => {try{return JSON.parse(localStorage.getItem(PB)||'null')}catch{return null}})();
      // Preserve prior board theme and viewer preferences where they still apply.
      if (previousBoards?.theme) boards.theme = previousBoards.theme;
      const userId = updated.role || 'client-mm';
      boards.selected = userId==='client-mm' ? 'spectrum-hub-project' : 'spectrum-team-projects';
      localStorage.setItem(PB,JSON.stringify(boards));
      localStorage.removeItem(CACHE);
      localStorage.removeItem(ORDER);
      localStorage.setItem(HUB,JSON.stringify(updated));
      localStorage.setItem(FLAG,'ready');
      return updated;
    } catch (err) {
      console.warn('Realistische voorbeeldinhoud kon niet worden geladen:',err);
      return current;
    }
  }
  window.spectrumSampleContent = {apply};
})();
