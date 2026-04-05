const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const COST_CATEGORIES=["Ad Spend","Subscriptions","COGS","Shipping","Software","Other"];
const CAT_COLORS={"Ad Spend":"#fbbf24","Subscriptions":"#a78bfa","COGS":"#f87171","Shipping":"#60a5fa","Software":"#22d3ee","Other":"#6b7280"};
const CAT_GRADIENTS={"Ad Spend":"linear-gradient(90deg,#fbbf24,#f59e0b)","Subscriptions":"linear-gradient(90deg,#a78bfa,#8b5cf6)","COGS":"linear-gradient(90deg,#f87171,#ef4444)","Shipping":"linear-gradient(90deg,#60a5fa,#3b82f6)","Software":"linear-gradient(90deg,#22d3ee,#06b6d4)","Other":"linear-gradient(90deg,#6b7280,#4b5563)"};
const DEFAULT_STORES=[];
const PERIOD_OPTIONS=[
  {key:'all',label:'All Time'},
  {key:'today',label:'Today'},
  {key:'yesterday',label:'Yesterday'},
  {key:'this_week',label:'This Week'},
  {key:'month',label:'Month'},
  {key:'custom',label:'Custom'}
];
const CURRENCIES=[
  {code:'USD',symbol:'$',name:'US Dollar',locale:'en-US'},
  {code:'EUR',symbol:'€',name:'Euro',locale:'nl-NL'},
  {code:'GBP',symbol:'£',name:'British Pound',locale:'en-GB'},
  {code:'CAD',symbol:'CA$',name:'Canadian Dollar',locale:'en-CA'}
];
let S={month:new Date().getMonth(),year:new Date().getFullYear(),view:'dashboard',period:'all',customFrom:'',customTo:'',revenues:{},costs:{},stores:[],currency:'USD',showRevForm:false,showCostForm:false,editRevId:null,editCostId:null};

function pad(n){return String(n).padStart(2,'0');}
function dateToISO(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function parseISO(iso){const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d);}
function monthKeyFromISO(iso){return iso.slice(0,7);}
function dayFromISO(iso){return parseInt(iso.slice(8,10),10);}
function daysInMonth(year,mi){return new Date(year,mi+1,0).getDate();}
function todayISO(){return dateToISO(new Date());}
function startOfWeek(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());const day=x.getDay();const diff=day===0?-6:1-day;x.setDate(x.getDate()+diff);return x;}
function addDaysISO(iso,days){const d=parseISO(iso);d.setDate(d.getDate()+days);return dateToISO(d);}
function monthStartISO(y,mi){return `${y}-${pad(mi+1)}-01`;}
function monthEndISO(y,mi){return `${y}-${pad(mi+1)}-${pad(daysInMonth(y,mi))}`;}
function monthLabelFromKey(key){const [y,m]=key.split('-').map(Number);return `${MONTHS[m-1]} ${y}`;}
function daysBetween(a,b){return Math.max(1,Math.round((parseISO(b)-parseISO(a))/(864e5))+1);}

