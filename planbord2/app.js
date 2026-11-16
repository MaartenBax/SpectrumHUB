(()=>{'use strict';
const widgetModalOnly=new URLSearchParams(location.search).has('widget-modal');
if(widgetModalOnly)document.body.classList.add('widget-modal-only');
const $=(sel,root=document)=>root.querySelector(sel), $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
const KEY='spectrum-hub-planbord-2-v1';
const PEOPLE=['Lindsay','Marjolaine','Ruben','Pim','Chelle','Andy','Stefan','Nick'];
const COLORS=['#579bd0','#dba254','#69a989','#9a82c8','#d77f8e','#697e97'];
const SPRINT_LABEL_ID='hub-sprint-label';
const SPRINT_LABEL_DEFAULT='#579bd0';
const DEFAULT_LABELS=[{id:'priority',name:'Prioriteit',color:'#f0b65b',fg:'#583906'},{id:'design',name:'Design',color:'#b0dafa',fg:'#16476d'},{id:'development',name:'Ontwikkeling',color:'#c5b2ef',fg:'#413067'},{id:'review',name:'Controle',color:'#b7e6cb',fg:'#225e40'},{id:'blocked',name:'Geblokkeerd',color:'#f5bec0',fg:'#78333a'}];
const id=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const due=(days)=>{let d=new Date();d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const seed=()=>({version:1,selected:'board-hub',theme:'light',labels:DEFAULT_LABELS,boards:[{id:'board-hub',title:'Spectrum HUB',description:'Van ideeën naar uitvoering. Alles op één overzichtelijk bord.',color:'#6ca8d2',columns:[{id:'todo',title:'Te doen',color:'#5d9cc5',cards:[{id:'a1',title:'Nieuwe ideeën voor de kalender verzamelen',description:'Input van begeleiding meenemen en bespreken.',labels:['design'],members:['Lindsay','Chelle'],due:due(4),checklist:[{id:'c1',text:'Feedback verzamelen',done:true},{id:'c2',text:'Prioriteiten bepalen',done:false}],comments:[{id:'x1',author:'Lindsay',text:'Volgende overleg meenemen.',at:new Date().toISOString()}],activity:[],archived:false},{id:'a2',title:'Gebruiksvriendelijkheid van het rooster testen',description:'Kijk of de verschillende afdelingen het nieuwe overzicht begrijpen.',labels:['priority'],members:['Andy'],due:due(2),checklist:[{id:'c3',text:'Proefversie laten zien',done:false}],comments:[],activity:[],archived:false},{id:'a3',title:'Nieuwe mededelingen evalueren',description:'',labels:[],members:['Ruben'],due:'',checklist:[],comments:[],activity:[],archived:false}]},{id:'doing',title:'Bezig',color:'#e0a65c',cards:[{id:'b1',title:'Planbord 2.0 concept uitproberen',description:'Een Trello-achtig planbord, los van de bestaande HUB.',labels:['development','design'],members:['Lindsay','Pim'],due:due(7),checklist:[{id:'c4',text:'Borden en lijsten',done:true},{id:'c5',text:'Kaarten en checklists',done:true},{id:'c6',text:'Feedback verwerken',done:false}],comments:[],activity:[],archived:false},{id:'b2',title:'Standaard dashboardindeling controleren',description:'Alle widgets goed uitlijnen.',labels:['review'],members:['Marjolaine'],due:due(1),checklist:[],comments:[],activity:[],archived:false}]},{id:'review',title:'Controleren',color:'#9d86cc',cards:[{id:'d1',title:'Werkplekbenamingen nalopen',description:'Alle namen consequent weergeven.',labels:['review'],members:['Chelle','Andy'],due:due(-1),checklist:[],comments:[],activity:[],archived:false}]},{id:'done',title:'Afgerond',color:'#67ad8b',cards:[{id:'e1',title:'Compacte Upcoming-kaarten',description:'Nieuwe compacte vormgeving.',labels:['review'],members:['Lindsay'],due:'',checklist:[{id:'c7',text:'Vormgeving afstemmen',done:true}],comments:[],activity:[],archived:false}]}]},{id:'board-team',title:'Teamoverleg',description:'Onderwerpen, actiepunten en besluiten.',color:'#ad8ac7',columns:[{id:'team1',title:'Op agenda',color:'#5d9cc5',cards:[{id:'t1',title:'Bespreken hoe mediënten het rooster gebruiken',description:'Welke vragen willen zij hiermee kunnen beantwoorden?',labels:['priority'],members:['Lindsay','Andy'],due:due(3),checklist:[],comments:[],activity:[],archived:false}]},{id:'team2',title:'Actiepunten',color:'#e0a65c',cards:[]},{id:'team3',title:'Besloten',color:'#67ad8b',cards:[]}]},{id:'board-mm',title:'Multimedia-projecten',description:'Creatieve projecten en productiewerk.',color:'#74afa2',columns:[{id:'mm1',title:'Ideeën',color:'#5d9cc5',cards:[{id:'m1',title:'Nieuwe banner voor de website',description:'Concepten uitwerken.',labels:['design'],members:['Ruben'],due:'',checklist:[],comments:[],activity:[],archived:false}]},{id:'mm2',title:'In productie',color:'#e0a65c',cards:[]},{id:'mm3',title:'Opgeleverd',color:'#67ad8b',cards:[]}]}]});
let state;try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch{} if(!state||!Array.isArray(state.boards)||!state.boards.length)state=seed();
let activeView='board',selectedCard=null,modalType=null,drag=null,toastTimer=null,quickColumnId=null;
let viewer={id:'staff-mm',name:'Lindsay',kind:'staff'};
let accounts=[{id:'staff-mm',name:'Lindsay',kind:'staff'},{id:'staff-it',name:'Marjolaine',kind:'staff'},{id:'client-mm',name:'Maarten',kind:'client'}];
function migrateBoards(){state.boards.forEach(b=>{
  b.ownerId ||= 'staff-mm';b.access=Array.isArray(b.access)?b.access:[];
  if(!Array.isArray(b.labels))b.labels=(state.labels||DEFAULT_LABELS).map(l=>({...l}));
  const existing=b.labels.find(l=>l.id===SPRINT_LABEL_ID);
  if(!existing)b.labels.push({id:SPRINT_LABEL_ID,name:'Sprintdoel',color:SPRINT_LABEL_DEFAULT,fg:'#ffffff'});
  else {existing.name='Sprintdoel';existing.color=/^#[0-9a-f]{6}$/i.test(existing.color||'')?existing.color:SPRINT_LABEL_DEFAULT;existing.fg=contrastText(existing.color);}
  if(!Array.isArray(b.sprintTodoOrder))b.sprintTodoOrder=[];
  b.columns.forEach(col=>col.cards.forEach(card=>{
    if(typeof card.completed!=='boolean')card.completed=/^(afgerond|klaar|done)$/i.test(col.title.trim());
  }));
});}

function isSprintStorageBoard(b){return String(b?.id||'').startsWith('hub-sprint-');}
function visibleBoards(){return state.boards.filter(b=>!isSprintStorageBoard(b)&&(b.ownerId===viewer.id||b.access.some(a=>a.id===viewer.id)));}
function permission(b){if(!b)return 'none';return b.ownerId===viewer.id?'owner':b.access.find(a=>a.id===viewer.id)?.permission||'none';}
function canEdit(b=board()){return ['owner','edit'].includes(permission(b));}
function canManage(b=board()){return viewer.kind==='staff'&&permission(b)==='owner';}
function canAssign(){return viewer.kind==='staff'&&canEdit();}
// Dashboard preferences belong to the viewer, NOT to the board's shared permissions.
function dashboardChoice(b,col,userId=viewer.id){
  const perUser=state.dashboardChoices?.[userId];
  const key=`${b.id}:${col.id}`;
  return perUser&&Object.prototype.hasOwnProperty.call(perUser,key)
    ?Boolean(perUser[key]):Boolean(col.showOnDashboard);
}
function setDashboardChoice(b,col,on,userId=viewer.id){
  state.dashboardChoices??={};state.dashboardChoices[userId]??={};
  state.dashboardChoices[userId][`${b.id}:${col.id}`]=Boolean(on);
}

function ensureSelection(){
 const available=visibleBoards();
 if(!available.some(b=>b.id===state.selected)){
  const preferred=state.mainBoards?.[viewer.id];
  state.selected=available.find(b=>b.id===preferred&&b.ownerId===viewer.id)?.id||available[0]?.id||null;
 }
}
function denied(){if(canEdit())return false;toast('Dit bord is alleen-lezen.');return true;}
function identityChanged(data){if(!data?.id)return;const userChanged=viewer.id!==data.id;viewer={id:data.id,name:data.name||'Gebruiker',kind:data.kind==='staff'?'staff':'client'};if(Array.isArray(data.accounts))accounts=data.accounts.filter(a=>a.id&&a.name&&(a.kind==='staff'||a.kind==='client'));if(!userChanged){ensureSelection();return;}state.selected=state.mainBoards?.[viewer.id]||null;ensureSelection();activeView='board';if(!widgetModalOnly)closeModal();renderFilters();update();}
migrateBoards();ensureSelection();
const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=()=>new Date().toISOString();
const fmt=(date)=>{if(!date)return '';const d=new Date(date+'T12:00:00');return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short'}).format(d)};
const hasPassed=(date)=>date&&date<due(0);
const board=()=>visibleBoards().find(b=>b.id===state.selected)||null;
const findCard=(cid)=>{for(const b of state.boards)for(const col of b.columns){const card=col.cards.find(c=>c.id===cid);if(card)return {board:b,col,card}}return null};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));$('#saveNotice').textContent='● Lokaal opgeslagen';if(window.parent!==window)window.parent.postMessage({type:'spectrum-pb2-update',data:state},'*')}catch{$('#saveNotice').textContent='Opslag mislukt'}};
function toast(text){const el=$('#toast');el.textContent=text;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),2600)}
function setTheme(){document.body.classList.toggle('dark',state.theme==='dark');$('#themeToggle').textContent=state.theme==='dark'?'☾':'☼'}
function handleDashboardAction(message){
 const b=state.boards.find(item=>item.id===message.boardId);
 if(!b||permission(b)==='none'||isSprintStorageBoard(b))return;
 const col=b.columns.find(item=>item.cards.some(card=>card.id===message.cardId));
 const card=col?.cards.find(item=>item.id===message.cardId);
 const projectedSprint=(!card&&b.ownerId===viewer.id)?sprintCardsForBoard(b).find(c=>c.id===message.cardId):null;
 if(projectedSprint){
   if(message.action==='open'){openSprintGoal(projectedSprint.id);return;}
   if(message.action==='check'&&typeof message.done==='boolean'){
     const item=(projectedSprint.checklist||[]).find(i=>i.id===message.itemId);
     if(!item)return;
     item.done=message.done;
     projectedSprint.completed=projectedSprint.checklist.length>0&&projectedSprint.checklist.every(i=>i.done);
     if(window.parent!==window)window.parent.postMessage({type:'spectrum-pb2-sprint-check',goalId:String(projectedSprint.sourceGoalId),itemId:String(item.id),done:item.done},'*');
     update();return;
   }
   return;
 }
 if(!card||card.archived)return;
 if(message.action==='open'){
   if(state.selected!==b.id)setSelectedBoard(b.id);
   if(activeView!=='board'){activeView='board';renderBoard()}
   renderCardModal(card.id);
 }else if(message.action==='complete'){
   completeTask(card.id);
 }else if(message.action==='check'&&canEdit(b)){
   const item=(card.checklist||[]).find(i=>i.id===message.itemId);
   if(!item||typeof message.done!=='boolean')return;
   item.done=message.done;
   log(card,`${item.done?'Afgevinkt':'Opnieuw geopend'}: ${item.text}`);
   update();
 }
}
window.addEventListener('message',event=>{if(event.source!==window.parent)return;if(event.data?.type==='spectrum-pb2-widget-action'){handleDashboardAction(event.data);return;}if(event.data?.type==='spectrum-pb2-refresh-storage'&&!widgetModalOnly){try{const loaded=JSON.parse(localStorage.getItem(KEY)||'null');if(loaded&&Array.isArray(loaded.boards)){state=loaded;migrateBoards();ensureSelection();renderFilters();renderNav();renderBoard()}}catch{}return;}if(event.data?.type==='spectrum-pb2-theme'){state.theme=event.data.dark?'dark':'light';setTheme()}if(event.data?.type==='spectrum-pb2-user'){window.pbCurrentUser=event.data.name||'Gebruiker';identityChanged(event.data)}if(event.data?.type==='spectrum-pb2-sprint-goals'){synchronizeSprintGoals(event.data.goals)}});
// Sprintdoelen: one linked task per goal, with up to five synchronized checklist items.
// The hidden storage board is merely a single shared source for the fixed column on owned boards.
function synchronizeSprintGoals(goals){
 if(!Array.isArray(goals))return;
 const incoming=new Map(goals.filter(g=>g&&g.goalId&&g.clientId&&String(g.title||'').trim())
   .map(g=>[`${g.clientId}:${g.goalId}`,g]));
 let changed=false;
 // Migrate the earlier per-subgoal cards; never duplicate goals across boards.
 const legacy=new Map();
 for(const b of state.boards.filter(isSprintStorageBoard)){
  for(const col of b.columns){
   for(const c of col.cards){
    if(c.sourceGoalId&&c.sourceGoalLineId){
     const key=`${b.ownerId}:${c.sourceGoalId}`;
     if(!legacy.has(key))legacy.set(key,new Map());
     legacy.get(key).set(String(c.sourceGoalLineId),Boolean(c.completed));
    }
   }
   const count=col.cards.length;
   col.cards=col.cards.filter(c=>!c.sourceGoalLineId);
   if(col.cards.length!==count)changed=true;
  }
 }
 const live=new Map();
 for(const b of state.boards.filter(isSprintStorageBoard)){
  for(const col of b.columns){
   for(const c of col.cards){if(c.sourceGoalId&&!c.sourceGoalLineId){
    const key=`${b.ownerId}:${c.sourceGoalId}`;
    if(live.has(key)){col.cards=col.cards.filter(x=>x!==c);changed=true}
    else live.set(key,{board:b,col,card:c});
   }}
  }
 }
 for(const [key,loc] of live){
  if(!incoming.has(key)){
   loc.col.cards=loc.col.cards.filter(c=>c!==loc.card);changed=true;live.delete(key);
  }
 }
 for(const [key,g] of incoming){
  let loc=live.get(key);
  if(!loc){
   const boardId=`hub-sprint-${g.clientId}`;
   let b=state.boards.find(board=>board.id===boardId);
   if(!b){
    b={id:boardId,title:'Mijn sprintdoelen',description:'Centrale opslag van sprintdoelen uit Mijn Doelen.',ownerId:g.clientId,access:[],color:'#579bd0',labels:[],columns:[
     {id:'todo',title:'Te doen',color:'#5d9cc5',showOnDashboard:false,cards:[]},
     {id:'doing',title:'Bezig',color:'#e0a65c',showOnDashboard:false,cards:[]},
     {id:'done',title:'Afgerond',color:'#67ad8b',showOnDashboard:false,cards:[]}
    ]};state.boards.push(b);changed=true;
   }
   const col=b.columns.find(c=>c.id==='todo')||b.columns[0];
   if(!col)continue;
   const card={id:`hub-goal-${encodeURIComponent(key)}`,sourceGoalId:g.goalId,
    title:g.title,description:'Sprintdoel vanuit Mijn Doelen',labels:[SPRINT_LABEL_ID],members:[],due:'',
    checklist:[],comments:[],activity:[],archived:false,completed:false};
   col.cards.push(card);loc={board:b,col,card};live.set(key,loc);changed=true;
  }
  const card=loc.card;
  const newItems=(g.items||[]).slice(0,5).filter(i=>i&&i.id&&String(i.text||'').trim());
  const oldChecks=new Map((card.checklist||[]).map(i=>[String(i.id),i]));
  const history=legacy.get(key)||new Map();
  const nextChecklist=newItems.map(i=>({id:String(i.id),text:String(i.text),
   done:oldChecks.has(String(i.id))?Boolean(i.done):Boolean(i.done||history.get(String(i.id)))}));
  const completed=nextChecklist.length>0&&nextChecklist.every(i=>i.done);
  if(card.title!==g.title||JSON.stringify(card.checklist)!==JSON.stringify(nextChecklist)||card.completed!==completed||card.archived||!card.labels?.includes(SPRINT_LABEL_ID)){
   card.title=g.title;card.checklist=nextChecklist;card.completed=completed;card.archived=false;card.labels=[SPRINT_LABEL_ID];changed=true;
  }
 }
 if(changed){update();renderFilters();}
}
function boardLabels(b=board()){return b?.labels||state.labels||DEFAULT_LABELS}
function labelById(label){return boardLabels().find(l=>l.id===label)}
function completionColumn(b){return b?.columns.find(c=>/^(afgerond|klaar|done)$/i.test(c.title.trim()))||null}
function completeTask(cardId){
 const loc=findCard(cardId);if(!loc||permission(loc.board)==='none')return;
 const {board:b,col,card:c}=loc;
 if(c.completed){
   c.completed=false;
   const previous=b.columns.find(x=>x.id===c.completedFromColumn);
   if(previous&&previous!==col){col.cards=col.cards.filter(x=>x.id!==c.id);previous.cards.unshift(c)}
   delete c.completedFromColumn;
   log(c,`Heropend door ${viewer.name}`);toast('Taak heropend.');
 }else{
   c.completed=true;
   const done=completionColumn(b);
   if(done&&done!==col){c.completedFromColumn=col.id;col.cards=col.cards.filter(x=>x.id!==c.id);done.cards.unshift(c)}
   log(c,`Afgerond door ${viewer.name}`);toast('Taak afgerond.');
 }
 closeModal();update();
}

