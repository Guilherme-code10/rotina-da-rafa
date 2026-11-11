import {STATUSES, today, coverage, transition, validateData} from './model.js';
import {load, save, KEY} from './storage.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {today:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z',clients:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8m7 .13a4 4 0 0 1 0 7.75',production:'M8 3h8l4 4v14H4V3h4m1 7 6 4-6 4v-8Z',history:'m5 12 4 4L19 6M21 12a9 9 0 1 1-7-8.8',plus:'M12 5v14M5 12h14',edit:'m15 5 4 4M4 20l5-1L20 8a2 2 0 0 0-4-4L5 15l-1 5Z',check:'m5 12 4 4L19 6',arrow:'M5 12h14m-6-6 6 6-6 6',clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.today}"/></svg>`;
const routes = {hoje:['Meu dia','today'],clientes:['Clientes','clients'],producao:['Produção','production'],historico:['Histórico','history']};
let data, fatal = false, filter = 'all', search = '', clientFilter = '', timer;
try { data = load(); save(data); } catch (error) {
  fatal = true;
  $('#main').innerHTML = '<h1>Seus dados precisam de atenção</h1><p>Não foi possível ler ou salvar os registros. Nada foi substituído. Verifique se o navegador permite armazenamento local e se há espaço disponível.</p><p>Se você já tinha registros, preserve os dados do site antes de limpar o navegador.</p>';
}
const route = () => Object.hasOwn(routes,location.hash.slice(1)) ? location.hash.slice(1) : 'hoje';
const clientName = id => data.clients.find(c=>c.id===id)?.name || 'Geral';
const dateLabel = date => date ? new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(`${date}T12:00:00`)) : 'Sem prazo';
function notify(message) { clearTimeout(timer); $('#toast').textContent=message; $('#toast').hidden=false; timer=setTimeout(()=>$('#toast').hidden=true,4000); }
function commit(next) {
  try { save(next); data=next; render(); return true; }
  catch { notify('Não foi possível salvar. Exporte um backup e verifique o espaço do navegador.'); return false; }
}
function badge(text,tone='neutral') { return `<span class="badge ${tone}">${escape(text)}</span>`; }
function heading(title,subtitle,action='task') { return `<header class="page-heading"><div><h1>${title}</h1><p class="muted">${subtitle}</p></div><button class="primary" data-action="new-${action}" aria-label="${action==='client'?'Novo cliente':'Nova tarefa'}">${icon('plus')}${action==='client'?'Novo cliente':'Nova tarefa'}</button></header>`; }
function empty(text) { return `<p class="empty">${text}</p>`; }
function taskCard(t, production=false) {
  const done=t.status==='done', late=t.due && t.due<today() && !done;
  return `<li><article class="task-card"><button type="button" class="check-button ${done?'completed':''}" data-action="toggle" data-id="${escape(t.id)}" aria-label="${done?'Reabrir':'Concluir'}: ${escape(t.title)}">${done?icon('check'):''}</button><div class="task-content"><h3>${escape(clientName(t.clientId))}</h3><p>${escape(t.title)}</p><div class="task-meta">${t.priority&&!done?badge('Prioridade','rose'):''}${done?`<small>${escape(new Date(t.completedAt).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))}</small>`:badge(t.due===today()?'Hoje':dateLabel(t.due),late?'rose':'neutral')}${!done&&!production&&t.status!=='todo'?badge(STATUSES[t.status],'sage'):''}</div>${production?`<label class="sr-only" for="status-${escape(t.id)}">Etapa de ${escape(t.title)}</label><select class="status-select" id="status-${escape(t.id)}" data-status="${escape(t.id)}">${Object.entries(STATUSES).map(([v,n])=>`<option value="${v}" ${v===t.status?'selected':''}>${n}</option>`).join('')}</select>`:''}</div><button type="button" class="icon-button" data-action="edit-task" data-id="${escape(t.id)}" aria-label="Editar ${escape(t.title)}">${icon('edit')}</button></article></li>`;
}
function tasksList(tasks,production=false) { return tasks.length?`<ul class="task-list">${tasks.map(t=>taskCard(t,production)).join('')}</ul>`:empty('Tudo tranquilo por aqui. ♡'); }
function dashboard() {
  const day=today(), active=data.tasks.filter(t=>t.status!=='done');
  const overdue=active.filter(t=>t.due && t.due<day), current=active.filter(t=>t.due===day), noDate=active.filter(t=>!t.due);
  const finished=data.tasks.filter(t=>t.status==='done'&&today(new Date(t.completedAt))===day);
  const attention=data.clients.filter(c=>coverage(c.until).rank<2).sort((a,b)=>a.until.localeCompare(b.until));
  let visible= filter==='all'?active:filter==='today'?current:filter==='late'?overdue:noDate;
  visible=[...visible].sort((a,b)=>Number(b.priority)-Number(a.priority)||(a.due||'9999').localeCompare(b.due||'9999'));
  const progressTotal=current.length+finished.length;
  return heading('Meu dia',escape(new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})))+
    `<section class="hero" aria-label="Boas-vindas"><div><span class="eyebrow">BEM-VINDA AO SEU CANTINHO</span><h2>Oi, Rafa ♡</h2><p>Vamos deixar espaço para o que importa?</p></div><span class="heart" aria-hidden="true">♡</span></section><section class="stats" aria-label="Resumo do dia"><article class="stat"><span class="stat-icon">${icon('today')}</span><div><strong>${current.length}</strong><small>para hoje</small></div></article><article class="stat"><span class="stat-icon">${icon('clock')}</span><div><strong>${overdue.length}</strong><small>em atraso</small></div></article><article class="stat"><span class="stat-icon">${icon('check')}</span><div><strong>${finished.length}</strong><small>concluídas hoje</small></div></article></section><div class="two-columns"><section aria-labelledby="tasks-title"><div class="section-heading"><h2 id="tasks-title">Suas tarefas</h2><small>${active.length} pendentes</small></div><div class="chips" aria-label="Filtrar tarefas">${[['all','Todas'],['today','Hoje'],['late','Atrasadas'],['undated','Sem prazo']].map(([v,n])=>`<button class="chip" data-filter="${v}" aria-pressed="${filter===v}">${n}</button>`).join('')}</div>${noDate.length?'<p class="notice">As tarefas importadas estão sem prazo. Abra o lápis para organizar os próximos dias.</p>':''}${tasksList(visible)}</section><aside class="side-panel" aria-labelledby="attention-title"><div class="section-heading"><h2 id="attention-title">No radar</h2>${icon('clients')}</div><p class="muted">Perfis que precisam de uma nova programação.</p>${attention.slice(0,5).map(c=>`<div class="client-mini"><span class="initials">${escape(c.name.slice(0,2))}</span><div><strong>${escape(c.name)}</strong><small>Até ${dateLabel(c.until)}</small></div>${badge(coverage(c.until).label,coverage(c.until).tone)}</div>`).join('')||'<p>Nenhum perfil com programação vencendo.</p>'}<a class="text-button" href="#clientes">Ver todos os clientes →</a><hr><h3>Um passo de cada vez</h3><p class="muted">${finished.length} tarefas concluídas hoje.</p><progress class="progress" max="${progressTotal||1}" value="${finished.length}" aria-label="Tarefas concluídas hoje"></progress></aside></div>`;
}
function clientsPage() {
  const clients=data.clients.filter(c=>c.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).filter(c=>filter!=='attention'||coverage(c.until).rank!==2||c.videoPending).sort((a,b)=>coverage(a.until).rank-coverage(b.until).rank||a.name.localeCompare(b.name,'pt-BR'));
  return heading('Clientes','Cada perfil no seu ritmo. Tudo sob controle.','client')+`<div class="toolbar"><label class="sr-only" for="search">Buscar cliente</label><input class="search" id="search" type="search" placeholder="Buscar cliente..." value="${escape(search)}"></div><div class="chips"><button class="chip" data-filter="all" aria-pressed="${filter!=='attention'}">Todos · ${data.clients.length}</button><button class="chip" data-filter="attention" aria-pressed="${filter==='attention'}">Precisam de atenção</button></div><ul class="client-list">${clients.map(c=>{const state=coverage(c.until);return `<li><article class="client-card"><header><span class="initials">${escape(c.name.slice(0,2))}</span><h2>${escape(c.name)}</h2><button class="icon-button" data-action="edit-client" data-id="${escape(c.id)}" aria-label="Editar ${escape(c.name)}">${icon('edit')}</button></header><p class="muted">Programação de conteúdo</p><p><strong>${c.until?'Programado até '+dateLabel(c.until):'Data ainda não definida'}</strong></p>${c.notes?`<p class="notes">${escape(c.notes)}</p>`:''}<footer>${badge(state.label,state.tone)}${c.videoPending?badge('Vídeos pendentes','amber'):''}${badge(data.tasks.filter(t=>t.clientId===c.id&&t.status!=='done').length+' tarefas')}</footer></article></li>`}).join('')}</ul>${!clients.length?empty('Nenhum cliente encontrado.'):''}`;
}
function clientSelect(id='client-filter') { return `<label class="sr-only" for="${id}">Filtrar por cliente</label><select id="${id}"><option value="">Todos os clientes</option>${data.clients.map(c=>`<option value="${escape(c.id)}" ${clientFilter===c.id?'selected':''}>${escape(c.name)}</option>`).join('')}</select>`; }
function productionPage() {
  const tasks=data.tasks.filter(t=>!clientFilter||t.clientId===clientFilter);
  return heading('Produção','Da primeira ideia à publicação.')+`<div class="toolbar">${clientSelect()}</div><div class="board">${Object.entries(STATUSES).filter(([v])=>v!=='done').map(([v,n])=>`<section class="board-section" aria-labelledby="section-${v}"><h2 id="section-${v}">${n}<span>${tasks.filter(t=>t.status===v).length}</span></h2>${tasksList(tasks.filter(t=>t.status===v),true)}</section>`).join('')}</div>`;
}
function historyPage() {
  const tasks=data.tasks.filter(t=>t.status==='done'&&(!clientFilter||t.clientId===clientFilter)).sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt));
  const groups=new Map();
  for(const t of tasks) {const key=today(new Date(t.completedAt));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);}
  return heading('Histórico','Cada entrega fica registrada. Você está avançando.')+`<div class="toolbar">${clientSelect()}</div><section class="hero"><div><span class="eyebrow">SEU TRABALHO TEM VALOR</span><h2>${tasks.length} ${tasks.length===1?'tarefa concluída':'tarefas concluídas'}</h2><p>Precisou retomar? Toque no check para reabrir.</p></div><span class="heart" aria-hidden="true">✓</span></section>${[...groups].map(([date,items])=>`<section class="history-group"><h2>${date===today()?'Hoje':dateLabel(date)+'/'+date.slice(0,4)}</h2>${tasksList(items)}</section>`).join('')||empty('Suas próximas conquistas vão aparecer aqui. Conclua uma tarefa para começar.')}`;
}
function render() {
  if(fatal)return;
  const r=route();document.title=`${routes[r][0]} · Rotina da Rafa`;
  $('#navigation').innerHTML=Object.entries(routes).map(([key,[label,i]])=>`<a class="nav-link" href="#${key}" ${r===key?'aria-current="page"':''}>${icon(i)}<span>${label}</span></a>`).join('');
  $('#main').innerHTML=({hoje:dashboard,clientes:clientsPage,producao:productionPage,historico:historyPage})[r]();
}
let editing=null;
function openEditor(type,id) {
  const item=(type==='client'?data.clients:data.tasks).find(item=>item.id===id);
  editing={type,id};$('#dialog-title').textContent=`${id?'Editar':'Nova'} ${type==='client'?'cliente':'tarefa'}`;
  if(type==='client'&&!id)$('#dialog-title').textContent='Novo cliente';
  $('#form-error').textContent='';
  $('#form-fields').innerHTML=type==='client'?`<label for="name">Nome do cliente</label><input id="name" name="name" required maxlength="100" value="${escape(item?.name||'')}"><label for="until">Conteúdo programado até</label><input id="until" name="until" type="date" value="${escape(item?.until||'')}"><label class="checkbox-label"><input name="videoPending" type="checkbox" ${item?.videoPending?'checked':''}>Há vídeos pendentes</label><label for="notes">Observações</label><textarea id="notes" name="notes" maxlength="2000">${escape(item?.notes||'')}</textarea>`:
    `<label for="title">O que precisa ser feito?</label><input id="title" name="title" required maxlength="200" placeholder="Ex.: editar vídeo para reels" value="${escape(item?.title||'')}"><label for="clientId">Cliente</label><select id="clientId" name="clientId"><option value="">Geral / sem cliente</option>${data.clients.map(c=>`<option value="${escape(c.id)}" ${item?.clientId===c.id?'selected':''}>${escape(c.name)}</option>`).join('')}</select><div class="form-row"><div><label for="due">Prazo</label><input id="due" name="due" type="date" value="${escape(item?.due||'')}"></div><div><label for="status">Etapa</label><select id="status" name="status">${Object.entries(STATUSES).map(([v,n])=>`<option value="${v}" ${(item?.status||'todo')===v?'selected':''}>${n}</option>`).join('')}</select></div></div><label class="checkbox-label"><input name="priority" type="checkbox" ${item?.priority?'checked':''}>Marcar como prioridade</label><label for="notes">Observações</label><textarea id="notes" name="notes" maxlength="2000">${escape(item?.notes||'')}</textarea>${id?'<button class="text-button danger" type="button" id="delete-task">Excluir tarefa</button>':''}`;
  $('#editor').showModal();
}
$('#editor-form').addEventListener('submit',event=>{
  event.preventDefault();const values=new FormData(event.currentTarget),{type,id}=editing;
  const name=String(values.get(type==='client'?'name':'title')).trim();
  if(!name){$('#form-error').textContent='Preencha um nome válido.';return;}
  const next=structuredClone(data),key=type==='client'?'clients':'tasks';
  const base=next[key].find(i=>i.id===id)||{id:crypto.randomUUID()};
  const updated=type==='client'?{...base,name,until:values.get('until'),videoPending:values.has('videoPending'),notes:values.get('notes').trim()}:
    transition({...base,title:name,clientId:values.get('clientId'),due:values.get('due'),priority:values.has('priority'),notes:values.get('notes').trim()},values.get('status'));
  const i=next[key].findIndex(i=>i.id===id);if(i<0)next[key].push(updated);else next[key][i]=updated;
  if(commit(next)){$('#editor').close();notify('Salvo com carinho. ♡');}
});
document.addEventListener('click',event=>{
  const close=event.target.closest('[data-close]');if(close){close.closest('dialog').close();return;}
  if(event.target.closest('.backup-trigger')){$('#backup-dialog').showModal();return;}
  if(event.target.closest('#delete-task')){if(confirm('Excluir esta tarefa permanentemente? Para manter o histórico, prefira concluir.')){const next={...data,tasks:data.tasks.filter(t=>t.id!==editing.id)};if(commit(next)){$('#editor').close();notify('Tarefa excluída.');}}return;}
  const f=event.target.closest('[data-filter]');if(f){filter=f.dataset.filter;render();document.querySelector(`[data-filter="${filter}"]`)?.focus();return;}
  const button=event.target.closest('[data-action]');if(!button||fatal)return;
  const action=button.dataset.action,id=button.dataset.id;
  if(action==='new-task'||action==='edit-task')openEditor('task',id);
  if(action==='new-client'||action==='edit-client')openEditor('client',id);
  if(action==='toggle'){
    const task=data.tasks.find(t=>t.id===id);if(!task)return;
    const next={...data,tasks:data.tasks.map(t=>t.id===id?transition(t,t.status==='done'?'todo':'done'):t)};
    if(commit(next)){notify(task.status==='done'?'Tarefa reaberta.':'Tarefa concluída! Ela está no histórico.');$('#main').focus({preventScroll:true});}
  }
});
$('#main').addEventListener('input',event=>{
  if(event.target.id==='search'){const position=event.target.selectionStart;search=event.target.value;render();$('#search').focus();try{$('#search').setSelectionRange(position,position);}catch{ /* Search inputs vary between browsers. */ }}
});
$('#main').addEventListener('change',event=>{
  if(event.target.id==='client-filter'){clientFilter=event.target.value;render();$('#client-filter').focus();}
  if(event.target.dataset.status){const id=event.target.dataset.status;const next={...data,tasks:data.tasks.map(t=>t.id===id?transition(t,event.target.value):t)};if(commit(next)){notify('Etapa atualizada.');$('#main').focus({preventScroll:true});}}
});
$('#export').addEventListener('click',()=>{
  if(fatal)return;
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`rotina-da-rafa-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Backup preparado. Guarde o arquivo em Arquivos.');
});
$('#import').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try {
    if(file.size>10*1024*1024)throw new Error('O arquivo deve ter até 10 MB.');
    const imported=validateData(JSON.parse(await file.text()));
    if(confirm(`Restaurar ${imported.clients.length} clientes e ${imported.tasks.length} tarefas? Os registros atuais serão substituídos.`)){
      if(commit(imported)){$('#backup-error').textContent='';$('#backup-dialog').close();notify('Backup restaurado.');}
    }
  }catch(error){$('#backup-error').textContent=error instanceof SyntaxError?'Este arquivo não é um backup JSON válido.':error.message;}
  event.target.value='';
});
window.addEventListener('hashchange',()=>{filter='all';search='';clientFilter='';render();$('#main').focus();window.scrollTo(0,0);});
window.addEventListener('storage',event=>{if(event.key===KEY){try{data=load();render();notify('Dados atualizados por outra aba.');}catch{notify('Não foi possível ler a atualização de outra aba.');}}});
// Refresh date-sensitive badges when the app is brought back to the foreground.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('#editor').open)render();});
render();
