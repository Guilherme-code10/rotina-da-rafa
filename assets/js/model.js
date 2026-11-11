/** Pure business rules: local dates, program coverage and task transitions. */
export const STATUSES = {todo: 'A fazer', doing: 'Em produção', approval: 'Aprovação', scheduled: 'Programado', done: 'Concluído'};
export function today(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(+date) && date.toISOString().slice(0,10) === value;
}
export function coverage(date, reference = today()) {
  if (!date) return {label: 'Sem data', tone: 'neutral', rank: 3};
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${reference}T12:00:00Z`)) / 86400000);
  return days < 0 ? {label: 'Revisar', tone: 'rose', rank: 0} : days <= 5 ? {label: 'Renovar', tone: 'amber', rank: 1} : {label: 'Em dia', tone: 'sage', rank: 2};
}
export function transition(task, status, now = new Date()) {
  if (!Object.hasOwn(STATUSES,status)) throw new Error('Status inválido.');
  return {...task, status, completedAt: status === 'done' ? (task.completedAt || now.toISOString()) : null};
}
export function validateData(data) {
  const fail = () => {throw new Error('Arquivo inválido. Use um backup exportado por este aplicativo.');};
  if (!data || data.version !== 1 || !Array.isArray(data.clients) || !Array.isArray(data.tasks) || data.clients.length > 5000 || data.tasks.length > 50000) fail();
  const text = (v, max) => typeof v === 'string' && v.length <= max;
  const ids = new Set();
  for (const c of data.clients) {
    if (!c || !text(c.id,100) || !c.id || ids.has(c.id) || !text(c.name,100) || !c.name.trim() || !text(c.notes,2000) || typeof c.videoPending !== 'boolean' || !(c.until === '' || validDate(c.until))) fail();
    ids.add(c.id);
  }
  const taskIds = new Set();
  for (const t of data.tasks) {
    if (!t || !text(t.id,100) || !t.id || taskIds.has(t.id) || !text(t.title,200) || !t.title.trim() || !text(t.notes,2000) || !(t.clientId === '' || ids.has(t.clientId)) || !Object.hasOwn(STATUSES,t.status) || typeof t.priority !== 'boolean' || !(t.due === '' || validDate(t.due))) fail();
    if (t.status === 'done' ? typeof t.completedAt !== 'string' || !Number.isFinite(Date.parse(t.completedAt)) : t.completedAt !== null) fail();
    taskIds.add(t.id);
  }
  return data;
}
export function createSeed() {
  const rows = [
    ['Tia Lu','2026-11-23',true,''],['Tays','2026-11-15',false,''],['Glória','2026-11-30',false,'Organizar dezembro. Conferir vídeos.'],['Coworking','2026-12-02',true,''],['Nutri','2026-10-15',false,'Urgente na nota original.'],['BR Comunicações','2026-10-11',false,'Urgente na nota original.'],['Cílios','2026-10-14',false,'Urgente na nota original.'],['Pertencer','2026-11-21',false,'2 publicações por semana.'],['Achadinhos','2026-10-19',false,'Urgente na nota original.'],['Mosaico','2026-11-07',false,'Urgente na nota original.'],['Prime Bank','2026-10-30',false,''],['Luciana RH','2026-11-29',true,''],['Jiu-jítsu','2026-11-14',false,''],['Raiane','2026-12-07',true,''],['Lamuse','2026-11-08',false,''],['Educando','',false,'']
  ];
  const clients = rows.map(([name,until,videoPending,notes],i) => ({id:`c${i}`,name,until,videoPending,notes}));
  const items = [['Mandar mensagem para lojas',''],['Definir demanda de BR Comunicações','BR Comunicações'],['Criar post','Cílios'],['Criar post','Mosaico'],['Criar post','Nutri'],['Criar post','Lamuse'],['Criar stories','Jiu-jítsu'],['Editar vídeos','Prime Bank'],['Editar vídeos','Raiane'],['Criar posts','Educando'],['Criar stories','Lamuse'],['Produzir vídeos','Tia Lu'],['Produzir vídeo pet',''],['Preparar proposta bronze',''],['Criar roteiro Max','']];
  return {version:1, clients, tasks:items.map(([title,name],i)=>({id:`t${i}`,title,clientId:clients.find(c=>c.name===name)?.id||'',due:'',status:'todo',priority:false,notes:'Importada da nota de 11/11/2026. Definir prazo.',completedAt:null}))};
}
