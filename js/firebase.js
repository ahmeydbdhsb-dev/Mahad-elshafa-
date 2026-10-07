import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {getAuth,setPersistence,browserLocalPersistence} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app=initializeApp({apiKey:"AIzaSyBwUF0flzbYn278BCy8fNQQiEDUwXDChWg",authDomain:"dr-ahmed-tammam.firebaseapp.com",projectId:"dr-ahmed-tammam",storageBucket:"dr-ahmed-tammam.firebasestorage.app",messagingSenderId:"275006885172",appId:"1:275006885172:web:57ae16894e746c0701a961"});

// App Check (reCAPTCHA v3): ضع مفتاح الموقع هنا بعد تفعيله من الكونسول لمنع أي سكريبت/بوت من استخدام مشروعك
const SITE_KEY='';
if(SITE_KEY){const m=await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js");
 m.initializeAppCheck(app,{provider:new m.ReCaptchaV3Provider(SITE_KEY),isTokenAutoRefreshEnabled:true})}

export const auth=getAuth(app),db=getFirestore(app);
await setPersistence(auth,browserLocalPersistence); // الجلسة تفضل محفوظة: يدخل مرة واحدة فقط
