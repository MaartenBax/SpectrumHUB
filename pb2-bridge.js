(()=>{
  'use strict';
  const STORAGE_KEY='spectrum-hub-planbord2-widget-cache-v1';
  const ORDER_KEY='spectrum-hub-planbord2-dashboard-order-v1';
  const frame=document.getElementById('pb2Frame');
  const dashboard=document.getElementById('pb2DashboardColumns');
  if(!frame||!dashboard)return;
  let snapshot=null;
  let taskModalFrame=null;
  let taskModalContainer=null;
  let modalPreviousFocus=null;
  const expandedTasks=new Set();
  try{snapshot=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{}
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function currentUser(){
    try{const hub=JSON.parse(localStorage.getItem('spectrumHubLiveDemoV24')||'null');return hub?.role||null}catch{return null}
  }
  function loadOrders(){try{return JSON.parse(localStorage.getItem(ORDER_KEY)||'{}')||{}}catch{return {}}}
  function saveOrder(user,order){
    if(!user)return;
    const orders=loadOrders();orders[user]=order;
    try{localStorage.setItem(ORDER_KEY,JSON.stringify(orders))}catch{}
  }
  // Project centrally stored sprint goals into each owned board's "Te doen".
  function isSprintCard(card){return Boolean(card?.sourceGoalId&&!card.sourceGoalLineId);}
  function displayedColumnCards(board,col,user){
    const regular=(col.cards||[]).filter(c=>!c.archived);
    const todo=board.columns.find(c=>c.id==='todo')||board.columns.find(c=>/^te doen$/i.test(c.title.trim()))||board.columns[0];
    if(board.ownerId!==user||col.id!==todo?.id)return regular;
    const source=(snapshot?.boards||[]).find(b=>b.id===`hub-sprint-${user}`);
    const sprint=(source?.columns||[]).flatMap(c=>c.cards||[]).filter(c=>isSprintCard(c)&&!c.archived);
    const all=[...regular,...sprint],lookup=new Map(all.map(c=>[String(c.id),c]));
    const ordered=(board.sprintTodoOrder||[]).map(id=>lookup.get(String(id))).filter(Boolean);
    const used=new Set(ordered.map(c=>String(c.id)));
    return [...ordered,...all.filter(c=>!used.has(String(c.id)))];
  }
  function getChosen(user){
    const choices=snapshot?.dashboardChoices?.[user];
    const chosen=(snapshot?.boards||[]).filter(b=>!String(b.id||'').startsWith('hub-sprint-')&&(b.ownerId===user||(b.access||[]).some(a=>a.id===user))).flatMap(board=>(board.columns||[]).filter(col=>{
      const key=`${board.id}:${col.id}`;
      return choices&&Object.prototype.hasOwnProperty.call(choices,key)?Boolean(choices[key]):Boolean(col.showOnDashboard);
    }).map(col=>({board,col,key:`${board.id}:${col.id}`})));
    const order=loadOrders()[user];
    if(!Array.isArray(order))return chosen;
    const indexes=new Map(order.map((key,i)=>[key,i]));
    return chosen.map((entry,i)=>({...entry,originalIndex:i})).sort((a,b)=>
      (indexes.has(a.key)?indexes.get(a.key):order.length+a.originalIndex)-(indexes.has(b.key)?indexes.get(b.key):order.length+b.originalIndex)
    );
  }
  function boardPermission(board,user){
    return board.ownerId===user?'owner':(board.access||[]).find(entry=>entry.id===user)?.permission||'none';
  }
  function taskHtml(task,board,user){
    const items=Array.isArray(task.checklist)?task.checklist:[];
    const done=items.filter(item=>item.done).length;
    const expanded=expandedTasks.has(`${board.id}:${task.id}`);
    const editable=['owner','edit'].includes(boardPermission(board,user));
    const sprint=isSprintCard(task);
    const sprintLabel=board.labels?.find(label=>label.id==='hub-sprint-label');
    const sprintColor=/^#[0-9a-f]{6}$/i.test(sprintLabel?.color||'')?sprintLabel.color:'#579bd0';
    return `<div class="pb2-task-preview ${task.completed?'pb2-task-done':''} ${sprint?'pb2-sprint-task':''}" style="${sprint?`--pb2-sprint-color:${sprintColor}`:''}" data-pb2-task="${safe(task.id)}" data-pb2-board="${safe(board.id)}" draggable="false" role="button" tabindex="0" aria-label="Taak ${safe(task.title)} openen">${sprint?`<span class="pb2-sprint-label" style="background:${sprintColor}">Sprintdoel</span>`:''}
      <div class="pb2-task-top"><strong class="pb2-task-title">${safe(task.title)}</strong></div>
      ${items.length?`<button type="button" class="pb2-task-check-toggle" data-pb2-check-toggle="${safe(task.id)}" aria-expanded="${expanded}">${done}/${items.length} checklist <span class="pb2-task-chevron ${expanded?'expanded':''}" aria-hidden="true">⌄</span></button>
        ${expanded?`<div class="pb2-task-checks">${items.map(item=>`<label class="pb2-task-check ${item.done?'done':''}"><input type="checkbox" data-pb2-check="${safe(item.id)}" data-pb2-check-card="${safe(task.id)}" ${item.done?'checked':''} ${editable?'':'disabled'}><span>${safe(item.text)}</span></label>`).join('')}</div>`:''}`:''}
    </div>`;
  }
  function render(){
    const user=currentUser();
    const chosen=getChosen(user);
    dashboard.innerHTML=chosen.length?chosen.map(({board,col,key})=>{
      const tasks=displayedColumnCards(board,col,user);
      const color=/^#[0-9a-f]{6}$/i.test(board.color||'')?board.color:'#579bd0';
      return `<section class="pb2-dashboard-column" draggable="true" data-pb2-column-key="${safe(key)}" style="--pb2-board-color:${color}" aria-label="${safe(board.title)}: ${safe(col.title)}. Versleep om de volgorde te wijzigen."><div class="pb2-dashboard-column-head"><span class="pb2-board-origin">${safe(board.title)}</span><span class="pb2-column-grip" title="Kolom verslepen" aria-hidden="true">⠿</span></div><strong>${safe(col.title)} (${tasks.length})</strong>${tasks.length?tasks.slice(0,7).map(c=>taskHtml(c,board,user)).join(''):'<span class="pb2-empty">Geen taken</span>'}${tasks.length>7?`<span class="pb2-empty">+ ${tasks.length-7} meer</span>`:''}</section>`;
    }).join(''):'<p class="pb2-empty">Geen kolommen geselecteerd. Gebruik het dashboard-icoon bij een kolom in Planbord 2.0 om deze op jouw dashboard te tonen.</p>';
  }
  function closeDashboardTaskModal(){
    if(!taskModalContainer)return;
    taskModalContainer.remove();
    taskModalContainer=null;
    taskModalFrame=null;
    document.body.classList.remove('pb2-widget-modal-active');
    modalPreviousFocus?.focus?.();
    modalPreviousFocus=null;
  }
  function openDashboardTaskModal(boardId,cardId){
    closeDashboardTaskModal();
    modalPreviousFocus=document.activeElement;
    const container=document.createElement('div');
    container.className='pb2-widget-modal-container';
    container.setAttribute('aria-label','Taakgegevens');
    const modalFrame=document.createElement('iframe');
    modalFrame.className='pb2-widget-modal-frame';
    modalFrame.title='Planbord 2.0 - taakgegevens';
    modalFrame.src='planbord2/index.html?widget-modal=1';
    modalFrame.dataset.boardId=boardId;
    modalFrame.dataset.cardId=cardId;
    container.appendChild(modalFrame);
    document.body.appendChild(container);
    document.body.classList.add('pb2-widget-modal-active');
    taskModalContainer=container;
    taskModalFrame=modalFrame;
  }
  function sendWidgetAction(action,boardId,cardId,itemId,done){
    frame.contentWindow?.postMessage({type:'spectrum-pb2-widget-action',action,boardId,cardId,itemId,done},'*');
  }
  dashboard.addEventListener('click',event=>{
    const task=event.target.closest('[data-pb2-task]');
    if(!task)return;
    const boardId=task.dataset.pb2Board;
    const cardId=task.dataset.pb2Task;
    if(event.target.closest('[data-pb2-check-toggle]')){
      const key=`${boardId}:${cardId}`;
      if(expandedTasks.has(key))expandedTasks.delete(key);else expandedTasks.add(key);
      render();return;
    }
    if(event.target.closest('.pb2-task-check'))return;
    openDashboardTaskModal(boardId,cardId);
  });
  dashboard.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    if(event.target.closest('[data-pb2-check-toggle],input'))return;
    const task=event.target.closest('[data-pb2-task]');
    if(!task||event.target!==task)return;
    event.preventDefault();
    openDashboardTaskModal(task.dataset.pb2Board,task.dataset.pb2Task);
  });
  dashboard.addEventListener('change',event=>{
    const input=event.target.closest('[data-pb2-check]');
    if(!input)return;
    const task=input.closest('[data-pb2-task]');
    if(!task)return;
    sendWidgetAction('check',task.dataset.pb2Board,task.dataset.pb2Task,input.dataset.pb2Check,Boolean(input.checked));
  });

  let draggedKey=null;
  function clearDragState(){
    draggedKey=null;
    dashboard.querySelectorAll('.pb2-column-dragging,.pb2-drop-before,.pb2-drop-after').forEach(el=>el.classList.remove('pb2-column-dragging','pb2-drop-before','pb2-drop-after'));
  }
  dashboard.addEventListener('dragstart',event=>{
    const card=event.target.closest('[data-pb2-column-key]');
    if(!card||event.target.closest('.pb2-task-preview')){event.preventDefault();return;}
    draggedKey=card.dataset.pb2ColumnKey;
    card.classList.add('pb2-column-dragging');
    if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',draggedKey)}
    event.stopPropagation();
  });
  dashboard.addEventListener('dragover',event=>{
    if(!draggedKey)return;
    event.preventDefault();event.stopPropagation();
    dashboard.querySelectorAll('.pb2-drop-before,.pb2-drop-after').forEach(el=>el.classList.remove('pb2-drop-before','pb2-drop-after'));
    const target=event.target.closest('[data-pb2-column-key]');
    if(!target||target.dataset.pb2ColumnKey===draggedKey)return;
    target.classList.add(event.clientX<target.getBoundingClientRect().left+target.getBoundingClientRect().width/2?'pb2-drop-before':'pb2-drop-after');
    if(event.dataTransfer)event.dataTransfer.dropEffect='move';
  });
  dashboard.addEventListener('drop',event=>{
    if(!draggedKey)return;
    event.preventDefault();event.stopPropagation();
    const user=currentUser();
    const chosen=getChosen(user);
    const keys=chosen.map(entry=>entry.key);
    const target=event.target.closest('[data-pb2-column-key]');
    const from=keys.indexOf(draggedKey);
    if(from<0){clearDragState();return}
    const [moving]=keys.splice(from,1);
    if(target&&target.dataset.pb2ColumnKey!==draggedKey){
      let to=keys.indexOf(target.dataset.pb2ColumnKey);
      const after=event.clientX>=target.getBoundingClientRect().left+target.getBoundingClientRect().width/2;
      if(to<0)to=keys.length;
      keys.splice(to+(after?1:0),0,moving);
    }else if(!target){keys.push(moving)}else{keys.splice(from,0,moving)}
    // Preserve the order of temporarily hidden columns when preferences change.
    const previous=loadOrders()[user]||[];
    const ordered=new Set(keys);
    saveOrder(user,[...keys,...previous.filter(key=>!ordered.has(key))]);
    clearDragState();render();
  });
  dashboard.addEventListener('dragend',clearDragState);
  dashboard.addEventListener('dragleave',event=>{
    if(!dashboard.contains(event.relatedTarget))dashboard.querySelectorAll('.pb2-drop-before,.pb2-drop-after').forEach(el=>el.classList.remove('pb2-drop-before','pb2-drop-after'));
  });
  // Sprintdoelen live in HUB, not in the old Planbord 1.0 task records.
  // Transfer stable goal-line IDs to the embedded Planbord 2.0 to avoid duplicates.
  function syncSprintGoals(target=frame.contentWindow){
    if(!target)return;
    let hub=null;
    try{hub=JSON.parse(localStorage.getItem('spectrumHubLiveDemoV24')||'null')}catch{}
    if(!hub)return;
    const directory=typeof window.spectrumHubPlanbordDirectory==='function'
      ?window.spectrumHubPlanbordDirectory():[];
    const clientAccounts=(hub.accounts||[]).filter(a=>a.kind==='client');
    const goals=[];
    for(const goal of hub.goals||[]){
      if(goal.type!=='sprint')continue;
      const client=clientAccounts.find(a=>a.name===goal.client);
      const entry=client||directory.find(a=>a.kind==='client'&&(a.name===goal.client||a.name.startsWith(goal.client+' ')));
      if(!entry)continue;
      const items=(Array.isArray(goal.sprintItems)?goal.sprintItems:[])
        .filter(item=>item?.id&&String(item.text||'').trim())
        .slice(0,5)
        .map(item=>({id:String(item.id),text:String(item.text).trim(),done:Boolean(item.done)}));
      goals.push({goalId:String(goal.id),clientId:String(entry.id),clientName:String(entry.name),
        title:String(goal.title||'').trim(),items});
    }
    target.postMessage({type:'spectrum-pb2-sprint-goals',goals},'*');
  }
  function sync(target=frame.contentWindow){
    const body=document.body;
    const hub=(()=>{try{return JSON.parse(localStorage.getItem('spectrumHubLiveDemoV24')||'null')}catch{return null}})();
    const profile=document.querySelector('.profile-copy strong');
    const account=(hub?.accounts||[]).find(a=>a.id===hub?.role);
    const accountList=typeof window.spectrumHubPlanbordDirectory === 'function'
      ? window.spectrumHubPlanbordDirectory()
      : (hub?.accounts||[]).map(a=>({id:a.id,name:a.name,kind:a.kind}));
    target?.postMessage({type:'spectrum-pb2-theme',dark:body.classList.contains('dark-mode')},'*');
    target?.postMessage({type:'spectrum-pb2-user',id:account?.id||hub?.role||'staff-mm',name:account?.name||profile?.textContent||'Gebruiker',kind:account?.kind||'staff',accounts:accountList},'*');
    syncSprintGoals(target);
  }
  window.addEventListener('message',event=>{
    if(taskModalFrame&&event.source===taskModalFrame.contentWindow){
      if(event.data?.type==='spectrum-pb2-ready'){
        sync(taskModalFrame.contentWindow);
        taskModalFrame.contentWindow.postMessage({type:'spectrum-pb2-widget-action',action:'open',boardId:taskModalFrame.dataset.boardId,cardId:taskModalFrame.dataset.cardId},'*');
      }else if(event.data?.type==='spectrum-pb2-modal-closed'){
        closeDashboardTaskModal();
      }else if(event.data?.type==='spectrum-pb2-update'){
        const data=event.data.data;
        if(data&&Array.isArray(data.boards)){
          snapshot=data;
          try{localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot))}catch{}
          render();
          frame.contentWindow?.postMessage({type:'spectrum-pb2-refresh-storage'},'*');
        }
      }else if(event.data?.type==='spectrum-pb2-sprint-check'){
        const {goalId,itemId,done}=event.data;
        if(typeof goalId==='string'&&typeof itemId==='string'&&typeof done==='boolean')window.spectrumHubSetSprintChecklistItem?.(goalId,itemId,done);
      }
      return;
    }
    if(event.source!==frame.contentWindow)return;
    if(event.data?.type==='spectrum-pb2-ready'){sync();return;}
    if(event.data?.type==='spectrum-pb2-sprint-check'){
      const {goalId,itemId,done}=event.data;
      if(typeof goalId==='string'&&typeof itemId==='string'&&typeof done==='boolean'){
        window.spectrumHubSetSprintChecklistItem?.(goalId,itemId,done);
      }
      return;
    }
    if(event.data?.type!=='spectrum-pb2-update')return;
    const data=event.data.data;
    if(!data||!Array.isArray(data.boards))return;
    snapshot=data;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot))}catch{}
    render();
  });
  window.addEventListener('spectrum-hub-state-saved',syncSprintGoals);
  frame.addEventListener('load',sync);
  new MutationObserver(()=>{if(!taskModalFrame)sync();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  const profile=document.querySelector('.profile-copy strong');
  if(profile)new MutationObserver(()=>{sync();render();}).observe(profile,{childList:true,characterData:true,subtree:true});
  window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY){try{snapshot=JSON.parse(event.newValue||'null')}catch{snapshot=null}render()}else if(event.key===ORDER_KEY)render()});
  render();
})();
