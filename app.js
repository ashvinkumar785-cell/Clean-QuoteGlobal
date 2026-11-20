(function(){
const R={USD:1,EUR:.92,GBP:.79,INR:83,AUD:1.52,CAD:1.37}, // approximate rates: edit anytime
$=s=>document.querySelector(s);
let cur='USD';try{cur=localStorage.getItem('cq')||'USD'}catch(e){}if(!R[cur])cur='USD';
const r=()=>R[cur],fd=cur=>cur=='INR'?0:2,
fmt=n=>new Intl.NumberFormat('en',{style:'currency',currency:cur,minimumFractionDigits:fd(),maximumFractionDigits:fd()}).format(n);
const COND=[['Average',1],['Light / well maintained',.9],['Heavily soiled',1.3]],
FREQ=[['One-time',0],['Weekly (15% off)',.15],['Every 2 weeks (10% off)',.1],['Monthly (5% off)',.05]],
UNIT=[['sq ft',1],['sq m',10.764]],
DT=[['disc','Extra discount (%)','n',0],['tax','Tax / VAT / GST (%)','n',0]],
SB=[['trav','Travel / parking fee','m',0],['sup','Supplies fee','m',0]];
const home=(rs,bd,ba,mn,sph)=>(v,ad)=>{const a=v.area*v.unit,b=Math.max(mn,a*rs+v.bed*bd+v.bath*ba)*r(),c=b*(v.cond-1),f=(b+c)*v.freq;
return{L:[['Base cleaning ('+v.bed+' bed, '+v.bath+' bath, '+Math.round(a)+' sq ft)',b],['Condition adjustment',c],['Recurring-visit discount',-f],['Travel / parking',v.trav],['Cleaning supplies',v.sup]],
note:'Estimated crew time: about '+(a/sph).toFixed(1)+' labor hours.'}};
const HF=[['bed','Bedrooms','n',2],['bath','Bathrooms','n',1],['area','Home size','n',1000],['unit','Size unit','s',UNIT],['cond','Home condition','s',COND],['freq','Frequency','s',FREQ]];
const CALC={
house:{f:[...HF,...SB,...DT],ad:[['oven','Inside oven',25],['fridge','Inside fridge',20],['win','Interior windows',30],['laun','Laundry (1 load)',15],['pet','Pet hair treatment',20],['bal','Balcony / patio',20]],run:home(.08,12,22,60,400),title:'Estimated house cleaning quote'},
deep:{f:[...HF,...SB,...DT],ad:[['base','Baseboards & trim',30],['cab','Inside cabinets',40],['carp','Carpet steam cleaning',60],['grout','Grout & tile scrub',45],['wall','Wall washing',50],['oven','Inside oven',25],['fridge','Inside fridge',20],['win','Interior windows',30]],run:home(.14,20,35,120,200),title:'Estimated deep cleaning quote'},
maid:{f:[['hrs','Hours per visit','n',3],['cl','Number of maids','n',1],['rate','Hourly rate per maid','m',20],['vis','Visits per month','n',4],...SB,...DT],ad:[['fridge','Inside fridge',12],['laun','Laundry',15],['dish','Dishes',8],['bed','Change bed linen',10],['win','Windows',20],['pet','Pet hair',10]],
run:v=>({L:[['Labor ('+v.hrs+'h × '+v.cl+' maid'+(v.cl>1?'s':'')+' × rate)',v.hrs*v.cl*v.rate],['Travel',v.trav],['Supplies',v.sup]],mult:Math.max(1,v.vis)}),title:'Estimated maid service quote'},
biz:{f:[['hrs','Labor hours per job','n',4],['staff','Staff on the job','n',2],['wage','Wage per staff hour','m',15],['burden','Payroll taxes & benefits (%)','n',12],['sup','Supplies cost per job','m',8],['trav','Travel / fuel per job','m',6],['oh','Overhead (%)','n',10],['margin','Target profit margin (%)','n',25],['tax','Tax / VAT / GST (%)','n',0]],
ad:[['eq','Specialty equipment use',15],['ins','Insurance allocation',5],['mkt','Marketing allocation',4]],inRun:1,
run:(v,ad)=>{const lab=v.hrs*v.staff*v.wage,bur=lab*v.burden/100,c0=lab+bur+v.sup+v.trav+ad,oh=c0*v.oh/100,cost=c0+oh,price=cost/(1-Math.min(v.margin,90)/100);
return{L:[['Labor ('+v.hrs+'h × '+v.staff+' staff)',lab],['Payroll taxes & benefits',bur],['Supplies',v.sup],['Travel & fuel',v.trav],['Equipment / insurance / marketing',ad],['Overhead',oh],['Profit margin ('+v.margin+'%)',price-cost]],
note:'Your total cost per job: '+fmt(cost)+' · Profit per job: '+fmt(price-cost)+' (before tax).'}},title:'Recommended customer price'}};
const fld=x=>{const[i,l,t,d]=x;if(t=='s')return`<label>${l}<select id="f_${i}">${d.map(o=>`<option value="${o[1]}">${o[0]}</option>`).join('')}</select></label>`;
const m=t=='m';return`<label>${l}${m?' <span class="cc"></span>':''}<input id="f_${i}" type="number" inputmode="decimal" min="0" step="any" value="${m&&d?Math.round(d*r()):d}"${m?' class="money"':''}></label>`};
function build(root,key){const C=CALC[key];
root.innerHTML=`<div class="card"><label>Currency<select id="cur">${Object.keys(R).map(c=>`<option${c==cur?' selected':''}>${c}</option>`).join('')}</select></label><div class="grid" style="margin-top:.8rem">${C.f.map(fld).join('')}</div>
<h3>Optional services &amp; extra charges</h3><div class="chk">${C.ad.map(a=>`<label class="ck"><input type="checkbox" id="a_${a[0]}"> ${a[1]} <span data-u="${a[2]}"></span></label>`).join('')}</div></div><div class="card" id="res" aria-live="polite"></div>`;
const lab=()=>{root.querySelectorAll('.cc').forEach(e=>e.textContent='('+cur+')');root.querySelectorAll('[data-u]').forEach(e=>e.textContent='+'+fmt(e.dataset.u*r()))};
function calc(){const v={};C.f.forEach(x=>v[x[0]]=parseFloat($('#f_'+x[0]).value)||0);
let ad=0,al=[];C.ad.forEach(a=>{if($('#a_'+a[0]).checked){const m=a[2]*r();ad+=m;al.push([a[1],m])}});
const o=C.run(v,ad);let L=o.L.slice();if(!C.inRun)L=L.concat(al);L=L.filter(x=>Math.abs(x[1])>.004);
const sub=L.reduce((s,x)=>s+x[1],0),d=sub*Math.min(v.disc||0,100)/100,tx=(sub-d)*(v.tax||0)/100,per=sub-d+tx,tot=per*(o.mult||1);
const rows=L.map(x=>[x[0],x[1]]);rows.push(['Subtotal',sub]);if(d)rows.push(['Discount ('+v.disc+'%)',-d]);if(tx)rows.push(['Tax ('+v.tax+'%)',tx]);
if(o.mult>1){rows.push(['Price per visit',per]);rows.push(['× '+o.mult+' visits per month',tot])}
$('#res').innerHTML=`<h2 style="margin-top:0">Price breakdown</h2><table>${rows.map(x=>`<tr><td>${x[0]}</td><td>${fmt(x[1])}</td></tr>`).join('')}</table>
<div class="tot"><span>${o.mult>1?'Estimated monthly quote':C.title}</span><span>${fmt(tot)}</span></div><p class="note">${o.note||''} Estimates only; actual prices vary by location and provider.</p>
<button class="btn" id="cp">Copy quote</button><button class="btn s" onclick="print()">Print</button>`;
$('#cp').onclick=()=>{const t='CleanQuote Global – '+C.title+' ('+cur+')\n'+rows.map(x=>x[0]+': '+fmt(x[1])).join('\n');navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>$('#cp').textContent='Copied ✓')}}
$('#cur').onchange=function(){const o=r();cur=this.value;try{localStorage.setItem('cq',cur)}catch(e){}
root.querySelectorAll('.money').forEach(e=>e.value=Math.round((parseFloat(e.value)||0)*r()/o*100)/100);lab();calc()};
root.addEventListener('input',calc);root.addEventListener('change',calc);lab();calc()}
const c=$('#calc');if(c)build(c,c.dataset.calc);
const mb=$('#mb');mb.onclick=()=>{const o=$('#nv').classList.toggle('o');mb.setAttribute('aria-expanded',o)};
const y=$('#y');if(y)y.textContent=new Date().getFullYear();
const cf=$('#cf');if(cf)cf.onsubmit=e=>{e.preventDefault();const g=n=>encodeURIComponent(cf[n].value);location.href='mailto:contact@your-domain.com?subject='+g('s')+'&body='+g('m')+'%0A%0AFrom: '+g('n')+' ('+g('e')+')'};
})();
