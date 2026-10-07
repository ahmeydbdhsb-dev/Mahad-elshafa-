# خطوات التشغيل والتأمين (بالترتيب)

1. Authentication → Sign-in method → فعّل Email/Password فقط.
2. Authentication → Settings → User actions → أوقف Enable create (sign-up) لو متاح، وفعّل Email enumeration protection.
3. Authentication → Users → Add user (إيميل + باسورد قوي 14 حرف+)، وانسخ الـ UID.
4. Firestore → Start collection اسمها admins → Document ID = الـ UID → أي حقل (role: "admin").
   (ده الوحيد المسموح له يقرأ ويكتب. أي حد تاني حتى لو سجّل دخول مرفوض.)
5. Firestore → Rules → الصق محتوى firestore.rules → Publish.
6. Google Cloud Console → APIs & Services → Credentials → API key الخاص بالويب:
   Application restrictions = Websites، وضع دومين الموقع فقط.
7. (موصى به) App Check → سجّل الموقع بـ reCAPTCHA v3 → حط الـ Site key في js/firebase.js ثم Enforce على Firestore.
8. النشر: firebase deploy --only hosting,firestore  (ملف firebase.json فيه الـ Security Headers).

## تسجيل الدخول مرة واحدة
- المهندس يكتب الإيميل والباسورد أول مرة فقط، وبعدها الجلسة تفضل محفوظة على الجهاز ويدخل مباشرة.
- لو ضغط «تسجيل خروج» هيطلب الباسورد تاني.
- الباسورد بتتحط عند إنشاء المستخدم في Firebase Authentication (مش مكتوبة في الكود عمداً).
