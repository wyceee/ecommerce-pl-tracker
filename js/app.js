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
let S={month:new Date().getMonth(),year:new Date().getFullYear(),view:'dashboard',period:'all',customFrom:'',customTo:'',revenues:{},refunds:{},costs:{},stores:[],currency:'USD',defaultStore:'',showRevForm:false,showRefundForm:false,showCostForm:false,editRevId:null,editRefundId:null,editCostId:null,shopify:{domain:'',clientId:'',clientSecret:'',cachedToken:null,tokenExpiry:null,store:'',syncFrom:'',syncTo:'',lastSync:null}};

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
    const r=localStorage.getItem('ecom-revenues'),rf=localStorage.getItem('ecom-refunds'),c=localStorage.getItem('ecom-costs'),s=localStorage.getItem('ecom-stores'),cur=localStorage.getItem('ecom-currency');
    if(r)S.revenues=JSON.parse(r);if(c)S.costs=JSON.parse(c);
    if(rf)S.refunds=JSON.parse(rf);
    S.stores=s?JSON.parse(s):[...DEFAULT_STORES];
    if(cur&&CURRENCIES.some(x=>x.code===cur))S.currency=cur;
    const ds=localStorage.getItem('ecom-default-store');
    if(ds)S.defaultStore=ds;
    const sh=localStorage.getItem('ecom-shopify');
    if(sh){try{const p=JSON.parse(sh);S.shopify={...S.shopify,...p};}catch(e){}}
  }catch(e){S.stores=[...DEFAULT_STORES];}
  S.customFrom=todayISO();S.customTo=todayISO();
}
function saveR(){localStorage.setItem('ecom-revenues',JSON.stringify(S.revenues));}
function saveF(){localStorage.setItem('ecom-refunds',JSON.stringify(S.refunds));}
function saveC(){localStorage.setItem('ecom-costs',JSON.stringify(S.costs));}
function saveS(){localStorage.setItem('ecom-stores',JSON.stringify(S.stores));}
function saveCur(){localStorage.setItem('ecom-currency',S.currency);}
function saveDefaultStore(){localStorage.setItem('ecom-default-store',S.defaultStore);}
function getDefaultStore(){if(S.defaultStore&&S.stores.some(s=>s.name===S.defaultStore))return S.defaultStore;return S.stores[0]?.name||'';}
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
function buildFilter(){const sel=document.getElementById('storeFilter'),cv=sel.value;sel.innerHTML='<option value="all">All Stores</option>'+S.stores.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');if(S.stores.some(s=>s.name===cv))sel.value=cv;else if(S.defaultStore&&S.stores.some(s=>s.name===S.defaultStore))sel.value=S.defaultStore;else sel.value='all';}
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
function getAllRefunds(){const rows=[];Object.entries(S.refunds).forEach(([key,items])=>{(items||[]).forEach(item=>{const date=item.date||`${key}-${pad(item.day||1)}`;rows.push({...item,date,day:dayFromISO(date),monthKey:key});});});return rows;}
function getAllCosts(){const rows=[];Object.entries(S.costs).forEach(([key,items])=>{(items||[]).forEach(item=>{const date=item.date||'';rows.push({...item,date,day:date?dayFromISO(date):null,monthKey:key,legacyUndated:!date});});});return rows;}
function getDataCoverage(){const store=gs();const revs=getAllRevenues().filter(r=>store==='all'||r.store===store);const refunds=getAllRefunds().filter(r=>store==='all'||r.store===store);const costs=getAllCosts().filter(c=>store==='all'||c.store===store).filter(c=>c.date);const dates=[...revs.map(r=>r.date),...refunds.map(r=>r.date),...costs.map(c=>c.date)];if(!dates.length){const t=todayISO();return{start:t,end:t};}const sorted=dates.sort();const earliest=sorted[0];const latest=sorted[sorted.length-1];return{start:earliest,end:latest};}

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
function getFilteredRefunds(){const{start,end}=getRange(),store=gs();return getAllRefunds().filter(r=>(store==='all'||r.store===store)&&r.date>=start&&r.date<=end).sort((a,b)=>a.date.localeCompare(b.date)||(a.orderNumber||0)-(b.orderNumber||0));}
function getFilteredCosts(){const{start,end}=getRange(),store=gs();return getAllCosts().filter(c=>{if(store!=='all'&&c.store!==store)return false;if(S.period==='all')return true;if(S.period==='month')return c.monthKey===mk();if(!c.date)return false;return c.date>=start&&c.date<=end;}).sort((a,b)=>{const da=a.date||`${a.monthKey}-00`,db=b.date||`${b.monthKey}-00`;return da.localeCompare(db);});}
function monthKeysBetween(s,e){const keys=[];let cur=parseISO(`${s.slice(0,7)}-01`);const end=parseISO(`${e.slice(0,7)}-01`);while(cur<=end){keys.push(`${cur.getFullYear()}-${pad(cur.getMonth()+1)}`);cur.setMonth(cur.getMonth()+1);cur.setDate(1);}return keys;}
function hiddenLegacyCostCount(){if(!['today','this_week','yesterday','custom'].includes(S.period))return 0;const store=gs();const{start,end}=getRange();const om=new Set(monthKeysBetween(start,end));return getAllCosts().filter(c=>(store==='all'||c.store===store)&&!c.date&&om.has(c.monthKey)).length;}
function getDefaultEntryDate(){if(S.period==='today')return todayISO();if(S.period==='month'){const t=todayISO();return monthKeyFromISO(t)===mk()?t:monthStartISO(S.year,S.month);}if(S.period==='yesterday')return addDaysISO(todayISO(),-1);if(S.period==='this_week')return todayISO();if(S.period==='custom')return S.customTo||todayISO();return todayISO();}
function findRevenueById(id){for(const[key,items]of Object.entries(S.revenues)){const i=(items||[]).findIndex(x=>x.id===id);if(i>=0){const e=items[i];return{key,index:i,entry:{...e,date:e.date||`${key}-${pad(e.day||1)}`}};}}return null;}
function findRefundById(id){for(const[key,items]of Object.entries(S.refunds)){const i=(items||[]).findIndex(x=>x.id===id);if(i>=0){const e=items[i];return{key,index:i,entry:{...e,date:e.date||`${key}-${pad(e.day||1)}`}};}}return null;}
function findCostById(id){for(const[key,items]of Object.entries(S.costs)){const i=(items||[]).findIndex(x=>x.id===id);if(i>=0){const e=items[i];return{key,index:i,entry:{...e,date:e.date||''}};}}return null;}
function getRevenueOrderWindows(){const store=gs();const byDate=new Map();getAllRevenues().filter(r=>store==='all'||r.store===store).sort((a,b)=>a.date.localeCompare(b.date)).forEach(r=>{const orders=Math.max(0,parseInt(r.orders,10)||0);if(!orders)return;if(!byDate.has(r.date))byDate.set(r.date,{date:r.date,orders:0,stores:new Set()});const row=byDate.get(r.date);row.orders+=orders;if(r.store)row.stores.add(r.store);});let nextStart=1;return[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(row=>{const out={date:row.date,startOrder:nextStart,endOrder:nextStart+row.orders-1,orders:row.orders,stores:[...row.stores]};nextStart=out.endOrder+1;return out;});}
function findOrderWindow(orderNumber){if(!Number.isInteger(orderNumber)||orderNumber<1)return null;return getRevenueOrderWindows().find(w=>orderNumber>=w.startOrder&&orderNumber<=w.endOrder)||null;}
function getMaxTrackedOrder(){const windows=getRevenueOrderWindows();return windows.length?windows[windows.length-1].endOrder:0;}
function suggestedRefundStore(mapped,currentStore){if(currentStore&&currentStore!=='all')return currentStore;if(mapped?.stores?.length===1)return mapped.stores[0];return getDefaultStore();}
function refundPreviewHtml(orderNumber,mapped){if(!orderNumber)return 'Enter an order number to map the refund back to the original order date.';if(!mapped){const maxOrder=getMaxTrackedOrder();return maxOrder?`Order #${orderNumber} is outside your tracked range (currently 1 to #${maxOrder}).`:'Add revenue entries with order counts first so refunds can be mapped.';}return `Order #${orderNumber} maps to <span class="mono text-green">${friendlyDate(mapped.date)}</span> <span class="text-muted">(orders #${mapped.startOrder}–#${mapped.endOrder})</span>`;}

function openSettings(){document.getElementById('settingsModal').classList.remove('hidden');renderStoreList();renderCurrencyGrid();renderShopifySection();}
function closeSettings(){document.getElementById('settingsModal').classList.add('hidden');buildFilter();render();}
function renderCurrencyGrid(){document.getElementById('currencyGrid').innerHTML=CURRENCIES.map(c=>`<div class="currency-opt${c.code===S.currency?' active':''}" onclick="switchCurrency('${c.code}')"><span class="currency-symbol">${c.symbol}</span><span>${c.name}</span></div>`).join('');}
function switchCurrency(code){S.currency=code;saveCur();renderCurrencyGrid();render();toast('Currency: '+code);}
function renderStoreList(){const el=document.getElementById('storeList');if(!S.stores.length){el.innerHTML='<p class="empty-text">No stores added yet</p>';renderDefaultStorePicker();return;}el.innerHTML=S.stores.map((s,i)=>`<div class="store-item"><span class="store-item-name"><span class="store-color-dot" style="background:${s.color}"></span>${esc(s.name)}</span><button class="store-remove-btn" onclick="removeStore(${i})" title="Remove">✕</button></div>`).join('');renderDefaultStorePicker();}
function renderDefaultStorePicker(){const el=document.getElementById('defaultStorePicker');if(!el)return;if(!S.stores.length){el.innerHTML='';return;}const cur=getDefaultStore();el.innerHTML=`<div style="margin-top:12px"><label class="form-label">Default Store</label><select class="form-input" id="defaultStoreSelect" onchange="setDefaultStore(this.value)" style="max-width:260px"><option value="">— None (use first) —</option>${S.stores.map(s=>`<option value="${esc(s.name)}"${s.name===S.defaultStore?' selected':''}>${esc(s.name)}</option>`).join('')}</select><p style="font-size:11px;color:var(--text-muted);margin-top:4px">Auto-selected when adding revenue or costs</p></div>`;}
function setDefaultStore(name){S.defaultStore=name;saveDefaultStore();toast(name?name+' set as default':'Default store cleared');}
function addStore(){const el=document.getElementById('newStoreName'),col=document.getElementById('newStoreColor'),name=el.value.trim();if(!name)return;if(S.stores.some(s=>s.name.toLowerCase()===name.toLowerCase())){toast('Store already exists',true);return;}S.stores.push({name,color:col.value});saveS();el.value='';renderStoreList();buildFilter();render();toast(name+' added');}
function removeStore(i){const name=S.stores[i].name;if(!confirm(`Remove "${name}"?`))return;S.stores.splice(i,1);if(S.defaultStore===name){S.defaultStore='';saveDefaultStore();}saveS();renderStoreList();buildFilter();render();toast(name+' removed');}

function exportData(){const data={_format:'ecom-tracker-v3',exportedAt:new Date().toISOString(),stores:S.stores,currency:S.currency,revenues:S.revenues,refunds:S.refunds,costs:S.costs};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`revenue-tracker-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);toast('Data exported');}
function importData(ev){const file=ev.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=function(e){try{const d=JSON.parse(e.target.result);if(!d.revenues&&!d.refunds&&!d.costs&&!d.stores){toast('Invalid file format',true);return;}const hasData=Object.keys(S.revenues).length>0||Object.keys(S.refunds).length>0||Object.keys(S.costs).length>0;let merge=false;if(hasData)merge=confirm('You have existing data.\n\nOK = Merge\nCancel = Replace');if(merge){if(d.revenues)Object.keys(d.revenues).forEach(k=>{if(!S.revenues[k])S.revenues[k]=[];const ids=new Set(S.revenues[k].map(r=>r.id));d.revenues[k].forEach(r=>{const n={...r};if(ids.has(n.id))n.id=uid();if(!n.date&&n.day)n.date=`${k}-${pad(n.day)}`;S.revenues[k].push(n);});});if(d.refunds)Object.keys(d.refunds).forEach(k=>{if(!S.refunds[k])S.refunds[k]=[];const ids=new Set(S.refunds[k].map(r=>r.id));d.refunds[k].forEach(r=>{const n={...r};if(ids.has(n.id))n.id=uid();if(!n.date&&n.day)n.date=`${k}-${pad(n.day)}`;S.refunds[k].push(n);});});if(d.costs)Object.keys(d.costs).forEach(k=>{if(!S.costs[k])S.costs[k]=[];const ids=new Set(S.costs[k].map(c=>c.id));d.costs[k].forEach(c=>{const n={...c};if(ids.has(n.id))n.id=uid();S.costs[k].push(n);});});if(d.stores)d.stores.forEach(s=>{if(!S.stores.some(x=>x.name.toLowerCase()===s.name.toLowerCase()))S.stores.push(s);});}else{S.revenues=d.revenues||{};S.refunds=d.refunds||{};S.costs=d.costs||{};if(d.stores)S.stores=d.stores;if(d.currency&&CURRENCIES.some(x=>x.code===d.currency))S.currency=d.currency;}saveR();saveF();saveC();saveS();saveCur();buildFilter();renderStoreList();render();toast('Data '+(merge?'merged':'imported'));}catch(err){console.error(err);toast('Failed to parse file',true);}};reader.readAsText(file);ev.target.value='';}

function changeMonth(dir){S.month+=dir;if(S.month>11){S.month=0;S.year++;}if(S.month<0){S.month=11;S.year--;}S.showRevForm=false;S.showRefundForm=false;S.showCostForm=false;render();}
function setPeriod(p){S.period=p;S.showRevForm=false;S.showRefundForm=false;S.showCostForm=false;if(p==='custom'){const cov=getDataCoverage();if(!S.customFrom)S.customFrom=cov.start;if(!S.customTo)S.customTo=cov.end;}render();}
function updateCustomRange(){S.customFrom=document.getElementById('customFrom').value||todayISO();S.customTo=document.getElementById('customTo').value||todayISO();render();}
function switchView(v,btn){S.view=v;S.showRevForm=false;S.showRefundForm=false;S.showCostForm=false;document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');render();}
function resetData(){if(confirm('Delete ALL data? This cannot be undone.')){S.revenues={};S.refunds={};S.costs={};localStorage.removeItem('ecom-revenues');localStorage.removeItem('ecom-refunds');localStorage.removeItem('ecom-costs');toast('All data cleared');render();}}

function openRevForm(id){S.showRevForm=true;S.showRefundForm=false;S.editRevId=id||null;S.editRefundId=null;render();}
function closeRevForm(){S.showRevForm=false;S.editRevId=null;render();}
function saveRevenue(){const date=document.getElementById('rev-date').value,amount=parseFloat(document.getElementById('rev-amount').value),orders=parseInt(document.getElementById('rev-orders').value)||0,store=document.getElementById('rev-store').value;if(!date){toast('Pick a date',true);return;}if(!amount||amount<=0){toast('Enter a valid amount',true);return;}const tk=monthKeyFromISO(date);if(!S.revenues[tk])S.revenues[tk]=[];const next={id:S.editRevId||uid(),date,day:dayFromISO(date),amount,orders,store};if(S.editRevId){const f=findRevenueById(S.editRevId);if(f){S.revenues[f.key].splice(f.index,1);if(!S.revenues[f.key].length)delete S.revenues[f.key];}}S.revenues[tk].push(next);S.month=parseInt(tk.slice(5,7),10)-1;S.year=parseInt(tk.slice(0,4),10);saveR();S.showRevForm=false;S.editRevId=null;toast('Revenue saved');render();}
function deleteRevenue(id){const f=findRevenueById(id);if(!f)return;S.revenues[f.key].splice(f.index,1);if(!S.revenues[f.key].length)delete S.revenues[f.key];saveR();toast('Entry deleted');render();}
function openRefundForm(id){S.showRefundForm=true;S.showRevForm=false;S.editRefundId=id||null;S.editRevId=null;render();}
function closeRefundForm(){S.showRefundForm=false;S.editRefundId=null;render();}
function markRefundStoreManual(){const el=document.getElementById('refund-store');if(el)el.dataset.userSelected='1';}
function updateRefundMappingPreview(){const orderEl=document.getElementById('refund-order-number'),previewEl=document.getElementById('refund-mapping-preview'),dateEl=document.getElementById('refund-mapped-date'),storeEl=document.getElementById('refund-store');if(!orderEl||!previewEl||!dateEl)return;const orderNumber=parseInt(orderEl.value,10);const mapped=findOrderWindow(orderNumber);previewEl.innerHTML=refundPreviewHtml(orderNumber,mapped);dateEl.value=mapped?friendlyDate(mapped.date):'';if(storeEl&&!storeEl.dataset.userSelected){const suggested=suggestedRefundStore(mapped,gs());if(suggested)storeEl.value=suggested;}}
function saveRefund(){const orderNumber=parseInt(document.getElementById('refund-order-number').value,10),amount=parseFloat(document.getElementById('refund-amount').value),store=document.getElementById('refund-store').value;if(!Number.isInteger(orderNumber)||orderNumber<1){toast('Enter a valid order number',true);return;}if(!amount||amount<=0){toast('Enter a valid refund amount',true);return;}const mapped=findOrderWindow(orderNumber);if(!mapped){const maxOrder=getMaxTrackedOrder();toast(maxOrder?`Order number must be between 1 and ${maxOrder}`:'Add revenue entries with order counts first',true);return;}const tk=monthKeyFromISO(mapped.date);if(!S.refunds[tk])S.refunds[tk]=[];const next={id:S.editRefundId||uid(),orderNumber,date:mapped.date,day:dayFromISO(mapped.date),amount,store};if(S.editRefundId){const f=findRefundById(S.editRefundId);if(f){S.refunds[f.key].splice(f.index,1);if(!S.refunds[f.key].length)delete S.refunds[f.key];}}S.refunds[tk].push(next);S.month=parseInt(tk.slice(5,7),10)-1;S.year=parseInt(tk.slice(0,4),10);saveF();S.showRefundForm=false;S.editRefundId=null;toast(`Refund saved for ${friendlyDate(mapped.date)}`);render();}
function deleteRefund(id){const f=findRefundById(id);if(!f)return;S.refunds[f.key].splice(f.index,1);if(!S.refunds[f.key].length)delete S.refunds[f.key];saveF();toast('Refund deleted');render();}

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

function buildChartData(revenues, costs, refunds) {
  const {start, end} = getRange();
  const diff = daysBetween(start, end);
  const revTotals = new Map();
  revenues.forEach(r => revTotals.set(r.date, (revTotals.get(r.date) || 0) + r.amount));
  const refundTotals = new Map();
  refunds.forEach(r => refundTotals.set(r.date, (refundTotals.get(r.date) || 0) + r.amount));
  const costTotals = new Map();
  costs.forEach(c => { if (c.date) costTotals.set(c.date, (costTotals.get(c.date) || 0) + c.amount); });
  const showMonthLabel = diff > 45;
  const pts = [];
  let cur = parseISO(start);
  const ec = parseISO(end);
  while (cur <= ec) {
    const iso = dateToISO(cur);
    const grossRev = revTotals.get(iso) || 0;
    const refund = refundTotals.get(iso) || 0;
    const rev = grossRev - refund;
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
      tooltip: `${friendlyDate(iso)} &nbsp;&middot;&nbsp; Revenue ${fmtF(rev)}${refund>0?` &nbsp;&middot;&nbsp; Refunded ${fmtF(refund)}`:''} &nbsp;&middot;&nbsp; <span style="color:${netColor};font-weight:700">${sign}${fmtF(net)}</span>`,
      value: net, rev, refund, cost
    });
    cur.setDate(cur.getDate() + 1);
  }
  return pts;
}

function renderChart(cd) {
  if (!cd.length || !cd.some(x => x.rev !== 0 || x.cost > 0 || x.refund > 0)) return '<p class="empty-text">No data recorded</p>';
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
    const displayH = (p.rev !== 0 || p.cost > 0 || p.refund > 0) ? Math.max(barHeightPct, 0.8) : 0;
    const cls = isPos ? 'bar-pos' : 'bar-neg';
    barsHtml += `<div class="bar-col">
      ${displayH > 0 ? `<div class="bar ${cls}" style="top:${barTopPct}%;height:${displayH}%"><div class="bar-tooltip">${p.tooltip}</div></div>` : ''}
      <span class="bar-label">${esc(p.label)}</span>
    </div>`;
  });

  return `<div class="chart-wrap">${yAxisHtml}<div class="chart-inner"><div class="chart-bars">${barsHtml}</div></div></div>`;
}

function renderDash(){
  const revs=getFilteredRevenues(),refunds=getFilteredRefunds(),csts=getFilteredCosts();
  const grossRev=revs.reduce((s,r)=>s+r.amount,0),tRefund=refunds.reduce((s,r)=>s+r.amount,0),tRev=grossRev-tRefund,tCost=csts.reduce((s,c)=>s+c.amount,0),tOrd=revs.reduce((s,r)=>s+(r.orders||0),0);
  const uniqueRefundedOrders=new Set(refunds.map(r=>r.orderNumber)).size;
  const refundOrderPct=tOrd>0?(uniqueRefundedOrders/tOrd)*100:0;
  const profit=tRev-tCost,margin=tRev>0?(profit/tRev)*100:0,aov=tOrd>0?tRev/tOrd:0;
  const cd=buildChartData(revs,csts,refunds);
  const costByCat={};COST_CATEGORIES.forEach(c=>costByCat[c]=0);csts.forEach(c=>costByCat[c.category]=(costByCat[c.category]||0)+c.amount);
  const ac=COST_CATEGORIES.filter(c=>costByCat[c]>0);
  let costH='';if(!ac.length)costH='<p class="empty-text">No costs recorded in this period</p>';
  else ac.forEach(cat=>{const pct=tCost>0?(costByCat[cat]/tCost)*100:0;costH+=`<div class="cost-row"><div class="cost-row-header"><span class="cost-cat-name"><span class="cost-dot" style="background:${CAT_COLORS[cat]}"></span>${cat}</span><span class="cost-cat-amount">${fmt(costByCat[cat])}<span class="cost-cat-pct">${pct.toFixed(0)}%</span></span></div><div class="progress-bg"><div class="progress-fill" style="width:${pct}%;background:${CAT_GRADIENTS[cat]}"></div></div></div>`;});
  const chartTitle=S.period==='all'?'Net Profit by Day':'Daily Net Profit';
  document.getElementById('view-dashboard').innerHTML=`
    <div class="kpi-grid">
      <div class="kpi green animate-in"><div class="kpi-label">Net Revenue</div><div class="kpi-value">${fmt(tRev)}</div><div class="kpi-sub">${tOrd} orders${tRefund>0?` · ${fmtF(tRefund)} refunded`:''}</div></div>
      <div class="kpi red animate-in delay-1"><div class="kpi-label">Costs</div><div class="kpi-value">${fmt(tCost)}</div><div class="kpi-sub">${csts.length} entries</div></div>
      <div class="kpi purple animate-in delay-3"><div class="kpi-label">Refunds</div><div class="kpi-value">${fmtF(tRefund)}</div><div class="kpi-sub">${uniqueRefundedOrders} of ${tOrd} orders (${refundOrderPct.toFixed(1)}%)</div></div>     
      <div class="kpi blue animate-in delay-2"><div class="kpi-label">Net Profit</div><div class="kpi-value">${fmt(profit)}</div><div class="kpi-sub">${margin.toFixed(1)}% margin</div></div>
    </div>
    <div class="card animate-in delay-2"><div class="card-title">${chartTitle}</div>${renderChart(cd)}</div>
    <div class="card animate-in delay-3"><div class="card-title">Cost Breakdown</div>${costH}</div>`;
}

function renderRev(){
  const revs=getFilteredRevenues(),refunds=getFilteredRefunds(),grossRev=revs.reduce((s,r)=>s+r.amount,0),refundTotal=refunds.reduce((s,r)=>s+r.amount,0),netRev=grossRev-refundTotal,tOrd=revs.reduce((s,r)=>s+(r.orders||0),0);
  const ed=S.editRevId?findRevenueById(S.editRevId):null;const selDate=(ed?.entry.date)||getDefaultEntryDate();
  const refundEd=S.editRefundId?findRefundById(S.editRefundId):null;
  const refundOrder=refundEd?.entry.orderNumber||'';
  const refundLookup=refundOrder?findOrderWindow(parseInt(refundOrder,10)):null;
  const refundStore=refundEd?.entry.store||suggestedRefundStore(refundLookup,gs());
  let form='';if(S.showRevForm){form=`<div class="form-card"><div class="form-grid"><div><label class="form-label">Date</label><input type="date" class="form-input" id="rev-date" value="${selDate}"></div><div><label class="form-label">Amount (${curSymbol()})</label><input type="number" step="0.01" placeholder="0.00" class="form-input" id="rev-amount" value="${ed?ed.entry.amount:''}"></div><div><label class="form-label">Orders</label><input type="number" min="0" placeholder="0" class="form-input" id="rev-orders" value="${ed?(ed.entry.orders||''):''}"></div><div><label class="form-label">Store</label><select class="form-input" id="rev-store">${storeOpts(ed?.entry.store||getDefaultStore())}</select></div></div><div class="form-actions"><button class="save-btn" onclick="saveRevenue()">${S.editRevId?'Update':'Save'}</button><button class="cancel-btn" onclick="closeRevForm()">Cancel</button></div></div>`;}
  if(S.showRefundForm){form+=`<div class="form-card"><div class="form-grid"><div><label class="form-label">Order Number</label><input type="number" min="1" placeholder="e.g. 57" class="form-input" id="refund-order-number" value="${refundOrder}" oninput="updateRefundMappingPreview()"></div><div><label class="form-label">Refund Amount (${curSymbol()})</label><input type="number" step="0.01" placeholder="0.00" class="form-input" id="refund-amount" value="${refundEd?refundEd.entry.amount:''}"></div><div><label class="form-label">Mapped Date</label><input type="text" class="form-input" id="refund-mapped-date" value="${refundLookup?friendlyDate(refundLookup.date):''}" readonly></div><div><label class="form-label">Store</label><select class="form-input" id="refund-store" onchange="markRefundStoreManual()">${storeOpts(refundStore)}</select></div></div><div class="form-help" id="refund-mapping-preview">${refundPreviewHtml(refundOrder,refundLookup)}</div><div class="form-actions"><button class="save-btn" onclick="saveRefund()">${S.editRefundId?'Update':'Save Refund'}</button><button class="cancel-btn" onclick="closeRefundForm()">Cancel</button></div></div>`;}
  let rows='';if(!revs.length)rows='<p class="empty-text">No revenue entries in this period</p>';
  else{rows=`<div class="table-head"><span style="flex:1">Date</span><span style="flex:1.2">Store</span><span style="flex:0.8;text-align:right">Orders</span><span style="flex:1;text-align:right">Amount</span><span style="flex:0.6;text-align:right">Actions</span></div>`;revs.forEach(r=>{rows+=`<div class="table-row"><span style="flex:1" class="mono">${friendlyDate(r.date)}</span><span style="flex:1.2">${badge(r.store)}${esc(r.store)}</span><span style="flex:0.8;text-align:right" class="text-muted">${r.orders||'—'}</span><span style="flex:1;text-align:right" class="mono text-green">${fmtF(r.amount)}</span><span style="flex:0.6;text-align:right;display:flex;justify-content:flex-end;gap:4px"><button class="icon-btn" onclick="openRevForm('${r.id}')" title="Edit">✎</button><button class="icon-btn delete" onclick="deleteRevenue('${r.id}')" title="Delete">✕</button></span></div>`;});rows+=`<div class="table-footer"><span style="flex:2.2">Gross Revenue</span><span style="flex:0.8;text-align:right" class="mono">${tOrd}</span><span style="flex:1;text-align:right" class="mono text-green">${fmtF(grossRev)}</span><span style="flex:0.6"></span></div>`;}
  let refundRows='';if(!refunds.length)refundRows='<p class="empty-text">No refunds recorded in this period</p>';
  else{refundRows=`<div class="table-head"><span style="flex:0.8">Order #</span><span style="flex:1">Original Date</span><span style="flex:1">Store</span><span style="flex:0.9;text-align:right">Amount</span><span style="flex:0.6;text-align:right">Actions</span></div>`;refunds.forEach(r=>{refundRows+=`<div class="table-row"><span style="flex:0.8" class="mono">#${esc(r.orderNumber)}</span><span style="flex:1" class="mono">${friendlyDate(r.date)}</span><span style="flex:1">${badge(r.store)}${esc(r.store)}</span><span style="flex:0.9;text-align:right" class="mono text-red">−${fmtF(r.amount)}</span><span style="flex:0.6;text-align:right;display:flex;justify-content:flex-end;gap:4px"><button class="icon-btn" onclick="openRefundForm('${r.id}')" title="Edit">✎</button><button class="icon-btn delete" onclick="deleteRefund('${r.id}')" title="Delete">✕</button></span></div>`;});refundRows+=`<div class="table-footer"><span style="flex:2.8">Total Refunds</span><span style="flex:0.9;text-align:right" class="mono text-red">−${fmtF(refundTotal)}</span><span style="flex:0.6"></span></div>`;}
  document.getElementById('view-revenue').innerHTML=`<div class="section-header animate-in"><span class="section-title">Revenue Entries</span><div class="section-actions"><div class="pill-note">Period: ${esc(getRange().label)}</div><button class="add-btn refund" onclick="openRefundForm()">+ Add Refund</button><button class="add-btn" onclick="openRevForm()">+ Add Revenue</button></div></div><div class="summary-strip animate-in delay-1"><span>Gross Revenue <b>${fmtF(grossRev)}</b></span><span>Refunds <b class="text-red">−${fmtF(refundTotal)}</b></span><span>Net Revenue <b class="text-green">${fmtF(netRev)}</b></span><span>${tOrd} tracked order${tOrd!==1?'s':''}</span></div>${form}<div class="card animate-in delay-1">${rows}</div><div class="card animate-in delay-2"><div class="card-title">Refund Entries</div><div class="form-help" style="margin-bottom:14px">Refunds map order numbers back to the original order date using the cumulative order counts from your revenue entries.</div>${refundRows}</div>`;
}

function renderCosts(){
  const csts=getFilteredCosts(),tCost=csts.reduce((s,c)=>s+c.amount,0);
  const ed=S.editCostId?findCostById(S.editCostId):null;const selDate=(ed?.entry.date)||getDefaultEntryDate();
  let form='';if(S.showCostForm){const catOpts=COST_CATEGORIES.map(c=>`<option${(ed?.entry.category||'Ad Spend')===c?' selected':''}>${c}</option>`).join('');form=`<div class="form-card"><div class="form-grid"><div><label class="form-label">Date</label><input type="date" class="form-input" id="cost-date" value="${selDate}"></div><div><label class="form-label">Category</label><select class="form-input" id="cost-category">${catOpts}</select></div><div><label class="form-label">Amount (${curSymbol()})</label><input type="number" step="0.01" placeholder="0.00" class="form-input" id="cost-amount" value="${ed?ed.entry.amount:''}"></div><div><label class="form-label">Store</label><select class="form-input" id="cost-store">${storeOpts(ed?.entry.store||getDefaultStore())}</select></div><div style="grid-column:1/-1"><label class="form-label">Label / Note</label><input type="text" placeholder="e.g. Meta Ads" class="form-input" id="cost-label" value="${esc(ed?.entry.label||'')}"></div></div><div class="form-actions"><button class="save-btn" onclick="saveCost()">${S.editCostId?'Update':'Save'}</button><button class="cancel-btn" onclick="closeCostForm()">Cancel</button></div></div>`;}
  let rows='';if(!csts.length)rows='<p class="empty-text">No costs recorded in this period</p>';
  else{rows=`<div class="table-head"><span style="flex:1">Date</span><span style="flex:1">Category</span><span style="flex:1">Label</span><span style="flex:0.8">Store</span><span style="flex:0.9;text-align:right">Amount</span><span style="flex:0.5;text-align:right">Actions</span></div>`;csts.forEach(c=>{const dl=c.date?friendlyDate(c.date):`${monthLabelFromKey(c.monthKey)} · Monthly`;rows+=`<div class="table-row"><span style="flex:1" class="mono">${esc(dl)}</span><span style="flex:1;display:flex;align-items:center;gap:8px"><span class="cost-dot" style="background:${CAT_COLORS[c.category]}"></span>${esc(c.category)}</span><span style="flex:1" class="text-muted">${esc(c.label||'—')}</span><span style="flex:0.8">${badge(c.store)}${esc(c.store)}</span><span style="flex:0.9;text-align:right" class="mono text-red">−${fmtF(c.amount)}</span><span style="flex:0.5;text-align:right;display:flex;justify-content:flex-end;gap:4px"><button class="icon-btn" onclick="openCostForm('${c.id}')" title="Edit">✎</button><button class="icon-btn delete" onclick="deleteCost('${c.id}')" title="Delete">✕</button></span></div>`;});rows+=`<div class="table-footer"><span style="flex:3.8">Total Costs</span><span style="flex:0.9;text-align:right" class="mono text-red">−${fmtF(tCost)}</span><span style="flex:0.5"></span></div>`;}
  document.getElementById('view-costs').innerHTML=`<div class="section-header animate-in"><span class="section-title">Cost Entries</span><div class="pill-note">Period: ${esc(getRange().label)}</div><button class="add-btn" onclick="openCostForm()">+ Add Cost</button></div>${form}<div class="card animate-in delay-1">${rows}</div>`;
}

function renderShopifySection(){
  const el=document.getElementById('shopifySection');if(!el)return;
  const lastSync=S.shopify.lastSync?new Date(S.shopify.lastSync).toLocaleString('en-GB'):'Never';
  const today=todayISO();
  const fromVal=S.shopify.syncFrom||addDaysISO(today,-30);
  const toVal=S.shopify.syncTo||today;
  el.innerHTML=`
    <div class="form-grid" style="margin-bottom:14px">
      <div style="grid-column:1/-1">
        <label class="form-label">Store Domain</label>
        <input type="text" class="form-input" id="shopifyDomain" placeholder="mystore.myshopify.com" value="${esc(S.shopify.domain)}">
      </div>
      <div>
        <label class="form-label">Client ID</label>
        <input type="text" class="form-input" id="shopifyClientId" placeholder="713903ca0e26234ef..." value="${esc(S.shopify.clientId||'')}">
      </div>
      <div>
        <label class="form-label">Client Secret</label>
        <input type="password" class="form-input" id="shopifyClientSecret" placeholder="shpcs_..." value="${esc(S.shopify.clientSecret||'')}">
      </div>
      <div style="grid-column:1/-1">
        <label class="form-label">Map orders to store</label>
        <select class="form-input" id="shopifyStore">
          <option value="">— No store —</option>
          ${S.stores.map(s=>`<option value="${esc(s.name)}"${S.shopify.store===s.name?' selected':''}>${esc(s.name)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">Sync From</label>
        <input type="date" class="form-input" id="shopifySyncFrom" value="${fromVal}">
      </div>
      <div>
        <label class="form-label">Sync To</label>
        <input type="date" class="form-input" id="shopifySyncTo" value="${toVal}">
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
      <button class="save-btn" style="padding:9px 16px;font-size:12px" onclick="saveShopify()">Save Settings</button>
      <button id="shopifySyncBtn" class="small-btn" onclick="syncShopify()" style="background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.25);color:var(--blue)">↻ Sync Orders</button>
      <span style="font-size:11px;color:var(--text-muted)">Last sync: ${lastSync}</span>
    </div>
    <div id="shopifyCorsNote" class="hidden" style="background:var(--red-dim);border:1px solid rgba(248,113,113,0.2);border-radius:8px;padding:10px 12px;font-size:11px;color:var(--red);line-height:1.7;margin-bottom:10px">
      <b>Sync failed.</b> Open this app through the bundled Node server (<code style="background:rgba(0,0,0,0.2);padding:1px 4px;border-radius:3px">npm start</code>), then try again.
    </div>
    <p style="font-size:11px;color:var(--text-muted);line-height:1.6">Client ID &amp; Secret come from your Shopify Partners app → Settings → Credentials. A fresh token is fetched automatically before every sync through the built-in backend proxy.</p>`;
}

function saveShopify(){
  S.shopify.domain=(document.getElementById('shopifyDomain')?.value||'').trim().replace(/^https?:\/\//,'').replace(/\/$/,'');
  S.shopify.clientId=(document.getElementById('shopifyClientId')?.value||'').trim();
  S.shopify.clientSecret=(document.getElementById('shopifyClientSecret')?.value||'').trim();
  S.shopify.store=document.getElementById('shopifyStore')?.value||'';
  S.shopify.syncFrom=document.getElementById('shopifySyncFrom')?.value||'';
  S.shopify.syncTo=document.getElementById('shopifySyncTo')?.value||'';
  localStorage.setItem('ecom-shopify',JSON.stringify(S.shopify));
  toast('Shopify settings saved');
}

async function syncShopify(){
  const domain=(document.getElementById('shopifyDomain')?.value||S.shopify.domain).trim().replace(/^https?:\/\//,'').replace(/\/$/,'');
  const storeName=document.getElementById('shopifyStore')?.value??S.shopify.store;
  const fromDate=document.getElementById('shopifySyncFrom')?.value||addDaysISO(todayISO(),-30);
  const toDate=document.getElementById('shopifySyncTo')?.value||todayISO();
  const proxyBase='/proxy?url=';
  if(!domain){toast('Enter your Shopify domain',true);return;}
  const clientId=(document.getElementById('shopifyClientId')?.value||S.shopify.clientId||'').trim();
  const clientSecret=(document.getElementById('shopifyClientSecret')?.value||S.shopify.clientSecret||'').trim();
  let token='';
  if(!clientId||!clientSecret){toast('Enter Client ID and Client Secret',true);return;}
  const btn=document.getElementById('shopifySyncBtn');
  if(btn){btn.textContent='Syncing…';btn.disabled=true;}
  document.getElementById('shopifyCorsNote')?.classList.add('hidden');
  // Auto-fetch token via client credentials if no manual token
  if(!token&&clientId&&clientSecret){
    try{
      if(btn)btn.textContent='Getting token…';
      const tokenEndpoint=`https://${domain}/admin/oauth/access_token`;
      const tUrl=`${proxyBase}${encodeURIComponent(tokenEndpoint)}`;
      const tResp=await fetch(tUrl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`});
      if(!tResp.ok){const t=await tResp.text();throw new Error(`Token fetch HTTP ${tResp.status}: ${t.slice(0,150)}`);}
      const tData=await tResp.json();
      token=tData.access_token;
      if(!token)throw new Error('No access_token in response: '+JSON.stringify(tData));
      S.shopify.cachedToken=token;S.shopify.tokenExpiry=Date.now()+(tData.expires_in-300)*1000;
      localStorage.setItem('ecom-shopify',JSON.stringify(S.shopify));
      if(btn)btn.textContent='Syncing…';
    }catch(err){
      if(btn){btn.textContent='↻ Sync Orders';btn.disabled=false;}
      const msg=err.message||'';
      if(msg.includes('Failed to fetch')||msg.toLowerCase().includes('cors')){toast('Connection error while fetching token',true);document.getElementById('shopifyCorsNote')?.classList.remove('hidden');}
      else toast('Token error: '+msg.slice(0,80),true);
      return;
    }
  }
  const baseUrl=`https://${domain}/admin/api/2024-01/orders.json`;
  let allOrders=[],pageInfo=null,hasMore=true;
  try{
    while(hasMore){
      const params=new URLSearchParams({status:'any',financial_status:'paid',created_at_min:fromDate+'T00:00:00+00:00',created_at_max:toDate+'T23:59:59+00:00',limit:'250',fields:'id,created_at,total_price,order_number'});
      if(pageInfo)params.set('page_info',pageInfo);
      const rawUrl=`${baseUrl}?${params}`;
      const fetchUrl=`${proxyBase}${encodeURIComponent(rawUrl)}`;
      const resp=await fetch(fetchUrl,{headers:{'X-Shopify-Access-Token':token}});
      if(!resp.ok){const txt=await resp.text();throw new Error(`HTTP ${resp.status} — ${txt.slice(0,200)}`);}
      const data=await resp.json();
      allOrders=allOrders.concat(data.orders||[]);
      const link=resp.headers.get('Link')||'';
      if(link.includes('rel="next"')){const m=link.match(/page_info=([^&>]+)[^>]*rel="next"/);pageInfo=m?m[1]:null;hasMore=!!pageInfo;}
      else{hasMore=false;}
    }
    const existingIds=new Set(getAllRevenues().filter(r=>r.shopifyId).map(r=>r.shopifyId));
    let added=0,skipped=0;
    allOrders.forEach(order=>{
      const sid=String(order.id);
      if(existingIds.has(sid)){skipped++;return;}
      const amount=parseFloat(order.total_price)||0;
      if(amount<=0){skipped++;return;}
      const dateISO=order.created_at.slice(0,10);
      const tk=monthKeyFromISO(dateISO);
      if(!S.revenues[tk])S.revenues[tk]=[];
      S.revenues[tk].push({id:uid(),shopifyId:sid,date:dateISO,day:dayFromISO(dateISO),amount,orders:1,store:storeName,label:`#${order.order_number}`});
      added++;
    });
    S.shopify.lastSync=new Date().toISOString();
    localStorage.setItem('ecom-shopify',JSON.stringify(S.shopify));
    if(added>0){saveR();buildFilter();render();}
    renderShopifySection();
    toast(`✓ ${added} order${added!==1?'s':''} imported${skipped?', '+skipped+' already existed':''}`);
  }catch(err){
    console.error('Shopify sync error:',err);
    const msg=err.message||'';
    const isConn=msg.includes('Failed to fetch')||msg.includes('NetworkError')||msg.toLowerCase().includes('cors')||msg.includes('null');
    if(isConn){
      toast('Connection error — start the bundled server',true);
      document.getElementById('shopifyCorsNote')?.classList.remove('hidden');
    }else{toast('Sync error: '+msg.slice(0,80),true);}
  }finally{
    if(btn){btn.textContent='↻ Sync Orders';btn.disabled=false;}
  }
}

function importCJDropshipping(ev){const file=ev.target.files[0];if(!file)return;if(typeof XLSX==='undefined'){toast('XLSX library not loaded. Please refresh the page and try again.',true);return;}const reader=new FileReader();reader.onload=function(e){try{const arr=new Uint8Array(e.target.result);const workbook=XLSX.read(arr,{type:'array'});const sheet=workbook.Sheets[workbook.SheetNames[0]];const data=XLSX.utils.sheet_to_json(sheet);if(!data.length){toast('No data found in file',true);return;}let added=0,errors=0;const store=getDefaultStore()||'CJDropshipping';const processedOrders=new Set();data.forEach(row=>{try{if(!row['CJ Amount']||!row['CJ Paid Time']){return;}const orderIdRaw=String(row['CJ Order Number']||'').trim();if(!orderIdRaw||processedOrders.has(orderIdRaw)){return;}processedOrders.add(orderIdRaw);const cogsAmount=parseFloat(String(row['CJ Amount']||'').replace(/[^\d.-]/g,''));if(isNaN(cogsAmount)||cogsAmount<=0)return;let dateStr='';try{const paidTimeStr=String(row['CJ Paid Time']||'').trim();if(paidTimeStr&&paidTimeStr.length>0){const dateMatch=paidTimeStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);if(dateMatch){dateStr=`${dateMatch[1]}-${String(dateMatch[2]).padStart(2,'0')}-${String(dateMatch[3]).padStart(2,'0')}`;}}if(!dateStr){const custDateRaw=row['Order Date']||row['Order Creation Date']||'';if(custDateRaw){const dm=String(custDateRaw).match(/(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})/);if(dm){const yyyy=dm[3].length===2?2000+parseInt(dm[3]):parseInt(dm[3]);dateStr=`${yyyy}-${String(dm[1]).padStart(2,'0')}-${String(dm[2]).padStart(2,'0')}`;}}if(!dateStr){dateStr=dateToISO(new Date());}}}catch(de){}if(!dateStr)dateStr=dateToISO(new Date());const tk=monthKeyFromISO(dateStr);if(!S.costs[tk])S.costs[tk]=[];const label=`CJ #${orderIdRaw}`;S.costs[tk].push({id:uid(),category:'COGS',date:dateStr,day:dayFromISO(dateStr),amount:cogsAmount,label,store});added++;}catch(itemErr){errors++;}});if(added===0&&errors>0){toast('Failed to import: Invalid data format',true);return;}S.costs=S.costs;if(added>0){saveC();buildFilter();render();const msg=`✓ ${added} CJ order${added!==1?'s':''} imported as COGS`+(errors>0?` (${errors} errors)`:'');toast(msg);}else{toast('No valid orders found to import',true);}}catch(err){console.error(err);toast('Failed to parse file: '+(err.message||'Unknown error'),true);}};reader.readAsArrayBuffer(file);ev.target.value='';}

load();buildFilter();render();