function load(){
  try{
    const r=localStorage.getItem('ecom-revenues'),c=localStorage.getItem('ecom-costs'),s=localStorage.getItem('ecom-stores'),cur=localStorage.getItem('ecom-currency');
    if(r)S.revenues=JSON.parse(r);if(c)S.costs=JSON.parse(c);
    S.stores=s?JSON.parse(s):[...DEFAULT_STORES];
    if(cur&&CURRENCIES.some(x=>x.code===cur))S.currency=cur;
  }catch(e){S.stores=[...DEFAULT_STORES];}
  S.customFrom=todayISO();S.customTo=todayISO();
}
function saveR(){localStorage.setItem('ecom-revenues',JSON.stringify(S.revenues));}
function saveC(){localStorage.setItem('ecom-costs',JSON.stringify(S.costs));}
function saveS(){localStorage.setItem('ecom-stores',JSON.stringify(S.stores));}
function saveCur(){localStorage.setItem('ecom-currency',S.currency);}
function getCur(){return CURRENCIES.find(c=>c.code===S.currency)||CURRENCIES[0];}
function mk(){return `${S.year}-${pad(S.month+1)}`;}
function fmt(n){const c=getCur();return new Intl.NumberFormat(c.locale,{style:'currency',currency:c.code,minimumFractionDigits:0,maximumFractionDigits:0}).format(n);}
function fmtF(n){const c=getCur();return new Intl.NumberFormat(c.locale,{style:'currency',currency:c.code,minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
function curSymbol(){return getCur().symbol;}
function uid(){return Date.now()+Math.random().toString(36).slice(2,6);}
function gs(){return document.getElementById('storeFilter').value;}
function sColor(n){const s=S.stores.find(x=>x.name===n);return s?s.color:'#6b7280';}
function sAbbr(n){const w=n.trim().split(/\s+/);return w.length===1?w[0].substring(0,2).toUpperCase():(w[0][0]+w[1][0]).toUpperCase();}
function badge(n){return `<span class="store-badge" style="background:${sColor(n)}">${sAbbr(n)}</span>`;}
function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function friendlyDate(iso){return parseISO(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}
function shortWeekday(iso){return parseISO(iso).toLocaleDateString('en-GB',{weekday:'short'});}
function shortMonth(iso){return parseISO(iso).toLocaleDateString('en-GB',{month:'short'});}

function toast(m,err){const t=document.getElementById('toast');t.textContent=m;t.className='toast'+(err?' error':'');t.classList.remove('hidden');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.add('hidden'),2500);}
function buildFilter(){const sel=document.getElementById('storeFilter'),cv=sel.value;sel.innerHTML='<option value="all">All Stores</option>'+S.stores.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');if(S.stores.some(s=>s.name===cv))sel.value=cv;else sel.value='all';}
function storeOpts(sel=''){return S.stores.map(s=>`<option value="${esc(s.name)}"${s.name===sel?' selected':''}>${esc(s.name)}</option>`).join('');}

function renderPeriodTabs(){
  document.getElementById('periodTabs').innerHTML=PERIOD_OPTIONS.map(p=>`<button class="period-btn${S.period===p.key?' active':''}" onclick="setPeriod('${p.key}')"><span class="period-dot"></span>${p.label}</button>`).join('');
  document.getElementById('monthNav').classList.toggle('hidden',S.period!=='month');
  const slot=document.getElementById('customRangeSlot');
  if(S.period==='custom'){
    const f=S.customFrom||todayISO(),t=S.customTo||todayISO();
    const lo=f>t?t:f, hi=f>t?f:t;
    const days=daysBetween(lo,hi);
    slot.innerHTML=`<div class="custom-range-glass">
      <div class="custom-range-row">
        <div>
          <label class="custom-field-label" for="customFrom"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 0a1 1 0 0 1 1 1v1h6V1a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1V1a1 1 0 0 1 1-1zm10 6H2v8h12V6z"/></svg>From</label>
          <input type="date" class="form-input" id="customFrom" value="${f}" onchange="updateCustomRange()">
        </div>
        <div class="custom-range-divider">→</div>
        <div>
          <label class="custom-field-label" for="customTo"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 0a1 1 0 0 1 1 1v1h6V1a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1V1a1 1 0 0 1 1-1zm10 6H2v8h12V6z"/></svg>To</label>
          <input type="date" class="form-input" id="customTo" value="${t}" onchange="updateCustomRange()">
        </div>
      </div>
      <div class="custom-range-summary"><span>Showing</span><span class="days-count">${days} day${days!==1?'s':''}</span><span>of data</span></div>
    </div>`;
  }else{slot.innerHTML='';}
}

function getAllRevenues(){const rows=[];Object.entries(S.revenues).forEach(([key,items])=>{(items||[]).forEach(item=>{const date=item.date||`${key}-${pad(item.day||1)}`;rows.push({...item,date,day:dayFromISO(date),monthKey:key});});});return rows;}
function getAllCosts(){const rows=[];Object.entries(S.costs).forEach(([key,items])=>{(items||[]).forEach(item=>{const date=item.date||'';rows.push({...item,date,day:date?dayFromISO(date):null,monthKey:key,legacyUndated:!date});});});return rows;}
function getDataCoverage(){const dates=[...getAllRevenues().map(r=>r.date),...getAllCosts().filter(c=>c.date).map(c=>c.date)].sort();if(!dates.length){const t=todayISO();return{start:t,end:t};}return{start:dates[0],end:dates[dates.length-1]};}

function getRange(){
  const today=todayISO();
  if(S.period==='today')return{start:today,end:today,label:'Today',sub:friendlyDate(today)};
  if(S.period==='yesterday'){const y=addDaysISO(today,-1);return{start:y,end:y,label:'Yesterday',sub:friendlyDate(y)};}
  if(S.period==='this_week'){const s=dateToISO(startOfWeek(new Date()));return{start:s,end:today,label:'This Week',sub:`${friendlyDate(s)} → ${friendlyDate(today)}`};}
  if(S.period==='month')return{start:monthStartISO(S.year,S.month),end:monthEndISO(S.year,S.month),label:`${MONTHS[S.month]} ${S.year}`,sub:`${monthStartISO(S.year,S.month)} → ${monthEndISO(S.year,S.month)}`};
  if(S.period==='custom'){let s=S.customFrom||today,e=S.customTo||today;if(s>e){const t=s;s=e;e=t;}return{start:s,end:e,label:'Custom Range',sub:`${friendlyDate(s)} → ${friendlyDate(e)}`};}
  const cov=getDataCoverage();return{start:cov.start,end:cov.end,label:'All Time',sub:`${friendlyDate(cov.start)} → ${friendlyDate(cov.end)}`};
}
function getFilteredRevenues(){const{start,end}=getRange(),store=gs();return getAllRevenues().filter(r=>(store==='all'||r.store===store)&&r.date>=start&&r.date<=end).sort((a,b)=>a.date.localeCompare(b.date));}
function getFilteredCosts(){const{start,end}=getRange(),store=gs();return getAllCosts().filter(c=>{if(store!=='all'&&c.store!==store)return false;if(S.period==='all')return true;if(S.period==='month')return c.monthKey===mk();if(!c.date)return false;return c.date>=start&&c.date<=end;}).sort((a,b)=>{const da=a.date||`${a.monthKey}-00`,db=b.date||`${b.monthKey}-00`;return da.localeCompare(db);});}
function monthKeysBetween(s,e){const keys=[];let cur=parseISO(`${s.slice(0,7)}-01`);const end=parseISO(`${e.slice(0,7)}-01`);while(cur<=end){keys.push(`${cur.getFullYear()}-${pad(cur.getMonth()+1)}`);cur.setMonth(cur.getMonth()+1);cur.setDate(1);}return keys;}
function hiddenLegacyCostCount(){if(!['today','this_week','yesterday','custom'].includes(S.period))return 0;const store=gs();const{start,end}=getRange();const om=new Set(monthKeysBetween(start,end));return getAllCosts().filter(c=>(store==='all'||c.store===store)&&!c.date&&om.has(c.monthKey)).length;}
function getDefaultEntryDate(){if(S.period==='today')return todayISO();if(S.period==='month'){const t=todayISO();return monthKeyFromISO(t)===mk()?t:monthStartISO(S.year,S.month);}if(S.period==='yesterday')return addDaysISO(todayISO(),-1);if(S.period==='this_week')return todayISO();if(S.period==='custom')return S.customTo||todayISO();return todayISO();}
function findRevenueById(id){for(const[key,items]of Object.entries(S.revenues)){const i=(items||[]).findIndex(x=>x.id===id);if(i>=0){const e=items[i];return{key,index:i,entry:{...e,date:e.date||`${key}-${pad(e.day||1)}`}};}}return null;}
function findCostById(id){for(const[key,items]of Object.entries(S.costs)){const i=(items||[]).findIndex(x=>x.id===id);if(i>=0){const e=items[i];return{key,index:i,entry:{...e,date:e.date||''}};}}return null;}

function openSettings(){document.getElementById('settingsModal').classList.remove('hidden');renderStoreList();renderCurrencyGrid();}
function closeSettings(){document.getElementById('settingsModal').classList.add('hidden');buildFilter();render();}
function renderCurrencyGrid(){document.getElementById('currencyGrid').innerHTML=CURRENCIES.map(c=>`<div class="currency-opt${c.code===S.currency?' active':''}" onclick="switchCurrency('${c.code}')"><span class="currency-symbol">${c.symbol}</span><span>${c.name}</span></div>`).join('');}
function switchCurrency(code){S.currency=code;saveCur();renderCurrencyGrid();render();toast('Currency: '+code);}
function renderStoreList(){const el=document.getElementById('storeList');if(!S.stores.length){el.innerHTML='<p class="empty-text">No stores added yet</p>';return;}el.innerHTML=S.stores.map((s,i)=>`<div class="store-item"><span class="store-item-name"><span class="store-color-dot" style="background:${s.color}"></span>${esc(s.name)}</span><button class="store-remove-btn" onclick="removeStore(${i})" title="Remove">✕</button></div>`).join('');}
function addStore(){const el=document.getElementById('newStoreName'),col=document.getElementById('newStoreColor'),name=el.value.trim();if(!name)return;if(S.stores.some(s=>s.name.toLowerCase()===name.toLowerCase())){toast('Store already exists',true);return;}S.stores.push({name,color:col.value});saveS();el.value='';renderStoreList();buildFilter();render();toast(name+' added');}
function removeStore(i){const name=S.stores[i].name;if(!confirm(`Remove "${name}"?`))return;S.stores.splice(i,1);saveS();renderStoreList();buildFilter();render();toast(name+' removed');}

function exportData(){const data={_format:'ecom-tracker-v2',exportedAt:new Date().toISOString(),stores:S.stores,currency:S.currency,revenues:S.revenues,costs:S.costs};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`revenue-tracker-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);toast('Data exported');}
function importData(ev){const file=ev.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=function(e){try{const d=JSON.parse(e.target.result);if(!d.revenues&&!d.costs&&!d.stores){toast('Invalid file format',true);return;}const hasData=Object.keys(S.revenues).length>0||Object.keys(S.costs).length>0;let merge=false;if(hasData)merge=confirm('You have existing data.\n\nOK = Merge\nCancel = Replace');if(merge){if(d.revenues)Object.keys(d.revenues).forEach(k=>{if(!S.revenues[k])S.revenues[k]=[];const ids=new Set(S.revenues[k].map(r=>r.id));d.revenues[k].forEach(r=>{const n={...r};if(ids.has(n.id))n.id=uid();if(!n.date&&n.day)n.date=`${k}-${pad(n.day)}`;S.revenues[k].push(n);});});if(d.costs)Object.keys(d.costs).forEach(k=>{if(!S.costs[k])S.costs[k]=[];const ids=new Set(S.costs[k].map(c=>c.id));d.costs[k].forEach(c=>{const n={...c};if(ids.has(n.id))n.id=uid();S.costs[k].push(n);});});if(d.stores)d.stores.forEach(s=>{if(!S.stores.some(x=>x.name.toLowerCase()===s.name.toLowerCase()))S.stores.push(s);});}else{if(d.revenues)S.revenues=d.revenues;if(d.costs)S.costs=d.costs;if(d.stores)S.stores=d.stores;if(d.currency&&CURRENCIES.some(x=>x.code===d.currency))S.currency=d.currency;}saveR();saveC();saveS();saveCur();buildFilter();renderStoreList();render();toast('Data '+(merge?'merged':'imported'));}catch(err){console.error(err);toast('Failed to parse file',true);}};reader.readAsText(file);ev.target.value='';}

function changeMonth(dir){S.month+=dir;if(S.month>11){S.month=0;S.year++;}if(S.month<0){S.month=11;S.year--;}S.showRevForm=false;S.showCostForm=false;render();}
function setPeriod(p){S.period=p;S.showRevForm=false;S.showCostForm=false;if(p==='custom'){const cov=getDataCoverage();if(!S.customFrom)S.customFrom=cov.start;if(!S.customTo)S.customTo=cov.end;}render();}
function updateCustomRange(){S.customFrom=document.getElementById('customFrom').value||todayISO();S.customTo=document.getElementById('customTo').value||todayISO();render();}
function switchView(v,btn){S.view=v;S.showRevForm=false;S.showCostForm=false;document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');render();}
function resetData(){if(confirm('Delete ALL data? This cannot be undone.')){S.revenues={};S.costs={};localStorage.removeItem('ecom-revenues');localStorage.removeItem('ecom-costs');toast('All data cleared');render();}}

function openRevForm(id){S.showRevForm=true;S.editRevId=id||null;render();}
function closeRevForm(){S.showRevForm=false;S.editRevId=null;render();}
function saveRevenue(){const date=document.getElementById('rev-date').value,amount=parseFloat(document.getElementById('rev-amount').value),orders=parseInt(document.getElementById('rev-orders').value)||0,store=document.getElementById('rev-store').value;if(!date){toast('Pick a date',true);return;}if(!amount||amount<=0){toast('Enter a valid amount',true);return;}const tk=monthKeyFromISO(date);if(!S.revenues[tk])S.revenues[tk]=[];const next={id:S.editRevId||uid(),date,day:dayFromISO(date),amount,orders,store};if(S.editRevId){const f=findRevenueById(S.editRevId);if(f){S.revenues[f.key].splice(f.index,1);if(!S.revenues[f.key].length)delete S.revenues[f.key];}}S.revenues[tk].push(next);S.month=parseInt(tk.slice(5,7),10)-1;S.year=parseInt(tk.slice(0,4),10);saveR();S.showRevForm=false;S.editRevId=null;toast('Revenue saved');render();}
function deleteRevenue(id){const f=findRevenueById(id);if(!f)return;S.revenues[f.key].splice(f.index,1);if(!S.revenues[f.key].length)delete S.revenues[f.key];saveR();toast('Entry deleted');render();}

function openCostForm(id){S.showCostForm=true;S.editCostId=id||null;render();}
function closeCostForm(){S.showCostForm=false;S.editCostId=null;render();}
function saveCost(){const category=document.getElementById('cost-category').value,date=document.getElementById('cost-date').value,amount=parseFloat(document.getElementById('cost-amount').value),label=document.getElementById('cost-label').value,store=document.getElementById('cost-store').value;if(!date){toast('Pick a date',true);return;}if(!amount||amount<=0){toast('Enter a valid amount',true);return;}const tk=monthKeyFromISO(date);if(!S.costs[tk])S.costs[tk]=[];const next={id:S.editCostId||uid(),category,date,day:dayFromISO(date),amount,label,store};if(S.editCostId){const f=findCostById(S.editCostId);if(f){S.costs[f.key].splice(f.index,1);if(!S.costs[f.key].length)delete S.costs[f.key];}}S.costs[tk].push(next);S.month=parseInt(tk.slice(5,7),10)-1;S.year=parseInt(tk.slice(0,4),10);saveC();S.showCostForm=false;S.editCostId=null;toast('Cost saved');render();}
function deleteCost(id){const f=findCostById(id);if(!f)return;S.costs[f.key].splice(f.index,1);if(!S.costs[f.key].length)delete S.costs[f.key];saveC();toast('Entry deleted');render();}

function render(){
  const range=getRange();
  document.getElementById('monthLabel').textContent=`${MONTHS[S.month]} ${S.year}`;
  document.getElementById('rangeTitle').textContent=range.label;
  document.getElementById('rangeSub').textContent=range.sub;
  renderPeriodTabs();
  const hl=hiddenLegacyCostCount();const note=document.getElementById('rangeNote');
  if(hl){note.textContent=`${hl} older monthly cost entr${hl===1?'y has':'ies have'} no exact date - skipped in this filter until edited with a date.`;note.classList.remove('hidden');}
  else{note.classList.add('hidden');note.textContent='';}
  ['dashboard','revenue','costs'].forEach(v=>document.getElementById('view-'+v).classList.toggle('hidden',S.view!==v));
  if(S.view==='dashboard')renderDash();if(S.view==='revenue')renderRev();if(S.view==='costs')renderCosts();
}

function niceYAxis(minV, maxV, targetTicks) {
  if (minV === maxV) { const s = Math.abs(minV) || 100; return [minV - s, minV, minV + s]; }
  const range = maxV - minV;
  const roughStep = range / (targetTicks - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(roughStep) || 1)));
  const norm = roughStep / mag;
  const step = norm <= 1 ? mag : norm <= 2 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;
  const niceMin = Math.floor(minV / step) * step;
  const niceMax = Math.ceil(maxV / step) * step;
  const labels = [];
  for (let v = niceMin; v <= niceMax + step * 0.001; v += step) labels.push(Math.round(v * 100) / 100);
  return labels;
}

function buildChartData(revenues, costs) {
  const {start, end} = getRange();
  const diff = daysBetween(start, end);
  const revTotals = new Map();
  revenues.forEach(r => revTotals.set(r.date, (revTotals.get(r.date) || 0) + r.amount));
  const costTotals = new Map();
  costs.forEach(c => { if (c.date) costTotals.set(c.date, (costTotals.get(c.date) || 0) + c.amount); });
  const showMonthLabel = diff > 45;
  const pts = [];
  let cur = parseISO(start);
  const ec = parseISO(end);
  while (cur <= ec) {
    const iso = dateToISO(cur);
    const rev = revTotals.get(iso) || 0;
    const cost = costTotals.get(iso) || 0;
    const net = rev - cost;
    let label = '';
    if (showMonthLabel) {
      label = (cur.getDate() === 1 || iso === start) ? shortMonth(iso) : '';
    } else if (S.period === 'this_week') {
      label = shortWeekday(iso);
    } else if (S.period === 'today') {
      label = 'Today';
    } else if (S.period === 'yesterday') {
      label = 'Yday';
    } else {
      label = String(cur.getDate());
    }
    const netColor = net >= 0 ? '#34d399' : '#f87171';
    const sign = net >= 0 ? '+' : '';
    pts.push({
      key: iso, label,
      tooltip: `${friendlyDate(iso)} &nbsp;&middot;&nbsp; <span style="color:${netColor};font-weight:700">${sign}${fmtF(net)}</span>`,
      value: net, rev, cost
    });
    cur.setDate(cur.getDate() + 1);
  }
  return pts;
}

function renderChart(cd) {
  if (!cd.length || !cd.some(x => x.rev > 0 || x.cost > 0)) return '<p class="empty-text">No data recorded</p>';
  const vals = cd.map(x => x.value);
  const maxV = Math.max(...vals, 0);
  const minV = Math.min(...vals, 0);
  const ySteps = niceYAxis(minV, maxV, 5);
  const niceMin = ySteps[0];
  const niceMax = ySteps[ySteps.length - 1];
  const niceRange = niceMax - niceMin || 1;
  const zeroPct = (niceMax / niceRange) * 100;

  let yAxisHtml = '<div class="chart-y-axis">';
  ySteps.forEach(v => {
    const pct = ((niceMax - v) / niceRange) * 100;
    const col = v > 0 ? '#34d399' : v < 0 ? '#f87171' : '#4a4a58';
    yAxisHtml += `<span class="y-label" style="top:${pct}%;color:${col}">${fmt(v)}</span>`;
  });
  yAxisHtml += '</div>';

  let barsHtml = `<div class="chart-zero-line" style="top:${zeroPct}%"></div>`;
  cd.forEach(p => {
    const clamped = Math.max(niceMin, Math.min(niceMax, p.value));
    const isPos = clamped >= 0;
    const barTopPct = isPos ? ((niceMax - clamped) / niceRange) * 100 : zeroPct;
    const barHeightPct = (Math.abs(clamped) / niceRange) * 100;
    const displayH = (p.rev > 0 || p.cost > 0) ? Math.max(barHeightPct, 0.8) : 0;
    const cls = isPos ? 'bar-pos' : 'bar-neg';
    barsHtml += `<div class="bar-col">
      ${displayH > 0 ? `<div class="bar ${cls}" style="top:${barTopPct}%;height:${displayH}%"><div class="bar-tooltip">${p.tooltip}</div></div>` : ''}
      <span class="bar-label">${esc(p.label)}</span>
    </div>`;
  });

  return `<div class="chart-wrap">${yAxisHtml}<div class="chart-inner"><div class="chart-bars">${barsHtml}</div></div></div>`;
}

function renderDash(){
  const revs=getFilteredRevenues(),csts=getFilteredCosts();
  const tRev=revs.reduce((s,r)=>s+r.amount,0),tCost=csts.reduce((s,c)=>s+c.amount,0),tOrd=revs.reduce((s,r)=>s+(r.orders||0),0);
  const profit=tRev-tCost,margin=tRev>0?(profit/tRev)*100:0,aov=tOrd>0?tRev/tOrd:0;
  const cd=buildChartData(revs,csts);
  const costByCat={};COST_CATEGORIES.forEach(c=>costByCat[c]=0);csts.forEach(c=>costByCat[c.category]=(costByCat[c.category]||0)+c.amount);
  const ac=COST_CATEGORIES.filter(c=>costByCat[c]>0);
  let costH='';if(!ac.length)costH='<p class="empty-text">No costs recorded in this period</p>';
  else ac.forEach(cat=>{const pct=tCost>0?(costByCat[cat]/tCost)*100:0;costH+=`<div class="cost-row"><div class="cost-row-header"><span class="cost-cat-name"><span class="cost-dot" style="background:${CAT_COLORS[cat]}"></span>${cat}</span><span class="cost-cat-amount">${fmt(costByCat[cat])}<span class="cost-cat-pct">${pct.toFixed(0)}%</span></span></div><div class="progress-bg"><div class="progress-fill" style="width:${pct}%;background:${CAT_GRADIENTS[cat]}"></div></div></div>`;});
  const chartTitle=S.period==='all'?'Net Profit by Day':'Daily Net Profit';
  document.getElementById('view-dashboard').innerHTML=`
    <div class="kpi-grid">
      <div class="kpi green animate-in"><div class="kpi-label">Revenue</div><div class="kpi-value">${fmt(tRev)}</div><div class="kpi-sub">${tOrd} orders</div></div>
      <div class="kpi red animate-in delay-1"><div class="kpi-label">Costs</div><div class="kpi-value">${fmt(tCost)}</div><div class="kpi-sub">${csts.length} entries</div></div>
      <div class="kpi blue animate-in delay-2"><div class="kpi-label">Net Profit</div><div class="kpi-value">${fmt(profit)}</div><div class="kpi-sub">${margin.toFixed(1)}% margin</div></div>
      <div class="kpi purple animate-in delay-3"><div class="kpi-label">AOV</div><div class="kpi-value">${tOrd>0?fmtF(aov):'—'}</div><div class="kpi-sub">avg order value</div></div>
    </div>
    <div class="card animate-in delay-2"><div class="card-title">${chartTitle}</div>${renderChart(cd)}</div>
    <div class="card animate-in delay-3"><div class="card-title">Cost Breakdown</div>${costH}</div>`;
}

function renderRev(){
  const revs=getFilteredRevenues(),tRev=revs.reduce((s,r)=>s+r.amount,0),tOrd=revs.reduce((s,r)=>s+(r.orders||0),0);
  const ed=S.editRevId?findRevenueById(S.editRevId):null;const selDate=(ed?.entry.date)||getDefaultEntryDate();
  let form='';if(S.showRevForm){form=`<div class="form-card"><div class="form-grid"><div><label class="form-label">Date</label><input type="date" class="form-input" id="rev-date" value="${selDate}"></div><div><label class="form-label">Amount (${curSymbol()})</label><input type="number" step="0.01" placeholder="0.00" class="form-input" id="rev-amount" value="${ed?ed.entry.amount:''}"></div><div><label class="form-label">Orders</label><input type="number" min="0" placeholder="0" class="form-input" id="rev-orders" value="${ed?(ed.entry.orders||''):''}"></div><div><label class="form-label">Store</label><select class="form-input" id="rev-store">${storeOpts(ed?.entry.store||S.stores[0]?.name||'')}</select></div></div><div class="form-actions"><button class="save-btn" onclick="saveRevenue()">${S.editRevId?'Update':'Save'}</button><button class="cancel-btn" onclick="closeRevForm()">Cancel</button></div></div>`;}
  let rows='';if(!revs.length)rows='<p class="empty-text">No revenue entries in this period</p>';
  else{rows=`<div class="table-head"><span style="flex:1">Date</span><span style="flex:1.2">Store</span><span style="flex:0.8;text-align:right">Orders</span><span style="flex:1;text-align:right">Amount</span><span style="flex:0.6;text-align:right">Actions</span></div>`;revs.forEach(r=>{rows+=`<div class="table-row"><span style="flex:1" class="mono">${friendlyDate(r.date)}</span><span style="flex:1.2">${badge(r.store)}${esc(r.store)}</span><span style="flex:0.8;text-align:right" class="text-muted">${r.orders||'—'}</span><span style="flex:1;text-align:right" class="mono text-green">${fmtF(r.amount)}</span><span style="flex:0.6;text-align:right;display:flex;justify-content:flex-end;gap:4px"><button class="icon-btn" onclick="openRevForm('${r.id}')" title="Edit">✎</button><button class="icon-btn delete" onclick="deleteRevenue('${r.id}')" title="Delete">✕</button></span></div>`;});rows+=`<div class="table-footer"><span style="flex:2.2">Total</span><span style="flex:0.8;text-align:right" class="mono">${tOrd}</span><span style="flex:1;text-align:right" class="mono text-green">${fmtF(tRev)}</span><span style="flex:0.6"></span></div>`;}
  document.getElementById('view-revenue').innerHTML=`<div class="section-header animate-in"><span class="section-title">Revenue Entries</span><div class="pill-note">Period: ${esc(getRange().label)}</div><button class="add-btn" onclick="openRevForm()">+ Add Revenue</button></div>${form}<div class="card animate-in delay-1">${rows}</div>`;
}

function renderCosts(){
  const csts=getFilteredCosts(),tCost=csts.reduce((s,c)=>s+c.amount,0);
  const ed=S.editCostId?findCostById(S.editCostId):null;const selDate=(ed?.entry.date)||getDefaultEntryDate();
  let form='';if(S.showCostForm){const catOpts=COST_CATEGORIES.map(c=>`<option${(ed?.entry.category||'Ad Spend')===c?' selected':''}>${c}</option>`).join('');form=`<div class="form-card"><div class="form-grid"><div><label class="form-label">Date</label><input type="date" class="form-input" id="cost-date" value="${selDate}"></div><div><label class="form-label">Category</label><select class="form-input" id="cost-category">${catOpts}</select></div><div><label class="form-label">Amount (${curSymbol()})</label><input type="number" step="0.01" placeholder="0.00" class="form-input" id="cost-amount" value="${ed?ed.entry.amount:''}"></div><div><label class="form-label">Store</label><select class="form-input" id="cost-store">${storeOpts(ed?.entry.store||S.stores[0]?.name||'')}</select></div><div style="grid-column:1/-1"><label class="form-label">Label / Note</label><input type="text" placeholder="e.g. Meta Ads" class="form-input" id="cost-label" value="${esc(ed?.entry.label||'')}"></div></div><div class="form-actions"><button class="save-btn" onclick="saveCost()">${S.editCostId?'Update':'Save'}</button><button class="cancel-btn" onclick="closeCostForm()">Cancel</button></div></div>`;}
  let rows='';if(!csts.length)rows='<p class="empty-text">No costs recorded in this period</p>';
  else{rows=`<div class="table-head"><span style="flex:1">Date</span><span style="flex:1">Category</span><span style="flex:1">Label</span><span style="flex:0.8">Store</span><span style="flex:0.9;text-align:right">Amount</span><span style="flex:0.5;text-align:right">Actions</span></div>`;csts.forEach(c=>{const dl=c.date?friendlyDate(c.date):`${monthLabelFromKey(c.monthKey)} · Monthly`;rows+=`<div class="table-row"><span style="flex:1" class="mono">${esc(dl)}</span><span style="flex:1;display:flex;align-items:center;gap:8px"><span class="cost-dot" style="background:${CAT_COLORS[c.category]}"></span>${esc(c.category)}</span><span style="flex:1" class="text-muted">${esc(c.label||'—')}</span><span style="flex:0.8">${badge(c.store)}${esc(c.store)}</span><span style="flex:0.9;text-align:right" class="mono text-red">−${fmtF(c.amount)}</span><span style="flex:0.5;text-align:right;display:flex;justify-content:flex-end;gap:4px"><button class="icon-btn" onclick="openCostForm('${c.id}')" title="Edit">✎</button><button class="icon-btn delete" onclick="deleteCost('${c.id}')" title="Delete">✕</button></span></div>`;});rows+=`<div class="table-footer"><span style="flex:3.8">Total Costs</span><span style="flex:0.9;text-align:right" class="mono text-red">−${fmtF(tCost)}</span><span style="flex:0.5"></span></div>`;}
  document.getElementById('view-costs').innerHTML=`<div class="section-header animate-in"><span class="section-title">Cost Entries</span><div class="pill-note">Period: ${esc(getRange().label)}</div><button class="add-btn" onclick="openCostForm()">+ Add Cost</button></div>${form}<div class="card animate-in delay-1">${rows}</div>`;
}

load();buildFilter();render();