"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Locale = "en" | "hi";

const translations: Record<string, Record<Locale, string>> = {
  // Microsite
  "youre_invited": { en: "You're Invited", hi: "आप आमंत्रित हैं" },
  "book_your_stay": { en: "Book Your Stay", hi: "अपना कमरा बुक करें" },
  "reserve_now": { en: "Reserve Now", hi: "अभी बुक करें" },
  "rooms_available": { en: "Rooms Available", hi: "कमरे उपलब्ध" },
  "guests_confirmed": { en: "Guests Confirmed", hi: "अतिथि पुष्टि" },
  "included_perks": { en: "Included Perks", hi: "शामिल सुविधाएँ" },
  "choose_your_room": { en: "Choose Your Room", hi: "अपना कमरा चुनें" },
  "select_room": { en: "Select Room", hi: "कमरा चुनें" },
  "per_night": { en: "per night", hi: "प्रति रात" },
  "available": { en: "available", hi: "उपलब्ध" },
  "booked": { en: "booked", hi: "बुक हो चुके" },
  "sold_out": { en: "Sold Out", hi: "बिक चुका" },
  "left": { en: "left", hi: "शेष" },
  "perks_experiences": { en: "Perks & Experiences", hi: "सुविधाएँ और अनुभव" },
  "enhance_stay": { en: "Enhance your stay with these curated offerings", hi: "इन विशेष सुविधाओं के साथ अपने ठहराव को बेहतर बनाएँ" },
  "included": { en: "Included", hi: "शामिल" },
  "ready_to_join": { en: "Ready to Join Us?", hi: "हमसे जुड़ने के लिए तैयार?" },
  "secure_your_spot": { en: "Secure your spot", hi: "अपनी जगह सुनिश्चित करें" },
  "limited_rooms": { en: "Limited rooms available.", hi: "सीमित कमरे उपलब्ध हैं।" },
  "book_room_now": { en: "Book Your Room Now", hi: "अभी कमरा बुक करें" },
  "event_starts_in": { en: "Event Starts In", hi: "कार्यक्रम शुरू होने में" },
  "scroll": { en: "Scroll", hi: "नीचे देखें" },
  "event_concluded": { en: "This event has concluded. Bookings are no longer available.", hi: "यह कार्यक्रम समाप्त हो गया है। बुकिंग अब उपलब्ध नहीं है।" },
  "event_happening": { en: "Event is happening now! Check in at the venue.", hi: "कार्यक्रम अभी चल रहा है! स्थल पर चेक-इन करें।" },
  "group_discounts": { en: "Group Discounts", hi: "सामूहिक छूट" },
  "group_discount_desc": { en: "Book more rooms and save more — exclusive group rates for this event", hi: "ज़्यादा कमरे बुक करें, ज़्यादा बचत पाएँ — इस कार्यक्रम के लिए विशेष सामूहिक दरें" },
  "best_value": { en: "BEST VALUE", hi: "सर्वोत्तम" },
  "discount": { en: "Discount", hi: "छूट" },
  "book_rooms": { en: "Book", hi: "बुक करें" },
  "rooms": { en: "rooms", hi: "कमरे" },
  "booking_deadlines": { en: "Booking Deadlines", hi: "बुकिंग की अंतिम तिथियाँ" },
  "book_before_dates": { en: "Book before these dates to avoid penalties", hi: "जुर्माने से बचने के लिए इन तिथियों से पहले बुक करें" },
  "deadline_passed": { en: "Deadline passed", hi: "समय सीमा बीत गई" },
  "days_remaining": { en: "days remaining", hi: "दिन शेष" },
  "release": { en: "Release", hi: "रिलीज़" },
  "the_os_for_group_travel": { en: "The Operating System for Group Travel", hi: "ग्रुप ट्रैवल के लिए ऑपरेटिंग सिस्टम" },
  "powered_by": { en: "Powered by TBO.com", hi: "TBO.com द्वारा संचालित" },
  // Countdown
  "days": { en: "Days", hi: "दिन" },
  "hours": { en: "Hours", hi: "घंटे" },
  "minutes": { en: "Minutes", hi: "मिनट" },
  "seconds": { en: "Seconds", hi: "सेकंड" },
  "event_started": { en: "Event has started!", hi: "कार्यक्रम शुरू हो गया!" },
  // Room details
  "floor": { en: "Floor", hi: "मंज़िल" },
  "wing": { en: "Wing", hi: "विंग" },
  "standard_accommodation": { en: "Standard accommodation", hi: "मानक आवास" },
  "of": { en: "of", hi: "में से" },
  "from_price": { en: "From", hi: "शुरू" },
  // Bottom nav
  "feedback": { en: "Feedback", hi: "प्रतिक्रिया" },
  "reserve_room": { en: "Reserve Room", hi: "कमरा बुक करें" },
  // Social proof
  "guests_confirmed_count": { en: "guests have already confirmed", hi: "अतिथियों ने पुष्टि की है" },
  "rooms_filling_fast": { en: "Rooms are filling up fast!", hi: "कमरे तेज़ी से भर रहे हैं!" },
  "special_group_rates": { en: "Special group rates applied", hi: "विशेष सामूहिक दरें लागू" },
  // Booking page
  "select_accommodation": { en: "Select your preferred accommodation for the event", hi: "कार्यक्रम के लिए अपना पसंदीदा आवास चुनें" },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const t = useCallback(
    (key: string) => {
      return translations[key]?.[locale] || translations[key]?.en || key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Inline translated text — use in server components to make text reactive to locale */
export function T({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}

/** Language Toggle Component */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "hi" : "en")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:shadow-sm ${
        locale === "hi"
          ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40 text-orange-700 dark:text-orange-400"
          : "bg-white/80 dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
      } ${className}`}
      title={locale === "en" ? "हिंदी में देखें" : "View in English"}
    >
      <span className="text-sm">{locale === "en" ? "🇮🇳" : "🇬🇧"}</span>
      <span>{locale === "en" ? "हिंदी" : "EN"}</span>
    </button>
  );
}
