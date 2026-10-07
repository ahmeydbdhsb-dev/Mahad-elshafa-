if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

// زر «تثبيت التطبيق» (أندرويد/كمبيوتر). على الآيفون: مشاركة ← إضافة إلى الشاشة الرئيسية
let dp=null;
const btn=document.createElement('button');
btn.className='btn ghost sm hide';btn.type='button';btn.textContent='⬇ تثبيت التطبيق';
btn.style.cssText='position:fixed;bottom:max(14px,env(safe-area-inset-bottom));left:10px;z-index:8';
document.addEventListener('DOMContentLoaded',()=>document.body.append(btn));
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;btn.classList.remove('hide')});
btn.onclick=async()=>{if(!dp)return;dp.prompt();await dp.userChoice;dp=null;btn.classList.add('hide')};
addEventListener('appinstalled',()=>btn.classList.add('hide'));