function taskMatches(c){const q=$('#searchInput').value.trim().toLowerCase(),l=$('#labelFilter').value,m=$('#memberFilter').value,overdue=$('#dueFilter').checked;
if(l&&!c.labels.includes(l))return false;if(m&&!c.members.includes(m))return false;if(overdue&&!hasPassed(c.due))return false;
return !q||[c.title,c.description,...c.checklist.map(x=>x.text),...c.comments.map(x=>x.text)].join(' ').toLowerCase().includes(q)}
function renderNav(){const nav=$('#boardNav');$('#boardPickerLabel').textContent=board()?.title||'Kies bord';nav.innerHTML=visibleBoards().map(b=>`<button data-board="${esc(b.id)}" class="${b.id===state.selected&&activeView==='board'?'active':''}"><span class="nav-square" style="background:${esc(b.color||COLORS[0])}"></span>${b.id===state.mainBoards?.[viewer.id]&&b.ownerId===viewer.id?' <span class="main-board-star" title="Hoofdbord">★</span>':''}${esc(b.title)}</button>`).join('')}
function renderFilters(){let labelSel=$('#labelFilter'),memberSel=$('#memberFilter');let l=labelSel.value,m=memberSel.value;labelSel.innerHTML='<option value="">Alle labels</option>'+boardLabels().map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');memberSel.innerHTML='<option value="">Alle personen</option>'+accounts.map(a=>a.name).map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');labelSel.value=l;memberSel.value=m}
function tagsHtml(labels){return labels.map(l=>{let v=labelById(l);return v?`<span class="label-chip" style="background:${esc(v.color)};color:${esc(v.fg)}">${esc(v.name)}</span>`:''}).join('')}
function avatarHtml(members){return members.length?`<span class="card-members">${members.slice(0,3).map(m=>`<span title="${esc(m)}">${esc(m.charAt(0))}</span>`).join('')}${members.length>3?`<span>+${members.length-3}</span>`:''}</span>`:''}
function cardHtml(c){const checks=c.checklist||[],done=checks.filter(x=>x.done).length;
return `<article class="task-card ${c.completed?'task-completed':''}" tabindex="0" role="button" draggable="${canEdit()}" data-card="${esc(c.id)}" aria-label="Taak ${esc(c.title)} openen">${c.labels.length?`<div class="card-labels">${tagsHtml(c.labels)}</div>`:''}<strong class="card-title">${esc(c.title)}</strong>${c.completed?'<span class="task-done-mark">✓ Afgerond</span>':''}${c.description?`<div class="card-description">${esc(c.description)}</div>`:''}<div class="card-bottom">${c.due?`<span class="meta-item ${hasPassed(c.due)?'late':''}">▦ ${fmt(c.due)}</span>`:''}${checks.length?`<span class="meta-item ${done===checks.length?'complete':''}">☑ ${done}/${checks.length}</span>`:''}${c.comments.length?`<span class="meta-item">☏ ${c.comments.length}</span>`:''}${avatarHtml(c.members)}</div></article>`}
// Sprint goals have one central source, but are displayed as reorderable cards
// alongside normal tasks in the owned board's "Te doen" column.
function sprintStorage(){return state.boards.find(b=>b.id===`hub-sprint-${viewer.id}`);}
function sprintTodoColumn(b){return b?.columns.find(c=>c.id==='todo')||b?.columns.find(c=>/^te doen$/i.test(c.title.trim()))||b?.columns[0];}
function isSprintCard(c){return Boolean(c?.sourceGoalId&&!c.sourceGoalLineId);}
function sprintCardsForBoard(b){
 if(!b||b.ownerId!==viewer.id)return [];
 return (sprintStorage()?.columns||[]).flatMap(col=>col.cards||[]).filter(c=>isSprintCard(c)&&!c.archived);
}
function displayedCards(b,col){
 const regular=col.cards.filter(c=>!c.archived);
 if(col!==sprintTodoColumn(b)||b.ownerId!==viewer.id)return regular;
 const sprint=sprintCardsForBoard(b);
 const all=[...regular,...sprint],lookup=new Map(all.map(c=>[String(c.id),c]));
 const ordered=(b.sprintTodoOrder||[]).map(id=>lookup.get(String(id))).filter(Boolean);
 const listed=new Set(ordered.map(c=>String(c.id)));
 return [...ordered,...all.filter(c=>!listed.has(String(c.id)))];
}
const collapsedSprintCards=new Set();
function sprintGoalCardHtml(card,b){
 const checks=card.checklist||[],done=checks.filter(i=>i.done).length;
 const collapsed=collapsedSprintCards.has(String(card.id));
 const lbl=boardLabels(b).find(l=>l.id===SPRINT_LABEL_ID);
 const color=/^#[0-9a-f]{6}$/i.test(lbl?.color||'')?lbl.color:SPRINT_LABEL_DEFAULT;
 return `<article class="task-card sprint-goal-card ${card.completed?'sprint-goal-completed':''}" style="--sprint-label-color:${esc(color)}" tabindex="0" role="button" draggable="true" data-sprint-card="${esc(card.id)}" data-sort-card="${esc(card.id)}" aria-label="Sprintdoel ${esc(card.title)} bekijken">
  <div class="card-labels"><span class="label-chip" style="background:${esc(color)};color:${esc(contrastText(color))}">Sprintdoel</span></div>
  <div class="sprint-goal-heading"><strong class="card-title">${esc(card.title)}</strong><button type="button" class="sprint-goal-fold" data-toggle-sprint="${esc(card.id)}" aria-expanded="${!collapsed}" aria-label="${collapsed?'Checklist uitklappen':'Checklist inklappen'}" title="${collapsed?'Checklist uitklappen':'Checklist inklappen'}"><span class="sprint-goal-chevron" aria-hidden="true"></span></button></div>
  ${collapsed?'':`<div class="sprint-goal-preview">${checks.map(i=>`<span class="${i.done?'done':''}">${i.done?'☑':'☐'} ${esc(i.text)}</span>`).join('')}</div>`}
  <div class="sprint-goal-progress"><span>${done}/${checks.length} afgerond${card.completed?' · Klaar':''}</span><div class="progress-rail"><span style="width:${checks.length?Math.round(done/checks.length*100):0}%"></span></div></div>
 </article>`;
}
function openSprintGoal(cardId){
 const storage=sprintStorage();
 const found=storage?.columns.flatMap(col=>col.cards).find(card=>card.id===cardId);
 if(!found)return;
 const checklist=found.checklist||[];
 const done=checklist.filter(i=>i.done).length;
 openModal('sprint-goal','Sprintdoel',`<div class="sprint-goal-view">
  <p class="eyebrow">MIJN SPRINTDOELEN</p><strong>${esc(found.title)}</strong>
  <p class="sprint-goal-count">${done} van ${checklist.length} subdoelen afgerond${found.completed?' · Sprintdoel afgerond':''}</p>
  <div class="sprint-goal-checklist">${checklist.map(item=>`<label class="sprint-goal-check ${item.done?'done':''}"><input type="checkbox" data-sprint-check="${esc(item.id)}" ${item.done?'checked':''}><span>${esc(item.text)}</span></label>`).join('')}</div>
  <p class="sprint-goal-note">De checklist is gekoppeld aan Mijn Doelen. Afgeronde sprintdoelen blijven zichtbaar.</p>
  </div>`, `<button type="button" class="secondary-btn" data-close-modal>Sluiten</button>`,'SPRINTDOEL');
 $$('#modalBody [data-sprint-check]').forEach(box=>box.addEventListener('change',()=>{
  const item=found.checklist.find(i=>String(i.id)===box.dataset.sprintCheck);
  if(!item)return;
  item.done=box.checked;
  found.completed=found.checklist.length>0&&found.checklist.every(i=>i.done);
  if(window.parent!==window)window.parent.postMessage({type:'spectrum-pb2-sprint-check',goalId:String(found.sourceGoalId),itemId:String(item.id),done:box.checked},'*');
  update();openSprintGoal(cardId);
 }));
}
// Flexible per-board column stacks: each inner array is arranged vertically.
// Two columns per vertical stack, maximum. Normalise old saved layouts too.
function columnStacks(b){
 const valid=new Set(b.columns.map(c=>c.id)),seen=new Set(),stacks=[];
 for(const group of (Array.isArray(b.columnStacks)?b.columnStacks:[])){
  if(!Array.isArray(group))continue;
  const ids=group.filter(cid=>valid.has(cid)&&!seen.has(cid));
  ids.forEach(cid=>seen.add(cid));
  for(let i=0;i<ids.length;i+=2)stacks.push(ids.slice(i,i+2));
 }
 for(const col of b.columns)if(!seen.has(col.id))stacks.push([col.id]);
 return stacks;
}
function storeColumnStacks(b,stacks){
 b.columnStacks=stacks;
 const byId=new Map(b.columns.map(c=>[c.id,c]));
 b.columns=stacks.flat().map(id=>byId.get(id)).filter(Boolean);
}
function moveColumnInStacks(b,moving,target,position){
 if(moving===target)return false;
 const before=columnStacks(b);
 const stacks=before.map(group=>group.filter(cid=>cid!==moving)).filter(group=>group.length);
 const index=stacks.findIndex(group=>group.includes(target));
 if(index<0)return false;
 if(position==='top'||position==='bottom'){
  if(stacks[index].length>=2)return false;
  const group=stacks[index];
  group.splice(position==='top'?0:group.length,0,moving);
 }else stacks.splice(index+(position==='right'?1:0),0,[moving]);
 storeColumnStacks(b,stacks);return true;
}
function moveColumnToStandaloneSlot(b,moving,slot){
 const old=columnStacks(b),from=old.findIndex(group=>group.includes(moving));
 if(from<0||!Number.isInteger(slot)||slot<0||slot>old.length)return false;
 const removingStack=old[from].length===1;
 const stacks=old.map(group=>group.filter(id=>id!==moving)).filter(group=>group.length);
 const target=Math.max(0,Math.min(stacks.length,slot-(removingStack&&from<slot?1:0)));
 stacks.splice(target,0,[moving]);
 storeColumnStacks(b,stacks);return true;
}
// Determine a single drop intention from pointer position, used both for preview and drop.
// Never modify the layout during dragover; only drop commits a change.
function columnDropIntent(e){
 const root=$('#columns'), x=e.clientX, y=e.clientY, moving=drag?.id;
 const stacks=[...root.querySelectorAll('.column-stack')];
 // Use large areas of the existing columns, never tiny, pixel-perfect slots.
 // For a stack, the entire outer 28% on either side means a separate column.
 // Its center means vertically stack, with top/bottom decided by the pointer.
 const hovered=stacks.find(stack=>{
  const r=stack.getBoundingClientRect();
  return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
 });
 if(hovered){
  const r=hovered.getBoundingClientRect();
  const fraction=(x-r.left)/Math.max(1,r.width);
  const group=[...hovered.querySelectorAll('[data-column]')];
  const remaining=group.filter(col=>col.dataset.column!==moving);
  const index=stacks.indexOf(hovered);
  if(fraction<.28)return {type:'slot',slot:index,element:null,previewStack:hovered,position:'left'};
  if(fraction>.72)return {type:'slot',slot:index+1,element:null,previewStack:hovered,position:'right'};
  // No third column in a stack. A full stack becomes an easy left/right target.
  if(remaining.length>=2)return {type:'slot',slot:fraction<.5?index:index+1,element:null,previewStack:hovered,position:fraction<.5?'left':'right'};
  if(remaining.length){
   const other=remaining[0],rect=other.getBoundingClientRect();
   return {type:'column',target:other.dataset.column,position:y<rect.top+rect.height/2?'top':'bottom',element:other,previewStack:hovered};
  }
  // Dropping onto the only column in its own stack leaves its position unchanged.
  return {type:'slot',slot:index,element:null,previewStack:hovered,position:'left'};
 }
 // Between stacks, or in the empty board area: choose the nearest position.
 let slot=stacks.length;
 for(let i=0;i<stacks.length;i++){
  const r=stacks[i].getBoundingClientRect();
  if(x<r.left+r.width/2){slot=i;break;}
 }
 return {type:'slot',slot,element:null,previewStack:null,position:'slot'};
}
function clearColumnDropPreview(){
 $$('#columns .drop-top,#columns .drop-bottom,#columns .drop-left,#columns .drop-right,#columns .drop-slot-active,#columns .drop-preview-top,#columns .drop-preview-bottom,#columns .drop-preview-left,#columns .drop-preview-right').forEach(el=>el.classList.remove('drop-top','drop-bottom','drop-left','drop-right','drop-slot-active','drop-preview-top','drop-preview-bottom','drop-preview-left','drop-preview-right'));
}
function showColumnDropPreview(intent){
 clearColumnDropPreview();
 if(!intent)return;
 if(intent.previewStack&&intent.position!=='slot'){
  intent.previewStack.classList.add('drop-preview-'+intent.position);
 }
}
function detachColumnFromStack(b,colId){
 const stacks=columnStacks(b);
 const groupIndex=stacks.findIndex(group=>group.includes(colId));
 if(groupIndex<0||stacks[groupIndex].length<2)return false;
 stacks[groupIndex]=stacks[groupIndex].filter(id=>id!==colId);
 stacks.splice(groupIndex+1,0,[colId]);
 b.columnStacks=stacks;
 b.columns=stacks.flat().map(id=>b.columns.find(col=>col.id===id)).filter(Boolean);
 return true;
}
function renderBoard(){const b=board();if(!b){$('#boardTitle').textContent='Mijn borden';$('#boardDescription').textContent='Maak een bord of laat een begeleider je toevoegen.';$('#columns').innerHTML='<p class="empty-column">Nog geen borden. Gebruik + Nieuw bord.</p>';$('#visibleCount').textContent='0 taken';$('#boardView').classList.remove('hidden');$('#archiveView').classList.add('hidden');setNavMode();return;}$('#mainBoardBtn')?.classList.toggle('hidden',b.ownerId!==viewer.id);if($('#mainBoardBtn')){$('#mainBoardBtn').textContent=state.mainBoards?.[viewer.id]===b.id?'★ Hoofdbord':'☆ Als hoofdbord instellen';$('#mainBoardBtn').setAttribute('aria-pressed',String(state.mainBoards?.[viewer.id]===b.id));}$('#boardTitle').textContent=b.title;$('#boardDescription').textContent=b.description||'Een gezamenlijk overzicht voor je team.';
let count=0;const renderColumn=col=>{const cards=displayedCards(b,col).filter(c=>taskMatches(c));count+=cards.length;return `<section class="column" draggable="${canEdit(b)}" data-column="${esc(col.id)}"><header class="column-header"><span class="column-color" style="background:${esc(col.color||COLORS[0])}"></span><strong class="column-heading">${esc(col.title)}</strong><span class="column-count">${cards.length}</span><button type="button" role="switch" class="column-dashboard-toggle ${dashboardChoice(b,col)?'selected':''}" data-toggle-dashboard="${esc(col.id)}" aria-checked="${dashboardChoice(b,col)}" aria-label="${esc(col.title)} op mijn dashboard" title="${dashboardChoice(b,col)?'Van mijn dashboard verwijderen':'Op mijn dashboard zetten'}"><span class="dashboard-toggle-label">Op mijn dashboard</span><span class="dashboard-switch-track" aria-hidden="true"><span class="dashboard-switch-thumb"></span></span></button><button class="column-menu ${canEdit(b)?'':'hidden'}" data-edit-col="${esc(col.id)}" title="Kolom wijzigen">···</button></header><div class="cards" data-cards="${esc(col.id)}">${cards.map(c=>isSprintCard(c)?sprintGoalCardHtml(c,b):cardHtml(c)).join('')}${!cards.length?'<div class="empty-column">Geen taken</div>':''}</div>${canEdit(b)?(quickColumnId===col.id?`<form class="quick-task-form" data-quick-column="${esc(col.id)}"><input name="title" maxlength="180" placeholder="Taaktitel…" aria-label="Titel van nieuwe taak" required autocomplete="off"><div class="quick-task-actions"><button class="primary-btn" type="submit">Toevoegen</button><button class="text-btn" type="button" data-quick-cancel>Annuleren</button></div></form>`:`<button class="add-task" data-add-card="${esc(col.id)}">＋ Taak toevoegen</button>`):''}</section>`;};const byId=new Map(b.columns.map(c=>[c.id,c]));
$('#columns').innerHTML=columnStacks(b).map(group=>`<div class="column-stack">${group.map(cid=>byId.get(cid)).filter(Boolean).map(renderColumn).join('')}</div>`).join('');$('#visibleCount').textContent=`${count} ${count===1?'taak':'taken'}`;$('#boardView').classList.remove('hidden');$('#archiveView').classList.add('hidden');setNavMode()}
function setNavMode(){renderNav();$('#archiveToggle').classList.toggle('active',activeView==='archive');$('#archiveToggle').setAttribute('aria-label',activeView==='archive'?'Terug naar bord':'Archief openen');$('#editBoard').style.display=activeView==='board'&&permission(board())==='owner'?'':'none';$('#newCardBtn').style.display=activeView==='board'&&canEdit()?'':'none';$('#addColumnBtn').style.display=activeView==='board'&&canEdit()?'':'none';$('#manageLabelsBtn').style.display=activeView==='board'&&canEdit()?'':'none';$('#embeddedArchiveBtn').style.display=activeView==='board'&&canEdit()?'':'none'}
function renderArchive(){activeView='archive';$('#boardView').classList.add('hidden');$('#archiveView').classList.remove('hidden');$('#boardTitle').textContent='Archief';$('#boardDescription').textContent='Taken terugzetten of definitief verwijderen';$('#archiveItems').innerHTML=visibleBoards().filter(canEdit).flatMap(b=>b.columns.flatMap(col=>col.cards.filter(c=>c.archived).map(c=>`<div class="archive-row"><div><strong>${esc(c.title)}</strong><small>${esc(b.title)} · ${esc(col.title)}</small></div><div class="top-actions"><button class="secondary-btn" data-restore="${esc(c.id)}">Terugzetten</button><button class="danger-btn" data-delete-archived="${esc(c.id)}">Verwijderen</button></div></div>`))).join('')||'<div class="empty-archive">Het archief is leeg.</div>';setNavMode()}
function update(){ensureSelection();persist();renderNav();activeView==='archive'?renderArchive():renderBoard()}
function openModal(type,heading,body,footer,eyebrow='PLANBORD'){modalType=type;$('#modalEyebrow').textContent=eyebrow;$('#modalHeading').textContent=heading;$('#modalBody').innerHTML=body;$('#modalFooter').innerHTML=footer;$('#modalLayer').classList.remove('hidden');document.body.style.overflow='hidden';setTimeout(()=>$('#modalBody input, #modalBody textarea')?.focus(),10)}
function closeModal(){const hadModal=modalType!==null;modalType=null;selectedCard=null;$('#modalLayer').classList.add('hidden');document.body.style.overflow='';if(hadModal&&widgetModalOnly&&window.parent!==window)window.parent.postMessage({type:'spectrum-pb2-modal-closed'},'*')}
const buttonFooter=(actionText='Opslaan',extra='')=>`${extra}<button class="secondary-btn" data-close-modal>Annuleren</button><button class="primary-btn" id="modalSave">${actionText}</button>`;
function boardModal(existing){
  const b=existing?board():null;
  if(b&&permission(b)!=='owner')return toast('Alleen de eigenaar mag dit bord beheren.');
  // Edit a draft, not the saved board: Cancel must not change membership.
  const draftAccess=new Map((b?.access||[]).map(entry=>[entry.id,entry.permission]));
  const manage=viewer.kind==='staff'&&(!b||canManage(b));
  const memberPanel=manage?`<section class="board-access-panel">
    <strong>Bordleden en rechten</strong>
    <p>Zoek een mediënt of begeleider op naam en bepaal diens toegang. Alleen toegevoegde leden staan hieronder.</p>
    <label class="access-search-label" for="boardMemberSearch">Persoon toevoegen</label>
    <input type="search" id="boardMemberSearch" placeholder="Zoek op voor- of achternaam…" autocomplete="off" aria-controls="boardMemberMatches" aria-expanded="false">
    <div class="access-search-results hidden" id="boardMemberMatches" role="listbox" aria-label="Zoekresultaten"></div>
    <div class="access-selected-heading">Toegevoegde leden <span id="boardMemberCount">0</span></div>
    <div class="access-rows" id="boardSelectedMembers"></div>
  </section>`:'';
  openModal('board',b?'Bord bewerken':'Nieuw bord',`<div class="field"><label>Naam bord</label><input id="boardName" maxlength="80" value="${esc(b?.title||'')}"></div><div class="field"><label>Beschrijving</label><textarea id="boardDesc">${esc(b?.description||'')}</textarea></div><div class="field"><label>Kleur</label><div class="choice-list">${COLORS.map((c,i)=>`<label class="choice-pill"><input type="radio" name="boardColor" value="${c}" ${c===(b?.color||COLORS[0])?'checked':''}><span class="choice-dot" style="background:${c}"></span>${i+1}</label>`).join('')}</div></div>${memberPanel}`,buttonFooter(b?'Wijzigingen opslaan':'Bord aanmaken',b&&state.boards.length>1?'<button class="danger-btn push-left" id="deleteBoard">Bord verwijderen</button>':''));
  if(manage){
    const search=$('#boardMemberSearch'),results=$('#boardMemberMatches'),selected=$('#boardSelectedMembers');
    const eligible=()=>accounts.filter(a=>a.id!==viewer.id&&(a.kind==='staff'||a.kind==='client'));
    const renderSelected=()=>{
      const chosen=eligible().filter(a=>draftAccess.has(a.id)).sort((a,b)=>a.name.localeCompare(b.name,'nl'));
      $('#boardMemberCount').textContent=String(chosen.length);
      selected.innerHTML=chosen.length?chosen.map(a=>`<div class="access-row"><span>${esc(a.name)} <small>${a.kind==='staff'?'Begeleider':'Mediënt'}</small></span><div class="access-actions"><select data-access-id="${esc(a.id)}" aria-label="Rechten voor ${esc(a.name)}"><option value="view" ${draftAccess.get(a.id)==='view'?'selected':''}>Alleen bekijken</option><option value="edit" ${draftAccess.get(a.id)==='edit'?'selected':''}>Bewerken</option></select><button type="button" class="access-remove" data-remove-access="${esc(a.id)}" aria-label="${esc(a.name)} verwijderen" title="Verwijderen">×</button></div></div>`).join(''):'<div class="access-empty">Nog geen leden toegevoegd.</div>';
    };
    const renderMatches=()=>{
      const q=search.value.trim().toLocaleLowerCase('nl');
      const matches=q?eligible().filter(a=>!draftAccess.has(a.id)&&a.name.toLocaleLowerCase('nl').includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'nl')):[];
      results.classList.toggle('hidden',!q);
      search.setAttribute('aria-expanded',String(Boolean(q)));
      results.innerHTML=q?(matches.length?matches.slice(0,15).map(a=>`<button type="button" role="option" data-add-access="${esc(a.id)}"><span>${esc(a.name)}</span><small>${a.kind==='staff'?'Begeleider':'Mediënt'}</small><span aria-hidden="true">＋</span></button>`).join('')+(matches.length>15?`<p class="access-result-hint">${matches.length-15} andere resultaten — typ verder om te verfijnen.</p>`:''):'<p class="access-result-hint">Geen beschikbare personen gevonden.</p>'):'';
    };
    search.addEventListener('input',renderMatches);
    search.addEventListener('keydown',event=>{
      if(event.key==='Escape'){results.classList.add('hidden');search.setAttribute('aria-expanded','false');event.stopPropagation();}
      else if(event.key==='ArrowDown'&&!results.classList.contains('hidden')){const first=results.querySelector('[data-add-access]');if(first){event.preventDefault();first.focus();}}
      else if(event.key==='Enter'&&!results.classList.contains('hidden')){const first=results.querySelector('[data-add-access]');if(first){event.preventDefault();first.click();}}
    });
    results.addEventListener('keydown',event=>{
      if(!['ArrowDown','ArrowUp','Escape'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='Escape'){search.focus();results.classList.add('hidden');return;}
      const buttons=$$('[data-add-access]',results),i=buttons.indexOf(document.activeElement);
      if(event.key==='ArrowDown')buttons[Math.min(i+1,buttons.length-1)]?.focus();
      else if(i<=0)search.focus();else buttons[i-1]?.focus();
    });
    results.addEventListener('click',event=>{
      const item=event.target.closest('[data-add-access]');if(!item)return;
      draftAccess.set(item.dataset.addAccess,'view');search.value='';renderMatches();renderSelected();search.focus();
    });
    selected.addEventListener('change',event=>{
      const input=event.target.closest('[data-access-id]');if(input)draftAccess.set(input.dataset.accessId,input.value);
    });
    selected.addEventListener('click',event=>{
      const button=event.target.closest('[data-remove-access]');if(!button)return;
      draftAccess.delete(button.dataset.removeAccess);renderSelected();renderMatches();
    });
    renderSelected();
  }
  $('#modalSave').onclick=()=>{
    const name=$('#boardName').value.trim();if(!name)return toast('Vul een bordnaam in.');
    const color=$('input[name="boardColor"]:checked')?.value||b?.color||COLORS[0];
    const access=manage?[...draftAccess].map(([id,permission])=>({id,permission})):[];
    if(b){b.title=name;b.description=$('#boardDesc').value.trim();b.color=color;if(manage)b.access=access;}
    else{const n={id:id(),ownerId:viewer.id,access,title:name,description:$('#boardDesc').value.trim(),color,labels:[...DEFAULT_LABELS.map(l=>({...l})),{id:SPRINT_LABEL_ID,name:'Sprintdoel',color:SPRINT_LABEL_DEFAULT,fg:'#ffffff'}],sprintTodoOrder:[],columns:[{id:id(),title:'Te doen',color:COLORS[0],cards:[]},{id:id(),title:'Bezig',color:COLORS[1],cards:[]},{id:id(),title:'Afgerond',color:COLORS[2],cards:[]}]};state.boards.push(n);state.selected=n.id;}
    closeModal();activeView='board';update();
  };
  $('#deleteBoard')?.addEventListener('click',()=>{if(!confirm(`Bord "${b.title}" inclusief taken verwijderen?`))return;state.boards=state.boards.filter(x=>x.id!==b.id);ensureSelection();closeModal();update()});
}
function columnModal(colId){if(denied())return;const b=board(),col=b.columns.find(c=>c.id===colId);openModal('column',col?'Kolom bewerken':'Nieuwe kolom',`<div class="field"><label>Kolomnaam</label><input id="colName" maxlength="55" value="${esc(col?.title||'')}"></div><div class="field"><label>Kleur</label><div class="choice-list">${COLORS.map((c,i)=>`<label class="choice-pill"><input type="radio" name="colColor" value="${c}" ${c===(col?.color||COLORS[0])?'checked':''}><span class="choice-dot" style="background:${c}"></span>${i+1}</label>`).join('')}</div></div><label class="pb-dashboard-choice"><input type="checkbox" id="showColumnOnDashboard" ${col&&dashboardChoice(b,col)?'checked':''}> Weergeven op mijn dashboard</label>`,buttonFooter(col?'Opslaan':'Kolom toevoegen',col?`${columnStacks(b).some(group=>group.length>1&&group.includes(col.id))?'<button class="secondary-btn push-left" id="detachColumn">Uit stapel halen</button>':''}<button class="danger-btn" id="deleteColumn">Kolom verwijderen</button>`:''));$('#modalSave').onclick=()=>{const title=$('#colName').value.trim();if(!title)return toast('Vul een kolomnaam in.');const color=$('input[name="colColor"]:checked')?.value||col?.color||COLORS[0];const showOnDashboard=$('#showColumnOnDashboard').checked;if(col){col.title=title;col.color=color;setDashboardChoice(b,col,showOnDashboard)}else{const newCol={id:id(),title,color,cards:[]};b.columns.push(newCol);setDashboardChoice(b,newCol,showOnDashboard)}closeModal();update()};$('#detachColumn')?.addEventListener('click',()=>{if(detachColumnFromStack(b,colId)){closeModal();update();toast('Kolom staat weer naast de andere kolommen.')}});$('#deleteColumn')?.addEventListener('click',()=>{if(col.cards.length)return toast('Verplaats of archiveer eerst alle kaarten.');if(!confirm('Lege kolom verwijderen?'))return;b.columns=b.columns.filter(c=>c.id!==colId);b.columnStacks=columnStacks(b);closeModal();update()})}
function manageLabels(){
 if(denied())return;
 const b=board();let draft=boardLabels(b).map(l=>({...l}));
 const draw=()=>{
  const target=$('#labelManagerRows');if(!target)return;
  target.innerHTML=draft.map(l=>`<div class="label-manager-row" data-label-row="${esc(l.id)}"><input type="color" aria-label="Kleur voor ${esc(l.name)}" data-label-color="${esc(l.id)}" value="${esc(l.color)}"><input maxlength="36" aria-label="Labelnaam" data-label-name="${esc(l.id)}" value="${esc(l.name)}" ${l.id===SPRINT_LABEL_ID?'readonly title="Vast systeemlabel"':''}><button class="small-remove" type="button" data-label-remove="${esc(l.id)}" title="Label verwijderen" ${l.id===SPRINT_LABEL_ID?'disabled hidden':''}>×</button></div>`).join('');
 };
 openModal('labels','Labels en kleuren beheren',`<p class="label-manager-intro">Bepaal zelf wat iedere kleur op dit bord betekent.</p><div id="labelManagerRows" class="label-manager-list"></div><button class="secondary-btn label-manager-add" id="addCustomLabel" type="button">＋ Label toevoegen</button>`,buttonFooter('Labels opslaan'),'BORDINSTELLINGEN');
 draw();
 $('#labelManagerRows').addEventListener('input',e=>{const key=e.target.dataset.labelName||e.target.dataset.labelColor;const item=draft.find(l=>l.id===key);if(!item)return;if(e.target.dataset.labelName){if(item.id!==SPRINT_LABEL_ID)item.name=e.target.value;}else item.color=e.target.value;});
 $('#labelManagerRows').addEventListener('click',e=>{const btn=e.target.closest('[data-label-remove]');if(!btn||btn.dataset.labelRemove===SPRINT_LABEL_ID)return;draft=draft.filter(l=>l.id!==btn.dataset.labelRemove);draw();});
 $('#addCustomLabel').onclick=()=>{draft.push({id:id(),name:'Nieuw label',color:'#579bd0',fg:'#ffffff'});draw();const inputs=$$('[data-label-name]');inputs.at(-1)?.focus();inputs.at(-1)?.select()};
 $('#modalSave').onclick=()=>{
  draft=draft.map(l=>({...l,name:l.id===SPRINT_LABEL_ID?'Sprintdoel':(l.name.trim()||'Naamloos'),fg:contrastText(l.color)}));
  const removed=new Set(boardLabels(b).map(l=>l.id).filter(k=>!draft.some(l=>l.id===k)));
  b.labels=draft;
  if(removed.size)b.columns.forEach(col=>col.cards.forEach(c=>{c.labels=c.labels.filter(k=>!removed.has(k))}));
  closeModal();renderFilters();update();toast('Labels opgeslagen.');
 };
}
function contrastText(hex){const h=hex.replace('#','');const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b>.42?'#203145':'#ffffff'}
function startQuickTask(columnId){if(!canEdit())return;quickColumnId=columnId||board()?.columns[0]?.id;renderBoard();$('#columns .quick-task-form input')?.focus()}
function addQuickTask(form){if(!canEdit())return;const b=board(),col=b?.columns.find(c=>c.id===form.dataset.quickColumn);if(!col)return;const title=form.elements.title.value.trim();if(!title)return;const card={id:id(),title,description:'',labels:[],members:[],due:'',checklist:[],comments:[],activity:[],archived:false,completed:false};col.cards.unshift(card);log(card,`Aangemaakt door ${viewer.name}`);quickColumnId=null;update();toast('Taak toegevoegd. Klik erop voor meer opties.');}
function memberChoices(c){
  // Keep this as a per-task draft. Never change a card until Save is pressed.
  return `<div class="assignee-selectors">
    <div class="assignee-group"><details class="assignee-picker" data-assignee-kind="client">
      <summary>Mediënten <span class="assignee-count" data-assignee-count="client"></span><span class="assignee-caret">⌄</span></summary>
      <div class="assignee-dropdown"><input type="search" data-assignee-search="client" placeholder="Zoek mediënt op naam…" aria-label="Zoek mediënt" autocomplete="off">
        <div class="assignee-results" data-assignee-results="client" role="group" aria-label="Mediënten zoeken"></div></div>
    </details></div>
    <div class="assignee-group"><details class="assignee-picker" data-assignee-kind="staff">
      <summary>Begeleiding <span class="assignee-count" data-assignee-count="staff"></span><span class="assignee-caret">⌄</span></summary>
      <div class="assignee-dropdown"><input type="search" data-assignee-search="staff" placeholder="Zoek begeleider op naam…" aria-label="Zoek begeleider" autocomplete="off">
        <div class="assignee-results" data-assignee-results="staff" role="group" aria-label="Begeleiders zoeken"></div></div>
    </details></div>
  </div><div class="assignee-selected" id="assigneeSelected" aria-live="polite"></div>`;
}
function setupMemberChoices(c){
  const selected=new Set(c.members||[]);
  const directory=()=>[...new Map(accounts.filter(a=>a.name&&['client','staff'].includes(a.kind)).map(a=>[a.name,a])).values()];
  const kindOf=name=>directory().find(a=>a.name===name)?.kind;
  const renderSelected=()=>{
    const items=[...selected].sort((a,b)=>a.localeCompare(b,'nl'));
    $('#assigneeSelected').innerHTML=items.length?items.map(name=>`<span class="assignee-chip">${esc(name)}<button type="button" data-assignee-remove="${esc(name)}" aria-label="${esc(name)} verwijderen">×</button></span>`).join(''):'<span class="assignee-empty">Nog niemand toegewezen</span>';
    for(const kind of ['client','staff']){
      const count=items.filter(name=>kindOf(name)===kind).length;
      $(`[data-assignee-count="${kind}"]`).textContent=count?`(${count})`:'';
    }
  };
  const draw=kind=>{
    const input=$(`[data-assignee-search="${kind}"]`);
    const target=$(`[data-assignee-results="${kind}"]`);
    const q=input.value.trim().toLocaleLowerCase('nl');
    if(!q){target.innerHTML='<p class="assignee-hint">Typ een naam om iemand te vinden.</p>';return;}
    const matches=directory().filter(a=>a.kind===kind&&a.name.toLocaleLowerCase('nl').includes(q));
    target.innerHTML=matches.length?matches.slice(0,30).map(a=>`<label class="assignee-result"><input type="checkbox" data-assignee-option="${esc(a.name)}" ${selected.has(a.name)?'checked':''}><span>${esc(a.name)}</span></label>`).join('')+(matches.length>30?`<p class="assignee-hint">${matches.length-30} extra resultaten. Typ verder om te verfijnen.</p>`:''):'<p class="assignee-hint">Geen personen gevonden.</p>';
  };
  for(const kind of ['client','staff']){
    const root=$(`[data-assignee-kind="${kind}"]`);
    const input=$(`[data-assignee-search="${kind}"]`);
    input.addEventListener('input',()=>draw(kind));
    root.addEventListener('toggle',()=>{if(root.open){for(const other of $$('[data-assignee-kind]'))if(other!==root)other.open=false;draw(kind);input.focus();}});
    root.addEventListener('change',e=>{
      const control=e.target.closest('[data-assignee-option]');if(!control)return;
      if(control.checked)selected.add(control.dataset.assigneeOption);
      else selected.delete(control.dataset.assigneeOption);
      renderSelected();
    });
  }
  $('#assigneeSelected').addEventListener('click',e=>{
    const btn=e.target.closest('[data-assignee-remove]');if(!btn)return;
    selected.delete(btn.dataset.assigneeRemove);
    renderSelected();
    for(const kind of ['client','staff'])draw(kind);
  });
  renderSelected();
  return ()=>[...selected];
}
function labelChoices(c){return boardLabels().filter(l=>l.id!==SPRINT_LABEL_ID).map(l=>`<label class="choice-pill"><input type="checkbox" data-label="${esc(l.id)}" ${c.labels.includes(l.id)?'checked':''}><span class="choice-dot" style="background:${esc(l.color)}"></span>${esc(l.name)}</label>`).join('')}
function log(c,msg){c.activity??=[];c.activity.unshift({at:iso(),text:msg});c.activity=c.activity.slice(0,30)}
function renderCardModal(cid,colId){if(!cid&&denied())return;let loc=cid?findCard(cid):null, b=board(), col=loc?.col||b.columns.find(x=>x.id===colId)||b.columns[0],c=loc?.card||{id:null,title:'',description:'',labels:[],members:[],due:'',checklist:[],comments:[],activity:[],archived:false};selectedCard=cid||null;
openModal('card',cid?'Taak bewerken':'Nieuwe taak',`<div class="field"><label>Titel</label><input id="cardName" maxlength="180" value="${esc(c.title)}" placeholder="Wat moet er gebeuren?"></div><div class="field"><label>Beschrijving</label><textarea id="cardDesc" placeholder="Beschrijf de taak…">${esc(c.description)}</textarea></div><div class="form-row"><div class="field"><label>Kolom</label><select id="cardColumn">${b.columns.map(x=>`<option value="${esc(x.id)}" ${x.id===col.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></div><div class="field"><label>Deadline (optioneel)</label><input id="cardDue" type="date" value="${esc(c.due)}"></div></div><div class="form-section-title">LABELS</div><div class="choice-list">${labelChoices(c)}</div>${canAssign()?`<div class="form-section-title">TOEGEWEZEN AAN</div><div class="choice-list">${memberChoices(c)}</div>`:`<div class="form-section-title">TOEGEWEZEN AAN</div><div class="assignee-readonly">${esc(c.members.join(', ')||'Niemand toegewezen')}</div>`}<section class="checklist-panel"><div class="checklist-top"><strong>Checklist</strong><span id="checkProgress">0 / 0</span></div><div class="progress-rail"><span id="checkBar"></span></div><div id="checkListRows"></div><div class="inline-add"><input id="checkInput" placeholder="Voeg een checklistitem toe"><button id="addCheck">Toevoegen</button></div></section>${cid?`<section class="comments-panel"><strong>Opmerkingen</strong><div id="commentRows"></div><div class="inline-add"><input id="commentInput" placeholder="Schrijf een opmerking…"><button id="addComment">Plaatsen</button></div></section><section class="activity-panel"><strong>Activiteit</strong><div id="activityRows"></div></section>`:''}`,buttonFooter(cid?'Wijzigingen opslaan':'Taak aanmaken',cid?`<button class="task-complete-action push-left" id="completeCard" type="button">${c.completed?'↶ Heropenen':'✓ Afronden'}</button><button class="secondary-btn ${canEdit()?'':'hidden'}" id="duplicateCard">Dupliceren</button><button class="danger-btn ${canEdit()?'':'hidden'}" id="archiveCard">Archiveren</button>`:''),'TAAKKAART');
const readAssignedMembers=canAssign()?setupMemberChoices(c):null;
// Local draft keeps checklists editable without mutating the board before saving.
let checklist=(c.checklist||[]).map(x=>({...x}));let comments=(c.comments||[]).map(x=>({...x}));if(!canEdit()){ $$('#modalBody input,#modalBody textarea,#modalBody select').forEach(x=>x.disabled=true);['modalSave','duplicateCard','archiveCard','addCheck','addComment','checkInput','commentInput'].forEach(k=>{const el=$('#'+k);if(el){el.disabled=true;el.classList.add('hidden');}});$('#modalHeading').textContent='Taak bekijken'; }
const renderChecks=()=>{let done=checklist.filter(x=>x.done).length;$('#checkProgress').textContent=`${done} / ${checklist.length}`;$('#checkBar').style.width=`${checklist.length?done/checklist.length*100:0}%`;$('#checkListRows').innerHTML=checklist.map(x=>`<div class="checklist-item ${x.done?'done':''}"><input type="checkbox" ${canEdit()?'':'disabled'} data-check-toggle="${esc(x.id)}" ${x.done?'checked':''}><span>${esc(x.text)}</span><button class="small-remove ${canEdit()?'':'hidden'}" data-check-remove="${esc(x.id)}" title="Verwijderen">×</button></div>`).join('')};const renderComments=()=>{if(!cid)return;$('#commentRows').innerHTML=comments.map(x=>`<div class="comment"><small>${esc(x.author)} · ${new Date(x.at).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small>${esc(x.text)}</div>`).join('')||'<small class="meta-item">Nog geen opmerkingen</small>';$('#activityRows').innerHTML=(c.activity||[]).map(x=>`<div class="activity-row"><time>${new Date(x.at).toLocaleDateString('nl-NL')}</time><span>${esc(x.text)}</span></div>`).join('')||'<small class="meta-item">Nog geen activiteit</small>'};renderChecks();renderComments();
$('#addCheck').onclick=()=>{let text=$('#checkInput').value.trim();if(!text)return;checklist.push({id:id(),text,done:false});$('#checkInput').value='';renderChecks()};$('#checkInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#addCheck').click()}};
$('#checkListRows').onclick=e=>{const rm=e.target.closest('[data-check-remove]');if(rm&&canEdit()){checklist=checklist.filter(x=>x.id!==rm.dataset.checkRemove);renderChecks()}};
$('#checkListRows').onchange=e=>{const t=e.target.closest('[data-check-toggle]');if(t){let item=checklist.find(x=>x.id===t.dataset.checkToggle);if(canEdit()&&item)item.done=t.checked;renderChecks()}};
if(cid){$('#completeCard').onclick=()=>completeTask(cid);$('#addComment').onclick=()=>{const text=$('#commentInput').value.trim();if(!text)return;comments.push({id:id(),author:(window.pbCurrentUser||'Gebruiker'),text,at:iso()});$('#commentInput').value='';renderComments()};$('#commentInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#addComment').click()}}}
const apply=()=>{const title=$('#cardName').value.trim();if(!title){toast('Geef de taak een titel.');return null}const dest=b.columns.find(x=>x.id===$('#cardColumn').value)||col;let obj=c.id?c:{id:id(),title:'',description:'',labels:[],members:[],due:'',checklist:[],comments:[],activity:[],archived:false};obj.title=title;obj.description=$('#cardDesc').value.trim();obj.due=$('#cardDue').value;obj.labels=$$('[data-label]:checked').map(x=>x.dataset.label);if(readAssignedMembers)obj.members=readAssignedMembers();obj.checklist=checklist;obj.comments=comments;if(!c.id){dest.cards.unshift(obj);log(obj,'Taak aangemaakt')}else{if(dest!==col){col.cards=col.cards.filter(x=>x.id!==obj.id);dest.cards.unshift(obj);log(obj,`Verplaatst naar ${dest.title}`)}else log(obj,'Taak bijgewerkt')}return obj};
if($('#modalSave'))$('#modalSave').onclick=()=>{if(denied()||!apply())return;closeModal();update();toast('Taak opgeslagen')};$('#archiveCard')?.addEventListener('click',()=>{if(denied()||!confirm('Taak archiveren?'))return;c.archived=true;log(c,'Gearchiveerd');closeModal();update();toast('Taak gearchiveerd')});$('#duplicateCard')?.addEventListener('click',()=>{if(denied())return;const o=apply();if(!o)return;let clone=JSON.parse(JSON.stringify(o));clone.id=id();clone.title+=' (kopie)';clone.comments=[];clone.activity=[];col.cards.unshift(clone);log(clone,'Taak gedupliceerd');closeModal();update();toast('Taak gedupliceerd')})}
function setSelectedBoard(bid){if(!visibleBoards().some(b=>b.id===bid))return;closeBoardPicker();state.selected=bid;quickColumnId=null;activeView='board';$('#searchInput').value='';$('#labelFilter').value='';$('#memberFilter').value='';$('#dueFilter').checked=false;renderFilters();update()}
function closeBoardPicker(){const menu=$('#boardPickerMenu');menu.classList.add('hidden');$('#boardPickerToggle').setAttribute('aria-expanded','false')}
$('#boardPickerToggle').addEventListener('click',()=>{const menu=$('#boardPickerMenu');const isOpen=!menu.classList.contains('hidden');menu.classList.toggle('hidden',isOpen);$('#boardPickerToggle').setAttribute('aria-expanded',String(!isOpen))});
document.addEventListener('click',e=>{if(!e.target.closest('#boardPicker'))closeBoardPicker()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBoardPicker()});
// Delegated actions.
document.addEventListener('click',e=>{const toggle=e.target.closest('[data-toggle-dashboard]');if(toggle){const b=board(),col=b?.columns.find(c=>c.id===toggle.dataset.toggleDashboard);if(b&&col&&permission(b)!=='none'){const next=!dashboardChoice(b,col);setDashboardChoice(b,col,next);update();toast(next?'Kolom toegevoegd aan jouw dashboard.':'Kolom verwijderd van jouw dashboard.')}return;}if(e.target.closest('[data-close-modal]'))closeModal();let b=e.target.closest('[data-board]');if(b)return setSelectedBoard(b.dataset.board);let sprintFold=e.target.closest('[data-toggle-sprint]');if(sprintFold){e.stopPropagation();const id=String(sprintFold.dataset.toggleSprint);if(collapsedSprintCards.has(id))collapsedSprintCards.delete(id);else collapsedSprintCards.add(id);renderBoard();return;}let sprint=e.target.closest('[data-sprint-card]');if(sprint)return openSprintGoal(sprint.dataset.sprintCard);let c=e.target.closest('[data-card]');if(c&&!drag)return renderCardModal(c.dataset.card);let a=e.target.closest('[data-add-card]');if(a)return startQuickTask(a.dataset.addCard);if(e.target.closest('[data-quick-cancel]')){quickColumnId=null;renderBoard();return;}let ed=e.target.closest('[data-edit-col]');if(ed)return columnModal(ed.dataset.editCol);let res=e.target.closest('[data-restore]');if(res){let loc=findCard(res.dataset.restore);if(loc&&canEdit(loc.board)){loc.card.archived=false;log(loc.card,'Teruggezet uit archief');update();toast('Taak teruggezet')}return}let del=e.target.closest('[data-delete-archived]');if(del){let loc=findCard(del.dataset.deleteArchived);if(!loc||!canEdit(loc.board)||!confirm('Taak definitief verwijderen?'))return;loc.col.cards=loc.col.cards.filter(x=>x.id!==loc.card.id);update();return}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modalLayer').classList.contains('hidden'))closeModal();if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-sprint-card]')){e.preventDefault();openSprintGoal(e.target.dataset.sprintCard)}else if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-card]')){e.preventDefault();renderCardModal(e.target.dataset.card)}});
$('#mainBoardBtn').onclick=()=>{const b=board();if(!b||b.ownerId!==viewer.id)return;state.mainBoards??={};state.mainBoards[viewer.id]=b.id;update();toast('Hoofdbord ingesteld.');};$('#closeModal').onclick=closeModal;$('#addBoardSide').onclick=()=>{closeBoardPicker();boardModal(false)};$('#editBoard').onclick=()=>boardModal(true);$('#newCardBtn').onclick=()=>startQuickTask(board()?.columns[0]?.id);$('#manageLabelsBtn').onclick=manageLabels;$('#addColumnBtn').onclick=()=>columnModal(null);$('#archiveToggle').onclick=()=>{closeBoardPicker();if(activeView==='archive'){activeView='board';update()}else renderArchive()};
$('#themeToggle').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';setTheme();persist()};
['searchInput','labelFilter','memberFilter','dueFilter'].forEach(k=>$('#'+k).addEventListener(k==='searchInput'?'input':'change',()=>{if(activeView==='board')renderBoard()}));$('#clearFilters').onclick=()=>{$('#searchInput').value='';$('#labelFilter').value='';$('#memberFilter').value='';$('#dueFilter').checked=false;renderBoard()};
$('#exportBtn').onclick=()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='planbord-2-concept-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
$('#importBtn').onclick=()=>$('#importFile').click();$('#importFile').onchange=async e=>{let file=e.target.files?.[0];if(!file)return;try{let value=JSON.parse(await file.text());if(!Array.isArray(value.boards)||!Array.isArray(value.labels)||!value.boards.length)throw Error('Ongeldig bestand');if(!confirm('Huidige lokale borden vervangen door de import?'))return;state=value;migrateBoards();ensureSelection();setTheme();renderFilters();activeView='board';update();toast('Borden geïmporteerd')}catch{toast('Dit is geen geldige Planbord-export')}finally{e.target.value=''}};
// Drag and drop: cards reorder into a column. Columns may also reorder by their header.
let lastDragTime=0;
$('#columns').addEventListener('submit',e=>{const form=e.target.closest('[data-quick-column]');if(!form)return;e.preventDefault();addQuickTask(form)});
$('#columns').addEventListener('keydown',e=>{if(e.key==='Escape'&&e.target.closest('[data-quick-column]')){quickColumnId=null;renderBoard();}});
$('#columns').addEventListener('contextmenu',e=>{const sprint=e.target.closest('[data-sprint-card]');if(sprint){e.preventDefault();openSprintGoal(sprint.dataset.sprintCard);return}const card=e.target.closest('[data-card]');if(card){e.preventDefault();renderCardModal(card.dataset.card)}});
let columnDragHandle=null;
$('#columns').addEventListener('pointerdown',e=>{
 const header=e.target.closest('.column-header');
 columnDragHandle=header&&!e.target.closest('button,input,select,textarea')
  ?header.closest('[data-column]')?.dataset.column:null;
});
$('#columns').addEventListener('dragstart',e=>{
 if(!canEdit()){e.preventDefault();return;}
 const card=e.target.closest('[data-card],[data-sprint-card]'),column=e.target.closest('[data-column]');
 if(card){drag={type:'card',id:card.dataset.card||card.dataset.sprintCard,sprint:Boolean(card.dataset.sprintCard)};card.classList.add('dragging');}
 else if(column){
  // Start column movement from its header only, never from card bodies or controls.
  if(columnDragHandle!==column.dataset.column){e.preventDefault();return;}
  drag={type:'column',id:column.dataset.column};column.classList.add('dragging');$('#columns').classList.add('column-drag-active');
 }else return;
 e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',drag.id);
});
$('#columns').addEventListener('dragover',e=>{
 if(!canEdit()||!drag)return;
 if(drag.type==='card'){
  const zone=e.target.closest('[data-cards]');if(!zone)return;
  e.preventDefault();
  $$('.drop-target,.target-before,.target-after').forEach(x=>x.classList.remove('drop-target','target-before','target-after'));
  zone.classList.add('drop-target');
  const over=e.target.closest('[data-card],[data-sprint-card]');
  if(over&&(over.dataset.card||over.dataset.sprintCard)!==drag.id){
   const rect=over.getBoundingClientRect();over.classList.add(e.clientY<rect.top+rect.height/2?'target-before':'target-after');
  }
 }else{
  e.preventDefault();e.dataTransfer.dropEffect='move';
  showColumnDropPreview(columnDropIntent(e));
 }
});
$('#columns').addEventListener('drop',e=>{
 if(!canEdit()||!drag)return;
 e.preventDefault();const d=drag;
 if(d.type==='card'){
  const zone=e.target.closest('[data-cards]');
  if(zone){
   const b=board(),dest=b.columns.find(x=>x.id===zone.dataset.cards),todo=sprintTodoColumn(b);
   if(dest&&(!d.sprint||dest===todo)){
    const loc=d.sprint?null:findCard(d.id);
    if(d.sprint||loc){
     const over=e.target.closest('[data-card],[data-sprint-card]');
     const targetId=over?.dataset.card||over?.dataset.sprintCard;
     const after=over?.classList.contains('target-after');
     if(!d.sprint)loc.col.cards=loc.col.cards.filter(x=>x.id!==d.id);
     const destinationCards=displayedCards(b,dest).filter(c=>String(c.id)!==String(d.id));
     let pos=targetId&&targetId!==d.id?destinationCards.findIndex(c=>String(c.id)===String(targetId)):-1;
     if(pos<0)pos=destinationCards.length;else if(after)pos++;
     const draggedCard=d.sprint?sprintCardsForBoard(b).find(c=>String(c.id)===String(d.id)):loc.card;
     if(draggedCard){
      destinationCards.splice(pos,0,draggedCard);
      if(dest===todo)b.sprintTodoOrder=destinationCards.map(c=>String(c.id));
      if(!d.sprint){
       if(dest!==todo)dest.cards.splice(pos,0,loc.card);
       else dest.cards=destinationCards.filter(c=>!isSprintCard(c));
       if(dest!==loc.col)log(loc.card,`Verplaatst naar ${dest.title}`);
      }
      lastDragTime=Date.now();update();
     }
    }
   }
  }
 }else{
  const intent=columnDropIntent(e);const b=board();
  const changed=intent?.type==='slot'
   ?moveColumnToStandaloneSlot(b,d.id,intent.slot)
   :intent?.type==='column'&&moveColumnInStacks(b,d.id,intent.target,intent.position);
  if(changed){lastDragTime=Date.now();update();}
 }
 drag=null;columnDragHandle=null;$('#columns').classList.remove('column-drag-active');
 clearColumnDropPreview();
});
$('#columns').addEventListener('dragend',()=>{
 drag=null;columnDragHandle=null;$('#columns').classList.remove('column-drag-active');
 $$('.dragging,.drop-target,.target-before,.target-after').forEach(x=>x.classList.remove('dragging','drop-target','target-before','target-after'));
 clearColumnDropPreview();
});
$('#columns').addEventListener('click',e=>{if(Date.now()-lastDragTime<350){e.preventDefault();e.stopPropagation()}},true);
$('#embeddedArchiveBtn')?.addEventListener('click',()=>$('#archiveToggle').click());setTheme();renderFilters();update();if(window.parent!==window)window.parent.postMessage({type:'spectrum-pb2-ready'},'*');
})();

// The left navigation is a visual HUB shell only in this standalone demo.
document.querySelectorAll('[data-demo-page]').forEach(button => button.addEventListener('click', () => toast('Alleen Planbord werkt in dit losse prototype. Spectrum HUB is niet gekoppeld.')));
document.getElementById('planbordNav')?.addEventListener('click',()=>{if (typeof activeView !== 'undefined' && activeView==='archive') {activeView='board';document.querySelector('#archiveView').classList.add('hidden');document.querySelector('#boardView').classList.remove('hidden');update();}});
