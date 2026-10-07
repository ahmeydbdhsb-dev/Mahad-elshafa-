import {collection,addDoc,updateDoc,deleteDoc,doc,onSnapshot,writeBatch,getDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {db} from "./firebase.js";
import {esc,clean} from "./security.js";

const $=s=>document.querySelector(s);
const money=n=>(+n||0).toLocaleString('ar-EG')+' ج.م';
const today=()=>new Date().toISOString().slice(0,10);
const S={deps:[],studs:[],pays:[],v:'home',q:'',fd:''};
const dep=id=>S.deps.find(d=>d.id===id);
const feeOf=s=>+s.fee>0?+s.fee:+(dep(s.deptId)?.yearlyFee||0);
const paidOf=id=>S.pays.filter(p=>p.studentId===id).reduce((a,p)=>a+ +p.amount,0);
const pct=(a,b)=>b>0?Math.min(100,Math.round(a/b*100)):0;
function toast(m){const t=$('#t');t.textContent=m;t.classList.remove('hide');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.add('hide'),2600)}
const tag=(p,f)=>f>0&&p>=f?'<span class="tag ok">مسدّد</span>':p>0?'<span class="tag mid">جزئي</span>':'<span class="tag no">لم يدفع</span>';
const bar=(p,f)=>`<div class="pg"><i style="width:${pct(p,f)}%"></i></div>`;

/* ---------- كلمة السر + realtime ---------- */
const PW_HASH="4f9f10b304cfe9b2b11fcb1387f694e18f08ea358c7e9f567434d3ad6cbd7fc4";
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const store={get:()=>{try{return localStorage.getItem('ok')}catch{return null}},set:v=>{try{v?localStorage.setItem('ok',v):localStorage.removeItem('ok')}catch{}}};
let unsubs=[],fails=0,lockUntil=0;
function enter(on){
 $('#login').classList.toggle('hide',on);$('#app').classList.toggle('hide',!on);
 unsubs.forEach(f=>f());unsubs=[];
 if(!on){S.deps=[];S.studs=[];S.pays=[];S.q='';S.fd='';A.close();$('#main').innerHTML='';return}
 [['departments','deps'],['students','studs'],['payments','pays']].forEach(([c,k])=>
  unsubs.push(onSnapshot(collection(db,c),sn=>{S[k]=sn.docs.map(d=>({id:d.id,...d.data()}));render()},e=>toast('خطأ: '+e.code))));
}
$('#go').onclick=async()=>{
 if(Date.now()<lockUntil)return toast('محاولات كثيرة، انتظر '+Math.ceil((lockUntil-Date.now())/1000)+' ثانية');
 if(await sha($('#pw').value)===PW_HASH){fails=0;$('#pw').value='';store.set(PW_HASH);enter(true)}
 else{fails++;if(fails>=5)lockUntil=Date.now()+Math.min(900,30*2**(fails-5))*1000;toast('كلمة السر غير صحيحة')}};
$('#pw').onkeydown=e=>{if(e.key==='Enter')$('#go').click()};

/* ---------- modal form ---------- */
function form(title,fields,save){
 $('#m').innerHTML=`<div class="box"><h3>${title}</h3>${fields.map(f=>`<label>${f.l}${f.r?' *':''}</label>`+(f.t==='select'
  ?`<select id="f_${f.k}">${f.o.map(([v,l])=>`<option value="${esc(v)}" ${v==f.v?'selected':''}>${esc(l)}</option>`).join('')}</select>`
  :`<input id="f_${f.k}" type="${f.t||'text'}" value="${esc(f.v)}" placeholder="${esc(f.p||'')}">`)).join('')}
  <div class="row"><button class="btn" id="ok">حفظ</button><button class="btn ghost" data-a="close" data-p="">إلغاء</button></div></div>`;
 $('#m').classList.add('on');
 $('#ok').onclick=async()=>{const o={};fields.forEach(f=>{let v=$('#f_'+f.k).value.trim();if(f.t==='number')v=v===''?'':+v;o[f.k]=v});
  if(fields.some(f=>f.r&&(o[f.k]===''||o[f.k]==null)))return toast('كمّل البيانات المطلوبة (*)');
  const er=clean(o,fields);if(er)return toast(er);try{await save(o);A.close();toast('تم الحفظ ✓')}catch(e){toast('تعذّر الحفظ: '+e.code)}};
}
const depOpts=()=>S.deps.map(d=>[d.id,d.name]);

