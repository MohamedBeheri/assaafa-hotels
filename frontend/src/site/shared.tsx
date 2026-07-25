import React from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8020/api").replace(/\/$/, "");
export const API = `${API_BASE}/public`;
export const ROOM_FALLBACK = "linear-gradient(135deg, #3A5A34, #6FA23C)";

export const todayStr = () => new Date().toISOString().slice(0, 10);
export const plusDays = (d: string, n: number) => {
  const x = new Date(d); x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

export const SVC_ICONS: Record<string, string> = {
  car: "🚗", compass: "🕌", rocket: "✈️", skin: "🧺", bell: "🛎️", wifi: "📶", lock: "🔐",
};
// أوصاف الخدمات الحقيقية من الموقع الرسمي (مفتاحها الأيقونة)
export const SVC_DESC: Record<string, { ar: string; en: string }> = {
  car: { ar: "تنقّل مريح وآمن مع سائقين محترفين على مدار الساعة.",
         en: "Convenient and comfortable transportation with professional drivers." },
  compass: { ar: "خدمة نقل مباشرة وسهلة إلى المسجد النبوي الشريف.",
             en: "Shuttle services for direct and easy access to the Holy Mosque." },
  rocket: { ar: "خدمة توصيل مريحة من وإلى المطار لجميع النزلاء.",
            en: "Convenient shuttle service to and from the airport for all guests." },
  skin: { ar: "خدمة غسيل وكوي احترافية لتبدو دائماً في أبهى صورة.",
          en: "Professional laundry and ironing services so you always look your best." },
  bell: { ar: "خدمة غرف على مدار الساعة لتلبية كل احتياجاتك في أي وقت.",
          en: "24/7 room service to cater to all your needs, anytime during your stay." },
  wifi: { ar: "اتصال سلس بإنترنت فائق السرعة وموثوق في كل الأنحاء.",
          en: "Seamless connectivity with fast, reliable high-speed internet." },
  lock: { ar: "خزائن أمانات في كل غرفة لحفظ مقتنياتك الثمينة بأمان.",
          en: "Safe deposit boxes in every room to keep your valuables secure." },
};

/* ═══ الترجمة الكاملة ═══ */
export const T: Record<string, Record<string, string>> = {
  ar: {
    brand: "فنادق السعفة", tagline: "AS'SAAFA HOTELS",
    // nav
    navHome: "الرئيسية", navHotels: "الفنادق", navAbout: "عن الفندق",
    navServices: "الخدمات", navGallery: "المعرض", navContact: "تواصل معنا",
    navBook: "احجز الآن", lookup: "استعلام عن حجز", lang: "English", menu: "القائمة",
    // hero
    heroA: "على بُعد خطوات من", heroB: "المسجد النبوي",
    heroP: "فندقا السعفة والسعفة الذهبية — 135 غرفة فاخرة في قلب المدينة المنورة، ومطعم عالمي يخدمك على مدار الساعة.",
    locBadge: "📍 المدينة المنورة — 500 متر من الحرم النبوي الشريف",
    bookNowCta: "احجز إقامتك الآن", exploreCta: "استكشف الفنادق",
    // hotels
    hotelsTitle: "فندقان.. تجربتان", hotelsSub: "اختر ما يناسب إقامتك",
    sfTag: "فخامة بأسعار مناسبة وراحة استثنائية", sfgTag: "بوابتك إلى الرفاهية الحصرية",
    viewHotel: "تفاصيل الفندق", bookHotel: "احجز في هذا الفندق", ourRooms: "غرفنا",
    fromPrice: "تبدأ من", roomsTitleH: "اختر غرفتك", startingFrom: "يبدأ من",
    // about
    aboutTitle: "أهلاً بك في السعفة", aboutKicker: "تجربة لا تُنسى",
    aboutP1: "نحن نعتز بكل نزيل يشرفنا في فندق السعفة، ولهذا نحرص على توفير كل المرافق وخدمات النزلاء بدقة وعناية فائقة لنصنع تجربة لا تُنسى. يقدّم فندق السعفة باقة من اللمسات واللفتات الفريدة للترحيب بنزلائه وجعل إقامتهم ذكرى جميلة تدوم إلى الأبد.",
    aboutP2: "اكتشف المزيج المثالي من الفخامة والراحة والضيافة في فنادق السعفة. في قلب المدينة المنورة، نقدّم مرافق حصرية وخدمات لا مثيل لها لضمان إقامة استثنائية لضيوفنا الكرام.",
    stRooms: "غرفة فاخرة", stDistance: "متر من الحرم", stDining: "مطعم يعمل", stHotels: "فندقان",
    // services
    svcTitle: "خدماتنا", svcSub: "كل ما تحتاجه لإقامة مريحة",
    svcPageTitle: "خدمات فنادق السعفة",
    svcPageSub: "نحرص على راحتك في كل تفصيلة من لحظة وصولك حتى مغادرتك",
    free: "مجاناً",
    // gallery
    galTitle: "معرض الصور", galSub: "لمحات من أجواء السعفة",
    galPageSub: "جولة بصرية في أرجاء فنادق السعفة — اللوبي، الغرف، والمرافق",
    // contact
    contactTitle: "تواصل معنا", contactSub: "نحن هنا لخدمتك على مدار الساعة",
    cReserve: "الحجوزات", cGeneral: "الاستفسارات العامة", cHr: "التوظيف",
    cPhone: "الهاتف الموحّد", cAddress: "العنوان", cAddressVal: "سعد بن أبي وقاص، النقا، المدينة المنورة 42311",
    cFindUs: "موقعنا", cFindP: "يقع فندق السعفة على مقربة من المسجد النبوي الشريف، ويقدّم إقامة فاخرة وضيافة دافئة لتجربة لا تُنسى.",
    cFormName: "الاسم", cFormEmail: "البريد الإلكتروني", cFormMsg: "رسالتك", cFormSend: "إرسال",
    cFormNote: "أو تواصل معنا مباشرة عبر الأرقام والبريد أعلاه.",
    // why book
    perksTitle: "لماذا تحجز معنا مباشرة؟",
    perk1: "أفضل سعر مضمون", perk2: "تأكيد فوري", perk3: "دفع عند الوصول", perk4: "إلغاء مجاني",
    perk1d: "احجز مباشرة واضمن أفضل سعر بلا وسطاء.", perk2d: "تأكيد حجزك فوراً برقم مرجعي.",
    perk3d: "ادفع عند وصولك للفندق بكل أريحية.", perk4d: "مرونة كاملة في تعديل أو إلغاء حجزك.",
    // footer
    footAbout: "فندقان فاخران في المدينة المنورة على بُعد 500 متر من المسجد النبوي الشريف، نقدّم ضيافة سعودية أصيلة وراحة استثنائية.",
    footLinks: "روابط سريعة", footServices: "خدماتنا", footContact: "تواصل معنا",
    footRights: "© 2026 فنادق السعفة — جميع الحقوق محفوظة · المدينة المنورة",
    footRefund: "سياسة الاسترداد", footTerms: "الشروط والأحكام", footCareers: "التوظيف",
    // booking (reused)
    hotel: "الفندق", checkin: "تاريخ الوصول", checkout: "تاريخ المغادرة",
    adultsL: "البالغون", childrenL: "الأطفال", search: "ابحث عن غرفة",
    modeSingle: "حجز فردي", modeGroup: "حجز مجموعات",
    s1: "البحث", s2: "اختيار الغرف", s3: "بياناتك", s4: "التأكيد",
    roomsTitle: "الغرف المتاحة", roomsSub: "الأسعار تشمل الضريبة — الدفع عند الوصول",
    groupTitle: "اختر غرف مجموعتك", groupSub: "حدد عدد الغرف من كل نوع",
    night: "ر.س / الليلة", totalFor: "الإجمالي شامل الضريبة", nights: "ليال",
    book: "احجز الآن", soldout: "نفدت", left: "متبقي", details: "التفاصيل",
    adults: "بالغ", children: "طفل", roomsSel: "غرف مختارة", continueBtn: "متابعة الحجز",
    formTitle: "بياناتك وخدماتك", firstName: "الاسم الأول", lastName: "اسم العائلة",
    phone: "رقم الجوال", email: "البريد الإلكتروني (اختياري)",
    notes: "طلبات خاصة (اختياري)", confirm: "تأكيد الحجز", back: "رجوع",
    total: "الإجمالي", vat: "الضريبة 15%",
    extrasTitle: "أضف خدمات لإقامتك", roomPrice: "قيمة الإقامة", svcPrice: "الخدمات الإضافية",
    doneTitle: "تم استلام حجزك!", doneP: "سيتواصل معك فريق الاستقبال لتأكيد الحجز. احتفظ برقم الحجز:",
    dHotel: "الفندق", dRooms: "الغرف", dDates: "الفترة", dGuests: "النزلاء",
    dTotal: "الإجمالي شامل الضريبة", dServices: "الخدمات", newSearch: "حجز جديد",
    errDates: "اختر تاريخي الوصول والمغادرة", errReq: "الاسم ورقم الجوال مطلوبان",
    searching: "جارٍ البحث...", booking: "جارٍ الحجز...",
    nationality: "الجنسية", idType: "نوع إثبات الهوية",
    idTypes_national_id: "هوية وطنية", idTypes_iqama: "إقامة",
    idTypes_passport: "جواز سفر عادي", idTypes_passport_diplomatic: "جواز سفر دبلوماسي",
    idTypes_passport_mission: "جواز سفر مهام",
    idNumber: "رقم الإثبات", idDoc: "صورة الإثبات (هوية/جواز)",
    idDocHint: "ارفع صورة واضحة — تُحفظ في ملفك لدى الفندق لتسريع تسجيل الدخول",
    chooseFile: "اختر ملفاً", errId: "الجنسية ونوع الإثبات ورقمه مطلوبة",
    capacity: "السعة", amenitiesL: "المرافق", checkinTime: "الدخول من",
    checkoutTime: "الخروج حتى", phoneL: "الهاتف",
    shareWa: "واتساب", shareCp: "نسخ", shareSh: "مشاركة", copied: "تم النسخ ✓",
    shareBookingTxt: "حجزي في", shareCode: "رقم الحجز",
    lkTitle: "الاستعلام عن حجز", lkCode: "رقم الحجز", lkPhone: "رقم الجوال", lkBtn: "استعلام",
    lkStatus: "الحالة", close: "إغلاق", bookCta: "ابدأ الحجز",
  },
  en: {
    brand: "As'saafa Hotels", tagline: "AS'SAAFA HOTELS",
    navHome: "Home", navHotels: "Hotels", navAbout: "About",
    navServices: "Services", navGallery: "Gallery", navContact: "Contact",
    navBook: "Book Now", lookup: "Find Booking", lang: "العربية", menu: "Menu",
    heroA: "Steps away from the", heroB: "Prophet's Mosque",
    heroP: "As'saafa & As'saafa Golden — 135 luxurious rooms in the heart of Madinah, with international dining around the clock.",
    locBadge: "📍 Madinah — 500m from the Holy Mosque",
    bookNowCta: "Book Your Stay", exploreCta: "Explore Hotels",
    hotelsTitle: "Two Hotels, Two Experiences", hotelsSub: "Choose what suits your stay",
    sfTag: "Affordable luxury with exceptional comfort", sfgTag: "Your gateway to exclusive luxury living",
    viewHotel: "Hotel Details", bookHotel: "Book this hotel", ourRooms: "Our Rooms",
    fromPrice: "From", roomsTitleH: "Choose your room", startingFrom: "Starting from",
    aboutTitle: "Welcome to As'saafa", aboutKicker: "Unforgettable Experience",
    aboutP1: "We cherish every guest who honors us at As'saafa Hotel. That is why we provide all facilities and guest services with precision and utmost care to give you an unforgettable experience. As'saafa offers unique touches to welcome its guests and make their stay a beautiful memory that lasts forever.",
    aboutP2: "Discover the ultimate blend of luxury, comfort, and hospitality at As'saafa Hotels. In the heart of Madinah, we offer exclusive amenities and unparalleled services to ensure an exceptional stay for our esteemed guests.",
    stRooms: "Luxury rooms", stDistance: "Meters to Mosque", stDining: "Dining", stHotels: "Hotels",
    svcTitle: "Our Services", svcSub: "Everything you need for a comfortable stay",
    svcPageTitle: "As'saafa Hotels Services",
    svcPageSub: "We care about your comfort in every detail, from arrival to departure",
    free: "Free",
    galTitle: "Gallery", galSub: "Glimpses of As'saafa",
    galPageSub: "A visual tour of As'saafa Hotels — lobby, rooms, and facilities",
    contactTitle: "Get in Touch", contactSub: "We're here to serve you around the clock",
    cReserve: "Reservations", cGeneral: "General Inquiries", cHr: "Careers",
    cPhone: "Unified Number", cAddress: "Address", cAddressVal: "Saad bin Abu Waqas, Al Naqa', Madinah 42311",
    cFindUs: "Find Us", cFindP: "Located near the Prophet's Mosque, As'saafa Hotel offers luxury living and warm hospitality for an unforgettable experience.",
    cFormName: "Name", cFormEmail: "Email", cFormMsg: "Your message", cFormSend: "Send",
    cFormNote: "Or reach us directly via the numbers and emails above.",
    perksTitle: "Why book direct?",
    perk1: "Best rate guaranteed", perk2: "Instant confirmation", perk3: "Pay on arrival", perk4: "Free cancellation",
    perk1d: "Book direct and get the best price, no middlemen.", perk2d: "Your booking confirmed instantly with a reference.",
    perk3d: "Pay comfortably when you arrive at the hotel.", perk4d: "Full flexibility to modify or cancel your booking.",
    footAbout: "Two luxury hotels in Madinah, 500m from the Prophet's Mosque, offering authentic Saudi hospitality and exceptional comfort.",
    footLinks: "Quick Links", footServices: "Our Services", footContact: "Contact",
    footRights: "© 2026 As'saafa Hotels — All rights reserved · Madinah",
    footRefund: "Refund Policy", footTerms: "Terms & Conditions", footCareers: "Careers",
    hotel: "Hotel", checkin: "Check-in", checkout: "Check-out",
    adultsL: "Adults", childrenL: "Children", search: "Search rooms",
    modeSingle: "Individual", modeGroup: "Group Booking",
    s1: "Search", s2: "Choose rooms", s3: "Your details", s4: "Confirmation",
    roomsTitle: "Available Rooms", roomsSub: "Prices include VAT — pay on arrival",
    groupTitle: "Pick your group rooms", groupSub: "Set quantity per room type",
    night: "SAR / night", totalFor: "Total incl. VAT", nights: "nights",
    book: "Book now", soldout: "Sold out", left: "left", details: "Details",
    adults: "Adults", children: "Children", roomsSel: "rooms selected", continueBtn: "Continue",
    formTitle: "Your details & extras", firstName: "First name", lastName: "Last name",
    phone: "Mobile number", email: "Email (optional)",
    notes: "Special requests (optional)", confirm: "Confirm booking", back: "Back",
    total: "Total", vat: "VAT 15%",
    extrasTitle: "Add extras to your stay", roomPrice: "Rooms", svcPrice: "Extras",
    doneTitle: "Booking received!", doneP: "Our reception team will contact you to confirm. Keep your booking code:",
    dHotel: "Hotel", dRooms: "Rooms", dDates: "Dates", dGuests: "Guests",
    dTotal: "Total incl. VAT", dServices: "Extras", newSearch: "New booking",
    errDates: "Pick check-in and check-out dates", errReq: "Name and mobile are required",
    searching: "Searching...", booking: "Booking...",
    nationality: "Nationality", idType: "ID document type",
    idTypes_national_id: "National ID", idTypes_iqama: "Iqama",
    idTypes_passport: "Passport (Regular)", idTypes_passport_diplomatic: "Passport (Diplomatic)",
    idTypes_passport_mission: "Passport (Mission)",
    idNumber: "Document number", idDoc: "ID document photo",
    idDocHint: "Upload a clear photo — saved to your hotel profile for faster check-in",
    chooseFile: "Choose file", errId: "Nationality, ID type and number are required",
    capacity: "Capacity", amenitiesL: "Amenities", checkinTime: "Check-in from",
    checkoutTime: "Check-out by", phoneL: "Phone",
    shareWa: "WhatsApp", shareCp: "Copy", shareSh: "Share", copied: "Copied ✓",
    shareBookingTxt: "My booking at", shareCode: "Booking code",
    lkTitle: "Find my booking", lkCode: "Booking code", lkPhone: "Mobile number", lkBtn: "Search",
    lkStatus: "Status", close: "Close", bookCta: "Start booking",
  },
};

export function Palm({ size = 90, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" fill="none">
      <g stroke={color} strokeWidth="3.2" strokeLinecap="round">
        <line x1="50" y1="10" x2="50" y2="120" />
        <line x1="50" y1="22" x2="30" y2="34" /><line x1="50" y1="22" x2="70" y2="34" />
        <line x1="50" y1="38" x2="26" y2="52" /><line x1="50" y1="38" x2="74" y2="52" />
        <line x1="50" y1="54" x2="24" y2="70" /><line x1="50" y1="54" x2="76" y2="70" />
        <line x1="50" y1="70" x2="26" y2="86" /><line x1="50" y1="70" x2="74" y2="86" />
        <line x1="50" y1="86" x2="30" y2="100" /><line x1="50" y1="86" x2="70" y2="100" />
      </g>
    </svg>
  );
}

export function PageHead({ title, sub, bg }: { title: string; sub?: string; bg?: string }) {
  return (
    <section className="gs-pagehead" style={bg ? { backgroundImage: `linear-gradient(rgba(23,38,24,.78),rgba(23,38,24,.82)), url(${bg})` } : undefined}>
      <div className="gs-container">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </section>
  );
}

export function Gallery({ photos, alt, onOpen }: { photos: string[]; alt: string; onOpen?: () => void }) {
  const [i, setI] = React.useState(0);
  if (!photos.length) return null;
  const go = (d: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setI((p) => (p + d + photos.length) % photos.length);
  };
  return (
    <div className="gs-gal" onClick={onOpen} style={{ cursor: onOpen ? "pointer" : undefined }}>
      <img src={photos[i]} alt={alt} loading="lazy" />
      {photos.length > 1 && (
        <>
          <button className="gs-gal-nav prev" onClick={(e) => go(-1, e)} aria-label="prev">‹</button>
          <button className="gs-gal-nav next" onClick={(e) => go(1, e)} aria-label="next">›</button>
          <div className="gs-gal-dots">{photos.map((_, j) => <i key={j} className={j === i ? "on" : ""} />)}</div>
          <span className="gs-gal-count">{i + 1}/{photos.length}</span>
        </>
      )}
    </div>
  );
}

export function ShareRow({ text, url, t }: { text: string; url?: string; t: (k: string) => string }) {
  const [copied, setCopied] = React.useState(false);
  const full = url ? `${text}\n${url}` : text;
  const copy = async () => {
    try { await navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  const canShare = typeof navigator.share === "function";
  return (
    <div className="gs-share">
      <a className="gs-share-btn wa" target="_blank" rel="noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(full)}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.2-3.5-.8-2.9-1.2-4.8-4.2-5-4.4-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.1.1.3 0 .5l-.4.7c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1.1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2 .9c.3.2.5.3.6.4 0 .1 0 .8-.2 1.4Z"/></svg>
        {t("shareWa")}
      </a>
      <button className="gs-share-btn cp" onClick={copy}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        {copied ? t("copied") : t("shareCp")}
      </button>
      {canShare && (
        <button className="gs-share-btn sh" onClick={() => navigator.share({ text, url }).catch(() => {})}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
          {t("shareSh")}
        </button>
      )}
    </div>
  );
}

/* ═══ السياق ═══ */
export interface SiteCtx {
  lang: "ar" | "en";
  setLang: (l: "ar" | "en") => void;
  t: (k: string) => string;
  site: any;
  hotels: any[];
  path: string;
  navigate: (path: string) => void;
  openLookup: () => void;
}
export const SiteContext = React.createContext<SiteCtx>({} as SiteCtx);
export const useSite = () => React.useContext(SiteContext);
