export const esc=s=>String(s??'').replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));

// تنظيف وفحص المدخلات قبل الإرسال (والقواعد في السيرفر تفحصها مرة تانية)
export function clean(o,fields){
 for(const f of fields){let v=o[f.k];
  if(f.t==='number'){if(v==='')continue;
   if(!Number.isFinite(v)||v<0||v>1e7)return 'رقم غير صحيح في: '+f.l;
   if(f.k==='amount'&&v<=0)return 'المبلغ يجب أن يكون أكبر من صفر'}
  else if(f.t==='date'){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return 'تاريخ غير صحيح'}
  else if(f.t!=='select'){o[f.k]=v.replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,f.k==='note'?200:f.k==='phone'?20:100)}
 }
 return null}

// تسجيل خروج تلقائي بعد فترة خمول
export function idleLogout(fn,ms){let h;const r=()=>{clearTimeout(h);h=setTimeout(fn,ms)};
 const ev=['click','keydown','touchstart','mousemove'];ev.forEach(e=>addEventListener(e,r,{passive:true}));r();
 return()=>{clearTimeout(h);ev.forEach(e=>removeEventListener(e,r))}}