/* ---------- actions ---------- */
const A={
 go(v){S.v=v;render()},open(id){S.fd=id;S.v='studs';render()},close(){$('#m').classList.remove('on')},out(){store.set(null);enter(false)},
 dep(id){const d=id?dep(id):{};form(id?'تعديل القسم':'قسم جديد',[
  {k:'name',l:'اسم القسم',v:d.name,r:1},
  {k:'yearlyFee',l:'مصاريف السنة كاملة (ج.م)',t:'number',v:d.yearlyFee,r:1},
  {k:'sessionPrice',l:'سعر الحصة الواحدة (ج.م)',t:'number',v:d.sessionPrice,r:1}],
  o=>id?updateDoc(doc(db,'departments',id),o):addDoc(collection(db,'departments'),o))},
 async delDep(id){if(S.studs.some(s=>s.deptId===id))return toast('انقل أو احذف طلاب القسم أولاً');
  if(confirm('حذف القسم؟'))await deleteDoc(doc(db,'departments',id))},
 stu(id,deptId){if(!S.deps.length)return toast('أضف قسماً أولاً');const s=id?S.studs.find(x=>x.id===id):{deptId:deptId||S.fd||S.deps[0].id};
  form(id?'تعديل الطالب':'طالب جديد',[
  {k:'name',l:'اسم الطالب',v:s.name,r:1},{k:'phone',l:'رقم الهاتف',v:s.phone},
  {k:'deptId',l:'القسم',t:'select',o:depOpts(),v:s.deptId},
  {k:'fee',l:'مصاريف مخصصة لهذا الطالب',t:'number',v:s.fee,p:'اتركه فارغاً = مصاريف القسم'}],
  o=>id?updateDoc(doc(db,'students',id),o):addDoc(collection(db,'students'),{...o,joined:today()}))},
 async delStu(id){if(!confirm('حذف الطالب وكل مدفوعاته؟'))return;const b=writeBatch(db);
  b.delete(doc(db,'students',id));S.pays.filter(p=>p.studentId===id).forEach(p=>b.delete(doc(db,'payments',p.id)));await b.commit()},
 pay(sid){const s=S.studs.find(x=>x.id===sid),d=dep(s.deptId)||{};form('دفعة جديدة – '+esc(s.name),[
  {k:'amount',l:'المبلغ (ج.م)',t:'number',v:d.sessionPrice,r:1},{k:'date',l:'التاريخ',t:'date',v:today(),r:1},{k:'note',l:'ملاحظة (مثال: حصة 5)',v:''}],
  o=>addDoc(collection(db,'payments'),{...o,studentId:sid,deptId:s.deptId}))},
 info(sid){const s=S.studs.find(x=>x.id===sid);if(!s)return A.close();const f=feeOf(s),p=paidOf(sid);
  const ps=S.pays.filter(x=>x.studentId===sid).sort((a,b)=>b.date>a.date?1:-1);
  $('#m').innerHTML=`<div class="box"><h3>${esc(s.name)}</h3><p class="sub" style="margin:0 0 10px">${esc(dep(s.deptId)?.name||'')} ${s.phone?'· '+esc(s.phone):''}</p>
  <div class="stats" style="grid-template-columns:repeat(3,1fr);margin:0 0 10px"><div class="st b"><span>المطلوب</span><b style="font-size:16px">${money(f)}</b></div><div class="st g"><span>المدفوع</span><b style="font-size:16px">${money(p)}</b></div><div class="st r"><span>المتبقي</span><b style="font-size:16px">${money(Math.max(0,f-p))}</b></div></div>
  ${bar(p,f)}<div class="tw" style="margin-top:10px"><table>${ps.map(x=>`<tr><td>${x.date}</td><td><b>${money(x.amount)}</b></td><td>${esc(x.note||'')}</td>
  <td><button class="btn sm ghost" data-a="rec" data-p="${x.id}">إيصال</button> <button class="btn sm red" data-a="delPay" data-p="${x.id}|${sid}">✕</button></td></tr>`).join('')||'<tr><td class="empty">لا توجد دفعات بعد</td></tr>'}</table></div>
  <div class="row"><button class="btn gold" data-a="pay" data-p="${sid}">+ دفعة</button><button class="btn ghost" data-a="close" data-p="">إغلاق</button></div></div>`;
  $('#m').classList.add('on')},
 async delPay(id,sid){if(confirm('حذف الدفعة؟')){await deleteDoc(doc(db,'payments',id));setTimeout(()=>A.info(sid),300)}},
 rec(id){const p=S.pays.find(x=>x.id===id),s=S.studs.find(x=>x.id===p.studentId),w=open('','_blank');
  w.document.write(`<html dir="rtl"><body style="font-family:Cairo,sans-serif;padding:40px;max-width:420px;margin:auto;border:3px double #000;margin-top:30px"><h1 style="text-align:center">معهد الصحافة</h1><h3 style="text-align:center">إيصال استلام نقدية</h3><hr><p>استلمنا من الطالب: <b>${esc(s.name)}</b></p><p>القسم: ${esc(dep(s.deptId)?.name||'')}</p><p>المبلغ: <b>${money(p.amount)}</b></p><p>التاريخ: ${p.date}</p><p>البيان: ${esc(p.note||'-')}</p><p>إجمالي المدفوع حتى الآن: ${money(paidOf(s.id))}</p><p>المتبقي: ${money(Math.max(0,feeOf(s)-paidOf(s.id)))}</p><br><p>التوقيع: ..............</p></body></html>`);w.document.close();w.print()},
 csv(){const r=[['الطالب','القسم','الهاتف','المطلوب','المدفوع','المتبقي']];
  S.studs.forEach(s=>{const f=feeOf(s),p=paidOf(s.id);r.push([s.name,dep(s.deptId)?.name||'',s.phone||'',f,p,Math.max(0,f-p)])});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+r.map(x=>x.map(c=>`"${c}"`).join(',')).join('\n')],{type:'text/csv'}));a.download='students.csv';a.click()}
};

/* ---------- views ---------- */
function render(){
 $('#nav').innerHTML=[['home','الرئيسية'],['deps','الأقسام'],['studs','الطلاب']].map(([k,l])=>`<button class="${S.v===k?'on':''}" data-a="go" data-p="${k}">${l}</button>`).join('');
 const tot=S.studs.reduce((a,s)=>a+feeOf(s),0),paid=S.studs.reduce((a,s)=>a+paidOf(s.id),0);
 let h='';
 if(S.v==='home'){
  h=`<div class="stats"><div class="st b"><span>عدد الطلاب</span><b>${S.studs.length.toLocaleString('ar-EG')}</b></div>
  <div class="st"><span>إجمالي المطلوب</span><b>${money(tot)}</b></div><div class="st g"><span>تم تحصيله</span><b>${money(paid)}</b></div>
  <div class="st r"><span>المتبقي</span><b>${money(Math.max(0,tot-paid))}</b></div></div>
  <div class="panel"><h2>التحصيل حسب القسم</h2><div class="tw"><table><tr><th>القسم</th><th>الطلاب</th><th>المطلوب</th><th>المدفوع</th><th>النسبة</th></tr>
  ${S.deps.map(d=>{const ss=S.studs.filter(s=>s.deptId===d.id),t=ss.reduce((a,s)=>a+feeOf(s),0),p=ss.reduce((a,s)=>a+paidOf(s.id),0);
  return`<tr><td><b>${esc(d.name)}</b></td><td>${ss.length}</td><td>${money(t)}</td><td>${money(p)}</td><td>${bar(p,t)}</td></tr>`}).join('')||'<tr><td class="empty">ابدأ بإضافة الأقسام من تبويب «الأقسام»</td></tr>'}</table></div></div>
  <div class="panel"><h2>آخر الدفعات</h2><div class="tw"><table>${[...S.pays].sort((a,b)=>b.date>a.date?1:-1).slice(0,8).map(p=>{const s=S.studs.find(x=>x.id===p.studentId);
  return`<tr><td>${p.date}</td><td>${esc(s?.name||'—')}</td><td><b>${money(p.amount)}</b></td><td>${esc(p.note||'')}</td></tr>`}).join('')||'<tr><td class="empty">لا توجد دفعات بعد</td></tr>'}</table></div></div>`;
 }else if(S.v==='deps'){
  h=`<div class="bar"><button class="btn gold" data-a="dep" data-p="">+ قسم جديد</button></div><div class="grid">
  ${S.deps.map(d=>{const ss=S.studs.filter(s=>s.deptId===d.id),p=ss.reduce((a,s)=>a+paidOf(s.id),0);
  return`<div class="dc"><h3>${esc(d.name)}</h3><p>مصاريف السنة: <b>${money(d.yearlyFee)}</b></p><p>سعر الحصة: <b>${money(d.sessionPrice)}</b></p><p>${ss.length} طالب · محصّل ${money(p)}</p>
  <div class="acts"><button class="btn sm" data-a="open" data-p="${d.id}">الطلاب</button><button class="btn sm ghost" data-a="dep" data-p="${d.id}">تعديل</button><button class="btn sm red" data-a="delDep" data-p="${d.id}">حذف</button></div></div>`}).join('')||'<div class="empty">لا توجد أقسام. اضغط «قسم جديد».</div>'}</div>`;
 }else{
  const q=S.q.toLowerCase(),list=S.studs.filter(s=>(!S.fd||s.deptId===S.fd)&&(!q||(s.name+(s.phone||'')).toLowerCase().includes(q)));
  h=`<div class="bar"><input id="q" placeholder="🔍 بحث بالاسم أو الهاتف" value="${esc(S.q)}"><select id="fd"><option value="">كل الأقسام</option>${S.deps.map(d=>`<option value="${d.id}" ${S.fd===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select>
  <button class="btn gold" data-a="stu" data-p="">+ طالب</button><button class="btn ghost" data-a="csv" data-p="">تصدير Excel</button></div>
  <div class="panel"><div class="tw"><table class="stu"><tr><th>الطالب</th><th>القسم</th><th>المطلوب</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th></th></tr>
  ${list.map(s=>{const f=feeOf(s),p=paidOf(s.id);return`<tr><td><b>${esc(s.name)}</b><br><small style="color:var(--mut)">${esc(s.phone||'')}</small></td><td data-l="القسم">${esc(dep(s.deptId)?.name||'—')}</td>
  <td data-l="المطلوب">${money(f)}</td><td data-l="المدفوع">${money(p)}${bar(p,f)}</td><td data-l="المتبقي">${money(Math.max(0,f-p))}</td><td data-l="الحالة">${tag(p,f)}</td>
  <td style="white-space:nowrap"><button class="btn sm gold" data-a="pay" data-p="${s.id}">+ دفعة</button> <button class="btn sm" data-a="info" data-p="${s.id}">سجل</button> <button class="btn sm ghost" data-a="stu" data-p="${s.id}">✎</button> <button class="btn sm red" data-a="delStu" data-p="${s.id}">✕</button></td></tr>`}).join('')||'<tr><td class="empty">لا يوجد طلاب</td></tr>'}</table></div></div>`;
 }
 const ae=document.activeElement?.id,pos=document.activeElement?.selectionStart;
 $('#main').innerHTML=h;
 if($('#q')){$('#q').oninput=e=>{S.q=e.target.value;render()};$('#fd').onchange=e=>{S.fd=e.target.value;render()};
  if(ae==='q'){$('#q').focus();$('#q').setSelectionRange(pos,pos)}}
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const n=b.dataset.a;
 if(!Object.hasOwn(A,n))return;A[n](...(b.dataset.p?b.dataset.p.split('|'):[]))});
$('#m').addEventListener('click',e=>{if(e.target.id==='m')A.close()});
enter(store.get()===PW_HASH);
 
