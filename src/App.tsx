import React, { useCallback, useEffect, useRef, useState } from "react";
import { 
  Globe, Sun, Moon, Circle, Heart, Flame, Star, Sparkles, Flower2, Shield, 
  Feather, HeartHandshake, Crown, Waves, ScrollText, Home, BookOpen, 
  Phone, Mail, CheckCircle, CheckCircle2, MessageCircle, IndianRupee, Users, 
  Trophy, Target, Eye, Clock, MapPin, RefreshCw, Lightbulb, 
  ClipboardEdit, Check, Download, Calendar as CalendarIcon, List,
  LayoutDashboard, TrendingUp, BarChart3, PieChart as PieChartIcon, 
  ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from "@/components/ui/table";
import { apiFetch } from "./api";
import { LOGO_BASE64 } from "./logo-base64";
import { getPoojaSeoContent } from "./poojaSeoContent";

// Razorpay global type declaration
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Page =
  | "home"
  | "book"
  | "categories"
  | "pooja-detail"
  | "success-stories"
  | "about"
  | "contact"
  | "blog"
  | "blog-detail"
  | "login"
  | "signup"
  | "dashboard"
  | "admin"
  | "share-experience"
  | "terms"
  | "privacy";

type Lang = "en" | "hi" | "gu";

interface Config {
  hero_title: string;
  hero_subtitle: string;
  contact_phone: string;
  contact_email: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  surface_color: string;
}

interface AuthState {
  loading: boolean;
  token: string | null;
  user: AuthUser | null;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface PoojaDetail {
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  price: string;
  duration: string;
  description: string;
  benefits: string[];
  process: string[];
  bestFor: string;
  whenToPerform: string;
}

interface BookingData {
  type: string;
  id?: string;
  name: string;
  phone: string;
  email: string;
  pooja_type: string;
  city: string;
  message: string;
  status: string;
  created_at: string;
  poojaDate?: string | null;
  address?: string;
  specialRequirements?: string;
  price?: number | null;
  paymentLink?: string;
  userId?: string | null;
  razorpayOrderId?: string | null;
}

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  role: "user" | "admin";
}

const AUTH_STORAGE_KEY = "satkarmpooja.auth";

// ─── Admin-managed content (local-only) ───────────────────────────────────────
type PopularPoojaCard = {
  id: string;
  title?: string;
  description?: string;
  price?: string;
  icon?: string | React.ReactNode;
  image?: string; // url or data-url
  categoryId?: string;
  poojaId?: string;
};

type AboutPoojaGalleryItem = {
  id: string;
  image: string; // url or data-url
  caption?: string;
};

const POPULAR_POOJAS_STORAGE_KEY = "satkarmpooja.content.popularPoojas.v2";
const ABOUT_GALLERY_STORAGE_KEY = "satkarmpooja.content.aboutPoojaGallery.v1";
const CONTENT_EVENT_NAME = "satkarmpooja:content";



function writeLocalJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(CONTENT_EVENT_NAME, { detail: { key } }));
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const TRANSLATIONS = {
  navHome: {
    en: "Home",
    hi: "होम",
    gu: "હોમ",
  },
  navCategories: {
    en: "Puja Categories",
    hi: "पूजा श्रेणियां",
    gu: "પૂજા કેટેગરીઝ",
  },
  navSuccessStories: {
    en: "Success Stories",
    hi: "सक्सेस स्टोरीज़",
    gu: "સક્સેસ સ્ટોરીઝ",
  },
  navAbout: {
    en: "About Us",
    hi: "हमारे बारे में",
    gu: "અમારા વિષે",
  },
  navContact: {
    en: "Contact",
    hi: "संपर्क",
    gu: "સંપર્ક",
  },
  navBook: {
    en: "Book Puja",
    hi: "पूजा बुक करें",
    gu: "પૂજા બુક કરો",
  },
  successTitle: {
    en: "Success Stories",
    hi: "सफलता की कहानियाँ",
    gu: "સફળતાની વાર્તાઓ",
  },
  successSubtitle: {
    en: "Real experiences from real devotees — transformed by the power of authentic Vedic rituals.",
    hi: "सच्चे भक्तों के सच्चे अनुभव — प्रामाणिक वैदिक अनुष्ठानों की शक्ति से बदली हुई ज़िंदगी।",
    gu: "સાચા ભક્તોના સાચા અનુભવ — પ્રમાણિક વૈદિક વિધિઓની શક્તિથી બદલાયેલ જીવન.",
  },
  heroTagline: {
    en: "India's Most Trusted Vedic Platform",
    hi: "भारत का सबसे विश्वसनीय वैदिक प्लेटफ़ॉर्म",
    gu: "ભારતનું સૌથી વિશ્વસનીય વૈદિક પ્લેટફોર્મ",
  },
  heroBookCta: {
    en: "Book Your Puja",
    hi: "अपनी पूजा बुक करें",
    gu: "તમારી પૂજા બુક કરો",
  },
  heroExploreCta: {
    en: "Explore Categories",
    hi: "श्रेणियाँ देखें",
    gu: "કેટેગરીઝ જુઓ",
  },
  statsHappyFamilies: {
    en: "Happy Families",
    hi: "खुशहाल परिवार",
    gu: "ખુશ પરિવાર",
  },
  statsPoojasPerformed: {
    en: "Pujas Performed",
    hi: "की गई पूजाएँ",
    gu: "કરેલ પૂજા",
  },
  statsAvgRating: {
    en: "Average Rating",
    hi: "औसत रेटिंग",
    gu: "સરેરાશ રેટિંગ",
  },
  statsSatisfaction: {
    en: "Satisfaction Rate",
    hi: "संतुष्टि दर",
    gu: "સંતોષ દર",
  },
  homeOurServices: {
    en: "Our Services",
    hi: "हमारी सेवाएँ",
    gu: "અમારી સેવાઓ",
  },
  homePopularHeading: {
    en: "Popular Puja Ceremonies",
    hi: "लोकप्रिय पूजा समारोह",
    gu: "લોકપ્રિય પૂજા વિધિઓ",
  },
  homePopularSubtext: {
    en: "Discover our most sought-after rituals, carefully curated for modern families seeking divine blessings.",
    hi: "हमारे सबसे लोकप्रिय अनुष्ठानों को जानें, जिन्हें आधुनिक परिवारों के लिए दिव्य आशीर्वाद के साथ सावधानी से चुना गया है।",
    gu: "અમારી સૌથી લોકપ્રિય વિધિઓ જાણો, જે આધુનિક પરિવારો માટે દિવ્ય આશીર્વાદ સાથે કાળજીપૂર્વક પસંદ કરવામાં આવી છે.",
  },
  homeWhyChooseUs: {
    en: "Why Choose Us",
    hi: "हमें क्यों चुनें",
    gu: "અમને કેમ પસંદ કરો",
  },
  homeWhyHeading: {
    en: "The SatkarmPuja Difference",
    hi: "SatkarmPuja की विशेषता",
    gu: "SatkarmPuja નો ફરક",
  },
  heroTitle: {
    en: "Book Authentic Vedic Pujas with Verified Pandits",
    hi: "प्रमाणित पंडितों के साथ प्रामाणिक वैदिक पूजाएँ बुक करें",
    gu: "પ્રમાણિત પંડિતો સાથે સાચી વૈદિક પૂજા બુક કરો",
  },
  heroSubtitle: {
    en: "Experience sacred rituals performed by learned Brahmins with personalized consultation and transparent pricing.",
    hi: "विद्वान ब्राह्मणों द्वारा कराए गए पवित्र अनुष्ठानों का अनुभव करें, व्यक्तिगत परामर्श और पारदर्शी शुल्क के साथ।",
    gu: "પંડિત બ્રાહ્મણો દ્વારા કરાયેલા પવિત્ર વિધિઓનો અનુભવ કરો, વ્યક્તિગત માર્ગદર્શન અને પારદર્શક કિંમતો સાથે.",
  },
  popular_griha_pravesh_name: {
    en: "Griha Pravesh",
    hi: "गृह प्रवेश",
    gu: "ગૃહ પ્રવેશ",
  },
  popular_griha_pravesh_desc: {
    en: "Auspicious house warming ceremony with Vedic blessings",
    hi: "वैदिक आशीर्वाद के साथ शुभ गृह प्रवेश पूजा",
    gu: "વૈદિક આશીર્વાદ સાથે શુભ ગૃહ પ્રવેશ વિધિ",
  },
  popular_satyanarayan_katha_name: {
    en: "Satyanarayan Katha",
    hi: "सत्यनारायण कथा",
    gu: "સત્યનારાયણ કથા",
  },
  popular_satyanarayan_katha_desc: {
    en: "Sacred storytelling ritual for wish fulfillment",
    hi: "कामना पूर्ण करने के लिए पवित्र कथा पूजा",
    gu: "ઇચ્છા પૂર્ણ કરવા માટે પવિત્ર કથા પૂજા",
  },
  popular_rudrabhishek_name: {
    en: "Rudrabhishek",
    hi: "रुद्राभिषेक",
    gu: "રુદ્રાભિષેક",
  },
  popular_rudrabhishek_desc: {
    en: "Powerful Shiva worship with sacred ablutions",
    hi: "शिवजी की शक्तिशाली पूजा पवित्र अभिषेक के साथ",
    gu: "શિવજીની શક્તિશાળી પૂજા પવિત્ર અભિષેક સાથે",
  },
  popular_marriage_pooja_name: {
    en: "Marriage Puja",
    hi: "विवाह पूजा",
    gu: "લગ્ન પૂજા",
  },
  popular_marriage_pooja_desc: {
    en: "Complete Vedic wedding ceremonies and rituals",
    hi: "पूर्ण वैदिक विवाह अनुष्ठान और रस्में",
    gu: "સંપૂર્ણ વૈદિક લગ્ન વિધિ અને વિધિઓ",
  },
  popular_navgraha_shanti_name: {
    en: "Navgraha Shanti",
    hi: "नवग्रह शांति",
    gu: "નવગ્રહ શાંતિ",
  },
  popular_navgraha_shanti_desc: {
    en: "Planetary peace ritual for cosmic harmony",
    hi: "ग्रहों की शांति और समरसता के लिए पूजा",
    gu: "ગ્રહ શાંતિ અને સમરસતા માટેની પૂજા",
  },
  popular_custom_pooja_name: {
    en: "Custom Puja",
    hi: "कस्टम पूजा",
    gu: "કસ્ટમ પૂજા",
  },
  popular_custom_pooja_desc: {
    en: "Any other traditional ceremony, personalized for you",
    hi: "आपकी आवश्यकता के अनुसार कोई भी पारंपरिक पूजा",
    gu: "તમારી જરૂરિયાત મુજબ કોઈપણ પરંપરાગત પૂજા",
  },
  feature_verified_title: {
    en: "Verified Pandits",
    hi: "सत्यापित पंडित",
    gu: "સત્યાપિત પંડિતો",
  },
  feature_verified_desc: {
    en: "All our pandits are thoroughly vetted for authenticity and expertise in Vedic traditions.",
    hi: "हमारे सभी पंडितों की प्रामाणिकता और वैदिक परंपराओं में विशेषज्ञता के लिए पूरी तरह जाँच की जाती है।",
    gu: "અમારા બધા પંડિતોની વેદિક પરંપરાઓમાં નિપુણતા અને પ્રામાણિકતા માટે સારી રીતે તપાસ કરવામાં આવે છે.",
  },
  feature_traditions_title: {
    en: "Sacred Traditions",
    hi: "पवित्र परंपराएँ",
    gu: "પવિત્ર પરંપરાઓ",
  },
  feature_traditions_desc: {
    en: "Every ritual is performed with precise adherence to ancient Vedic scriptures and customs.",
    hi: "हर अनुष्ठान प्राचीन वैदिक शास्त्रों और परंपराओं के अनुसार किया जाता है।",
    gu: "દરેક વિધિ પ્રાચીન વૈદિક શાસ્ત્રો અને પરંપરાઓ મુજબ કરવામાં આવે છે.",
  },
  feature_consult_title: {
    en: "Personal Consultation",
    hi: "व्यक्तिगत परामर्श",
    gu: "વ્યક્તિગત માર્ગદર્શન",
  },
  feature_consult_desc: {
    en: "Pre-pooja consultation to understand your needs and customize the ritual accordingly.",
    hi: "पूजा से पहले आपकी आवश्यकता समझकर अनुष्ठान को उसी अनुसार तैयार किया जाता है।",
    gu: "પૂજા પહેલા તમારી જરૂરિયાત સમજીને વિધિને તે મુજબ ગોઠવીએ છીએ.",
  },
  feature_pricing_title: {
    en: "Transparent Pricing",
    hi: "पारदर्शी शुल्क",
    gu: "પારદર્શક કિંમત",
  },
  feature_pricing_desc: {
    en: "Clear pricing with no hidden costs. Know exactly what you're paying before booking.",
    hi: "पूरी तरह स्पष्ट शुल्क, बिना किसी छुपे हुए खर्च के। बुकिंग से पहले ही सब पता चले।",
    gu: "કોઈ છુપાયેલા ખર્ચ વગર સ્પષ્ટ કિંમત. બુકિંગ પહેલા જ બધું જાણી લો.",
  },
  // Footer
  footerQuickLinks: { en: "Quick Links", hi: "त्वरित लिंक", gu: "ઝડપી લિંક્સ" },
  footerPopularPoojas: { en: "Popular Pujas", hi: "लोकप्रिय पूजाएँ", gu: "લોકપ્રિય પૂજા" },
  footerContactUs: { en: "Contact Us", hi: "संपर्क करें", gu: "અમને સંપર્ક કરો" },
  footerBrandDesc: {
    en: "Authentic Vedic rituals performed by verified pandits with devotion and reverence.",
    hi: "प्रमाणित पंडितों द्वारा भक्ति और श्रद्धा के साथ प्रामाणिक वैदिक अनुष्ठान।",
    gu: "ભક્તિ અને આદર સાથે પ્રમાણિત પંડિતો દ્વારા સાચી વૈદિક વિધિઓ.",
  },
  footerCopyright: {
    en: "All rights reserved.",
    hi: "सर्वाधिकार सुरक्षित।",
    gu: "બધા અધિકારો સુરક્ષિત.",
  },
  footerBuiltWith: {
    en: "Built with",
    hi: "बनाया गया",
    gu: "બનાવેલ",
  },
  // Home CTA
  ctaBookNow: { en: "Book Now", hi: "अभी बुक करें", gu: "હવે બુક કરો" },
  ctaStartJourney: {
    en: "Start Your Journey",
    hi: "अपनी यात्रा शुरू करें",
    gu: "તમારી યાત્રા શરૂ કરો",
  },
  // Categories
  catOurOfferings: {
    en: "Our Offerings",
    hi: "हमारी सेवाएँ",
    gu: "અમારી ઓફરિંગ્સ",
  },
  catPoojaCategories: {
    en: "Puja Categories",
    hi: "पूजा श्रेणियाँ",
    gu: "પૂજા કેટેગરીઝ",
  },
  catSubtitle: {
    en: "Click any puja to view details, benefits, and book directly with our verified pandits.",
    hi: "विवरण, लाभ देखने और हमारे प्रमाणित पंडितों से सीधे बुक करने के लिए किसी भी पूजा पर क्लिक करें।",
    gu: "વિગતો, ફાયદા જોવા અને અમારા પ્રમાણિત પંડિતો સાથે સીધા બુક કરવા કોઈપણ પૂજા પર ક્લિક કરો.",
  },
  catBookNow: { en: "Book Now", hi: "अभी बुक करें", gu: "હવે બુક કરો" },
  // Success Stories
  successRealDevotees: {
    en: "Real Devotees",
    hi: "सच्चे भक्त",
    gu: "સાચા ભક્તો",
  },
  successBlessedJourney: {
    en: "Blessed Journey",
    hi: "आशीर्वादित यात्रा",
    gu: "આશીર્વાદિત યાત્રા",
  },
  successBookLink: { en: "Book", hi: "बुक करें", gu: "બુક કરો" },
  successStoryAwaits: {
    en: "Your Success Story Awaits",
    hi: "आपकी सफलता की कहानी इंतज़ार में है",
    gu: "તમારી સફળતાની વાર્તા રાહ જોઈ રહી છે",
  },
  successJoinThousands: {
    en: "Join thousands of families who have experienced the power of authentic Vedic rituals.",
    hi: "उन हजारों परिवारों में शामिल हों जिन्होंने प्रामाणिक वैदिक अनुष्ठानों की शक्ति का अनुभव किया है।",
    gu: "હજારો પરિવારોમાં જોડાઓ જેમણે સાચી વૈદિક વિધિઓની શક્તિનો અનુભવ કર્યો છે.",
  },
  // Book page
  bookSacredBooking: {
    en: "Sacred Booking",
    hi: "पवित्र बुकिंग",
    gu: "પવિત્ર બુકિંગ",
  },
  bookYourPooja: { en: "Book Your Puja", hi: "अपनी पूजा बुक करें", gu: "તમારી પૂજા બુક કરો" },
  bookFormSubtext: {
    en: "Fill in your details and our pandits will get in touch within 24 hours.",
    hi: "अपना विवरण भरें, हमारे पंडित 24 घंटे के भीतर संपर्क करेंगे।",
    gu: "તમારી વિગતો ભરો, અમારા પંડિત 24 કલાકમાં સંપર્ક કરશે.",
  },
  bookFormTitle: {
    en: "Booking Request Form",
    hi: "बुकिंग अनुरोध फॉर्म",
    gu: "બુકિંગ વિનંતી ફોર્મ",
  },
  bookFormRequired: {
    en: "All fields marked with * are required.",
    hi: "* वाले सभी क्षेत्र आवश्यक हैं।",
    gu: "* ચિહ્નિત બધા ક્ષેત્રો જરૂરી છે.",
  },
  bookLabelName: { en: "Full Name *", hi: "पूरा नाम *", gu: "પૂરું નામ *" },
  bookPlaceholderName: {
    en: "Your full name",
    hi: "आपका पूरा नाम",
    gu: "તમારું પૂરું નામ",
  },
  bookLabelPhone: { en: "Phone Number *", hi: "फ़ोन नंबर *", gu: "ફોન નંબર *" },
  bookPlaceholderPhone: {
    en: "+91 XXXXX XXXXX",
    hi: "+91 XXXXX XXXXX",
    gu: "+91 XXXXX XXXXX",
  },
  bookLabelEmail: { en: "Email Address *", hi: "ईमेल पता *", gu: "ઈમેલ સરનામું *" },
  bookPlaceholderEmail: {
    en: "your@email.com",
    hi: "your@email.com",
    gu: "your@email.com",
  },
  bookLabelPoojaCategory: { en: "Puja Category *", hi: "पूजा श्रेणी *", gu: "પૂજા કેટેગરી *" },
  bookPlaceholderCategory: {
    en: "Choose a category...",
    hi: "श्रेणी चुनें...",
    gu: "કેટેગરી પસંદ કરો...",
  },
  bookLabelPoojaType: { en: "Puja Type *", hi: "पूजा प्रकार *", gu: "પૂજા પ્રકાર *" },
  bookPlaceholderPooja: {
    en: "Choose a puja...",
    hi: "पूजा चुनें...",
    gu: "પૂજા પસંદ કરો...",
  },
  bookPoojaOther: { en: "Other", hi: "अन्य", gu: "અન્ય" },
  bookSuccessTitle: { en: "Thank You!", hi: "धन्यवाद!", gu: "આભાર!" },
  bookSuccessMessage: {
    en: "Your booking inquiry has been received. Our team will contact you shortly to finalize the details.",
    hi: "आपकी बुकिंग पूछताछ प्राप्त हो गई है। हमारी टीम विवरणों को अंतिम रूप देने के लिए आपसे शीघ्र ही संपर्क करेगी।",
    gu: "તમારી બુકિંગ પૂછપરછ મળી ગઈ છે. અમારી ટીમ વિગતોને અંતિમ સ્વરૂપ આપવા માટે ટૂંક સમયમાં તમારો સંપર્ક કરશે.",
  },
  bookLabelCity: { en: "City *", hi: "शहर *", gu: "શહેર *" },
  bookPlaceholderCity: {
    en: "Your city",
    hi: "आपका शहर",
    gu: "તમારું શહેર",
  },
  bookLabelMessage: {
    en: "Additional Details",
    hi: "अतिरिक्त विवरण",
    gu: "વધારાની વિગતો",
  },
  bookPlaceholderMessage: {
    en: "Any specific requirements or auspicious dates...",
    hi: "कोई विशेष आवश्यकता या शुभ तिथि...",
    gu: "કોઈ ચોક્કસ જરૂરિયાત અથવા શુભ તારીખ...",
  },
  bookSubmit: {
    en: "Submit Booking Request",
    hi: "बुकिंग अनुरोध भेजें",
    gu: "બુકિંગ વિનંતી મોકલો",
  },
  bookSubmitting: {
    en: "Submitting...",
    hi: "भेज रहे हैं...",
    gu: "મોકલી રહ્યા છીએ...",
  },
  bookLoading: { en: "Loading", hi: "लोड हो रहा है", gu: "લોડ થઈ રહ્યું છે" },
  bookSubmitError: { en: "Failed to submit booking. Please try again.", hi: "बुकिंग सबमिट करने में विफल। कृपया पुन: प्रयास करें।", gu: "બુકિંગ સબમિટ કરવામાં નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો." },
  dashBackToDashboard: { en: "Go to Dashboard", hi: "डैशबोर्ड पर वापस जाएं", gu: "ડેશબોર્ડ પર પાછા જાઓ" },
  // About
  aboutWhoWeAre: { en: "Who We Are", hi: "हम कौन हैं", gu: "અમે કોણ છીએ" },
  aboutTitle: { en: "About SatkarmPuja", hi: "SatkarmPuja के बारे में", gu: "SatkarmPuja વિષે" },
  aboutIntro: {
    en: "Preserving Vedic traditions and making authentic rituals accessible to modern families.",
    hi: "वैदिक परंपराओं को संरक्षित करना और आधुनिक परिवारों के लिए प्रामाणिक अनुष्ठान सुलभ बनाना।",
    gu: "વૈદિક પરંપરાઓને સાચવવી અને આધુનિક પરિવારો માટે સાચી વિધિઓ સુલભ બનાવવી.",
  },
  aboutOrgSectionTitle: {
    en: "About Our Organization",
    hi: "हमारी संस्था के बारे में",
    gu: "અમારી સંસ્થા વિશે",
  },
  aboutOrgDesc: {
    en: "SatkarmPuja is an organization where every type of puja is performed according to Vedic scriptures — including Devi-Deity patha, 1.25 lakh mantra jap, Navagraha Deva-Jap anushthan, Graha Shanti, Nakshatra Shanti, and large yagnas like Navchandi. Our pandits are trained in Vedic scriptures from places like Kashi, Prayagraj, Chitrakoot, Ayodhya, Mathura, and Vrindavan, and perform karma kaand.",
    hi: "सत्कर्मपूजा एक ऐसी संस्था है, जहां पर हर प्रकार की पूजा जैसे कि देवी-देवताओं का पाठ, १.२५ लाख मंत्र जाप, नवग्रह देव-जाप अनुष्ठान, ग्रहशांति, नक्षत्र शांति, और नवचंडी जैसे बड़े यज्ञ वैदिक शास्त्रों के अनुसार किये जाते हैं। हमारे यहां के पंडित काशी, प्रयागराज, चित्रकूट, अयोध्या, मथुरा, वृन्दावन जैसे स्थान से वैदिक शास्त्र की शिक्षा प्राप्त किये हुए हैं और कर्मकांड करते हैं।",
    gu: "સત્કર્મપૂજા એ એવી સંસ્થા છે જ્યાં દરેક પ્રકારની પૂજા વૈદિક શાસ્ત્રો અનુસાર કરવામાં આવે છે — દેવી-દેવતાઓનું પાઠ, ૧.૨૫ લાખ મંત્ર જાપ, નવગ્રહ દેવ-જાપ અનુષ્ઠાન, ગ્રહ શાંતિ, નક્ષત્ર શાંતિ અને નવચંડી જેવા મોટા યજ્ઞ સમાવેશિત છે. અમારા પંડિતો કાશી, પ્રયાગરાજ, ચિત્રકૂટ, અયોધ્યા, મથુરા અને વૃંદાવન જેવી જગ્યાઓથી વૈદિક શિક્ષણ લીધેલા છે અને કર્મકાંડ કરે છે.",
  },
  aboutGalleryAccent: { en: "Sacred Moments", hi: "पवित्र क्षण", gu: "પવિત્ર ક્ષણો" },
  aboutGalleryTitle: { en: "Pujas Performed", hi: "संपन्न पूजाएँ", gu: "સંપન્ન પૂજા" },
  aboutGallerySubtext: {
    en: "A glimpse of authentic Vedic rituals performed with devotion — swipe to see more.",
    hi: "भक्ति के साथ संपन्न प्रामाणिक वैदिक अनुष्ठानों की झलक — और देखने के लिए स्वाइप करें।",
    gu: "ભક્તિ સાથે સંપન્ન થયેલી પ્રમાણિક વૈદિક વિધિઓની ઝલક — વધુ જોવા માટે સ્વાઇપ કરો.",
  },
  aboutGallerySummary: {
    en: "These sacred moments reflect the highest standards of Vedic traditions we uphold at SatkarmPuja. Each ceremony is meticulously arranged to ensure divine blessings, peace, and spiritual uplifting for your family.",
    hi: "ये पवित्र क्षण उन उच्चतम वैदिक परंपराओं को दर्शाते हैं जिनका हम सत्कर्मपूजा में पालन करते हैं। प्रत्येक समारोह को आपके परिवार के लिए दिव्य आशीर्वाद, शांति और आध्यात्मिक उत्थान सुनिश्चित करने के लिए सावधानीपूर्वक व्यवस्थित किया जाता है।",
    gu: "આ પવિત્ર ક્ષણો સત્કર્મપૂજા પર આપણે જે સર્વોચ્ચ વૈદિક પરંપરાઓનું પાલન કરીએ છીએ તે દર્શાવે છે. તમારા પરિવાર માટે દિવ્ય આશીર્વાદ, શાંતિ અને આધ્યાત્મિક ઉત્થાનની ખાતરી કરવા માટે દરેક સમારોહ સાવચેતીપૂર્વક કરવામાં આવે છે."
  },
  aboutGalleryCaption_g1: { en: "Navachandi Yagna Setup", hi: "नवचंडी यज्ञ की तैयारी", gu: "નવચંડી યજ્ઞની તૈયારી" },
  aboutGalleryCaption_g2: { en: "Vedic Havan & Offerings", hi: "वैदिक हवन और आहुतियां", gu: "વૈદિક હવન અને આહુતિઓ" },
  aboutGalleryCaption_g3: { en: "Divine Altar Preparation", hi: "दिव्य वेदी की सजावट", gu: "દિવ્ય વેદીની સજાવટ" },
  aboutGalleryCaption_g4: { en: "Pooja Performed by Learned Pandits", hi: "विद्वान पंडितों द्वारा संपन्न पूजा", gu: "વિદ્વાન પંડિતો દ્વારા સંપન્ન પૂજા" },
  aboutGalleryCaption_g5: { en: "Sacred Shivling Abhishekam Setup", hi: "पवित्र शिवलिंग अभिषेक की तैयारी", gu: "પવિત્ર શિવલિંગ અભિષેકની તૈયારી" },
  aboutOurMission: { en: "Our Mission", hi: "हमारा मिशन", gu: "અમારું મિશન" },
  aboutMissionText: {
    en: "To bridge the gap between devotees and authentic Vedic rituals by providing verified pandits who perform ceremonies with true devotion, knowledge, and spiritual integrity. We make sacred rituals accessible to every family regardless of location.",
    hi: "भक्तों और प्रामाणिक वैदिक अनुष्ठानों के बीच की खाई को पाटने के लिए प्रमाणित पंडित उपलब्ध कराना जो सच्ची भक्ति, ज्ञान और आध्यात्मिक ईमानदारी के साथ समारोह करते हैं। हम पवित्र अनुष्ठान हर परिवार के लिए सुलभ बनाते हैं।",
    gu: "ભક્તો અને સાચી વૈદિક વિધિઓ વચ્ચેનો અંતર ભરવા પ્રમાણિત પંડિતો પૂરા પાડવા જે સાચી ભક્તિ, જ્ઞાન અને આધ્યાત્મિક ઈમાનદારી સાથે વિધિઓ કરે છે. અમે પવિત્ર વિધિઓ દરેક પરિવાર માટે સુલભ બનાવીએ છીએ.",
  },
  aboutOurVision: { en: "Our Vision", hi: "हमारी दृष्टि", gu: "અમારી દ્રષ્ટિ" },
  aboutVisionText: {
    en: "To become the most trusted platform for Vedic ceremonies across India — a place where every family finds the right pandit for their sacred occasions, supported by technology while rooted in timeless tradition.",
    hi: "भारत भर में वैदिक समारोहों के लिए सबसे विश्वसनीय प्लेटफ़ॉर्म बनना — जहाँ हर परिवार को अपने पवित्र अवसरों के लिए सही पंडित मिले, तकनीक के साथ लेकिन शाश्वत परंपरा में निहित।",
    gu: "ભારત ભરમાં વૈદિક સમારોહો માટે સૌથી વિશ્વસનીય પ્લેટફોર્મ બનવું — જ્યાં દરેક પરિવારને તેમની પવિત્ર પ્રસંગો માટે સાચો પંડિત મળે, ટેકનોલોજી સાથે પરંપરામાં મૂળ.",
  },
  aboutCoreValues: { en: "Our Core Values", hi: "हमारे मूल मूल्य", gu: "અમારા મૂળ મૂલ્યો" },
  aboutWhatWeStand: { en: "What We Stand For", hi: "हम किसके लिए खड़े हैं", gu: "અમે શેના માટે ઊભા છીએ" },
  aboutValueDevotion: { en: "Devotion", hi: "भक्ति", gu: "ભક્તિ" },
  aboutValueDevotionDesc: {
    en: "Every ritual is performed with complete devotion and spiritual focus.",
    hi: "हर अनुष्ठान पूरी भक्ति और आध्यात्मिक ध्यान के साथ किया जाता है।",
    gu: "દરેક વિધિ સંપૂર્ણ ભક્તિ અને આધ્યાત્મિક ધ્યાન સાથે કરવામાં આવે છે.",
  },
  aboutValueAuthenticity: { en: "Authenticity", hi: "प्रामाणिकता", gu: "પ્રામાણિકતા" },
  aboutValueAuthenticityDesc: {
    en: "We adhere strictly to ancient Vedic texts and traditions.",
    hi: "हम प्राचीन वैदिक ग्रंथों और परंपराओं का कड़ाई से पालन करते हैं।",
    gu: "અમે પ્રાચીન વૈદિક ગ્રંથો અને પરંપરાઓનું કડકપણે પાલન કરીએ છીએ.",
  },
  aboutValueExcellence: { en: "Excellence", hi: "उत्कृष्टता", gu: "ઉત્કૃષ્ટતા" },
  aboutValueExcellenceDesc: {
    en: "Premium service quality with no compromise on sacred traditions.",
    hi: "पवित्र परंपराओं पर कोई समझौता किए बिना प्रीमियम सेवा गुणवत्ता।",
    gu: "પવિત્ર પરંપરાઓ પર કોઈ સમાધાન વગર પ્રીમિયમ સેવા ગુણવત્તા.",
  },
  aboutValueTrust: { en: "Trust", hi: "विश्वास", gu: "વિશ્વાસ" },
  aboutValueTrustDesc: {
    en: "Building long-term relationships with families across India.",
    hi: "भारत भर के परिवारों के साथ दीर्घकालिक संबंध बनाना।",
    gu: "ભારત ભરના પરિવારો સાથે લાંબા ગાળાના સંબંધો બનાવવા.",
  },
  aboutExperienceSacred: {
    en: "Experience Sacred Traditions",
    hi: "पवित्र परंपराओं का अनुभव करें",
    gu: "પવિત્ર પરંપરાઓનો અનુભવ કરો",
  },
  aboutExperienceSubtext: {
    en: "Book your personalized Vedic ritual with our verified pandits today.",
    hi: "आज ही हमारे प्रमाणित पंडितों के साथ अपनी व्यक्तिगत वैदिक पूजा बुक करें।",
    gu: "આજે જ અમારા પ્રમાણિત પંડિતો સાથે તમારી વ્યક્તિગત વૈદિક વિધિ બુક કરો.",
  },
  // Contact
  contactReachOut: { en: "Reach Out", hi: "संपर्क करें", gu: "સંપર્ક કરો" },
  contactTitle: { en: "Contact Us", hi: "संपर्क करें", gu: "અમને સંપર્ક કરો" },
  contactSubtext: {
    en: "We're here to help you find the perfect puja for your needs.",
    hi: "हम आपकी जरूरतों के लिए सही पूजा खोजने में मदद करने के लिए यहाँ हैं।",
    gu: "અમે તમારી જરૂરિયાતો માટે સંપૂર્ણ પૂજા શોધવામાં મદદ કરવા અહીં છીએ.",
  },
  contactBookingSectionTitle: {
    en: "Book Puja Easily",
    hi: "पूजा आसानी से बुक करें",
    gu: "પૂજા સરળતાથી બુક કરો",
  },
  contactBookingEasy: {
    en: "Booking pooja-paath has now become very easy. Book a puja in your name and benefit from online puja with pandits from Kashi, Mathura, and Chitrakoot right from your home. For more information, contact our pandit ji.",
    hi: "अब पूजा-पाठ करवाना बहुत ही आसान हो गया। अपने नाम की पूजा बुक करें और काशी, मथुरा, चित्रकूट के पंडितों से घर बैठे ऑनलाइन पूजा का लाभ लें। अधिक जानकारी के लिए हमारे पंडितजी से संपर्क करें।",
    gu: "હવે પૂજા-પાઠ કરાવવું ખૂબ જ સરળ થઈ ગયું છે. તમારા નામની પૂજા બુક કરો અને કાશી, મથુરા અને ચિત્રકૂટના પંડિતો પાસેથી ઘરે બેઠા ઓનલાઇન પૂજાનો લાભ લો. વધુ માહિતી માટે અમારા પંડિતજીને સંપર્ક કરો.",
  },
  contactCallUs: { en: "Call Us", hi: "कॉल करें", gu: "અમને કૉલ કરો" },
  contactEmailUs: { en: "Email Us", hi: "ईमेल करें", gu: "ઈમેલ કરો" },
  contactAvailableHours: {
    en: "Available Hours",
    hi: "उपलब्ध समय",
    gu: "ઉપલબ્ધ સમય",
  },
  contactHoursWeekday: {
    en: "Monday – Saturday: 9:00 AM – 8:00 PM",
    hi: "सोमवार – शनिवार: सुबह 9:00 – रात 8:00",
    gu: "સોમવાર – શનિવાર: સવાર 9:00 – રાત 8:00",
  },
  contactHoursSunday: {
    en: "Sunday: 10:00 AM – 6:00 PM",
    hi: "रविवार: सुबह 10:00 – शाम 6:00",
    gu: "રવિવાર: સવાર 10:00 – સાંજ 6:00",
  },
  contactResponseTime: {
    en: "We typically respond within 2-4 hours during business hours.",
    hi: "हम आमतौर पर कार्य समय के दौरान 2-4 घंटे में जवाब देते हैं।",
    gu: "અમે સામાન્ય રીતે કાર્ય સમય દરમિયાન 2-4 કલાકમાં જવાબ આપીએ છીએ.",
  },
  // Puja Detail
  poojaNotFound: { en: "Puja not found.", hi: "पूजा नहीं मिली।", gu: "પૂજા મળી નથી." },
  poojaBackToCategories: {
    en: "Back to Categories",
    hi: "श्रेणियों में वापस",
    gu: "કેટેગરીઝ પર પાછા",
  },
  poojaDuration: { en: "Duration", hi: "अवधि", gu: "અવધિ" },
  poojaKeyBenefits: { en: "Key Benefits", hi: "मुख्य लाभ", gu: "મુખ્ય ફાયદા" },
  poojaRitualProcess: { en: "Ritual Process", hi: "अनुष्ठान प्रक्रिया", gu: "વિધિ પ્રક્રિયા" },
  poojaImportantInfo: { en: "Important Info", hi: "महत्वपूर्ण जानकारी", gu: "મહત્વપૂર્ણ માહિતી" },
  poojaBestFor: { en: "Best For", hi: "सर्वोत्तम", gu: "શ્રેષ્ઠ" },
  poojaWhenToPerform: {
    en: "When to Perform",
    hi: "कब करें",
    gu: "ક્યારે કરવું",
  },
  poojaStartingFrom: {
    en: "Starting From",
    hi: "शुरुआत",
    gu: "શરૂઆત",
  },
  poojaPriceNote: {
    en: "Price may vary based on location & customization",
    hi: "स्थान और अनुकूलन के आधार पर कीमत अलग हो सकती है",
    gu: "સ્થાન અને કસ્ટમાઇઝેશન પર આધારિત કિંમત બદલાઈ શકે છે",
  },
  poojaAskQuestions: {
    en: "Ask Questions",
    hi: "प्रश्न पूछें",
    gu: "પ્રશ્નો પૂછો",
  },
  poojaWhyChooseUs: { en: "Why Choose Us?", hi: "हमें क्यों चुनें?", gu: "અમને કેમ પસંદ કરો?" },
  poojaSidebarVerified: { en: "Verified Pandits", hi: "प्रमाणित पंडित", gu: "સત્યાપિત પંડિતો" },
  poojaSidebarPricing: { en: "Transparent Pricing", hi: "पारदर्शी शुल्क", gu: "પારદર્શક કિંમત" },
  poojaSidebarAuthentic: { en: "Authentic Rituals", hi: "प्रामाणिक अनुष्ठान", gu: "સાચી વિધિઓ" },
  poojaSidebarConsult: {
    en: "Personal Consultation",
    hi: "व्यक्तिगत परामर्श",
    gu: "વ્યક્તિગત માર્ગદર્શન",
  },
  // Category: Graha Shanti
  cat_graha_name: {
    en: "Graha Shanti Puja",
    hi: "ग्रह शांति पूजा",
    gu: "ગ્રહ શાંતિ પૂજા",
  },
  cat_graha_subtitle: {
    en: "Planetary Peace & Balance",
    hi: "ग्रह शांति और संतुलन",
    gu: "ગ્રહ શાંતિ અને સંતુલન",
  },
  cat_graha_desc: {
    en: "Pacify planetary influences and restore cosmic harmony in your life and family.",
    hi: "ग्रहों के प्रभाव को शांत करें और अपने जीवन तथा परिवार में ब्रह्मांडीय सामंजस्य बहाल करें।",
    gu: "ગ્રહ પ્રભાવો શાંત કરો અને તમારા જીવન અને પરિવારમાં કોસ્મિક સંવાદિતા પાછી લાવો.",
  },
  // Category: Dev Puja & Mantra Jap
  cat_dev_name: {
    en: "Dev Puja & Mantra Jap",
    hi: "देव पूजा और मंत्र जाप",
    gu: "દેવ પૂજા અને મંત્ર જાપ",
  },
  cat_dev_subtitle: {
    en: "Divine Worship & Sacred Chanting",
    hi: "दिव्य पूजा और पवित्र जाप",
    gu: "દિવ્ય પૂજા અને પવિત્ર જાપ",
  },
  cat_dev_desc: {
    en: "Sacred rituals honoring divine deities for blessings, protection, and spiritual growth.",
    hi: "आशीर्वाद, सुरक्षा और आध्यात्मिक विकास के लिए दिव्य देवताओं का सम्मान करने वाले पवित्र अनुष्ठान।",
    gu: "આશીર્વાદ, સંરક્ષણ અને આધ્યાત્મિક વિકાસ માટે દિવ્ય દેવતાઓનું સન્માન કરતી પવિત્ર વિધિઓ.",
  },
  // Category: Dosh Nivaran
  cat_dosh_name: {
    en: "Dosh Nivaran & Special Vidhan",
    hi: "दोष निवारण और विशेष विधान",
    gu: "દોષ નિવારણ અને વિશેષ વિધાન",
  },
  cat_dosh_subtitle: {
    en: "Doshas Resolution & Remedial Rituals",
    hi: "दोष समाधान और उपचारात्मक अनुष्ठान",
    gu: "દોષ ઉકેલ અને ઉપચારાત્મક વિધિઓ",
  },
  cat_dosh_desc: {
    en: "Specialized rituals to address astrological doshas and karmic afflictions.",
    hi: "ज्योतिषीय दोषों और कर्मिक कष्टों को दूर करने के लिए विशेष अनुष्ठान।",
    gu: "જ્યોતિષીય દોષો અને કર્મિક વિકારોને દૂર કરવા માટે વિશેષ વિધિઓ.",
  },
  // Category: Nakshatra Shanti
  cat_nakshatra_name: {
    en: "Nakshatra Shanti Puja",
    hi: "नक्षत्र शांति पूजा",
    gu: "નક્ષત્ર શાંતિ પૂજા",
  },
  cat_nakshatra_subtitle: {
    en: "Birth Star Pacification & Harmony",
    hi: "जन्म नक्षत्र शांति और सामंजस्य",
    gu: "જન્મ નક્ષત્ર શાંતિ અને સંવાદિતા",
  },
  cat_nakshatra_desc: {
    en: "Bring harmony and peace by pacifying the influences of your birth nakshatra.",
    hi: "अपने जन्म नक्षत्र के प्रभावों को शांत करके सामंजस्य और शांति लाएं।",
    gu: "તમારા જન્મ નક્ષત્રના પ્રભાવો શાંત કરીને સંવાદિતા અને શાંતિ લાવો.",
  },
  // Puja list names (Categories page)
  pooja_navagraha_shanti_name: { en: "Navagraha Shanti", hi: "नवग्रह शांति", gu: "નવગ્રહ શાંતિ" },
  pooja_surya_grah_shanti_name: { en: "Surya Grah Shanti", hi: "सूर्य ग्रह शांति", gu: "સૂર્ય ગ્રહ શાંતિ" },
  pooja_chandra_grah_shanti_name: { en: "Chandra Grah Shanti", hi: "चंद्र ग्रह शांति", gu: "ચંદ્ર ગ્રહ શાંતિ" },
  pooja_mangal_grah_shanti_name: { en: "Mangal Grah Shanti", hi: "मंगल ग्रह शांति", gu: "મંગળ ગ્રહ શાંતિ" },
  pooja_budh_grah_shanti_name: { en: "Budh Grah Shanti", hi: "बुध ग्रह शांति", gu: "બુધ ગ્રહ શાંતિ" },
  pooja_guru_grah_shanti_name: { en: "Guru Grah Shanti", hi: "गुरु ग्रह शांति", gu: "ગુરુ ગ્રહ શાંતિ" },
  pooja_shukra_grah_shanti_name: { en: "Shukra Grah Shanti", hi: "शुक्र ग्रह शांति", gu: "શુક્ર ગ્રહ શાંતિ" },
  pooja_shani_grah_shanti_name: { en: "Shani Grah Shanti", hi: "शनि ग्रह शांति", gu: "શનિ ગ્રહ શાંતિ" },
  pooja_rahu_grah_shanti_name: { en: "Rahu Grah Shanti", hi: "राहु ग्रह शांति", gu: "રાહુ ગ્રહ શાંતિ" },
  pooja_ketu_grah_shanti_name: { en: "Ketu Grah Shanti", hi: "केतु ग्रह शांति", gu: "કેતુ ગ્રહ શાંતિ" },
  pooja_rudrabhishek_name: { en: "Rudrabhishek Puja", hi: "रुद्राभिषेक पूजा", gu: "રુદ્રાભિષેક પૂજા" },
  pooja_durga_saptashati_name: { en: "Durga Saptashati Puja", hi: "दुर्गा सप्तशती पूजा", gu: "દુર્ગા સપ્તશતી પૂજા" },
  pooja_ganesh_pooja_name: { en: "Ganesh Puja", hi: "गणेश पूजा", gu: "ગણેશ પૂજા" },
  pooja_hanuman_pooja_name: { en: "Hanuman Puja", hi: "हनुमान पूजा", gu: "હનુમાન પૂજા" },
  pooja_vishnu_pooja_name: { en: "Vishnu Puja", hi: "विष्णु पूजा", gu: "વિષ્ણુ પૂજા" },
  pooja_lakshmi_pooja_name: { en: "Lakshmi Puja", hi: "लक्ष्मी पूजा", gu: "લક્ષ્મી પૂજા" },
  pooja_maha_mrityunjay_name: { en: "Maha Mrityunjay Mantra Jap", hi: "महा मृत्युंजय मंत्र जाप", gu: "મહા મૃત્યુંજય મંત્ર જાપ" },
  pooja_maha_mrityunjay_havan_name: { en: "Maha Mrityunjay Mantra Jap with havan", hi: "हवन के साथ महा मृत्युंजय मंत्र जाप", gu: "હવન સાથે મહા મૃત્યુંજય મંત્ર જાપ" },
  pooja_durga_navarna_name: { en: "Durga Navarna Mantra Jap", hi: "दुर्गा नवार्ण मंत्र जाप", gu: "દુર્ગા નવાર્ણ મંત્ર જાપ" },
  pooja_durga_navarna_havan_name: { en: "Durga Navarna Mantra Jap with havan", hi: "हवन के साथ दुर्गा नवार्ण मंत्र जाप", gu: "હવન સાથે દુર્ગા નવાર્ણ મંત્ર જાપ" },
  pooja_maha_mrityunjay_havan_subtitle: { en: "Victory Over Death & Disease with Sacred Fire", hi: "पवित्र अग्नि के साथ मृत्यु और रोग पर विजय", gu: "પવિત્ર અગ્નિ સાથે મૃત્યુ અને રોગ પર વિજય" },
  pooja_maha_mrityunjay_havan_description: { en: "This comprehensive ritual includes the powerful Maha Mrityunjay Mantra Jap followed by a sacred Havan. It invokes Lord Shiva for ultimate protection, healing, and spiritual strength.", hi: "इस व्यापक अनुष्ठान में शक्तिशाली महा मृत्युंजय मंत्र जाप और उसके बाद पवित्र हवन शामिल है। यह परम सुरक्षा, उपचार और आध्यात्मिक शक्ति के लिए भगवान शिव का आह्वान करता है।", gu: "આ વ્યાપક અનુષ્ઠાનમાં શક્તિશાળી મહા મૃત્યુંજય મંત્ર જાપ અને ત્યારબાદ પવિત્ર હવનનો સમાવેશ થાય છે. તે પરમ સુરક્ષા, ઉપચાર અને આધ્યાત્મિક શક્તિ માટે ભગવાન શિવનું આહ્વાન કરે છે।" },
  pooja_maha_mrityunjay_havan_bestFor: { en: "Those seeking recovery from illness or divine protection", hi: "बीमारी से उबरने या दैवीय सुरक्षा चाहने वालों के लिए", gu: "બીમારીમાંથી સાજા થવા અથવા દૈવી સુરક્ષા ઈચ્છતા લોકો માટે" },
  pooja_maha_mrityunjay_havan_whenToPerform: { en: "Mondays or during Full Moon", hi: "सोमवार या पूर्णिमा के दौरान", gu: "સોમવાર અથવા પૂર્ણિમા દરમિયાન" },
  pooja_maha_mrityunjay_havan_benefit_0: { en: "Heals chronic diseases and health issues", hi: "पुरानी बीमारियों और स्वास्थ्य समस्याओं को ठीक करता है", gu: "જૂની બીમારીઓ અને સ્વાસ્થ્ય સમસ્યાઓ મટાડે છે" },
  pooja_maha_mrityunjay_havan_benefit_1: { en: "Protects from accidents and untimely death", hi: "दुर्घटनाओं और अकाल मृत्यु से रक्षा करता है", gu: "અકસ્માતો અને અકાળ મૃત્યુથી રક્ષણ આપે છે" },
  pooja_maha_mrityunjay_havan_benefit_2: { en: "Removes fear and mental distress", hi: "डर और मानसिक परेशानी दूर करता है", gu: "ડર અને માનસિક તણાવ દૂર કરે છે" },
  pooja_maha_mrityunjay_havan_benefit_3: { en: "Enhances longevity and vitality", hi: "दीर्घायु और जीवन शक्ति बढ़ाता है", gu: "દીર્ધાયુષ્ય અને જોમ વધારે છે" },
  pooja_maha_mrityunjay_havan_benefit_4: { en: "Brings peace and spiritual growth", hi: "शांति और आध्यात्मिक विकास लाता है", gu: "શાંતિ અને આધ્યાત્મિક વિકાસ લાવે છે" },
  pooja_maha_mrityunjay_havan_benefit_5: { en: "Ensures overall family protection", hi: "पूरे परिवार की सुरक्षा सुनिश्चित करता है", gu: "સમગ્ર પરિવારની સુરક્ષા સુનિશ્ચિત કરે છે" },
  pooja_maha_mrityunjay_havan_process_0: { en: "Space purification and Ganpati Sthapana", hi: "स्थान शुद्धि और गणपति स्थापना", gu: "સ્થાન શુદ્ધિ અને ગણપતિ સ્થાપના" },
  pooja_maha_mrityunjay_havan_process_1: { en: "Invocation of Lord Shiva", hi: "भगवान शिव का आह्वान", gu: "ભગવાન શિવનું આહ્વાન" },
  pooja_maha_mrityunjay_havan_process_2: { en: "Maha Mrityunjay Mantra Jap (1.25 lakh count)", hi: "महा मृत्युंजय मंत्र जाप (1.25 लाख संख्या)", gu: "મહા મૃત્યુંજય મંત્ર જાપ (1.25 લાખ સંખ્યા)" },
  pooja_maha_mrityunjay_havan_process_3: { en: "Sacred Havan with specific herbs", hi: "विशिष्ट जड़ी-बूटियों के साथ पवित्र हवन", gu: "ચોક્કસ જડીબુટ્ટીઓ સાથે પવિત્ર હવન" },
  pooja_maha_mrityunjay_havan_process_4: { en: "Purnaahuti and Aarti ritual", hi: "पूर्णाहुति और आरती अनुष्ठान", gu: "પૂર્ણાહુતિ અને આરતી વિધિ" },
  pooja_maha_mrityunjay_havan_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_maha_mrityunjay_havan_duration: { en: "2 days (approx. 8-10 hours per day)", hi: "2 दिन (लगभग 8-10 घंटे प्रति दिन)", gu: "2 દિવસ (દરરોજ આશરે 8-10 કલાક)" },
  pooja_durga_navarna_havan_duration: { en: "2 days (approx. 8-10 hours per day)", hi: "2 दिन (लगभग 8-10 घंटे प्रति दिन)", gu: "2 દિવસ (દરરોજ આશરે 8-10 કલાક)" },
  pooja_durga_navarna_havan_subtitle: { en: "Divine Protection with Nine Sacred Names & Havan", hi: "नौ पवित्र नामों और हवन के साथ दिव्य सुरक्षा", gu: "નવ પવિત્ર નામો અને હવન સાથે દિવ્ય સુરક્ષા" },
  pooja_durga_navarna_havan_description: { en: "This ritual combines the chanting of Durga Navarna Mantra with a sacred Havan. It invokes the nine forms of Goddess Durga to remove obstacles and grant victory over challenges.", hi: "यह अनुष्ठान दुर्गा नवार्ण मंत्र के जाप को पवित्र हवन के साथ जोड़ता है। यह बाधाओं को दूर करने और चुनौतियों पर विजय पाने के लिए देवी दुर्गा के नौ रूपों का आह्वान करता है।", gu: "આ અનુષ્ઠાન દુર્ગા નવાર્ણ મંત્રના જાપને પવિત્ર હવન સાથે જોડે છે. તે અવરોદોને દૂર કરવા અને પડકારો પર વિજય મેળવવા માટે દેવી દુર્ગાના નવ રૂપોનું આહ્વાન કરે છે।" },
  pooja_durga_navarna_havan_bestFor: { en: "Those seeking victory over obstacles or success in new ventures", hi: "बाधाओं पर विजय या नए उद्यमों में सफलता चाहने वालों के लिए", gu: "અવરોધો પર વિજય અથવા નવા સાહસોમાં સફળતા ઈચ્છતા લોકો માટે" },
  pooja_durga_navarna_havan_whenToPerform: { en: "Navratri or Tuesdays", hi: "नवरात्रि या मंगलवार", gu: "નવરાત્રી અથવા મંગળવાર" },
  pooja_durga_navarna_havan_benefit_0: { en: "Removes all life obstacles and hurdles", hi: "जीवन की सभी बाधाओं और अड़चनों को दूर करता है", gu: "જીવનના તમામ અવરોધો અને અડચણો દૂર કરે છે" },
  pooja_durga_navarna_havan_benefit_1: { en: "Brings victory in legal and personal battles", hi: "कानूनी और व्यक्तिगत लड़ाइयों में जीत दिलाता है", gu: "કાનૂની અને વ્યક્તિગત લડાઈમાં વિજય અપાવે છે" },
  pooja_durga_navarna_havan_benefit_2: { en: "Provides strong divine protection", hi: "मजबूत दैवीय सुरक्षा प्रदान करता है", gu: "મજબૂત દૈવી સુરક્ષા પૂરી પાડે છે" },
  pooja_durga_navarna_havan_benefit_3: { en: "Removes negative energies and evil eye", hi: "नकारात्मक ऊर्जा और बुरी नजर को दूर करता है", gu: "નકારાત્મક ઉર્જા અને બુરી નજર દૂર કરે છે" },
  pooja_durga_navarna_havan_benefit_4: { en: "Brings prosperity and abundance", hi: "समृद्धि और प्रचुरता लाता है", gu: "સમૃદ્ધિ અને વિપુલતા લાવે છે" },
  pooja_durga_navarna_havan_benefit_5: { en: "Ensures mental and physical strength", hi: "मानसिक और शारीरिक शक्ति सुनिश्चित करता है", gu: "માનસિક અને શારીરિક શક્તિ સુનિશ્ચિત કરે છે" },
  pooja_durga_navarna_havan_process_0: { en: "Purification and Kalash Sthapana", hi: "शुद्धि और कलश स्थापना", gu: "શુદ્ધિ અને કળશ સ્થાપના" },
  pooja_durga_navarna_havan_process_1: { en: "Invocation of Goddess Durga", hi: "देवी दुर्गा का आह्वान", gu: "દેવી દુર્ગાનું આહ્વાન" },
  pooja_durga_navarna_havan_process_2: { en: "Durga Navarna Mantra Jap (1.25 lakh count)", hi: "दुर्गा नवार्ण मंत्र जाप (1.25 लाख संख्या)", gu: "દુર્ગા નવાર્ણ મંત્ર જાપ (1.25 લાખ સંખ્યા)" },
  pooja_durga_navarna_havan_process_3: { en: "Sacred Havan with Dashamsha", hi: "दशांश के साथ पवित्र हवन", gu: "દશાંશ સાથે પવિત્ર હવન" },
  pooja_durga_navarna_havan_process_4: { en: "Extended Aarti and Purnaahuti", hi: "विस्तृत आरती और पूर्णाहुति", gu: "વિસ્તૃત આરતી અને પૂર્ણાહુતિ" },
  pooja_durga_navarna_havan_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_kaal_sarp_dosh_name: {
    en: "Kaal Sarp Dosh Nivaran Puja",
    hi: "काल सर्प दोष निवारण पूजा",
    gu: "કાલ સર્પ દોષ નિવારણ પૂજા",
  },
  pooja_surya_shani_dosh_name: {
    en: "Surya-Shani Shapit Dosh Shanti Vidhan",
    hi: "सूर्य-शनि शापित दोष शांति विधान",
    gu: "સૂર્ય-શનિ શાપિત દોષ શાંતિ વિધાન",
  },
  pooja_surya_rahu_dosh_name: {
    en: "Surya-Rahu Grahan Dosh Shanti Vidhan",
    hi: "सूर्य-राहु ग्रहण दोष शांति विधान",
    gu: "સૂર્ય-રાહુ ગ્રહણ દોષ શાંતિ વિધાન",
  },
  pooja_surya_ketu_dosh_name: {
    en: "Surya-Ketu Grahan Dosh Shanti Vidhan",
    hi: "सूर्य-केतु ग्रहण दोष शांति विधान",
    gu: "સૂર્ય-કેતુ ગ્રહણ દોષ શાંતિ વિધાન",
  },
  pooja_surya_mangal_dosh_name: {
    en: "Surya-Mangal Angarak Dosh Shanti Vidhan",
    hi: "सूर्य-मंगल अंगारक दोष शांति विधान",
    gu: "સૂર્ય-મંગળ અંગારક દોષ શાંતિ વિધાન",
  },
  pooja_surya_chandra_dosh_name: {
    en: "Surya-Chandra Amavasya Dosh Shanti Vidhan",
    hi: "सूर्य-चंद्र अमावस्या दोष शांति विधान",
    gu: "સૂર્ય-ચંદ્ર અમાવસ્યા દોષ શાંતિ વિધાન",
  },
  pooja_surya_chandra_amavasya_dosh_name: {
    en: "Surya-Chandra Amavasya Dosh Shanti Vidhan",
    hi: "सूर्य-चंद्र अमावस्या दोष शांति विधान",
    gu: "સૂર્ય-ચંદ્ર અમાવસ્યા દોષ શાંતિ વિધાન",
  },
  pooja_shani_rahu_dosh_name: {
    en: "Shani-Rahu Shapit Dosh Shanti Vidhan",
    hi: "शनि-राहु शापित दोष शांति विधान",
    gu: "શનિ-રાહુ શાપિત દોષ શાંતિ વિધાન",
  },
  pooja_shani_ketu_dosh_name: {
    en: "Shani-Ketu Shapit Dosh Shanti Vidhan",
    hi: "शनि-केतु शापित दोष शांति विधान",
    gu: "શનિ-કેતુ શાપિત દોષ શાંતિ વિધાન",
  },
  pooja_shani_chandra_vish_yog_dosh_name: {
    en: "Shani-Chandra Vish Yog Shanti Vidhan",
    hi: "शनि-चंद्र विष योग शांति विधान",
    gu: "શનિ-ચંદ્ર વિષ યોગ શાંતિ વિધાન",
  },
  pooja_mangal_rahu_dosh_name: {
    en: "Mangal-Rahu Angarak Dosh Shanti Vidhan",
    hi: "मंगल-राहु अंगारक दोष शांति विधान",
    gu: "મંગળ-રાહુ અંગારક દોષ શાંતિ વિધાન",
  },
  pooja_mangal_ketu_dosh_name: {
    en: "Mangal-Ketu Angarak Dosh Shanti Vidhan",
    hi: "मंगल-केतु अंगारक दोष शांति विधान",
    gu: "મંગળ-ਕੇતુ અંગારક દોષ શાંતિ વિધાન",
  },
  pooja_guru_rahu_dosh_name: {
    en: "Guru-Rahu Chandal Dosh Shanti Vidhan",
    hi: "गुरु-राहु चंडाल दोष शांति विधान",
    gu: "ગુરુ-રાહુ ચંડાલ દોષ શાંતિ વિધાન",
  },
  pooja_guru_ketu_dosh_name: {
    en: "Guru-Ketu Chandal Dosh Shanti Vidhan",
    hi: "गुरु-केतु चंडाल दोष शांति विधान",
    gu: "ગુરુ-કેતુ ચંડાલ દોષ શાંતિ વિધાન",
  },
  pooja_chandra_rahu_dosh_name: {
    en: "Chandra-Rahu Grahan Dosh Shanti Vidhan",
    hi: "चंद्र-राहु ग्रहण दोष शांति विधान",
    gu: "ચંદ્ર-રાહુ ગ્રહણ દોષ શાંતિ વિધાન",
  },
  pooja_chandra_ketu_dosh_name: {
    en: "Chandra-Ketu Grahan Dosh Shanti Vidhan",
    hi: "चंद्र-केतु ग्रहण दोष शांति विधान",
    gu: "ચંદ્ર-કેતુ ગ્રહણ દોષ શાંતિ વિધાન",
  },
  pooja_laghu_rudra_name: {
    en: "Homatmak Laghu Rudra Puja",
    hi: "होमात्मक लघु रुद्र पूजा",
    gu: "હોમાત્મિક લઘુ રુદ્ર પૂજા",
  },
  pooja_navchandi_yagna_name: { en: "Navchandi Yagna", hi: "नवचंडी यज्ञ", gu: "નવચંડી યજ્ઞ" },
  pooja_revati_nakshatra_name: { en: "Revati Nakshatra Shanti Vidhan", hi: "रेवती नक्षत्र शांति विधान", gu: "રેવતી નક્ષત્ર શાંતિ વિધાન" },
  pooja_mool_nakshatra_name: { en: "Mool Nakshatra Shanti Vidhan", hi: "मूल नक्षत्र शांति विधान", gu: "મૂળ નક્ષત્ર શાંતિ વિધાન" },
  pooja_magha_nakshatra_name: { en: "Magha Nakshatra Shanti Vidhan", hi: "मघा नक्षत्र शांति विधान", gu: "મઘા નક્ષત્ર શાંતિ વિધાન" },
  pooja_jyestha_nakshatra_name: { en: "Jyestha Nakshatra Shanti Vidhan", hi: "ज्येष्ठ नक्षत्र शांति विधान", gu: "જ્યેષ્ઠ નક્ષત્ર શાંતિ વિધાન" },
  pooja_ashwini_nakshatra_name: { en: "Ashwini Nakshatra Shanti Vidhan", hi: "अश्विनी नक्षत्र शांति विधान", gu: "અશ્વિની નક્ષત્ર શાંતિ વિધાન" },
  pooja_ashlesha_nakshatra_name: { en: "Ashlesha Nakshatra Shanti Vidhan", hi: "आश्लेषा नक्षत्र शांति विधान", gu: "આશ્લેષા નક્ષત્ર શાંતિ વિધાન" },
  pooja_griha_pravesh_name: { en: "Griha Pravesh", hi: "गृह प्रवेश", gu: "ગૃહ પ્રવેશ" },
  pooja_satyanarayan_katha_name: { en: "Satyanarayan Katha", hi: "सत्यनारायण कथा", gu: "સત્યનારાયણ કથા" },
  pooja_ganesh_atharvashirsha_laddu_havan_name: {
    en: "Ganesh Puja with Atharvarshisham Path (Laddu Havan)",
    hi: "गणेश पूजा अथर्वशीर्ष पाठ (लड्डू हवन)",
    gu: "ગણેશ પૂજા અથર્વશિર્ષ પાઠ (લાડુ હવન)",
  },
  pooja_pathatmak_laghu_rudra_name: {
    en: "Pathatmak Laghu rudra puja",
    hi: "पाठात्मक लघु रूद्र पूजा",
    gu: "પાઠાત્મક લઘુ રુદ્ર પૂજા",
  },
  // Puja detail: navagraha_shanti
  pooja_navagraha_shanti_subtitle: { en: "Planetary Peace & Harmony", hi: "ग्रह शांति और सामंजस्य", gu: "ગ્રહ શાંતિ અને સંવાદિતા" },
  pooja_navagraha_shanti_description: {
    en: "Navagraha Shanti is a powerful Vedic ritual performed to pacify the nine celestial bodies (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu). This puja brings harmony, removes planetary doshas, and creates positive cosmic influence in your life.",
    hi: "नवग्रह शांति नौ खगोलीय ग्रहों (सूर्य, चंद्र, मंगल, बुध, गुरु, शुक्र, शनि, राहु और केतु) को शांत करने के लिए की जाने वाली एक शक्तिशाली वैदिक विधि है। यह पूजा सामंजस्य लाती है, ग्रह दोष दूर करती है और जीवन में सकारात्मक प्रभाव बनाती है।",
    gu: "નવગ્રહ શાંતિ નવ ખગોળીય ગ્રહો (સૂર્ય, ચંદ્ર, મંગળ, બુધ, ગુરુ, શુક્ર, શનિ, રાહુ અને કેતુ)ને શાંત કરવા માટે કરવામાં આવતી શક્તિશાળી વૈદિક વિધિ છે. આ પૂજા સંવાદિતા લાવે છે, ગ્રહ દોષ દૂર કરે છે.",
  },
  pooja_navagraha_shanti_bestFor: {
    en: "Those experiencing health issues, career blocks, or facing challenging planetary periods",
    hi: "स्वास्थ्य समस्याओं, करियर में रुकावट या चुनौतीपूर्ण ग्रह अवधि का सामना करने वाले",
    gu: "આરોગ્ય સમસ્યાઓ, કારકિર્દી અવરોધ અથવા ગ્રહ અવધિનો સામનો કરનારા",
  },
  pooja_navagraha_shanti_whenToPerform: {
    en: "Anytime, but most effective during positive planetary transits",
    hi: "कभी भी, लेकिन अनुकूल ग्रह गोचर के दौरान सबसे प्रभावी",
    gu: "કોઈ પણ સમયે, પરંતુ અનુકૂળ ગ્રહ ગોચર દરમિયાન સૌથી અસરકારક",
  },
  pooja_navagraha_shanti_benefit_0: { en: "Removes negative planetary influences", hi: "नकारात्मक ग्रह प्रभाव दूर करता है", gu: "નકારાત્મક ગ્રહ પ્રભાવ દૂર કરે છે" },
  pooja_navagraha_shanti_benefit_1: { en: "Brings health and prosperity", hi: "स्वास्थ्य और समृद्धि लाता है", gu: "આરોગ્ય અને સમૃદ્ધિ લાવે છે" },
  pooja_navagraha_shanti_benefit_2: { en: "Reduces obstacles and challenges", hi: "बाधाओं और चुनौतियों को कम करता है", gu: "અવરોધો અને પડકારો ઘટાડે છે" },
  pooja_navagraha_shanti_benefit_3: { en: "Enhances mental clarity and focus", hi: "मानसिक स्पष्टता और एकाग्रता बढ़ाता है", gu: "માનસિક સ્પષ્ટતા અને ધ્યાન વધારે છે" },
  pooja_navagraha_shanti_benefit_4: { en: "Protects family from malefic effects", hi: "परिवार को अशुभ प्रभावों से बचाता है", gu: "પરિવારને અશુભ પ્રભાવોથી બચાવે છે" },
  pooja_navagraha_shanti_benefit_5: { en: "Brings peace and harmony", hi: "शांति और सामंजस्य लाता है", gu: "શાંતિ અને સંવાદિતા લાવે છે" },
  pooja_navagraha_shanti_process_0: { en: "Purification of the space (Shaucha)", hi: "स्थान की शुद्धि (शौच)", gu: "જગ્યાની શુદ્ધિ (શૌચ)" },
  pooja_navagraha_shanti_process_1: { en: "Invocation of Lord Ganesha", hi: "भगवान गणेश का आह्वान", gu: "ભગવાન ગણેશનું આહ્વાન" },
  pooja_navagraha_shanti_process_2: { en: "Chanting of Navagraha mantras", hi: "नवग्रह मंत्रों का जाप", gu: "નવગ્રહ મંત્રોનો જાપ" },
  pooja_navagraha_shanti_process_3: { en: "Offerings to each planet deity", hi: "प्रत्येक ग्रह देवता को भोग", gu: "દરેક ગ્રહ દેવતાને ભોગ" },
  pooja_navagraha_shanti_process_4: { en: "Aarti and blessings", hi: "आरती और आशीर्वाद", gu: "આરતી અને આશીર્વાદ" },
  pooja_navagraha_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // Puja detail: surya_grah_shanti
  pooja_surya_grah_shanti_subtitle: { en: "Sun God's Cosmic Blessings", hi: "सूर्य देव का दिव्य आशीर्वाद", gu: "સૂર્ય દેવનું દિવ્ય આશીર્વાદ" },
  pooja_surya_grah_shanti_description: {
    en: "Surya Grah Shanti is performed to pacify the Sun's negative influences. This powerful ritual enhances energy, removes health issues, and brings success in all endeavors.",
    hi: "सूर्य ग्रह शांति सूर्य के नकारात्मक प्रभावों को शांत करने के लिए की जाती है। यह शक्तिशाली अनुष्ठान ऊर्जा बढ़ाता है, स्वास्थ्य समस्याओं को दूर करता है।",
    gu: "સૂર્ય ગ્રહ શાંતિ સૂર્યના નકારાત્મક પ્રભાવો શાંત કરવા માટે કરવામાં આવે છે. આ શક્તિશાળી વિધિ ઊર્જા વધારે છે, આરોગ્ય સમસ્યાઓ દૂર કરે છે.",
  },
  pooja_surya_grah_shanti_bestFor: {
    en: "Those with weak Sun in birth chart or facing low energy and health issues",
    hi: "जन्म कुंडली में कमजोर सूर्य या कम ऊर्जा और स्वास्थ्य समस्याओं वाले",
    gu: "જન્મ કુંડળીમાં નબળો સૂર્ય અથવા ઓછી ઊર્જા અને આરોગ્ય સમસ્યાઓ",
  },
  pooja_surya_grah_shanti_whenToPerform: { en: "Sunday is most auspicious for Surya Puja", hi: "रविवार सूर्य पूजा के लिए सबसे शुभ", gu: "રવિવાર સૂર્ય પૂજા માટે સૌથી શુભ" },
  pooja_surya_grah_shanti_benefit_0: { en: "Boosts confidence and courage", hi: "आत्मविश्वास और साहस बढ़ाता है", gu: "આત્મવિશ્વાસ અને હિંમત વધારે છે" },
  pooja_surya_grah_shanti_benefit_1: { en: "Improves health and vitality", hi: "स्वास्थ्य और ऊर्जा में सुधार", gu: "આરોગ્ય અને ઊર્જા સુધારે છે" },
  pooja_surya_grah_shanti_benefit_2: { en: "Removes eye ailments", hi: "आँखों की समस्या दूर करता है", gu: "આંખની તકલીફ દૂર કરે છે" },
  pooja_surya_grah_shanti_benefit_3: { en: "Brings career advancement", hi: "करियर में उन्नति लाता है", gu: "કારકિર્દીમાં પ્રગતિ લાવે છે" },
  pooja_surya_grah_shanti_benefit_4: { en: "Enhances leadership qualities", hi: "नेतृत्व गुण बढ़ाता है", gu: "નેતૃત્વ ગુણો વધારે છે" },
  pooja_surya_grah_shanti_benefit_5: { en: "Attracts positive energy", hi: "सकारात्मक ऊर्जा आकर्षित करता है", gu: "સકારાત્મક ઊર્જા આકર્ષે છે" },
  pooja_surya_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_surya_grah_shanti_process_1: { en: "Invocation of Lord Surya", hi: "भगवान सूर्य का आह्वान", gu: "ભગવાન સૂર્યનું આહ્વાન" },
  pooja_surya_grah_shanti_process_2: { en: "Chanting of Surya Mantras", hi: "सूर्य मंत्रों का जाप", gu: "સૂર્ય મંત્રોનો જાપ" },
  pooja_surya_grah_shanti_process_3: { en: "Offering of red flowers", hi: "लाल फूलों का भोग", gu: "લાલ ફૂલોનો ભોગ" },
  pooja_surya_grah_shanti_process_4: { en: "Aarti with ghee lamp", hi: "घी के दीप से आरती", gu: "ઘીના દીપથી આરતી" },
  pooja_surya_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // Puja detail: chandra_grah_shanti
  pooja_chandra_grah_shanti_subtitle: { en: "Moon God's Serene Blessings", hi: "चंद्र देव की शांत आशीर्वाद", gu: "ચંદ્ર દેવનું શાંત આશીર્વાદ" },
  pooja_chandra_grah_shanti_description: {
    en: "Chandra Grah Shanti pacifies the Moon's negative effects. This ritual brings emotional balance, peace of mind, and protection for mental health.",
    hi: "चंद्र ग्रह शांति चंद्रमा के नकारात्मक प्रभावों को शांत करती है। यह विधि भावनात्मक संतुलन और मानसिक स्वास्थ्य की रक्षा करती है।",
    gu: "ચંદ્ર ગ્રહ શાંતિ ચંદ્રના નકારાત્મક પ્રભાવો શાંત કરે છે. આ વિધિ ભાવનાત્મક સંતુલન અને માનસિક આરોગ્યનું રક્ષણ કરે છે.",
  },
  pooja_chandra_grah_shanti_bestFor: {
    en: "Those facing mental disturbances, anxiety, or emotional imbalance",
    hi: "मानसिक अशांति, चिंता या भावनात्मक असंतुलन वाले",
    gu: "માનસિક અશાંતિ, ચિંતા અથવા ભાવનાત્મક અસંતુલન",
  },
  pooja_chandra_grah_shanti_whenToPerform: { en: "Monday is most auspicious, especially during Full Moon", hi: "सोमवार सबसे शुभ, विशेषकर पूर्णिमा पर", gu: "સોમવાર સૌથી શુભ, ખાસ કરીને પૂર્ણિમા પર" },
  pooja_chandra_grah_shanti_benefit_0: { en: "Brings emotional balance", hi: "भावनात्मक संतुलन लाता है", gu: "ભાવનાત્મક સંતુલન લાવે છે" },
  pooja_chandra_grah_shanti_benefit_1: { en: "Improves mental health", hi: "मानसिक स्वास्थ्य सुधारता है", gu: "માનસિક આરોગ્ય સુધારે છે" },
  pooja_chandra_grah_shanti_benefit_2: { en: "Reduces anxiety and stress", hi: "चिंता और तनाव कम करता है", gu: "ચિંતા અને તણાવ ઘટાડે છે" },
  pooja_chandra_grah_shanti_benefit_3: { en: "Enhances intuition", hi: "अंतर्ज्ञान बढ़ाता है", gu: "અંતર્જ્ઞાન વધારે છે" },
  pooja_chandra_grah_shanti_benefit_4: { en: "Brings peaceful sleep", hi: "शांतिपूर्ण नींद लाता है", gu: "શાંતિપૂર્ણ ઊંઘ લાવે છે" },
  pooja_chandra_grah_shanti_benefit_5: { en: "Strengthens relationships", hi: "रिश्तों को मजबूत करता है", gu: "સંબંધો મજબૂત કરે છે" },
  pooja_chandra_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_chandra_grah_shanti_process_1: { en: "Invocation of Lord Chandra", hi: "भगवान चंद्र का आह्वान", gu: "ભગવાન ચંદ્રનું આહ્વાન" },
  pooja_chandra_grah_shanti_process_2: { en: "Chanting of Chandra Mantras", hi: "चंद्र मंत्रों का जाप", gu: "ચંદ્ર મંત્રોનો જાપ" },
  pooja_chandra_grah_shanti_process_3: { en: "Offering of white flowers", hi: "सफेद फूलों का भोग", gu: "સફેદ ફૂલોનો ભોગ" },
  pooja_chandra_grah_shanti_process_4: { en: "Aarti with milk", hi: "दूध से आरती", gu: "દૂધથી આરતી" },
  pooja_chandra_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // Puja detail: mangal_grah_shanti
  pooja_mangal_grah_shanti_subtitle: { en: "Mars God's Warrior Energy", hi: "मंगल देव की योद्धा ऊर्जा", gu: "મંગળ દેવની યોદ્ધા ઊર્જા" },
  pooja_mangal_grah_shanti_description: {
    en: "Mangal Grah Shanti is performed to reduce the negative effects of Mars. This ritual brings courage, removes obstacles in marriage, and provides protection.",
    hi: "मंगल ग्रह शांति मंगल के नकारात्मक प्रभावों को कम करने के लिए की जाती है। यह विधि साहस लाती है, विवाह में बाधाएं दूर करती है।",
    gu: "મંગળ ગ્રહ શાંતિ મંગળના નકારાત્મક પ્રભાવો ઘટાડવા માટે કરવામાં આવે છે. આ વિધિ હિંમત લાવે છે, લગ્નમાં અવરોધો દૂર કરે છે.",
  },
  pooja_mangal_grah_shanti_bestFor: { en: "Those with Mangal Dosha or facing relationship obstacles", hi: "मंगल दोष वाले या रिश्तों में बाधा वाले", gu: "મંગળ દોષ અથવા સંબંધ અવરોધો" },
  pooja_mangal_grah_shanti_whenToPerform: { en: "Tuesday is most auspicious for Mangal Puja", hi: "मंगलवार मंगल पूजा के लिए सबसे शुभ", gu: "મંગળવાર મંગળ પૂજા માટે સૌથી શુભ" },
  pooja_mangal_grah_shanti_benefit_0: { en: "Removes Mangal Dosha", hi: "मंगल दोष दूर करता है", gu: "મંગળ દોષ દૂર કરે છે" },
  pooja_mangal_grah_shanti_benefit_1: { en: "Brings courage and confidence", hi: "साहस और आत्मविश्वास लाता है", gu: "હિંમત અને આત્મવિશ્વાસ લાવે છે" },
  pooja_mangal_grah_shanti_benefit_2: { en: "Ensures harmonious marriage", hi: "सामंजस्यपूर्ण विवाह सुनिश्चित करता है", gu: "સંવાદિતા ભર્યું લગ્ન ખાતરી કરે છે" },
  pooja_mangal_grah_shanti_benefit_3: { en: "Protects from accidents", hi: "दुर्घटनाओं से बचाता है", gu: "અકસ્માતોથી બચાવે છે" },
  pooja_mangal_grah_shanti_benefit_4: { en: "Brings victory over enemies", hi: "शत्रुओं पर विजय दिलाता है", gu: "દુશ્મનો પર વિજય લાવે છે" },
  pooja_mangal_grah_shanti_benefit_5: { en: "Enhances strength", hi: "शक्ति बढ़ाता है", gu: "શક્તિ વધારે છે" },
  pooja_mangal_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_mangal_grah_shanti_process_1: { en: "Invocation of Lord Mangal", hi: "भगवान मंगल का आह्वान", gu: "ભગવાન મંગળનું આહ્વાન" },
  pooja_mangal_grah_shanti_process_2: { en: "Chanting of Mangal Mantras", hi: "मंगल मंत्रों का जाप", gu: "મંગળ મંત્રોનો જાપ" },
  pooja_mangal_grah_shanti_process_3: { en: "Offering of red flowers and sweets", hi: "लाल फूल और मिठाई का भोग", gu: "લાલ ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_mangal_grah_shanti_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_mangal_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // Puja detail: budh_grah_shanti
  pooja_budh_grah_shanti_subtitle: { en: "Mercury God's Intellectual Blessings", hi: "बुध देव का बौद्धिक आशीर्वाद", gu: "બુધ દેવનું બૌદ્ધિક આશીર્વાદ" },
  pooja_budh_grah_shanti_description: {
    en: "Budh Grah Shanti enhances intelligence, communication skills, and business success. This ritual removes obstacles in education and commerce.",
    hi: "बुध ग्रह शांति बुद्धि, संचार कौशल और व्यापार सफलता बढ़ाती है। यह विधि शिक्षा और व्यापार में बाधाएं दूर करती है।",
    gu: "બુધ ગ્રહ શાંતિ બુદ્ધિ, સંચાર કૌશલ્ય અને વ્યવસાય સફળતા વધારે છે. આ વિધિ શિક્ષણ અને વાણિજ્યમાં અવરોધો દૂર કરે છે.",
  },
  pooja_budh_grah_shanti_bestFor: { en: "Students, businessmen, and those in communication fields", hi: "छात्र, व्यापारी और संचार क्षेत्र वाले", gu: "વિદ્યાર્થીઓ, વ્યવસાયીઓ અને સંચાર ક્ષેત્ર" },
  pooja_budh_grah_shanti_whenToPerform: { en: "Wednesday is most auspicious for Budh Puja", hi: "बुधवार बुध पूजा के लिए सबसे शुभ", gu: "બુધવાર બુધ પૂજા માટે સૌથી શુભ" },
  pooja_budh_grah_shanti_benefit_0: { en: "Enhances intellect and wisdom", hi: "बुद्धि और ज्ञान बढ़ाता है", gu: "બુદ્ધિ અને જ્ઞાન વધારે છે" },
  pooja_budh_grah_shanti_benefit_1: { en: "Improves communication skills", hi: "संचार कौशल सुधारता है", gu: "સંચાર કૌશલ્ય સુધારે છે" },
  pooja_budh_grah_shanti_benefit_2: { en: "Brings business success", hi: "व्यापार सफलता लाता है", gu: "વ્યવસાય સફળતા લાવે છે" },
  pooja_budh_grah_shanti_benefit_3: { en: "Removes speech impediments", hi: "वाक् दोष दूर करता है", gu: "વાણી અવરોધ દૂર કરે છે" },
  pooja_budh_grah_shanti_benefit_4: { en: "Strengthens memory", hi: "स्मृति मजबूत करता है", gu: "યાદશક્તિ મજબૂત કરે છે" },
  pooja_budh_grah_shanti_benefit_5: { en: "Attracts prosperity through trade", hi: "व्यापार से समृद्धि आकर्षित करता है", gu: "વ્યાપારથી સમૃદ્ધિ આકર્ષે છે" },
  pooja_budh_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_budh_grah_shanti_process_1: { en: "Invocation of Lord Budh", hi: "भगवान बुध का आह्वान", gu: "ભગવાન બુધનું આહ્વાન" },
  pooja_budh_grah_shanti_process_2: { en: "Chanting of Budh Mantras", hi: "बुध मंत्रों का जाप", gu: "બુધ મંત્રોનો જાપ" },
  pooja_budh_grah_shanti_process_3: { en: "Offering of green flowers", hi: "हरे फूलों का भोग", gu: "જાંબલી ફૂલોનો ભોગ" },
  pooja_budh_grah_shanti_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_budh_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // guru, shukra, shani, rahu, ketu (abbreviated keys for space - same pattern)
  pooja_guru_grah_shanti_subtitle: { en: "Jupiter's Wisdom & Fortune", hi: "गुरु का ज्ञान और भाग्य", gu: "ગુરુનું જ્ઞાન અને ભાગ્ય" },
  pooja_guru_grah_shanti_description: { en: "Guru Grah Shanti invokes Jupiter's blessings for wisdom, prosperity, and spiritual growth.", hi: "गुरु ग्रह शांति ज्ञान, समृद्धि और आध्यात्मिक विकास के लिए गुरु का आशीर्वाद लाती है।", gu: "ગુરુ ગ્રહ શાંતિ જ્ઞાન, સમૃદ્ધિ અને આધ્યાત્મિક વિકાસ માટે ગુરુનું આશીર્વાદ લાવે છે." },
  pooja_guru_grah_shanti_bestFor: { en: "Students, spiritual seekers, and those pursuing higher knowledge", hi: "छात्र, आध्यात्मिक साधक और उच्च ज्ञान चाहने वाले", gu: "વિદ્યાર્થીઓ, આધ્યાત્મિક સાધકો" },
  pooja_guru_grah_shanti_whenToPerform: { en: "Thursday is most auspicious for Guru Puja", hi: "गुरुवार गुरु पूजा के लिए शुभ", gu: "ગુરુવાર ગુરુ પૂજા માટે શુભ" },
  pooja_guru_grah_shanti_benefit_0: { en: "Brings wisdom and knowledge", hi: "ज्ञान और बुद्धि लाता है", gu: "જ્ઞાન અને બુદ્ધિ લાવે છે" },
  pooja_guru_grah_shanti_benefit_1: { en: "Attracts prosperity and wealth", hi: "समृद्धि और धन आकर्षित करता है", gu: "સમૃદ્ધિ અને ધન આકર્ષે છે" },
  pooja_guru_grah_shanti_benefit_2: { en: "Removes education obstacles", hi: "शिक्षा में बाधाएं दूर करता है", gu: "શિક્ષણ અવરોધો દૂર કરે છે" },
  pooja_guru_grah_shanti_benefit_3: { en: "Enhances spiritual growth", hi: "आध्यात्मिक विकास बढ़ाता है", gu: "આધ્યાત્મિક વિકાસ વધારે છે" },
  pooja_guru_grah_shanti_benefit_4: { en: "Brings good fortune", hi: "अच्छा भाग्य लाता है", gu: "સારું ભાગ્ય લાવે છે" },
  pooja_guru_grah_shanti_benefit_5: { en: "Ensures successful endeavors", hi: "सफल प्रयास सुनिश्चित करता है", gu: "સફળ પ્રયાસ ખાતરી કરે છે" },
  pooja_guru_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_guru_grah_shanti_process_1: { en: "Invocation of Lord Guru", hi: "भगवान गुरु का आह्वान", gu: "ભગવાન ગુરુનું આહ્વાન" },
  pooja_guru_grah_shanti_process_2: { en: "Chanting of Guru Mantras", hi: "गुरु मंत्रों का जाप", gu: "ગુરુ મંત્રોનો જાપ" },
  pooja_guru_grah_shanti_process_3: { en: "Offering of yellow flowers", hi: "पीले फूलों का भोग", gu: "પીળા ફૂલોનો ભોગ" },
  pooja_guru_grah_shanti_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_guru_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_shukra_grah_shanti_subtitle: { en: "Venus's Love & Abundance", hi: "शुक्र का प्रेम और समृद्धि", gu: "શુક્રનું પ્રેમ અને સમૃદ્ધિ" },
  pooja_shukra_grah_shanti_description: { en: "Shukra Grah Shanti enhances love, beauty, and material comfort. Brings harmony in relationships.", hi: "शुक्र ग्रह शांति प्रेम, सौंदर्य और सुख बढ़ाती है। रिश्तों में सामंजस्य लाती है।", gu: "શુક્ર ગ્રહ શાંતિ પ્રેમ, સુંદરતા અને સુખ વધારે છે. સંબંધોમાં સંવાદિતા લાવે છે." },
  pooja_shukra_grah_shanti_bestFor: { en: "Those seeking marriage, artists, and those facing relationship issues", hi: "विवाह चाहने वाले, कलाकार और रिश्तों की समस्या वाले", gu: "લગ્ન શોધનારા, કલાકારો" },
  pooja_shukra_grah_shanti_whenToPerform: { en: "Friday is most auspicious for Shukra Puja", hi: "शुक्रवार शुक्र पूजा के लिए शुभ", gu: "શુક્રવાર શુક્ર પૂજા માટે શુભ" },
  pooja_shukra_grah_shanti_benefit_0: { en: "Brings love and harmony in relationships", hi: "रिश्तों में प्रेम और सामंजस्य", gu: "સંબંધોમાં પ્રેમ અને સંવાદિતા" },
  pooja_shukra_grah_shanti_benefit_1: { en: "Enhances beauty and charm", hi: "सौंदर्य और आकर्षण बढ़ाता है", gu: "સુંદરતા અને આકર્ષણ વધારે છે" },
  pooja_shukra_grah_shanti_benefit_2: { en: "Attracts wealth and comfort", hi: "धन और सुख आकर्षित करता है", gu: "ધન અને સુખ આકર્ષે છે" },
  pooja_shukra_grah_shanti_benefit_3: { en: "Improves artistic abilities", hi: "कलात्मक क्षमता सुधारता है", gu: "કલાત્મક ક્ષમતા સુધારે છે" },
  pooja_shukra_grah_shanti_benefit_4: { en: "Brings marital happiness", hi: "वैवाहिक सुख लाता है", gu: "વૈવાહિક સુખ લાવે છે" },
  pooja_shukra_grah_shanti_benefit_5: { en: "Removes relationship conflicts", hi: "रिश्तों के विवाद दूर करता है", gu: "સંબંધ વિવાદ દૂર કરે છે" },
  pooja_shukra_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_shukra_grah_shanti_process_1: { en: "Invocation of Lord Shukra", hi: "भगवान शुक्र का आह्वान", gu: "ભગવાન શુક્રનું આહ્વાન" },
  pooja_shukra_grah_shanti_process_2: { en: "Chanting of Shukra Mantras", hi: "शुक्र मंत्रों का जाप", gu: "શુક્ર મંત્રોનો જાપ" },
  pooja_shukra_grah_shanti_process_3: { en: "Offering of white and pink flowers", hi: "सफेद और गुलाबी फूलों का भोग", gu: "સફેદ અને ગુલાબી ફૂલોનો ભોગ" },
  pooja_shukra_grah_shanti_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_shukra_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_shani_grah_shanti_subtitle: { en: "Saturn's Karmic Lessons", hi: "शनि का कर्मिक पाठ", gu: "શનિનો કર્મિક પાઠ" },
  pooja_shani_grah_shanti_description: { en: "Shani Grah Shanti pacifies Saturn's challenging influences. Removes obstacles and brings relief from hardships.", hi: "शनि ग्रह शांति शनि के कठिन प्रभावों को शांत करती है। बाधाएं दूर करती है।", gu: "શનિ ગ્રહ શાંતિ શનિના કઠણ પ્રભાવો શાંત કરે છે. અવરોધો દૂર કરે છે." },
  pooja_shani_grah_shanti_bestFor: { en: "Those facing Shani Sade Sati or major life obstacles", hi: "शनि साढ़े साती या बड़ी जीवन बाधा वाले", gu: "શનિ સાઢે સાતી અથવા મોટી જીવન અવરોધ" },
  pooja_shani_grah_shanti_whenToPerform: { en: "Saturday is most auspicious for Shani Puja", hi: "शनिवार शनि पूजा के लिए शुभ", gu: "શનિવાર શનિ પૂજા માટે શુભ" },
  pooja_shani_grah_shanti_benefit_0: { en: "Removes Shani Dosha effects", hi: "शनि दोष प्रभाव दूर करता है", gu: "શનિ દોષ પ્રભાવ દૂર કરે છે" },
  pooja_shani_grah_shanti_benefit_1: { en: "Brings relief from hardships", hi: "कठिनाइयों से राहत लाता है", gu: "મુશ્કેલીઓથી રાહત લાવે છે" },
  pooja_shani_grah_shanti_benefit_2: { en: "Ensures job stability", hi: "नौकरी में स्थिरता सुनिश्चित करता है", gu: "નોકરી સ્થિરતા ખાતરી કરે છે" },
  pooja_shani_grah_shanti_benefit_3: { en: "Brings steady progress", hi: "निरंतर प्रगति लाता है", gu: "સતત પ્રગતિ લાવે છે" },
  pooja_shani_grah_shanti_benefit_4: { en: "Removes obstacles in life", hi: "जीवन में बाधाएं दूर करता है", gu: "જીવનમાં અવરોધો દૂર કરે છે" },
  pooja_shani_grah_shanti_benefit_5: { en: "Attracts longevity", hi: "दीर्घायु आकर्षित करता है", gu: "દીર્ઘાયુ આકર્ષે છે" },
  pooja_shani_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_shani_grah_shanti_process_1: { en: "Invocation of Lord Shani", hi: "भगवान शनि का आह्वान", gu: "ભગવાન શનિનું આહ્વાન" },
  pooja_shani_grah_shanti_process_2: { en: "Chanting of Shani Mantras", hi: "शनि मंत्रों का जाप", gu: "શનિ મંત્રોનો જાપ" },
  pooja_shani_grah_shanti_process_3: { en: "Offering of black and blue flowers", hi: "काले और नीले फूलों का भोग", gu: "કાળા અને નીલા ફૂલોનો ભોગ" },
  pooja_shani_grah_shanti_process_4: { en: "Extended Aarti ritual", hi: "विस्तृत आरती विधि", gu: "વિસ્તૃત આરતી વિધિ" },
  pooja_shani_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_rahu_grah_shanti_subtitle: { en: "Shadow Planet's Karmic Balance", hi: "छाया ग्रह का कर्म संतुलन", gu: "છાયા ગ્રહનું કર્મ સંતુલન" },
  pooja_rahu_grah_shanti_description: { en: "Rahu Grah Shanti pacifies Rahu's negative effects. Removes confusion and brings clarity of thought.", hi: "राहु ग्रह शांति राहु के नकारात्मक प्रभावों को शांत करती है। भ्रम दूर करती है।", gu: "રાહુ ગ્રહ શાંતિ રાહુના નકારાત્મક પ્રભાવો શાંત કરે છે. ભ્રમ દૂર કરે છે." },
  pooja_rahu_grah_shanti_bestFor: { en: "Those facing Rahu Mahadasha or sudden life changes", hi: "राहु महादशा या अचानक जीवन परिवर्तन वाले", gu: "રાહુ મહાદશા અથવા અચાનક જીવન ફેરફાર" },
  pooja_rahu_grah_shanti_whenToPerform: { en: "Anytime, most effective on specific lunar days", hi: "कभी भी, विशिष्ट चंद्र दिनों पर प्रभावी", gu: "કોઈ પણ સમયે, ચંદ્ર દિવસો પર અસરકારક" },
  pooja_rahu_grah_shanti_benefit_0: { en: "Removes confusion and illusion", hi: "भ्रम और भ्रांति दूर करता है", gu: "ભ્રમ અને ભ્રાંતિ દૂર કરે છે" },
  pooja_rahu_grah_shanti_benefit_1: { en: "Brings clarity of thought", hi: "विचारों की स्पष्टता लाता है", gu: "વિચારોની સ્પષ્ટતા લાવે છે" },
  pooja_rahu_grah_shanti_benefit_2: { en: "Removes sudden obstacles", hi: "अचानक बाधाएं दूर करता है", gu: "અચાનક અવરોધો દૂર કરે છે" },
  pooja_rahu_grah_shanti_benefit_3: { en: "Protects from deception", hi: "धोखे से बचाता है", gu: "ઘોષણાથી બચાવે છે" },
  pooja_rahu_grah_shanti_benefit_4: { en: "Brings prosperity", hi: "समृद्धि लाता है", gu: "સમૃદ્ધિ લાવે છે" },
  pooja_rahu_grah_shanti_benefit_5: { en: "Ensures steady growth", hi: "निरंतर विकास सुनिश्चित करता है", gu: "સતત વિકાસ ખાતરી કરે છે" },
  pooja_rahu_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_rahu_grah_shanti_process_1: { en: "Invocation of Lord Rahu", hi: "भगवान राहु का आह्वान", gu: "ભગવાન રાહુનું આહ્વાન" },
  pooja_rahu_grah_shanti_process_2: { en: "Chanting of Rahu Mantras", hi: "राहु मंत्रों का जाप", gu: "રાહુ મંત્રોનો જાપ" },
  pooja_rahu_grah_shanti_process_3: { en: "Offering of black flowers", hi: "काले फूलों का भोग", gu: "કાળા ફૂલોનો ભોગ" },
  pooja_rahu_grah_shanti_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_rahu_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_ketu_grah_shanti_subtitle: { en: "Shadow Planet's Spiritual Wisdom", hi: "छाया ग्रह की आध्यात्मिक ज्ञान", gu: "છાયા ગ્રહનું આધ્યાત્મિક જ્ઞાન" },
  pooja_ketu_grah_shanti_description: { en: "Ketu Grah Shanti addresses spiritual challenges and karmic debts. Brings spiritual awakening and protection.", hi: "केतु ग्रह शांति आध्यात्मिक चुनौतियों और कर्म ऋण को संबोधित करती है। आध्यात्मिक जागृति लाती है।", gu: "કેતુ ગ્રહ શાંતિ આધ્યાત્મિક પડકારો અને કર્મ ઋણને સંબોધે છે. આધ્યાત્મિક જાગૃતિ લાવે છે." },
  pooja_ketu_grah_shanti_bestFor: { en: "Those seeking spiritual growth or facing Ketu Mahadasha", hi: "आध्यात्मिक विकास चाहने वाले या केतु महादशा वाले", gu: "આધ્યાત્મિક વિકાસ શોધનારા અથવા કેતુ મહાદશા" },
  pooja_ketu_grah_shanti_whenToPerform: { en: "Anytime, most effective on specific lunar days", hi: "कभी भी, विशिष्ट चंद्र दिनों पर प्रभावी", gu: "કોઈ પણ સમયે, ચંદ્ર દિવસો પર અસરકારક" },
  pooja_ketu_grah_shanti_benefit_0: { en: "Brings spiritual awakening", hi: "आध्यात्मिक जागृति लाता है", gu: "આધ્યાત્મિક જાગૃતિ લાવે છે" },
  pooja_ketu_grah_shanti_benefit_1: { en: "Removes health complications", hi: "स्वास्थ्य जटिलताओं को दूर करता है", gu: "આરોગ્ય જટિલતાઓ દૂર કરે છે" },
  pooja_ketu_grah_shanti_benefit_2: { en: "Protects from negative energies", hi: "नकारात्मक ऊर्जा से बचाता है", gu: "નકારાત્મક ઊર્જાથી બચાવે છે" },
  pooja_ketu_grah_shanti_benefit_3: { en: "Ensures liberation from karmic debts", hi: "कर्म ऋण से मुक्ति सुनिश्चित करता है", gu: "કર્મ ઋણથી મુક્તિ ખાતરી કરે છે" },
  pooja_ketu_grah_shanti_benefit_4: { en: "Brings inner peace", hi: "आंतरिक शांति लाता है", gu: "આંતરિક શાંતિ લાવે છે" },
  pooja_ketu_grah_shanti_benefit_5: { en: "Enhances intuition", hi: "अंतर्ज्ञान बढ़ाता है", gu: "અંતર્જ્ઞાન વધારે છે" },
  pooja_ketu_grah_shanti_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_ketu_grah_shanti_process_1: { en: "Invocation of Lord Ketu", hi: "भगवान केतु का आह्वान", gu: "ભગવાન કેતુનું આહ્વાન" },
  pooja_ketu_grah_shanti_process_2: { en: "Chanting of Ketu Mantras", hi: "केतु मंत्रों का जाप", gu: "કેતુ મંત્રોનો જાપ" },
  pooja_ketu_grah_shanti_process_3: { en: "Offering of mixed flowers", hi: "मिश्रित फूलों का भोग", gu: "મિશ્રિત ફૂલોનો ભોગ" },
  pooja_ketu_grah_shanti_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_ketu_grah_shanti_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // Rudrabhishek, Griha Pravesh, Satyanarayan Katha
  pooja_rudrabhishek_subtitle: { en: "Lord Shiva's Sacred Ablution", hi: "भगवान शिव का पवित्र अभिषेक", gu: "ભગવાન શિવનું પવિત્ર અભિષેક" },
  pooja_rudrabhishek_description: {
    en: "Rudrabhishek is an ancient and powerful ritual dedicated to Lord Shiva where sacred substances are offered to the Shiva Lingam. This ritual invokes blessings for prosperity, health, and spiritual growth.",
    hi: "रुद्राभिषेक भगवान शिव को समर्पित एक प्राचीन और शक्तिशाली अनुष्ठान है जिसमें शिव लिंग पर पवित्र पदार्थ चढ़ाए जाते हैं। यह विधि समृद्धि, स्वास्थ्य और आध्यात्मिक विकास के लिए आशीर्वाद लाती है।",
    gu: "રુદ્રાભિષેક ભગવાન શિવને સમર્પિત પ્રાચીન અને શક્તિશાળી વિધિ છે જેમાં શિવ લિંગ પર પવિત્ર પદાર્થો ચઢાવવામાં આવે છે. આ વિધિ સમૃદ્ધિ, આરોગ્ય અને આધ્યાત્મિક વિકાસ માટે આશીર્વાદ લાવે છે.",
  },
  pooja_rudrabhishek_bestFor: { en: "Devotees seeking Shiva's blessings, facing health issues, or spiritual seekers", hi: "शिव का आशीर्वाद चाहने वाले, स्वास्थ्य समस्या या आध्यात्मिक साधक", gu: "શિવનું આશીર્વાદ શોધનારા, આરોગ્ય સમસ્યા અથવા આધ્યાત્મિક સાધકો" },
  pooja_rudrabhishek_whenToPerform: { en: "Monday is most auspicious for Rudrabhishek", hi: "सोमवार रुद्राभिषेक के लिए सबसे शुभ", gu: "સોમવાર રુદ્રાભિષેક માટે સૌથી શુભ" },
  pooja_rudrabhishek_benefit_0: { en: "Fulfills wishes and desires", hi: "इच्छाओं और मनोकामनाओं को पूरा करता है", gu: "ઇચ્છાઓ અને મનોકામનાઓ પૂરી કરે છે" },
  pooja_rudrabhishek_benefit_1: { en: "Removes negative karma", hi: "नकारात्मक कर्म दूर करता है", gu: "નકારાત્મક કર્મ દૂર કરે છે" },
  pooja_rudrabhishek_benefit_2: { en: "Brings health and longevity", hi: "स्वास्थ्य और दीर्घायु लाता है", gu: "આરોગ્ય અને દીર્ઘાયુ લાવે છે" },
  pooja_rudrabhishek_benefit_3: { en: "Protects from accidents and dangers", hi: "दुर्घटना और खतरों से बचाता है", gu: "અકસ્માત અને ભયથી બચાવે છે" },
  pooja_rudrabhishek_benefit_4: { en: "Enhances spiritual consciousness", hi: "आध्यात्मिक चेतना बढ़ाता है", gu: "આધ્યાત્મિક ચેતના વધારે છે" },
  pooja_rudrabhishek_benefit_5: { en: "Brings peace and prosperity", hi: "शांति और समृद्धि लाता है", gu: "શાંતિ અને સમૃદ્ધિ લાવે છે" },
  pooja_rudrabhishek_process_0: { en: "Preparation of sacred materials", hi: "पवित्र सामग्री की तैयारी", gu: "પવિત્ર સામગ્રીની તૈયારી" },
  pooja_rudrabhishek_process_1: { en: "Invocation of Lord Shiva", hi: "भगवान शिव का आह्वान", gu: "ભગવાન શિવનું આહ્વાન" },
  pooja_rudrabhishek_process_2: { en: "Bathing the Lingam with sacred substances", hi: "पवित्र पदार्थों से लिंग का स्नान", gu: "પવિત્ર પદાર્થોથી લિંગનું સ્નાન" },
  pooja_rudrabhishek_process_3: { en: "Chanting of Rudra Sukta mantras", hi: "रुद्र सूक्त मंत्रों का जाप", gu: "રુદ્ર સૂક્ત મંત્રોનો જાપ" },
  pooja_rudrabhishek_process_4: { en: "Offering of flowers and fruits", hi: "फूल और फल का भोग", gu: "ફૂલ અને ફળનો ભોગ" },
  pooja_rudrabhishek_process_5: { en: "Final Aarti and blessings", hi: "अंतिम आरती और आशीर्वाद", gu: "અંતિમ આરતી અને આશીર્વાદ" },
  pooja_griha_pravesh_subtitle: { en: "Auspicious House Warming", hi: "शुभ गृह प्रवेश", gu: "શુભ ગૃહ પ્રવેશ" },
  pooja_griha_pravesh_description: {
    en: "Griha Pravesh is an auspicious house warming ceremony with Vedic blessings to bring peace, prosperity, and positive energy to your new home.",
    hi: "गृह प्रवेश वैदिक आशीर्वाद के साथ एक शुभ गृह प्रवेश समारोह है जो आपके नए घर में शांति, समृद्धि और सकारात्मक ऊर्जा लाता है।",
    gu: "ગૃહ પ્રવેશ વૈદિક આશીર્વાદ સાથે શુભ ગૃહ પ્રવેશ સમારોહ છે જે તમારા નવા ઘરમાં શાંતિ, સમૃદ્ધિ અને સકારાત્મક ઊર્જા લાવે છે.",
  },
  pooja_griha_pravesh_bestFor: { en: "New home owners, before moving into a new house", hi: "नए घर के मालिक, नए घर में प्रवेश से पहले", gu: "નવા ઘરના માલિકો, નવા ઘરમાં પ્રવેશ પહેલાં" },
  pooja_griha_pravesh_whenToPerform: { en: "Before moving in; choose an auspicious muhurat", hi: "प्रवेश से पहले; शुभ मुहूर्त चुनें", gu: "પ્રવેશ પહેલાં; શુભ મુહૂર્ત પસંદ કરો" },
  pooja_griha_pravesh_benefit_0: { en: "Auspicious beginning in new home", hi: "नए घर में शुभ शुरुआत", gu: "નવા ઘરમાં શુભ શરૂઆત" },
  pooja_griha_pravesh_benefit_1: { en: "Brings peace and prosperity", hi: "शांति और समृद्धि लाता है", gu: "શાંતિ અને સમૃદ્ધિ લાવે છે" },
  pooja_griha_pravesh_benefit_2: { en: "Removes negative energies", hi: "नकारात्मक ऊर्जा दूर करता है", gu: "નકારાત્મક ઊર્જા દૂર કરે છે" },
  pooja_griha_pravesh_benefit_3: { en: "Protects the family", hi: "परिवार की रक्षा करता है", gu: "પરિવારનું રક્ષણ કરે છે" },
  pooja_griha_pravesh_benefit_4: { en: "Invokes divine blessings", hi: "दिव्य आशीर्वाद आह्वान करता है", gu: "દિવ્ય આશીર્વાદ આહ્વાન કરે છે" },
  pooja_griha_pravesh_benefit_5: { en: "Ensures happiness and health", hi: "सुख और स्वास्थ्य सुनिश्चित करता है", gu: "સુખ અને આરોગ્ય ખાતરી કરે છે" },
  pooja_griha_pravesh_process_0: { en: "Space purification and Vastu", hi: "स्थान शुद्धि और वास्तु", gu: "જગ્યા શુદ્ધિ અને વાસ્તુ" },
  pooja_griha_pravesh_process_1: { en: "Ganesh and Vastu Puja", hi: "गणेश और वास्तु पूजा", gu: "ગણેશ અને વાસ્તુ પૂજા" },
  pooja_griha_pravesh_process_2: { en: "Havan and mantra chanting", hi: "हवन और मंत्र जाप", gu: "હવન અને મંત્ર જાપ" },
  pooja_griha_pravesh_process_3: { en: "Blessing the entrance", hi: "प्रवेश द्वार का आशीर्वाद", gu: "પ્રવેશ દ્વારનું આશીર્વાદ" },
  pooja_griha_pravesh_process_4: { en: "Aarti and distribution", hi: "आरती और वितरण", gu: "આરતી અને વિતરણ" },
  pooja_griha_pravesh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_satyanarayan_katha_subtitle: { en: "Sacred Story for Wish Fulfillment", hi: "मनोकामना पूर्ति के लिए पवित्र कथा", gu: "મનોકામના પૂર્ણતા માટે પવિત્ર કથા" },
  pooja_satyanarayan_katha_description: {
    en: "Satyanarayan Katha is a sacred storytelling ritual for wish fulfillment. Families perform it for blessings, prosperity, and to celebrate auspicious occasions.",
    hi: "सत्यनारायण कथा मनोकामना पूर्ति के लिए एक पवित्र कथा अनुष्ठान है। परिवार आशीर्वाद, समृद्धि और शुभ अवसरों पर इसे करते हैं।",
    gu: "સત્યનારાયણ કથા મનોકામના પૂર્ણતા માટે પવિત્ર કથા વિધિ છે. પરિવારો આશીર્વાદ, સમૃદ્ધિ અને શુભ પ્રસંગોએ કરે છે.",
  },
  pooja_satyanarayan_katha_bestFor: { en: "Families seeking blessings, on special occasions, or for fulfilling wishes", hi: "आशीर्वाद चाहने वाले परिवार, विशेष अवसरों पर", gu: "આશીર્વાદ શોધનારા પરિવારો, ખાસ પ્રસંગોએ" },
  pooja_satyanarayan_katha_whenToPerform: { en: "Any day, preferably Thursday or during Full moon", hi: "कोई भी दिन, अधिमानतः गुरुवार या पूर्णिमा पर", gu: "કોઈ પણ દિવસ, ગુરુવાર અથવા પૂર્ણિમા પર" },
  pooja_satyanarayan_katha_benefit_0: { en: "Fulfills wishes and desires", hi: "इच्छाओं और मनोकामनाओं को पूरा करता है", gu: "ઇચ્છાઓ અને મનોકામનાઓ પૂરી કરે છે" },
  pooja_satyanarayan_katha_benefit_1: { en: "Brings prosperity and happiness", hi: "समृद्धि और सुख लाता है", gu: "સમૃદ્ધિ અને સુખ લાવે છે" },
  pooja_satyanarayan_katha_benefit_2: { en: "Removes obstacles", hi: "बाधाएं दूर करता है", gu: "અવરોધો દૂર કરે છે" },
  pooja_satyanarayan_katha_benefit_3: { en: "Protects the family", hi: "परिवार की रक्षा करता है", gu: "પરિવારનું રક્ષણ કરે છે" },
  pooja_satyanarayan_katha_benefit_4: { en: "Enhances devotion", hi: "भक्ति बढ़ाता है", gu: "ભક્તિ વધારે છે" },
  pooja_satyanarayan_katha_benefit_5: { en: "Brings peace and harmony", hi: "शांति और सामंजस्य लाता है", gu: "શાંતિ અને સંવાદિતા લાવે છે" },
  pooja_satyanarayan_katha_process_0: { en: "Preparation and invocation", hi: "तैयारी और आह्वान", gu: "તૈયારી અને આહ્વાન" },
  pooja_satyanarayan_katha_process_1: { en: "Recitation of Satyanarayan Katha", hi: "सत्यनारायण कथा का पाठ", gu: "સત્યનારાયણ કથાનું પાઠન" },
  pooja_satyanarayan_katha_process_2: { en: "Offering of prasad and flowers", hi: "प्रसाद और फूलों का भोग", gu: "પ્રસાદ અને ફૂલોનો ભોગ" },
  pooja_satyanarayan_katha_process_3: { en: "Aarti and prayers", hi: "आरती और प्रार्थना", gu: "આરતી અને પ્રાર્થના" },
  pooja_satyanarayan_katha_process_4: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_satyanarayan_katha_process_5: { en: "Blessings and conclusion", hi: "आशीर्वाद और समापन", gu: "આશીર્વાદ અને સમાપન" },
  // Remaining pujas: durga_saptashati, ganesh, hanuman, vishnu, lakshmi, maha_mrityunjay, durga_navarna
  pooja_durga_saptashati_subtitle: { en: "Goddess of Power & Protection", hi: "शक्ति और सुरक्षा की देवी", gu: "શક્તિ અને સંરક્ષણની દેવી" },
  pooja_durga_saptashati_description: { en: "Durga Saptashati invokes Goddess Durga through sacred texts. Provides protection from evil and grants power to overcome challenges.", hi: "दुर्गा सप्तशती पवित्र ग्रंथों के माध्यम से देवी दुर्गा का आह्वान करती है। बुराई से सुरक्षा और चुनौतियों पर विजय देती है।", gu: "દુર્ગા સપ્તશતી પવિત્ર ગ્રંથો દ્વારા દેવી દુર્ગાનું આહ્વાન કરે છે. દુષ્ટતાથી સંરક્ષણ અને પડકારો પર વિજય આપે છે." },
  pooja_durga_saptashati_bestFor: { en: "Those facing difficulties, seeking protection, or overcoming challenges", hi: "कठिनाइयों, सुरक्षा या चुनौतियों का सामना करने वाले", gu: "મુશ્કેલીઓ, સંરક્ષણ અથવા પડકારોનો સામનો કરનારા" },
  pooja_durga_saptashati_whenToPerform: { en: "Navratri most auspicious, but can be performed anytime", hi: "नवरात्रि सबसे शुभ, पर कभी भी किया जा सकता है", gu: "નવરાત્રિ સૌથી શુભ, પરંતુ કોઈ પણ સમયે કરી શકાય" },
  pooja_durga_saptashati_benefit_0: { en: "Provides protection from negativity", hi: "नकारात्मकता से सुरक्षा", gu: "નકારાત્મકતાથી સંરક્ષણ" },
  pooja_durga_saptashati_benefit_1: { en: "Grants courage and strength", hi: "साहस और शक्ति प्रदान करता है", gu: "હિંમત અને શક્તિ આપે છે" },
  pooja_durga_saptashati_benefit_2: { en: "Removes obstacles and enemies", hi: "बाधाओं और शत्रुओं को दूर करता है", gu: "અવરોધો અને દુશ્મનો દૂર કરે છે" },
  pooja_durga_saptashati_benefit_3: { en: "Brings victory and success", hi: "विजय और सफलता लाता है", gu: "વિજય અને સફળતા લાવે છે" },
  pooja_durga_saptashati_benefit_4: { en: "Protects family members", hi: "परिवार की रक्षा करता है", gu: "પરિવારનું રક્ષણ કરે છે" },
  pooja_durga_saptashati_benefit_5: { en: "Destroys negative karmic patterns", hi: "नकारात्मक कर्म प्रभाव नष्ट करता है", gu: "નકારાત્મક કર્મ પ્રભાવ નાશ કરે છે" },
  pooja_durga_saptashati_process_0: { en: "Sacred space preparation", hi: "पवित्र स्थान की तैयारी", gu: "પવિત્ર જગ્યાની તૈયારી" },
  pooja_durga_saptashati_process_1: { en: "Invocation of Goddess Durga", hi: "देवी दुर्गा का आह्वान", gu: "દેવી દુર્ગાનું આહ્વાન" },
  pooja_durga_saptashati_process_2: { en: "Chanting of Devi Mahatmya", hi: "देवी महात्म्य का पाठ", gu: "દેવી મહાત્મ્યનું પાઠન" },
  pooja_durga_saptashati_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_durga_saptashati_process_4: { en: "Ritual worship with mantras", hi: "मंत्रों के साथ पूजा", gu: "મંત્રો સાથે પૂજા" },
  pooja_durga_saptashati_process_5: { en: "Final Aarti and blessings", hi: "अंतिम आरती और आशीर्वाद", gu: "અંતિમ આરતી અને આશીર્વાદ" },
  pooja_ganesh_pooja_subtitle: { en: "Remover of Obstacles", hi: "बाधाओं को दूर करने वाले", gu: "અવરોધો દૂર કરનારા" },
  pooja_ganesh_pooja_description: { en: "Ganesh Puja honors Lord Ganesha to remove obstacles and ensure success. Performed before all major undertakings.", hi: "गणेश पूजा बाधाओं को दूर करने और सफलता सुनिश्चित करने के लिए भगवान गणेश का सम्मान करती है। सभी बड़े कार्यों से पहले की जाती है।", gu: "ગણેશ પૂજા અવરોધો દૂર કરવા અને સફળતા ખાતરી કરવા ભગવાન ગણેશનું સન્માન કરે છે. બધા મોટા કાર્યો પહેલાં કરવામાં આવે છે." },
  pooja_ganesh_pooja_bestFor: { en: "Before starting new projects, businesses, or important endeavors", hi: "नई परियोजनाओं, व्यापार या महत्वपूर्ण कार्य शुरू करने से पहले", gu: "નવી પ્રોજેક્ટ્સ, વ્યવસાય અથવા મહત્વપૂર્ણ કાર્ય શરૂ કરતા પહેલાં" },
  pooja_ganesh_pooja_whenToPerform: { en: "Any day, especially Wednesday", hi: "कोई भी दिन, विशेषकर बुधवार", gu: "કોઈ પણ દિવસ, ખાસ કરીને બુધવાર" },
  pooja_ganesh_pooja_benefit_0: { en: "Removes obstacles", hi: "बाधाएं दूर करता है", gu: "અવરોધો દૂર કરે છે" },
  pooja_ganesh_pooja_benefit_1: { en: "Ensures success in new ventures", hi: "नए उद्यम में सफलता सुनिश्चित करता है", gu: "નવા ઉદ્યમમાં સફળતા ખાતરી કરે છે" },
  pooja_ganesh_pooja_benefit_2: { en: "Brings wisdom and intelligence", hi: "ज्ञान और बुद्धि लाता है", gu: "જ્ઞાન અને બુદ્ધિ લાવે છે" },
  pooja_ganesh_pooja_benefit_3: { en: "Protects from negativity", hi: "नकारात्मकता से बचाता है", gu: "નકારાત્મકતાથી બચાવે છે" },
  pooja_ganesh_pooja_benefit_4: { en: "Brings prosperity", hi: "समृद्धि लाता है", gu: "સમૃદ્ધિ લાવે છે" },
  pooja_ganesh_pooja_benefit_5: { en: "Blesses with good fortune", hi: "अच्छे भाग्य से आशीर्वाद देता है", gu: "સારા ભાગ્યથી આશીર્વાદ આપે છે" },
  pooja_ganesh_pooja_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_ganesh_pooja_process_1: { en: "Invocation of Lord Ganesh", hi: "भगवान गणेश का आह्वान", gu: "ભગવાન ગણેશનું આહ્વાન" },
  pooja_ganesh_pooja_process_2: { en: "Chanting of Ganesh Mantras", hi: "गणेश मंत्रों का जाप", gu: "ગણેશ મંત્રોનો જાપ" },
  pooja_ganesh_pooja_process_3: { en: "Offering of sweets and flowers", hi: "मिठाई और फूलों का भोग", gu: "મિઠાઈ અને ફૂલોનો ભોગ" },
  pooja_ganesh_pooja_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_ganesh_pooja_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_hanuman_pooja_subtitle: { en: "Eternal Devotion & Strength", hi: "शाश्वत भक्ति और शक्ति", gu: "શાશ્વત ભક્તિ અને શક્તિ" },
  pooja_hanuman_pooja_description: { en: "Hanuman Puja invokes Lord Hanuman for strength, courage, and devotion. Protects from evil and ensures victory.", hi: "हनुमान पूजा शक्ति, साहस और भक्ति के लिए भगवान हनुमान का आह्वान करती है। बुराई से बचाती है।", gu: "હનુમાન પૂજા શક્તિ, હિંમત અને ભક્તિ માટે ભગવાન હનુમાનનું આહ્વાન કરે છે. દુષ્ટતાથી બચાવે છે." },
  pooja_hanuman_pooja_bestFor: { en: "Those seeking strength, protection, and spiritual growth", hi: "शक्ति, सुरक्षा और आध्यात्मिक विकास चाहने वाले", gu: "શક્તિ, સંરક્ષણ અને આધ્યાત્મિક વિકાસ શોધનારા" },
  pooja_hanuman_pooja_whenToPerform: { en: "Tuesday most auspicious for Hanuman Puja", hi: "मंगलवार हनुमान पूजा के लिए सबसे शुभ", gu: "મંગળવાર હનુમાન પૂજા માટે સૌથી શુભ" },
  pooja_hanuman_pooja_benefit_0: { en: "Brings courage and strength", hi: "साहस और शक्ति लाता है", gu: "હિંમત અને શક્તિ લાવે છે" },
  pooja_hanuman_pooja_benefit_1: { en: "Removes fear and anxiety", hi: "डर और चिंता दूर करता है", gu: "ડર અને ચિંતા દૂર કરે છે" },
  pooja_hanuman_pooja_benefit_2: { en: "Provides protection from evil", hi: "बुराई से सुरक्षा प्रदान करता है", gu: "દુષ્ટતાથી સંરક્ષણ આપે છે" },
  pooja_hanuman_pooja_benefit_3: { en: "Brings victory in challenges", hi: "चुनौतियों में विजय लाता है", gu: "પડકારોમાં વિજય લાવે છે" },
  pooja_hanuman_pooja_benefit_4: { en: "Enhances devotion and faith", hi: "भक्ति और विश्वास बढ़ाता है", gu: "ભક્તિ અને વિશ્વાસ વધારે છે" },
  pooja_hanuman_pooja_benefit_5: { en: "Ensures good health", hi: "अच्छा स्वास्थ्य सुनिश्चित करता है", gu: "સારું આરોગ્ય ખાતરી કરે છે" },
  pooja_hanuman_pooja_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_hanuman_pooja_process_1: { en: "Invocation of Lord Hanuman", hi: "भगवान हनुमान का आह्वान", gu: "ભગવાન હનુમાનનું આહ્વાન" },
  pooja_hanuman_pooja_process_2: { en: "Chanting of Hanuman Chalisa", hi: "हनुमान चालीसा का पाठ", gu: "હનુમાન ચાલીસાનું પાઠન" },
  pooja_hanuman_pooja_process_3: { en: "Offering of red flowers", hi: "लाल फूलों का भोग", gu: "લાલ ફૂલોનો ભોગ" },
  pooja_hanuman_pooja_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_hanuman_pooja_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_vishnu_pooja_subtitle: { en: "Preserver of Universe", hi: "ब्रह्मांड के संरक्षक", gu: "બ્રહ્માંડના સંરક્ષક" },
  pooja_vishnu_pooja_description: { en: "Vishnu Puja invokes Lord Vishnu for protection and prosperity. Brings peace, harmony, and spiritual fulfillment.", hi: "विष्णु पूजा सुरक्षा और समृद्धि के लिए भगवान विष्णु का आह्वान करती है। शांति और सामंजस्य लाती है।", gu: "વિષ્ણુ પૂજા સંરક્ષણ અને સમૃદ્ધિ માટે ભગવાન વિષ્ણુનું આહ્વાન કરે છે. શાંતિ અને સંવાદિતા લાવે છે." },
  pooja_vishnu_pooja_bestFor: { en: "Devotees seeking divine protection and prosperity", hi: "दिव्य सुरक्षा और समृद्धि चाहने वाले भक्त", gu: "દિવ્ય સંરક્ષણ અને સમૃદ્ધિ શોધનારા ભક્તો" },
  pooja_vishnu_pooja_whenToPerform: { en: "Any day, especially Thursday", hi: "कोई भी दिन, विशेषकर गुरुवार", gu: "કોઈ પણ દિવસ, ખાસ કરીને ગુરુવાર" },
  pooja_vishnu_pooja_benefit_0: { en: "Brings divine protection", hi: "दिव्य सुरक्षा लाता है", gu: "દિવ્ય સંરક્ષણ લાવે છે" },
  pooja_vishnu_pooja_benefit_1: { en: "Ensures prosperity and wealth", hi: "समृद्धि और धन सुनिश्चित करता है", gu: "સમૃદ્ધિ અને ધન ખાતરી કરે છે" },
  pooja_vishnu_pooja_benefit_2: { en: "Brings peace and harmony", hi: "शांति और सामंजस्य लाता है", gu: "શાંતિ અને સંવાદિતા લાવે છે" },
  pooja_vishnu_pooja_benefit_3: { en: "Removes negative influences", hi: "नकारात्मक प्रभाव दूर करता है", gu: "નકારાત્મક પ્રભાવ દૂર કરે છે" },
  pooja_vishnu_pooja_benefit_4: { en: "Protects family members", hi: "परिवार की रक्षा करता है", gu: "પરિવારનું રક્ષણ કરે છે" },
  pooja_vishnu_pooja_benefit_5: { en: "Brings spiritual fulfillment", hi: "आध्यात्मिक पूर्ति लाता है", gu: "આધ્યાત્મિક પૂર્ણતા લાવે છે" },
  pooja_vishnu_pooja_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_vishnu_pooja_process_1: { en: "Invocation of Lord Vishnu", hi: "भगवान विष्णु का आह्वान", gu: "ભગવાન વિષ્ણુનું આહ્વાન" },
  pooja_vishnu_pooja_process_2: { en: "Chanting of Vishnu Mantras", hi: "विष्णु मंत्रों का जाप", gu: "વિષ્ણુ મંત્રોનો જાપ" },
  pooja_vishnu_pooja_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_vishnu_pooja_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_vishnu_pooja_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_lakshmi_pooja_subtitle: { en: "Goddess of Wealth & Prosperity", hi: "धन और समृद्धि की देवी", gu: "ધન અને સમૃદ્ધિની દેવી" },
  pooja_lakshmi_pooja_description: { en: "Lakshmi Puja invokes Goddess Lakshmi for wealth, fortune, and prosperity. Attracts abundance and removes financial obstacles.", hi: "लक्ष्मी पूजा धन, भाग्य और समृद्धि के लिए देवी लक्ष्मी का आह्वान करती है। समृद्धि आकर्षित करती है।", gu: "લક્ષ્મી પૂજા ધન, ભાગ્ય અને સમૃદ્ધિ માટે દેવી લક્ષ્મીનું આહ્વાન કરે છે. સમૃદ્ધિ આકર્ષે છે." },
  pooja_lakshmi_pooja_bestFor: { en: "Business owners, entrepreneurs, or those facing financial challenges", hi: "व्यापारी, उद्यमी या वित्तीय चुनौती वाले", gu: "વ્યવસાયીઓ, ઉદ્યમીઓ અથવા નાણાકીય પડકારો" },
  pooja_lakshmi_pooja_whenToPerform: { en: "Traditionally during Diwali, but can be done anytime", hi: "पारंपरिक रूप से दिवाली पर, पर कभी भी किया जा सकता है", gu: "પરંપરાગત રીતે દિવાળી પર, પરંતુ કોઈ પણ સમયે કરી શકાય" },
  pooja_lakshmi_pooja_benefit_0: { en: "Attracts wealth and prosperity", hi: "धन और समृद्धि आकर्षित करता है", gu: "ધન અને સમૃદ્ધિ આકર્ષે છે" },
  pooja_lakshmi_pooja_benefit_1: { en: "Removes financial difficulties", hi: "वित्तीय कठिनाइयों को दूर करता है", gu: "નાણાકીય મુશ્કેલીઓ દૂર કરે છે" },
  pooja_lakshmi_pooja_benefit_2: { en: "Brings good fortune", hi: "अच्छा भाग्य लाता है", gu: "સારું ભાગ્ય લાવે છે" },
  pooja_lakshmi_pooja_benefit_3: { en: "Increases business success", hi: "व्यापार सफलता बढ़ाता है", gu: "વ્યવસાય સફળતા વધારે છે" },
  pooja_lakshmi_pooja_benefit_4: { en: "Removes negative influences", hi: "नकारात्मक प्रभाव दूर करता है", gu: "નકારાત્મક પ્રભાવ દૂર કરે છે" },
  pooja_lakshmi_pooja_benefit_5: { en: "Brings happiness and contentment", hi: "सुख और संतोष लाता है", gu: "સુખ અને સંતોષ લાવે છે" },
  pooja_lakshmi_pooja_process_0: { en: "Space purification and decoration", hi: "स्थान शुद्धि और सजावट", gu: "જગ્યા શુદ્ધિ અને સજાવટ" },
  pooja_lakshmi_pooja_process_1: { en: "Invocation of Lord Ganesha", hi: "भगवान गणेश का आह्वान", gu: "ભગવાન ગણેશનું આહ્વાન" },
  pooja_lakshmi_pooja_process_2: { en: "Chanting of Lakshmi Chalisa", hi: "लक्ष्मी चालीसा का पाठ", gu: "લક્ષ્મી ચાલીસાનું પાઠન" },
  pooja_lakshmi_pooja_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_lakshmi_pooja_process_4: { en: "Lighting of lamps (Diya)", hi: "दीप जलाना", gu: "દીપ જળાવવું" },
  pooja_lakshmi_pooja_process_5: { en: "Final blessings and Prasad", hi: "अंतिम आशीर्वाद और प्रसाद", gu: "અંતિમ આશીર્વાદ અને પ્રસાદ" },
  pooja_maha_mrityunjay_subtitle: { en: "Victory Over Death & Disease", hi: "मृत्यु और रोग पर विजय", gu: "મૃત્યુ અને રોગ પર વિજય" },
  pooja_maha_mrityunjay_description: { en: "Maha Mrityunjay Mantra Jap invokes Lord Shiva for protection from illness and premature death. Removes health obstacles.", hi: "महा मृत्युंजय मंत्र जाप बीमारी और अकाल मृत्यु से सुरक्षा के लिए भगवान शिव का आह्वान करता है। स्वास्थ्य बाधाएं दूर करता है।", gu: "મહા મૃત્યુંજય મંત્ર જાપ બીમારી અને અકાળ મૃત્યુથી સંરક્ષણ માટે ભગવાન શિવનું આહ્વાન કરે છે. આરોગ્ય અવરોધો દૂર કરે છે." },
  pooja_maha_mrityunjay_bestFor: { en: "Those facing health challenges, seeking longevity, or after accidents", hi: "स्वास्थ्य चुनौती, दीर्घायु या दुर्घटना के बाद वाले", gu: "આરોગ્ય પડકારો, દીર્ઘાયુ અથવા અકસ્માત પછી" },
  pooja_maha_mrityunjay_whenToPerform: { en: "Anytime, especially during Full Moon", hi: "कभी भी, विशेषकर पूर्णिमा पर", gu: "કોઈ પણ સમયે, ખાસ કરીને પૂર્ણિમા પર" },
  pooja_maha_mrityunjay_benefit_0: { en: "Heals chronic diseases", hi: "पुरानी बीमारियों को ठीक करता है", gu: "જૂની બીમારીઓ ઠીક કરે છે" },
  pooja_maha_mrityunjay_benefit_1: { en: "Protects from accidents", hi: "दुर्घटनाओं से बचाता है", gu: "અકસ્માતોથી બચાવે છે" },
  pooja_maha_mrityunjay_benefit_2: { en: "Removes fear of death", hi: "मृत्यु का डर दूर करता है", gu: "મૃત્યુનો ડર દૂર કરે છે" },
  pooja_maha_mrityunjay_benefit_3: { en: "Enhances longevity", hi: "दीर्घायु बढ़ाता है", gu: "દીર્ઘાયુ વધારે છે" },
  pooja_maha_mrityunjay_benefit_4: { en: "Brings good health", hi: "अच्छा स्वास्थ्य लाता है", gu: "સારું આરોગ્ય લાવે છે" },
  pooja_maha_mrityunjay_benefit_5: { en: "Ensures safe travels", hi: "सुरक्षित यात्रा सुनिश्चित करता है", gu: "સુરક્ષિત યાત્રા ખાતરી કરે છે" },
  pooja_maha_mrityunjay_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_maha_mrityunjay_process_1: { en: "Invocation of Lord Shiva", hi: "भगवान शिव का आह्वान", gu: "ભગવાન શિવનું આહ્વાન" },
  pooja_maha_mrityunjay_process_2: { en: "Chanting of Maha Mrityunjay Mantra (11,000+ times)", hi: "महा मृत्युंजय मंत्र जाप (11,000+ बार)", gu: "મહા મૃત્યુંજય મંત્ર જાપ (11,000+ વખત)" },
  pooja_maha_mrityunjay_process_3: { en: "Offering of flowers", hi: "फूलों का भोग", gu: "ફૂલોનો ભોગ" },
  pooja_maha_mrityunjay_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_maha_mrityunjay_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_durga_navarna_subtitle: { en: "Nine Sacred Names of Durga", hi: "दुर्गा के नौ पवित्र नाम", gu: "દુર્ગાના નવ પવિત્ર નામ" },
  pooja_durga_navarna_description: { en: "Durga Navarna Mantra Jap chants the nine sacred names of Goddess Durga. Grants protection and removes all obstacles.", hi: "दुर्गा नवार्ण मंत्र जाप देवी दुर्गा के नौ पवित्र नामों का जाप करता है। सुरक्षा और सभी बाधाएं दूर करता है।", gu: "દુર્ગા નવાર્ણ મંત્ર જાપ દેવી દુર્ગાના નવ પવિત્ર નામોનો જાપ કરે છે. સંરક્ષણ અને બધા અવરોધો દૂર કરે છે." },
  pooja_durga_navarna_bestFor: { en: "Those facing major life obstacles or seeking divine protection", hi: "बड़ी जीवन बाधा या दिव्य सुरक्षा चाहने वाले", gu: "મોટી જીવન અવરોધ અથવા દિવ્ય સંરક્ષણ શોધનારા" },
  pooja_durga_navarna_whenToPerform: { en: "Navratri most auspicious", hi: "नवरात्रि सबसे शुभ", gu: "નવરાત્રિ સૌથી શુભ" },
  pooja_durga_navarna_benefit_0: { en: "Removes all obstacles", hi: "सभी बाधाएं दूर करता है", gu: "બધા અવરોધો દૂર કરે છે" },
  pooja_durga_navarna_benefit_1: { en: "Brings victory and success", hi: "विजय और सफलता लाता है", gu: "વિજય અને સફળતા લાવે છે" },
  pooja_durga_navarna_benefit_2: { en: "Provides divine protection", hi: "दिव्य सुरक्षा प्रदान करता है", gu: "દિવ્ય સંરક્ષણ આપે છે" },
  pooja_durga_navarna_benefit_3: { en: "Removes evil influences", hi: "बुराई प्रभाव दूर करता है", gu: "દુષ્ટ પ્રભાવ દૂર કરે છે" },
  pooja_durga_navarna_benefit_4: { en: "Brings prosperity", hi: "समृद्धि लाता है", gu: "સમૃદ્ધિ લાવે છે" },
  pooja_durga_navarna_benefit_5: { en: "Ensures spiritual growth", hi: "आध्यात्मिक विकास सुनिश्चित करता है", gu: "આધ્યાત્મિક વિકાસ ખાતરી કરે છે" },
  pooja_durga_navarna_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_durga_navarna_process_1: { en: "Invocation of Goddess Durga", hi: "देवी दुर्गा का आह्वान", gu: "દેવી દુર્ગાનું આહ્વાન" },
  pooja_durga_navarna_process_2: { en: "Chanting of Nine Names (9,000+ times)", hi: "नौ नामों का जाप (9,000+ बार)", gu: "નવ નામોનો જાપ (9,000+ વખત)" },
  pooja_durga_navarna_process_3: { en: "Offering of flowers and fruits", hi: "फूल और फल का भोग", gu: "ફૂલ અને ફળનો ભોગ" },
  pooja_durga_navarna_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_durga_navarna_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // Dosh pujas: kaal_sarp, surya_shani, shani_rahu, mangal_rahu, guru_rahu, chandra_rahu
  pooja_kaal_sarp_dosh_subtitle: { en: "Breaking the Serpent's Curse", hi: "सर्प शाप का निवारण", gu: "સર્પ શાપનું નિવારણ" },
  pooja_kaal_sarp_dosh_description: { en: "Kaal Sarp Dosh Nivaran pacifies Kaal Sarp Dosha in the birth chart. Removes the curse and brings relief from life obstacles.", hi: "काल सर्प दोष निवारण जन्म कुंडली में काल सर्प दोष को शांत करता है। शाप दूर करता है।", gu: "કાલ સર્પ દોષ નિવારણ જન્મ કુંડળીમાં કાલ સર્પ દોષ શાંત કરે છે. શાપ દૂર કરે છે." },
  pooja_kaal_sarp_dosh_bestFor: { en: "Those having Kaal Sarp Dosha in birth chart", hi: "जन्म कुंडली में काल सर्प दोष वाले", gu: "જન્મ કુંડળીમાં કાલ સર્પ દોષ" },
  pooja_kaal_sarp_dosh_whenToPerform: { en: "Immediately upon discovery of Kaal Sarp Dosha", hi: "काल सर्प दोष की खोज पर तुरंत", gu: "કાલ સર્પ દોષ શોધ પર તરત જ" },
  pooja_kaal_sarp_dosh_benefit_0: { en: "Removes Kaal Sarp Dosha effects", hi: "काल सर्प दोष प्रभाव दूर करता है", gu: "કાલ સર્પ દોષ પ્રભાવ દૂર કરે છે" },
  pooja_kaal_sarp_dosh_benefit_1: { en: "Brings relief from repeated failures", hi: "बार-बार असफलता से राहत", gu: "બાર-બાર નિષ્ફળતાથી રાહત" },
  pooja_kaal_sarp_dosh_benefit_2: { en: "Ensures financial stability", hi: "वित्तीय स्थिरता सुनिश्चित करता है", gu: "નાણાકીય સ્થિરતા ખાતરી કરે છે" },
  pooja_kaal_sarp_dosh_benefit_3: { en: "Brings harmony in relationships", hi: "रिश्तों में सामंजस्य लाता है", gu: "સંબંધોમાં સંવાદિતા લાવે છે" },
  pooja_kaal_sarp_dosh_benefit_4: { en: "Removes health issues", hi: "स्वास्थ्य समस्याएं दूर करता है", gu: "આરોગ્ય સમસ્યાઓ દૂર કરે છે" },
  pooja_kaal_sarp_dosh_benefit_5: { en: "Brings overall progress", hi: "समग्र प्रगति लाता है", gu: "સંપૂર્ણ પ્રગતિ લાવે છે" },
  pooja_kaal_sarp_dosh_process_0: { en: "Extensive space purification", hi: "व्यापक स्थान शुद्धि", gu: "વ્યાપક જગ્યા શુદ્ધિ" },
  pooja_kaal_sarp_dosh_process_1: { en: "Invocation of deities", hi: "देवताओं का आह्वान", gu: "દેવતાઓનું આહ્વાન" },
  pooja_kaal_sarp_dosh_process_2: { en: "Chanting of Kaal Sarp Mantras", hi: "काल सर्प मंत्रों का जाप", gu: "કાલ સર્પ મંત્રોનો જાપ" },
  pooja_kaal_sarp_dosh_process_3: { en: "Ritual worship with specific offerings", hi: "विशिष्ट भोग के साथ पूजा", gu: "ચોક્કસ ભોગ સાથે પૂજા" },
  pooja_kaal_sarp_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_kaal_sarp_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_surya_shani_dosh_subtitle: { en: "Sun-Saturn Curse Resolution", hi: "सूर्य-शनि शाप समाधान", gu: "સૂર્ય-શનિ શાપ ઉકેલ" },
  pooja_surya_shani_dosh_description: { en: "Addresses combined curse of Sun and Saturn. Brings relief from chronic problems and obstacles.", hi: "सूर्य और शनि के संयुक्त शाप को संबोधित करता है। पुरानी समस्याओं से राहत।", gu: "સૂર્ય અને શનિના સંયુક્ત શાપને સંબોધે છે. જૂની સમસ્યાઓથી રાહત." },
  pooja_surya_shani_dosh_bestFor: { en: "Those with Surya-Shani Shapit Dosha affecting career and health", hi: "करियर और स्वास्थ्य पर प्रभाव डालने वाले सूर्य-शनि दोष वाले", gu: "કારકિર્દી અને આરોગ્યને અસર કરતા સૂર્ય-શનિ દોષ" },
  pooja_surya_shani_dosh_whenToPerform: { en: "As soon as dosha is identified", hi: "दोष की पहचान होते ही", gu: "દોષ ઓળખાતા જ" },
  pooja_surya_shani_dosh_benefit_0: { en: "Removes Surya-Shani curse effects", hi: "सूर्य-शनि शाप प्रभाव दूर करता है", gu: "સૂર્ય-શનિ શાપ પ્રભાવ દૂર કરે છે" },
  pooja_surya_shani_dosh_benefit_1: { en: "Brings career advancement", hi: "करियर में उन्नति लाता है", gu: "કારકિર્દીમાં પ્રગતિ લાવે છે" },
  pooja_surya_shani_dosh_benefit_2: { en: "Removes health issues", hi: "स्वास्थ्य समस्याएं दूर करता है", gu: "આરોગ્ય સમસ્યાઓ દૂર કરે છે" },
  pooja_surya_shani_dosh_benefit_3: { en: "Brings financial stability", hi: "वित्तीय स्थिरता लाता है", gu: "નાણાકીય સ્થિરતા લાવે છે" },
  pooja_surya_shani_dosh_benefit_4: { en: "Removes father-related problems", hi: "पिता से संबंधित समस्याएं दूर करता है", gu: "પિતા સંબંધિત સમસ્યાઓ દૂર કરે છે" },
  pooja_surya_shani_dosh_benefit_5: { en: "Ensures family harmony", hi: "परिवार सामंजस्य सुनिश्चित करता है", gu: "પરિવાર સંવાદિતા ખાતરી કરે છે" },
  pooja_surya_shani_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_surya_shani_dosh_process_1: { en: "Invocation of Surya and Shani", hi: "सूर्य और शनि का आह्वान", gu: "સૂર્ય અને શનિનું આહ્વાન" },
  pooja_surya_shani_dosh_process_2: { en: "Chanting of combined mantras", hi: "संयुक्त मंत्रों का जाप", gu: "સંયુક્ત મંત્રોનો જાપ" },
  pooja_surya_shani_dosh_process_3: { en: "Specific offerings and ritual", hi: "विशिष्ट भोग और विधि", gu: "ચોક્કસ ભોગ અને વિધિ" },
  pooja_surya_shani_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_surya_shani_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_shani_rahu_dosh_subtitle: { en: "Saturn-Rahu Curse Resolution", hi: "शनि-राहु शाप समाधान", gu: "શનિ-રાહુ શાપ ઉકેલ" },
  pooja_shani_rahu_dosh_description: { en: "Removes combined curse of Saturn and Rahu. Brings clarity and removes sudden obstacles.", hi: "शनि और राहु के संयुक्त शाप को दूर करता है। स्पष्टता लाता है।", gu: "શનિ અને રાહુનો સંયુક્ત શાપ દૂર કરે છે. સ્પષ્ટતા લાવે છે." },
  pooja_shani_rahu_dosh_bestFor: { en: "Those facing Shani-Rahu combined curse effects", hi: "शनि-राहु संयुक्त शाप प्रभाव वाले", gu: "શનિ-રાહુ સંયુક્ત શાપ પ્રભાવ" },
  pooja_shani_rahu_dosh_whenToPerform: { en: "As soon as dosha is identified", hi: "दोष की पहचान होते ही", gu: "દોષ ઓળખાતા જ" },
  pooja_shani_rahu_dosh_benefit_0: { en: "Removes confusion and illusion", hi: "भ्रम और भ्रांति दूर करता है", gu: "ભ્રમ અને ભ્રાંતિ દૂર કરે છે" },
  pooja_shani_rahu_dosh_benefit_1: { en: "Brings career success", hi: "करियर सफलता लाता है", gu: "કારકિર્દી સફળતા લાવે છે" },
  pooja_shani_rahu_dosh_benefit_2: { en: "Removes unexpected obstacles", hi: "अप्रत्याशित बाधाएं दूर करता है", gu: "અણધારી અવરોધો દૂર કરે છે" },
  pooja_shani_rahu_dosh_benefit_3: { en: "Ensures financial security", hi: "वित्तीय सुरक्षा सुनिश्चित करता है", gu: "નાણાકીય સુરક્ષા ખાતરી કરે છે" },
  pooja_shani_rahu_dosh_benefit_4: { en: "Brings clarity of thought", hi: "विचारों की स्पष्टता लाता है", gu: "વિચારોની સ્પષ્ટતા લાવે છે" },
  pooja_shani_rahu_dosh_benefit_5: { en: "Protects from deception", hi: "धोखे से बचाता है", gu: "ઘોષણાથી બચાવે છે" },
  pooja_shani_rahu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_shani_rahu_dosh_process_1: { en: "Invocation of Shani and Rahu", hi: "शनि और राहु का आह्वान", gu: "શનિ અને રાહુનું આહ્વાન" },
  pooja_shani_rahu_dosh_process_2: { en: "Chanting of combined mantras", hi: "संयुक्त मंत्रों का जाप", gu: "સંયુક્ત મંત્રોનો જાપ" },
  pooja_shani_rahu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_shani_rahu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_shani_rahu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_mangal_rahu_dosh_subtitle: { en: "Mars-Rahu Curse Resolution", hi: "मंगल-राहु शाप समाधान", gu: "મંગળ-રાહુ શાપ ઉકેલ" },
  pooja_mangal_rahu_dosh_description: { en: "Addresses Angarak Dosha by Mars and Rahu. Removes obstacles in marriage and relationships.", hi: "मंगल और राहु द्वारा अंगारक दोष को संबोधित करता है। विवाह में बाधाएं दूर करता है।", gu: "મંગળ અને રાહુ દ્વારા અંગારક દોષને સંબોધે છે. લગ્નમાં અવરોધો દૂર કરે છે." },
  pooja_mangal_rahu_dosh_bestFor: { en: "Those with Mangal-Rahu Dosha affecting marriage and relationships", hi: "विवाह और रिश्तों को प्रभावित करने वाले मंगल-राहु दोष वाले", gu: "લગ્ન અને સંબંધોને અસર કરતા મંગળ-રાહુ દોષ" },
  pooja_mangal_rahu_dosh_whenToPerform: { en: "Before marriage or when facing relationship issues", hi: "विवाह से पहले या रिश्तों की समस्या होने पर", gu: "લગ્ન પહેલાં અથવા સંબંધ સમસ્યા હોય ત્યારે" },
  pooja_mangal_rahu_dosh_benefit_0: { en: "Removes Angarak Dosha effects", hi: "अंगारक दोष प्रभाव दूर करता है", gu: "અંગારક દોષ પ્રભાવ દૂર કરે છે" },
  pooja_mangal_rahu_dosh_benefit_1: { en: "Ensures successful marriage", hi: "सफल विवाह सुनिश्चित करता है", gu: "સફળ લગ્ન ખાતરી કરે છે" },
  pooja_mangal_rahu_dosh_benefit_2: { en: "Removes relationship conflicts", hi: "रिश्तों के विवाद दूर करता है", gu: "સંબંધ વિવાદ દૂર કરે છે" },
  pooja_mangal_rahu_dosh_benefit_3: { en: "Protects from accidents", hi: "दुर्घटनाओं से बचाता है", gu: "અકસ્માતોથી બચાવે છે" },
  pooja_mangal_rahu_dosh_benefit_4: { en: "Brings courage and confidence", hi: "साहस और आत्मविश्वास लाता है", gu: "હિંમત અને આત્મવિશ્વાસ લાવે છે" },
  pooja_mangal_rahu_dosh_benefit_5: { en: "Ensures family harmony", hi: "परिवार सामंजस्य सुनिश्चित करता है", gu: "પરિવાર સંવાદિતા ખાતરી કરે છે" },
  pooja_mangal_rahu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_mangal_rahu_dosh_process_1: { en: "Invocation of Mangal and Rahu", hi: "मंगल और राहु का आह्वान", gu: "મંગળ અને રાહુનું આહ્વાન" },
  pooja_mangal_rahu_dosh_process_2: { en: "Chanting of combined mantras", hi: "संयुक्त मंत्रों का जाप", gu: "સંયુક્ત મંત્રોનો જાપ" },
  pooja_mangal_rahu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_mangal_rahu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_mangal_rahu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_guru_rahu_dosh_subtitle: { en: "Jupiter-Rahu Curse Resolution", hi: "गुरु-राहु शाप समाधान", gu: "ગુરુ-રાહુ શાપ ઉકેલ" },
  pooja_guru_rahu_dosh_description: { en: "Addresses Chandal Dosha by Jupiter and Rahu. Removes obstacles in education and spiritual growth.", hi: "गुरु और राहु द्वारा चंडाल दोष को संबोधित करता है। शिक्षा में बाधाएं दूर करता है।", gu: "ગુરુ અને રાહુ દ્વારા ચંડાલ દોષને સંબોધે છે. શિક્ષણમાં અવરોધો દૂર કરે છે." },
  pooja_guru_rahu_dosh_bestFor: { en: "Students and spiritual seekers facing Guru-Rahu Chandal Dosha", hi: "गुरु-राहु चंडाल दोष वाले छात्र और साधक", gu: "ગુરુ-રાહુ ચંડાલ દોષ વાળા વિદ્યાર્થીઓ" },
  pooja_guru_rahu_dosh_whenToPerform: { en: "Before important educational pursuits", hi: "महत्वपूर्ण शैक्षणिक प्रयासों से पहले", gu: "મહત્વપૂર્ણ શૈક્ષણિક પ્રયાસો પહેલાં" },
  pooja_guru_rahu_dosh_benefit_0: { en: "Removes education obstacles", hi: "शिक्षा में बाधाएं दूर करता है", gu: "શિક્ષણમાં અવરોધો દૂર કરે છે" },
  pooja_guru_rahu_dosh_benefit_1: { en: "Ensures spiritual progress", hi: "आध्यात्मिक प्रगति सुनिश्चित करता है", gu: "આધ્યાત્મિક પ્રગતિ ખાતરી કરે છે" },
  pooja_guru_rahu_dosh_benefit_2: { en: "Brings wisdom and knowledge", hi: "ज्ञान और बुद्धि लाता है", gu: "જ્ઞાન અને બુદ્ધિ લાવે છે" },
  pooja_guru_rahu_dosh_benefit_3: { en: "Removes confusion", hi: "भ्रम दूर करता है", gu: "ભ્રમ દૂર કરે છે" },
  pooja_guru_rahu_dosh_benefit_4: { en: "Attracts prosperity", hi: "समृद्धि आकर्षित करता है", gu: "સમૃદ્ધિ આકર્ષે છે" },
  pooja_guru_rahu_dosh_benefit_5: { en: "Brings good fortune", hi: "अच्छा भाग्य लाता है", gu: "સારું ભાગ્ય લાવે છે" },
  pooja_guru_rahu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_guru_rahu_dosh_process_1: { en: "Invocation of Guru and Rahu", hi: "गुरु और राहु का आह्वान", gu: "ગુરુ અને રાહુનું આહ્વાન" },
  pooja_guru_rahu_dosh_process_2: { en: "Chanting of combined mantras", hi: "संयुक्त मंत्रों का जाप", gu: "સંયુક્ત મંત્રોનો જાપ" },
  pooja_guru_rahu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_guru_rahu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_guru_rahu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_chandra_rahu_dosh_subtitle: { en: "Moon-Rahu Eclipse Curse Resolution", hi: "चंद्र-राहु ग्रहण शाप समाधान", gu: "ચંદ્ર-રાહુ ગ્રહણ શાપ ઉકેલ" },
  pooja_chandra_rahu_dosh_description: { en: "Addresses Grahan Dosha by Moon and Rahu. Removes mental disturbances and brings emotional balance.", hi: "चंद्र और राहु द्वारा ग्रहण दोष को संबोधित करता है। मानसिक अशांति दूर करता है।", gu: "ચંદ્ર અને રાહુ દ્વારા ગ્રહણ દોષને સંબોધે છે. માનસિક અશાંતિ દૂર કરે છે." },
  pooja_chandra_rahu_dosh_bestFor: { en: "Those facing mental issues or emotional disturbances due to this dosha", hi: "इस दोष के कारण मानसिक या भावनात्मक समस्या वाले", gu: "આ દોષના કારણે માનસિક અથવા ભાવનાત્મક સમસ્યા" },
  pooja_chandra_rahu_dosh_whenToPerform: { en: "Immediately upon identification", hi: "पहचान होते ही तुरंत", gu: "ઓળખાતા જ તરત જ" },
  pooja_chandra_rahu_dosh_benefit_0: { en: "Removes mental disturbances", hi: "मानसिक अशांति दूर करता है", gu: "માનસિક અશાંતિ દૂર કરે છે" },
  pooja_chandra_rahu_dosh_benefit_1: { en: "Brings emotional balance", hi: "भावनात्मक संतुलन लाता है", gu: "ભાવનાત્મક સંતુલન લાવે છે" },
  pooja_chandra_rahu_dosh_benefit_2: { en: "Ensures sound sleep", hi: "अच्छी नींद सुनिश्चित करता है", gu: "સારી ઊંઘ ખાતરી કરે છે" },
  pooja_chandra_rahu_dosh_benefit_3: { en: "Removes anxiety and fear", hi: "चिंता और डर दूर करता है", gu: "ચિંતા અને ડર દૂર કરે છે" },
  pooja_chandra_rahu_dosh_benefit_4: { en: "Improves family relationships", hi: "परिवार के रिश्ते सुधारता है", gu: "પરિવાર સંબંધો સુધારે છે" },
  pooja_chandra_rahu_dosh_benefit_5: { en: "Brings inner peace", hi: "आंतरिक शांति लाता है", gu: "આંતરિક શાંતિ લાવે છે" },
  pooja_chandra_rahu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_chandra_rahu_dosh_process_1: { en: "Invocation of Chandra and Rahu", hi: "चंद्र और राहु का आह्वान", gu: "ચંદ્ર અને રાહુનું આહ્વાન" },
  pooja_chandra_rahu_dosh_process_2: { en: "Chanting of combined mantras", hi: "संयुक्त मंत्रों का जाप", gu: "સંયુક્ત મંત્રોનો જાપ" },
  pooja_chandra_rahu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_chandra_rahu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_chandra_rahu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // surya_rahu_dosh, surya_ketu_dosh, surya_mangal_dosh, surya_chandra_amavasya_dosh
  pooja_surya_rahu_dosh_subtitle: { en: "Sun-Rahu Eclipse Remedy", hi: "सूर्य-राहु ग्रहण उपचार", gu: "સૂર્ય-રાહુ ગ્રહણ ઉપચાર" },
  pooja_surya_rahu_dosh_description: { en: "This puja addresses the Grahan Dosha formed by Sun and Rahu, reducing ego conflicts and bringing stability in career and authority matters.", hi: "यह पूजा सूर्य और राहु द्वारा बने ग्रहण दोष को संबोधित करती है, अहंकार संघर्ष कम करती है और करियर व अधिकार में स्थिरता लाती है।", gu: "આ પૂજા સૂર્ય અને રાહુ દ્વારા બનેલા ગ્રહણ દોષને સંબોધે છે, અહંકાર સંઘર્ષ ઘટાડે છે અને કારકિર્દી અને અધિકારમાં સ્થિરતા લાવે છે." },
  pooja_surya_rahu_dosh_bestFor: { en: "Those facing Surya-Rahu Grahan Dosha affecting career, authority, or ego-related issues", hi: "करियर, अधिकार या अहंकार संबंधी समस्याओं से प्रभावित सूर्य-राहु ग्रहण दोष वाले", gu: "કારકિર્દી, અધિકાર અથવા અહંકાર સંબંધિત સમસ્યાઓથી પ્રભાવિત સૂર્ય-રાહુ ગ્રહણ દોષ" },
  pooja_surya_rahu_dosh_whenToPerform: { en: "When Grahan Dosha is identified or during eclipses", hi: "ग्रहण दोष की पहचान होने पर या ग्रहण के दौरान", gu: "ગ્રહણ દોષ ઓળખાતા અથવા ગ્રહણ દરમિયાન" },
  pooja_surya_rahu_dosh_benefit_0: { en: "Reduces negative Sun-Rahu influences", hi: "सूर्य-राहु के नकारात्मक प्रभाव कम करता है", gu: "સૂર્ય-રાહુના નકારાત્મક પ્રભાવ ઘટાડે છે" },
  pooja_surya_rahu_dosh_benefit_1: { en: "Brings stability in career and authority", hi: "करियर और अधिकार में स्थिरता लाता है", gu: "કારકિર્દી અને અધિકારમાં સ્થિરતા લાવે છે" },
  pooja_surya_rahu_dosh_benefit_2: { en: "Removes sudden setbacks and public-image issues", hi: "अचानक असफलता और सार्वजनिक छवि समस्याएं दूर करता है", gu: "અચાનક નિષ્ફળતા અને જાહેર છબી સમસ્યાઓ દૂર કરે છે" },
  pooja_surya_rahu_dosh_benefit_3: { en: "Improves relationship with father and mentors", hi: "पिता और गुरुओं के साथ संबंध सुधारता है", gu: "પિતા અને ગુરુઓ સાથે સંબંધ સુધારે છે" },
  pooja_surya_rahu_dosh_benefit_4: { en: "Brings clarity and confidence", hi: "स्पष्टता और आत्मविश्वास लाता है", gu: "સ્પષ્ટતા અને આત્મવિશ્વાસ લાવે છે" },
  pooja_surya_rahu_dosh_benefit_5: { en: "Ensures protection from ego-driven decisions", hi: "अहंकार से प्रेरित निर्णयों से सुरक्षा सुनिश्चित करता है", gu: "અહંકારથી પ્રેરિત નિર્ણયોથી સંરક્ષણ ખાતરી કરે છે" },
  pooja_surya_rahu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_surya_rahu_dosh_process_1: { en: "Invocation of Surya and Rahu", hi: "सूर्य और राहु का आह्वान", gu: "સૂર્ય અને રાહુનું આહ્વાન" },
  pooja_surya_rahu_dosh_process_2: { en: "Chanting of combined Surya-Rahu mantras", hi: "संयुक्त सूर्य-राहु मंत्रों का जाप", gu: "સંયુક્ત સૂર્ય-રાહુ મંત્રોનો જાપ" },
  pooja_surya_rahu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_surya_rahu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_surya_rahu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_surya_ketu_dosh_subtitle: { en: "Sun-Ketu Eclipse Remedy", hi: "सूर्य-केतु ग्रहण उपचार", gu: "સૂર્ય-કેતુ ગ્રહણ ઉપચાર" },
  pooja_surya_ketu_dosh_description: { en: "This puja addresses the Grahan Dosha formed by Sun and Ketu, removing spiritual confusion and bringing balance between material and spiritual life.", hi: "यह पूजा सूर्य और केतु द्वारा बने ग्रहण दोष को संबोधित करती है, आध्यात्मिक भ्रम दूर करती है और भौतिक व आध्यात्मिक जीवन में संतुलन लाती है।", gu: "આ પૂજા સૂર્ય અને કેતુ દ્વારા બનેલા ગ્રહણ દોષને સંબોધે છે, આધ્યાત્મિક ભ્રમ દૂર કરે છે અને ભૌતિક અને આધ્યાત્મિક જીવનમાં સંતુલન લાવે છે." },
  pooja_surya_ketu_dosh_bestFor: { en: "Those facing Surya-Ketu Grahan Dosha causing instability, detachment, or confusion", hi: "अस्थिरता, वैराग्य या भ्रम पैदा करने वाले सूर्य-केतु ग्रहण दोष वाले", gu: "અસ્થિરતા, વૈરાગ્ય અથવા ભ્રમ ઉત્પન્ન કરતા સૂર્ય-કેતુ ગ્રહણ દોષ" },
  pooja_surya_ketu_dosh_whenToPerform: { en: "When Grahan Dosha is identified or during eclipses", hi: "ग्रहण दोष की पहचान होने पर या ग्रहण के दौरान", gu: "ગ્રહણ દોષ ઓળખાતા અથવા ગ્રહણ દરમિયાન" },
  pooja_surya_ketu_dosh_benefit_0: { en: "Reduces negative Sun-Ketu influences", hi: "सूर्य-केतु के नकारात्मक प्रभाव कम करता है", gu: "સૂર્ય-કેતુના નકારાત્મક પ્રભાવ ઘટાડે છે" },
  pooja_surya_ketu_dosh_benefit_1: { en: "Brings balance between material and spiritual life", hi: "भौतिक और आध्यात्मिक जीवन में संतुलन लाता है", gu: "ભૌતિક અને આધ્યાત્મિક જીવનમાં સંતુલન લાવે છે" },
  pooja_surya_ketu_dosh_benefit_2: { en: "Removes career instability due to Ketu", hi: "केतु के कारण करियर अस्थिरता दूर करता है", gu: "કેતુના કારણે કારકિર્દી અસ્થિરતા દૂર કરે છે" },
  pooja_surya_ketu_dosh_benefit_3: { en: "Improves focus and decision-making", hi: "फोकस और निर्णय लेने में सुधार करता है", gu: "ફોકસ અને નિર્ણય લેવામાં સુધારો કરે છે" },
  pooja_surya_ketu_dosh_benefit_4: { en: "Protects from sudden losses", hi: "अचानक नुकसान से बचाता है", gu: "અચાનક નુકસાનથી બચાવે છે" },
  pooja_surya_ketu_dosh_benefit_5: { en: "Brings inner peace and clarity", hi: "आंतरिक शांति और स्पष्टता लाता है", gu: "આંતરિક શાંતિ અને સ્પષ્ટતા લાવે છે" },
  pooja_surya_ketu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_surya_ketu_dosh_process_1: { en: "Invocation of Surya and Ketu", hi: "सूर्य और केतु का आह्वान", gu: "સૂર્ય અને કેતુનું આહ્વાન" },
  pooja_surya_ketu_dosh_process_2: { en: "Chanting of combined Surya-Ketu mantras", hi: "संयुक्त सूर्य-केतु मंत्रों का जाप", gu: "સંયુક્ત સૂર્ય-કેતુ મંત્રોનો જાપ" },
  pooja_surya_ketu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_surya_ketu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_surya_ketu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_surya_mangal_dosh_subtitle: { en: "Sun-Mars Angarak Remedy", hi: "सूर्य-मंगल अंगारक उपचार", gu: "સૂર્ય-મંગળ અંગારક ઉપચાર" },
  pooja_surya_mangal_dosh_description: { en: "This puja pacifies the fiery combination of Sun and Mars, reducing anger, aggression, and conflicts in professional and personal life.", hi: "यह पूजा सूर्य और मंगल के अग्नि संयोजन को शांत करती है, क्रोध, आक्रामकता और पेशेवर व व्यक्तिगत जीवन में संघर्ष कम करती है।", gu: "આ પૂજા સૂર્ય અને મંગળના અગ્નિ સંયોજનને શાંત કરે છે, ગુસ્સો, આક્રમકતા અને વ્યાવસાયિક અને વ્યક્તિગત જીવનમાં સંઘર્ષ ઘટાડે છે." },
  pooja_surya_mangal_dosh_bestFor: { en: "Those facing Surya-Mangal Angarak Dosha causing anger, conflicts, or impulsive actions", hi: "क्रोध, संघर्ष या आवेगी कार्य पैदा करने वाले सूर्य-मंगल अंगारक दोष वाले", gu: "ગુસ્સો, સંઘર્ષ અથવા આવેગશીલ ક્રિયાઓ ઉત્પન્ન કરતા સૂર્ય-મંગળ અંગારક દોષ" },
  pooja_surya_mangal_dosh_whenToPerform: { en: "On auspicious days for Sun or Mars, or when dosha is identified", hi: "सूर्य या मंगल के शुभ दिनों पर या दोष की पहचान होने पर", gu: "સૂર્ય અથવા મંગળ માટે શુભ દિવસો પર અથવા દોષ ઓળખાતા" },
  pooja_surya_mangal_dosh_benefit_0: { en: "Reduces anger and aggression", hi: "क्रोध और आक्रामकता कम करता है", gu: "ગુસ્સો અને આક્રમકતા ઘટાડે છે" },
  pooja_surya_mangal_dosh_benefit_1: { en: "Brings discipline and balanced leadership", hi: "अनुशासन और संतुलित नेतृत्व लाता है", gu: "શિસ્ત અને સંતુલિત નેતૃત્વ લાવે છે" },
  pooja_surya_mangal_dosh_benefit_2: { en: "Removes conflicts with authorities", hi: "अधिकारियों के साथ संघर्ष दूर करता है", gu: "અધિકારીઓ સાથે સંઘર્ષ દૂર કરે છે" },
  pooja_surya_mangal_dosh_benefit_3: { en: "Protects from accidents and injuries", hi: "दुर्घटनाओं और चोटों से बचाता है", gu: "અકસ્માત અને ઇજાઓથી બચાવે છે" },
  pooja_surya_mangal_dosh_benefit_4: { en: "Brings courage with humility", hi: "विनम्रता के साथ साहस लाता है", gu: "નમ્રતા સાથે હિંમત લાવે છે" },
  pooja_surya_mangal_dosh_benefit_5: { en: "Ensures harmony in family and workplace", hi: "परिवार और कार्यस्थल में सामंजस्य सुनिश्चित करता है", gu: "પરિવાર અને કાર્યસ્થળમાં સંવાદિતા ખાતરી કરે છે" },
  pooja_surya_mangal_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_surya_mangal_dosh_process_1: { en: "Invocation of Surya and Mangal", hi: "सूर्य और मंगल का आह्वान", gu: "સૂર્ય અને મંગળનું આહ્વાન" },
  pooja_surya_mangal_dosh_process_2: { en: "Chanting of combined Surya-Mangal mantras", hi: "संयुक्त सूर्य-मंगल मंत्रों का जाप", gu: "સંયુક્ત સૂર્ય-મંગળ મંત્રોનો જાપ" },
  pooja_surya_mangal_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_surya_mangal_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_surya_mangal_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_surya_chandra_amavasya_dosh_subtitle: { en: "Sun-Moon Amavasya Remedy", hi: "सूर्य-चंद्र अमावस्या उपचार", gu: "સૂર્ય-ચંદ્ર અમાવસ્યા ઉપચાર" },
  pooja_surya_chandra_amavasya_dosh_description: { en: "This puja pacifies the Amavasya Dosha formed by Sun and Moon, bringing emotional balance, mental peace, and harmony in relationships.", hi: "यह पूजा सूर्य और चंद्र द्वारा बने अमावस्या दोष को शांत करती है, भावनात्मक संतुलन, मानसिक शांति और रिश्तों में सामंजस्य लाती है।", gu: "આ પૂજા સૂર્ય અને ચંદ્ર દ્વારા બનેલા અમાવસ્યા દોષને શાંત કરે છે, ભાવનાત્મક સંતુલન, માનસિક શાંતિ અને સંબંધોમાં સંવાદિતા લાવે છે." },
  pooja_surya_chandra_amavasya_dosh_bestFor: { en: "Those facing emotional imbalance, family disharmony, or Amavasya-related dosha", hi: "भावनात्मक असंतुलन, पारिवारिक कलह या अमावस्या संबंधी दोष वाले", gu: "ભાવનાત્મક અસંતુલન, પારિવારિક કલહ અથવા અમાવસ્યા સંબંધિત દોષ" },
  pooja_surya_chandra_amavasya_dosh_whenToPerform: { en: "Preferably on Amavasya or when dosha is identified", hi: "अमावस्या पर या दोष की पहचान होने पर", gu: "અમાવસ્યા પર અથવા દોષ ઓળખાતા" },
  pooja_surya_chandra_amavasya_dosh_benefit_0: { en: "Removes Amavasya-related disturbances", hi: "अमावस्या संबंधी अशांति दूर करता है", gu: "અમાવસ્યા સંબંધિત અશાંતિ દૂર કરે છે" },
  pooja_surya_chandra_amavasya_dosh_benefit_1: { en: "Brings emotional stability", hi: "भावनात्मक स्थिरता लाता है", gu: "ભાવનાત્મક સ્થિરતા લાવે છે" },
  pooja_surya_chandra_amavasya_dosh_benefit_2: { en: "Improves relationship with parents", hi: "माता-पिता के साथ संबंध सुधारता है", gu: "માતા-પિતા સાથે સંબંધ સુધારે છે" },
  pooja_surya_chandra_amavasya_dosh_benefit_3: { en: "Reduces mood swings and confusion", hi: "मूड स्विंग और भ्रम कम करता है", gu: "મૂડ સ્વિંગ અને ભ્રમ ઘટાડે છે" },
  pooja_surya_chandra_amavasya_dosh_benefit_4: { en: "Brings peace at home", hi: "घर में शांति लाता है", gu: "ઘરમાં શાંતિ લાવે છે" },
  pooja_surya_chandra_amavasya_dosh_benefit_5: { en: "Supports spiritual growth", hi: "आध्यात्मिक विकास का समर्थन करता है", gu: "આધ્યાત્મિક વિકાસને ટેકો આપે છે" },
  pooja_surya_chandra_amavasya_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_surya_chandra_amavasya_dosh_process_1: { en: "Invocation of Surya and Chandra", hi: "सूर्य और चंद्र का आह्वान", gu: "સૂર્ય અને ચંદ્રનું આહ્વાન" },
  pooja_surya_chandra_amavasya_dosh_process_2: { en: "Chanting of Surya-Chandra mantras", hi: "सूर्य-चंद्र मंत्रों का जाप", gu: "સૂર્ય-ચંદ્ર મંત્રોનો જાપ" },
  pooja_surya_chandra_amavasya_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_surya_chandra_amavasya_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_surya_chandra_amavasya_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // shani_ketu_dosh, shani_chandra_vish_yog_dosh, mangal_ketu_dosh, guru_ketu_dosh, chandra_ketu_dosh
  pooja_shani_ketu_dosh_subtitle: { en: "Saturn-Ketu Curse Remedy", hi: "शनि-केतु शाप उपचार", gu: "શનિ-કેતુ શાપ ઉપચાર" },
  pooja_shani_ketu_dosh_description: { en: "This puja remedies the difficult combination of Saturn and Ketu, reducing prolonged struggles, isolation, and karmic obstacles.", hi: "यह पूजा शनि और केतु के कठिन संयोजन का उपचार करती है, लंबे संघर्ष, अलगाव और कर्मिक बाधाओं को कम करती है।", gu: "આ પૂજા શનિ અને કેતુના કઠણ સંયોજનનો ઉપચાર કરે છે, લાંબા સંઘર્ષ, અલગતા અને કર્મિક અવરોધો ઘટાડે છે." },
  pooja_shani_ketu_dosh_bestFor: { en: "Those facing long-term struggles, delays, or Shani-Ketu Shapit Dosha", hi: "लंबे संघर्ष, देरी या शनि-केतु शापित दोष वाले", gu: "લાંબા સંઘર્ષ, વિલંબ અથવા શનિ-કેતુ શાપિત દોષ" },
  pooja_shani_ketu_dosh_whenToPerform: { en: "On Saturdays or when dosha is identified", hi: "शनिवार को या दोष की पहचान होने पर", gu: "શનિવારે અથવા દોષ ઓળખાતા" },
  pooja_shani_ketu_dosh_benefit_0: { en: "Reduces Shani-Ketu negative influences", hi: "शनि-केतु के नकारात्मक प्रभाव कम करता है", gu: "શનિ-કેતુના નકારાત્મક પ્રભાવ ઘટાડે છે" },
  pooja_shani_ketu_dosh_benefit_1: { en: "Brings stability in career and finances", hi: "करियर और वित्त में स्थिरता लाता है", gu: "કારકિર્દી અને નાણાંમાં સ્થિરતા લાવે છે" },
  pooja_shani_ketu_dosh_benefit_2: { en: "Removes feelings of isolation and stagnation", hi: "अलगाव और ठहराव की भावना दूर करता है", gu: "અલગતા અને ઠહેરાવની લાગણી દૂર કરે છે" },
  pooja_shani_ketu_dosh_benefit_3: { en: "Supports resolution of past karmic issues", hi: "पिछले कर्मिक मुद्दों के समाधान का समर्थन करता है", gu: "ભૂતકાળના કર્મિક મુદ્દાઓના ઉકેલને ટેકો આપે છે" },
  pooja_shani_ketu_dosh_benefit_4: { en: "Brings disciplined spiritual growth", hi: "अनुशासित आध्यात्मिक विकास लाता है", gu: "શિસ્તબદ્ધ આધ્યાત્મિક વિકાસ લાવે છે" },
  pooja_shani_ketu_dosh_benefit_5: { en: "Ensures steady progress in life", hi: "जीवन में स्थिर प्रगति सुनिश्चित करता है", gu: "જીવનમાં સ્થિર પ્રગતિ ખાતરી કરે છે" },
  pooja_shani_ketu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_shani_ketu_dosh_process_1: { en: "Invocation of Shani and Ketu", hi: "शनि और केतु का आह्वान", gu: "શનિ અને કેતુનું આહ્વાન" },
  pooja_shani_ketu_dosh_process_2: { en: "Chanting of combined Shani-Ketu mantras", hi: "संयुक्त शनि-केतु मंत्रों का जाप", gu: "સંયુક્ત શનિ-કેતુ મંત્રોનો જાપ" },
  pooja_shani_ketu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_shani_ketu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_shani_ketu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_shani_chandra_vish_yog_dosh_subtitle: { en: "Saturn-Moon Vish Yog Remedy", hi: "शनि-चंद्र विष योग उपचार", gu: "શનિ-ચંદ્ર વિષ યોગ ઉપચાર" },
  pooja_shani_chandra_vish_yog_dosh_description: { en: "This puja pacifies Vish Yog formed by Saturn and Moon, reducing depression, fear, and emotional heaviness.", hi: "यह पूजा शनि और चंद्र द्वारा बने विष योग को शांत करती है, अवसाद, भय और भावनात्मक भारीपन कम करती है।", gu: "આ પૂજા શનિ અને ચંદ્ર દ્વારા બનેલા વિષ યોગને શાંત કરે છે, ઉદાસીનતા, ભય અને ભાવનાત્મક ભાર ઘટાડે છે." },
  pooja_shani_chandra_vish_yog_dosh_bestFor: { en: "Those facing Shani-Chandra Vish Yog causing depression or emotional heaviness", hi: "अवसाद या भावनात्मक भारीपन पैदा करने वाले शनि-चंद्र विष योग वाले", gu: "ઉદાસીનતા અથવા ભાવનાત્મક ભાર ઉત્પન્ન કરતા શનિ-ચંદ્ર વિષ યોગ" },
  pooja_shani_chandra_vish_yog_dosh_whenToPerform: { en: "On Mondays or Saturdays, or when dosha is identified", hi: "सोमवार या शनिवार को या दोष की पहचान होने पर", gu: "સોમવાર અથવા શનિવારે અથવા દોષ ઓળખાતા" },
  pooja_shani_chandra_vish_yog_dosh_benefit_0: { en: "Reduces Vish Yog effects", hi: "विष योग प्रभाव कम करता है", gu: "વિષ યોગ પ્રભાવ ઘટાડે છે" },
  pooja_shani_chandra_vish_yog_dosh_benefit_1: { en: "Brings emotional resilience", hi: "भावनात्मक लचीलापन लाता है", gu: "ભાવનાત્મક સ્થિતિસ્થાપકતા લાવે છે" },
  pooja_shani_chandra_vish_yog_dosh_benefit_2: { en: "Removes chronic sadness and fear", hi: "पुराने दुख और भय दूर करता है", gu: "જૂની દુઃખ અને ભય દૂર કરે છે" },
  pooja_shani_chandra_vish_yog_dosh_benefit_3: { en: "Improves sleep and peace of mind", hi: "नींद और मानसिक शांति में सुधार करता है", gu: "ઊંઘ અને માનસિક શાંતિમાં સુધારો કરે છે" },
  pooja_shani_chandra_vish_yog_dosh_benefit_4: { en: "Strengthens relationships with family", hi: "परिवार के साथ संबंध मजबूत करता है", gu: "પરિવાર સાથે સંબંધ મજબૂત કરે છે" },
  pooja_shani_chandra_vish_yog_dosh_benefit_5: { en: "Brings hope and positivity", hi: "आशा और सकारात्मकता लाता है", gu: "આશા અને સકારાત્મકતા લાવે છે" },
  pooja_shani_chandra_vish_yog_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_shani_chandra_vish_yog_dosh_process_1: { en: "Invocation of Shani and Chandra", hi: "शनि और चंद्र का आह्वान", gu: "શનિ અને ચંદ્રનું આહ્વાન" },
  pooja_shani_chandra_vish_yog_dosh_process_2: { en: "Chanting of Vish Yog mantras", hi: "विष योग मंत्रों का जाप", gu: "વિષ યોગ મંત્રોનો જાપ" },
  pooja_shani_chandra_vish_yog_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_shani_chandra_vish_yog_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_shani_chandra_vish_yog_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_mangal_ketu_dosh_subtitle: { en: "Mars-Ketu Angarak Remedy", hi: "मंगल-केतु अंगारक उपचार", gu: "મંગળ-કેતુ અંગારક ઉપચાર" },
  pooja_mangal_ketu_dosh_description: { en: "This puja addresses Angarak Dosha formed by Mars and Ketu, reducing impulsiveness and conflicts in property, siblings, and courage-related matters.", hi: "यह पूजा मंगल और केतु द्वारा बने अंगारक दोष को संबोधित करती है, संपत्ति, भाई-बहन और साहस संबंधी मामलों में आवेगशीलता और संघर्ष कम करती है।", gu: "આ પૂજા મંગળ અને કેતુ દ્વારા બનેલા અંગારક દોષને સંબોધે છે, મિલકત, ભાઈ-બહેન અને હિંમત સંબંધિત મામલાઓમાં આવેગશીલતા અને સંઘર્ષ ઘટાડે છે." },
  pooja_mangal_ketu_dosh_bestFor: { en: "Those facing Mangal-Ketu Angarak Dosha causing conflicts, risks, or impulsive behavior", hi: "संघर्ष, जोखिम या आवेगी व्यवहार पैदा करने वाले मंगल-केतु अंगारक दोष वाले", gu: "સંઘર્ષ, જોખમ અથવા આવેગશીલ વર્તન ઉત્પન્ન કરતા મંગળ-કેતુ અંગારક દોષ" },
  pooja_mangal_ketu_dosh_whenToPerform: { en: "On Tuesdays or when dosha is identified", hi: "मंगलवार को या दोष की पहचान होने पर", gu: "મંગળવારે અથવા દોષ ઓળખાતા" },
  pooja_mangal_ketu_dosh_benefit_0: { en: "Reduces impulsive actions", hi: "आवेगी कार्य कम करता है", gu: "આવેગશીલ ક્રિયાઓ ઘટાડે છે" },
  pooja_mangal_ketu_dosh_benefit_1: { en: "Removes conflicts related to property and courage", hi: "संपत्ति और साहस से संबंधित संघर्ष दूर करता है", gu: "મિલકત અને હિંમત સંબંધિત સંઘર્ષ દૂર કરે છે" },
  pooja_mangal_ketu_dosh_benefit_2: { en: "Protects from accidents and injuries", hi: "दुर्घटनाओं और चोटों से बचाता है", gu: "અકસ્માત અને ઇજાઓથી બચાવે છે" },
  pooja_mangal_ketu_dosh_benefit_3: { en: "Brings constructive energy and discipline", hi: "रचनात्मक ऊर्जा और अनुशासन लाता है", gu: "રચનાત્મક ઊર્જા અને શિસ્ત લાવે છે" },
  pooja_mangal_ketu_dosh_benefit_4: { en: "Supports harmonious relationships", hi: "सामंजस्यपूर्ण रिश्तों का समर्थन करता है", gu: "સંવાદિતાપૂર્ણ સંબંધોને ટેકો આપે છે" },
  pooja_mangal_ketu_dosh_benefit_5: { en: "Ensures steady progress in efforts", hi: "प्रयासों में स्थिर प्रगति सुनिश्चित करता है", gu: "પ્રયાસોમાં સ્થિર પ્રગતિ ખાતરી કરે છે" },
  pooja_mangal_ketu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_mangal_ketu_dosh_process_1: { en: "Invocation of Mangal and Ketu", hi: "मंगल और केतु का आह्वान", gu: "મંગળ અને કેતુનું આહ્વાન" },
  pooja_mangal_ketu_dosh_process_2: { en: "Chanting of combined Mangal-Ketu mantras", hi: "संयुक्त मंगल-केतु मंत्रों का जाप", gu: "સંયુક્ત મંગળ-કેતુ મંત્રોનો જાપ" },
  pooja_mangal_ketu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_mangal_ketu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_mangal_ketu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_guru_ketu_dosh_subtitle: { en: "Jupiter-Ketu Curse Remedy", hi: "गुरु-केतु शाप उपचार", gu: "ગુરુ-કેતુ શાપ ઉપચાર" },
  pooja_guru_ketu_dosh_description: { en: "This puja remedies the Chandal Dosha formed by Jupiter and Ketu, bringing clarity in spiritual path and higher education.", hi: "यह पूजा गुरु और केतु द्वारा बने चंडाल दोष का उपचार करती है, आध्यात्मिक मार्ग और उच्च शिक्षा में स्पष्टता लाती है।", gu: "આ પૂજા ગુરુ અને કેતુ દ્વારા બનેલા ચંડાલ દોષનો ઉપચાર કરે છે, આધ્યાત્મિક માર્ગ અને ઉચ્ચ શિક્ષણમાં સ્પષ્ટતા લાવે છે." },
  pooja_guru_ketu_dosh_bestFor: { en: "Students and seekers facing Guru-Ketu Chandal Dosha or confusion in faith and studies", hi: "गुरु-केतु चंडाल दोष या विश्वास और अध्ययन में भ्रम वाले छात्र और साधक", gu: "ગુરુ-કેતુ ચંડાલ દોષ અથવા વિશ્વાસ અને અભ્યાસમાં ભ્રમ વાળા વિદ્યાર્થીઓ" },
  pooja_guru_ketu_dosh_whenToPerform: { en: "On Thursdays or when dosha is identified", hi: "गुरुवार को या दोष की पहचान होने पर", gu: "ગુરુવારે અથવા દોષ ઓળખાતા" },
  pooja_guru_ketu_dosh_benefit_0: { en: "Reduces Guru-Ketu negative influences", hi: "गुरु-केतु के नकारात्मक प्रभाव कम करता है", gu: "ગુરુ-કેતુના નકારાત્મક પ્રભાવ ઘટાડે છે" },
  pooja_guru_ketu_dosh_benefit_1: { en: "Removes obstacles in higher education", hi: "उच्च शिक्षा में बाधाएं दूर करता है", gu: "ઉચ્ચ શિક્ષણમાં અવરોધો દૂર કરે છે" },
  pooja_guru_ketu_dosh_benefit_2: { en: "Brings clarity in spiritual and life purpose", hi: "आध्यात्मिक और जीवन उद्देश्य में स्पष्टता लाता है", gu: "આધ્યાત્મિક અને જીવન ઉદ્દેશ્યમાં સ્પષ્ટતા લાવે છે" },
  pooja_guru_ketu_dosh_benefit_3: { en: "Reduces confusion in beliefs", hi: "विश्वास में भ्रम कम करता है", gu: "વિશ્વાસમાં ભ્રમ ઘટાડે છે" },
  pooja_guru_ketu_dosh_benefit_4: { en: "Attracts divine grace and guidance", hi: "दिव्य कृपा और मार्गदर्शन आकर्षित करता है", gu: "દિવ્ય કૃપા અને માર્ગદર્શન આકર્ષે છે" },
  pooja_guru_ketu_dosh_benefit_5: { en: "Brings wisdom with humility", hi: "विनम्रता के साथ ज्ञान लाता है", gu: "નમ્રતા સાથે જ્ઞાન લાવે છે" },
  pooja_guru_ketu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_guru_ketu_dosh_process_1: { en: "Invocation of Guru and Ketu", hi: "गुरु और केतु का आह्वान", gu: "ગુરુ અને કેતુનું આહ્વાન" },
  pooja_guru_ketu_dosh_process_2: { en: "Chanting of combined Guru-Ketu mantras", hi: "संयुक्त गुरु-केतु मंत्रों का जाप", gu: "સંયુક્ત ગુરુ-કેતુ મંત્રોનો જાપ" },
  pooja_guru_ketu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_guru_ketu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_guru_ketu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_chandra_ketu_dosh_subtitle: { en: "Moon-Ketu Eclipse Remedy", hi: "चंद्र-केतु ग्रहण उपचार", gu: "ચંદ્ર-કેતુ ગ્રહણ ઉપચાર" },
  pooja_chandra_ketu_dosh_description: { en: "This puja addresses the Grahan Dosha formed by Moon and Ketu, bringing emotional healing, intuitive clarity, and relief from past-life karmic fears.", hi: "यह पूजा चंद्र और केतु द्वारा बने ग्रहण दोष को संबोधित करती है, भावनात्मक उपचार, अंतर्ज्ञानी स्पष्टता और पिछले जन्म के कर्मिक भय से राहत लाती है।", gu: "આ પૂજા ચંદ્ર અને કેતુ દ્વારા બનેલા ગ્રહણ દોષને સંબોધે છે, ભાવનાત્મક ઉપચાર, અંતર્જ્ઞાની સ્પષ્ટતા અને ભૂતકાળના કર્મિક ભયથી રાહત લાવે છે." },
  pooja_chandra_ketu_dosh_bestFor: { en: "Those facing Chandra-Ketu Grahan Dosha causing fear, confusion, or emotional instability", hi: "भय, भ्रम या भावनात्मक अस्थिरता पैदा करने वाले चंद्र-केतु ग्रहण दोष वाले", gu: "ભય, ભ્રમ અથવા ભાવનાત્મક અસ્થિરતા ઉત્પન્ન કરતા ચંદ્ર-કેતુ ગ્રહણ દોષ" },
  pooja_chandra_ketu_dosh_whenToPerform: { en: "On auspicious lunar days or when dosha is identified", hi: "शुभ चंद्र दिनों पर या दोष की पहचान होने पर", gu: "શુભ ચંદ્ર દિવસો પર અથવા દોષ ઓળખાતા" },
  pooja_chandra_ketu_dosh_benefit_0: { en: "Reduces Moon-Ketu negative influences", hi: "चंद्र-केतु के नकारात्मक प्रभाव कम करता है", gu: "ચંદ્ર-કેતુના નકારાત્મક પ્રભાવ ઘટાડે છે" },
  pooja_chandra_ketu_dosh_benefit_1: { en: "Brings emotional healing and inner peace", hi: "भावनात्मक उपचार और आंतरिक शांति लाता है", gu: "ભાવનાત્મક ઉપચાર અને આંતરિક શાંતિ લાવે છે" },
  pooja_chandra_ketu_dosh_benefit_2: { en: "Improves imagination and intuition positively", hi: "कल्पना और अंतर्ज्ञान को सकारात्मक रूप से सुधारता है", gu: "કલ્પના અને અંતર્જ્ઞાનને સકારાત્મક રીતે સુધારે છે" },
  pooja_chandra_ketu_dosh_benefit_3: { en: "Removes hidden fears and anxieties", hi: "छिपे हुए भय और चिंता दूर करता है", gu: "છુપાયેલા ભય અને ચિંતા દૂર કરે છે" },
  pooja_chandra_ketu_dosh_benefit_4: { en: "Brings harmony in family relationships", hi: "पारिवारिक संबंधों में सामंजस्य लाता है", gu: "પારિવારિક સંબંધોમાં સંવાદિતા લાવે છે" },
  pooja_chandra_ketu_dosh_benefit_5: { en: "Supports spiritual progress", hi: "आध्यात्मिक प्रगति का समर्थन करता है", gu: "આધ્યાત્મિક પ્રગતિને ટેકો આપે છે" },
  pooja_chandra_ketu_dosh_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_chandra_ketu_dosh_process_1: { en: "Invocation of Chandra and Ketu", hi: "चंद्र और केतु का आह्वान", gu: "ચંદ્ર અને કેતુનું આહ્વાન" },
  pooja_chandra_ketu_dosh_process_2: { en: "Chanting of combined Chandra-Ketu mantras", hi: "संयुक्त चंद्र-केतु मंत्रों का जाप", gu: "સંયુક્ત ચંદ્ર-કેતુ મંત્રોનો જાપ" },
  pooja_chandra_ketu_dosh_process_3: { en: "Specific ritual offerings", hi: "विशिष्ट विधि भोग", gu: "ચોક્કસ વિધિ ભોગ" },
  pooja_chandra_ketu_dosh_process_4: { en: "Extended Aarti", hi: "विस्तृत आरती", gu: "વિસ્તૃત આરતી" },
  pooja_chandra_ketu_dosh_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // laghu_rudra, navchandi_yagna
  pooja_laghu_rudra_subtitle: { en: "Fire Ritual for Shiva's Blessings", hi: "शिव के आशीर्वाद के लिए अग्नि विधि", gu: "શિવના આશીર્વાદ માટે અગ્નિ વિધિ" },
  pooja_laghu_rudra_description: { en: "Laghu Rudra is a sacred fire ritual with Homa offerings to Lord Shiva. Removes negative influences and brings divine grace.", hi: "लघु रुद्र भगवान शिव को होम भोग के साथ पवित्र अग्नि विधि है। नकारात्मक प्रभाव दूर करता है।", gu: "લઘુ રુદ્ર ભગવાન શિવને હોમ ભોગ સાથે પવિત્ર અગ્નિ વિધિ છે. નકારાત્મક પ્રભાવ દૂર કરે છે." },
  pooja_laghu_rudra_bestFor: { en: "Those seeking major life transformations or divine intervention", hi: "बड़े जीवन परिवर्तन या दिव्य हस्तक्षेप चाहने वाले", gu: "મોટા જીવન પરિવર્તન અથવા દિવ્ય હસ્તક્ષેપ શોધનારા" },
  pooja_laghu_rudra_whenToPerform: { en: "Any auspicious time, especially during Full Moon", hi: "कोई शुभ समय, विशेषकर पूर्णिमा पर", gu: "કોઈ શુભ સમય, ખાસ કરીને પૂર્ણિમા પર" },
  pooja_laghu_rudra_benefit_0: { en: "Removes all negative influences", hi: "सभी नकारात्मक प्रभाव दूर करता है", gu: "બધા નકારાત્મક પ્રભાવ દૂર કરે છે" },
  pooja_laghu_rudra_benefit_1: { en: "Brings divine grace and blessings", hi: "दिव्य कृपा और आशीर्वाद लाता है", gu: "દિવ્ય કૃપા અને આશીર્વાદ લાવે છે" },
  pooja_laghu_rudra_benefit_2: { en: "Ensures prosperity and success", hi: "समृद्धि और सफलता सुनिश्चित करता है", gu: "સમૃદ્ધિ અને સફળતા ખાતરી કરે છે" },
  pooja_laghu_rudra_benefit_3: { en: "Removes past karmic debts", hi: "पिछले कर्म ऋण दूर करता है", gu: "ભૂતકાળના કર્મ ઋણ દૂર કરે છે" },
  pooja_laghu_rudra_benefit_4: { en: "Brings spiritual awakening", hi: "आध्यात्मिक जागृति लाता है", gu: "આધ્યાત્મિક જાગૃતિ લાવે છે" },
  pooja_laghu_rudra_benefit_5: { en: "Protects family from harm", hi: "परिवार को नुकसान से बचाता है", gu: "પરિવારને નુકસાનથી બચાવે છે" },
  pooja_laghu_rudra_process_0: { en: "Space purification and preparation", hi: "स्थान शुद्धि और तैयारी", gu: "જગ્યા શુદ્ધિ અને તૈયારી" },
  pooja_laghu_rudra_process_1: { en: "Establishment of sacred fire", hi: "पवित्र अग्नि की स्थापना", gu: "પવિત્ર અગ્નિની સ્થાપના" },
  pooja_laghu_rudra_process_2: { en: "Invocation of Lord Shiva", hi: "भगवान शिव का आह्वान", gu: "ભગવાન શિવનું આહ્વાન" },
  pooja_laghu_rudra_process_3: { en: "Chanting of mantras", hi: "मंत्रों का जाप", gu: "મંત્રોનો જાપ" },
  pooja_laghu_rudra_process_4: { en: "Homa offerings", hi: "होम भोग", gu: "હોમ ભોગ" },
  pooja_laghu_rudra_process_5: { en: "Aarti and blessings", hi: "आरती और आशीर्वाद", gu: "આરતી અને આશીર્વાદ" },
  pooja_navchandi_yagna_subtitle: { en: "Grand Vedic Fire Ritual", hi: "महान वैदिक अग्नि विधि", gu: "મહાન વૈદિક અગ્નિ વિધિ" },
  pooja_navchandi_yagna_description: { en: "Navchandi Yagna invokes Goddess Durga through nine sacred chantings. Removes all obstacles and brings supreme blessings.", hi: "नवचंडी यज्ञ नौ पवित्र जाप के माध्यम से देवी दुर्गा का आह्वान करता है। सभी बाधाएं दूर करता है।", gu: "નવચંડી યજ્ઞ નવ પવિત્ર જાપ દ્વારા દેવી દુર્ગાનું આહ્વાન કરે છે. બધા અવરોધો દૂર કરે છે." },
  pooja_navchandi_yagna_bestFor: { en: "Those seeking comprehensive life transformation and divine grace", hi: "व्यापक जीवन परिवर्तन और दिव्य कृपा चाहने वाले", gu: "વ્યાપક જીવન પરિવર્તન અને દિવ્ય કૃપા શોધનારા" },
  pooja_navchandi_yagna_whenToPerform: { en: "Navratri or any auspicious period", hi: "नवरात्रि या कोई शुभ अवधि", gu: "નવરાત્રિ અથવા કોઈ શુભ અવધિ" },
  pooja_navchandi_yagna_benefit_0: { en: "Removes all major obstacles", hi: "सभी प्रमुख बाधाएं दूर करता है", gu: "બધા મુખ્ય અવરોધો દૂર કરે છે" },
  pooja_navchandi_yagna_benefit_1: { en: "Brings supreme divine blessings", hi: "सर्वोच्च दिव्य आशीर्वाद लाता है", gu: "સર્વોચ્ચ દિવ્ય આશીર્વાદ લાવે છે" },
  pooja_navchandi_yagna_benefit_2: { en: "Ensures victory in all endeavors", hi: "सभी प्रयासों में विजय सुनिश्चित करता है", gu: "બધા પ્રયાસોમાં વિજય ખાતરી કરે છે" },
  pooja_navchandi_yagna_benefit_3: { en: "Removes generational curses", hi: "पीढ़ीगत शाप दूर करता है", gu: "પેઢી શાપ દૂર કરે છે" },
  pooja_navchandi_yagna_benefit_4: { en: "Brings spiritual transformation", hi: "आध्यात्मिक परिवर्तन लाता है", gu: "આધ્યાત્મિક પરિવર્તન લાવે છે" },
  pooja_navchandi_yagna_benefit_5: { en: "Ensures peace and prosperity for generations", hi: "पीढ़ियों के लिए शांति और समृद्धि सुनिश्चित करता है", gu: "પેઢીઓ માટે શાંતિ અને સમૃદ્ધિ ખાતરી કરે છે" },
  pooja_navchandi_yagna_process_0: { en: "Elaborate space preparation", hi: "विस्तृत स्थान तैयारी", gu: "વિસ્તૃત જગ્યા તૈયારી" },
  pooja_navchandi_yagna_process_1: { en: "Multiple sacred fires", hi: "कई पवित्र अग्नि", gu: "અનેક પવિત્ર અગ્નિ" },
  pooja_navchandi_yagna_process_2: { en: "Invocation of Goddess Durga", hi: "देवी दुर्गा का आह्वान", gu: "દેવી દુર્ગાનું આહ્વાન" },
  pooja_navchandi_yagna_process_3: { en: "Chanting of Devi Mahatmya", hi: "देवी महात्म्य का पाठ", gu: "દેવી મહાત્મ્યનું પાઠન" },
  pooja_navchandi_yagna_process_4: { en: "Extensive Homa offerings", hi: "व्यापक होम भोग", gu: "વ્યાપક હોમ ભોગ" },
  pooja_navchandi_yagna_process_5: { en: "Grand Aarti and blessings", hi: "महान आरती और आशीर्वाद", gu: "મહાન આરતી અને આશીર્વાદ" },
  // ganesh_atharvashirsha_laddu_havan, pathatmak_laghu_rudra
  pooja_ganesh_atharvashirsha_laddu_havan_subtitle: { en: "Atharvashirsha Path with Laddu Havan", hi: "अथर्वशीर्ष पाठ के साथ लड्डू हवन", gu: "અથર્વશિર્ષ પાઠ સાથે લાડુ હવન" },
  pooja_ganesh_atharvashirsha_laddu_havan_description: { en: "This special Ganesh puja includes recitation of Ganapati Atharvashirsha along with a Laddu Havan. It invokes Lord Ganesha's blessings for removal of obstacles, prosperity, and auspicious beginnings.", hi: "यह विशेष गणेश पूजा में गणपति अथर्वशीर्ष का पाठ और लड्डू हवन शामिल है। यह बाधाओं को दूर करने, समृद्धि और शुभ शुरुआत के लिए भगवान गणेश का आशीर्वाद लाती है।", gu: "આ ખાસ ગણેશ પૂજામાં ગણપતિ અથર્વશિર્ષનું પાઠન અને લાડુ હવન શામેલ છે. અવરોધો દૂર કરવા, સમૃદ્ધિ અને શુભ શરૂઆત માટે ભગવાન ગણેશનું આશીર્વાદ લાવે છે." },
  pooja_ganesh_atharvashirsha_laddu_havan_bestFor: { en: "Those starting new ventures, facing obstacles, or seeking special Ganesh blessings", hi: "नई परियोजनाएं शुरू करने वाले, बाधाओं का सामना करने वाले या विशेष गणेश आशीर्वाद चाहने वाले", gu: "નવી યોજનાઓ શરૂ કરનારા, અવરોધોનો સામનો કરનારા અથવા ખાસ ગણેશ આશીર્વાદ શોધનારા" },
  pooja_ganesh_atharvashirsha_laddu_havan_whenToPerform: { en: "Before starting important work, on auspicious tithis, or during Ganesh festivals", hi: "महत्वपूर्ण कार्य शुरू करने से पहले, शुभ तिथियों पर या गणेश उत्सव के दौरान", gu: "મહત્વપૂર્ણ કાર્ય શરૂ કરતા પહેલાં, શુભ તિથિઓ પર અથવા ગણેશ ઉત્સવ દરમિયાન" },
  pooja_ganesh_atharvashirsha_laddu_havan_benefit_0: { en: "Removes major obstacles from life and new ventures", hi: "जीवन और नई परियोजनाओं से बड़ी बाधाएं दूर करता है", gu: "જીવન અને નવી યોજનાઓથી મોટા અવરોધો દૂર કરે છે" },
  pooja_ganesh_atharvashirsha_laddu_havan_benefit_1: { en: "Brings prosperity and success in business and career", hi: "व्यापार और करियर में समृद्धि और सफलता लाता है", gu: "વ્યવસાય અને કારકિર્દીમાં સમૃદ્ધિ અને સફળતા લાવે છે" },
  pooja_ganesh_atharvashirsha_laddu_havan_benefit_2: { en: "Ensures auspicious beginnings for important events", hi: "महत्वपूर्ण कार्यक्रमों के लिए शुभ शुरुआत सुनिश्चित करता है", gu: "મહત્વપૂર્ણ કાર્યક્રમો માટે શુભ શરૂઆત ખાતરી કરે છે" },
  pooja_ganesh_atharvashirsha_laddu_havan_benefit_3: { en: "Protects the family from negative influences", hi: "परिवार को नकारात्मक प्रभावों से बचाता है", gu: "પરિવારને નકારાત્મક પ્રભાવોથી બચાવે છે" },
  pooja_ganesh_atharvashirsha_laddu_havan_benefit_4: { en: "Brings wisdom, clarity, and focus", hi: "ज्ञान, स्पष्टता और फोकस लाता है", gu: "જ્ઞાન, સ્પષ્ટતા અને ફોકસ લાવે છે" },
  pooja_ganesh_atharvashirsha_laddu_havan_benefit_5: { en: "Invites Lord Ganesha's grace in home and workplace", hi: "घर और कार्यस्थल में भगवान गणेश की कृपा आमंत्रित करता है", gu: "ઘર અને કાર્યસ્થળમાં ભગવાન ગણેશની કૃપા આમંત્રિત કરે છે" },
  pooja_ganesh_atharvashirsha_laddu_havan_process_0: { en: "Space purification and Ganesh altar preparation", hi: "स्थान शुद्धि और गणेश वेदी तैयारी", gu: "જગ્યા શુદ્ધિ અને ગણેશ વેદી તૈયારી" },
  pooja_ganesh_atharvashirsha_laddu_havan_process_1: { en: "Invocation of Lord Ganesha", hi: "भगवान गणेश का आह्वान", gu: "ભગવાન ગણેશનું આહ્વાન" },
  pooja_ganesh_atharvashirsha_laddu_havan_process_2: { en: "Chanting of Ganapati Atharvashirsha", hi: "गणपति अथर्वशीर्ष का जाप", gu: "ગણપતિ અથર્વશિર્ષનો જાપ" },
  pooja_ganesh_atharvashirsha_laddu_havan_process_3: { en: "Laddu Havan with sacred offerings", hi: "पवित्र भोग के साथ लड्डू हवन", gu: "પવિત્ર ભોગ સાથે લાડુ હવન" },
  pooja_ganesh_atharvashirsha_laddu_havan_process_4: { en: "Aarti and collective prayers", hi: "आरती और सामूहिक प्रार्थना", gu: "આરતી અને સામૂહિક પ્રાર્થના" },
  pooja_ganesh_atharvashirsha_laddu_havan_process_5: { en: "Distribution of Prasad and blessings", hi: "प्रसाद वितरण और आशीर्वाद", gu: "પ્રસાદ વિતરણ અને આશીર્વાદ" },
  pooja_pathatmak_laghu_rudra_subtitle: { en: "Path-based Laghu Rudra Anushthan", hi: "पाठ आधारित लघु रुद्र अनुष्ठान", gu: "પાઠ આધારિત લઘુ રુદ્ર અનુષ્ઠાન" },
  pooja_pathatmak_laghu_rudra_description: { en: "Pathatmak Laghu Rudra is a recitation-based Laghu Rudra puja where Vedic mantras are chanted without full homa (fire offerings). It invokes Lord Shiva's blessings for purification, protection, and removal of obstacles while being simpler than a full homatmak yagna.", hi: "पाठात्मक लघु रुद्र एक पाठ आधारित लघु रुद्र पूजा है जहाँ पूर्ण होम के बिना वैदिक मंत्रों का जाप किया जाता है। यह शुद्धि, सुरक्षा और बाधाओं को दूर करने के लिए भगवान शिव का आशीर्वाद लाती है।", gu: "પાઠાત્મક લઘુ રુદ્ર એ પાઠ આધારિત લઘુ રુદ્ર પૂજા છે જ્યાં પૂર્ણ હોમ વિના વૈદિક મંત્રોનો જાપ થાય છે. શુદ્ધિ, સંરક્ષણ અને અવરોધો દૂર કરવા માટે ભગવાન શિવનું આશીર્વાદ લાવે છે." },
  pooja_pathatmak_laghu_rudra_bestFor: { en: "Families and devotees seeking Laghu Rudra benefits in a simpler, path-based format", hi: "सरल, पाठ आधारित प्रारूप में लघु रुद्र लाभ चाहने वाले परिवार और भक्त", gu: "સરળ, પાઠ આધારિત ફોર્મેટમાં લઘુ રુદ્ર લાભ શોધનારા પરિવાર અને ભક્તો" },
  pooja_pathatmak_laghu_rudra_whenToPerform: { en: "On Mondays, Pradosh, Shravan month, or any auspicious Shiva tithi", hi: "सोमवार, प्रदोष, श्रावण मास या किसी शुभ शिव तिथि पर", gu: "સોમવાર, પ્રદોષ, શ્રાવણ માસ અથવા કોઈ શુભ શિવ તિથિ પર" },
  pooja_pathatmak_laghu_rudra_benefit_0: { en: "Invokes Lord Shiva's grace through powerful Rudra path", hi: "शक्तिशाली रुद्र पाठ के माध्यम से भगवान शिव की कृपा लाता है", gu: "શક્તિશાળી રુદ્ર પાઠ દ્વારા ભગવાન શિવની કૃપા લાવે છે" },
  pooja_pathatmak_laghu_rudra_benefit_1: { en: "Removes negativity and subtle obstacles", hi: "नकारात्मकता और सूक्ष्म बाधाएं दूर करता है", gu: "નકારાત્મકતા અને સૂક્ષ્મ અવરોધો દૂર કરે છે" },
  pooja_pathatmak_laghu_rudra_benefit_2: { en: "Brings peace, health, and prosperity in the home", hi: "घर में शांति, स्वास्थ्य और समृद्धि लाता है", gu: "ઘરમાં શાંતિ, આરોગ્ય અને સમૃદ્ધિ લાવે છે" },
  pooja_pathatmak_laghu_rudra_benefit_3: { en: "Supports spiritual growth and inner purification", hi: "आध्यात्मिक विकास और आंतरिक शुद्धि का समर्थन करता है", gu: "આધ્યાત્મિક વિકાસ અને આંતરિક શુદ્ધિને ટેકો આપે છે" },
  pooja_pathatmak_laghu_rudra_benefit_4: { en: "Protects the family from unseen challenges", hi: "परिवार को अदृश्य चुनौतियों से बचाता है", gu: "પરિવારને અદૃશ્ય પડકારોથી બચાવે છે" },
  pooja_pathatmak_laghu_rudra_benefit_5: { en: "Good option when full homa is not feasible", hi: "जब पूर्ण होम संभव न हो तो अच्छा विकल्प", gu: "જ્યારે પૂર્ણ હોમ શક્ય ન હોય ત્યારે સારો વિકલ્પ" },
  pooja_pathatmak_laghu_rudra_process_0: { en: "Space purification and Shiv altar preparation", hi: "स्थान शुद्धि और शिव वेदी तैयारी", gu: "જગ્યા શુદ્ધિ અને શિવ વેદી તૈયારી" },
  pooja_pathatmak_laghu_rudra_process_1: { en: "Sankalpa and invocation of Lord Shiva", hi: "संकल्प और भगवान शिव का आह्वान", gu: "સંકલ્પ અને ભગવાન શિવનું આહ્વાન" },
  pooja_pathatmak_laghu_rudra_process_2: { en: "Pathatmak recitation of Laghu Rudra mantras", hi: "लघु रुद्र मंत्रों का पाठात्मक पाठ", gu: "લઘુ રુદ્ર મંત્રોનું પાઠાત્મક પાઠન" },
  pooja_pathatmak_laghu_rudra_process_3: { en: "Offering of flowers, bilva leaves, and sacred items", hi: "फूल, बेल पत्ते और पवित्र वस्तुओं का भोग", gu: "ફૂલ, બેલ પાંદડા અને પવિત્ર વસ્તુઓનો ભોગ" },
  pooja_pathatmak_laghu_rudra_process_4: { en: "Shiv aarti and collective prayers", hi: "शिव आरती और सामूहिक प्रार्थना", gu: "શિવ આરતી અને સામૂહિક પ્રાર્થના" },
  pooja_pathatmak_laghu_rudra_process_5: { en: "Prasad distribution and blessings", hi: "प्रसाद वितरण और आशीर्वाद", gu: "પ્રસાદ વિતરણ અને આશીર્વાદ" },
  // Nakshatra pujas: revati, mool, magha, jyestha, ashwini, ashlesha
  pooja_revati_nakshatra_subtitle: { en: "Protection & Prosperity Star", hi: "सुरक्षा और समृद्धि नक्षत्र", gu: "સંરક્ષણ અને સમૃદ્ધિ નક્ષત્ર" },
  pooja_revati_nakshatra_description: { en: "Revati Nakshatra Shanti pacifies negative effects of Revati nakshatra. Brings protection and prosperity.", hi: "रेवती नक्षत्र शांति रेवती नक्षत्र के नकारात्मक प्रभावों को शांत करती है। सुरक्षा और समृद्धि लाती है।", gu: "રેવતી નક્ષત્ર શાંતિ રેવતી નક્ષત્રના નકારાત્મક પ્રભાવો શાંત કરે છે. સંરક્ષણ અને સમૃદ્ધિ લાવે છે." },
  pooja_revati_nakshatra_bestFor: { en: "Those born under Revati nakshatra", hi: "रेवती नक्षत्र में जन्मे", gu: "રેવતી નક્ષત્રમાં જન્મેલા" },
  pooja_revati_nakshatra_whenToPerform: { en: "During Revati nakshatra or on birthday", hi: "रेवती नक्षत्र के दौरान या जन्मदिन पर", gu: "રેવતી નક્ષત્ર દરમિયાન અથવા જન્મદિવસ પર" },
  pooja_revati_nakshatra_benefit_0: { en: "Brings protection and safety", hi: "सुरक्षा और सुरक्षा लाता है", gu: "સંરક્ષણ અને સુરક્ષા લાવે છે" },
  pooja_revati_nakshatra_benefit_1: { en: "Ensures prosperity", hi: "समृद्धि सुनिश्चित करता है", gu: "સમૃદ્ધિ ખાતરી કરે છે" },
  pooja_revati_nakshatra_benefit_2: { en: "Removes obstacles", hi: "बाधाएं दूर करता है", gu: "અવરોધો દૂર કરે છે" },
  pooja_revati_nakshatra_benefit_3: { en: "Brings peaceful travel", hi: "शांतिपूर्ण यात्रा लाता है", gu: "શાંતિપૂર્ણ યાત્રા લાવે છે" },
  pooja_revati_nakshatra_benefit_4: { en: "Attracts good fortune", hi: "अच्छा भाग्य आकर्षित करता है", gu: "સારું ભાગ્ય આકર્ષે છે" },
  pooja_revati_nakshatra_benefit_5: { en: "Ensures family welfare", hi: "परिवार कल्याण सुनिश्चित करता है", gu: "પરિવાર કલ્યાણ ખાતરી કરે છે" },
  pooja_revati_nakshatra_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_revati_nakshatra_process_1: { en: "Invocation of Revati deities", hi: "रेवती देवताओं का आह्वान", gu: "રેવતી દેવતાઓનું આહ્વાન" },
  pooja_revati_nakshatra_process_2: { en: "Chanting of nakshatra mantras", hi: "नक्षत्र मंत्रों का जाप", gu: "નક્ષત્ર મંત્રોનો જાપ" },
  pooja_revati_nakshatra_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_revati_nakshatra_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_revati_nakshatra_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_mool_nakshatra_subtitle: { en: "Root Star Pacification", hi: "मूल नक्षत्र शांति", gu: "મૂળ નક્ષત્ર શાંતિ" },
  pooja_mool_nakshatra_description: { en: "Mool Nakshatra Shanti addresses effects of Mool nakshatra. Brings family harmony and success.", hi: "मूल नक्षत्र शांति मूल नक्षत्र के प्रभावों को संबोधित करती है। परिवार सामंजस्य और सफलता लाती है।", gu: "મૂળ નક્ષત્ર શાંતિ મૂળ નક્ષત્રના પ્રભાવોને સંબોધે છે. પરિવાર સંવાદિતા અને સફળતા લાવે છે." },
  pooja_mool_nakshatra_bestFor: { en: "Those born under Mool nakshatra", hi: "मूल नक्षत्र में जन्मे", gu: "મૂળ નક્ષત્રમાં જન્મેલા" },
  pooja_mool_nakshatra_whenToPerform: { en: "During Mool nakshatra or on birthday", hi: "मूल नक्षत्र के दौरान या जन्मदिन पर", gu: "મૂળ નક્ષત્ર દરમિયાન અથવા જન્મદિવસ પર" },
  pooja_mool_nakshatra_benefit_0: { en: "Brings family harmony", hi: "परिवार सामंजस्य लाता है", gu: "પરિવાર સંવાદિતા લાવે છે" },
  pooja_mool_nakshatra_benefit_1: { en: "Removes obstacles in life", hi: "जीवन में बाधाएं दूर करता है", gu: "જીવનમાં અવરોધો દૂર કરે છે" },
  pooja_mool_nakshatra_benefit_2: { en: "Ensures business success", hi: "व्यापार सफलता सुनिश्चित करता है", gu: "વ્યવસાય સફળતા ખાતરી કરે છે" },
  pooja_mool_nakshatra_benefit_3: { en: "Brings prosperity", hi: "समृद्धि लाता है", gu: "સમૃદ્ધિ લાવે છે" },
  pooja_mool_nakshatra_benefit_4: { en: "Protects family members", hi: "परिवार की रक्षा करता है", gu: "પરિવારનું રક્ષણ કરે છે" },
  pooja_mool_nakshatra_benefit_5: { en: "Removes generational issues", hi: "पीढ़ीगत समस्याएं दूर करता है", gu: "પેઢી સમસ્યાઓ દૂર કરે છે" },
  pooja_mool_nakshatra_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_mool_nakshatra_process_1: { en: "Invocation of Mool deities", hi: "मूल देवताओं का आह्वान", gu: "મૂળ દેવતાઓનું આહ્વાન" },
  pooja_mool_nakshatra_process_2: { en: "Chanting of nakshatra mantras", hi: "नक्षत्र मंत्रों का जाप", gu: "નક્ષત્ર મંત્રોનો જાપ" },
  pooja_mool_nakshatra_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_mool_nakshatra_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_mool_nakshatra_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_magha_nakshatra_subtitle: { en: "Royal Star Pacification", hi: "राजसी नक्षत्र शांति", gu: "રાજકીય નક્ષત્ર શાંતિ" },
  pooja_magha_nakshatra_description: { en: "Magha Nakshatra Shanti pacifies Magha nakshatra effects. Brings ancestral blessings and prosperity.", hi: "मघा नक्षत्र शांति मघा नक्षत्र के प्रभावों को शांत करती है। पैतृक आशीर्वाद और समृद्धि लाती है।", gu: "મઘા નક્ષત્ર શાંતિ મઘા નક્ષત્રના પ્રભાવો શાંત કરે છે. પૈતૃક આશીર્વાદ અને સમૃદ્ધિ લાવે છે." },
  pooja_magha_nakshatra_bestFor: { en: "Those born under Magha nakshatra", hi: "मघा नक्षत्र में जन्मे", gu: "મઘા નક્ષત્રમાં જન્મેલા" },
  pooja_magha_nakshatra_whenToPerform: { en: "During Magha nakshatra or on birthday", hi: "मघा नक्षत्र के दौरान या जन्मदिन पर", gu: "મઘા નક્ષત્ર દરમિયાન અથવા જન્મદિવસ પર" },
  pooja_magha_nakshatra_benefit_0: { en: "Brings ancestral blessings", hi: "पैतृक आशीर्वाद लाता है", gu: "પૈતૃક આશીર્વાદ લાવે છે" },
  pooja_magha_nakshatra_benefit_1: { en: "Ensures prosperity", hi: "समृद्धि सुनिश्चित करता है", gu: "સમૃદ્ધિ ખાતરી કરે છે" },
  pooja_magha_nakshatra_benefit_2: { en: "Removes obstacles", hi: "बाधाएं दूर करता है", gu: "અવરોધો દૂર કરે છે" },
  pooja_magha_nakshatra_benefit_3: { en: "Brings family honor", hi: "परिवार का सम्मान लाता है", gu: "પરિવારનું સન્માન લાવે છે" },
  pooja_magha_nakshatra_benefit_4: { en: "Protects from negativity", hi: "नकारात्मकता से बचाता है", gu: "નકારાત્મકતાથી બચાવે છે" },
  pooja_magha_nakshatra_benefit_5: { en: "Brings success", hi: "सफलता लाता है", gu: "સફળતા લાવે છે" },
  pooja_magha_nakshatra_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_magha_nakshatra_process_1: { en: "Invocation of Magha deities", hi: "मघा देवताओं का आह्वान", gu: "મઘા દેવતાઓનું આહ્વાન" },
  pooja_magha_nakshatra_process_2: { en: "Chanting of nakshatra mantras", hi: "नक्षत्र मंत्रों का जाप", gu: "નક્ષત્ર મંત્રોનો જાપ" },
  pooja_magha_nakshatra_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_magha_nakshatra_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_magha_nakshatra_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_jyestha_nakshatra_subtitle: { en: "Elder Star Pacification", hi: "ज्येष्ठ नक्षत्र शांति", gu: "જ્યેષ્ઠ નક્ષત્ર શાંતિ" },
  pooja_jyestha_nakshatra_description: { en: "Jyestha Nakshatra Shanti pacifies Jyestha nakshatra effects. Brings protection and removes obstacles.", hi: "ज्येष्ठ नक्षत्र शांति ज्येष्ठ नक्षत्र के प्रभावों को शांत करती है। सुरक्षा और बाधाएं दूर करती है।", gu: "જ્યેષ્ઠ નક્ષત્ર શાંતિ જ્યેષ્ઠ નક્ષત્રના પ્રભાવો શાંત કરે છે. સંરક્ષણ અને અવરોધો દૂર કરે છે." },
  pooja_jyestha_nakshatra_bestFor: { en: "Those born under Jyestha nakshatra", hi: "ज्येष्ठ नक्षत्र में जन्मे", gu: "જ્યેષ્ઠ નક્ષત્રમાં જન્મેલા" },
  pooja_jyestha_nakshatra_whenToPerform: { en: "During Jyestha nakshatra or on birthday", hi: "ज्येष्ठ नक्षत्र के दौरान या जन्मदिन पर", gu: "જ્યેષ્ઠ નક્ષત્ર દરમિયાન અથવા જન્મદિવસ પર" },
  pooja_jyestha_nakshatra_benefit_0: { en: "Brings protection", hi: "सुरक्षा लाता है", gu: "સંરક્ષણ લાવે છે" },
  pooja_jyestha_nakshatra_benefit_1: { en: "Removes obstacles", hi: "बाधाएं दूर करता है", gu: "અવરોધો દૂર કરે છે" },
  pooja_jyestha_nakshatra_benefit_2: { en: "Ensures prosperity", hi: "समृद्धि सुनिश्चित करता है", gu: "સમૃદ્ધિ ખાતરી કરે છે" },
  pooja_jyestha_nakshatra_benefit_3: { en: "Brings victory", hi: "विजय लाता है", gu: "વિજય લાવે છે" },
  pooja_jyestha_nakshatra_benefit_4: { en: "Protects family", hi: "परिवार की रक्षा करता है", gu: "પરિવારનું રક્ષણ કરે છે" },
  pooja_jyestha_nakshatra_benefit_5: { en: "Brings peace", hi: "शांति लाता है", gu: "શાંતિ લાવે છે" },
  pooja_jyestha_nakshatra_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_jyestha_nakshatra_process_1: { en: "Invocation of Jyestha deities", hi: "ज्येष्ठ देवताओं का आह्वान", gu: "જ્યેષ્ઠ દેવતાઓનું આહ્વાન" },
  pooja_jyestha_nakshatra_process_2: { en: "Chanting of nakshatra mantras", hi: "नक्षत्र मंत्रों का जाप", gu: "નક્ષત્ર મંત્રોનો જાપ" },
  pooja_jyestha_nakshatra_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_jyestha_nakshatra_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_jyestha_nakshatra_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_ashwini_nakshatra_subtitle: { en: "Healing Star Pacification", hi: "उपचार नक्षत्र शांति", gu: "ઉપચાર નક્ષત્ર શાંતિ" },
  pooja_ashwini_nakshatra_description: { en: "Ashwini Nakshatra Shanti pacifies Ashwini nakshatra effects. Brings healing and new beginnings.", hi: "अश्विनी नक्षत्र शांति अश्विनी नक्षत्र के प्रभावों को शांत करती है। उपचार और नई शुरुआत लाती है।", gu: "અશ્વિની નક્ષત્ર શાંતિ અશ્વિની નક્ષત્રના પ્રભાવો શાંત કરે છે. ઉપચાર અને નવી શરૂઆત લાવે છે." },
  pooja_ashwini_nakshatra_bestFor: { en: "Those born under Ashwini nakshatra", hi: "अश्विनी नक्षत्र में जन्मे", gu: "અશ્વિની નક્ષત્રમાં જન્મેલા" },
  pooja_ashwini_nakshatra_whenToPerform: { en: "During Ashwini nakshatra or on birthday", hi: "अश्विनी नक्षत्र के दौरान या जन्मदिन पर", gu: "અશ્વિની નક્ષત્ર દરમિયાન અથવા જન્મદિવસ પર" },
  pooja_ashwini_nakshatra_benefit_0: { en: "Brings healing", hi: "उपचार लाता है", gu: "ઉપચાર લાવે છે" },
  pooja_ashwini_nakshatra_benefit_1: { en: "Ensures new beginnings", hi: "नई शुरुआत सुनिश्चित करता है", gu: "નવી શરૂઆત ખાતરી કરે છે" },
  pooja_ashwini_nakshatra_benefit_2: { en: "Removes obstacles", hi: "बाधाएं दूर करता है", gu: "અવરોધો દૂર કરે છે" },
  pooja_ashwini_nakshatra_benefit_3: { en: "Brings prosperity", hi: "समृद्धि लाता है", gu: "સમૃદ્ધિ લાવે છે" },
  pooja_ashwini_nakshatra_benefit_4: { en: "Protects from illness", hi: "बीमारी से बचाता है", gu: "બીમારીથી બચાવે છે" },
  pooja_ashwini_nakshatra_benefit_5: { en: "Brings success", hi: "सफलता लाता है", gu: "સફળતા લાવે છે" },
  pooja_ashwini_nakshatra_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_ashwini_nakshatra_process_1: { en: "Invocation of Ashwini deities", hi: "अश्विनी देवताओं का आह्वान", gu: "અશ્વિની દેવતાઓનું આહ્વાન" },
  pooja_ashwini_nakshatra_process_2: { en: "Chanting of nakshatra mantras", hi: "नक्षत्र मंत्रों का जाप", gu: "નક્ષત્ર મંત્રોનો જાપ" },
  pooja_ashwini_nakshatra_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_ashwini_nakshatra_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_ashwini_nakshatra_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  pooja_ashlesha_nakshatra_subtitle: { en: "Serpent Star Pacification", hi: "सर्प नक्षत्र शांति", gu: "સર્પ નક્ષત્ર શાંતિ" },
  pooja_ashlesha_nakshatra_description: { en: "Ashlesha Nakshatra Shanti pacifies Ashlesha nakshatra effects. Brings protection and removes negative influences.", hi: "आश्लेषा नक्षत्र शांति आश्लेषा नक्षत्र के प्रभावों को शांत करती है। सुरक्षा और नकारात्मक प्रभाव दूर करती है।", gu: "આશ્લેષા નક્ષત્ર શાંતિ આશ્લેષા નક્ષત્રના પ્રભાવો શાંત કરે છે. સંરક્ષણ અને નકારાત્મક પ્રભાવ દૂર કરે છે." },
  pooja_ashlesha_nakshatra_bestFor: { en: "Those born under Ashlesha nakshatra", hi: "आश्लेषा नक्षत्र में जन्मे", gu: "આશ્લેષા નક્ષત્રમાં જન્મેલા" },
  pooja_ashlesha_nakshatra_whenToPerform: { en: "During Ashlesha nakshatra or on birthday", hi: "आश्लेषा नक्षत्र के दौरान या जन्मदिन पर", gu: "આશ્લેષા નક્ષત્ર દરમિયાન અથવા જન્મદિવસ પર" },
  pooja_ashlesha_nakshatra_benefit_0: { en: "Brings protection", hi: "सुरक्षा लाता है", gu: "સંરક્ષણ લાવે છે" },
  pooja_ashlesha_nakshatra_benefit_1: { en: "Removes negative influences", hi: "नकारात्मक प्रभाव दूर करता है", gu: "નકારાત્મક પ્રભાવ દૂર કરે છે" },
  pooja_ashlesha_nakshatra_benefit_2: { en: "Ensures prosperity", hi: "समृद्धि सुनिश्चित करता है", gu: "સમૃદ્ધિ ખાતરી કરે છે" },
  pooja_ashlesha_nakshatra_benefit_3: { en: "Brings wisdom", hi: "ज्ञान लाता है", gu: "જ્ઞાન લાવે છે" },
  pooja_ashlesha_nakshatra_benefit_4: { en: "Protects from evil", hi: "बुराई से बचाता है", gu: "દુષ્ટતાથી બચાવે છે" },
  pooja_ashlesha_nakshatra_benefit_5: { en: "Brings success", hi: "सफलता लाता है", gu: "સફળતા લાવે છે" },
  pooja_ashlesha_nakshatra_process_0: { en: "Space purification", hi: "स्थान की शुद्धि", gu: "જગ્યાની શુદ્ધિ" },
  pooja_ashlesha_nakshatra_process_1: { en: "Invocation of Ashlesha deities", hi: "आश्लेषा देवताओं का आह्वान", gu: "આશ્લેષા દેવતાઓનું આહ્વાન" },
  pooja_ashlesha_nakshatra_process_2: { en: "Chanting of nakshatra mantras", hi: "नक्षत्र मंत्रों का जाप", gu: "નક્ષત્ર મંત્રોનો જાપ" },
  pooja_ashlesha_nakshatra_process_3: { en: "Offering of flowers and sweets", hi: "फूल और मिठाई का भोग", gu: "ફૂલ અને મિઠાઈનો ભોગ" },
  pooja_ashlesha_nakshatra_process_4: { en: "Aarti ritual", hi: "आरती विधि", gu: "આરતી વિધિ" },
  pooja_ashlesha_nakshatra_process_5: { en: "Distribution of Prasad", hi: "प्रसाद वितरण", gu: "પ્રસાદ વિતરણ" },
  // Dashboard / Admin Panel
  navLogin: { en: "Login", hi: "लॉगिन", gu: "લૉગિન" },
  navDashboard: { en: "Dashboard", hi: "डैशबोर्ड", gu: "ડેશબોર્ડ" },
  dashWelcome: { en: "Welcome", hi: "स्वागत है", gu: "સ્વાગત છે" },
  dashDownloadReceipt: { en: "Download Receipt", hi: "रसीद डाउनलोड करें", gu: "રસીદ ડાઉનલોડ કરો" },
  dashUpcoming: { en: "Upcoming Services", hi: "आगामी सेवाएँ", gu: "આગામી સેવાઓ" },
  dashPast: { en: "History", hi: "इतिहास", gu: "ઇતિહાસ" },
  dashNoUpcoming: { en: "No upcoming poojas scheduled.", hi: "कोई आगामी पूजा निर्धारित नहीं है।", gu: "કોઈ આગામી પૂજા નિર્ધારિત નથી." },
  dashNoPast: { en: "No past poojas recorded.", hi: "कोई पुराना रिकॉर्ड नहीं मिला।", gu: "કોઈ જૂના રેકોર્ડ મળ્યા નથી." },
  dashCalendar: { en: "Service Calendar", hi: "सेवा कैलेंडर", gu: "સેવા કેલેન્ડર" },
  dashTrackSubtitle: {
    en: "Track bookings, status updates, and payments.",
    hi: "बुकिंग, स्टेटस अपडेट और पेमेंट ट्रैक करें।",
    gu: "બુકિંગ, સ્ટેટસ અપડેટ અને ચુકવણી ટ્રેક કરો.",
  },
  dashAdminPanel: { en: "Admin Panel", hi: "एडमिन पैनल", gu: "એડમિન પેનલ" },
  dashShareExperience: {
    en: "Share Your Experience",
    hi: "अपना अनुभव साझा करें",
    gu: "તમારો અનુભવ શેર કરો",
  },
  dashLogout: { en: "Logout", hi: "लॉगआउट", gu: "લૉગઆઉટ" },
  dashMyBookings: { en: "My Bookings", hi: "मेरी बुकिंग्स", gu: "મારી બુકિંગ્સ" },
  dashRefresh: { en: "Refresh", hi: "रीफ़्रेश", gu: "રિફ્રેશ" },
  dashLoading: { en: "Loading...", hi: "लोड हो रहा है...", gu: "લોડ થઈ રહ્યું છે..." },
  dashNoBookings: { en: "No bookings yet.", hi: "अभी कोई बुकिंग नहीं है।", gu: "હજુ સુધી કોઈ બુકિંગ નથી." },
  dashScheduled: { en: "Scheduled", hi: "निर्धारित", gu: "નિર્ધારિત" },
  dashNotFinalized: { en: "Not finalized yet", hi: "अभी तय नहीं हुआ", gu: "હજુ નક્કી નથી" },
  dashPrice: { en: "Price", hi: "कीमत", gu: "કિંમત" },
  dashToBeShared: { en: "To be shared", hi: "बाद में बताया जाएगा", gu: "પછી જણાવાશે" },
  dashStepInquiry: { en: "Inquiry", hi: "पूछताछ", gu: "પૂછપરછ" },
  dashStepConsultation: { en: "Consultation", hi: "परामर्श", gu: "પરામર્શ" },
  dashStepPayment: { en: "Payment", hi: "भुगतान", gu: "ચુકવણી" },
  dashStepConfirmed: { en: "Confirmed", hi: "पुष्टि की गई", gu: "પુષ્ટિ થઈ" },
  dashStepPerformed: { en: "Performed", hi: "संपन्न", gu: "સંપન્ન" },
  dashPaymentLinkAvailable: {
    en: "Payment Link Available",
    hi: "पेमेंट लिंक उपलब्ध है",
    gu: "ચુકવણી લિંક ઉપલબ્ધ છે",
  },
  dashPaymentLinkHint: {
    en: "Complete payment to confirm your booking.",
    hi: "अपनी बुकिंग कन्फर्म करने के लिए पेमेंट पूरा करें।",
    gu: "તમારી બુકિંગ કન્ફર્મ કરવા ચુકવણી પૂર્ણ કરો.",
  },
  dashPayNow: { en: "Pay Now", hi: "अभी भुगतान करें", gu: "હવે ચૂકવો" },
  dashProfile: { en: "Profile", hi: "प्रोफ़ाइल", gu: "પ્રોફાઇલ" },
  dashEmail: { en: "Email", hi: "ईमेल", gu: "ઈમેલ" },
  dashPhone: { en: "Phone", hi: "फ़ोन", gu: "ફોન" },
  dashFailedLoadBookings: {
    en: "Failed to load bookings",
    hi: "बुकिंग लोड नहीं हो पाई",
    gu: "બુકિંગ લોડ થઈ નથી",
  },
  // Home - Sacred Experience / Testimonials / CTA banner
  homeSacredExperienceTag: {
    en: "Sacred Experience",
    hi: "पवित्र अनुभव",
    gu: "પવિત્ર અનુભવ",
  },
  homeSacredExperienceTitle: {
    en: "Every Ritual Performed with Devotion & Precision",
    hi: "हर अनुष्ठान भक्ति और शुद्ध विधि से सम्पन्न",
    gu: "દરેક વિધિ ભક્તિ અને ચોકસાઈથી સંપન્ન",
  },
  homeSacredExperienceText: {
    en: "Our pandits bring decades of Vedic knowledge and heartfelt dedication to every ceremony. We ensure your sacred rituals are performed with complete authenticity and personal attention.",
    hi: "हमारे पंडित दशकों के वैदिक ज्ञान और हृदय से समर्पण के साथ हर समारोह करते हैं। हम सुनिश्चित करते हैं कि आपकी पूजा पूरी प्रामाणिकता और व्यक्तिगत ध्यान के साथ सम्पन्न हो।",
    gu: "અમારા પંડિતો દાયકાઓના વૈદિક જ્ઞાન અને હૃદયપૂર્વક સમર્પણ સાથે દરેક સમારોહ કરે છે. અમે ખાતરી કરીએ છીએ કે તમારી વિધિઓ સંપૂર્ણ પ્રામાણિકતા અને વ્યક્તિગત ધ્યાન સાથે સંપન્ન થાય.",
  },
  homeScheduleConsultation: {
    en: "Schedule a Consultation",
    hi: "परामर्श शेड्यूल करें",
    gu: "પરામર્શ શેડ્યૂલ કરો",
  },
  homeTestimonialsTag: {
    en: "Testimonials",
    hi: "प्रशंसापत्र",
    gu: "પ્રશંસાપત્રો",
  },
  homeTestimonialsTitle: {
    en: "What Our Devotees Say",
    hi: "हमारे भक्त क्या कहते हैं",
    gu: "અમારા ભક્તો શું કહે છે",
  },
  homeCtaTitle: {
    en: "Ready to Experience Divine Blessings?",
    hi: "क्या आप दिव्य आशीर्वाद अनुभव करने के लिए तैयार हैं?",
    gu: "દિવ્ય આશીર્વાદ અનુભવવા તૈયાર છો?",
  },
  homeCtaText: {
    en: "Book your personalized Vedic puja today with verified pandits.",
    hi: "आज ही प्रमाणित पंडितों के साथ अपनी व्यक्तिगत वैदिक पूजा बुक करें।",
    gu: "આજે જ પ્રમાણિત પંડિતો સાથે તમારી વ્યક્તિગત વૈદિક પૂજા બુક કરો.",
  },
  homeBookPoojaNow: {
    en: "Book Puja Now",
    hi: "अभी पूजा बुक करें",
    gu: "હવે પૂજા બુક કરો",
  },
  faqSectionTag: {
    en: "FAQ",
    hi: "अक्सर पूछे जाने वाले प्रश्न",
    gu: "સામાન્ય પ્રશ્નો",
  },
  faqSectionTitle: {
    en: "Popular Questions",
    hi: "लोकप्रिय प्रश्न",
    gu: "લોકપ્રિય પ્રશ્નો",
  },
  faq1_q: {
    en: "How can I book a puja online?",
    hi: "मैं ऑनलाइन पूजा कैसे बुक कर सकता/सकती हूं?",
    gu: "હું ઓનલાઇન પૂજા કેવી રીતે બુક કરી શકું?",
  },
  faq1_a: {
    en: "You can book a puja easily through our Book page. Fill in your details, select the puja type, and our team will contact you to confirm. You can also call or email us for assistance.",
    hi: "आप हमारे बुक पेज के माध्यम से आसानी से पूजा बुक कर सकते हैं। अपना विवरण भरें, पूजा का प्रकार चुनें और हमारी टीम पुष्टि के लिए संपर्क करेगी। सहायता के लिए आप हमें कॉल या ईमेल भी कर सकते हैं।",
    gu: "તમે અમારા બુક પેજ દ્વારા સરળતાથી પૂજા બુક કરી શકો છો. તમારી વિગતો ભરો, પૂજાનો પ્રકાર પસંદ કરો અને અમારી ટીમ પુષ્ટિ માટે સંપર્ક કરશે. મદદ માટે તમે અમને ફોન અથવા ઈમેલ પણ કરી શકો છો.",
  },
  faq2_q: {
    en: "Where do your pandits come from?",
    hi: "आपके पंडित कहाँ से आते हैं?",
    gu: "અમારા પંડિતો ક્યાંથી આવે છે?",
  },
  faq2_a: {
    en: "Our pandits are trained in Vedic scriptures from sacred places like Kashi, Prayagraj, Chitrakoot, Ayodhya, Mathura, and Vrindavan. They perform karma kaand with authenticity and devotion.",
    hi: "हमारे पंडित काशी, प्रयागराज, चित्रकूट, अयोध्या, मथुरा और वृन्दावन जैसे पवित्र स्थानों से वैदिक शास्त्रों में प्रशिक्षित हैं। वे प्रामाणिकता और भक्ति के साथ कर्मकांड करते हैं।",
    gu: "અમારા પંડિતો કાશી, પ્રયાગરાજ, ચિત્રકૂટ, અયોધ્યા, મથુરા અને વૃંદાવન જેવી પવિત્ર જગ્યાઓથી વૈદિક શાસ્ત્રોમાં તાલીમ લીધેલા છે. તેઓ પ્રામાણિકતા અને ભક્તિ સાથે કર્મકાંડ કરે છે.",
  },
  faq3_q: {
    en: "Can I get online puja from home?",
    hi: "क्या मैं घर बैठे ऑनलाइन पूजा का लाभ ले सकता/सकती हूं?",
    gu: "શું હું ઘરે બેઠા ઓનલાઇન પૂજાનો લાભ લઈ શકું?",
  },
  faq3_a: {
    en: "Yes! You can book a puja in your name and receive the benefit of online puja performed by our pandits from Kashi, Mathura, and Chitrakoot. The rituals are conducted as per Vedic scriptures and the blessings reach you.",
    hi: "हाँ! आप अपने नाम की पूजा बुक कर सकते हैं और काशी, मथुरा और चित्रकूट के हमारे पंडितों द्वारा किए गए ऑनलाइन पूजा का लाभ प्राप्त कर सकते हैं। अनुष्ठान वैदिक शास्त्रों के अनुसार किए जाते हैं और आशीर्वाद आप तक पहुँचता है।",
    gu: "હા! તમે તમારા નામની પૂજા બુક કરી શકો છો અને કાશી, મથુરા અને ચિત્રકૂટના અમારા પંડિતો દ્વારા કરાવેલી ઓનલાઇન પૂજાનો લાભ મેળવી શકો છો. વિધિઓ વૈદિક શાસ્ત્રો અનુસાર કરવામાં આવે છે અને આશીર્વાદ તમને પહોંચે છે.",
  },
  faq4_q: {
    en: "What types of pujas do you offer?",
    hi: "आप किस प्रकार की पूजा प्रदान करते हैं?",
    gu: "તમે કયા પ્રકારની પૂજા પૂરી પાડો છો?",
  },
  faq4_a: {
    en: "We offer Graha Shanti, Nakshatra Shanti, Dev Puja & Mantra Jap, Dosh Nivaran, Navagraha Shanti, Rudrabhishek, Satyanarayan Katha, marriage pujas, Griha Pravesh, and many more — all performed according to Vedic scriptures.",
    hi: "हम ग्रह शांति, नक्षत्र शांति, देव पूजा और मंत्र जाप, दोष निवारण, नवग्रह शांति, रुद्राभिषेक, सत्यनारायण कथा, विवाह पूजा, गृह प्रवेश और कई अन्य प्रदान करते हैं — सभी वैदिक शास्त्रों के अनुसार किए जाते हैं।",
    gu: "અમે ગ્રહ શાંતિ, નક્ષત્ર શાંતિ, દેવ પૂજા અને મંત્ર જાપ, દોષ નિવારણ, નવગ્રહ શાંતિ, રુદ્રાભિષેક, સત્યનારાયણ કથા, લગ્ન પૂજા, ગૃહ પ્રવેશ અને ઘણા વધુ પૂરા પાડીએ છીએ — બધા વૈદિક શાસ્ત્રો અનુસાર કરવામાં આવે છે.",
  },
  faq5_q: {
    en: "How do I get more information about a puja?",
    hi: "पूजा के बारे में अधिक जानकारी कैसे प्राप्त करूं?",
    gu: "પૂજા વિશે વધુ માહિતી કેવી રીતે મેળવું?",
  },
  faq5_a: {
    en: "For detailed information, you can browse our Categories page, view individual puja pages, or contact our pandit ji directly via phone or email. We are happy to guide you.",
    hi: "विस्तृत जानकारी के लिए आप हमारे श्रेणी पेज ब्राउज़ कर सकते हैं, अलग-अलग पूजा पेज देख सकते हैं या फोन या ईमेल के माध्यम से सीधे हमारे पंडितजी से संपर्क कर सकते हैं। हम आपका मार्गदर्शन करने में खुश हैं।",
    gu: "વિગતવાર માહિતી માટે તમે અમારા કેટેગરી પેજ બ્રાઉઝ કરી શકો છો, વ્યક્તિગત પૂજા પેજ જોઈ શકો છો અથવા ફોન અથવા ઈમેલ દ્વારા સીધા અમારા પંડિતજીનો સંપર્ક કરી શકો છો. અમે તમને માર્ગદર્શન આપવામાં ખુશ છીએ.",
  },
  dashLoggedOut: { en: "Logged out", hi: "लॉगआउट हो गया", gu: "લૉગઆઉટ થયું" },
  dashEditProfile: { en: "Edit Profile", hi: "प्रोफ़ाइल संपादित करें", gu: "પ્રોફાઇલ સંપાદિત કરો" },
  dashSaveProfile: { en: "Save Changes", hi: "परिवर्तन सहेजें", gu: "ફેરફારો સાચવો" },
  dashCancel: { en: "Cancel", hi: "रद्द करें", gu: "રદ કરો" },
  dashProfileUpdated: { en: "Profile updated successfully", hi: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई", gu: "પ્રોફાઇલ સફળતાપૂર્વક અપડેટ થઈ" },
  dashProfileUpdateFailed: { en: "Failed to update profile", hi: "प्रोफ़ाइल अपडेट करने में विफल", gu: "પ્રોફાઇલ અપડેટ કરવામાં નિષ્ફળ" },
  bookingStatusPending: { en: "Pending", hi: "लंबित", gu: "બાકી" },
  bookingStatusConfirmed: { en: "Confirmed", hi: "पुष्ट", gu: "પુષ્ટ" },
  bookingStatusPaymentPending: {
    en: "Payment Pending",
    hi: "भुगतान लंबित",
    gu: "ચુકવણી બાકી",
  },
  bookingStatusPaymentCompleted: {
    en: "Payment Completed",
    hi: "भुगतान पूर्ण",
    gu: "ચુકવણી પૂર્ણ",
  },
  bookingStatusPoojaPerformed: {
    en: "Puja Performed",
    hi: "पूजा सम्पन्न",
    gu: "પૂજા સંપન્ન",
  },
  adminForbiddenTitle: { en: "Forbidden", hi: "अनुमति नहीं", gu: "મનાઈ છે" },
  adminForbiddenText: {
    en: "This page is only for admins.",
    hi: "यह पेज केवल एडमिन के लिए है।",
    gu: "આ પેજ ફક્ત એડમિન માટે છે.",
  },
  adminBackToDashboard: {
    en: "Back to Dashboard",
    hi: "डैशबोर्ड पर वापस",
    gu: "ડેશબોર્ડ પર પાછા",
  },
  adminTitle: { en: "Admin Panel", hi: "एडमिन पैनल", gu: "એડમિન પેનલ" },
  adminSubtitle: {
    en: "Manage bookings and users.",
    hi: "बुकिंग और यूज़र्स मैनेज करें।",
    gu: "બુકિંગ અને યુઝર્સ મેનેજ કરો.",
  },
  adminTabOverview: { en: "Overview", hi: "अवलोकन", gu: "વિહંગાવલોકન" },
  adminTabBookings: { en: "Bookings", hi: "बुकिंग्स", gu: "બુકિંગ્સ" },
  adminTabCompleted: { en: "History", hi: "इतिहास", gu: "ઇતિહાસ" },
  adminTabUsers: { en: "Users", hi: "यूज़र्स", gu: "યુઝર્સ" },
  adminTabStories: {
    en: "Success Stories",
    hi: "सक्सेस स्टोरीज़",
    gu: "સક્સેસ સ્ટોરીઝ",
  },
  adminTabPopularPoojas: {
    en: "Popular Pujas",
    hi: "लोकप्रिय पूजाएँ",
    gu: "લોકપ્રિય પૂજા",
  },
  adminTabAboutGallery: {
    en: "About Gallery",
    hi: "अबाउट गैलरी",
    gu: "અબાઉટ ગેલેરી",
  },
  adminStatRevenue: { en: "Total Revenue", hi: "कुल राजस्व", gu: "કુલ આવક" },
  adminStatBookings: { en: "Total Bookings", hi: "कुल बुकिंग", gu: "કુલ બુકિંગ" },
  adminStatUsers: { en: "Active Users", hi: "सक्रिय उपयोगकर्ता", gu: "સક્રિય વપરાશકર્તાઓ" },
  adminStatConversion: { en: "Conversion Rate", hi: "रूपांतरण दर", gu: "કન્વર્ઝન રેટ" },
  adminChartRevenueTrend: { en: "Revenue Trend (INR)", hi: "राजस्व रुझान", gu: "આવક વલણ" },
  adminChartBookingVolume: { en: "Booking Volume", hi: "बुकिंग मात्रा", gu: "બુકિંગ વોલ્યુમ" },
  adminChartStatusDist: { en: "Booking Status Distribution", hi: "बुकिंग स्थिति वितरण", gu: "બુકિંગ સ્થિતિ વિતરણ" },
  adminRecentActivity: { en: "Recent Activity", hi: "हाल की गतिविधि", gu: "તાજેતરની પ્રવૃત્તિ" },
  adminSearchUsersPlaceholder: {
    en: "Search users (name, email, phone, role, blocked)...",
    hi: "यूज़र्स खोजें (नाम, ईमेल, फ़ोन, रोल, ब्लॉक्ड)...",
    gu: "યુઝર્સ શોધો (નામ, ઈમેલ, ફોન, રોલ, બ્લોક્ડ)...",
  },
  adminSearchStoriesPlaceholder: {
    en: "Search stories (name, email, city, puja, status)...",
    hi: "स्टोरीज़ खोजें (नाम, ईमेल, शहर, पूजा, स्टेटस)...",
    gu: "સ્ટોરીઝ શોધો (નામ, ઈમેલ, શહેર, પૂજા, સ્ટેટસ)...",
  },
  adminSearchBookingsPlaceholder: {
    en: "Search bookings (puja, name, email, phone, city, status)...",
    hi: "बुकिंग्स खोजें (पूजा, नाम, ईमेल, फ़ोन, शहर, स्टेटस)...",
    gu: "બુકિંગ્સ શોધો (પૂજા, નામ, ઈમેલ, ફોન, શહેર, સ્ટેટસ)...",
  },
  adminTableName: { en: "Name", hi: "नाम", gu: "નામ" },
  adminTableEmail: { en: "Email", hi: "ईमेल", gu: "ઈમેલ" },
  adminTablePhone: { en: "Phone", hi: "फ़ोन", gu: "ફોન" },
  adminTableRole: { en: "Role", hi: "भूमिका", gu: "ભૂમિકા" },
  adminTableStatus: { en: "Status", hi: "स्टेटस", gu: "સ્ટેટસ" },
  adminTableActions: { en: "Actions", hi: "एक्शन", gu: "એક્શન" },
  adminBlocked: { en: "Blocked", hi: "ब्लॉक्ड", gu: "બ્લોક્ડ" },
  adminActive: { en: "Active", hi: "सक्रिय", gu: "સક્રિય" },
  adminUnblock: { en: "Unblock", hi: "अनब्लॉक", gu: "અનલૉક" },
  adminBlock: { en: "Block", hi: "ब्लॉक", gu: "બ્લોક" },
  adminDelete: { en: "Delete", hi: "डिलीट", gu: "ડિલીટ" },
  adminApprove: { en: "Approve", hi: "स्वीकृत करें", gu: "મંજૂર કરો" },
  adminNoStoriesFound: {
    en: "No stories found.",
    hi: "कोई स्टोरी नहीं मिली।",
    gu: "કોઈ સ્ટોરી મળી નથી.",
  },
  adminStatusLabel: { en: "Status", hi: "स्टेटस", gu: "સ્ટેટસ" },
  adminPriceInr: { en: "Price (₹)", hi: "कीमत (₹)", gu: "કિંમત (₹)" },
  adminPoojaDate: { en: "Puja Date", hi: "पूजा तारीख", gu: "પૂજા તારીખ" },
  adminPaymentLink: { en: "Payment Link", hi: "पेमेंट लिंक", gu: "ચુકવણી લિંક" },
  adminEditHint: {
    en: "Make changes, then click Done.",
    hi: "परिवर्तन करें, फिर Done पर क्लिक करें।",
    gu: "બદલાવ કરો, પછી Done ક્લિક કરો.",
  },
  adminDone: { en: "Done", hi: "हो गया", gu: "પૂર્ણ" },
  adminConfirmAndRequestPayment: {
    en: "Confirm & Request Payment",
    hi: "पुष्टि करें और भुगतान का अनुरोध करें",
    gu: "પુષ્ટિ કરો અને ચુકવણીની વિનંતી કરો",
  },
  adminFailedLoadData: {
    en: "Failed to load admin data",
    hi: "एडमिन डेटा लोड नहीं हो पाया",
    gu: "એડમિન ડેટા લોડ થઈ નથી",
  },
  adminUpdateFailed: { en: "Update failed", hi: "अपडेट विफल", gu: "અપડેટ નિષ્ફળ" },
  adminBookingUpdated: {
    en: "Booking updated",
    hi: "बुकिंग अपडेट हुई",
    gu: "બુકિંગ અપડેટ થઈ",
  },
  adminApproveFailed: { en: "Approve failed", hi: "स्वीकृति विफल", gu: "મંજૂરી નિષ્ફળ" },
  adminStoryApproved: {
    en: "Story approved",
    hi: "स्टोरी स्वीकृत हुई",
    gu: "સ્ટોરી મંજૂર થઈ",
  },
  adminConfirmDeleteStory: {
    en: "Delete this story?",
    hi: "इस स्टोरी को डिलीट करें?",
    gu: "આ સ્ટોરી ડિલીટ કરવી છે?",
  },
  adminStoryDeleted: {
    en: "Story deleted",
    hi: "स्टोरी डिलीट हुई",
    gu: "સ્ટોરી ડિલીટ થઈ",
  },
  adminDeleteFailed: { en: "Delete failed", hi: "डिलीट विफल", gu: "ડિલીટ નિષ્ફળ" },
  adminFailedUpdateUser: {
    en: "Failed to update user",
    hi: "यूज़र अपडेट नहीं हुआ",
    gu: "યુઝર અપડેટ થયો નથી",
  },
  adminUserBlocked: { en: "User blocked", hi: "यूज़र ब्लॉक्ड", gu: "યુઝર બ્લોક્ડ" },
  adminUserUnblocked: {
    en: "User unblocked",
    hi: "यूज़र अनब्लॉक्ड",
    gu: "યુઝર અનલૉક",
  },
  adminConfirmDeleteUser: {
    en: "Delete this user and all their bookings?",
    hi: "इस यूज़र और उनकी सभी बुकिंग्स डिलीट करें?",
    gu: "આ યુઝર અને તેમની બધી બુકિંગ્સ ડિલીટ કરવી છે?",
  },
  adminUserDeleted: { en: "User deleted", hi: "यूज़र डिलीट हुआ", gu: "યુઝર ડિલીટ થયો" },
  // Auth shell (shared)
  authShellWhatYouGetTitle: {
    en: "What you get",
    hi: "आपको क्या मिलेगा",
    gu: "તમને શું મળશે",
  },
  authShellFeatureTrackStatus: {
    en: "Track booking status",
    hi: "बुकिंग स्टेटस ट्रैक करें",
    gu: "બુકિંગ સ્ટેટસ ટ્રેક કરો",
  },
  authShellFeaturePaymentLinks: {
    en: "Payment link updates",
    hi: "पेमेंट लिंक अपडेट्स",
    gu: "ચુકવણી લિંક અપડેટ",
  },
  authShellFeatureHistory: {
    en: "Booking history",
    hi: "बुकिंग इतिहास",
    gu: "બુકિંગ ઇતિહાસ",
  },
  authShellFeatureProfile: {
    en: "Profile dashboard",
    hi: "प्रोफ़ाइल डैशबोर्ड",
    gu: "પ્રોફાઇલ ડેશબોર્ડ",
  },
  // Login
  authLoginShellTitle: {
    en: "Welcome Back",
    hi: "वापस स्वागत है",
    gu: "પાછા સ્વાગત છે",
  },
  authLoginShellSubtitle: {
    en: "Login with your email or mobile number to track your bookings and manage your profile.",
    hi: "अपनी बुकिंग ट्रैक करने और प्रोफ़ाइल मैनेज करने के लिए अपने ईमेल या मोबाइल नंबर से लॉगिन करें।",
    gu: "તમારી બુકિંગ ટ્રેક કરવા અને પ્રોફાઇલ મેનેજ કરવા માટે તમારા ઈમેલ અથવા મોબાઈલ નંબરથી લૉગિન કરો.",
  },
  authLoginTitle: { en: "Login", hi: "लॉगिन", gu: "લૉગિન" },
  authLoginSubtitle: {
    en: "OTP will be sent to your registered email.",
    hi: "आपके पंजीकृत ईमेल पर ओटीपी भेजा जाएगा।",
    gu: "તમારા રજિસ્ટર્ડ ઈમેલ પર OTP મોકલવામાં આવશે.",
  },
  authPhoneLabel: { en: "Phone Number", hi: "फ़ोन नंबर", gu: "ફોન નંબર" },
  authPhonePlaceholder: {
    en: "Enter registered phone number",
    hi: "पंजीकृत फ़ोन नंबर दर्ज करें",
    gu: "રજિસ્ટર્ડ ફોન નંબર લખો",
  },
  authOtpLabel: { en: "Enter OTP", hi: "ओटीपी दर्ज करें", gu: "OTP લખો" },
  authOtpPlaceholder: {
    en: "6-digit OTP",
    hi: "6-अंकों का ओटीपी",
    gu: "6-આંકડાનો OTP",
  },
  authSendOtp: { en: "Send OTP", hi: "ओटीपी भेजें", gu: "OTP મોકલો" },
  authRequestingOtp: { en: "Sending...", hi: "भेज रहे हैं...", gu: "મોકલી રહ્યા છીએ..." },
  authResendOtp: { en: "Resend OTP", hi: "ओटीपी दोबारा भेजें", gu: "OTP ફરી મોકલો" },
  authVerifyOtp: { en: "Verify & Login", hi: "सत्यापित करें और लॉगिन करें", gu: "વેરિફાય અને લૉગિન" },
  authVerifying: { en: "Verifying...", hi: "सत्यापित किया जा रहा है...", gu: "વેરિફાય થઈ રહ્યું છે..." },
  authChangePhone: { en: "Change email / phone number", hi: "ईमेल / फ़ोन नंबर बदलें", gu: "ઈમેઇલ / ફોન નંબર બદલો" },
  authOtpSentSuccess: {
    en: "OTP sent successfully!",
    hi: "ओटीपी सफलतापूर्वक भेज दिया गया!",
    gu: "OTP સફળતાપૂર્વક મોકલવામાં આવ્યો!",
  },
  authInvalidOtp: {
    en: "Invalid OTP. Please try again.",
    hi: "अमान्य ओटीपी। कृपया फिर से कोशिश करें।",
    gu: "અમાન્ય OTP. કૃપા કરીને ફરી પ્રયત્ન કરો.",
  },
  authLoginRequiredForBooking: {
    en: "Please login to book a puja.",
    hi: "पूजा बुक करने के लिए कृपया लॉगिन करें।",
    gu: "પૂજા બુક કરવા માટે કૃપા કરીને લૉગિન કરો.",
  },
  authLoggingIn: { en: "Logging in...", hi: "लॉगिन हो रहा है...", gu: "લૉગિન થઈ રહ્યું છે..." },
  authLoginButton: { en: "Login", hi: "लॉगिन", gu: "લૉગિન" },
  authNoAccount: {
    en: "Don't have an account?",
    hi: "क्या आपका अकाउंट नहीं है?",
    gu: "શું તમારું અકાઉન્ટ નથી?",
  },
  authCreateOne: {
    en: "Create one",
    hi: "एक अकाउंट बनाएँ",
    gu: "એક અકાઉન્ટ બનાવો",
  },
  authLoginFailedGeneric: {
    en: "Login failed",
    hi: "लॉगिन विफल हुआ",
    gu: "લૉગિન નિષ્ફળ ગયું",
  },
  authWelcomeBackToast: {
    en: "Welcome back!",
    hi: "वापस स्वागत है!",
    gu: "પાછા સ્વાગત છે!",
  },
  authLoginFailedRetry: {
    en: "Login failed. Please try again.",
    hi: "लॉगिन विफल हुआ, कृपया फिर से कोशिश करें।",
    gu: "લૉગિન નિષ્ફળ ગયું, કૃપા કરીને ફરી પ્રયત્ન કરો.",
  },
  // Signup
  authSignupShellTitle: {
    en: "Create Your Account",
    hi: "अपना अकाउंट बनाएँ",
    gu: "તમારું અકાઉન્ટ બનાવો",
  },
  authSignupShellSubtitle: {
    en: "Signup with your mobile number to manage bookings and track updates.",
    hi: "बुकिंग मैनेज करने और अपडेट्स ट्रैक करने के लिए अपने मोबाइल नंबर से साइन अप करें।",
    gu: "બુકિંગ મેનેજ કરવા અને અપડેટ ટ્રેક કરવા માટે તમારા મોબાઈલ નંબરથી સાઇન અપ કરો.",
  },
  authSignupTitle: { en: "Sign Up", hi: "साइन अप", gu: "સાઇન અપ" },
  authSignupSubtitle: {
    en: "Join us in seconds.",
    hi: "कुछ ही सेकंड में हमसे जुड़ें।",
    gu: "સેકન્ડોમાં અમારી સાથે જોડાઓ.",
  },
  authEmailLabel: { en: "Email", hi: "ईमेल", gu: "ઈમેલ" },
  authEmailPlaceholder: {
    en: "you@example.com",
    hi: "you@example.com",
    gu: "you@example.com",
  },
  authFullNameLabel: { en: "Full Name", hi: "पूरा नाम", gu: "પૂર્ણ નામ" },
  authFullNamePlaceholder: {
    en: "Your full name",
    hi: "आपका पूरा name",
    gu: "તમારું પૂરું નામ",
  },
  authCityLabel: { en: "City", hi: "शहर", gu: "શહેર" },
  authCityPlaceholder: {
    en: "Your city",
    hi: "आपका शहर",
    gu: "તમારું શહેર",
  },
  authStateLabel: { en: "State", hi: "राज्य", gu: "રાજ્ય" },
  authStatePlaceholder: {
    en: "Your state",
    hi: "आपका राज्य",
    gu: "તમારું રાજ્ય",
  },
  authCountryLabel: { en: "Country", hi: "देश", gu: "દેશ" },
  authCountryPlaceholder: {
    en: "Select country",
    hi: "देश चुनें",
    gu: "દેશ પસંદ કરો",
  },
  authRegisterAsLabel: { en: "Register as", hi: "रजिस्टर प्रकार", gu: "નોંધણી પ્રકાર" },
  authRoleUser: { en: "User", hi: "यूज़र", gu: "યુઝર" },
  authRoleAdmin: { en: "Admin", hi: "एडमिन", gu: "એડમિન" },
  authCreatingAccount: {
    en: "Creating...",
    hi: "अकाउंट बनाया जा रहा है...",
    gu: "અકાઉન્ટ બને છે...",
  },
  authCreateAccount: {
    en: "Create Account",
    hi: "अकाउंट बनाएँ",
    gu: "અકાઉન્ટ બનાવો",
  },
  authAlreadyHaveAccount: {
    en: "Already have an account?",
    hi: "क्या आपका पहले से अकाउंट है?",
    gu: "શું તમારું પહેલાથી અકાઉન્ટ છે?",
  },
  authLoginLink: { en: "Login", hi: "लॉगिन", gu: "લૉગિન" },
  authSignupFailedGeneric: {
    en: "Signup failed",
    hi: "साइन अप विफल हुआ",
    gu: "સાઇન અપ નિષ્ફળ ગયું",
  },
  authSignupSuccess: {
    en: "Account created successfully!",
    hi: "अकाउंट सफलतापूर्वक बन गया!",
    gu: "અકાઉન્ટ સફળતાપૂર્વક બનાવી દેવામાં આવ્યું!",
  },
  authSignupFailedRetry: {
    en: "Signup failed. Please try again.",
    hi: "साइन अप विफल हुआ, कृपया फिर से कोशिश करें।",
    gu: "સાઇન અપ નિષ્ફળ ગયું, કૃપા કરીને ફરી પ્રયત્ન કરો.",
  },
  // Forgot password
  authForgotShellTitle: {
    en: "Reset Your Password",
    hi: "अपना पासवर्ड रीसेट करें",
    gu: "તમારો પાસવર્ડ રીસેટ કરો",
  },
  authForgotShellSubtitle: {
    en: "Enter your email and we will generate a password reset token.",
    hi: "अपना ईमेल दर्ज करें, हम पासवर्ड रीसेट टोकन बनाएंगे।",
    gu: "તમારું ઈમેલ લખો, અમે પાસવર્ડ રીસેટ ટોકન બનાવીશું.",
  },
  authForgotTitle: {
    en: "Forgot Password",
    hi: "पासवर्ड भूल गए",
    gu: "પાસવર્ડ ભૂલી ગયા",
  },
  authForgotSubtitle: {
    en: "We’ll help you set a new password.",
    hi: "हम आपको नया पासवर्ड सेट करने में मदद करेंगे।",
    gu: "અમે તમને નવો પાસવર્ડ સેટ કરવામાં મદદ કરીશું.",
  },
  authRequestingReset: {
    en: "Requesting...",
    hi: "अनुरोध भेजा जा रहा है...",
    gu: "વિનંતી મોકલી રહ્યા છીએ...",
  },
  authRequestReset: {
    en: "Request Reset",
    hi: "रीसेट का अनुरोध",
    gu: "રીસેટ વિનંતી",
  },
  authForgotDevTokenLabel: {
    en: "Dev reset token (copy this):",
    hi: "डेव रीसेट टोकन (इसे कॉपी करें):",
    gu: "ડેવ રીસેટ ટોકન (આ કૉપિ કરો):",
  },
  authForgotGoToReset: {
    en: "Go to Reset Password",
    hi: "रीसेट पासवर्ड पेज पर जाएँ",
    gu: "રીસેટ પાસવર્ડ પેજ પર જાઓ",
  },
  authForgotRemembered: {
    en: "Remembered your password?",
    hi: "क्या आपको पासवर्ड याद आ गया?",
    gu: "પાસવર્ડ યાદ આવી ગયો?",
  },
  authBackToLogin: {
    en: "Back to login",
    hi: "लॉगिन पर वापस जाएँ",
    gu: "લૉગિન પર પાછા જાઓ",
  },
  authResetRequestFailedGeneric: {
    en: "Failed to request reset",
    hi: "रीसेट का अनुरोध विफल हुआ",
    gu: "રીસેટ વિનંતી નિષ્ફળ ગઈ",
  },
  authResetRequested: {
    en: "If the email exists, a reset link was generated.",
    hi: "यदि यह ईमेल मौजूद है, तो रीसेट लिंक जनरेट कर दिया गया है।",
    gu: "જો આ ઈમેલ હાજર હશે તો રીસેટ લિંક જનરેટ થઈ છે.",
  },
  authResetRequestFailedRetry: {
    en: "Failed to request reset. Please try again.",
    hi: "रीसेट अनुरोध विफल हुआ, कृपया फिर से कोशिश करें।",
    gu: "રીસેટ વિનંતી નિષ્ફળ ગઈ, કૃપા કરીને ફરી પ્રયત્ન કરો.",
  },
  // Reset password
  authResetShellTitle: {
    en: "Set a New Password",
    hi: "नया पासवर्ड सेट करें",
    gu: "નવો પાસવર્ડ સેટ કરો",
  },
  authResetShellSubtitle: {
    en: "Paste the reset token and choose a new password.",
    hi: "रीसेट टोकन पेस्ट करें और नया पासवर्ड चुनें।",
    gu: "રીસેટ ટોકન પેસ્ટ કરો અને નવો પાસવર્ડ પસંદ કરો.",
  },
  authResetTitle: {
    en: "Reset Password",
    hi: "पासवर्ड रीसेट",
    gu: "પાસવર્ડ રીસેટ",
  },
  authResetSubtitle: {
    en: "Enter your reset token and new password.",
    hi: "अपना रीसेट टोकन और नया पासवर्ड दर्ज करें।",
    gu: "તમારો રીસેટ ટોકન અને નવો પાસવર્ડ લખો.",
  },
  authResetTokenLabel: {
    en: "Reset Token",
    hi: "रीसेट टोकन",
    gu: "રીસેટ ટોકન",
  },
  authResetTokenPlaceholder: {
    en: "Paste token here",
    hi: "टोकन यहाँ पेस्ट करें",
    gu: "ટોકન અહીં પેસ્ટ કરો",
  },
  authNewPasswordLabel: {
    en: "New Password",
    hi: "नया पासवर्ड",
    gu: "નવો પાસવર્ડ",
  },
  authResetting: {
    en: "Resetting...",
    hi: "रीसेट किया जा रहा है...",
    gu: "રીસેટ થઈ રહ્યું છે...",
  },
  authResetButton: {
    en: "Reset Password",
    hi: "पासवर्ड रीसेट करें",
    gu: "પાસવર્ડ રીસેટ કરો",
  },
  authBack: { en: "Back", hi: "वापस", gu: "પાછા" },
  authResetFailedGeneric: {
    en: "Reset failed",
    hi: "रीसेट विफल हुआ",
    gu: "રીસેટ નિષ્ફળ ગયું",
  },
  authResetSuccess: {
    en: "Password reset successfully. Please login.",
    hi: "पासवर्ड सफलतापूर्वक रीसेट हो गया। कृपया लॉगिन करें।",
    gu: "પાસવર્ડ સફળતાપૂર્વક રીસેટ થયો. કૃપા કરીને લૉગિન કરો.",
  },
  authResetFailedRetry: {
    en: "Reset failed. Please try again.",
    hi: "रीसेट विफल हुआ, कृपया फिर से कोशिश करें।",
    gu: "રીસેટ નિષ્ફળ ગયું, કૃપા કરીને ફરી પ્રયત્ન કરો.",
  },
  // Share experience
  shareShellTitle: {
    en: "Share Your Experience",
    hi: "अपना अनुभव साझा करें",
    gu: "તમારો અનુભવ શેર કરો",
  },
  shareShellSubtitle: {
    en: "Tell us about your puja experience. After admin approval, your story will appear on the Success Stories page.",
    hi: "अपनी पूजा के अनुभव के बारे में बताएं। एडमिन स्वीकृति के बाद आपकी कहानी सक्सेस स्टोरीज़ पेज पर दिखेगी।",
    gu: "તમારા પૂજા અનુભવ વિશે કહો. એડમિન મંજૂરી પછી તમારી વાર્તા સફળતા વાર્તાઓ પેજ પર આવશે.",
  },
  shareTitle: {
    en: "Share Your Experience",
    hi: "अपना अनुभव साझा करें",
    gu: "તમારો અનુભવ શેર કરો",
  },
  shareSubtitle: {
    en: "Your story helps others trust and book with confidence.",
    hi: "आपकी कहानी दूसरों को भरोसा और आत्मविश्वास से बुक करने में मदद करती है।",
    gu: "તમારી વાર્તા બીજાઓને વિશ્વાસ અને વિશ્વાસથી બુકિંગ કરવામાં મદદ કરે છે.",
  },
  shareBack: { en: "Back", hi: "वापस", gu: "પાછા" },
  shareSelectBookingLabel: {
    en: "Select Booking (optional)",
    hi: "बुकिंग चुनें (वैकल्पिक)",
    gu: "બુકિંગ પસંદ કરો (વૈકલ્પિક)",
  },
  shareSelectBookingPlaceholderHas: {
    en: "Choose a booking to auto-fill...",
    hi: "ऑटो-फिल के लिए बुकिंग चुनें...",
    gu: "ઓટો-ફિલ માટે બુકિંગ પસંદ કરો...",
  },
  shareSelectBookingPlaceholderEmpty: {
    en: "No bookings found",
    hi: "कोई बुकिंग नहीं मिली",
    gu: "કોઈ બુકિંગ મળી નથી",
  },
  sharePoojaLabel: { en: "Puja", hi: "पूजा", gu: "પૂજા" },
  sharePoojaPlaceholder: {
    en: "e.g. Griha Pravesh Puja",
    hi: "जैसे: गृह प्रवेश पूजा",
    gu: "જેમ કે: ગૃહ પ્રવેશ પૂજા",
  },
  shareCityLabel: { en: "City", hi: "शहर", gu: "શહેર" },
  shareCityPlaceholder: {
    en: "Your city",
    hi: "आपका शहर",
    gu: "તમારું શહેર",
  },
  shareRatingLabel: { en: "Rating", hi: "रेटिंग", gu: "રેટિંગ" },
  shareExperienceLabel: {
    en: "Your Experience",
    hi: "आपका अनुभव",
    gu: "તમારો અનુભવ",
  },
  shareExperiencePlaceholder: {
    en: "Write your experience...",
    hi: "अपना अनुभव लिखें...",
    gu: "તમારો અનુભવ લખો...",
  },
  shareSubmitting: {
    en: "Submitting...",
    hi: "सबमिट किया जा रहा है...",
    gu: "સબમિટ થઈ રહ્યું છે...",
  },
  shareSubmitForApproval: {
    en: "Submit for Approval",
    hi: "स्वीकृति के लिए सबमिट करें",
    gu: "મંજૂરી માટે સબમિટ કરો",
  },
  shareSubmitFailedGeneric: {
    en: "Failed to submit",
    hi: "सबमिट विफल हुआ",
    gu: "સબમિટ નિષ્ફળ થયું",
  },
  shareSubmitSuccess: {
    en: "Thank you! Your story was sent to admin for approval.",
    hi: "धन्यवाद! आपकी कहानी एडमिन के पास स्वीकृति के लिए भेज दी गई है।",
    gu: "આભાર! તમારી વાર્તા એડમિનને મંજૂરી માટે મોકલવામાં આવી છે.",
  },
  shareSubmitFailedRetry: {
    en: "Failed to submit. Please try again.",
    hi: "सबमिट विफल हुआ, कृपया फिर से कोशिश करें।",
    gu: "સબમિટ નિષ્ફળ થયું, કૃપા કરીને ફરી પ્રયત્ન કરો.",
  },
} as const;

function t<K extends keyof typeof TRANSLATIONS>(
  key: K,
  lang: Lang,
): string {
  const entry = TRANSLATIONS[key];
  return entry[lang] ?? entry.en;
}

/** Optional translation for dynamic keys (e.g. puja detail). Returns undefined if key missing. */
function optT(key: string, lang: Lang): string | undefined {
  if (!(key in TRANSLATIONS)) return undefined;
  return (TRANSLATIONS as Record<string, { en: string; hi: string; gu: string }>)[key]?.[lang];
}

function loadStoredAuth(): { token: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; user?: AuthUser };
    if (!parsed.token || !parsed.user) return null;
    return { token: parsed.token, user: parsed.user };
  } catch {
    return null;
  }
}

function storeAuth(auth: { token: string; user: AuthUser } | null) {
  if (!auth) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

// SDK type stubs
declare global {
  interface Window {
    elementSdk?: {
      init: (opts: {
        defaultConfig: Config;
        onConfigChange: (cfg: Config) => void;
        mapToCapabilities: (cfg: Config) => unknown;
        mapToEditPanelValues: (cfg: Config) => Map<string, string>;
      }) => void;
      config?: Partial<Config>;
      setConfig: (update: Partial<Config>) => void;
    };
    dataSdk?: {
      init: (handler: {
        onDataChanged: (data: BookingData[]) => void;
      }) => Promise<{ isOk: boolean }>;
      create: (data: BookingData) => Promise<{ isOk: boolean }>;
    };
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const defaultConfig: Config = {
  hero_title: "Book Authentic Vedic Pujas with Verified Pandits",
  hero_subtitle:
    "Experience sacred rituals performed by learned Brahmins with personalized consultation and transparent pricing",
  contact_phone: "+91 8849307007",
  contact_email: "namaste@satkarmpuja.com",
  primary_color: "#ff8800",
  secondary_color: "#d4af37",
  background_color: "#fff8f0",
  text_color: "#1f2937",
  surface_color: "#ffffff",
};

const poojaDetails: Record<string, PoojaDetail> = {
  "navagraha-shanti": {
    name: "Navagraha Shanti Puja",
    subtitle: "Planetary Peace & Harmony",
    icon: <Globe className="w-5 h-5 text-indigo-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Navagraha Shanti is a powerful Vedic ritual performed to pacify the nine celestial bodies (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu). This puja brings harmony, removes planetary doshas, and creates positive cosmic influence in your life.",
    benefits: [
      "Removes negative planetary influences",
      "Brings health and prosperity",
      "Reduces obstacles and challenges",
      "Enhances mental clarity and focus",
      "Protects family from malefic effects",
      "Brings peace and harmony",
    ],
    process: [
      "Purification of the space (Shaucha)",
      "Invocation of Lord Ganesha",
      "Chanting of Navagraha mantras",
      "Offerings to each planet deity",
      "Aarti and blessings",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those experiencing health issues, career blocks, or facing challenging planetary periods",
    whenToPerform:
      "Anytime, but most effective during positive planetary transits",
  },
  "surya-grah-shanti": {
    name: "Surya Grah Shanti Puja",
    subtitle: "Sun God's Cosmic Blessings",
    icon: <Sun className="w-5 h-5 text-amber-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Surya Grah Shanti is performed to pacify the Sun's negative influences. This powerful ritual enhances energy, removes health issues, and brings success in all endeavors.",
    benefits: [
      "Boosts confidence and courage",
      "Improves health and vitality",
      "Removes eye ailments",
      "Brings career advancement",
      "Enhances leadership qualities",
      "Attracts positive energy",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Surya",
      "Chanting of Surya Mantras",
      "Offering of red flowers",
      "Aarti with ghee lamp",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those with weak Sun in birth chart or facing low energy and health issues",
    whenToPerform: "Sunday is most auspicious for Surya Puja",
  },
  "chandra-grah-shanti": {
    name: "Chandra Grah Shanti Puja",
    subtitle: "Moon God's Serene Blessings",
    icon: <Moon className="w-5 h-5 text-blue-300" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Chandra Grah Shanti pacifies the Moon's negative effects. This ritual brings emotional balance, peace of mind, and protection for mental health.",
    benefits: [
      "Brings emotional balance",
      "Improves mental health",
      "Reduces anxiety and stress",
      "Enhances intuition",
      "Brings peaceful sleep",
      "Strengthens relationships",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Chandra",
      "Chanting of Chandra Mantras",
      "Offering of white flowers",
      "Aarti with milk",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing mental disturbances, anxiety, or emotional imbalance",
    whenToPerform: "Monday is most auspicious, especially during Full Moon",
  },
  "mangal-grah-shanti": {
    name: "Mangal Grah Shanti Puja",
    subtitle: "Mars God's Warrior Energy",
    icon: <Circle fill="#ef4444" className="w-5 h-5 text-red-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Mangal Grah Shanti is performed to reduce the negative effects of Mars. This ritual brings courage, removes obstacles in marriage, and provides protection.",
    benefits: [
      "Removes Mangal Dosha",
      "Brings courage and confidence",
      "Ensures harmonious marriage",
      "Protects from accidents",
      "Brings victory over enemies",
      "Enhances strength",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Mangal",
      "Chanting of Mangal Mantras",
      "Offering of red flowers and sweets",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Those with Mangal Dosha or facing relationship obstacles",
    whenToPerform: "Tuesday is most auspicious for Mangal Puja",
  },
  "budh-grah-shanti": {
    name: "Budh Grah Shanti Puja",
    subtitle: "Mercury God's Intellectual Blessings",
    icon: <Circle fill="#22c55e" className="w-5 h-5 text-green-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Budh Grah Shanti enhances intelligence, communication skills, and business success. This ritual removes obstacles in education and commerce.",
    benefits: [
      "Enhances intellect and wisdom",
      "Improves communication skills",
      "Brings business success",
      "Removes speech impediments",
      "Strengthens memory",
      "Attracts prosperity through trade",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Budh",
      "Chanting of Budh Mantras",
      "Offering of green flowers",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Students, businessmen, and those in communication fields",
    whenToPerform: "Wednesday is most auspicious for Budh Puja",
  },
  "guru-grah-shanti": {
    name: "Guru Grah Shanti Puja",
    subtitle: "Jupiter's Wisdom & Fortune",
    icon: <Circle fill="#eab308" className="w-5 h-5 text-yellow-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Guru Grah Shanti invokes Jupiter's blessings for wisdom, prosperity, and spiritual growth. This powerful ritual removes education obstacles and brings good fortune.",
    benefits: [
      "Brings wisdom and knowledge",
      "Attracts prosperity and wealth",
      "Removes education obstacles",
      "Enhances spiritual growth",
      "Brings good fortune",
      "Ensures successful endeavors",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Guru",
      "Chanting of Guru Mantras",
      "Offering of yellow flowers",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Students, spiritual seekers, and those pursuing higher knowledge",
    whenToPerform: "Thursday is most auspicious for Guru Puja",
  },
  "shukra-grah-shanti": {
    name: "Shukra Grah Shanti Puja",
    subtitle: "Venus's Love & Abundance",
    icon: <Heart fill="#22c55e" className="w-5 h-5 text-green-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Shukra Grah Shanti enhances love, beauty, and material comfort. This ritual brings harmony in relationships and attracts prosperity through creative endeavors.",
    benefits: [
      "Brings love and harmony in relationships",
      "Enhances beauty and charm",
      "Attracts wealth and comfort",
      "Improves artistic abilities",
      "Brings marital happiness",
      "Removes relationship conflicts",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Shukra",
      "Chanting of Shukra Mantras",
      "Offering of white and pink flowers",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those seeking marriage, artists, and those facing relationship issues",
    whenToPerform: "Friday is most auspicious for Shukra Puja",
  },
  "shani-grah-shanti": {
    name: "Shani Grah Shanti Puja",
    subtitle: "Saturn's Karmic Lessons",
    icon: <Circle fill="#a855f7" className="w-5 h-5 text-purple-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Shani Grah Shanti is performed to pacify Saturn's challenging influences. This powerful ritual removes obstacles, brings relief from hardships, and ensures steady progress.",
    benefits: [
      "Removes Shani Dosha effects",
      "Brings relief from hardships",
      "Ensures job stability",
      "Brings steady progress",
      "Removes obstacles in life",
      "Attracts longevity",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Shani",
      "Chanting of Shani Mantras",
      "Offering of black and blue flowers",
      "Extended Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing Shani Sade Sati or experiencing major life obstacles",
    whenToPerform: "Saturday is most auspicious for Shani Puja",
  },
  "rahu-grah-shanti": {
    name: "Rahu Grah Shanti Puja",
    subtitle: "Shadow Planet's Karmic Balance",
    icon: <Circle fill="#000000" className="w-5 h-5 text-black" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Rahu Grah Shanti pacifies the shadow planet Rahu's negative effects. This ritual removes confusion, brings clarity of thought, and ensures success in endeavors.",
    benefits: [
      "Removes confusion and illusion",
      "Brings clarity of thought",
      "Removes sudden obstacles",
      "Protects from deception",
      "Brings prosperity",
      "Ensures steady growth",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Rahu",
      "Chanting of Rahu Mantras",
      "Offering of black flowers",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor: "Those facing Rahu Mahadasha or dealing with sudden life changes",
    whenToPerform: "Anytime, but most effective on specific lunar days",
  },
  "ketu-grah-shanti": {
    name: "Ketu Grah Shanti Puja",
    subtitle: "Shadow Planet's Spiritual Wisdom",
    icon: <Circle fill="#ffffff" className="w-5 h-5 text-white" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Ketu Grah Shanti addresses spiritual challenges and karmic debts. This ritual brings spiritual awakening, removes health issues, and ensures protection.",
    benefits: [
      "Brings spiritual awakening",
      "Removes health complications",
      "Protects from negative energies",
      "Ensures liberation from karmic debts",
      "Brings inner peace",
      "Enhances intuition",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Ketu",
      "Chanting of Ketu Mantras",
      "Offering of mixed flowers",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor: "Those seeking spiritual growth or facing Ketu Mahadasha",
    whenToPerform: "Anytime, but most effective on specific lunar days",
  },
  rudrabhishek: {
    name: "Rudrabhishek Puja",
    subtitle: "Lord Shiva's Sacred Ablution",
    icon: <Flame className="w-5 h-5 text-saffron-500" />,
    price: "₹499",
    duration: "1 hour",
    description:
      "Rudrabhishek is an ancient and powerful ritual dedicated to Lord Shiva where sacred substances are offered to the Shiva Lingam. This ritual invokes blessings for prosperity, health, and spiritual growth.",
    benefits: [
      "Fulfills wishes and desires",
      "Removes negative karma",
      "Brings health and longevity",
      "Protects from accidents and dangers",
      "Enhances spiritual consciousness",
      "Brings peace and prosperity",
    ],
    process: [
      "Preparation of sacred materials",
      "Invocation of Lord Shiva",
      "Bathing the Lingam with sacred substances",
      "Chanting of Rudra Sukta mantras",
      "Offering of flowers and fruits",
      "Final Aarti and blessings",
    ],
    bestFor:
      "Devotees seeking Shiva's blessings, facing health issues, or spiritual seekers",
    whenToPerform: "Monday is most auspicious for Rudrabhishek",
  },
  "durga-saptashati": {
    name: "Durga Saptashati Puja",
    subtitle: "Goddess of Power & Protection",
    icon: <Star className="w-5 h-5 text-saffron-500" />,
    price: "₹499",
    duration: "1 hour",
    description:
      "Durga Saptashati is a powerful ritual invoking Goddess Durga through recitation of sacred texts. This puja provides protection from evil influences and grants power to overcome challenges.",
    benefits: [
      "Provides protection from negativity",
      "Grants courage and strength",
      "Removes obstacles and enemies",
      "Brings victory and success",
      "Protects family members",
      "Destroys negative karmic patterns",
    ],
    process: [
      "Sacred space preparation",
      "Invocation of Goddess Durga",
      "Chanting of Devi Mahatmya",
      "Offering of flowers and sweets",
      "Ritual worship with mantras",
      "Final Aarti and blessings",
    ],
    bestFor:
      "Those facing difficulties, seeking protection, or overcoming challenges",
    whenToPerform:
      "Navratri period is most auspicious, but can be performed anytime",
  },
  "ganesh-pooja": {
    name: "Ganesh Puja",
    subtitle: "Remover of Obstacles",
    icon: <Flower2 className="w-5 h-5 text-pink-500" />,
    price: "₹499",
    duration: "1 hour",
    description:
      "Ganesh Puja honors Lord Ganesha to remove obstacles and ensure success. This beloved ritual is performed before all major undertakings and spiritual practices.",
    benefits: [
      "Removes obstacles",
      "Ensures success in new ventures",
      "Brings wisdom and intelligence",
      "Protects from negativity",
      "Brings prosperity",
      "Blesses with good fortune",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Ganesh",
      "Chanting of Ganesh Mantras",
      "Offering of sweets and flowers",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Before starting new projects, businesses, or important endeavors",
    whenToPerform: "Any day, especially Wednesday",
  },
  "hanuman-pooja": {
    name: "Hanuman Puja",
    subtitle: "Eternal Devotion & Strength",
    icon: <Shield className="w-5 h-5 text-orange-500" />,
    price: "₹499",
    duration: "1 hour",
    description:
      "Hanuman Puja invokes the blessings of Lord Hanuman for strength, courage, and devotion. This ritual protects from evil forces and ensures victory.",
    benefits: [
      "Brings courage and strength",
      "Removes fear and anxiety",
      "Provides protection from evil",
      "Brings victory in challenges",
      "Enhances devotion and faith",
      "Ensures good health",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Hanuman",
      "Chanting of Hanuman Chalisa",
      "Offering of red flowers",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Those seeking strength, protection, and spiritual growth",
    whenToPerform: "Tuesday is most auspicious for Hanuman Puja",
  },
  "vishnu-pooja": {
    name: "Vishnu Puja",
    subtitle: "Preserver of Universe",
    icon: <Feather className="w-5 h-5 text-emerald-500" />,
    price: "₹499",
    duration: "1 hour",
    description:
      "Vishnu Puja invokes the blessings of Lord Vishnu for protection and prosperity. This sacred ritual brings peace, harmony, and spiritual fulfillment.",
    benefits: [
      "Brings divine protection",
      "Ensures prosperity and wealth",
      "Brings peace and harmony",
      "Removes negative influences",
      "Protects family members",
      "Brings spiritual fulfillment",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Vishnu",
      "Chanting of Vishnu Mantras",
      "Offering of flowers and sweets",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Devotees seeking divine protection and prosperity",
    whenToPerform: "Any day, especially Thursday",
  },
  "lakshmi-pooja": {
    name: "Lakshmi Puja",
    subtitle: "Goddess of Wealth & Prosperity",
    icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
    price: "₹499",
    duration: "1 hour",
    description:
      "Lakshmi Puja is performed to invoke the blessings of Goddess Lakshmi, the deity of wealth, fortune, and prosperity. This sacred ritual attracts abundance and removes financial obstacles.",
    benefits: [
      "Attracts wealth and prosperity",
      "Removes financial difficulties",
      "Brings good fortune",
      "Increases business success",
      "Removes negative influences",
      "Brings happiness and contentment",
    ],
    process: [
      "Space purification and decoration",
      "Invocation of Lord Ganesha",
      "Chanting of Lakshmi Chalisa",
      "Offering of flowers and sweets",
      "Lighting of lamps (Diya)",
      "Final blessings and Prasad",
    ],
    bestFor:
      "Business owners, entrepreneurs, or those facing financial challenges",
    whenToPerform:
      "Lakshmi Puja is traditionally performed during Diwali but can be done anytime",
  },
  "maha-mrityunjay": {
    name: "Maha Mrityunjay Mantra Jap",
    subtitle: "Victory Over Death & Disease",
    icon: <HeartHandshake className="w-5 h-5 text-saffron-500" />,
    price: "₹28,999",
    duration: "2 days (approx. 8 hours per day)",
    description:
      "Maha Mrityunjay Mantra Jap is a powerful healing ritual that invokes Lord Shiva for protection from illness and premature death. This sacred chanting removes health obstacles.",
    benefits: [
      "Heals chronic diseases",
      "Protects from accidents",
      "Removes fear of death",
      "Enhances longevity",
      "Brings good health",
      "Ensures safe travels",
    ],
    process: [
      "Space purification",
      "Invocation of Lord Shiva",
      "Chanting of Maha Mrityunjay Mantra (11,000+ times)",
      "Offering of flowers",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing health challenges, seeking longevity, or after accidents",
    whenToPerform: "Anytime, especially during Full Moon",
  },
  "durga-navarna": {
    name: "Durga Navarna Mantra Jap",
    subtitle: "Nine Sacred Names of Durga",
    icon: <Crown className="w-5 h-5 text-yellow-500" />,
    price: "₹17,999",
    duration: "2 days (approx. 8 hours per day)",
    description:
      "Durga Navarna Mantra Jap is a powerful ritual chanting the nine sacred names of Goddess Durga. This ritual grants protection and removes all obstacles from life.",
    benefits: [
      "Removes all obstacles",
      "Brings victory and success",
      "Provides divine protection",
      "Removes evil influences",
      "Brings prosperity",
      "Ensures spiritual growth",
    ],
    process: [
      "Space purification",
      "Invocation of Goddess Durga",
      "Chanting of Nine Names (9,000+ times)",
      "Offering of flowers and fruits",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor: "Those facing major life obstacles or seeking divine protection",
    whenToPerform: "Navratri is most auspicious",
  },
  "maha-mrityunjay-havan": {
    name: "Maha Mrityunjay Mantra Jap with havan",
    subtitle: "Victory Over Death & Disease with Sacred Fire",
    icon: <HeartHandshake className="w-5 h-5 text-saffron-500" />,
    price: "₹28,999",
    duration: "2 days (approx. 8-10 hours per day)",
    description:
      "This comprehensive ritual includes the powerful Maha Mrityunjay Mantra Jap followed by a sacred Havan. It invokes Lord Shiva for ultimate protection, healing, and spiritual strength.",
    benefits: [
      "Heals chronic diseases and health issues",
      "Protects from accidents and untimely death",
      "Removes fear and mental distress",
      "Enhances longevity and vitality",
      "Brings peace and spiritual growth",
      "Ensures overall family protection",
    ],
    process: [
      "Space purification and Ganpati Sthapana",
      "Invocation of Lord Shiva",
      "Maha Mrityunjay Mantra Jap (1.25 lakh count)",
      "Sacred Havan with specific herbs",
      "Purnaahuti and Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those seeking recovery from illness or divine protection",
    whenToPerform: "Mondays or during Full Moon",
  },
  "durga-navarna-havan": {
    name: "Durga Navarna Mantra Jap with havan",
    subtitle: "Divine Protection with Nine Sacred Names & Havan",
    icon: <Crown className="w-5 h-5 text-yellow-500" />,
    price: "₹17,999",
    duration: "2 days (approx. 8-10 hours per day)",
    description:
      "This ritual combines the chanting of Durga Navarna Mantra with a sacred Havan. It invokes the nine forms of Goddess Durga to remove obstacles and grant victory over challenges.",
    benefits: [
      "Removes all life obstacles and hurdles",
      "Brings victory in legal and personal battles",
      "Provides strong divine protection",
      "Removes negative energies and evil eye",
      "Brings prosperity and abundance",
      "Ensures mental and physical strength",
    ],
    process: [
      "Purification and Kalash Sthapana",
      "Invocation of Goddess Durga",
      "Durga Navarna Mantra Jap (1.25 lakh count)",
      "Sacred Havan with Dashamsha",
      "Extended Aarti and Purnaahuti",
      "Distribution of Prasad",
    ],
    bestFor: "Those seeking victory over obstacles or success in new ventures",
    whenToPerform: "Navratri or Tuesdays",
  },
  "kaal-sarp-dosh": {
    name: "Kaal Sarp Dosh Nivaran Puja",
    subtitle: "Breaking the Serpent's Curse",
    icon: <Waves className="w-5 h-5 text-blue-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "Kaal Sarp Dosh Nivaran is a specialized ritual to pacify the Kaal Sarp Dosha in the birth chart. This powerful puja removes the curse and brings relief from life obstacles.",
    benefits: [
      "Removes Kaal Sarp Dosha effects",
      "Brings relief from repeated failures",
      "Ensures financial stability",
      "Brings harmony in relationships",
      "Removes health issues",
      "Brings overall progress",
    ],
    process: [
      "Extensive space purification",
      "Invocation of deities",
      "Chanting of Kaal Sarp Mantras",
      "Ritual worship with specific offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor: "Those having Kaal Sarp Dosha in their birth chart",
    whenToPerform: "Immediately upon discovery of Kaal Sarp Dosha",
  },
  "surya-shani-dosh": {
    name: "Surya-Shani Shapit Dosh Nivaran",
    subtitle: "Sun-Saturn Curse Resolution",
    icon: <Sun className="w-5 h-5 text-amber-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This specialized puja addresses the combined curse of Sun and Saturn in the birth chart, bringing relief from chronic problems and obstacles.",
    benefits: [
      "Removes Surya-Shani curse effects",
      "Brings career advancement",
      "Removes health issues",
      "Brings financial stability",
      "Removes father-related problems",
      "Ensures family harmony",
    ],
    process: [
      "Space purification",
      "Invocation of Surya and Shani",
      "Chanting of combined mantras",
      "Specific offerings and ritual",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor: "Those with Surya-Shani Shapit Dosha affecting career and health",
    whenToPerform: "As soon as dosha is identified",
  },
  "shani-rahu-dosh": {
    name: "Shani-Rahu Shapit Dosh Nivaran",
    subtitle: "Saturn-Rahu Curse Resolution",
    icon: <Circle fill="#000000" className="w-5 h-5 text-black" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This powerful puja removes the combined curse of Saturn and Rahu, bringing clarity and removing sudden obstacles from life.",
    benefits: [
      "Removes confusion and illusion",
      "Brings career success",
      "Removes unexpected obstacles",
      "Ensures financial security",
      "Brings clarity of thought",
      "Protects from deception",
    ],
    process: [
      "Space purification",
      "Invocation of Shani and Rahu",
      "Chanting of combined mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor: "Those facing Shani-Rahu combined curse effects",
    whenToPerform: "As soon as dosha is identified",
  },
  "mangal-rahu-dosh": {
    name: "Mangal-Rahu Angarak Dosh Nivaran",
    subtitle: "Mars-Rahu Curse Resolution",
    icon: <Circle fill="#ef4444" className="w-5 h-5 text-red-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This specialized puja addresses the Angarak Dosha formed by Mars and Rahu, removing obstacles in marriage and personal relationships.",
    benefits: [
      "Removes Angarak Dosha effects",
      "Ensures successful marriage",
      "Removes relationship conflicts",
      "Protects from accidents",
      "Brings courage and confidence",
      "Ensures family harmony",
    ],
    process: [
      "Space purification",
      "Invocation of Mangal and Rahu",
      "Chanting of combined mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those with Mangal-Rahu Dosha affecting marriage and relationships",
    whenToPerform: "Before marriage or when facing relationship issues",
  },
  "guru-rahu-dosh": {
    name: "Guru-Rahu Chandal Dosh Nivaran",
    subtitle: "Jupiter-Rahu Curse Resolution",
    icon: <Circle fill="#eab308" className="w-5 h-5 text-yellow-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja addresses the Chandal Dosha formed by Jupiter and Rahu, removing obstacles in education and spiritual growth.",
    benefits: [
      "Removes education obstacles",
      "Ensures spiritual progress",
      "Brings wisdom and knowledge",
      "Removes confusion",
      "Attracts prosperity",
      "Brings good fortune",
    ],
    process: [
      "Space purification",
      "Invocation of Guru and Rahu",
      "Chanting of combined mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor: "Students and spiritual seekers facing Guru-Rahu Chandal Dosha",
    whenToPerform: "Before important educational pursuits",
  },
  "chandra-rahu-dosh": {
    name: "Chandra-Rahu Grahan Dosh Nivaran",
    subtitle: "Moon-Rahu Eclipse Curse Resolution",
    icon: <Moon className="w-5 h-5 text-blue-300" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja addresses the Grahan Dosha formed by Moon and Rahu, removing mental disturbances and bringing emotional balance.",
    benefits: [
      "Removes mental disturbances",
      "Brings emotional balance",
      "Ensures sound sleep",
      "Removes anxiety and fear",
      "Improves family relationships",
      "Brings inner peace",
    ],
    process: [
      "Space purification",
      "Invocation of Chandra and Rahu",
      "Chanting of combined mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing mental issues or emotional disturbances due to this dosha",
    whenToPerform: "Immediately upon identification",
  },
  "surya-rahu-dosh": {
    name: "Surya-Rahu Grahan Dosh Shanti Vidhan",
    subtitle: "Sun-Rahu Eclipse Remedy",
    icon: <Sun className="w-5 h-5 text-amber-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja addresses the Grahan Dosha formed by Sun and Rahu, reducing ego conflicts and bringing stability in career and authority matters.",
    benefits: [
      "Reduces negative Sun-Rahu influences",
      "Brings stability in career and authority",
      "Removes sudden setbacks and public-image issues",
      "Improves relationship with father and mentors",
      "Brings clarity and confidence",
      "Ensures protection from ego-driven decisions",
    ],
    process: [
      "Space purification",
      "Invocation of Surya and Rahu",
      "Chanting of combined Surya-Rahu mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing Surya-Rahu Grahan Dosha affecting career, authority, or ego-related issues",
    whenToPerform: "When Grahan Dosha is identified or during eclipses",
  },
  "surya-ketu-dosh": {
    name: "Surya-Ketu Grahan Dosh Shanti Vidhan",
    subtitle: "Sun-Ketu Eclipse Remedy",
    icon: <Sun className="w-5 h-5 text-amber-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja addresses the Grahan Dosha formed by Sun and Ketu, removing spiritual confusion and bringing balance between material and spiritual life.",
    benefits: [
      "Reduces negative Sun-Ketu influences",
      "Brings balance between material and spiritual life",
      "Removes career instability due to Ketu",
      "Improves focus and decision-making",
      "Protects from sudden losses",
      "Brings inner peace and clarity",
    ],
    process: [
      "Space purification",
      "Invocation of Surya and Ketu",
      "Chanting of combined Surya-Ketu mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing Surya-Ketu Grahan Dosha causing instability, detachment, or confusion",
    whenToPerform: "When Grahan Dosha is identified or during eclipses",
  },
  "surya-mangal-dosh": {
    name: "Surya-Mangal Angarak Dosh Shanti Vidhan",
    subtitle: "Sun-Mars Angarak Remedy",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja pacifies the fiery combination of Sun and Mars, reducing anger, aggression, and conflicts in professional and personal life.",
    benefits: [
      "Reduces anger and aggression",
      "Brings discipline and balanced leadership",
      "Removes conflicts with authorities",
      "Protects from accidents and injuries",
      "Brings courage with humility",
      "Ensures harmony in family and workplace",
    ],
    process: [
      "Space purification",
      "Invocation of Surya and Mangal",
      "Chanting of combined Surya-Mangal mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing Surya-Mangal Angarak Dosha causing anger, conflicts, or impulsive actions",
    whenToPerform: "On auspicious days for Sun or Mars, or when dosha is identified",
  },
  "surya-chandra-amavasya-dosh": {
    name: "Surya-Chandra Amavasya Dosh Shanti Vidhan",
    subtitle: "Sun-Moon Amavasya Remedy",
    icon: <Moon className="w-5 h-5 text-gray-400" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja pacifies the Amavasya Dosha formed by Sun and Moon, bringing emotional balance, mental peace, and harmony in relationships.",
    benefits: [
      "Removes Amavasya-related disturbances",
      "Brings emotional stability",
      "Improves relationship with parents",
      "Reduces mood swings and confusion",
      "Brings peace at home",
      "Supports spiritual growth",
    ],
    process: [
      "Space purification",
      "Invocation of Surya and Chandra",
      "Chanting of Surya-Chandra mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing emotional imbalance, family disharmony, or Amavasya-related dosha",
    whenToPerform: "Preferably on Amavasya or when dosha is identified",
  },
  "shani-ketu-dosh": {
    name: "Shani-Ketu Shapit Dosh Shanti Vidhan",
    subtitle: "Saturn-Ketu Curse Remedy",
    icon: <Globe className="w-5 h-5 text-indigo-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja remedies the difficult combination of Saturn and Ketu, reducing prolonged struggles, isolation, and karmic obstacles.",
    benefits: [
      "Reduces Shani-Ketu negative influences",
      "Brings stability in career and finances",
      "Removes feelings of isolation and stagnation",
      "Supports resolution of past karmic issues",
      "Brings disciplined spiritual growth",
      "Ensures steady progress in life",
    ],
    process: [
      "Space purification",
      "Invocation of Shani and Ketu",
      "Chanting of combined Shani-Ketu mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing long-term struggles, delays, or Shani-Ketu Shapit Dosha",
    whenToPerform: "On Saturdays or when dosha is identified",
  },
  "shani-chandra-vish-yog-dosh": {
    name: "Shani-Chandra Vish Yog Shanti Vidhan",
    subtitle: "Saturn-Moon Vish Yog Remedy",
    icon: <Moon className="w-5 h-5 text-gray-600" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja pacifies Vish Yog formed by Saturn and Moon, reducing depression, fear, and emotional heaviness.",
    benefits: [
      "Reduces Vish Yog effects",
      "Brings emotional resilience",
      "Removes chronic sadness and fear",
      "Improves sleep and peace of mind",
      "Strengthens relationships with family",
      "Brings hope and positivity",
    ],
    process: [
      "Space purification",
      "Invocation of Shani and Chandra",
      "Chanting of Vish Yog mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing Shani-Chandra Vish Yog causing depression or emotional heaviness",
    whenToPerform: "On Mondays or Saturdays, or when dosha is identified",
  },
  "mangal-ketu-dosh": {
    name: "Mangal-Ketu Angarak Dosh Shanti Vidhan",
    subtitle: "Mars-Ketu Angarak Remedy",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja addresses Angarak Dosha formed by Mars and Ketu, reducing impulsiveness and conflicts in property, siblings, and courage-related matters.",
    benefits: [
      "Reduces impulsive actions",
      "Removes conflicts related to property and courage",
      "Protects from accidents and injuries",
      "Brings constructive energy and discipline",
      "Supports harmonious relationships",
      "Ensures steady progress in efforts",
    ],
    process: [
      "Space purification",
      "Invocation of Mangal and Ketu",
      "Chanting of combined Mangal-Ketu mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing Mangal-Ketu Angarak Dosha causing conflicts, risks, or impulsive behavior",
    whenToPerform: "On Tuesdays or when dosha is identified",
  },
  "guru-ketu-dosh": {
    name: "Guru-Ketu Chandal Dosh Shanti Vidhan",
    subtitle: "Jupiter-Ketu Curse Remedy",
    icon: <Circle fill="#eab308" className="w-5 h-5 text-yellow-500" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja remedies the Chandal Dosha formed by Jupiter and Ketu, bringing clarity in spiritual path and higher education.",
    benefits: [
      "Reduces Guru-Ketu negative influences",
      "Removes obstacles in higher education",
      "Brings clarity in spiritual and life purpose",
      "Reduces confusion in beliefs",
      "Attracts divine grace and guidance",
      "Brings wisdom with humility",
    ],
    process: [
      "Space purification",
      "Invocation of Guru and Ketu",
      "Chanting of combined Guru-Ketu mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Students and seekers facing Guru-Ketu Chandal Dosha or confusion in faith and studies",
    whenToPerform: "On Thursdays or when dosha is identified",
  },
  "chandra-ketu-dosh": {
    name: "Chandra-Ketu Grahan Dosh Shanti Vidhan",
    subtitle: "Moon-Ketu Eclipse Remedy",
    icon: <Moon className="w-5 h-5 text-blue-300" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "This puja addresses the Grahan Dosha formed by Moon and Ketu, bringing emotional healing, intuitive clarity, and relief from past-life karmic fears.",
    benefits: [
      "Reduces Moon-Ketu negative influences",
      "Brings emotional healing and inner peace",
      "Improves imagination and intuition positively",
      "Removes hidden fears and anxieties",
      "Brings harmony in family relationships",
      "Supports spiritual progress",
    ],
    process: [
      "Space purification",
      "Invocation of Chandra and Ketu",
      "Chanting of combined Chandra-Ketu mantras",
      "Specific ritual offerings",
      "Extended Aarti",
      "Distribution of Prasad",
    ],
    bestFor:
      "Those facing Chandra-Ketu Grahan Dosha causing fear, confusion, or emotional instability",
    whenToPerform: "On auspicious lunar days or when dosha is identified",
  },
  "laghu-rudra": {
    name: "Homatmak Laghu Rudra Puja",
    subtitle: "Fire Ritual for Shiva's Blessings",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    price: "₹24,999 (With havan)",
    duration: "8 hours",
    description:
      "Laghu Rudra is a sacred fire ritual dedicated to Lord Shiva with Homa (fire offerings). This powerful puja removes all negative influences and brings divine grace.",
    benefits: [
      "Removes all negative influences",
      "Brings divine grace and blessings",
      "Ensures prosperity and success",
      "Removes past karmic debts",
      "Brings spiritual awakening",
      "Protects family from harm",
    ],
    process: [
      "Space purification and preparation",
      "Establishment of sacred fire",
      "Invocation of Lord Shiva",
      "Chanting of mantras",
      "Homa offerings",
      "Aarti and blessings",
    ],
    bestFor: "Those seeking major life transformations or divine intervention",
    whenToPerform: "Any auspicious time, especially during Full Moon",
  },
  "ganesh-atharvashirsha-laddu-havan": {
    name: "Ganesh Puja with Atharvarshisham Path (Laddu Havan)",
    subtitle: "Atharvashirsha Path with Laddu Havan",
    icon: <Flower2 className="w-5 h-5 text-pink-500" />,
    price: "₹24,999 (With havan)",
    duration: "8 hours",
    description:
      "This special Ganesh puja includes recitation of Ganapati Atharvashirsha along with a Laddu Havan. It invokes Lord Ganesha's blessings for removal of obstacles, prosperity, and auspicious beginnings.",
    benefits: [
      "Removes major obstacles from life and new ventures",
      "Brings prosperity and success in business and career",
      "Ensures auspicious beginnings for important events",
      "Protects the family from negative influences",
      "Brings wisdom, clarity, and focus",
      "Invites Lord Ganesha's grace in home and workplace",
    ],
    process: [
      "Space purification and Ganesh altar preparation",
      "Invocation of Lord Ganesha",
      "Chanting of Ganapati Atharvashirsha",
      "Laddu Havan with sacred offerings",
      "Aarti and collective prayers",
      "Distribution of Prasad and blessings",
    ],
    bestFor:
      "Those starting new ventures, facing obstacles, or seeking special Ganesh blessings",
    whenToPerform:
      "Before starting important work, on auspicious tithis, or during Ganesh festivals",
  },
  "pathatmak-laghu-rudra": {
    name: "Pathatmak Laghu rudra puja",
    subtitle: "Path-based Laghu Rudra Anushthan",
    icon: <ScrollText className="w-5 h-5 text-amber-600" />,
    price: "₹7,999",
    duration: "3 hours",
    description:
      "Pathatmak Laghu Rudra is a recitation-based Laghu Rudra puja where Vedic mantras are chanted without full homa (fire offerings). It invokes Lord Shiva's blessings for purification, protection, and removal of obstacles while being simpler than a full homatmak yagna.",
    benefits: [
      "Invokes Lord Shiva's grace through powerful Rudra path",
      "Removes negativity and subtle obstacles",
      "Brings peace, health, and prosperity in the home",
      "Supports spiritual growth and inner purification",
      "Protects the family from unseen challenges",
      "Good option when full homa is not feasible",
    ],
    process: [
      "Space purification and Shiv altar preparation",
      "Sankalpa and invocation of Lord Shiva",
      "Pathatmak recitation of Laghu Rudra mantras",
      "Offering of flowers, bilva leaves, and sacred items",
      "Shiv aarti and collective prayers",
      "Prasad distribution and blessings",
    ],
    bestFor:
      "Families and devotees seeking Laghu Rudra benefits in a simpler, path-based format",
    whenToPerform:
      "On Mondays, Pradosh, Shravan month, or any auspicious Shiva tithi",
  },
  "navchandi-yagna": {
    name: "Navchandi Yagna Puja",
    subtitle: "Grand Vedic Fire Ritual",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    price: "₹24,999 (With havan)",
    duration: "8 hours",
    description:
      "Navchandi Yagna is the ultimate Vedic fire ritual invoking Goddess Durga through nine sacred chantings. This grandest puja removes all obstacles and brings supreme blessings.",
    benefits: [
      "Removes all major obstacles",
      "Brings supreme divine blessings",
      "Ensures victory in all endeavors",
      "Removes generational curses",
      "Brings spiritual transformation",
      "Ensures peace and prosperity for generations",
    ],
    process: [
      "Elaborate space preparation",
      "Multiple sacred fires",
      "Invocation of Goddess Durga",
      "Chanting of Devi Mahatmya",
      "Extensive Homa offerings",
      "Grand Aarti and blessings",
    ],
    bestFor: "Those seeking comprehensive life transformation and divine grace",
    whenToPerform: "Navratri or any auspicious period",
  },
  "revati-nakshatra": {
    name: "Revati Nakshatra Shanti Vidhan",
    subtitle: "Protection & Prosperity Star",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Revati Nakshatra Shanti pacifies the negative effects of being born under Revati nakshatra, bringing protection and prosperity.",
    benefits: [
      "Brings protection and safety",
      "Ensures prosperity",
      "Removes obstacles",
      "Brings peaceful travel",
      "Attracts good fortune",
      "Ensures family welfare",
    ],
    process: [
      "Space purification",
      "Invocation of Revati deities",
      "Chanting of nakshatra mantras",
      "Offering of flowers and sweets",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Those born under Revati nakshatra",
    whenToPerform: "During Revati nakshatra or on birthday",
  },
  "mool-nakshatra": {
    name: "Mool Nakshatra Shanti Vidhan",
    subtitle: "Root Star Pacification",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Mool Nakshatra Shanti addresses the effects of being born under Mool nakshatra, bringing family harmony and success.",
    benefits: [
      "Brings family harmony",
      "Removes obstacles in life",
      "Ensures business success",
      "Brings prosperity",
      "Protects family members",
      "Removes generational issues",
    ],
    process: [
      "Space purification",
      "Invocation of Mool deities",
      "Chanting of nakshatra mantras",
      "Offering of flowers and sweets",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Those born under Mool nakshatra facing obstacles",
    whenToPerform: "During Mool nakshatra or on birthday",
  },
  "magha-nakshatra": {
    name: "Magha Nakshatra Shanti Vidhan",
    subtitle: "Ancestral Blessing Star",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Magha Nakshatra Shanti honors ancestral blessings and removes negative effects of this nakshatra, bringing family prosperity.",
    benefits: [
      "Brings ancestral blessings",
      "Ensures family prosperity",
      "Brings honor and respect",
      "Removes ancestral curses",
      "Brings wealth and success",
      "Ensures family unity",
    ],
    process: [
      "Space purification",
      "Invocation of Magha deities",
      "Chanting of nakshatra mantras",
      "Offering of flowers and sweets",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Those born under Magha nakshatra seeking ancestral support",
    whenToPerform: "During Magha nakshatra or on birthday",
  },
  "jyestha-nakshatra": {
    name: "Jyestha Nakshatra Shanti Vidhan",
    subtitle: "Eldest Star Blessings",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Jyestha Nakshatra Shanti brings leadership qualities and removes obstacles faced by those born under this nakshatra.",
    benefits: [
      "Brings leadership qualities",
      "Ensures success in endeavors",
      "Removes obstacles",
      "Brings prosperity through business",
      "Protects from enemies",
      "Ensures respect and honor",
    ],
    process: [
      "Space purification",
      "Invocation of Jyestha deities",
      "Chanting of nakshatra mantras",
      "Offering of flowers and sweets",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Those born under Jyestha nakshatra seeking success",
    whenToPerform: "During Jyestha nakshatra or on birthday",
  },
  "ashwini-nakshatra": {
    name: "Ashwini Nakshatra Shanti Vidhan",
    subtitle: "Healer's Star Blessing",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Ashwini Nakshatra Shanti brings healing energy and protects those born under this nakshatra from health issues.",
    benefits: [
      "Brings healing energy",
      "Ensures good health",
      "Removes health obstacles",
      "Brings prosperity",
      "Ensures quick recovery",
      "Brings vitality and energy",
    ],
    process: [
      "Space purification",
      "Invocation of Ashwini deities",
      "Chanting of nakshatra mantras",
      "Offering of flowers and sweets",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Those born under Ashwini nakshatra facing health issues",
    whenToPerform: "During Ashwini nakshatra or on birthday",
  },
  "ashlesha-nakshatra": {
    name: "Ashlesha Nakshatra Shanti Vidhan",
    subtitle: "Serpent Star Pacification",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    price: "₹4,999",
    duration: "3 hours",
    description:
      "Ashlesha Nakshatra Shanti pacifies the effects of being born under Ashlesha nakshatra, bringing wisdom and spiritual growth.",
    benefits: [
      "Brings wisdom and knowledge",
      "Removes obstacles and enemies",
      "Ensures spiritual growth",
      "Brings intuitive powers",
      "Protects from negativity",
      "Brings prosperity through wisdom",
    ],
    process: [
      "Space purification",
      "Invocation of Ashlesha deities",
      "Chanting of nakshatra mantras",
      "Offering of flowers and sweets",
      "Aarti ritual",
      "Distribution of Prasad",
    ],
    bestFor: "Those born under Ashlesha nakshatra seeking spiritual growth",
    whenToPerform: "During Ashlesha nakshatra or on birthday",
  },
  "griha-pravesh": {
    name: "Griha Pravesh Puja",
    subtitle: "Auspicious House Warming",
    icon: <Home className="w-5 h-5 text-stone-500" />,
    price: "₹5,100",
    duration: "3-4 hours",
    description:
      "Griha Pravesh is an important Vedic ritual performed when entering a new home. This puja purifies the space, removes negative energies, and invites divine blessings for the household.",
    benefits: [
      "Purifies the new space",
      "Removes negative energies",
      "Brings peace and harmony",
      "Ensures family wellness",
      "Attracts prosperity",
      "Creates positive atmosphere",
    ],
    process: [
      "Purification of all rooms",
      "Invocation of deities",
      "Chanting of protective mantras",
      "Offerings in all directions",
      "Lighting lamps in corners",
      "Family blessings and Prasad",
    ],
    bestFor: "Anyone moving into a new house or apartment",
    whenToPerform:
      "Within first week of moving, preferably on an auspicious day",
  },
  "satyanarayan-katha": {
    name: "Satyanarayan Katha",
    subtitle: "Sacred Storytelling Ritual",
    icon: <BookOpen className="w-5 h-5 text-amber-700" />,
    price: "₹3,500",
    duration: "2-3 hours",
    description:
      "Satyanarayan Puja is a beloved household ritual where sacred stories of Lord Vishnu are narrated. This puja is performed for fulfillment of desires and removal of obstacles.",
    benefits: [
      "Fulfills sincere wishes",
      "Removes obstacles",
      "Brings peace and prosperity",
      "Strengthens family bonds",
      "Removes fears and anxieties",
      "Brings good fortune",
    ],
    process: [
      "Preparation and decoration",
      "Invocation of Lord Ganesha",
      "Narration of Satyanarayan Katha",
      "Offering of prasad (sweetened rice)",
      "Distribution of blessed rice to devotees",
      "Final blessings",
    ],
    bestFor:
      "Families seeking blessings, on special occasions, or for fulfilling wishes",
    whenToPerform: "Any day, preferably Thursday or during Full moon",
  },
};

const poojaMapping: Record<string, string> = {
  "Navagraha Shanti": "navagraha-shanti",
  "Surya Grah Shanti": "surya-grah-shanti",
  "Chandra Grah Shanti": "chandra-grah-shanti",
  "Mangal Grah Shanti": "mangal-grah-shanti",
  "Budh Grah Shanti": "budh-grah-shanti",
  "Guru Grah Shanti": "guru-grah-shanti",
  "Shukra Grah Shanti": "shukra-grah-shanti",
  "Shani Grah Shanti": "shani-grah-shanti",
  "Rahu Grah Shanti": "rahu-grah-shanti",
  "Ketu Grah Shanti": "ketu-grah-shanti",
  "Rudrabhishek Puja": "rudrabhishek",
  "Durga Saptashati Puja": "durga-saptashati",
  "Ganesh Puja": "ganesh-pooja",
  "Hanuman Puja": "hanuman-pooja",
  "Vishnu Puja": "vishnu-pooja",
  "Lakshmi Puja": "lakshmi-pooja",
  "Maha Mrityunjay Mantra Jap": "maha-mrityunjay",
  "Durga Navarna Mantra Jap": "durga-navarna",
  "Kaal Sarp Dosh Nivaran puja": "kaal-sarp-dosh",
  "Surya-Shani Shapit Dosh Shanti Vidhan": "surya-shani-dosh",
  "Surya-Rahu Grahan Dosh Shanti Vidhan": "surya-rahu-dosh",
  "Surya-Ketu Grahan Dosh Shanti Vidhan": "surya-ketu-dosh",
  "Surya-Mangal Angarak Dosh Shanti Vidhan": "surya-mangal-dosh",
  "Surya-Chandra Amavasya Dosh Shanti Vidhan":
    "surya-chandra-amavasya-dosh",
  "Shani-Rahu Shapit Dosh Shanti Vidhan": "shani-rahu-dosh",
  "Shani-Ketu Shapit Dosh Shanti Vidhan": "shani-ketu-dosh",
  "Shani-Chandra Vish Yog Shanti Vidhan": "shani-chandra-vish-yog-dosh",
  "Mangal-Rahu Angarak Dosh Shanti Vidhan": "mangal-rahu-dosh",
  "Mangal-Ketu Angarak Dosh Shanti Vidhan": "mangal-ketu-dosh",
  "Guru-Rahu Chandal Dosh Shanti Vidhan": "guru-rahu-dosh",
  "Guru-Ketu Chandal Dosh Shanti Vidhan": "guru-ketu-dosh",
  "Chandra-Rahu Grahan Dosh Shanti Vidhan": "chandra-rahu-dosh",
  "Chandra-Ketu Grahan Dosh Shanti Vidhan": "chandra-ketu-dosh",
  "Homatmak Laghu Rudra Puja": "laghu-rudra",
  "Ganesh Puja with Atharvarshisham Path (Laddu Havan)":
    "ganesh-atharvashirsha-laddu-havan",
  "Pathatmak Laghu rudra puja": "pathatmak-laghu-rudra",
  "Navchandi Yagna": "navchandi-yagna",
  "Revati Nakshatra Shanti Vidhan": "revati-nakshatra",
  "Mool Nakshatra Shanti Vidhan": "mool-nakshatra",
  "Magha Nakshatra Shanti Vidhan": "magha-nakshatra",
  "Jyestha Nakshatra Shanti Vidhan": "jyestha-nakshatra",
  "Ashwini Nakshatra Shanti Vidhan": "ashwini-nakshatra",
  "Ashlesha Nakshatra Shanti Vidhan": "ashlesha-nakshatra",
  "Griha Pravesh": "griha-pravesh",
  "Satyanarayan Katha": "satyanarayan-katha",
  "Maha Mrityunjay Mantra Jap with havan": "maha-mrityunjay-havan",
  "Durga Navarna Mantra Jap with havan": "durga-navarna-havan",
};

const getSuggestedPrice = (poojaType: string) => {
  const key = poojaMapping[poojaType] || poojaType.toLowerCase().replace(/\s+/g, "-");
  const detail = poojaDetails[key];
  if (detail && detail.price) {
    // Extract numbers from string like "₹4,999"
    const numeric = detail.price.replace(/[^0-9]/g, "");
    return numeric ? Number(numeric) : null;
  }
  return null;
};

const keyToFormValue: Record<string, string> = {
  "griha-pravesh": "Griha Pravesh",
  "satyanarayan-katha": "Satyanarayan Katha",
  rudrabhishek: "Rudrabhishek Puja",
  "navagraha-shanti": "Navagraha Shanti",
  "lakshmi-pooja": "Lakshmi Puja",
  "durga-saptashati": "Durga Saptashati Puja",
  "surya-grah-shanti": "Surya Grah Shanti",
  "chandra-grah-shanti": "Chandra Grah Shanti",
  "mangal-grah-shanti": "Mangal Grah Shanti",
  "budh-grah-shanti": "Budh Grah Shanti",
  "guru-grah-shanti": "Guru Grah Shanti",
  "shukra-grah-shanti": "Shukra Grah Shanti",
  "shani-grah-shanti": "Shani Grah Shanti",
  "rahu-grah-shanti": "Rahu Grah Shanti",
  "ketu-grah-shanti": "Ketu Grah Shanti",
  "maha-mrityunjay-havan": "Maha Mrityunjay Mantra Jap with havan",
  "durga-navarna-havan": "Durga Navarna Mantra Jap with havan",
  "ganesh-pooja": "Ganesh Puja",
  "hanuman-pooja": "Hanuman Puja",
  "vishnu-pooja": "Vishnu Puja",
  "maha-mrityunjay": "Maha Mrityunjay Mantra Jap",
  "durga-navarna": "Durga Navarna Mantra Jap",
  "kaal-sarp-dosh": "Kaal Sarp Dosh Nivaran puja",
  "surya-shani-dosh": "Surya-Shani Shapit Dosh Shanti Vidhan",
  "surya-rahu-dosh": "Surya-Rahu Grahan Dosh Shanti Vidhan",
  "surya-ketu-dosh": "Surya-Ketu Grahan Dosh Shanti Vidhan",
  "surya-mangal-dosh": "Surya-Mangal Angarak Dosh Shanti Vidhan",
  "surya-chandra-amavasya-dosh":
    "Surya-Chandra Amavasya Dosh Shanti Vidhan",
  "shani-rahu-dosh": "Shani-Rahu Shapit Dosh Shanti Vidhan",
  "shani-ketu-dosh": "Shani-Ketu Shapit Dosh Shanti Vidhan",
  "shani-chandra-vish-yog-dosh":
    "Shani-Chandra Vish Yog Shanti Vidhan",
  "mangal-rahu-dosh": "Mangal-Rahu Angarak Dosh Shanti Vidhan",
  "mangal-ketu-dosh": "Mangal-Ketu Angarak Dosh Shanti Vidhan",
  "guru-rahu-dosh": "Guru-Rahu Chandal Dosh Shanti Vidhan",
  "guru-ketu-dosh": "Guru-Ketu Chandal Dosh Shanti Vidhan",
  "chandra-rahu-dosh": "Chandra-Rahu Grahan Dosh Shanti Vidhan",
  "chandra-ketu-dosh": "Chandra-Ketu Grahan Dosh Shanti Vidhan",
  "laghu-rudra": "Homatmak Laghu Rudra Puja",
  "ganesh-atharvashirsha-laddu-havan":
    "Ganesh Puja with Atharvarshisham Path (Laddu Havan)",
  "pathatmak-laghu-rudra": "Pathatmak Laghu rudra puja",
  "navchandi-yagna": "Navchandi Yagna",
  "revati-nakshatra": "Revati Nakshatra Shanti Vidhan",
  "mool-nakshatra": "Mool Nakshatra Shanti Vidhan",
  "magha-nakshatra": "Magha Nakshatra Shanti Vidhan",
  "jyestha-nakshatra": "Jyestha Nakshatra Shanti Vidhan",
  "ashwini-nakshatra": "Ashwini Nakshatra Shanti Vidhan",
  "ashlesha-nakshatra": "Ashlesha Nakshatra Shanti Vidhan",
};

// ─── Toast Component ──────────────────────────────────────────────────────────
interface ToastState {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  loginTargetPage: Page;
  loginLabel: string;
  language: Lang;
  onLanguageChange: (lang: Lang) => void;
}

function Navbar({
  currentPage,
  onNavigate,
  loginTargetPage,
  loginLabel,
  language,
  onLanguageChange,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks: { label: string; page: Page; ocid: string }[] = [
    { label: t("navHome", language), page: "home", ocid: "nav.home.link" },
    {
      label: t("navCategories", language),
      page: "categories",
      ocid: "nav.categories.link",
    },
    {
      label: t("navSuccessStories", language),
      page: "success-stories",
      ocid: "nav.stories.link",
    },
    { label: t("navAbout", language), page: "about", ocid: "nav.about.link" },
    { label: t("navContact", language), page: "contact", ocid: "nav.contact.link" },
    { label: "Blog", page: "blog", ocid: "nav.blog.link" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass-nav ${isScrolled ? "shadow-nav border-b border-gold-200/60" : ""
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="flex items-center gap-3 group flex-shrink-0"
          >
            <img
              src="/assets/satkarm-logo-small.png"
              alt="SatkarmPuja logo"
              className="h-10 w-10 md:h-14 md:w-14 rounded-full object-cover border-2 border-gold-200/50 shadow-sm transition-transform group-hover:scale-105"
            />
            <div className="text-left">
              <h1 className="font-display text-sm md:text-lg font-bold text-maroon-600 leading-tight whitespace-nowrap overflow-hidden">
                SatkarmPuja
              </h1>
              <p className="text-xs text-gold-700 hidden sm:block font-body font-medium tracking-wide">
                Online Puja Service
              </p>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, page, ocid }) => (
              <button
                type="button"
                key={page}
                data-ocid={ocid}
                onClick={() => onNavigate(page)}
                className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all duration-200 ${currentPage === page
                  ? "nav-pill-active"
                  : "text-maroon-700 hover:text-saffron-600 hover:bg-saffron-50"
                  }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              data-ocid="nav.book.primary_button"
              onClick={() => onNavigate("book")}
              className="btn-primary ml-3 px-5 py-2.5 rounded-full text-sm shadow-card-warm"
            >
              {t("navBook", language)}
            </button>
            <button
              type="button"
              data-ocid="nav.login.button"
              onClick={() => onNavigate(loginTargetPage)}
              className="ml-2 px-5 py-2.5 rounded-full text-sm font-body font-semibold border border-gold-200/70 text-maroon-700 hover:bg-saffron-50 hover:text-saffron-700 transition-all shadow-sm"
            >
              {loginLabel}
            </button>
            <div className="ml-3">
              <label className="sr-only" htmlFor="language-select-desktop">
                Language
              </label>
              <select
                id="language-select-desktop"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Lang)}
                className="rounded-full bg-maroon-50 border border-gold-100 px-3 py-2 text-xs font-body font-semibold text-maroon-700 hover:bg-saffron-50 focus:outline-none focus:ring-2 focus:ring-saffron-300"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            data-ocid="nav.mobile.toggle"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2.5 rounded-xl hover:bg-saffron-100 text-maroon-600 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <title>Close menu</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <title>Open menu</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gold-100 mt-2 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ label, page, ocid }) => (
                <button
                  type="button"
                  key={page}
                  data-ocid={ocid}
                  onClick={() => {
                    onNavigate(page);
                    setMobileOpen(false);
                  }}
                  className={`px-4 py-3 rounded-xl text-left font-body font-medium transition ${currentPage === page
                    ? "bg-saffron-100 text-saffron-700"
                    : "text-maroon-700 hover:bg-saffron-50"
                    }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                data-ocid="nav.book.primary_button"
                onClick={() => {
                  onNavigate("book");
                  setMobileOpen(false);
                }}
                className="btn-primary mt-2 py-3 rounded-xl text-center"
              >
                {t("navBook", language)}
              </button>
              <button
                type="button"
                data-ocid="nav.login.button"
                onClick={() => {
                  onNavigate(loginTargetPage);
                  setMobileOpen(false);
                }}
                className="mt-2 py-3 rounded-xl text-center font-body font-semibold bg-white text-maroon-700 border border-gold-100 hover:bg-saffron-50 transition"
              >
                {loginLabel}
              </button>
              <div className="mt-2">
                <label className="sr-only" htmlFor="language-select-mobile">
                  Language
                </label>
                <select
                  id="language-select-mobile"
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as Lang)}
                  className="w-full rounded-xl bg-maroon-50 border border-gold-100 px-4 py-3 text-sm font-body font-semibold text-maroon-700 hover:bg-saffron-50 focus:outline-none focus:ring-2 focus:ring-saffron-300"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="gu">ગુજરાતી</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
interface FooterProps {
  config: Config;
  onNavigate: (page: Page, poojaKey?: string) => void;
  language: Lang;
}

function Footer({ config, onNavigate, language }: FooterProps) {
  const year = new Date().getFullYear();
  const [popularPoojas, setPopularPoojas] = useState<PopularPoojaCard[]>([]);

  const loadPopular = () => {
    apiFetch("/api/content/popularPoojas")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((body) => {
        if (body?.data && Array.isArray(body.data)) {
          setPopularPoojas(body.data);
        } else {
          setPopularPoojas([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch popular pujas:", err);
      });
  };

  useEffect(() => {
    loadPopular();

    const onContent = (e: Event) => {
      const detail = (e as any).detail;
      if (detail?.key === "popularPoojas") {
        loadPopular();
      }
    };
    window.addEventListener(CONTENT_EVENT_NAME, onContent);
    return () => {
      window.removeEventListener(CONTENT_EVENT_NAME, onContent);
    };
  }, []);
  return (
    <footer className="bg-maroon-800 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/satkarm-logo-small.png"
                alt="SatkarmPuja logo"
                className="w-12 h-12 rounded-full object-contain drop-shadow-md"
              />
              <h3 className="font-display text-xl font-bold text-gold-300">
                SatkarmPuja
              </h3>
            </div>
            <p className="text-gold-200/80 text-sm leading-relaxed font-body">
              {t("footerBrandDesc", language)}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-semibold mb-4 text-gold-400 text-sm tracking-wider uppercase">
              {t("footerQuickLinks", language)}
            </h4>
            <ul className="space-y-2">
              {(
                [
                  ["home", "footer.home.link", "navHome"],
                  ["categories", "footer.categories.link", "navCategories"],
                  ["success-stories", "footer.stories.link", "navSuccessStories"],
                  ["about", "footer.about.link", "navAbout"],
                  ["book", "footer.book.link", "navBook"],
                ] as [Page, string, keyof typeof TRANSLATIONS][]
              ).map(([page, ocid, labelKey]) => (
                <li key={page}>
                  <button
                    type="button"
                    data-ocid={ocid}
                    onClick={() => onNavigate(page)}
                    className="text-gold-100/70 hover:text-gold-300 transition text-sm font-body"
                  >
                    {t(labelKey, language)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular */}
          <div>
            <h4 className="font-body font-semibold mb-4 text-gold-400 text-sm tracking-wider uppercase">
              {t("footerPopularPoojas", language)}
            </h4>
            <ul className="space-y-2">
              {popularPoojas.slice(0, 4).map((p) => {
                const detail = p.poojaId ? poojaDetails[p.poojaId] : null;
                const poojaTransBase = p.poojaId ? `pooja_${p.poojaId.replace(/-/g, "_")}` : "";
                const displayTitle = detail ? (optT(`${poojaTransBase}_name` as any, language) || detail.name) : p.title;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (p.poojaId) onNavigate("pooja-detail", p.poojaId);
                        else onNavigate("book");
                      }}
                      className="text-gold-100/70 hover:text-gold-300 transition text-sm font-body text-left"
                    >
                      {displayTitle}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-semibold mb-4 text-gold-400 text-sm tracking-wider uppercase">
              {t("footerContactUs", language)}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gold-100/80 text-sm">
                <Phone className="w-5 h-5 inline-block text-gray-500" />
                <a href={`tel:${config.contact_phone}`} className="font-body hover:text-gold-300 transition-colors">
                  {config.contact_phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-gold-100/80 text-sm">
                <Mail className="w-5 h-5 inline-block text-gray-500" />
                <a href={`mailto:${config.contact_email}`} className="font-body hover:text-gold-300 transition-colors">
                  {config.contact_email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-gold-100/80 text-sm">
                <MapPin className="w-5 h-5 inline-block text-gray-500" />
                <span className="font-body">Ahmedabad, Gujarat, India</span>
              </li>
              <li className="pt-2">
                <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-2">Follow Us</p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.instagram.com/satkarmpuja"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gold-100/70 hover:text-pink-400 transition text-sm font-body"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                    Instagram
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61590174430707"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gold-100/70 hover:text-blue-400 transition text-sm font-body"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    Facebook
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gold-200/60 text-sm font-body">
          <p className="text-center md:text-left">
            © {year} SatkarmPuja. {t("footerCopyright", language)}
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              onClick={() => onNavigate("terms")}
              className="hover:text-gold-300 transition-colors text-xs font-semibold uppercase tracking-wider"
            >
              {language === "hi" ? "नियम और शर्तें" : language === "gu" ? "નિયમો અને શરતો" : "Terms & Conditions"}
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => onNavigate("privacy")}
              className="hover:text-gold-300 transition-colors text-xs font-semibold uppercase tracking-wider"
            >
              {language === "hi" ? "गोपनीयता नीति" : language === "gu" ? "ગોપનીયતા નીતિ" : "Privacy Policy"}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
interface HomePageProps {
  config: Config;
  onNavigate: (page: Page, poojaKey?: string) => void;
  language: Lang;
  poojaPrices?: Record<string, string>;
}

// Popular Pujas are now admin-managed (see Admin Panel) and stored in local storage.

const features = [
  {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    title: "Verified Pandits",
    desc: "All our pandits are thoroughly vetted for authenticity and expertise in Vedic traditions.",
  },
  {
    icon: <Sparkles className="w-5 h-5 text-saffron-500" />,
    title: "Sacred Traditions",
    desc: "Every ritual is performed with precise adherence to ancient Vedic scriptures and customs.",
  },
  {
    icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
    title: "Personal Consultation",
    desc: "Pre-pooja consultation to understand your needs and customize the ritual accordingly.",
  },
  {
    icon: <IndianRupee className="w-5 h-5 text-green-600" />,
    title: "Transparent Pricing",
    desc: "Clear pricing with no hidden costs. Know exactly what you're paying before booking.",
  },
];

const testimonials = [
  {
    name: "Rajesh Sharma",
    city: "New Delhi",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    quote:
      "The pandit explained every ritual with such devotion and clarity. Our family felt truly blessed. Highly recommended to everyone!",
    puja: "Griha Pravesh Puja",
    stars: 5,
  },
  {
    name: "Priya Patel",
    city: "Mumbai",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    quote:
      "Very professional service with transparent pricing. No surprises at all. The experience was deeply spiritual and moving.",
    puja: "Marriage Pujas",
    stars: 5,
  },
  {
    name: "Meera Singh",
    city: "Pune",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    quote:
      "Remarkable transformation after the rituals. My family's health and harmony have improved significantly. Very grateful!",
    puja: "Rudrabhishek & Mantra Jap",
    stars: 5,
  },
];

const faqItems: { qKey: keyof typeof TRANSLATIONS; aKey: keyof typeof TRANSLATIONS }[] = [
  { qKey: "faq1_q", aKey: "faq1_a" },
  { qKey: "faq2_q", aKey: "faq2_a" },
  { qKey: "faq3_q", aKey: "faq3_a" },
  { qKey: "faq4_q", aKey: "faq4_a" },
  { qKey: "faq5_q", aKey: "faq5_a" },
];

function HomePage({ config, onNavigate, language, poojaPrices }: HomePageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [popularCards, setPopularCards] = useState<PopularPoojaCard[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadPopular = () => {
    apiFetch("/api/content/popularPoojas")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((body) => {
        if (body?.data && Array.isArray(body.data)) {
          setPopularCards(body.data);
        } else {
          setPopularCards([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch popular pujas:", err);
      });
  };

  useEffect(() => {
    loadPopular();

    const onContent = (e: Event) => {
      const detail = (e as any).detail;
      if (detail?.key === "popularPoojas") {
        loadPopular();
      }
    };
    window.addEventListener(CONTENT_EVENT_NAME, onContent);
    return () => {
      window.removeEventListener(CONTENT_EVENT_NAME, onContent);
    };
  }, []);

  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-screen lg:min-h-0 lg:h-screen flex flex-col overflow-hidden"
        style={{
          backgroundImage: isMobile
            ? "url('/assets/generated/Mobile_VIew _Hero.webp')"
            : "url('/assets/generated/hero-temple.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Soft dark overlay so the image stays visible but text is readable */}
        <div className="absolute inset-0 bg-black/35 md:bg-black/25" />
        <div className="absolute top-0 left-0 w-full h-full om-pattern opacity-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-24 pb-4 lg:pb-6 w-full flex-1 flex items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-4 lg:mb-5">
              <span className="text-white text-sm font-body font-semibold tracking-wide flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-gold-300 fill-gold-300/30" /> {t("heroTagline", language)}
              </span>
            </div>


            <h1 className="font-display text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1] mb-3 lg:mb-4">
              {t("heroTitle", language) ?? config.hero_title}
            </h1>
            <p className="font-body text-base sm:text-lg lg:text-lg text-white/85 mb-6 lg:mb-8 leading-relaxed max-w-2xl">
              {t("heroSubtitle", language) ?? config.hero_subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-[380px] sm:max-w-none">
              <button
                type="button"
                data-ocid="hero.book.primary_button"
                onClick={() => onNavigate("book")}
                className="w-fit sm:w-auto btn-primary px-6 sm:px-8 py-2.5 sm:py-4 rounded-full text-xs sm:text-lg font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-glow-saffron"
              >
                <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="whitespace-nowrap">{t("heroBookCta", language)}</span>
              </button>
              <button
                type="button"
                data-ocid="hero.categories.secondary_button"
                onClick={() => onNavigate("categories")}
                className="w-fit sm:w-auto btn-outline-white px-6 sm:px-8 py-2.5 sm:py-4 rounded-full text-xs sm:text-lg font-bold flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="whitespace-nowrap">{t("heroExploreCta", language)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar - part of flex flow, always below content */}
        <div className="relative z-10 glass-card border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-3.5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
              {[
                { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-saffron-500" />, num: "2,500+", label: t("statsHappyFamilies", language) },
                { icon: <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-saffron-500" />, num: "5,000+", label: t("statsPoojasPerformed", language) },
                { icon: <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />, num: "4.9/5", label: t("statsAvgRating", language) },
                { icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-saffron-500" />, num: "99%", label: t("statsSatisfaction", language) },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 sm:gap-4 group">
                  <div className="flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                    {s.icon}
                  </div>
                  <div>
                    <p className="font-display text-base sm:text-xl font-bold text-maroon-700 leading-none">
                      {s.num}
                    </p>
                    <p className="font-body text-[10px] sm:text-xs text-maroon-500 mt-0.5 sm:mt-1">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Pujas (admin-managed) */}
      {popularCards.length ? (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="section-heading-accent">
                {t("homeOurServices", language)}
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-maroon-600 mt-3 mb-4">
                {t("homePopularHeading", language)}
              </h2>
              <div className="lotus-divider mx-auto mb-4 max-w-[120px]" />
              <p className="font-body text-muted-foreground max-w-xl mx-auto">
                {t("homePopularSubtext", language)}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {popularCards.map((card, i) => {
                const detail = card.poojaId ? poojaDetails[card.poojaId] : null;
                const poojaTransBase = card.poojaId ? `pooja_${card.poojaId.replace(/-/g, "_")}` : "";
                const displayTitle = detail ? (optT(`${poojaTransBase}_name` as any, language) || detail.name) : card.title;
                const displayDesc = detail ? (optT(`${poojaTransBase}_description` as any, language) || detail.description) : card.description;
                const displayPrice = detail ? (poojaPrices?.[card.poojaId!] || optT(detail.price as any, language) || detail.price) : card.price;
                const displayIcon = <IconRenderer icon={detail ? detail.icon : (card.icon || "🙏")} className="text-saffron-500" />;

                return (
                  <div
                    key={card.id}
                    className="card-hover-lift bg-white rounded-2xl overflow-hidden shadow-card-warm border border-gold-100 flex flex-col"
                  >
                    <div className="h-1.5 gradient-saffron" />
                    {card.image ? (
                      <div className="h-40 w-full overflow-hidden">
                        <img
                          src={card.image}
                          alt={displayTitle}
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : null}
                    <div className="p-7 flex flex-col flex-1">
                      {card.poojaId && poojaImages[card.poojaId] ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden mb-5 shadow-sm border border-gold-100 bg-saffron-50">
                          <img
                            src={poojaImages[card.poojaId]}
                            alt={displayTitle || "Puja icon"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-saffron-50 to-gold-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-gold-100">
                          <span className="text-3xl">{displayIcon}</span>
                        </div>
                      )}
                      <h3 className="font-display text-lg font-semibold text-maroon-600 mb-2">
                        {displayTitle}
                      </h3>
                      <p className="font-body text-muted-foreground text-sm mb-5 leading-relaxed line-clamp-3">
                        {displayDesc}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-body text-sm font-semibold text-gold-700 bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
                          {displayPrice}
                        </span>
                        <button
                          type="button"
                          data-ocid={`services.book.button.${i + 1}`}
                          onClick={() => {
                            if (card.poojaId) onNavigate("pooja-detail", card.poojaId);
                            else onNavigate("book");
                          }}
                          className="font-body text-sm font-semibold text-saffron-600 hover:text-saffron-700 transition flex items-center gap-1"
                        >
                          {t("ctaBookNow", language)} <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Why Choose Us */}
      <section className="py-24 relative overflow-hidden bg-saffron-50 om-pattern">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5" style={{ background: "oklch(0.66 0.20 53 / 0.12)", color: "oklch(0.57 0.20 50)", border: "1px solid oklch(0.66 0.20 53 / 0.3)" }}>
              <Sparkles className="w-3.5 h-3.5" />
              {t("homeWhyChooseUs", language)}
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-maroon-600 mt-2 mb-5 leading-tight">
              {t("homeWhyHeading", language)}
            </h2>
            <p className="font-body text-muted-foreground max-w-xl mx-auto text-base">
              Centuries of Vedic wisdom, delivered with modern trust and transparency.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 bg-white shadow-sm"
                style={{ border: "1px solid oklch(0.88 0.04 75)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = "1px solid oklch(0.66 0.20 53 / 0.5)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px oklch(0.66 0.20 53 / 0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = "1px solid oklch(0.88 0.04 75)"; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
              >
                {/* Step number */}
                <span className="absolute top-5 right-6 font-display text-5xl font-bold select-none" style={{ color: "oklch(0.66 0.20 53 / 0.1)" }}>
                  0{i + 1}
                </span>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg" style={{ background: "linear-gradient(135deg, oklch(0.66 0.20 53) 0%, oklch(0.57 0.20 50) 100%)" }}>
                  <span className="text-white [&>svg]:w-6 [&>svg]:h-6 [&>svg]:text-white">{f.icon}</span>
                </div>

                {/* Accent line */}
                <div className="w-8 h-0.5 mb-4 rounded-full" style={{ background: "oklch(0.82 0.14 78)" }} />

                <h3 className="font-display text-lg font-bold text-maroon-600 mb-3">
                  {(() => {
                    switch (f.title) {
                      case "Verified Pandits": return t("feature_verified_title", language);
                      case "Sacred Traditions": return t("feature_traditions_title", language);
                      case "Personal Consultation": return t("feature_consult_title", language);
                      case "Transparent Pricing": return t("feature_pricing_title", language);
                      default: return f.title;
                    }
                  })()}
                </h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">
                  {(() => {
                    switch (f.title) {
                      case "Verified Pandits": return t("feature_verified_desc", language);
                      case "Sacred Traditions": return t("feature_traditions_desc", language);
                      case "Personal Consultation": return t("feature_consult_desc", language);
                      case "Transparent Pricing": return t("feature_pricing_desc", language);
                      default: return f.desc;
                    }
                  })()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Secondary Image Section */}
      <section className="py-0 relative overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div
            className="h-72 md:h-full min-h-80 relative"
            style={{
              backgroundImage:
                "url('/assets/generated/pooja-ceremony.dim_800x600.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-maroon-900/30" />
          </div>
          <div className="gradient-maroon text-white p-12 md:p-16 flex flex-col justify-center">
            <span className="section-heading-accent text-gold-400 mb-4 block">
              {t("homeSacredExperienceTag", language)}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 text-white leading-snug">
              {t("homeSacredExperienceTitle", language)}
            </h2>
            <p className="font-body text-white/80 leading-relaxed mb-8">
              {t("homeSacredExperienceText", language)}
            </p>
            <button
              type="button"
              onClick={() => onNavigate("contact")}
              className="btn-outline-white px-7 py-3.5 rounded-full w-fit text-sm font-body"
            >
              {t("homeScheduleConsultation", language)}
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="section-heading-accent">
              {t("homeTestimonialsTag", language)}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-maroon-600 mt-3 mb-4">
              {t("homeTestimonialsTitle", language)}
            </h2>
            <div className="lotus-divider mx-auto max-w-[120px]" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-saffron-50 rounded-2xl p-7 shadow-card-warm border border-gold-100 relative"
              >
                <div className="decorative-quote absolute top-4 left-5">"</div>
                <div className="flex gap-0.5 mb-4 mt-2">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={`${t.name}-star-${i}`} fill="currentColor" className="w-3 h-3 text-yellow-500 inline-block" />
                  ))}
                </div>
                <p className="font-body text-maroon-700 text-sm leading-relaxed mb-6 relative z-10">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover gold-ring"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.background =
                        "linear-gradient(135deg, oklch(0.66 0.20 53), oklch(0.62 0.12 68))";
                    }}
                  />
                  <div>
                    <p className="font-display font-semibold text-maroon-700 text-sm">
                      {t.name}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {t.city}
                    </p>
                  </div>
                  <span className="ml-auto bg-saffron-100 text-saffron-700 text-xs font-body px-2.5 py-1 rounded-full border border-saffron-200">
                    <HeartHandshake className="w-4 h-4 inline-block mr-1 text-saffron-500" /> {t.puja}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Questions / FAQ */}
      <section className="py-20 bg-saffron-50 om-pattern">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="section-heading-accent">
              {t("faqSectionTag", language)}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-maroon-600 mt-3 mb-4">
              {t("faqSectionTitle", language)}
            </h2>
            <div className="lotus-divider mx-auto max-w-[120px]" />
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div
                key={item.qKey}
                className="bg-white rounded-2xl shadow-card-warm border border-gold-100 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-saffron-50/50 transition-colors"
                >
                  <span className="font-display font-semibold text-maroon-700 text-base">
                    {t(item.qKey, language)}
                  </span>
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-maroon-600 transition-transform duration-200 ${openFaq === idx ? "rotate-180" : ""
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${openFaq === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                >
                  <div className="overflow-hidden">
                    <p className="font-body text-muted-foreground text-sm md:text-base leading-relaxed px-6 pb-5 pt-0 border-t border-gold-100">
                      {t(item.aKey, language)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="gradient-saffron py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartHandshake className="w-8 h-8 inline-block text-saffron-500" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            {t("homeCtaTitle", language)}
          </h2>
          <p className="font-body text-white/85 text-lg mb-8">
            {t("homeCtaText", language)}
          </p>
          <button
            type="button"
            data-ocid="cta.book.primary_button"
            onClick={() => onNavigate("book")}
            className="bg-white text-saffron-600 font-body font-semibold px-10 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            {t("homeBookPoojaNow", language)}
          </button>
        </div>
      </section>
    </>
  );
}

// ─── Categories Page ──────────────────────────────────────────────────────────
interface CategoriesPageProps {
  onNavigate: (page: Page, poojaKey?: string) => void;
  language: Lang;
  poojaPrices?: Record<string, string>;
}

const poojaImages: Record<string, string> = {
  "navagraha-shanti": "/assets/poojas/navagraha_shanti_new.webp",
  "surya-grah-shanti": "/assets/poojas/pooja-surya-grah.webp",
  "chandra-grah-shanti": "/assets/poojas/chandra_grah.webp",
  "mangal-grah-shanti": "/assets/poojas/pooja-mangal-grah.webp",
  "budh-grah-shanti": "/assets/poojas/budh_grah.webp",
  "guru-grah-shanti": "/assets/poojas/Guru.webp",
  "shukra-grah-shanti": "/assets/poojas/Shukr.webp",
  "shani-grah-shanti": "/assets/poojas/Shani.webp",
  "rahu-grah-shanti": "/assets/poojas/Rahu.webp",
  "ketu-grah-shanti": "/assets/poojas/Ketu.webp",
  "rudrabhishek": "/assets/poojas/Rudrabhishek.webp",
  "durga-saptashati": "/assets/poojas/Durga.webp",
  "ganesh-pooja": "/assets/poojas/Ganesh.webp",
  "hanuman-pooja": "/assets/poojas/Hanuman.webp",
  "vishnu-pooja": "/assets/poojas/Vishnu.webp",
  "lakshmi-pooja": "/assets/poojas/Laxshmi.webp",
  "maha-mrityunjay": "/assets/poojas/Rudrabhishek.webp",
  "maha-mrityunjay-havan": "/assets/poojas/Rudrabhisek_havan.webp",
  "durga-navarna": "/assets/poojas/Durga.webp",
  "durga-navarna-havan": "/assets/poojas/Durga_puja_havan.webp",
  "kaal-sarp-dosh": "/assets/poojas/kal_sarp_dosh.webp",
  "surya-shani-dosh": "/assets/poojas/sury-shani.webp",
  "surya-rahu-dosh": "/assets/poojas/sury-rahu.webp",
  "surya-ketu-dosh": "/assets/poojas/sury-ketu.webp",
  "surya-mangal-dosh": "/assets/poojas/sury-mangal.webp",
  "surya-chandra-amavasya-dosh": "/assets/poojas/sury-chandr.webp",
  "shani-rahu-dosh": "/assets/poojas/shani-rahu.webp",
  "shani-ketu-dosh": "/assets/poojas/shani-ketu.webp",
  "shani-chandra-vish-yog-dosh": "/assets/poojas/shani-chandr.webp",
  "mangal-rahu-dosh": "/assets/poojas/mangal-rahu.webp",
  "mangal-ketu-dosh": "/assets/poojas/mangal-ketu.webp",
  "guru-rahu-dosh": "/assets/poojas/guru-rahu.webp",
  "guru-ketu-dosh": "/assets/poojas/guru-ketu.webp",
  "chandra-rahu-dosh": "/assets/poojas/chandr-rahu.webp",
  "chandra-ketu-dosh": "/assets/poojas/Chandr-ketu.webp",
  "laghu-rudra": "/assets/poojas/lagurudr.webp",
  "ganesh-atharvashirsha-laddu-havan": "/assets/poojas/Ganesh.webp",
  "pathatmak-laghu-rudra": "/assets/poojas/lagurudr.webp",
  "navchandi-yagna": "/assets/poojas/Navchandi.webp",
  "revati-nakshatra": "/assets/poojas/revati-nakshatra.webp",
  "mool-nakshatra": "/assets/poojas/moola-nakshatra.webp",
  "magha-nakshatra": "/assets/poojas/magha-nakshatra.webp",
  "jyestha-nakshatra": "/assets/poojas/jyestha-nakshatra.webp",
  "ashwini-nakshatra": "/assets/poojas/ashwini-nakshatra.webp",
  "ashlesha-nakshatra": "/assets/poojas/Ashlesh-nakshatra.webp",
  "griha-pravesh": "/assets/poojas/dev_pooja.webp",
  "satyanarayan-katha": "/assets/poojas/dev_pooja.webp",
};

const categories = [
  {
    id: "graha" as const,
    image: "/assets/generated/category-graha-shanti.dim_800x500.jpg",
    icon: <Globe className="w-5 h-5 text-indigo-500" />,
    pujas: [
      "Navagraha Shanti",
      "Surya Grah Shanti",
      "Chandra Grah Shanti",
      "Mangal Grah Shanti",
      "Budh Grah Shanti",
      "Guru Grah Shanti",
      "Shukra Grah Shanti",
      "Shani Grah Shanti",
      "Rahu Grah Shanti",
      "Ketu Grah Shanti",
    ],
  },
  {
    id: "dev" as const,
    image: "/assets/generated/category-dev-pooja.dim_800x500.jpg",
    icon: <Sparkles className="w-5 h-5 text-saffron-500" />,
    pujas: [
      "Rudrabhishek Puja",
      "Durga Saptashati Puja",
      "Ganesh Puja",
      "Hanuman Puja",
      "Vishnu Puja",
      "Lakshmi Puja",
      "Maha Mrityunjay Mantra Jap",
      "Durga Navarna Mantra Jap",
      "Maha Mrityunjay Mantra Jap with havan",
      "Durga Navarna Mantra Jap with havan",
    ],
  },
  {
    id: "dosh" as const,
    image: "/assets/generated/category-dosh-nivaran.dim_800x500.jpg",
    icon: "⚡",
    pujas: [
      "Surya-Shani Shapit Dosh Shanti Vidhan",
      "Surya-Rahu Grahan Dosh Shanti Vidhan",
      "Surya-Ketu Grahan Dosh Shanti Vidhan",
      "Surya-Mangal Angarak Dosh Shanti Vidhan",
      "Surya-Chandra Amavasya Dosh Shanti Vidhan",
      "Shani-Rahu Shapit Dosh Shanti Vidhan",
      "Shani-Ketu Shapit Dosh Shanti Vidhan",
      "Shani-Chandra Vish Yog Shanti Vidhan",
      "Mangal-Rahu Angarak Dosh Shanti Vidhan",
      "Mangal-Ketu Angarak Dosh Shanti Vidhan",
      "Guru-Rahu Chandal Dosh Shanti Vidhan",
      "Guru-Ketu Chandal Dosh Shanti Vidhan",
      "Chandra-Rahu Grahan Dosh Shanti Vidhan",
      "Chandra-Ketu Grahan Dosh Shanti Vidhan",
      "Kaal Sarp Dosh Nivaran puja",
      "Homatmak Laghu Rudra Puja",
      "Pathatmak Laghu rudra puja",
      "Ganesh Puja with Atharvarshisham Path (Laddu Havan)",
      "Navchandi Yagna",
    ],
  },
  {
    id: "nakshatra" as const,
    image: "/assets/generated/category-nakshatra-shanti.dim_800x500.jpg",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    pujas: [
      "Revati Nakshatra Shanti Vidhan",
      "Mool Nakshatra Shanti Vidhan",
      "Magha Nakshatra Shanti Vidhan",
      "Jyestha Nakshatra Shanti Vidhan",
      "Ashwini Nakshatra Shanti Vidhan",
      "Ashlesha Nakshatra Shanti Vidhan",
    ],
  },
];

function CategoriesPage({ onNavigate, language, poojaPrices }: CategoriesPageProps) {
  return (
    <>
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-white/70 font-body font-medium text-sm tracking-wider uppercase block mb-3">
            {t("catOurOfferings", language)}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {t("catPoojaCategories", language)}
          </h1>
          <p className="font-body text-white/85 text-lg max-w-xl mx-auto">
            {t("catSubtitle", language)}
          </p>
        </div>
      </section>

      <section className="py-16 om-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {categories.map((cat, catIdx) => (
              <div
                key={cat.id}
                data-ocid={`categories.item.${catIdx + 1}`}
                className="bg-white rounded-3xl shadow-card-warm overflow-hidden border border-gold-100"
              >
                <div className="grid md:grid-cols-2">
                  {/* Image Side */}
                  <div className="relative h-56 sm:h-64 md:h-full md:min-h-[360px] overflow-hidden">
                    <img
                      src={cat.image}
                      alt={t(`cat_${cat.id}_name` as keyof typeof TRANSLATIONS, language)}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.background =
                          "linear-gradient(135deg, oklch(0.66 0.20 53), oklch(0.62 0.12 68))";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-maroon-900/50 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <span className="font-body text-xs text-white/80 tracking-wider uppercase bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                        {t(`cat_${cat.id}_subtitle` as keyof typeof TRANSLATIONS, language)}
                      </span>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="p-8 md:p-10 flex flex-col">
                    <div className="mb-6">
                      <span className="section-heading-accent block mb-2">
                        {t(`cat_${cat.id}_subtitle` as keyof typeof TRANSLATIONS, language)}
                      </span>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-maroon-600 mb-3">
                        {t(`cat_${cat.id}_name` as keyof typeof TRANSLATIONS, language)}
                      </h2>
                      <p className="font-body text-muted-foreground leading-relaxed">
                        {t(`cat_${cat.id}_desc` as keyof typeof TRANSLATIONS, language)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 flex-1 max-h-44 overflow-y-auto pr-1">
                      {cat.pujas.map((poojaName) => {
                        const key =
                          poojaMapping[poojaName] ||
                          poojaName.toLowerCase().replace(/\s+/g, "-");
                        const hasDetail = !!poojaDetails[key];
                        const price = poojaPrices?.[key] || poojaDetails[key]?.price;
                        const nameKey = ("pooja_" + key.replace(/-/g, "_") + "_name") as keyof typeof TRANSLATIONS;
                        const displayName = (TRANSLATIONS[nameKey] ? t(nameKey, language) : null) ?? poojaName;
                        return (
                          <button
                            type="button"
                            key={poojaName}
                            onClick={() => {
                              if (hasDetail) {
                                onNavigate("pooja-detail", key);
                              } else {
                                onNavigate("book");
                              }
                            }}
                            className="flex items-center gap-3 bg-saffron-50 hover:bg-saffron-100 border border-saffron-100 hover:border-saffron-200 p-2.5 rounded-xl transition-all cursor-pointer text-left group"
                          >
                            <div className="flex flex-col">
                              <span className="font-body text-sm text-maroon-600 font-medium leading-tight">
                                {displayName}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate("book")}
                      className="btn-primary px-6 py-3 rounded-xl w-fit flex items-center gap-2 text-sm"
                    >
                      <ClipboardEdit className="w-4 h-4 inline-block mr-2" /> {t("catBookNow", language)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Success Stories Page ─────────────────────────────────────────────────────
interface SuccessStoriesPageProps {
  onNavigate: (page: Page) => void;
  language: Lang;
}

const allStories = [
  {
    name: "Rajesh Sharma",
    city: "Delhi",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    story:
      "The pandit explained every ritual beautifully and with such devotion. Highly recommended!",
    puja: "Griha Pravesh Puja",
    rating: 5,
  },
  {
    name: "Priya Patel",
    city: "Mumbai",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    story:
      "Very professional service. No surprises with transparent pricing. We felt spiritually elevated.",
    puja: "Marriage Pujas",
    rating: 5,
  },
  {
    name: "Amit Verma",
    city: "Bangalore",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    story:
      "Excellent experience. The pandit was punctual and deeply knowledgeable about all traditions.",
    puja: "Satyanarayan Katha",
    rating: 5,
  },
  {
    name: "Meera Singh",
    city: "Pune",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    story:
      "Remarkable health improvement after the rituals. Our family is truly grateful for this service.",
    puja: "Rudrabhishek & Mantra Jap",
    rating: 5,
  },
  {
    name: "Vikram Gupta",
    city: "Kolkata",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    story:
      "Got promoted after Budh Grah Shanti puja. The timing and ritual were perfect!",
    puja: "Budh Grah Shanti",
    rating: 5,
  },
  {
    name: "Ananya Verma",
    city: "Hyderabad",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    story:
      "Spiritual awakening and prosperity beyond expectations. Truly life-changing experience!",
    puja: "Lakshmi Puja",
    rating: 5,
  },
];

function SuccessStoriesPage({ onNavigate, language }: SuccessStoriesPageProps) {
  const [approved, setApproved] = useState<
    {
      id: string;
      name: string;
      city: string;
      puja: string;
      story: string;
      rating: number;
    }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/api/stories/public");
        if (!res.ok) return;
        const data = (await res.json()) as any[];
        setApproved(
          (data || []).map((s) => ({
            id: s.id,
            name: s.name,
            city: s.city,
            puja: s.puja,
            story: s.story,
            rating: s.rating ?? 5,
          })),
        );
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const storiesToShow = [...approved, ...allStories];

  return (
    <>
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-white/70 font-body font-medium text-sm tracking-wider uppercase block mb-3">
            {t("successRealDevotees", language)}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            <Sparkles className="w-8 h-8 inline-block mr-3 text-saffron-600" /> {t("successTitle", language)}
          </h1>
          <p className="font-body text-white/85 text-lg">
            {t("successSubtitle", language)}
          </p>
        </div>
      </section>

      <section className="py-16 om-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 mb-14">
            {storiesToShow.map((s) => (
              <div
                key={(s as any).id ?? s.name + s.city}
                className="bg-white rounded-2xl shadow-card-warm overflow-hidden border border-gold-100 flex flex-col"
              >
                {/* Avatar + header */}
                <div className="relative h-48 overflow-hidden bg-white flex items-center justify-center border-b border-gold-100">
                  <img src="/assets/satkarm-logo2.webp" alt="SatkarmPuja Logo" className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-saffron-500 text-white px-3 py-1 rounded-full text-xs font-body font-medium shadow-sm z-10">
                    <Sparkles className="w-4 h-4 inline-block mr-2 text-saffron-500" /> {t("successBlessedJourney", language)}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-3">
                    <p className="font-display font-bold text-maroon-800 text-xl leading-tight">
                      {s.name}
                    </p>
                    <p className="font-body text-maroon-600/80 text-sm mt-0.5">{s.city}</p>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: s.rating }).map((_, i) => (
                      <Star key={`${s.name}-star-${i}`} fill="currentColor" className="w-3 h-3 text-yellow-500 inline-block" />
                    ))}
                  </div>
                  <div className="decorative-quote text-4xl leading-none mb-1">
                    "
                  </div>
                  <p className="font-body text-maroon-700 text-sm leading-relaxed mb-5 flex-1">
                    {s.story}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="bg-saffron-50 text-saffron-700 px-3 py-1 rounded-full text-xs font-body font-medium border border-saffron-100">
                      <HeartHandshake className="w-4 h-4 inline-block mr-1 text-saffron-500" /> {s.puja}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate("book")}
                      className="font-body text-saffron-600 font-semibold text-sm hover:text-saffron-700 transition"
                    >
                      {t("successBookLink", language)} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="gradient-maroon rounded-3xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { icon: <Users className="w-8 h-8 text-saffron-500" />, number: "2,500+", labelKey: "statsHappyFamilies" as const },
                { icon: <HeartHandshake className="w-8 h-8 text-saffron-500" />, number: "5,000+", labelKey: "statsPoojasPerformed" as const },
                { icon: <Star className="w-8 h-8 text-yellow-500" />, number: "4.9/5", labelKey: "statsAvgRating" as const },
                { icon: <Trophy className="w-8 h-8 text-saffron-500" />, number: "99%", labelKey: "statsSatisfaction" as const },
              ].map((st) => (
                <div key={st.labelKey} className="flex flex-col items-center">
                  <div className="mb-4 bg-white/10 p-4 rounded-2xl ring-1 ring-white/20">
                    {st.icon}
                  </div>
                  <p className="font-display text-3xl font-bold mb-2 text-gold-300">
                    {st.number}
                  </p>
                  <p className="font-body text-gold-100/70 text-sm">
                    {t(st.labelKey, language)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="gradient-saffron py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            {t("successStoryAwaits", language)}
          </h2>
          <p className="font-body text-white/85 mb-8">
            {t("successJoinThousands", language)}
          </p>
          <button
            type="button"
            onClick={() => onNavigate("book")}
            className="bg-white text-saffron-600 font-body font-semibold px-10 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {t("ctaStartJourney", language)}
          </button>
        </div>
      </section>
    </>
  );
}

// ─── Book Page ────────────────────────────────────────────────────────────────
interface BookPageProps {
  onNavigate: (page: Page) => void;
  preSelectedPooja: string;
  preSelectedCategory?: string;
  bookings: BookingData[];
  auth: AuthState;
  language: Lang;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

function BookPage({
  preSelectedPooja,
  preSelectedCategory,
  bookings,
  auth,
  language,
  showToast,
  onNavigate,
}: BookPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPooja, setSelectedPooja] = useState(preSelectedPooja);
  const [selectedCategory, setSelectedCategory] = useState<string>(preSelectedCategory || "");
  const formRef = useRef<HTMLFormElement>(null);

  // Controlled form fields – pre-filled from logged-in user profile
  const [formName, setFormName] = useState(auth?.user?.fullName || "");
  const [formPhone, setFormPhone] = useState(auth?.user?.phone || "");
  const [formEmail, setFormEmail] = useState(auth?.user?.email || "");
  const [formCity, setFormCity] = useState(auth?.user?.city || "");
  const isAutoFilled = !!(auth?.user?.fullName || auth?.user?.email);

  useEffect(() => {
    setSelectedPooja(preSelectedPooja);
    setSelectedCategory(preSelectedCategory || "");
  }, [preSelectedPooja, preSelectedCategory]);

  // Re-fill when user logs in after landing on the page
  useEffect(() => {
    if (auth?.user) {
      setFormName((prev) => prev || auth.user!.fullName || "");
      setFormPhone((prev) => prev || auth.user!.phone || "");
      setFormEmail((prev) => prev || auth.user!.email || "");
      setFormCity((prev) => prev || auth.user!.city || "");
    }
  }, [auth?.user]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isSubmitting) return;

      if (auth.loading) {
        showToast("Initializing session, please wait...", "info");
        return;
      }

      if (bookings.length >= 999) {
        showToast("Maximum booking limit reached. Please contact us directly.", "error");
        return;
      }

      const form = e.currentTarget;
      setIsSubmitting(true);

      const formData: BookingData = {
        type: "booking",
        name: formName,
        phone: formPhone,
        email: formEmail,
        pooja_type: selectedPooja,
        city: formCity,
        message:
          (form.querySelector("#message") as HTMLTextAreaElement).value || "",
        status: "pending",
        created_at: new Date().toISOString(),
        userId: auth?.user?.id || null,
      };

      try {
        const res = await apiFetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          showToast(t("bookSuccessMessage", language), "success");
          setIsSuccess(true);
          form.reset();
        } else {
          showToast(t("bookSubmitError", language), "error");
        }
      } catch {
        showToast(t("bookSubmitError", language), "error");
      }

      setIsSubmitting(false);
    },
    [isSubmitting, bookings.length, auth.loading, auth.token, language, showToast]
  );

  const poojaOptions = [
    "Griha Pravesh",
    "Satyanarayan Katha",
    "Rudrabhishek Puja",
    "Navagraha Shanti",
    "Lakshmi Puja",
    "Durga Saptashati Puja",
    "Surya Grah Shanti",
    "Chandra Grah Shanti",
    "Mangal Grah Shanti",
    "Budh Grah Shanti",
    "Guru Grah Shanti",
    "Shukra Grah Shanti",
    "Shani Grah Shanti",
    "Rahu Grah Shanti",
    "Ketu Grah Shanti",
    "Ganesh Puja",
    "Hanuman Puja",
    "Vishnu Puja",
    "Maha Mrityunjay Mantra Jap",
    "Durga Navarna Mantra Jap",
    "Kaal Sarp Dosh Nivaran puja",
    "Surya-Shani Shapit Dosh Shanti Vidhan",
    "Shani-Rahu Shapit Dosh Shanti Vidhan",
    "Mangal-Rahu Angarak Dosh Shanti Vidhan",
    "Guru-Rahu Chandal Dosh Shanti Vidhan",
    "Chandra-Rahu Grahan Dosh Shanti Vidhan",
    "Homatmak Laghu Rudra Puja",
    "Navchandi Yagna",
    "Revati Nakshatra Shanti Vidhan",
    "Mool Nakshatra Shanti Vidhan",
    "Magha Nakshatra Shanti Vidhan",
    "Jyestha Nakshatra Shanti Vidhan",
    "Ashwini Nakshatra Shanti Vidhan",
    "Ashlesha Nakshatra Shanti Vidhan",
    "Other",
  ];

  const filteredPoojaOptions = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.pujas || []
    : poojaOptions;

  return (
    <>
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-white/70 font-body font-medium text-sm tracking-wider uppercase block mb-3">
            {t("bookSacredBooking", language)}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            <Target className="w-6 h-6 inline-block mr-3 text-saffron-500" /> {t("bookYourPooja", language)}
          </h1>
          <p className="font-body text-white/85 text-lg">
            {t("bookFormSubtext", language)}
          </p>
        </div>
      </section>

      <section className="py-16 om-pattern">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-card-warm-hover overflow-hidden border border-gold-100">
            <div className="h-1.5 gradient-saffron" />
            <div className="p-8 md:p-10">
              {isSuccess ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-maroon-600 mb-4">
                    {t("bookSuccessTitle", language) || "Thank You!"}
                  </h2>
                  <p className="font-body text-maroon-700/80 mb-8 text-lg">
                    {t("bookSuccessMessage", language) || "Your booking inquiry has been received. Our team will contact you shortly."}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("dashboard")}
                    className="btn-primary px-8 py-3 rounded-full text-sm font-semibold"
                  >
                    {t("dashBackToDashboard", language) || "Go to Dashboard"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-bold text-maroon-600 mb-2">
                      {t("bookFormTitle", language)}
                    </h2>
                    <p className="font-body text-muted-foreground text-sm">
                      {t("bookFormRequired", language)}
                    </p>
                  </div>

                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">

                    {/* Auto-fill notice */}
                    {isAutoFilled && (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-saffron-50 border border-saffron-200 text-saffron-800 text-xs font-body">
                        <span className="text-base">✨</span>
                        <span>Fields auto-filled from your profile. You can edit them if needed.</span>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          className="block font-body text-sm font-semibold text-maroon-600 mb-2"
                          htmlFor="name"
                        >
                          {t("bookLabelName", language)}
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          data-ocid="booking.name.input"
                          placeholder={t("bookPlaceholderName", language)}
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-4 py-3 border border-gold-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-saffron-400 focus:border-transparent outline-none transition bg-gold-50/30"
                        />
                      </div>
                      <div>
                        <label
                          className="block font-body text-sm font-semibold text-maroon-600 mb-2"
                          htmlFor="phone"
                        >
                          {t("bookLabelPhone", language)}
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          required
                          data-ocid="booking.phone.input"
                          placeholder={t("bookPlaceholderPhone", language)}
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-gold-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-saffron-400 focus:border-transparent outline-none transition bg-gold-50/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="block font-body text-sm font-semibold text-maroon-600 mb-2"
                        htmlFor="email"
                      >
                        {t("bookLabelEmail", language)}
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        data-ocid="booking.email.input"
                        placeholder={t("bookPlaceholderEmail", language)}
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gold-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-saffron-400 focus:border-transparent outline-none transition bg-gold-50/30"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          className="block font-body text-sm font-semibold text-maroon-600 mb-2"
                          htmlFor="pooja_category"
                        >
                          {t("bookLabelPoojaCategory", language)}
                        </label>
                        <select
                          id="pooja_category"
                          data-ocid="booking.pooja_category.select"
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setSelectedPooja(""); // Reset puja when category changes
                          }}
                          className="w-full px-4 py-3 border border-gold-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-saffron-400 focus:border-transparent outline-none transition bg-gold-50/30 appearance-none cursor-pointer"
                        >
                          <option value="">{t("bookPlaceholderCategory", language)}</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {t(`cat_${cat.id}_name` as keyof typeof TRANSLATIONS, language)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          className="block font-body text-sm font-semibold text-maroon-600 mb-2"
                          htmlFor="pooja_type"
                        >
                          {t("bookLabelPoojaType", language)}
                        </label>
                        <select
                          id="pooja_type"
                          required
                          value={selectedPooja}
                          onChange={(e) => setSelectedPooja(e.target.value)}
                          data-ocid="booking.pooja_type.select"
                          className="w-full px-4 py-3 border border-gold-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-saffron-400 focus:border-transparent outline-none transition bg-gold-50/30 appearance-none cursor-pointer"
                        >
                          <option value="">{t("bookPlaceholderPooja", language)}</option>
                          {filteredPoojaOptions.map((opt) => {
                            const key = poojaMapping[opt] || opt.toLowerCase().replace(/\s+/g, "-");
                            const nameKey = ("pooja_" + key.replace(/-/g, "_") + "_name") as keyof typeof TRANSLATIONS;
                            const displayName = (TRANSLATIONS[nameKey] ? t(nameKey, language) : null) ?? opt;
                            return (
                              <option key={opt} value={opt}>
                                {displayName}
                              </option>
                            );
                          })}
                          {!selectedCategory && (
                            <option value="Other">
                              {t("bookPoojaOther", language) ?? "Other"}
                            </option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label
                          className="block font-body text-sm font-semibold text-maroon-600 mb-2"
                          htmlFor="city"
                        >
                          {t("bookLabelCity", language)}
                        </label>
                        <input
                          type="text"
                          id="city"
                          required
                          data-ocid="booking.city.input"
                          placeholder={t("bookPlaceholderCity", language)}
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          className="w-full px-4 py-3 border border-gold-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-saffron-400 focus:border-transparent outline-none transition bg-gold-50/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="block font-body text-sm font-semibold text-maroon-600 mb-2"
                        htmlFor="message"
                      >
                        {t("bookLabelMessage", language)}
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        data-ocid="booking.message.textarea"
                        placeholder={t("bookPlaceholderMessage", language)}
                        className="w-full px-4 py-3 border border-gold-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-saffron-400 focus:border-transparent outline-none transition bg-gold-50/30 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-ocid="booking.form.submit_button"
                      className="w-full btn-primary py-4 rounded-xl text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <title>{t("bookLoading", language)}</title>
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          {t("bookSubmitting", language)}
                        </>
                      ) : (
                        <><HeartHandshake className="w-4 h-4 inline-block mr-2" /> {t("bookSubmit", language)}</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── About Page ───────────────────────────────────────────────────────────────
interface AboutPageProps {
  onNavigate: (page: Page) => void;
  language: Lang;
}

const aboutValueKeys = [
  { icon: <HeartHandshake className="w-5 h-5 text-saffron-500" />, titleKey: "aboutValueDevotion" as const, descKey: "aboutValueDevotionDesc" as const },
  { icon: <ScrollText className="w-5 h-5 text-amber-600" />, titleKey: "aboutValueAuthenticity" as const, descKey: "aboutValueAuthenticityDesc" as const },
  { icon: <Sparkles className="w-6 h-6 text-saffron-500" />, titleKey: "aboutValueExcellence" as const, descKey: "aboutValueExcellenceDesc" as const },
  { icon: "🤝", titleKey: "aboutValueTrust" as const, descKey: "aboutValueTrustDesc" as const },
];

function AboutPage({ onNavigate, language }: AboutPageProps) {
  const [gallery, setGallery] = useState<AboutPoojaGalleryItem[]>(defaultGallery);
  const [active, setActive] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    apiFetch("/api/content/aboutGallery")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((body) => {
        if (body?.data && Array.isArray(body.data) && body.data.length > 0) {
          setGallery(body.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch gallery:", err);
      });
  }, []);

  useEffect(() => {
    if (gallery.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % gallery.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [gallery.length]);

  return (
    <>
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-white/70 font-body font-medium text-sm tracking-wider uppercase block mb-3">
            {t("aboutWhoWeAre", language)}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {t("aboutTitle", language)}
          </h1>
          <p className="font-body text-white/85 text-lg max-w-xl mx-auto">
            {t("aboutIntro", language)}
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 p-8 md:p-10 text-center">
            <h2 className="font-display text-xl md:text-2xl font-bold text-maroon-600 mb-5">
              {t("aboutOrgSectionTitle", language)}
            </h2>
            <p className="font-body text-muted-foreground text-base md:text-lg leading-relaxed">
              {t("aboutOrgDesc", language)}
            </p>
          </div>
        </div>
      </section>

      {/* Pujas Performed (admin-managed swipe gallery) */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="section-heading-accent">
              {t("aboutGalleryAccent", language)}
            </span>
            <h2 className="font-display text-3xl font-bold text-maroon-600 mt-3 mb-3">
              {t("aboutGalleryTitle", language)}
            </h2>
            <div className="lotus-divider mx-auto max-w-[120px]" />
            <p className="font-body text-muted-foreground max-w-2xl mx-auto mt-4">
              {t("aboutGallerySubtext", language)}
            </p>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden"
            onPointerDown={(e) => {
              pointerStartX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              const start = pointerStartX.current;
              pointerStartX.current = null;
              if (start == null) return;
              const delta = e.clientX - start;
              if (Math.abs(delta) < 35) return;
              if (delta < 0) {
                setActive((prev) => (prev + 1) % gallery.length);
              } else {
                setActive((prev) => (prev - 1 + gallery.length) % gallery.length);
              }
            }}
          >
            <div className="aspect-[16/9] md:aspect-[21/9] w-full">
              <img
                src={gallery[active]?.image}
                alt={gallery[active]?.caption || "Puja"}
                className="w-full h-full object-contain bg-white/5"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>



            <button
              type="button"
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-gold-100 shadow-sm flex items-center justify-center text-maroon-700"
              onClick={() => setActive((prev) => (prev - 1 + gallery.length) % gallery.length)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-gold-100 shadow-sm flex items-center justify-center text-maroon-700"
              onClick={() => setActive((prev) => (prev + 1) % gallery.length)}
            >
              →
            </button>

            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setActive(idx)}
                  className={`w-2.5 h-2.5 rounded-full border transition ${idx === active
                    ? "bg-white border-white"
                    : "bg-white/40 border-white/60 hover:bg-white/70"
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 text-center max-w-3xl mx-auto">
            <p className="font-body text-maroon-700/80 leading-relaxed text-sm md:text-base">
              {t("aboutGallerySummary", language)}
            </p>
          </div>
        </div>
      </section>
      <section className="py-16 om-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-3xl shadow-card-warm p-8 border border-gold-100">
              <div className="w-14 h-14 gradient-saffron rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-glow-saffron">
                <Target className="w-10 h-10 mb-4 text-saffron-600 mx-auto" />
              </div>
              <h2 className="font-display text-2xl font-bold text-maroon-600 mb-4">
                {t("aboutOurMission", language)}
              </h2>
              <p className="font-body text-muted-foreground leading-relaxed">
                {t("aboutMissionText", language)}
              </p>
            </div>
            <div className="bg-white rounded-3xl shadow-card-warm p-8 border border-gold-100">
              <div className="w-14 h-14 gradient-gold rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-glow-gold">
                <Eye className="w-10 h-10 mb-4 text-saffron-600 mx-auto" />
              </div>
              <h2 className="font-display text-2xl font-bold text-maroon-600 mb-4">
                {t("aboutOurVision", language)}
              </h2>
              <p className="font-body text-muted-foreground leading-relaxed">
                {t("aboutVisionText", language)}
              </p>
            </div>
          </div>

          <div className="text-center mb-12">
            <span className="section-heading-accent">{t("aboutCoreValues", language)}</span>
            <h2 className="font-display text-3xl font-bold text-maroon-600 mt-3 mb-2">
              {t("aboutWhatWeStand", language)}
            </h2>
            <div className="lotus-divider mx-auto max-w-[120px]" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7 mb-16">
            {aboutValueKeys.map((v) => (
              <div
                key={v.titleKey}
                className="bg-white rounded-2xl p-7 shadow-card-warm text-center border border-gold-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-saffron-50 to-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                  {v.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-maroon-600 mb-2">
                  {t(v.titleKey, language)}
                </h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">
                  {t(v.descKey, language)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gradient-saffron py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            {t("aboutExperienceSacred", language)}
          </h2>
          <p className="font-body text-white/85 mb-8">
            {t("aboutExperienceSubtext", language)}
          </p>
          <button
            type="button"
            onClick={() => onNavigate("book")}
            className="bg-white text-saffron-600 font-body font-semibold px-10 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {t("heroBookCta", language)}
          </button>
        </div>
      </section>
    </>
  );
}

const defaultGallery: AboutPoojaGalleryItem[] = [
  { id: "g1", image: "/assets/gallery/puja-1.jpg", caption: "aboutGalleryCaption_g1" },
  { id: "g2", image: "/assets/gallery/puja-2.jpg", caption: "aboutGalleryCaption_g2" },
  { id: "g3", image: "/assets/gallery/puja-3.jpg", caption: "aboutGalleryCaption_g3" },
  { id: "g4", image: "/assets/gallery/puja-4.jpg", caption: "aboutGalleryCaption_g4" },
  { id: "g5", image: "/assets/gallery/puja-5.jpg", caption: "aboutGalleryCaption_g5" }
];



// ─── Contact Page ─────────────────────────────────────────────────────────────
interface ContactPageProps {
  config: Config;
  language: Lang;
}

function ContactPage({ config, language }: ContactPageProps) {
  return (
    <>
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-white/70 font-body font-medium text-sm tracking-wider uppercase block mb-3">
            {t("contactReachOut", language)}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {t("contactTitle", language)}
          </h1>
          <p className="font-body text-white/85 text-lg">
            {t("contactSubtext", language)}
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-gradient-to-b from-saffron-50/50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 p-8 md:p-10 text-center">
            <h2 className="font-display text-xl md:text-2xl font-bold text-maroon-600 mb-5">
              {t("contactBookingSectionTitle", language)}
            </h2>
            <p className="font-body text-muted-foreground text-base md:text-lg leading-relaxed">
              {t("contactBookingEasy", language)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 om-pattern">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-7 mb-10">
            <div className="bg-white rounded-3xl shadow-card-warm p-8 text-center border border-gold-100">
              <div className="w-16 h-16 gradient-saffron rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-glow-saffron">
                <Phone className="w-4 h-4 inline-block mr-2 text-gray-500" />
              </div>
              <p className="font-body text-muted-foreground text-sm mb-2">
                {t("contactCallUs", language)}
              </p>
              <p className="font-display text-lg sm:text-sm md:text-xs lg:text-sm xl:text-lg font-bold text-maroon-600">
                <a href={`tel:${config.contact_phone}`} className="hover:text-saffron-600 transition-colors">
                  {config.contact_phone}
                </a>
              </p>
            </div>
            <div className="bg-white rounded-3xl shadow-card-warm p-8 text-center border border-gold-100">
              <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-glow-gold">
                <Mail className="w-4 h-4 inline-block mr-2 text-gray-500" />
              </div>
              <p className="font-body text-muted-foreground text-sm mb-2">
                {t("contactEmailUs", language)}
              </p>
              <p className="font-display text-lg sm:text-sm md:text-xs lg:text-sm xl:text-lg font-bold text-maroon-600 break-all">
                <a href={`mailto:${config.contact_email}`} className="hover:text-saffron-600 transition-colors">
                  {config.contact_email}
                </a>
              </p>
            </div>
            <div className="bg-white rounded-3xl shadow-card-warm p-8 text-center border border-gold-100">
              <div className="w-16 h-16 gradient-saffron rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow-saffron">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <p className="font-body text-muted-foreground text-sm mb-2">
                {language === "hi" ? "स्थान" : language === "gu" ? "સ્થાન" : "Location"}
              </p>
              <p className="font-display text-lg sm:text-sm md:text-xs lg:text-sm xl:text-lg font-bold text-maroon-600 break-words">
                Ahmedabad, Gujarat, India
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-3xl shadow-card-warm p-8 border border-gold-100 text-center mb-7">
            <h3 className="font-display text-xl font-bold text-maroon-600 mb-5">Follow Us on Social Media</h3>
            <div className="flex justify-center gap-6">
              <a
                href="https://www.instagram.com/satkarmpuja"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:-translate-y-1" style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </div>
                <span className="text-sm font-body font-semibold text-maroon-600">Instagram</span>
                <span className="text-xs text-muted-foreground">@satkarmpuja</span>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61590174430707"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:-translate-y-1" style={{ background: "#1877F2" }}>
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </div>
                <span className="text-sm font-body font-semibold text-maroon-600">Facebook</span>
                <span className="text-xs text-muted-foreground">SatkarmPuja</span>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-card-warm p-8 border border-gold-100 text-center">
            <Clock className="w-8 h-8 mb-4 text-saffron-600 mx-auto" />
            <h3 className="font-display text-xl font-bold text-maroon-600 mb-3">
              {t("contactAvailableHours", language)}
            </h3>
            <p className="font-body text-muted-foreground text-sm">
              {t("contactHoursWeekday", language)}
            </p>
            <p className="font-body text-muted-foreground text-sm">
              {t("contactHoursSunday", language)}
            </p>
            <p className="font-body text-muted-foreground text-xs mt-3">
              {t("contactResponseTime", language)}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Terms & Conditions Page ──────────────────────────────────────────────────
interface TermsPageProps {
  language: Lang;
  onNavigate: (page: Page) => void;
}

function TermsPage({ language, onNavigate }: TermsPageProps) {
  const isHi = language === "hi";
  const isGu = language === "gu";

  return (
    <>
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-white/70 font-body font-medium text-sm tracking-wider uppercase block mb-3">
            {isHi ? "सत्कर्मपूजा नियमावली" : isGu ? "સત્કર્મપૂજા નિયમો" : "SatkarmPuja Guidelines"}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {isHi ? "नियम और शर्तें" : isGu ? "નિયમો અને શરતો" : "Terms & Conditions"}
          </h1>
          <p className="font-body text-white/85 text-lg max-w-2xl mx-auto">
            {isHi 
              ? "हमारे पवित्र अनुष्ठानों और सेवाओं का उपयोग करने के लिए नियम और दिशा-निर्देश।" 
              : isGu 
                ? "અમારી પવિત્ર વિધિઓ અને સેવાઓનો ઉપયોગ કરવા માટેની માર્ગદર્શિકા." 
                : "Terms and guidelines governing our sacred Vedic rituals and booking services."}
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-saffron-50/50 to-white om-pattern">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 p-8 md:p-12 text-left">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gold-100">
              <ScrollText className="w-8 h-8 text-maroon-600" />
              <h2 className="font-display text-2xl font-bold text-maroon-800">
                {isHi ? "सेवा शर्तें और नियम" : isGu ? "સેવા શરતો અને નિયમો" : "Terms of Service"}
              </h2>
            </div>
            
            <p className="font-body text-muted-foreground mb-6 leading-relaxed">
              {isHi ? (
                <><strong>सत्कर्मपूजा</strong> में आपका स्वागत है। हमारे प्लेटफ़ॉर्म का उपयोग करने और हमारी वैदिक पूजा सेवाओं को बुक करने से, आप निम्नलिखित नियमों और शर्तों का पालन करने और उनसे बाध्य होने के लिए सहमत होते हैं। ये शर्तें आपके (भक्त) और सत्कर्मपूजा के बीच के सभी सेवा संबंधों को नियंत्रित करती हैं।</>
              ) : isGu ? (
                <><strong>સત્કર્મપૂજા</strong> માં આપનું સ્વાગત છે. અમારા પ્લેટફોર્મનો ઉપયોગ કરીને અને અમારી વૈદિક પૂજા સેવાઓ બુક કરીને, તમે નીચેના નિયમો અને શરતોનું પાલન કરવા અને તેનાથી બંધાવવા માટે સંમત થાઓ છો. આ શરતો તમારા (ભક્ત) અને સત્કર્મપૂજા વચ્ચેના તમામ સેવા સંબંધોને નિયંત્રિત કરે છે.</>
              ) : (
                <>Welcome to <strong>SatkarmPuja</strong>. By accessing our platform and booking our Vedic puja services, you agree to comply with and be bound by the following terms and conditions. These terms govern the relationship between you (the devotee) and SatkarmPuja regarding all services offered.</>
              )}
            </p>

            <div className="space-y-8 font-body text-muted-foreground text-sm leading-relaxed">
              {/* Point 1 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "1. पवित्र सेवाएँ और बुकिंग" : isGu ? "1. પવિત્ર સેવાઓ અને બુકિંગ" : "1. Sacred Services & Bookings"}
                </h3>
                <p>
                  {isHi ? (
                    "सत्कर्मपूजा प्रामाणिक वैदिक अनुष्ठान, पाठ, जाप, अनुष्ठान और यज्ञों के आयोजन और प्रदर्शन की सुविधा प्रदान करती है। बुकिंग के समय भक्त का सही विवरण (नाम, गोत्र, परिवार का विवरण और नक्षत्र यदि लागू हो) प्रदान करना आवश्यक है ताकि प्राचीन शास्त्रों के अनुसार संकल्प सही ढंग से किया जा सके।"
                  ) : isGu ? (
                    "સત્કર્મપૂજા સાચી વૈદિક વિધિઓ, પાઠ, જાપ, અનુષ્ઠાન અને યજ્ઞોના આયોજન અને પ્રદર્શનની સુવિધા આપે છે. બુકિંગ સમયે ભક્તની સાચી વિગતો (નામ, ગોત્ર, પરિવારની વિગતો અને નક્ષત્ર જો લાગુ પડતું હોય) પ્રદાન કરવી જરૂરી છે જેથી પ્રાચીન શાસ્ત્રો અનુસાર સંકલ્પ સાચી રીતે કરી શકાય."
                  ) : (
                    "SatkarmPuja facilitates the scheduling and performance of authentic Vedic rituals, patha, jap, anushthan, and yagnas. Bookings must be made by providing accurate details of the devotee (Name, Gotra, Family Details, and Nakshatra if applicable) to ensure the Sankalpa is conducted correctly in accordance with ancient scripture."
                  )}
                </p>
              </div>

              {/* Point 2 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "2. शेड्यूलिंग और पंडित" : isGu ? "2. શેડ્યુલિંગ અને પંડિતો" : "2. Scheduling & Pandits"}
                </h3>
                <p>
                  {isHi ? (
                    "सभी अनुष्ठान ऐतिहासिक आध्यात्मिक केंद्रों (काशी, प्रयागराज, चित्रकूट, अयोध्या, मथुरा, वृंदावन) के वैदिक शास्त्रों में प्रशिक्षित सत्यापित ब्राह्मणों द्वारा किए जाते हैं। यद्यपि हम पसंदीदा पंडितों को नियुक्त करने का प्रयास करते हैं, फिर भी सत्कर्मपूजा के पास शास्त्रोक्त शुद्धता और समय पर पूजा संपन्न करने के लिए आवश्यकतानुसार योग्य पंडितों को नियुक्त करने या बदलने का अधिकार सुरक्षित है।"
                  ) : isGu ? (
                    "બધી વિધિઓ ઐતિહાસિક આધ્યાત્મિક કેન્દ્રો (કાશી, પ્રયાગરાજ, ચિત્રકૂટ, અયોધ્યા, મથુરા, વૃંદાવન) ના વૈદિક શાસ્ત્રોમાં પ્રશિક્ષિત પ્રમાણિત બ્રાહ્મણો દ્વારા કરવામાં આવે છે. તેમ છતાં અમે મનપસંદ પંડિતોને નિયુક્ત કરવાનો પ્રયાસ કરીએ છીએ, છતાં સત્કર્મપૂજા પાસે શાસ્ત્રોક્ત શુદ્ધતા અને સમયસર પૂજા પૂર્ણ કરવા માટે જરૂરિયાત મુજબ લાયક પંડિતો બદલવાનો અધિકાર સુરક્ષિત છે."
                  ) : (
                    "All ceremonies are performed by verified Brahmins trained in Vedic scriptures from historic spiritual hubs (Kashi, Prayagraj, Chitrakoot, Ayodhya, Mathura, Vrindavan). While we strive to assign preferred pandits, SatkarmPuja reserves the right to assign or substitute qualified pandits as necessary to ensure scriptural integrity and timely completion."
                  )}
                </p>
              </div>

              {/* Point 3 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "3. भक्त की तैयारी और आचरण" : isGu ? "3. ભક્તની તૈયારી અને આચરણ" : "3. Devotee Preparations & Conduct"}
                </h3>
                <p>
                  {isHi 
                    ? "वैदिक अनुष्ठानों का पूर्ण आध्यात्मिक लाभ प्राप्त करने के लिए, भक्तों से शुद्धता बनाए रखने का अनुरोध किया जाता है:" 
                    : isGu 
                      ? "વૈદિક વિધિઓનો સંપૂર્ણ આધ્યાત્મિક લાભ મેળવવા માટે, ભક્તોને શુદ્ધતા જાળવવાની વિનંતી કરવામાં આવે છે:" 
                      : "To secure the full spiritual benefits of the Vedic rituals, devotees are requested to maintain purity:"}
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {isHi ? (
                    <>
                      <li>पूजा से पहले स्नान करें और साफ, पारंपरिक वस्त्र पहनें।</li>
                      <li>पूजा स्थल को साफ करें और चौकी पर साफ लाल या पीला कपड़ा बिछाएं।</li>
                      <li>सुनिश्चित करें कि संकल्प के लिए दो कटोरे (एक पानी से भरा, एक खाली) और एक चम्मच पूजा शुरू होने से 5 मिनट पहले तैयार रखें।</li>
                      <li>ऑनलाइन/वर्चुअल पूजा के लिए एक स्थिर इंटरनेट कनेक्शन सुनिश्चित करें।</li>
                    </>
                  ) : isGu ? (
                    <>
                      <li>પૂજા પહેલાં સ્નાન કરો અને સ્વચ્છ, પરંપરાગત વસ્ત્રો પહેરો.</li>
                      <li>પૂજા સ્થાનને સાફ કરો અને ચોકી પર સ્વચ્છ લાલ કે પીળું કપડું પાથરો.</li>
                      <li>ખાતરી કરો કે સંકલ્પ માટે બે વાટકી (એક પાણીથી ભરેલી, એક ખાલી) અને એક ચમચી પૂજા શરૂ થવાના 5 મિનિટ પહેલા તૈયાર રાખો.</li>
                      <li>ઓનલાઇન/વર્ચ્યુઅલ પૂજા માટે સ્થિર ઇન્ટરનેટ કનેક્શનની ખાતરી કરો.</li>
                    </>
                  ) : (
                    <>
                      <li>Bathe and wear clean, traditional clothing prior to the ceremony.</li>
                      <li>Prepare the designated puja altar space with clean platform/chowki.</li>
                      <li>Ensure required local samagri (like two bowls—one filled with water, one empty—and a spoon) is ready 5 minutes before scheduled start.</li>
                      <li>Maintain a stable internet connection for online/virtual pujas.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Point 4 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "4. भुगतान, रद्दीकरण और रिफंड" : isGu ? "4. ચુકવણી, રદ્દીકરણ અને રિફંડ" : "4. Payments, Cancellations & Refunds"}
                </h3>
                <p>
                  {isHi ? (
                    "सभी बुकिंग हमारे सुरक्षित भुगतान गेटवे (रेज़रपे) के माध्यम से सफल भुगतान पर ही पक्की मानी जाती हैं। निर्धारित पूजा समय से कम से कम 24 घंटे पहले किए गए रद्दीकरण रिफंड (प्रोसेसिंग शुल्क घटाकर) के पात्र हैं। पूजा के 24 घंटे के भीतर रद्दीकरण होने पर पंडित समन्वय और तैयारी की लागत को कवर करने के लिए शुल्क लिया जा सकता है।"
                  ) : isGu ? (
                    "તમામ બુકિંગ અમારા સુરક્ષિત પેમેન્ટ ગેટવે (રેઝરપે) દ્વારા સફળ ચુકવણી પછી જ કન્ફર્મ ગણવામાં આવશે. નિર્ધારિત પૂજા સમયના ઓછામાં ઓછા 24 કલાક પહેલાં કરેલ રદ્દીકરણ રિફંડ (પ્રોસેસિંગ ફી બાદ કરીને) માટે પાત્ર છે. પૂજાના 24 કલાકની અંદર રદ્દીકરણના કિસ્સામાં પંડિત સમન્વય અને તૈયારીના ખર્ચને આવરી લેવા માટે શુલ્ક લેવામાં આવી શકે છે."
                  ) : (
                    "All bookings are confirmed upon successful payment through our secure payment gateways (Razorpay). Cancellations made at least 24 hours prior to the scheduled puja time are eligible for a refund (minus processing fees). Cancellations within 24 hours of the puja may incur charges covering preparation costs and pandit coordination."
                  )}
                </p>
              </div>

              {/* Point 5 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "5. भक्ति भाव और फल अस्वीकरण" : isGu ? "5. ભક્તિ ભાવ અને ફળ અસ્વીકરણ" : "5. Devotional Act & Outcome Disclaimer"}
                </h3>
                <p>
                  {isHi ? (
                    "पूजा और वैदिक अनुष्ठान आस्था और आध्यात्मिक भक्ति के कार्य हैं। वैदिक दर्शन में, फल व्यक्तिगत कर्म, सच्ची भक्ति और ईश्वरीय कृपा पर निर्भर करते हैं। यद्यपि हमारे पंडित सख्त शास्त्रों का पालन करते हैं, फिर भी सत्कर्मपूजा किसी विशिष्ट भौतिक या आध्यात्मिक परिणाम की कोई गारंटी नहीं देती है।"
                  ) : isGu ? (
                    "પૂજા અને વૈદિક વિધિઓ શ્રદ્ધા અને આધ્યાત્મિક ભક્તિના કાર્યો છે. વૈદિક દર્શનમાં, ફળ વ્યક્તિગત કર્મ, સાચી ભક્તિ અને દૈવી કૃપા પર આધાર રાખે છે. જો કે અમારા પંડિતો કડક શાસ્ત્રોનું પાલન કરે છે, છતાં સત્કર્મપૂજા કોઈ ચોક્કસ ભૌતિક અથવા આધ્યાત્મિક પરિણામની બાંયધરી આપતી નથી."
                  ) : (
                    "Pujas and Vedic rituals are acts of faith and spiritual devotion. In Vedic philosophy, outcomes depend on individual karma, sincere devotion (bhakti), and divine grace. While our pandits follow strict scripture, SatkarmPuja makes no guarantees regarding specific material or spiritual outcomes."
                  )}
                </p>
              </div>

              {/* Point 6 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "6. बौद्धिक संपदा" : isGu ? "6. બૌદ્ધિક સંપદા" : "6. Intellectual Property"}
                </h3>
                <p>
                  {isHi ? (
                    "इस वेबसाइट की सभी सामग्री, जिसमें लोगो, डिज़ाइन, ऑडियो क्लिप, टेक्स्ट और चित्र शामिल हैं, सत्कर्मपूजा की बौद्धिक संपदा हैं और पूर्व लिखित अनुमति के बिना इन्हें पुनरुत्पादित, कॉपी या उपयोग नहीं किया जा सकता है।"
                  ) : isGu ? (
                    "આ વેબસાઇટની તમામ સામગ્રી, જેમાં લોગો, ડિઝાઇન, ઓડિયો ક્લિપ, લખાણ અને ચિત્રો શામેલ છે, તે સત્કર્મપૂજાની બૌદ્ધિક સંપદા છે અને પૂર્વ લેખિત પરવાનગી વિના તેનું પુનઃઉત્પાદન, નકલ અથવા ઉપયોગ કરી શકાશે નહીં."
                  ) : (
                    "All content on this website, including logos, designs, audio clips, text, and images, is the intellectual property of SatkarmPuja and may not be reproduced, copied, or used without prior written permission."
                  )}
                </p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gold-100 flex justify-between items-center flex-wrap gap-4">
              <span className="text-xs text-muted-foreground font-body">
                {isHi ? "अंतिम अद्यतन: जून 2026" : isGu ? "છેલ્લે અપડેટ કરેલ: જૂન 2026" : "Last Updated: June 2026"}
              </span>
              <button
                onClick={() => onNavigate("home")}
                className="gradient-saffron hover:opacity-90 text-white font-body font-semibold px-6 py-2 rounded-full transition shadow-md"
              >
                {isHi ? "होम पेज पर जाएं" : isGu ? "હોમ પેજ પર જાઓ" : "Back to Home"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Privacy Policy Page ──────────────────────────────────────────────────────
interface PrivacyPageProps {
  language: Lang;
  onNavigate: (page: Page) => void;
}

function PrivacyPage({ language, onNavigate }: PrivacyPageProps) {
  const isHi = language === "hi";
  const isGu = language === "gu";

  return (
    <>
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-white/70 font-body font-medium text-sm tracking-wider uppercase block mb-3">
            {isHi ? "डेटा सुरक्षा नीति" : isGu ? "ડેટા સુરક્ષા નીતિ" : "Data Protection Policy"}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {isHi ? "गोपनीयता नीति" : isGu ? "ગોપનીયતા નીતિ" : "Privacy Policy"}
          </h1>
          <p className="font-body text-white/85 text-lg max-w-2xl mx-auto">
            {isHi 
              ? "आपकी व्यक्तिगत जानकारी और श्रद्धा से जुड़े डेटा की सुरक्षा के लिए हमारा संकल्प।" 
              : isGu 
                ? "તમારી અંગત માહિતી અને શ્રદ્ધા સંબંધિત ડેટાની સુરક્ષા માટે અમારો સંકલ્પ." 
                : "Our commitment to protecting your personal information and sacred data."}
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-saffron-50/50 to-white om-pattern">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 p-8 md:p-12 text-left">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gold-100">
              <Shield className="w-8 h-8 text-maroon-600" />
              <h2 className="font-display text-2xl font-bold text-maroon-800">
                {isHi ? "गोपनीयता और डेटा सुरक्षा" : isGu ? "ગોપનીયતા અને ડેટા સુરક્ષા" : "Privacy & Data Protection"}
              </h2>
            </div>
            
            <p className="font-body text-muted-foreground mb-6 leading-relaxed">
              {isHi ? (
                <><strong>सत्कर्मपूजा</strong> में, हम आपके विश्वास और भक्ति को सर्वोच्च सम्मान देते हैं। हम आपकी गोपनीयता की रक्षा करने और यह सुनिश्चित करने के लिए प्रतिबद्ध हैं कि आपके द्वारा साझा किए गए व्यक्तिगत और पवित्र विवरण सुरक्षित और गोपनीय रहें।</>
              ) : isGu ? (
                <><strong>સત્કર્મપૂજા</strong> માં, અમે તમારા વિશ્વાસ અને ભક્તિને સર્વોચ્ચ સન્માન આપીએ છીએ. અમે તમારી ગોપનીયતાનું રક્ષણ કરવા અને તમે અમારી સાથે શેર કરેલી તમામ વ્યક્તિગત અને પવિત્ર વિગતો સુરક્ષિત અને ગુપ્ત રહે તેની ખાતરી કરવા માટે પ્રતિબદ્ધ છીએ.</>
              ) : (
                <>At <strong>SatkarmPuja</strong>, we hold your trust and devotion in the highest regard. We are committed to safeguarding your privacy and ensuring that any personal and sacred details you share with us remain secure and confidential.</>
              )}
            </p>

            <div className="space-y-8 font-body text-muted-foreground text-sm leading-relaxed">
              {/* Point 1 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "1. व्यक्तिगत जानकारी जो हम एकत्र करते हैं" : isGu ? "1. વ્યક્તિગત માહિતી જે અમે એકત્રિત કરીએ છીએ" : "1. Personal Information We Collect"}
                </h3>
                <p>
                  {isHi 
                    ? "बुकिंग की सुविधा और व्यक्तिगत वैदिक अनुष्ठानों को संपन्न करने के लिए, हम निम्नलिखित विवरण एकत्र करते हैं:" 
                    : isGu 
                      ? "બુકિંગની સુવિધા અને વ્યક્તિગત વૈદિક વિધિઓ કરવા માટે, અમે નીચેની વિગતો એકત્રિત કરીએ છીએ:" 
                      : "To facilitate bookings and perform personalized Vedic rituals, we collect the following details:"}
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {isHi ? (
                    <>
                      <li><strong>सम्पर्क विवरण:</strong> पूरा नाम, ईमेल पता, फोन नंबर और शहर।</li>
                      <li><strong>भक्ति विवरण:</strong> परिवार के सदस्यों के नाम, गोत्र, नक्षत्र, और पूजा संकल्प के लिए विशेष आवश्यकताएं।</li>
                      <li><strong>लेनदेन की जानकारी:</strong> ऑर्डर आईडी, भुगतान पुष्टि, और बुकिंग स्थिति (कार्ड विवरण सीधे हमारे सुरक्षित भुगतान गेटवे रेज़रपे द्वारा संसाधित किए जाते हैं और हमारे सर्वर पर कभी संग्रहीत नहीं होते हैं)।</li>
                    </>
                  ) : isGu ? (
                    <>
                      <li><strong>સંપર્ક વિગતો:</strong> પૂરું નામ, ઇમેઇલ સરનામું, ફોન નંબર અને શહેર.</li>
                      <li><strong>ભક્તિ વિગતો:</strong> પરિવારના સભ્યોના નામ, ગોત્ર, નક્ષત્ર અને પૂજા સંકલ્પ માટેની ખાસ જરૂરિયાતો.</li>
                      <li><strong>વ્યવહાર માહિતી:</strong> ઓર્ડર આઈડી, પેમેન્ટ કન્ફર્મેશન અને બુકિંગ સ્ટેટસ (કાર્ડની વિગતો સીધી અમારા સુરક્ષિત પેમેન્ટ ગેટવે રેઝરપે દ્વારા પ્રોસેસ કરવામાં આવે છે અને અમારા સર્વર પર ક્યારેય સ્ટોર થતી નથી).</li>
                    </>
                  ) : (
                    <>
                      <li><strong>Contact Details:</strong> Full name, email address, phone number, and city.</li>
                      <li><strong>Devotional Details:</strong> Family members' names, Gotra, Nakshatra, and custom requirements for puja Sankalpa.</li>
                      <li><strong>Transactional Info:</strong> Order ID, payment confirmations, and booking status (card details are processed directly by our secure payment gateway Razorpay and never stored on our servers).</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Point 2 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "2. हम आपकी जानकारी का उपयोग कैसे करते हैं" : isGu ? "2. અમે તમારી માહિતીનો ઉપયોગ કેવી રીતે કરીએ છીએ" : "2. How We Use Your Information"}
                </h3>
                <p>
                  {isHi 
                    ? "आपकी जानकारी का उपयोग केवल निम्नलिखित उद्देश्यों के लिए किया जाता है:" 
                    : isGu 
                      ? "તમારી માહિતીનો ઉપયોગ માત્ર નીચેના હેતુઓ માટે કરવામાં આવે છે:" 
                      : "Your information is strictly used for the following purposes:"}
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {isHi ? (
                    <>
                      <li>आपकी पूजा का समय निर्धारित करना और सौंपे गए वैदिक पंडितों के साथ समन्वय करना।</li>
                      <li>आपके द्वारा निर्दिष्ट गोत्र और नाम के साथ पवित्र संकल्प समारोह का संचालन करना।</li>
                      <li>लेनदेन की स्थिति के ईमेल, बुकिंग अनुस्मारक और आधिकारिक रसीदें भेजना।</li>
                      <li>हमारी वैदिक सेवाओं, उपयोगकर्ता अनुभव को बेहतर बनाना और ग्राहक सहायता प्रश्नों का समाधान करना।</li>
                    </>
                  ) : isGu ? (
                    <>
                      <li>તમારી પૂજા શેડ્યૂલ કરવી અને સોંપાયેલ વૈદિક પંડિતો સાથે સમન્વય સાધવો.</li>
                      <li>તમારા નિર્દિષ્ટ ગોત્ર અને નામ સાથે પવિત્ર સંકલ્પ વિધિ કરવી.</li>
                      <li>ટ્રાન્ઝેક્શન સ્ટેટસ ઈમેલ, બુકિંગ રીમાઇન્ડર્સ અને સત્તાવાર રસીદો મોકલવી.</li>
                      <li>અમારી વૈદિક સેવાઓ, વપરાશકર્તા અનુભવ સુધારવા અને ગ્રાહક સેવા પ્રશ્નોના નિરાકરણ માટે.</li>
                    </>
                  ) : (
                    <>
                      <li>Scheduling your puja and coordinating with the assigned Vedic pandits.</li>
                      <li>Conducting the sacred Sankalpa ceremony with your specified gotra and name.</li>
                      <li>Sending transaction status emails, booking reminders, and official receipts.</li>
                      <li>Improving our Vedic services, user experience, and addressing customer support queries.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Point 3 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "3. गोपनीयता और सुरक्षा" : isGu ? "3. ગુપ્તતા અને સુરક્ષા" : "3. Confidentiality & Security"}
                </h3>
                <p>
                  {isHi ? (
                    "हम आपके डेटा की सुरक्षा के लिए उद्योग-मानक तकनीकी सुरक्षा उपाय लागू करते हैं। क्लाइंट ब्राउज़र और हमारे सर्वर के बीच सभी डेटा ट्रांसमिशन सुरक्षित सॉकेट लेयर (एसएसएल) तकनीक का उपयोग करके एन्क्रिप्ट किए जाते हैं। हम कभी भी विपणन के लिए तीसरे पक्ष के साथ आपके भक्ति विवरण बेचते, किराए पर देते, व्यापार या साझा नहीं करते हैं।"
                  ) : isGu ? (
                    "અમે તમારા ડેટાને સુરક્ષિત રાખવા માટે ઉદ્યોગ-માનક તકનીકી સુરક્ષા પગલાં લાગુ કરીએ છીએ. ક્લાયંટ બ્રાઉઝર અને અમારા સર્વર વચ્ચે તમામ ડેટા ટ્રાન્સમિશન સિક્યોર સોકેટ લેયર (SSL) ટેકનોલોજીનો ઉપયોગ કરીને એન્ક્રિપ્ટ કરવામાં આવે છે. અમે ક્યારેય માર્કેટિંગ માટે ત્રીજા પક્ષકારો સાથે તમારી ભક્તિ સંબંધિત વિગતો વેચતા, ભાડે આપતા, વેપાર કરતા અથવા શેર કરતા નથી."
                  ) : (
                    "We implement industry-standard technical security measures to protect your data. All data transmission between the client browser and our servers is encrypted using Secure Socket Layer (SSL) technology. We never sell, rent, trade, or share your devotional details with third-party marketers."
                  )}
                </p>
              </div>

              {/* Point 4 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "4. तीसरे पक्ष की भुगतान सेवाएँ" : isGu ? "4. તૃતીય-પક્ષ ચુકવણી સેવાઓ" : "4. Third-Party Payment Services"}
                </h3>
                <p>
                  {isHi ? (
                    "हम भुगतान लेनदेन को संभालने के लिए एक शीर्ष प्रमाणित भुगतान गेटवे, रेज़रपे के साथ एकीकृत करते हैं। रेज़रपे क्रेडिट कार्ड और नेटबैंकिंग क्रेडेंशियल्स की सुरक्षा सुनिश्चित करने के लिए पीसीआई सुरक्षा मानक परिषद (पीसीआई-डीएसएस) द्वारा प्रबंधित सख्त मानकों का पालन करता है।"
                  ) : isGu ? (
                    "અમે ચુકવણી વ્યવહારો હેન્ડલ કરવા માટે ટોચના પ્રમાણિત પેમેન્ટ ગેટવે, રેઝરપે સાથે સંકલિત છીએ. રેઝરપે ક્રેડિટ કાર્ડ અને નેટબેંકિંગ ઓળખપત્રોની સુરક્ષા સુનિશ્ચિત કરવા માટે PCI સિક્યોરિટી સ્ટાન્ડર્ડ્સ કાઉન્સિલ (PCI-DSS) દ્વારા સંચાલિત કડક ધોરણોનું પાલન કરે છે."
                  ) : (
                    "We integrate with Razorpay, a top-tier certified payment gateway, to handle payment transactions. Razorpay adheres to strict standards managed by the PCI Security Standards Council (PCI-DSS) to ensure security of credit card and netbanking credentials."
                  )}
                </p>
              </div>

              {/* Point 5 */}
              <div>
                <h3 className="text-lg font-bold text-maroon-700 mb-2">
                  {isHi ? "5. भक्त के अधिकार" : isGu ? "5. ભક્તના અધિકારો" : "5. Devotee Rights"}
                </h3>
                <p>
                  {isHi ? (
                    "आपके पास सीधे हमसे संपर्क करके अपनी व्यक्तिगत प्रोफ़ाइल और बुकिंग इतिहास की समीक्षा करने, अपडेट करने या हटाने का अनुरोध करने का अधिकार है।"
                  ) : isGu ? (
                    "તમારી પાસે સીધો અમારો સંપર્ક કરીને તમારી વ્યક્તિગત પ્રોફાઇલ અને બુકિંગ ઇતિહાસની સમીક્ષા કરવાનો, અપડેટ કરવાનો અથવા કાઢી નાખવાની વિનંતી કરવાનો અધિકાર છે."
                  ) : (
                    "You have the right to review, update, or request deletion of your personal profile and booking history by contacting us directly."
                  )}
                </p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gold-100 flex justify-between items-center flex-wrap gap-4">
              <span className="text-xs text-muted-foreground font-body">
                {isHi ? "अंतिम अद्यतन: जून 2026" : isGu ? "છેલ્લે અપડેટ કરેલ: જૂન 2026" : "Last Updated: June 2026"}
              </span>
              <button
                onClick={() => onNavigate("home")}
                className="gradient-saffron hover:opacity-90 text-white font-body font-semibold px-6 py-2 rounded-full transition shadow-md"
              >
                {isHi ? "होम पेज पर जाएं" : isGu ? "હોમ પેજ પર જાઓ" : "Back to Home"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Blog Page ────────────────────────────────────────────────────────────────
const blogT = {
  ourJournal: { en: "Our Journal", hi: "हमारा जर्नल", gu: "અમારું જર્નલ" },
  wisdomInsights: { en: "Vedic Wisdom & Insights", hi: "वैदिक ज्ञान और अंतर्दृष्टि", gu: "વૈદિક જ્ઞાન અને વિચારો" },
  wisdomDesc: {
    en: "Explore articles on Vedic rituals, spirituality, and the sacred traditions that connect us to the divine.",
    hi: "वैदिक अनुष्ठानों, आध्यात्मिकता और पवित्र परंपराओं पर लेख देखें जो हमें परमात्मा से जोड़ते हैं।",
    gu: "વૈદિક વિધિઓ, આધ્યાત્મિકતા અને પવિત્ર પરંપરાઓ પરના લેખો શોધો જે આપણને દૈવી સાથે જોડે છે."
  },
  readArticle: { en: "Read Article", hi: "लेख पढ़ें", gu: "લેખ વાંચો" },
  readyToBook: { en: "Ready to Book Your Puja?", hi: "अपनी पूजा बुक करने के लिए तैयार हैं?", gu: "તમારી પૂજા બુક કરવા તૈયાર છો?" },
  readyToBookDesc: {
    en: "Connect with our verified pandits and experience the power of authentic Vedic rituals.",
    hi: "हमारे सत्यापित पंडितों से जुड़ें और प्रामाणिक वैदिक अनुष्ठानों की शक्ति का अनुभव करें।",
    gu: "અમારા પ્રમાણિત પંડિતો સાથે જોડાઓ અને સાચી વૈદિક વિધિઓની શક્તિનો અનુભવ કરો."
  },
  bookNow: { en: "Book a Puja Now", hi: "अभी पूजा बुक करें", gu: "હવે પૂજા બુક કરો" },
  backToBlog: { en: "Back to Blog", hi: "ब्लॉग पर वापस", gu: "બ્લોગ પર પાછા જાઓ" },
  publishedOn: { en: "Published on", hi: "प्रकाशित तिथि", gu: "પ્રકાશિત તારીખ" },
  articleNotFound: { en: "Article not found.", hi: "लेख नहीं मिला।", gu: "લેખ મળ્યો નથી." },
  recentArticles: { en: "Recent Articles", hi: "हाल के लेख", gu: "તાજેતરના લેખો" },
  experienceBlessings: { en: "Experience Sacred Vedic Blessings", hi: "पवित्र वैदिक आशीर्वाद का अनुभव करें", gu: "પવિત્ર વૈદિક આશીર્વાદનો અનુભવ કરો" },
  sidebarDesc: {
    en: "Book a personalized puja, patha, or mantra jaap with our highly qualified Vedic Pandits.",
    hi: "हमारे अत्यधिक योग्य वैदिक पंडितों के साथ एक व्यक्तिगत पूजा, पाठ या मंत्र जाप बुक करें।",
    gu: "અમારા ઉચ્ચ લાયકાત ધરાવતા વૈદિક પંડિતો સાથે વ્યક્તિગત પૂજા, પાઠ અથવા મંત્ર જાપ બુક કરો."
  },
  connectingDevotees: { en: "Connecting Devotees to Divine Blessings", hi: "भक्तों को दिव्य आशीर्वाद से जोड़ना", gu: "ભક્તોને દૈવી આશીર્વાદ સાથે જોડવા" },
  footerCtaDesc: {
    en: "Explore our traditional puja categories or schedule a consultation with our pandit ji today.",
    hi: "हमारी पारंपरिक पूजा श्रेणियों का पता लगाएं या आज ही हमारे पंडित जी से परामर्श करें।",
    gu: "અમારી પરંપરાગત પૂજા શ્રેણીઓ શોધો અથવા આજે જઅમારા પંડિતજી સાથે સંપર્ક કરો."
  },
  explorePujas: { en: "Explore Pujas", hi: "पूजाएं देखें", gu: "પૂજાઓ જુઓ" },
  contactUs: { en: "Contact Us", hi: "संपर्क करें", gu: "અમારો સંપર્ક કરો" }
};

const blogPosts = [
  {
    id: 1,
    title: {
      en: "The Significance of Rudrabhishek Puja in Daily Life",
      hi: "दैनिक जीवन में रुद्राभिषेक पूजा का महत्व",
      gu: "દૈનિક જીવનમાં રુદ્રાભિષેક પૂજાનું મહત્વ"
    },
    excerpt: {
      en: "Rudrabhishek is one of the most powerful rituals dedicated to Lord Shiva. Discover how this ancient practice can bring peace, prosperity, and spiritual growth into your everyday life.",
      hi: "रुद्राभिषेक भगवान शिव को समर्पित सबसे शक्तिशाली अनुष्ठानों में से एक है। जानें कि यह अभ्यास आपके दैनिक जीवन में शांति और समृद्धि कैसे ला सकता है।",
      gu: "રુદ્રાભિષેક ભગવાન શિવને સમર્પિત સૌથી શક્તિશાળી વિધિઓમાંથી એક છે. આ પ્રાચીન સાધના તમારા રોજિંદા જીવનમાં કેવી રીતે શાંતિ અને સમૃદ્ધિ લાવી શકે છે તે શોધો."
    },
    category: {
      en: "Rituals",
      hi: "अनुष्ठान",
      gu: "ધાર્મિક વિધિઓ"
    },
    readTime: {
      en: "5 min read",
      hi: "5 मिनट पाठ",
      gu: "5 મિનિટ વાંચન"
    },
    date: {
      en: "May 20, 2026",
      hi: "20 मई, 2026",
      gu: "20 મે, 2026"
    },
    image: "/assets/generated/pooja-ceremony.dim_800x600.jpg",
    color: "oklch(0.43 0.17 22)",
    content: {
      en: [
        "Rudrabhishek is a sacred bathing ritual dedicated to Lord Shiva, specifically in his Rudra form. Mentioned in the ancient Yajurveda, it is considered one of the most powerful spiritual practices in Vedic tradition to invoke peace, eliminate negative planetary influences, and receive divine protection.",
        "During the puja, Lord Shiva—symbolized by the sacred Shiva Lingam—is offered various holy liquids like milk, honey, ghee, sugarcane juice, coconut water, and rose water, accompanied by the continuous chanting of the powerful Sri Rudram. The vibrational energy generated by this chanting purifies the surrounding environment and the minds of the devotees.",
        "Devotees who perform Rudrabhishek with deep devotion report experiencing profound mental peace, purification of past karmas, and the removal of professional and personal obstacles. It is traditionally performed on Mondays, during Shravan Maas, or on Pradosh Vrat days for maximum spiritual benefit."
      ],
      hi: [
        "रुद्राभिषेक भगवान शिव को समर्पित एक पवित्र स्नान अनुष्ठान है, विशेष रूप से उनके रुद्र रूप में। प्राचीन यजुर्वेद में उल्लेखित, इसे शांति का आह्वान करने, नकारात्मक ग्रहीय प्रभावों को समाप्त करने और दिव्य सुरक्षा प्राप्त करने के लिए वैदिक परंपरा में सबसे शक्तिशाली आध्यात्मिक प्रथाओं में से एक माना जाता है।",
        "पूजा के दौरान, भगवान शिव (पवित्र शिवलिंग द्वारा प्रतीकात्मक) को दूध, शहद, घी, गन्ने का रस, नारियल पानी और गुलाब जल जैसे विभिन्न पवित्र तरल पदार्थ अर्पित किए जाते हैं, जिसके साथ शक्तिशाली श्री रुद्रम का निरंतर जाप किया जाता है। इस जाप से उत्पन्न कंपन ऊर्जा आसपास के वातावरण और भक्तों के मन को शुद्ध करती है।",
        "जो भक्त गहरी भक्ति के साथ रुद्राभिषेक करते हैं, वे गहन मानसिक शांति, पिछले कर्मों की शुद्धि और पेशेवर व व्यक्तिगत बाधाओं को दूर करने का अनुभव करते हैं। अधिकतम आध्यात्मिक लाभ के लिए इसे पारंपरिक रूप से सोमवार, श्रावण मास या प्रदोष व्रत के दिनों में किया जाता है।"
      ],
      gu: [
        "રુદ્રાભિષેક એ ભગવાન શિવને સમર્પિત એક પવિત્ર સ્નાન વિધિ છે, ખાસ કરીને તેમના રુદ્ર સ્વરૂપમાં. પ્રાચીન યજુર્વેદમાં ઉલ્લેખિત, આ વિધિને શાંતિ લાવવા, નકારાત્મક ગ્રહોની અસરોને દૂર કરવા અને દૈવી રક્ષણ મેળવવા માટે વૈદિક પરંપરામાં સૌથી શક્તિશાળી આધ્યાત્મિક સાધનાઓમાંની એક માનવામાં આવે છે.",
        "પૂજા દરમિયાન, ભગવાન શિવ (પવિત્ર શિવલિંગ દ્વારા પ્રતીકાત્મક) ને દૂધ, મધ, ઘી, શેરડીનો રસ, નાળિયેર પાણી અને ગુલાબજળ જેવા વિવિધ પવિત્ર પ્રવાહી અર્પણ કરવામાં આવે છે, જેની સાથે શક્તિશાળી શ્રી રુદ્રમનો સતત જાપ કરવામાં આવે છે. આ જાપથી ઉત્પન્ન થતી કંપન ઊર્જા આસપાસના વાતાવરણ અને ભક્તોના મનને શુદ્ધ કરે છે.",
        "જે ભક્તો ઊંડી ભક્તિ સાથે રુદ્રાભિષેક કરે છે તેઓ માનસિક શાંતિ, ભૂતકાળના કર્મોની શુદ્ધિ અને વ્યવસાયિક તેમજ વ્યક્તિગત અવરોધો દૂર થવાનો અનુભવ કરે છે. મહત્તમ આધ્યાત્મિક લાભ માટે તે પરંપરાગત રીતે સોમવારે, શ્રાવણ માસમાં અથવા પ્રદોષ વ્રતના દિવસોમાં કરવામાં આવે છે."
      ]
    }
  },
  {
    id: 2,
    title: {
      en: "Understanding Navagraha Shanti: A Guide to Planetary Peace",
      hi: "नवग्रह शांति को समझना: ग्रहीय शांति के लिए एक गाइड",
      gu: "નવગ્રહ શાંતિને સમજવી: ગ્રહ શાંતિ માટેનું માર્ગદર્શન"
    },
    excerpt: {
      en: "The nine planets (Navagrahas) exert a powerful influence on human destiny. Learn how Navagraha Shanti puja can harmonize cosmic energies and remove obstacles in your path.",
      hi: "नौ ग्रह (नवग्रह) मानव भाग्य पर एक शक्तिशाली प्रभाव डालते हैं। जानें कि नवग्रह शांति पूजा कैसे ब्रह्मांडीय ऊर्जाओं को सामंजस्य कर सकती है और आपके मार्ग में आने वाली बाधाओं को दूर कर सकती है।",
      gu: "નવ ગ્રહો (નવગ્રહ) માનવ ભાગ્ય પર શક્તિશાળી પ્રભાવ પાડે છે. નવગ્રહ શાંતિ પૂજા કેવી રીતે વૈશ્વિક ઊર્જાને સુમેળ સાધી શકે છે અને તમારા માર્ગમાં આવતી અડચણોને દૂર કરી શકે છે તે જાણો."
    },
    category: {
      en: "Astrology & Pujas",
      hi: "ज्योतिष और पूजा",
      gu: "જ્યોતિષ અને પૂજા"
    },
    readTime: {
      en: "7 min read",
      hi: "7 मिनट पाठ",
      gu: "7 મિનિટ વાંચન"
    },
    date: {
      en: "May 14, 2026",
      hi: "14 मई, 2026",
      gu: "14 મે, 2026"
    },
    image: "/assets/generated/hero-temple.jpg",
    color: "oklch(0.40 0.15 260)",
    content: {
      en: [
        "Navagraha Shanti Puja is a highly revered planetary peace ritual designed to balance and harmonize the energies of the nine major celestial bodies (Navagrahas) in Hindu astrology. These include the Sun (Surya), Moon (Chandra), Mars (Mangal), Mercury (Budha), Jupiter (Guru), Venus (Shukra), Saturn (Shani), Rahu, and Ketu.",
        "Each celestial body governs specific facets of human life, from career and wealth to health and relationships. Negative planetary transits or unfavorable planetary placements in one's birth chart can manifest as persistent obstacles, health challenges, or relationship distress. The Navagraha Shanti puja combines specific Vedic mantras and homam (fire altar rituals) to mitigate these negative effects and invoke protective energies.",
        "Performing this ritual brings positive cosmic alignment, clearing mental fog, restoring stability, and unlocking blocked paths. Our certified pandits perform this ceremony with precise Vedic chants, bringing divine blessings and peace directly to your family."
      ],
      hi: [
        "नवग्रह शांति पूजा एक अत्यधिक पूजनीय ग्रहीय शांति अनुष्ठान है जिसे हिंदू ज्योतिष में नौ प्रमुख आकाशीय पिंडों (नवग्रहों) की ऊर्जाओं को संतुलित और सामंजस्य बनाने के लिए डिज़ाइन किया गया है। इनमें सूर्य, चंद्र, मंगल, बुध, गुरु, शुक्र, शनि, राहु और केतु शामिल हैं।",
        "प्रत्येक आकाशीय पिंड मानव जीवन के विशिष्ट पहलुओं को नियंत्रित करता है, करियर और धन से लेकर स्वास्थ्य और रिश्तों तक। किसी की जन्म कुंडली में नकारात्मक ग्रहीय गोचर या प्रतिकूल ग्रहीय स्थितियां लगातार बाधाओं, स्वास्थ्य चुनौतियों या संबंध संकट के रूप में प्रकट हो सकती हैं। नवग्रह शांति पूजा इन नकारात्मक प्रभावों को कम करने और सुरक्षात्मक ऊर्जाओं का आह्वान करने के लिए विशिष्ट वैदिक मंत्रों और होमम (अग्नि वेदी अनुष्ठान) को जोड़ती है।",
        "इस अनुष्ठान को करने से सकारात्मक ब्रह्मांडीय संरेखण होता है, मार्शल कोहरा साफ होता है, स्थिरता बहाल होती है और अवरुद्ध रास्ते खुल जाते हैं। हमारे प्रमाणित पंडित इस समारोह को सटीक वैदिक मंत्रोच्चार के साथ करते हैं, जिससे आपके परिवार को सीधे दिव्य आशीर्वाद और शांति मिलती है।"
      ],
      gu: [
        "નવગ્રહ શાંતિ પૂજા એ એક અત્યંત આદરણીય ગ્રહ શાંતિ વિધિ છે જે હિન્દુ જ્યોતિષશાસ્ત્રમાં નવ મુખ્ય અવકાશી પદાર્થો (નવગ્રહો) ની ઊર્જાને સંતુલિત અને સુમેળ કરવા માટે બનાવવામાં આવી છે. આમાં સૂર્ય, ચંદ્ર, મંગળ, બુધ, ગુરુ, શુક્ર, શનિ, રાહુ અને કેતુનો સમાવેશ થાય છે.",
        "દરેક અવકાશી પદાર્થ માનવ જીવનના વિશિષ્ટ પાસાઓનું નિયંત્રણ કરે છે, વ્યવસાય અને સંપત્તિથી લઈને આરોગ્ય અને સંબંધો સુધી. કોઈના જન્મકુંડળીમાં નકારાત્મક ગ્રહોનું ગોચર અથવા પ્રતિકૂળ ગ્રહોની સ્થિતિ સતત અવરોધો, સ્વાસ્થ્ય પડકારો અથવા સંબંધોમાં તણાવ તરીકે પ્રગટ થઈ શકે છે. નવગ્રહ શાંતિ પૂજા આ નકારાત્મક અસરોને ઘટાડવા અને રક્ષણાત્મક ઊર્જા મેળવવા માટે વિશિષ્ટ વૈદિક મંત્રો અને હોમમ (યજ્ઞ) ને જોડે છે.",
        "આ વિધિ કરવાથી હકારાત્મક વૈશ્વિક સંરેખણ થાય છે, માનસિક તણાવ દૂર થાય છે, સ્થિરતા પુનઃસ્થાપિત થાય છે અને અવરોધાયેલા માર્ગો ખુલે છે. અમારા પ્રમાણિત પંડિતો આ વિધિ ચોક્કસ વૈદિક મંત્રોચ્ચાર સાથે કરે છે, જે તમારા પરિવારને સીધા દૈવી આશીર્વાદ અને શાંતિ આપે છે."
      ]
    }
  },
  {
    id: 3,
    title: {
      en: "Griha Pravesh: Welcoming Divine Blessings into Your New Home",
      hi: "गृह प्रवेश: अपने नए घर में दिव्य आशीर्वाद का स्वागत",
      gu: "ગૃહ પ્રવેશ: તમારા નવા ઘરમાં દૈવી આશીર્વાદનું સ્વાગત"
    },
    excerpt: {
      en: "Moving into a new home is a sacred milestone. The Griha Pravesh ceremony purifies the space, invokes positive energies, and ensures prosperity for the family.",
      hi: "नए घर में जाना एक पवित्र मील का पत्थर है। गृह प्रवेश समारोह अंतरिक्ष को शुद्ध करता है, सकारात्मक ऊर्जा का आह्वान करता है और परिवार के लिए समृद्धि सुनिश्चित करता है।",
      gu: "નવા ઘરમાં પ્રવેશ કરવો એ એક પવિત્ર સીમાચિહ્નરૂપ છે. ગૃહ પ્રવેશ વિધિ ઘરને શુદ્ધ કરે છે, હકારાત્મક ઊર્જા લાવે છે અને પરિવાર માટે સમૃદ્ધિની ખાતરી આપે છે."
    },
    category: {
      en: "Home Ceremonies",
      hi: "गृह अनुष्ठान",
      gu: "ગૃહ વિધિઓ"
    },
    readTime: {
      en: "4 min read",
      hi: "4 मिनट पाठ",
      gu: "4 મિનિટ વાંચન"
    },
    date: {
      en: "May 8, 2026",
      hi: "8 मई, 2026",
      gu: "8 મે, 2026"
    },
    image: "/assets/generated/category-graha-shanti.dim_800x500.jpg",
    color: "oklch(0.50 0.16 145)",
    content: {
      en: [
        "Stepping into a new home is one of life's most beautiful milestones, symbolizing new beginnings, fresh aspirations, and positive growth. To ensure that your new living space is filled with divine energy, purity, and prosperity, the ancient Vedic tradition recommends the Griha Pravesh ceremony.",
        "The Griha Pravesh ceremony is not just a housewarming party, but a series of sacred rituals including Vastu Puja, Kalash Pooja, and Ganapati Havan. These rituals are designed to purify the home of any residual negative energy from construction or previous occupants, and to invite Lord Ganesha and Goddess Lakshmi to reside in the house.",
        "Proper timing is extremely critical for Griha Pravesh; it must be performed on an auspicious day determined by the lunar calendar (Panchang) and the owner's birth chart. With our experienced pandits trained at sacred centers like Kashi and Ayodhya, you can ensure that every ceremony is performed flawlessly, blessing your family with long-term peace, happiness, and abundant health."
      ],
      hi: [
        "नए घर में कदम रखना जीवन के सबसे खूबसूरत मील के पत्थरों में से एक है, जो नई शुरुआत, नई आकांक्षाओं और सकारात्मक विकास का प्रतीक है। यह सुनिश्चित करने के लिए कि आपका नया रहने का स्थान दिव्य ऊर्जा, पवित्रता और समृद्धि से भरा हो, प्राचीन वैदिक परंपरा गृह प्रवेश समारोह की सिफारिश करती है।",
        "गृह प्रवेश समारोह केवल एक गृहप्रवेश पार्टी नहीं है, बल्कि वास्तु पूजा, कलश पूजा और गणपति हवन सहित पवित्र अनुष्ठानों की एक श्रृंखला है। ये अनुष्ठान घर को निर्माण या पिछले निवासियों से बची हुई किसी भी नकारात्मक ऊर्जा से शुद्ध करने और भगवान गणेश और देवी लक्ष्मी को घर में निवास करने के लिए आमंत्रित करने के लिए डिज़ाइन किए गए हैं।",
        "गृह प्रवेश के लिए सही समय बेहद महत्वपूर्ण है; इसे हिंदू पंचांग और स्वामी की जन्म कुंडली द्वारा निर्धारित एक शुभ दिन पर किया जाना चाहिए। काशी और अयोध्या जैसे पवित्र केंद्रों से प्रशिक्षित हमारे अनुभवी पंडितों के साथ, आप यह सुनिश्चित कर सकते हैं कि हर समारोह त्रुटिहीन रूप से किया जाए, जिससे आपके परिवार को दीर्घकालिक शांति, खुशी और प्रचुर स्वास्थ्य का आशीर्वाद मिले।"
      ],
      gu: [
        "નવા ઘરમાં પ્રવેશ કરવો એ જીવનના સૌથી સુંદર સીમાચિહ્નોમાંનું એક છે, જે નવી શરૂઆત, નવી આકાંક્ષાઓ અને હકારાત્મક વૃદ્ધિનું પ્રતીક છે. તમારું નવું રહેવાનું સ્થાન દૈવી ઊર્જા, પવિત્રતા અને સમૃદ્ધિથી ભરેલું રહે તે સુનિશ્ચિત કરવા માટે, પ્રાચીન વૈદિક પરંપરા ગૃહ પ્રવેશ વિધિની ભલામણ કરે છે.",
        "ગૃહ પ્રવેશ વિધિ એ માત્ર એક સામાન્ય પ્રસંગ નથી, પરંતુ વાસ્તુ પૂજા, કળશ પૂજા અને ગણપતિ હવન સહિતની પવિત્ર વિધિઓની શ્રેણી છે. આ વિધિઓ ઘરને બાંધકામ અથવા પાછલા રહેવાસીઓની કોઈપણ નકારાત્મક ઊર્જાથી શુદ્ધ કરવા અને ભગવાન ગણેશ અને દેવી લક્ષ્મીને ઘરમાં રહેવા આમંત્રણ આપવા માટે રચાયેલ છે.",
        "ગૃહ પ્રવેશ માટે યોગ્ય સમય ખૂબ જ મહત્વપૂર્ણ છે; તે હિન્દુ પંચાંગ અને માલિકની જન્મકુંડળી દ્વારા નક્કી કરાયેલા શુભ દિવસે જ થવો જોઈએ. કાશી અને અયોધ્યા જેવા પવિત્ર કેન્દ્રોથી શિક્ષિત અમારા અનુભવી પંડિતો સાથે, તમે ખાતરી કરી શકો છો કે દરેક વિધિ યોગ્ય રીતે થાય, જેથી તમારા પરિવારને લાંબા ગાળાની શાંતિ, સુખ અને સમૃદ્ધિ મળે."
      ]
    }
  },
  {
    id: 4,
    title: {
      en: "Satyanarayan Katha: The Story Behind the Most Popular Puja",
      hi: "सत्यनारायण कथा: सबसे लोकप्रिय पूजा के पीछे की कहानी",
      gu: "સત્યનારાયણ કથા: સૌથી લોકપ્રિય પૂજા પાછળની વાર્તા"
    },
    excerpt: {
      en: "Satyanarayan Puja is performed in millions of homes across India for blessings, prosperity, and thanksgiving. Here's a deep dive into its mythology, significance, and proper procedure.",
      hi: "आशीर्वाद, समृद्धि और धन्यवाद के लिए पूरे भारत में लाखों घरों में सत्यनारायण पूजा की जाती है। यहाँ इसके पौराणिक कथाओं, महत्व और सही प्रक्रिया के बारे में विस्तार से बताया गया है।",
      gu: "આશીર્વાદ, સમૃદ્ધિ અને કૃતજ્ઞતા માટે ભારતભરમાં લાખો ઘરોમાં સત્યનારાયણ પૂજા કરવામાં આવે છે. અહીં તેના મહત્વ, પુરાણો અને સાચી પદ્ધતિ વિશે વિગતવાર માહિતી આપી છે."
    },
    category: {
      en: "Mythology",
      hi: "पौराणिक कथाएँ",
      gu: "પૌરાણિક કથાઓ"
    },
    readTime: {
      en: "6 min read",
      hi: "6 मिनट पाठ",
      gu: "6 મિનિટ વાંચન"
    },
    date: {
      en: "April 30, 2026",
      hi: "30 अप्रैल, 2026",
      gu: "30 એપ્રિલ, 2026"
    },
    image: "/assets/generated/category-dev-pooja.dim_800x500.jpg",
    color: "oklch(0.60 0.18 55)",
    content: {
      en: [
        "The Sri Satyanarayan Puja is perhaps the most widely performed household ritual across India, transcending community boundaries. Dedicated to Lord Vishnu in his embodiment of absolute Truth (Satya), this ceremony is performed to express gratitude during auspicious life milestones or to invoke peace and resolve household challenges.",
        "The core of the Satyanarayan Puja is the reading of the Satyanarayan Katha—a compilation of moral and divine stories that emphasize the power of faith, devotion, and alignment with the truth. The ceremony is simple yet profound, involving the preparation of sacred Prasad (sheera/halwa made from wheat flour, sugar, ghee, and milk) and offerings of fruits and flowers.",
        "Performing the Satyanarayan Puja brings family members together, fostering harmony, spiritual grounding, and mutual respect. It is traditionally performed on Purnima (full moon day), Ekadashi, or during major family milestones such as purchasing a new asset, getting a job, or wedding anniversaries."
      ],
      hi: [
        "श्री सत्यनारायण पूजा शायद पूरे भारत में सबसे व्यापक रूप से किया जाने वाला घरेलू अनुष्ठान है, जो सामुदायिक सीमाओं से परे है। पूर्ण सत्य (सत्य) के अवतार में भगवान विष्णु को समर्पित, यह समारोह शुभ जीवन के मील के पत्थरों के दौरान आभार व्यक्त करने या शांति का आह्वान करने और घरेलू चुनौतियों का समाधान करने के लिए किया जाता है।",
        "सत्यनारायण पूजा का मुख्य भाग सत्यनारायण कथा का पाठ है—नैतिक और दिव्य कहानियों का एक संकलन जो विश्वास, भक्ति और सत्य के साथ संरेखण की शक्ति पर जोर देता है। यह समारोह सरल लेकिन गहरा है, जिसमें पवित्र प्रसाद (गेहूं के आटे, चीनी, घी और दूध से बना शीरा/हलवा) की तैयारी और फलों व फूलों का अर्पण शामिल है।",
        "सत्यनारायण पूजा करने से परिवार के सदस्य एक साथ आते हैं, जिससे सद्भाव, आध्यात्मिक आधार और पारस्परिक सम्मान को बढ़ावा मिलता है। यह पारंपरिक रूप से पूर्णिमा (पूर्णिमा के दिन), एकादशी, या परिवार के बड़े मील के पत्थरों जैसे कि नया घर या संपत्ति खरीदने, नौकरी मिलने या शादी की सालगिरह के दौरान किया जाता है।"
      ],
      gu: [
        "શ્રી સત્યનારાયણ પૂજા એ કદાચ ભારતભરમાં સૌથી વધુ પ્રમાણમાં કરવામાં આવતી ઘરગથ્થુ વિધિ છે, જે તમામ સમુદાયોમાં આદરણીય છે. સંપૂર્ણ સત્યના અવતાર તરીકે ભગવાન વિષ્ણુને સમર્પિત, આ પ્રસંગ જીવનના શુભ પ્રસંગોએ કૃતજ્ઞતા વ્યક્ત કરવા અથવા શાંતિ લાવવા અને ઘરના અવરોધો દૂર કરવા માટે કરવામાં આવે છે.",
        "સત્યનારાયણ પૂજાનો મુખ્ય ભાગ સત્યનારાયણ કથાનું વાંચન છે—જે નૈતિક અને દૈવી વાર્તાઓનો સંગ્રહ છે જે શ્રદ્ધા, ભક્તિ અને સત્યની શક્તિ પર ભાર મૂકે છે. આ વિધિ સરળ છતાં ગહન છે, જેમાં પવિત્ર પ્રસાદ (ઘઉંનો લોટ, ખાંડ, ઘી અને દૂધમાંથી બનાવેલ શીરો) અને ફળો તેમજ ફૂલો અર્પણ કરવામાં આવે છે.",
        "સત્યનારાયણ પૂજા કરવાથી પરિવારના સભ્યો એકઠા થાય છે, જેથી ઘરમાં સુમેળ, આધ્યાત્મિક શાંતિ અને પરસ્પર આદર વધે છે. તે સામાન્ય રીતે પૂનમ (પૂર્ણિમા), એકાદશી અથવા પરિવારના મહત્વના પ્રસંગો જેમ કે નવી મિલકત ખરીદવી, નોકરી મળવી અથવા લગ્નની વર્ષગાંઠ જેવા શુભ સમયે કરવામાં આવે છે."
      ]
    }
  },
  {
    id: 5,
    title: {
      en: "How to Prepare for a Vedic Puja at Home",
      hi: "घर पर वैदिक पूजा की तैयारी कैसे करें",
      gu: "ઘરે વૈદિક પૂજાની તૈયારી કેવી રીતે કરવી"
    },
    excerpt: {
      en: "Whether you are hosting a small puja or a grand ceremony, proper preparation is key. From gathering materials to creating a sacred space — here's everything you need to know.",
      hi: "चाहे आप एक छोटी पूजा की मेजबानी कर रहे हों या एक भव्य समारोह की, उचित तैयारी महत्वपूर्ण है। सामग्री इकट्ठा करने से लेकर एक पवित्र स्थान बनाने तक - यहाँ वह सब कुछ है जो आपको जानना आवश्यक है।",
      gu: "તમે નાની પૂજા ગોઠવતા હોવ કે મોટો યજ્ઞ, યોગ્ય તૈયારી એ ચાવી છે. પૂજા સામગ્રી એકત્ર કરવાથી લઈને પવિત્ર સ્થાન તૈયાર કરવા સુધી - અહીં બધી માહિતી છે જે તમારે જાણવી જરૂરી છે."
    },
    category: {
      en: "Tips & Guides",
      hi: "सुझाव और निर्देश",
      gu: "ટીપ્સ અને માર્ગદર્શિકા"
    },
    readTime: {
      en: "5 min read",
      hi: "5 मिनट पाठ",
      gu: "5 મિનિટ વાંચન"
    },
    date: {
      en: "April 22, 2026",
      hi: "22 अप्रैल, 2026",
      gu: "22 એપ્રિલ, 2026"
    },
    image: "/assets/generated/category-dosh-nivaran.dim_800x500.jpg",
    color: "oklch(0.45 0.14 30)",
    content: {
      en: [
        "Preparing for a Vedic puja at home can feel overwhelming, but a structured approach can transform it into a deeply meditative and joyous process. Proper preparations ensure that the ritual proceeds smoothly, allowing you and your family to fully immerse in the divine energies of the prayers.",
        "The first step is selecting the sacred area (Altar or Mandir), ensuring it is thoroughly cleaned, decorated with fresh flowers, and oriented facing East or North. The next phase involves organizing the essential materials (Pooja Samagri) such as Akshata (sacred rice), copper kalash, incense sticks, oil lamps, camphor, sandalwood paste, and fresh fruits or sweets for naivedya.",
        "Beyond physical preparations, mental preparation is equally vital. Approaching the ritual with a clean body, wearing traditional attire, and cultivating a peaceful state of mind enhances your spiritual receptivity. Our pandits provide a detailed checklist tailored to your specific puja to make the preparation effortless."
      ],
      hi: [
        "घर पर वैदिक पूजा की तैयारी करना भारी लग सकता है, लेकिन एक व्यवस्थित दृष्टिकोण इसे एक गहरे ध्यान और आनंदमयी प्रक्रिया में बदल सकता है। उचित तैयारी यह सुनिश्चित करती है कि अनुष्ठान सुचारू रूप से चले, जिससे आप और आपका परिवार प्रार्थनाओं की दिव्य ऊर्जाओं में पूरी तरह से लीन हो सकें।",
        "पहला कदम पवित्र क्षेत्र (वेदी या मंदिर) का चयन करना है, यह सुनिश्चित करना कि यह पूरी तरह से साफ हो, ताजे फूलों से सजाया गया हो, और पूर्व या उत्तर की ओर उन्मुख हो। अगले चरण में आवश्यक सामग्री (पूजा सामग्री) जैसे अक्षत (पवित्र चावल), तांबे का कलश, धूपबत्ती, तेल के दीपक, कपूर, चंदन का पेस्ट और नैवेद्य के लिए ताजे फल या मिठाइयाँ व्यवस्थित करना शामिल है।",
        "शारीरिक तैयारियों के अलावा, मानसिक तैयारी भी उतनी ही महत्वपूर्ण है। स्वच्छ शरीर के साथ अनुष्ठान करना, पारंपरिक पोशाक पहनना और मन की शांति विकसित करना आपकी आध्यात्मिक संवेदनशीलता को बढ़ाता है। हमारे पंडित आपकी तैयारी को आसान बनाने के लिए आपकी विशिष्ट पूजा के अनुसार एक विस्तृत चेकलिस्ट प्रदान करते हैं।"
      ],
      gu: [
        "ઘરે વૈદિક પૂજાની તૈયારી કરવી ક્યારેક અઘરી લાગી શકે છે, પરંતુ પદ્ધતિસરનો અભિગમ તેને એક ગહન ધ્યાન અને આનંદદાયક પ્રક્રિયામાં ફેરવી શકે છે. યોગ્ય તૈયારી એ સુનિશ્ચિત કરે છે કે વિધિ સરળતાથી ચાલે, જેથી તમે અને તમારો પરિવાર પૂજાની દૈવી ઊર્જામાં સંપૂર્ણપણે લીન થઈ શકો.",
        "પ્રથમ પગલું પવિત્ર સ્થાન (મંદિર અથવા બાજઠ) પસંદ કરવાનું છે, તે સંપૂર્ણપણે સ્વચ્છ છે તેની ખાતરી કરવી, તેને તાજા ફૂલોથી શણગારવું અને પૂર્વ કે ઉત્તર દિશા તરફ ગોઠવવું. આગામી તબક્કામાં પૂજાની જરૂરી સામગ્રી જેમ કે અક્ષત (પવિત્ર ચોખા), તાંબાનો કળશ, અગરબત્તી, તેલનો દીવો, કપૂર, ચંદન અને પ્રસાદ માટે તાજા ફળો અથવા મીઠાઈઓ ગોઠવવાનો સમાવેશ થાય છે.",
        "આધ્યાત્મિક તૈયારીઓ ઉપરાંત, માનસિક તૈયારી પણ એટલી જ મહત્વપૂર્ણ છે. સ્વચ્છ શરીર સાથે વિધિ કરવી, પરંપરાગત પોશાક પહેરવો અને મનની શાંતિ જાળવવી તમારી આધ્યાત્મિક શક્તિને વધારે છે. અમારા પંડિતો તમારી પૂજાને સરળ બનાવવા માટે ચોક્કસ પૂજા સામગ્રીની વિગતવાર યાદી પૂરી પાડે છે."
      ]
    }
  },
  {
    id: 6,
    title: {
      en: "The Science and Spirituality of Mantra Chanting",
      hi: "मंत्र जाप का विज्ञान और आध्यात्मिकता",
      gu: "મંત્ર જાપનું વિજ્ઞાન અને આધ્યાત્મિકતા"
    },
    excerpt: {
      en: "Ancient Vedic mantras are not just prayers — they are vibrational tools that affect the mind, body, and spirit. Explore the spiritual and scientific basis behind mantra-based rituals.",
      hi: "प्राचीन वैदिक मंत्र केवल प्रार्थना नहीं हैं - वे कंपन उपकरण हैं जो मन, शरीर और आत्मा को प्रभावित करते हैं। मंत्र-आधारित अनुष्ठानों के पीछे के आध्यात्मिक और वैज्ञानिक आधार का पता लगाएं।",
      gu: "પ્રાચીન વૈદિક મંત્રો માત્ર પ્રાર્થના નથી - તે કંપન ઉત્પન્ન કરતું આધ્યાત્મિક સાધન છે જે મન, શરીર અને આત્માને અસર કરે છે. મંત્ર આધારિત વિધિઓ પાછળના વૈજ્ઞાનિક આધારને જાણો."
    },
    category: {
      en: "Spirituality",
      hi: "आध्यात्मिकता",
      gu: "આધ્યાત્મિકતા"
    },
    readTime: {
      en: "8 min read",
      hi: "8 मिनट पाठ",
      gu: "8 મિનિટ વાંચન"
    },
    date: {
      en: "April 15, 2026",
      hi: "15 अप्रैल, 2026",
      gu: "15 એપ્રિલ, 2026"
    },
    image: "/assets/generated/category-nakshatra-shanti.dim_800x500.jpg",
    color: "oklch(0.35 0.12 280)",
    content: {
      en: [
        "In the Vedic tradition, mantras are not mere words or chants; they are sacred sound frequencies that act as precise spiritual keys. Modern science is beginning to discover what ancient sages knew thousands of years ago: that sound vibration has a profound impact on physical matter, neural pathways, and the human nervous system.",
        "When we chant a mantra like the Gayatri Mantra or Maha Mrityunjaya Mantra, the specific combination of syllables creates resonance in our skull and stimulates the endocrine glands. This helps lower stress hormones, enhance concentration, and promote a deep state of physiological relaxation, while spiritually purifying our aura and aligning our energy centers (chakras).",
        "Consistent chanting cultivates a disciplined mind, emotional stability, and a stronger connection to the divine. Incorporating even 10-15 minutes of conscious, rhythmic chanting into your daily routine can bring massive positive transformations to your physical health and spiritual well-being."
      ],
      hi: [
        "वैदिक परंपरा में, मंत्र केवल शब्द या भजन नहीं हैं; वे पवित्र ध्वनि आवृत्तियां हैं जो सटीक आध्यात्मिक कुंजियों के रूप में कार्य करती हैं। आधुनिक विज्ञान अब यह खोजने लगा है कि प्राचीन ऋषियों को हजारों साल पहले क्या पता था: कि ध्वनि कंपन का भौतिक पदार्थ, तंत्रिका पथ और मानव तंत्रिका तंत्र पर गहरा प्रभाव पड़ता है।",
        "जब हम गायत्री मंत्र या महामृत्युंजय मंत्र जैसे मंत्र का जाप करते हैं, तो अक्षरों का विशिष्ट संयोजन हमारी खोपड़ी में प्रतिध्वनि पैदा करता है और अंतःस्रावी ग्रंथियों को उत्तेजित करता है। यह तनाव हार्मोन को कम करने, एकाग्रता बढ़ाने और शारीरिक विश्राम की गहरी स्थिति को बढ़ावा देने में मदद करता है, जबकि हमारे आभामंडल (आभा) को आध्यात्मिक रूप से शुद्ध करता है और हमारे ऊर्जा केंद्रों (चक्रों) को संरेखित करता है।",
        "लगातार जाप करने से अनुशासित मन, भावनात्मक स्थिरता और परमात्मा के साथ एक मजबूत संबंध विकसित होता है। अपनी दैनिक दिनचर्या में सचेत, लयबद्ध जाप के केवल 10-15 मिनट शामिल करने से आपके शारीरिक स्वास्थ्य और आध्यात्मिक कल्याण में बड़े सकारात्मक बदलाव आ सकते हैं।"
      ],
      gu: [
        "વૈદિક પરંપરામાં, મંત્રો એ માત્ર શબ્દો નથી; તેઓ પવિત્ર ધ્વનિ તરંગો છે જે ચોક્કસ આધ્યાત્મિક ચાવીઓ તરીકે કાર્ય કરે છે. આધુનિક વિજ્ઞાન હવે તે શોધી રહ્યું છે જે હજારો વર્ષો પહેલા પ્રાચીન ઋષિઓ જાણતા હતા: કે ધ્વનિ કંપન ભૌતિક પદાર્થ, ચેતાતંત્ર અને માનવ મગજ પર ઊંડી અસર કરે છે.",
        "જ્યારે આપણે ગાયત્રી મંત્ર કે મહામૃત્યુંજય મંત્ર જેવા મંત્રનો જાપ કરીએ છીએ, ત્યારે શબ્દોનું વિશિષ્ટ સંયોજન આપણા મગજમાં ધ્વનિ કંપન પેદા કરે છે અને ગ્રંથીઓને ઉત્તેજિત કરે છે. આ તણાવ હોર્મોન્સને ઘટાડવામાં, એકાગ્રતા વધારવામાં અને શારીરિક આરામની ઊંડી સ્થિતિને પ્રોત્સાહન આપવામાં મદદ કરે છે, જ્યારે આપણી આસપાસની ઊર્જાને આધ્યાત્મિક રીતે શુદ્ધ કરે છે.",
        "નિયમિત મંત્ર જાપ કરવાથી મનની એકાગ્રતા, ભાવનાત્મક સ્થિરતા અને પરમાત્મા સાથે ગાઢ સંબંધ કેળવાય છે. તમારી દૈનિક દિનચર્યામાં માત્ર ૧૦-૧૫ મિનિટ સુધી મંત્ર જાપ સામેલ કરવાથી તમારા સ્વાસ્થ્ય અને આધ્યાત્મિક સુખમાં મોટો હકારાત્મક બદલાવ આવી શકે છે."
      ]
    }
  }
];

function BlogPage({ onNavigate, language }: { onNavigate: (page: Page, key?: string | number) => void; language: Lang }) {
  const categories = ["All", ...Array.from(new Set(blogPosts.map(p => p.category[language] || p.category.en)))];
  const [activeCategory, setActiveCategory] = React.useState("All");
  
  const filtered = activeCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(p => (p.category[language] || p.category.en) === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-white/70 font-body font-medium text-sm tracking-wider uppercase block mb-3">
            {blogT.ourJournal[language]}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {blogT.wisdomInsights[language]}
          </h1>
          <p className="font-body text-white/85 text-lg max-w-2xl mx-auto">
            {blogT.wisdomDesc[language]}
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-saffron-50 border-b border-gold-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-body font-semibold transition-all ${
                  activeCategory === cat
                    ? "btn-primary"
                    : "bg-white text-maroon-700 border border-gold-200 hover:bg-saffron-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(post => (
              <article
                key={post.id}
                onClick={() => onNavigate("blog-detail", post.id)}
                className="bg-white rounded-2xl overflow-hidden border border-gold-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title[language] || post.title.en}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0" style={{ background: `${post.color}55` }} />
                  <span
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-body font-semibold text-white"
                    style={{ background: post.color }}
                  >
                    {post.category[language] || post.category.en}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-body mb-3">
                    <span>{post.date[language] || post.date.en}</span>
                    <span>·</span>
                    <span>{post.readTime[language] || post.readTime.en}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-maroon-700 mb-3 leading-snug group-hover:text-saffron-700 transition-colors">
                    {post.title[language] || post.title.en}
                  </h2>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {post.excerpt[language] || post.excerpt.en}
                  </p>
                  <div className="mt-5 flex items-center gap-1 text-saffron-600 text-sm font-semibold font-body">
                    {blogT.readArticle[language]}
                    <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-saffron-50 om-pattern">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-maroon-600 mb-4">
            {blogT.readyToBook[language]}
          </h2>
          <p className="font-body text-muted-foreground mb-8">
            {blogT.readyToBookDesc[language]}
          </p>
          <button
            type="button"
            onClick={() => onNavigate("book")}
            className="btn-primary px-8 py-3.5 rounded-full font-body text-sm"
          >
            {blogT.bookNow[language]}
          </button>
        </div>
      </section>
    </>
  );
}

interface BlogDetailPageProps {
  postId: number | null;
  onNavigate: (page: Page, key?: string | number) => void;
  language: Lang;
}

function BlogDetailPage({ postId, onNavigate, language }: BlogDetailPageProps) {
  const post = blogPosts.find(p => p.id === postId);

  if (!post) {
    return (
      <section className="py-24 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-body text-lg text-muted-foreground mb-6">
            {blogT.articleNotFound[language]}
          </p>
          <button
            type="button"
            onClick={() => onNavigate("blog")}
            className="btn-primary px-6 py-3 rounded-full"
          >
            {blogT.backToBlog[language]}
          </button>
        </div>
      </section>
    );
  }

  // Find recent/recommended posts (excluding current one, max 3)
  const relatedPosts = blogPosts.filter(p => p.id !== post.id).slice(0, 3);

  return (
    <>
      {/* Article Hero/Header */}
      <section className="pt-28 pb-12 bg-saffron-50 border-b border-gold-100">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <button
            onClick={() => onNavigate("blog")}
            className="flex items-center gap-2 text-saffron-700 hover:text-maroon-700 transition text-sm font-semibold font-body mb-6"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            {blogT.backToBlog[language]}
          </button>

          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-body font-semibold text-white mb-4"
            style={{ background: post.color }}
          >
            {post.category[language] || post.category.en}
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-maroon-800 mb-6 leading-tight">
            {post.title[language] || post.title.en}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-body">
            <span>{blogT.publishedOn[language]} <strong>{post.date[language] || post.date.en}</strong></span>
            <span>•</span>
            <span>{post.readTime[language] || post.readTime.en}</span>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Layout */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Main Content Column */}
            <div className="lg:col-span-2">
              {/* Featured Image */}
              <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden mb-10 shadow-sm border border-gold-100">
                <img
                  src={post.image}
                  alt={post.title[language] || post.title.en}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: `${post.color}15` }} />
              </div>

              {/* Rich Article Body */}
              <div className="font-body text-base md:text-lg text-gray-800 leading-relaxed space-y-6">
                {(post.content[language] || post.content.en).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {/* Dynamic Quote Box */}
              <div className="my-10 p-8 rounded-3xl border-l-4 bg-saffron-50/50 flex flex-col gap-3" style={{ borderColor: post.color }}>
                <Feather className="w-8 h-8 text-saffron-600" />
                <p className="font-display text-xl font-bold italic text-maroon-700">
                  {language === "hi" 
                    ? "\"वैदिक अनुष्ठान केवल प्रतीकात्मक प्रथाएं नहीं हैं; वे मानवीय चेतना को ऊपर उठाने और पूर्ण ब्रह्मांडीय सद्भाव लाने के लिए डिज़ाइन किए गए आध्यात्मिक विज्ञान हैं।\""
                    : language === "gu"
                    ? "\"વૈદિક વિધિઓ માત્ર પ્રતીકાત્મક પ્રથાઓ નથી; તેઓ માનવ ચેતનાને ઉન્નત કરવા અને સંપૂર્ણ વૈશ્વિક સંવાદિતા લાવવા માટે રચાયેલ આધ્યાત્મિક વિજ્ઞાન છે.\""
                    : "\"Vedic rituals are not merely symbolic practices; they are spiritual sciences designed to elevate the human consciousness and bring complete cosmic harmony.\""
                  }
                </p>
                <span className="text-sm font-semibold font-body text-muted-foreground">— SatkarmPuja Vedic Council</span>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-10">
              {/* Quick Booking Call-Out */}
              <div className="gradient-gold rounded-3xl p-8 text-center text-white shadow-glow-gold relative overflow-hidden">
                <div className="relative z-10">
                  <Flame className="w-10 h-10 mx-auto mb-4 text-white animate-pulse" />
                  <h3 className="font-display text-2xl font-bold mb-3">{blogT.experienceBlessings[language]}</h3>
                  <p className="font-body text-white/90 text-sm mb-6 leading-relaxed">
                    {blogT.sidebarDesc[language]}
                  </p>
                  <button
                    onClick={() => onNavigate("book")}
                    className="w-full py-3.5 bg-white text-saffron-700 hover:bg-saffron-50 transition rounded-full font-body text-sm font-bold shadow-md"
                  >
                    {blogT.bookNow[language]}
                  </button>
                </div>
              </div>

              {/* Recent/Other Articles */}
              <div className="bg-saffron-50/50 rounded-3xl p-8 border border-gold-100">
                <h3 className="font-display text-xl font-bold text-maroon-700 mb-6">{blogT.recentArticles[language]}</h3>
                <div className="space-y-6">
                  {relatedPosts.map(related => (
                    <div
                      key={related.id}
                      onClick={() => onNavigate("blog-detail", related.id)}
                      className="group cursor-pointer flex gap-4 items-start"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gold-100">
                        <img src={related.image} alt={related.title[language] || related.title.en} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider font-body text-saffron-700 block mb-1">
                          {related.category[language] || related.category.en}
                        </span>
                        <h4 className="font-display text-sm font-bold text-maroon-800 leading-snug group-hover:text-saffron-600 transition-colors">
                          {related.title[language] || related.title.en}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-saffron-100 om-pattern text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-maroon-700 mb-3">
            {blogT.connectingDevotees[language]}
          </h2>
          <p className="font-body text-muted-foreground mb-6">
            {blogT.footerCtaDesc[language]}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onNavigate("categories")}
              className="btn-primary px-6 py-3 rounded-full font-body text-sm font-semibold"
            >
              {blogT.explorePujas[language]}
            </button>
            <button
              onClick={() => onNavigate("contact")}
              className="bg-white text-maroon-700 border border-gold-300 hover:bg-saffron-50 px-6 py-3 rounded-full font-body text-sm font-semibold transition"
            >
              {blogT.contactUs[language]}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Puja Detail Page ────────────────────────────────────────────────────────
interface PoojaDetailPageProps {
  poojaKey: string;
  onNavigate: (page: Page, poojaKey?: string) => void;
  onSelectPooja: (name: string, categoryId?: string) => void;
  language: Lang;
  poojaPrices?: Record<string, string>;
}

function PoojaDetailPage({
  poojaKey,
  onNavigate,
  onSelectPooja,
  language,
  poojaPrices,
}: PoojaDetailPageProps) {
  const puja = poojaDetails[poojaKey];
  const slug = poojaKey.replace(/-/g, "_");
  const price = poojaPrices?.[poojaKey] || puja?.price;

  const pujaCategory = categories.find(c => c.pujas.includes(keyToFormValue[poojaKey] || ""))?.id;

  if (!puja) {
    return (
      <section className="py-24 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-body text-lg text-muted-foreground mb-6">
            {t("poojaNotFound", language)}
          </p>
          <button
            type="button"
            data-ocid="pooja_detail.back.button"
            onClick={() => onNavigate("categories")}
            className="btn-primary px-6 py-3 rounded-full"
          >
            {t("poojaBackToCategories", language)}
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="gradient-saffron pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <button
            type="button"
            data-ocid="pooja_detail.back.button"
            onClick={() => onNavigate("categories")}
            className="text-white/80 hover:text-white font-body font-medium mb-5 flex items-center gap-2 transition"
          >
            ← {t("poojaBackToCategories", language)}
          </button>
          <div className="flex items-start gap-5">
            <div>
              <span className="font-body text-white/70 text-sm tracking-wider uppercase">
                {optT(`pooja_${slug}_subtitle`, language) ?? puja.subtitle}
              </span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white mt-1">
                {optT(`pooja_${slug}_name`, language) ?? puja.name}
              </h1>
              <p className="font-body text-white/80 mt-2">
                {t("poojaDuration", language)}: {optT(`pooja_${slug}_duration`, language) ?? puja.duration}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 om-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-7">
              {/* Hero Image */}
              {poojaImages[poojaKey] && (
                <div className="rounded-2xl overflow-hidden flex justify-center items-center">
                  <img
                    src={poojaImages[poojaKey]}
                    alt={optT(`pooja_${slug}_name`, language) ?? puja.name}
                    className="w-full max-h-80 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement)
                        .parentElement!.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Description */}
              <div className="bg-white rounded-2xl shadow-card-warm p-7 border border-gold-100">
                <p className="font-body text-foreground text-base leading-relaxed">
                  {optT(`pooja_${slug}_description`, language) ?? puja.description}
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-saffron-50 rounded-2xl p-7 border border-saffron-100">
                <h3 className="font-display text-xl font-bold text-maroon-600 mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 inline-block mr-2 text-saffron-500" /> {t("poojaKeyBenefits", language)}
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {puja.benefits.map((b, i) => {
                    const text = optT(`pooja_${slug}_benefit_${i}`, language) ?? b;
                    return text ? (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-saffron-500 text-base mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4 inline-block text-saffron-500 mr-2" />
                        </span>
                        <span className="font-body text-sm text-maroon-700 leading-relaxed">
                          {text}
                        </span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Process */}
                <div className="bg-blue-50 rounded-2xl p-7 border border-blue-100">
                  <h3 className="font-display text-xl font-bold text-blue-900 mb-5">
                    <RefreshCw className="w-5 h-5 inline-block mr-2 text-saffron-500" /> {t("poojaRitualProcess", language)}
                  </h3>
                  <ol className="space-y-3">
                    {puja.process.map((step, i) => {
                      const text = optT(`pooja_${slug}_process_${i}`, language) ?? step;
                      return text ? (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold font-body">
                            {i + 1}
                          </span>
                          <span className="font-body text-sm text-gray-700 leading-relaxed">
                            {text}
                          </span>
                        </li>
                      ) : null;
                    })}
                  </ol>
                </div>

                {/* Info */}
                <div className="bg-purple-50 rounded-2xl p-7 border border-purple-100">
                  <h3 className="font-display text-xl font-bold text-purple-900 mb-5">
                    <Lightbulb className="w-5 h-5 inline-block mr-2 text-saffron-500" /> {t("poojaImportantInfo", language)}
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <p className="font-body text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
                        {t("poojaBestFor", language)}:
                      </p>
                      <p className="font-body text-sm text-gray-700 leading-relaxed">
                        {optT(`pooja_${slug}_bestFor`, language) ?? puja.bestFor}
                      </p>
                    </div>
                    <div className="border-t border-purple-100 pt-5">
                      <p className="font-body text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
                        {t("poojaWhenToPerform", language)}:
                      </p>
                      <p className="font-body text-sm text-gray-700 leading-relaxed">
                        {optT(`pooja_${slug}_whenToPerform`, language) ?? puja.whenToPerform}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed SEO Friendly Content */}
              {(() => {
                const seoContent = getPoojaSeoContent(
                  poojaKey,
                  language,
                  (optT(`pooja_${slug}_name` as any, language) || puja.name),
                  (optT(`pooja_${slug}_description` as any, language) || puja.description),
                  puja.benefits,
                  puja.process,
                  pujaCategory
                );
                return (
                  <div className="bg-white rounded-2xl shadow-card-warm p-8 border border-gold-100 space-y-8 mt-8">
                    <h2 className="font-display text-2xl font-bold text-maroon-700 pb-3 border-b border-gold-100 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-saffron-500" />
                      {seoContent.title}
                    </h2>
                    {seoContent.sections.map((section, idx) => (
                      <div key={idx} className="space-y-4">
                        <h3 className="font-display text-lg font-bold text-maroon-600">
                          {section.title}
                        </h3>
                        <div className="space-y-3">
                          {section.paragraphs.map((p, pIdx) => {
                            if (idx === seoContent.sections.length - 1) {
                              const isQuestion = p.startsWith('**');
                              const text = p.replace(/\*\*Q: |\*\*A: |\*\*|\*/g, '');
                              return (
                                <p
                                  key={pIdx}
                                  className={`font-body text-sm leading-relaxed ${
                                    isQuestion ? 'text-maroon-700 font-semibold mt-4' : 'text-gray-600 pl-4 border-l-2 border-saffron-300'
                                  }`}
                                >
                                  {text}
                                </p>
                              );
                            }
                            return (
                              <p key={pIdx} className="font-body text-sm text-gray-600 leading-relaxed text-justify">
                                {p}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-card-warm-hover p-7 border border-gold-100 sticky top-24">
                <div className="text-center mb-7 pb-7 border-b border-gold-100">
                  <p className="font-body text-xs tracking-widest text-muted-foreground uppercase mb-2">
                    {t("poojaStartingFrom", language)}
                  </p>
                  <p className="font-display text-4xl font-bold text-gold-700 mb-1">
                    {price}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {t("poojaPriceNote", language)}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    data-ocid="pooja_detail.book.primary_button"
                    onClick={() => {
                      onSelectPooja(keyToFormValue[poojaKey] || puja.name, pujaCategory);
                      onNavigate("book");
                    }}
                    className="w-full btn-primary py-4 rounded-xl text-base"
                  >
                    <ClipboardEdit className="w-5 h-5 inline-block mr-2" /> {t("ctaBookNow", language)}
                  </button>
                  <button
                    type="button"
                    data-ocid="pooja_detail.contact.secondary_button"
                    onClick={() => onNavigate("contact")}
                    className="w-full btn-outline-saffron py-4 rounded-xl text-base font-body"
                  >
                    <MessageCircle className="w-5 h-5 inline-block mr-2" /> {t("poojaAskQuestions", language)}
                  </button>
                </div>

                <div className="bg-saffron-50 rounded-xl p-5 border border-saffron-100">
                  <h4 className="font-body font-semibold text-maroon-600 mb-3 text-sm">
                    {t("poojaWhyChooseUs", language)}
                  </h4>
                  <ul className="space-y-2">
                    {(
                      [
                        "poojaSidebarVerified",
                        "poojaSidebarPricing",
                        "poojaSidebarAuthentic",
                        "poojaSidebarConsult",
                      ] as (keyof typeof TRANSLATIONS)[]
                    ).map((key) => (
                      <li key={key} className="flex items-center gap-2.5">
                        <span className="text-saffron-500 text-sm flex-shrink-0">
                          <Check className="w-4 h-4 inline-block text-saffron-500 mr-2" />
                        </span>
                        <span className="font-body text-sm text-maroon-600">
                          {t(key, language)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: ToastState }) {
  return (
    <div
      className={`toast-container ${toast.visible ? "show" : ""} ${toast.type}`}
    >
      {toast.message}
    </div>
  );
}

// ─── Auth Pages ────────────────────────────────────────────────────────────────
function AuthShell({
  title,
  subtitle,
  language,
  children,
}: {
  title: string;
  subtitle: string;
  language: Lang;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-6rem)] py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 overflow-hidden">
              <div className="h-2 gradient-saffron" />
              <div className="p-10">
                <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-glow-gold mb-6">
                  <Sparkles className="w-8 h-8 inline-block text-saffron-500" />
                </div>
                <h2 className="font-display text-4xl font-bold text-maroon-600 mb-3">
                  {title}
                </h2>
                <p className="font-body text-muted-foreground leading-relaxed mb-8">
                  {subtitle}
                </p>
                <div className="bg-saffron-50 rounded-2xl p-6 border border-saffron-100">
                  <h3 className="font-body font-semibold text-maroon-600 mb-3">
                    {t("authShellWhatYouGetTitle", language)}
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "authShellFeatureTrackStatus",
                      "authShellFeaturePaymentLinks",
                      "authShellFeatureHistory",
                      "authShellFeatureProfile",
                    ].map((key) => (
                      <li key={key} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 inline-block text-saffron-500" />
                        <span className="font-body text-sm text-maroon-600">
                          {t(key as keyof typeof TRANSLATIONS, language)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 overflow-hidden">
            <div className="h-2 gradient-saffron" />
            <div className="p-8 sm:p-10">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoginPage({
  onNavigate,
  onLoggedIn,
  showToast,
  language,
}: {
  onNavigate: (page: Page) => void;
  onLoggedIn: (auth: { token: string; user: AuthUser }) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  language: Lang;
}) {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const isEmail = identifier.includes('@');
      const res = await apiFetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEmail ? { email: identifier.trim() } : { phone: identifier.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        showToast(
          data?.error || t("authLoginFailedGeneric", language),
          "error",
        );
        setIsSubmitting(false);
        return;
      }

      const data = (await res.json()) as { message: string; otp?: string };
      if (data.otp) {
        setOtp(data.otp);
        showToast(`${t("authOtpSentSuccess", language)} (Dev: ${data.otp})`, "success");
      } else {
        showToast(t("authOtpSentSuccess", language), "success");
      }
      setIsOtpSent(true);
    } catch {
      showToast(t("authLoginFailedRetry", language), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const isEmail = identifier.includes('@');
      const res = await apiFetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEmail ? { email: identifier.trim(), otp } : { phone: identifier.trim(), otp }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        showToast(
          data?.error || t("authInvalidOtp", language),
          "error",
        );
        setIsSubmitting(false);
        return;
      }

      const data = (await res.json()) as { token: string; user: AuthUser };
      onLoggedIn(data);
      showToast(t("authWelcomeBackToast", language), "success");
      onNavigate("dashboard");
    } catch {
      showToast(t("authLoginFailedRetry", language), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("authLoginShellTitle", language)}
      subtitle={t("authLoginShellSubtitle", language)}
      language={language}
    >
      <h1 className="font-display text-3xl font-bold text-maroon-600 mb-2">
        {t("authLoginTitle", language)}
      </h1>
      <p className="font-body text-muted-foreground mb-8">
        {t("authLoginSubtitle", language)}
      </p>

      {!isOtpSent ? (
        <>
          <form onSubmit={onRequestOtp} className="space-y-5">
            <div>
              <label
                htmlFor="login-phone"
                className="block font-body text-sm font-semibold text-maroon-700 mb-2"
              >
                Email or Phone Number
              </label>
              <input
                id="login-phone"
                type="text"
                placeholder="Enter your email or phone number"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3.5 rounded-xl text-base shadow-card-warm disabled:opacity-60"
            >
              {isSubmitting
                ? t("authRequestingOtp", language)
                : t("authSendOtp", language)}
            </button>
          </form>
          <p className="mt-6 text-center font-body text-sm text-muted-foreground">
            {t("authNoAccount", language)}{" "}
            <button
              type="button"
              onClick={() => onNavigate("signup")}
              className="font-semibold text-saffron-700 hover:text-saffron-600 transition"
            >
              {t("authCreateOne", language)}
            </button>
          </p>
        </>
      ) : (
        <form onSubmit={onVerifyOtp} className="space-y-5">
          <div>
            <label
              htmlFor="login-otp"
              className="block font-body text-sm font-semibold text-maroon-700 mb-2"
            >
              {t("authOtpLabel", language)}
            </label>
            <input
              id="login-otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300 text-center tracking-widest text-lg font-bold"
              placeholder="••••••"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-3.5 rounded-xl text-base shadow-card-warm disabled:opacity-60"
          >
            {isSubmitting
              ? t("authVerifying", language)
              : t("authVerifyOtp", language)}
          </button>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOtpSent(false)}
              className="text-sm font-body font-medium text-saffron-700 hover:text-saffron-600 transition"
            >
              {t("authChangePhone", language)}
            </button>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                await onRequestOtp(e);
              }}
              disabled={isSubmitting}
              className="text-sm font-body font-medium text-muted-foreground hover:text-maroon-600 transition disabled:opacity-50"
            >
              {t("authResendOtp", language)}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

function SignupPage({
  onNavigate,
  onLoggedIn,
  showToast,
  language,
}: {
  onNavigate: (page: Page) => void;
  onLoggedIn: (auth: { token: string; user: AuthUser }) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  language: Lang;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map countries to their dial codes and states/cities
  const locationData: Record<string, { dialCode: string; states: Record<string, string[]> }> = {
    "India": {
      dialCode: "+91",
      states: {
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Navsari", "Morbi", "Nadiad", "Bharuch"],
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Navi Mumbai", "Kolhapur", "Akola", "Latur"],
        "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Pali", "Chittorgarh"],
        "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Gurgaon", "Noida", "Ghaziabad", "Faridabad"],
        "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Ambattur", "Erode", "Vellore"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Prayagraj", "Ghaziabad", "Bareilly", "Aligarh", "Moradabad", "Saharanpur"],
        "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
        "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Maheshtala", "Rajpur Sonarpur", "Gaya", "Patna"],
        "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Arrah", "Begusarai", "Katihar"],
        "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Pathankot"],
        "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal"],
      }
    },
    "USA": {
      dialCode: "+1",
      states: {
        "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Fresno", "Long Beach"],
        "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi"],
        "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle"],
        "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee", "St. Petersburg", "Hialeah", "Fort Lauderdale"],
        "Illinois": ["Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield"],
        "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton"],
      }
    },
    "UK": {
      dialCode: "+44",
      states: {
        "England": ["London", "Birmingham", "Manchester", "Liverpool", "Leeds", "Sheffield", "Bristol", "Leicester", "Coventry", "Hull"],
        "Scotland": ["Glasgow", "Edinburgh", "Aberdeen", "Dundee", "Inverness", "Perth", "Stirling"],
        "Wales": ["Cardiff", "Swansea", "Newport", "Wrexham", "Bangor", "St Davids"],
        "Northern Ireland": ["Belfast", "Derry", "Lisburn", "Newry", "Armagh"],
      }
    },
    "Canada": {
      dialCode: "+1",
      states: {
        "Ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener"],
        "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Levis"],
        "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Coquitlam", "Kelowna"],
        "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert"],
      }
    },
    "Australia": {
      dialCode: "+61",
      states: {
        "New South Wales": ["Sydney", "Newcastle", "Central Coast", "Wollongong", "Maitland", "Tweed Heads"],
        "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton", "Melton"],
        "Queensland": ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville", "Cairns", "Toowoomba"],
        "Western Australia": ["Perth", "Rockingham", "Mandurah", "Bunbury", "Geraldton"],
      }
    },
    "UAE": {
      dialCode: "+971",
      states: {
        "Dubai": ["Dubai City", "Jebel Ali"],
        "Abu Dhabi": ["Abu Dhabi City", "Al Ain", "Madinat Zayed"],
        "Sharjah": ["Sharjah City", "Khor Fakkan", "Kalba"],
        "Ajman": ["Ajman City"],
        "Fujairah": ["Fujairah City", "Dibba Al-Fujairah"],
      }
    },
  };

  const onCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const data = locationData[newCountry];
    if (data) {
      // Update phone prefix if it's currently a prefix or empty
      const dialCodes = Object.values(locationData).map(d => d.dialCode);
      if (!phone || dialCodes.includes(phone)) {
        setPhone(data.dialCode);
      }
      // Reset state and city if they are not manual
      const states = Object.keys(data.states);
      if (states.length > 0) {
        const firstState = states[0];
        setState(firstState);
        const cities = data.states[firstState];
        if (cities && cities.length > 0) {
          setCity(cities[0]);
        }
      }
    }
  };

  const onStateChange = (newState: string) => {
    setState(newState);
    const cities = locationData[country]?.states[newState];
    if (cities && cities.length > 0) {
      setCity(cities[0]);
    }
  };

  // Initialize data
  useEffect(() => {
    if (!phone) setPhone("+91");
    if (!state) {
      const firstState = Object.keys(locationData["India"].states)[0];
      setState(firstState);
      setCity(locationData["India"].states[firstState][0]);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          city,
          state,
          country,
          role: "user", // Default role
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        showToast(
          data?.error || t("authSignupFailedGeneric", language),
          "error",
        );
        setIsSubmitting(false);
        return;
      }

      const data = (await res.json()) as { token: string; user: AuthUser };
      onLoggedIn(data);
      showToast(t("authSignupSuccess", language), "success");
      onNavigate("dashboard");
    } catch {
      showToast(t("authSignupFailedRetry", language), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("authSignupShellTitle", language)}
      subtitle={t("authSignupShellSubtitle", language)}
      language={language}
    >
      <h1 className="font-display text-3xl font-bold text-maroon-600 mb-2">
        {t("authSignupTitle", language)}
      </h1>
      <p className="font-body text-muted-foreground mb-8">
        {t("authSignupSubtitle", language)}
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
              {t("authFullNameLabel", language)}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              placeholder={t("authFullNamePlaceholder", language)}
            />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
              {t("authEmailLabel", language)}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              placeholder={t("authEmailPlaceholder", language)}
            />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
              {t("authCountryLabel", language)}
            </label>
            <input
              list="countries"
              required
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              placeholder={t("authCountryPlaceholder", language)}
            />
            <datalist id="countries">
              {Object.keys(locationData).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
              {t("authPhoneLabel", language)}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              placeholder={t("authPhonePlaceholder", language)}
            />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
              {t("authStateLabel", language)}
            </label>
            <input
              list="states"
              required
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              placeholder={t("authStatePlaceholder", language)}
            />
            <datalist id="states">
              {Object.keys(locationData[country]?.states || {}).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
              {t("authCityLabel", language)}
            </label>
            <input
              list="cities"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              placeholder={t("authCityPlaceholder", language)}
            />
            <datalist id="cities">
              {(locationData[country]?.states[state] || []).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary py-3.5 rounded-xl text-base shadow-card-warm disabled:opacity-60"
        >
          {isSubmitting
            ? t("authCreatingAccount", language)
            : t("authCreateAccount", language)}
        </button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-muted-foreground">
        {t("authAlreadyHaveAccount", language)}{" "}
        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="font-semibold text-saffron-700 hover:text-saffron-600 transition"
        >
          {t("authLoginLink", language)}
        </button>
      </p>
    </AuthShell>
  );
}

function ShareExperiencePage({
  auth,
  onNavigate,
  showToast,
  language,
}: {
  auth: { token: string; user: AuthUser };
  onNavigate: (page: Page) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  language: Lang;
}) {
  const [myBookings, setMyBookings] = useState<BookingData[]>([]);
  const [puja, setPooja] = useState("");
  const [city, setCity] = useState("");
  const [story, setStory] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/api/bookings/mine", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as BookingData[];
          setMyBookings(data || []);
          const first = (data || [])[0];
          if (first?.pooja_type) setPooja(first.pooja_type);
          if (first?.city) setCity(first.city);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth.token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("pooja", puja);
      formData.append("city", city);
      formData.append("story", story);
      formData.append("rating", String(rating));

      const res = await apiFetch("/api/stories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: formData,
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        showToast(
          data?.error || t("shareSubmitFailedGeneric", language),
          "error",
        );
        return;
      }
      showToast(t("shareSubmitSuccess", language), "success");
      onNavigate("dashboard");
    } catch {
      showToast(t("shareSubmitFailedRetry", language), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("shareShellTitle", language)}
      subtitle={t("shareShellSubtitle", language)}
      language={language}
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-600 mb-2">
            {t("shareTitle", language)}
          </h1>
          <p className="font-body text-muted-foreground">
            {t("shareSubtitle", language)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="px-5 py-2.5 rounded-full text-sm font-body font-semibold bg-white border border-gold-100 text-maroon-700 hover:bg-saffron-50 transition-all"
        >
          {t("shareBack", language)}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
            {t("shareSelectBookingLabel", language)}
          </label>
          <select
            disabled={loading || myBookings.length === 0}
            value=""
            onChange={(e) => {
              const id = e.target.value;
              const b = myBookings.find((x) => (x.id ?? "") === id);
              if (b) {
                setPooja(b.pooja_type);
                setCity(b.city);
              }
            }}
            className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300 disabled:opacity-60"
          >
            <option value="">
              {myBookings.length
                ? t("shareSelectBookingPlaceholderHas", language)
                : t("shareSelectBookingPlaceholderEmpty", language)}
            </option>
            {myBookings.map((b) => (
              <option key={b.id ?? b.created_at} value={b.id ?? ""}>
                {b.pooja_type} • {b.city} • {new Date(b.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
              {t("sharePoojaLabel", language)}
            </label>
            <input
              required
              value={puja}
              onChange={(e) => setPooja(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              placeholder={t("sharePoojaPlaceholder", language)}
            />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
              {t("shareCityLabel", language)}
            </label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              placeholder={t("shareCityPlaceholder", language)}
            />
          </div>
        </div>

        <div>
          <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
            {t("shareRatingLabel", language)}
          </label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} {<Star fill="currentColor" className="w-3 h-3 text-yellow-500 inline-block" />}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm font-semibold text-maroon-700 mb-2">
            {t("shareExperienceLabel", language)}
          </label>
          <textarea
            required
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
            placeholder={t("shareExperiencePlaceholder", language)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary py-3.5 rounded-xl text-base shadow-card-warm disabled:opacity-60"
        >
          {submitting
            ? t("shareSubmitting", language)
            : t("shareSubmitForApproval", language)}
        </button>
      </form>
    </AuthShell>
  );
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

const generateReceipt = async (
  booking: any,
  showToast: (message: string, type?: "success" | "error") => void
) => {
  try {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();

    // 1. Branding Header Section
    // Elegant Maroon Header with Gold Border
    doc.setFillColor(153, 27, 27); // Deep Maroon
    doc.rect(0, 0, 210, 45, "F");
    doc.setFillColor(212, 175, 55); // Gold accent line
    doc.rect(0, 45, 210, 2, "F");

    // Add High-Quality Circular Logo (transparent circular PNG with gold border built in)
    try {
      doc.addImage(LOGO_BASE64, "PNG", 15, 5, 35, 35);
    } catch (e) {
      console.error("Logo failed to load for PDF", e);
    }

    // Header Text - Right Aligned
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("SatkarmPuja", 195, 22, { align: "right" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Online Sacred Puja Services • Authentic & Divine", 195, 32, {
      align: "right",
    });
    doc.text("Vedic Traditions Delivered with Devotion", 195, 38, {
      align: "right",
    });

    // 2. Receipt Title Section
    doc.setTextColor(153, 27, 27); // Maroon
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL RECEIPT", 105, 56, { align: "center" });

    // Draw professional green "PAID" stamp
    try {
      doc.saveGraphicsState();
      doc.setDrawColor(46, 125, 50); // Green
      doc.setLineWidth(1);
      doc.roundedRect(155, 48, 35, 10, 2, 2, "D");
      
      doc.setTextColor(46, 125, 50);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("PAID", 172.5, 55, { align: "center" });
      doc.restoreGraphicsState();
    } catch (e) {
      console.error("Failed to add PAID stamp", e);
    }

    // 3. Transaction Details Table
    const formatDateSafe = (dateVal: any) => {
      if (!dateVal) return "N/A";
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } catch (e) {
        return String(dateVal);
      }
    };

    (doc as any).autoTable({
      startY: 64,
      head: [["Transaction Detail", "Information"]],
      body: [
        ["Booking ID", booking.id || "N/A"],
        ["Pooja Type", booking.pooja_type],
        ["Devotee Name", booking.name],
        ["Devotee Email", booking.email],
        ["Devotee Phone", booking.phone || "N/A"],
        ["City", booking.city],
        ["Booking Date & Time", formatDateSafe(booking.created_at)],
        ["Payment Date & Time", formatDateSafe(booking.created_at)], // Verified upon payment confirmation
        [
          "Scheduled Puja Date & Time",
          booking.poojaDate ? formatDateSafe(booking.poojaDate) : "To Be Finalized",
        ],
        ["Payment Status", "PAID"],
        ["Amount Paid", `INR ${booking.price || 0}`],
        ["Payment Gateway", "Razorpay"],
        ["Order ID", booking.razorpayOrderId || "N/A"],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [153, 27, 27],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
      },
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 3,
        lineColor: [220, 220, 220],
      },
      columnStyles: {
        0: { fontStyle: "bold", width: 65, fillColor: [250, 250, 250] },
      },
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = (doc as any).lastAutoTable.finalY || 150;

    // 4. Puja Preparation & Devotional Instructions Box
    const prepSteps = [
      ["Purity & Clothing:", "Take a bath before the puja and wear clean traditional attire (Dhoti-Kurta or Saree/Salwar)."],
      ["Sacred Prasad:", "Prepare and keep fresh sweets or Panchamrit ready as Prasad offerings for the deity."],
      ["Essential Samagri:", "Keep two bowls (one filled with water, one empty), and a spoon ready for Sankalpa."],
      ["Timing & Connect:", "Please sit ready 5 minutes prior to the scheduled puja time and ensure a stable network connection."],
      ["Devotional Focus:", "Sit with a calm, peaceful mind and a sense of bhakti (devotion) for the sacred Sankalpa pledge."]
    ];

    // Pre-calculate exact box height based on text wrapping (width: 120)
    let bulletAreaHeight = 0;
    const splitSteps = prepSteps.map(([title, desc]) => {
      const splitDesc = doc.splitTextToSize(desc, 120);
      const linesHeight = splitDesc.length * 4.5;
      bulletAreaHeight += linesHeight + 2.5; // line height + padding between points
      return { title, splitDesc };
    });

    const boxHeight = 18 + bulletAreaHeight + 2; // header + bullet area + bottom padding

    // Check if there is enough space for preparation note + footer (we need at least boxHeight + 35 units)
    if (currentY > pageHeight - (boxHeight + 35)) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY += 8;
    }

    // Draw a box with soft saffron/gold cream background and gold border
    doc.setFillColor(255, 248, 240); // Soft saffron cream
    doc.setDrawColor(212, 175, 55); // Gold border
    doc.setLineWidth(0.5);
    doc.roundedRect(15, currentY, 180, boxHeight, 3, 3, "FD");

    // Left vertical border accent
    doc.setFillColor(212, 175, 55); // Gold
    doc.rect(15, currentY, 3, boxHeight, "F");

    // Title (removed emoji to prevent rendering corrupt characters)
    doc.setTextColor(153, 27, 27); // Maroon
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SACRED PUJA PREPARATIONS & DEVOTIONAL GUIDE", 23, currentY + 7);

    // Devotional Note
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "oblique");
    doc.setFontSize(9);
    doc.text(
      "To receive the maximum spiritual benefits of the sacred Vedic rituals, please prepare the following before the puja:",
      23,
      currentY + 13
    );

    // Render Bullet points
    let bulletY = currentY + 19;
    splitSteps.forEach(({ title, splitDesc }) => {
      // Draw small bullet circle
      doc.setFillColor(212, 175, 55); // Gold
      doc.circle(25, bulletY - 1, 0.8, "F");
      
      // Print bold title
      doc.setTextColor(153, 27, 27); // Maroon
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(title, 28, bulletY);
      
      // Print description text (safely wrapped)
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(splitDesc, 65, bulletY);
      
      bulletY += (splitDesc.length * 4.5) + 2.5;
    });

    // 5. Professional Footer Section
    const finalFooterY = currentY + boxHeight;
    let footerY = finalFooterY + 6;
    if (footerY > pageHeight - 40) {
      doc.addPage();
      footerY = 20;
    }

    // Add a horizontal line before footer
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY, 190, footerY);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Thank you for choosing SatkarmPuja for your spiritual journey.",
      105,
      footerY + 10,
      { align: "center" }
    );

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Our services are performed by experienced Pandits following strict Vedic traditions.",
      105,
      footerY + 17,
      { align: "center" }
    );

    // Support & Website Links
    const supportTextPart1 = "Support: namaste@satkarmpuja.com • ";
    const supportTextPart2 = "satkarmpuja.com";
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const part1Width = doc.getTextWidth(supportTextPart1);
    const part2Width = doc.getTextWidth(supportTextPart2);
    const totalSupportWidth = part1Width + part2Width;
    const supportStartX = (210 - totalSupportWidth) / 2;

    doc.setTextColor(153, 27, 27);
    doc.text(supportTextPart1, supportStartX, footerY + 24);
    doc.textWithLink(supportTextPart2, supportStartX + part1Width, footerY + 24, {
      url: "https://satkarmpuja.com"
    });

    // Legal Terms & Privacy Links
    const termsText = "Terms & Conditions";
    const dividerText = " • ";
    const privacyText = "Privacy Policy";
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const termsWidth = doc.getTextWidth(termsText);
    const dividerWidth = doc.getTextWidth(dividerText);
    const privacyWidth = doc.getTextWidth(privacyText);
    const totalLinksWidth = termsWidth + dividerWidth + privacyWidth;
    const linksStartX = (210 - totalLinksWidth) / 2;

    doc.setTextColor(153, 27, 27);
    doc.textWithLink(termsText, linksStartX, footerY + 30, {
      url: "https://satkarmpuja.com/#/terms"
    });
    doc.setTextColor(100, 100, 100);
    doc.text(dividerText, linksStartX + termsWidth, footerY + 30);
    doc.setTextColor(153, 27, 27);
    doc.textWithLink(privacyText, linksStartX + termsWidth + dividerWidth, footerY + 30, {
      url: "https://satkarmpuja.com/#/privacy"
    });

    // Save PDF
    doc.save(`SatkarmPuja_Receipt_${booking.id || "N/A"}.pdf`);
    showToast("Receipt downloaded successfully!", "success");
  } catch (error) {
    console.error("Receipt generation failed:", error);
    showToast("Failed to generate receipt", "error");
  }
};

function DashboardPage({
  auth,
  onLogout,
  onNavigate,
  onUpdateUser,
  showToast,
  language,
}: {
  auth: { token: string; user: AuthUser };
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  onUpdateUser: (user: AuthUser) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  language: Lang;
}) {
  const [myBookings, setMyBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: auth.user.fullName,
    email: auth.user.email || "",
    phone: auth.user.phone || "",
    city: auth.user.city || "",
    state: auth.user.state || "",
    country: auth.user.country || "",
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(profileData),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdateUser(updatedUser);
        setIsEditingProfile(false);
        showToast(t("dashProfileUpdated", language), "success");
      } else {
        showToast(t("dashProfileUpdateFailed", language), "error");
      }
    } catch {
      showToast(t("dashProfileUpdateFailed", language), "error");
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/bookings/mine", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as BookingData[];
        setMyBookings(data || []);
      } else if (res.status === 401) {
        console.warn("Session expired or invalid token. Logging out.");
        onLogout();
      } else {
        showToast(t("dashFailedLoadBookings", language), "error");
      }
    } catch {
      showToast(t("dashFailedLoadBookings", language), "error");
    } finally {
      setLoading(false);
    }
  }, [auth.token, showToast, language]);

  const handlePayment = async (booking: BookingData) => {
    if (!booking.id) return;

    try {
      // Step 1: Create order on backend
      const res = await apiFetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          onLogout();
          return;
        }
        const error = await res.json();
        showToast(error.error || "Failed to initiate payment", "error");
        return;
      }

      const order = await res.json();

      // Step 2: Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
          document.body.appendChild(script);
        });
      }

      // Step 3: Open Razorpay checkout popup
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SatkarmPuja",
        description: `Payment for ${booking.pooja_type}`,
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // Step 4: Verify payment via backend (HMAC signature check)
            const verifyRes = await apiFetch("/api/payments/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`,
              },
              body: JSON.stringify({
                bookingId: booking.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              showToast("Payment successful! 🙏 Your booking is confirmed.", "success");
              load(); // Refresh bookings
            } else {
              const err = await verifyRes.json().catch(() => ({}));
              showToast((err as { error?: string }).error || "Payment verification failed. Contact support.", "error");
            }
          } catch (error) {
            console.error("Verification error:", error);
            showToast("Error verifying payment. Please contact support.", "error");
          }
        },
        prefill: {
          name: auth.user.fullName,
          email: auth.user.email,
          contact: auth.user.phone || "",
        },
        theme: {
          color: "#8B1A1A", // SatkarmPuja maroon brand color
        },
        modal: {
          ondismiss: () => {
            showToast("Payment cancelled. You can retry anytime.", "error");
          },
        },
      };

      const rzp = new window.Razorpay(options as Record<string, unknown>);
      rzp.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      showToast("Error initiating payment. Please try again.", "error");
    }
  };

  // Initial load + light polling for "real-time" updates
  useEffect(() => {
    load();
    const id = window.setInterval(() => {
      load().catch(() => { });
    }, 8000);
    return () => window.clearInterval(id);
  }, [load]);

  const upcomingBookings = myBookings.filter(b => {
    const pDate = b.poojaDate ? new Date(b.poojaDate) : null;
    return b.status !== 'completed' && b.status !== 'pooja-performed' && (!pDate || pDate >= new Date());
  });
  
  const pastBookings = myBookings.filter(b => {
    const pDate = b.poojaDate ? new Date(b.poojaDate) : null;
    return b.status === 'completed' || b.status === 'pooja-performed' || (pDate && pDate < new Date());
  });

  const bookedDates = myBookings
    .filter(b => b.poojaDate)
    .map(b => new Date(b.poojaDate!));

  const renderBookingCard = (b: BookingData) => (
    <div
      key={b.id ?? `${b.created_at}-${b.email}-${b.pooja_type}`}
      className="bg-white border border-gold-100 rounded-2xl p-6 shadow-card-warm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-maroon-600">
            {b.pooja_type}
          </p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {b.city} • {new Date(b.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(b.status === "payment-completed" || b.status === "completed" || b.status === "pooja-performed") && (
            <button
              onClick={() => generateReceipt(b, showToast)}
              className="p-2 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-2 text-xs font-bold"
              title={t("dashDownloadReceipt", language)}
            >
              <Download size={14} />
              <span className="hidden sm:inline">{t("dashDownloadReceipt", language)}</span>
            </button>
          )}
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-body font-semibold border ${b.status === "payment-completed" ||
              b.status === "completed"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : b.status === "payment-pending"
                ? "bg-gold-50 text-gold-800 border-gold-100"
                : b.status === "pooja-performed"
                  ? "bg-teal-50 text-teal-700 border-teal-100"
                  : b.status === "confirmed"
                    ? "bg-saffron-50 text-saffron-700 border-saffron-100"
                    : "bg-purple-50 text-purple-700 border-purple-100"
              }`}
          >
            {b.status === "payment-pending"
              ? t("bookingStatusPaymentPending", language)
              : b.status === "payment-completed" ||
                b.status === "completed"
                ? t("bookingStatusPaymentCompleted", language)
                : b.status === "pooja-performed"
                  ? t("bookingStatusPoojaPerformed", language)
                  : b.status === "confirmed"
                    ? t("bookingStatusConfirmed", language)
                    : b.status === "pending"
                      ? t("bookingStatusPending", language)
                      : b.status.charAt(0).toUpperCase() +
                      b.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Status Progress Tracker */}
      <div className="mt-6 mb-8 px-1 sm:px-0">
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          {/* Background Line (Horizontal on Desktop, Vertical on Mobile) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gold-100 hidden sm:block" />
          <div className="absolute left-[16px] top-2 bottom-2 w-0.5 bg-gold-100 sm:hidden" />
          
          {/* Steps */}
          {[
            { id: 'pending', label: t('dashStepInquiry', language) },
            { id: 'consultation', label: t('dashStepConsultation', language) },
            { id: 'payment-pending', label: t('dashStepPayment', language) },
            { id: 'payment-completed', label: t('dashStepConfirmed', language) },
            { id: 'pooja-performed', label: t('dashStepPerformed', language) }
          ].map((step, idx, arr) => {
            const stepIndex = idx;
            const currentStatusIndex = arr.findIndex(s => s.id === b.status);
            const isCompleted = currentStatusIndex > stepIndex || (b.status === 'completed' && stepIndex <= 3) || (b.status === 'pooja-performed' && stepIndex <= 4);
            const isCurrent = b.status === step.id || (b.status === 'confirmed' && step.id === 'consultation');
            
            return (
              <div key={step.id} className="relative z-10 flex flex-row items-center gap-4 sm:flex-col sm:gap-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                  isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                  isCurrent ? 'bg-white border-saffron-500 text-saffron-600 ring-4 ring-saffron-50' : 
                  'bg-white border-gold-200 text-gold-300'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                </div>
                <span className={`relative top-0 sm:absolute sm:top-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${
                  isCompleted ? 'text-emerald-600' : isCurrent ? 'text-maroon-700' : 'text-gold-300'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-4">
          <p className="font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide">
            {t("dashScheduled", language)}
          </p>
          <p className="font-body text-sm text-maroon-700 mt-1">
            {b.poojaDate
              ? new Date(b.poojaDate).toLocaleString()
              : t("dashNotFinalized", language)}
          </p>
        </div>
        <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-4">
          <p className="font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide">
            {t("dashPrice", language)}
          </p>
          <p className="font-body text-sm text-maroon-700 mt-1">
            {typeof b.price === "number"
              ? `₹${b.price}`
              : t("dashToBeShared", language)}
          </p>
        </div>
      </div>

      {b.status === "payment-pending" && b.price && b.price > 0 ? (
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-gold-100 rounded-2xl p-4">
          <div>
            <p className="font-body text-sm font-semibold text-maroon-700">
              {t("dashPaymentLinkAvailable", language)}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              {t("dashPaymentLinkHint", language)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handlePayment(b)}
            className="btn-primary px-6 py-3 rounded-xl text-sm text-center"
          >
            {t("dashPayNow", language)}
          </button>
        </div>
      ) : null}

      {b.message ? (
        <p className="font-body text-sm text-maroon-700 mt-4 leading-relaxed">
          {b.message}
        </p>
      ) : null}
    </div>
  );

  return (
    <section className="py-14 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 overflow-hidden">
          <div className="h-2 gradient-saffron" />
          <div className="p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl font-bold text-maroon-600">
                  {t("dashWelcome", language)}, {auth.user.fullName}
                </h1>
                <p className="font-body text-muted-foreground mt-1">
                  {t("dashTrackSubtitle", language)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {auth.user.role === "admin" ? (
                  <button
                    type="button"
                    onClick={() => onNavigate("admin")}
                    className="px-5 py-2.5 rounded-full text-sm font-body font-semibold bg-white border border-gold-100 text-maroon-700 hover:bg-saffron-50 transition-all"
                  >
                    {t("dashAdminPanel", language)}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onNavigate("share-experience")}
                  className="px-5 py-2.5 rounded-full text-sm font-body font-semibold bg-white border border-gold-100 text-maroon-700 hover:bg-saffron-50 transition-all"
                >
                  {t("dashShareExperience", language)}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-5 py-2.5 rounded-full text-sm font-body font-semibold border border-gold-200/70 text-maroon-700 hover:bg-saffron-50 transition-all"
                >
                  {t("dashLogout", language)}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-7">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h2 className="font-display text-xl font-bold text-maroon-600">
                    {t("dashMyBookings", language)}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-gold-50 p-1 rounded-xl border border-gold-100">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-saffron-600 shadow-sm" : "text-gold-400 hover:text-gold-600"}`}
                        title="List View"
                      >
                        <List size={18} />
                      </button>
                      <button
                        onClick={() => setViewMode("calendar")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "calendar" ? "bg-white text-saffron-600 shadow-sm" : "text-gold-400 hover:text-gold-600"}`}
                        title="Calendar View"
                      >
                        <CalendarIcon size={18} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => load()}
                      className="p-2 rounded-xl text-maroon-700 bg-white border border-gold-100 hover:bg-saffron-50 transition"
                    >
                      <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {viewMode === "calendar" ? (
                  <Card className="border-gold-100 shadow-card-warm overflow-hidden">
                    <CardHeader className="bg-saffron-50/50 border-b border-gold-100">
                      <CardTitle className="font-display text-lg text-maroon-700">{t("dashCalendar", language)}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-shrink-0 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-2xl border border-gold-100 shadow-sm bg-white"
                            modifiers={{ booked: bookedDates }}
                            modifiersStyles={{ booked: { fontWeight: 'bold', color: '#f59e0b', backgroundColor: '#fffbeb' } }}
                          />
                        </div>
                        <div className="flex-grow space-y-4">
                          <h3 className="font-display font-semibold text-maroon-600 border-b border-gold-100 pb-2">
                            {selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}
                          </h3>
                          {myBookings.filter(b => b.poojaDate && new Date(b.poojaDate).toDateString() === selectedDate?.toDateString()).length > 0 ? (
                            myBookings
                              .filter(b => b.poojaDate && new Date(b.poojaDate).toDateString() === selectedDate?.toDateString())
                              .map(b => (
                                <div key={b.id} className="p-4 rounded-xl bg-saffron-50 border border-saffron-100 flex items-center justify-between">
                                  <div>
                                    <p className="font-display font-bold text-maroon-700">{b.pooja_type}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(b.poojaDate!).toLocaleTimeString()}</p>
                                  </div>
                                  <Badge variant="outline" className="bg-white text-saffron-600 border-saffron-200">{b.status}</Badge>
                                </div>
                              ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic py-4">No events scheduled for this date.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="bg-gold-50 p-1 border border-gold-100 mb-6 w-full sm:w-auto">
                      <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-saffron-600">{t("dashUpcoming", language)} ({upcomingBookings.length})</TabsTrigger>
                      <TabsTrigger value="past" className="data-[state=active]:bg-white data-[state=active]:text-saffron-600">History ({pastBookings.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upcoming" className="space-y-4 outline-none">
                      {loading ? (
                        <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">{t("dashLoading", language)}</div>
                      ) : upcomingBookings.length === 0 ? (
                        <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">{t("dashNoUpcoming", language)}</div>
                      ) : (
                        upcomingBookings.map((b) => renderBookingCard(b))
                      )}
                    </TabsContent>

                    <TabsContent value="past" className="space-y-4 outline-none">
                      {loading ? (
                        <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">{t("dashLoading", language)}</div>
                      ) : pastBookings.length === 0 ? (
                        <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">{t("dashNoPast", language)}</div>
                      ) : (
                        <>
                          {/* Mobile View: Stacked list card layout */}
                          <div className="space-y-3 sm:hidden">
                            {pastBookings.map((b) => (
                              <div key={b.id ?? b.created_at} className="bg-white border border-gold-100 rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <div>
                                    <p className="font-display font-bold text-maroon-700 text-sm leading-snug">{b.pooja_type}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{b.city}</p>
                                  </div>
                                  <button
                                    onClick={() => generateReceipt(b, showToast)}
                                    className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors flex items-center justify-center"
                                    title={t("dashDownloadReceipt", language)}
                                  >
                                    <Download size={15} />
                                  </button>
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-gold-50 pt-2 mt-2">
                                  <span className="text-gold-500 font-medium">Booking Date</span>
                                  <span className="text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Desktop/Tablet View: Table layout */}
                          <div className="hidden sm:block bg-white border border-gold-100 rounded-2xl overflow-hidden shadow-sm">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-saffron-50/50">
                                  <TableHead className="font-bold text-maroon-700">Pooja Type</TableHead>
                                  <TableHead className="font-bold text-maroon-700">City</TableHead>
                                  <TableHead className="font-bold text-maroon-700">Date</TableHead>
                                  <TableHead className="font-bold text-maroon-700 text-right">Receipt</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pastBookings.map((b) => (
                                  <TableRow key={b.id ?? b.created_at} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-maroon-700">{b.pooja_type}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{b.city}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                      <button
                                        onClick={() => generateReceipt(b, showToast)}
                                        className="p-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                                        title={t("dashDownloadReceipt", language)}
                                      >
                                        <Download size={16} />
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-maroon-600">
                    {t("dashProfile", language)}
                  </h2>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs font-semibold text-saffron-600 hover:text-saffron-700 transition-colors"
                  >
                    {isEditingProfile ? t("dashCancel", language) : t("dashEditProfile", language)}
                  </button>
                </div>
                <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6">
                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-maroon-600 uppercase mb-1">Full Name</label>
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gold-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-maroon-600 uppercase mb-1">Email ID</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gold-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-maroon-600 uppercase mb-1">Phone (Cannot be changed)</label>
                        <input
                          type="text"
                          value={profileData.phone}
                          readOnly
                          className="w-full px-3 py-2 rounded-xl border border-gold-100 bg-slate-50 text-muted-foreground text-sm cursor-not-allowed focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-maroon-600 uppercase mb-1">City</label>
                          <input
                            type="text"
                            value={profileData.city}
                            onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gold-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-maroon-600 uppercase mb-1">State</label>
                          <input
                            type="text"
                            value={profileData.state}
                            onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gold-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full btn-primary py-2.5 rounded-xl text-sm font-bold shadow-sm"
                      >
                        {t("dashSaveProfile", language)}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide">
                          Full Name
                        </p>
                        <p className="font-body text-sm text-maroon-700 mt-1">
                          {auth.user.fullName}
                        </p>
                      </div>
                      <div className="border-t border-saffron-100 pt-3">
                        <p className="font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide">
                          {t("dashEmail", language)}
                        </p>
                        <p className="font-body text-sm text-maroon-700 mt-1">
                          {auth.user.email}
                        </p>
                      </div>
                      {auth.user.phone ? (
                        <div className="border-t border-saffron-100 pt-3">
                          <p className="font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide">
                            {t("dashPhone", language)}
                          </p>
                          <p className="font-body text-sm text-maroon-700 mt-1">
                            {auth.user.phone}
                          </p>
                        </div>
                      ) : null}
                      {(auth.user.city || auth.user.state) && (
                        <div className="border-t border-saffron-100 pt-3">
                          <p className="font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide">
                            Location
                          </p>
                          <p className="font-body text-sm text-maroon-700 mt-1">
                            {[auth.user.city, auth.user.state].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminPanelPage({
  auth,
  onNavigate,
  showToast,
  language,
}: {
  auth: { token: string; user: AuthUser };
  onNavigate: (page: Page) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  language: Lang;
}) {
  const [tab, setTab] = useState<
    "overview" | "bookings" | "completed" | "payments" | "users" | "stories" | "popular" | "aboutGallery" | "changePrice"
  >("overview");
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [popularPoojas, setPopularPoojas] = useState<PopularPoojaCard[]>([]);
  const [aboutGallery, setAboutGallery] = useState<AboutPoojaGalleryItem[]>(defaultGallery);
  const [poojaPrices, setPoojaPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [storySearch, setStorySearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [bookingDrafts, setBookingDrafts] = useState<Record<string, any>>({});
  const [bookingDirty, setBookingDirty] = useState<Record<string, boolean>>({});

  const [newPopular, setNewPopular] = useState<Omit<PopularPoojaCard, "id">>({
    title: "",
    description: "",
    price: "",
    icon: "",
    image: "",
    categoryId: "",
    poojaId: "",
  });
  const [newGalleryItem, setNewGalleryItem] = useState<Omit<AboutPoojaGalleryItem, "id">>({
    image: "",
    caption: "",
  });

  const [priceForm, setPriceForm] = useState({
    category: "",
    puja: "",
    price: "",
  });

  const getSuggestedPrice = useCallback((poojaType: string) => {
    const key = poojaMapping[poojaType] || poojaType.toLowerCase().replace(/\s+/g, "-");
    const priceStr = poojaPrices[key] || poojaDetails[key]?.price || "";
    return priceStr.replace(/[^0-9]/g, "");
  }, [poojaPrices]);

  const getCategoryName = useCallback((poojaType: string) => {
    const cat = categories.find(c => c.pujas.includes(poojaType));
    if (cat) {
      const key = `cat_${cat.id}_name` as keyof typeof TRANSLATIONS;
      return TRANSLATIONS[key] ? t(key, language) : cat.id;
    }
    return "Other";
  }, [language]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch prices if we're looking at bookings or price change
      if (tab === "bookings" || tab === "changePrice" || tab === "overview" || tab === "payments") {
        const res = await apiFetch("/api/content/poojaPrices");
        const body = await res.json();
        if (body?.data) setPoojaPrices(body.data);
      }

      if (tab === "overview" || tab === "bookings" || tab === "completed" || tab === "payments" || tab === "users" || tab === "stories") {
        const [bRes, uRes, sRes] = await Promise.all([
          apiFetch("/api/bookings/admin/all", { headers: { Authorization: `Bearer ${auth.token}` } }),
          apiFetch("/api/admin/users", { headers: { Authorization: `Bearer ${auth.token}` } }),
          apiFetch("/api/stories/admin/all", { headers: { Authorization: `Bearer ${auth.token}` } }),
        ]);
        
        const [bData, uData, sData] = await Promise.all([
          bRes.json(), uRes.json(), sRes.json()
        ]);
        
        setBookings(bData || []);
        setUsers(uData || []);
        setStories(sData || []);
      }

      if (tab === "popular") {
        const res = await apiFetch("/api/content/popularPoojas");
        const body = await res.json();
        setPopularPoojas(body?.data || []);
      } else if (tab === "aboutGallery") {
        const res = await apiFetch("/api/content/aboutGallery");
        const body = await res.json();
        if (body?.data) setAboutGallery(body.data);
      }
    } catch {
      showToast(t("adminFailedLoadData", language), "error");
    } finally {
      setLoading(false);
    }
  }, [auth.token, showToast, tab, language]);

  const renderPayments = () => {
    const totalRevenue = bookings
      .filter(b => b.status === "payment-completed" || b.status === "pooja-performed" || b.status === "completed")
      .reduce((acc, b) => acc + (Number(b.price) || 0), 0);
    
    const pendingRevenue = bookings
      .filter(b => b.status === "payment-pending")
      .reduce((acc, b) => acc + (Number(b.price) || 0), 0);

    const paidCount = bookings.filter(b => b.status === "payment-completed" || b.status === "pooja-performed" || b.status === "completed").length;
    const pendingCount = bookings.filter(b => b.status === "payment-pending").length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-emerald-700">₹{totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 mt-2 font-bold uppercase tracking-wider">{paidCount} Successful Payments</p>
            </CardContent>
          </Card>

          <Card className="border-saffron-100 bg-saffron-50/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-saffron-600 mb-1">Pending Revenue</p>
                  <h3 className="text-2xl font-bold text-saffron-700">₹{pendingRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-saffron-100 rounded-xl text-saffron-600">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[10px] text-saffron-600 mt-2 font-bold uppercase tracking-wider">{pendingCount} Waiting for Payment</p>
            </CardContent>
          </Card>

          <Card className="border-maroon-100 bg-maroon-50/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-maroon-600 mb-1">Success Rate</p>
                  <h3 className="text-2xl font-bold text-maroon-700">
                    {bookings.length > 0 ? Math.round((paidCount / bookings.length) * 100) : 0}%
                  </h3>
                </div>
                <div className="p-3 bg-maroon-100 rounded-xl text-maroon-600">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[10px] text-maroon-600 mt-2 font-bold uppercase tracking-wider">Across all bookings</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white border border-gold-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gold-100">
            <input
              type="text"
              placeholder="Search by devotee, phone, pooja or Razorpay ID..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-saffron-50/50">
                <TableHead className="font-bold text-maroon-700">Devotee</TableHead>
                <TableHead className="font-bold text-maroon-700">Pooja & Amount</TableHead>
                <TableHead className="font-bold text-maroon-700">Transaction Info</TableHead>
                <TableHead className="font-bold text-maroon-700">Status</TableHead>
                <TableHead className="font-bold text-maroon-700 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings
                .filter(b => b.status === "payment-pending" || b.status === "payment-completed" || b.status === "pooja-performed" || b.status === "completed")
                .filter(b => {
                  if (!paymentSearch) return true;
                  const search = paymentSearch.toLowerCase();
                  return (
                    b.name?.toLowerCase().includes(search) ||
                    b.phone?.toLowerCase().includes(search) ||
                    b.pooja_type?.toLowerCase().includes(search) ||
                    b.razorpayOrderId?.toLowerCase().includes(search)
                  );
                })
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((b) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-maroon-700 text-sm">{b.name}</div>
                      <div className="text-[10px] text-muted-foreground">{b.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-maroon-600">{b.pooja_type}</div>
                      <div className="text-[10px] text-saffron-600 font-medium">Category: {getCategoryName(b.pooja_type)}</div>
                      <div className="text-xs font-bold text-emerald-600">₹{b.price || 0}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        Razorpay ID: {b.razorpayOrderId || "MANUAL"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(b.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        b.status === "payment-completed" || b.status === "pooja-performed" || b.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-saffron-50 text-saffron-700 border-saffron-100"
                      }`}>
                        {b.status === "payment-pending" ? "Pending" : "Success"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {b.status === "payment-pending" ? (
                        <button
                          onClick={() => updateBooking(b.id, { status: "payment-completed" })}
                          className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                        >
                          Confirm Manual
                        </button>
                      ) : (
                        <button
                          onClick={() => generateReceipt(b, showToast)}
                          className="p-2 text-saffron-600 hover:text-saffron-700 transition-colors"
                          title="Download Receipt"
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const handleUpdatePrice = async () => {
    if (!priceForm.puja || !priceForm.price) {
      showToast("Please select a puja and enter a price", "error");
      return;
    }

    const key = poojaMapping[priceForm.puja] || priceForm.puja.toLowerCase().replace(/\s+/g, "-");
    const newPrices = { ...poojaPrices, [key]: `₹${priceForm.price}` };

    try {
      const res = await apiFetch("/api/content/poojaPrices", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ data: newPrices }),
      });

      if (res.ok) {
        setPoojaPrices(newPrices);
        showToast("Price updated successfully. Refresh to see changes.", "success");
      } else {
        showToast("Failed to update price", "error");
      }
    } catch (err) {
      showToast("Error updating price", "error");
    }
  };

  const renderChangePrice = () => (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-gold-100 shadow-sm">
        <CardHeader className="bg-saffron-50/50 border-b border-gold-100">
          <CardTitle className="text-maroon-700">Update Puja Prices</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-maroon-600 uppercase mb-2">Select Category</label>
            <select
              value={priceForm.category}
              onChange={(e) => setPriceForm({ ...priceForm, category: e.target.value, puja: "" })}
              className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
            >
              <option value="">Choose a category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{t(`cat_${c.id}_name` as any, language)}</option>
              ))}
            </select>
          </div>

          {priceForm.category && (
            <div>
              <label className="block text-xs font-bold text-maroon-600 uppercase mb-2">Select Puja Type</label>
              <select
                value={priceForm.puja}
                onChange={(e) => {
                  const pujaName = e.target.value;
                  const key = poojaMapping[pujaName] || pujaName.toLowerCase().replace(/\s+/g, "-");
                  const currentPrice = poojaPrices[key] || poojaDetails[key]?.price || "";
                  const numericPrice = currentPrice.replace(/[^0-9]/g, "");
                  setPriceForm({ ...priceForm, puja: pujaName, price: numericPrice });
                }}
                className="w-full rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
              >
                <option value="">Choose a puja...</option>
                {categories.find(c => c.id === priceForm.category)?.pujas.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {priceForm.puja && (
            <div>
              <label className="block text-xs font-bold text-maroon-600 uppercase mb-2">New Price (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-600 font-bold">₹</span>
                <input
                  type="number"
                  value={priceForm.price}
                  onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                  className="w-full rounded-xl border border-gold-100 bg-white pl-8 pr-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                  placeholder="Enter amount"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpdatePrice}
            className="w-full btn-primary py-3 rounded-xl font-bold shadow-sm mt-2"
          >
            Update Global Price
          </button>
        </CardContent>
      </Card>
    </div>
  );

  useEffect(() => {
    load();
  }, [load]);

  const updateBooking = async (id: string, patch: Record<string, unknown>) => {
    try {
      const res = await apiFetch(`/api/bookings/admin/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        showToast(t("adminUpdateFailed", language), "error");
        return;
      }
      const updated = (await res.json()) as any;
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      showToast(t("adminBookingUpdated", language), "success");
    } catch {
      showToast(t("adminUpdateFailed", language), "error");
    }
  };

  const setDraft = (id: string, patch: Record<string, unknown>) => {
    setBookingDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
    setBookingDirty((prev) => ({ ...prev, [id]: true }));
  };

  const commitBooking = async (id: string) => {
    const b = bookings.find(x => x.id === id);
    const rawPatch = bookingDrafts[id] || {};
    
    // If no price is set in the draft and no price exists in the booking,
    // use the suggested price.
    const patch = { ...rawPatch };
    if (b && patch.price === undefined && !b.price) {
      const suggested = getSuggestedPrice(b.pooja_type);
      if (suggested) {
        patch.price = Number(suggested);
      }
    }

    if (Object.keys(patch).length === 0) return;
    await updateBooking(id, patch);
    setBookingDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setBookingDirty((prev) => ({ ...prev, [id]: false }));
  };

  const filteredBookings = bookings.filter((b) => {
    const q = bookingSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(b.pooja_type || "").toLowerCase().includes(q) ||
      String(b.name || "").toLowerCase().includes(q) ||
      String(b.email || "").toLowerCase().includes(q) ||
      String(b.phone || "").toLowerCase().includes(q) ||
      String(b.city || "").toLowerCase().includes(q) ||
      String(b.status || "").toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.fullName || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q) ||
      String(u.phone || "").toLowerCase().includes(q) ||
      String(u.role || "").toLowerCase().includes(q) ||
      String(u.isBlocked ? "blocked" : "active").includes(q)
    );
  });

  const filteredStories = stories.filter((s) => {
    const q = storySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(s.name || "").toLowerCase().includes(q) ||
      String(s.email || "").toLowerCase().includes(q) ||
      String(s.city || "").toLowerCase().includes(q) ||
      String(s.puja || "").toLowerCase().includes(q) ||
      String(s.status || "").toLowerCase().includes(q) ||
      String(s.story || "").toLowerCase().includes(q)
    );
  });

  const approveStory = async (id: string) => {
    try {
      const res = await apiFetch(`/api/stories/admin/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) {
        showToast(t("adminApproveFailed", language), "error");
        return;
      }
      const updated = (await res.json()) as any;
      setStories((prev) => prev.map((s) => (s.id === id ? updated : s)));
      showToast(t("adminStoryApproved", language), "success");
    } catch {
      showToast(t("adminApproveFailed", language), "error");
    }
  };

  const deleteStory = async (id: string) => {
    const ok = window.confirm(t("adminConfirmDeleteStory", language));
    if (!ok) return;
    try {
      const res = await apiFetch(`/api/stories/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (!res.ok) {
        showToast(t("adminDeleteFailed", language), "error");
        return;
      }
      setStories((prev) => prev.filter((s) => s.id !== id));
      showToast(t("adminStoryDeleted", language), "success");
    } catch {
      showToast(t("adminDeleteFailed", language), "error");
    }
  };

  const toggleBlockUser = async (userId: string, blocked: boolean) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ blocked }),
      });
      if (!res.ok) {
        showToast(t("adminFailedUpdateUser", language), "error");
        return;
      }
      const updated = (await res.json()) as any;
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast(
        blocked ? t("adminUserBlocked", language) : t("adminUserUnblocked", language),
        "success",
      );
    } catch {
      showToast(t("adminFailedUpdateUser", language), "error");
    }
  };

  const deleteUser = async (userId: string) => {
    const ok = window.confirm(t("adminConfirmDeleteUser", language));
    if (!ok) return;
    try {
      const target = users.find((u) => u.id === userId);
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (!res.ok) {
        showToast(t("adminDeleteFailed", language), "error");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (target?.email) {
        setBookings((prev) =>
          prev.filter(
            (b) =>
              b.userId !== userId &&
              String(b.email || "").toLowerCase() !==
              String(target.email).toLowerCase(),
          ),
        );
      } else {
        setBookings((prev) => prev.filter((b) => b.userId !== userId));
      }
      showToast(t("adminUserDeleted", language), "success");
    } catch {
      showToast(t("adminDeleteFailed", language), "error");
    }
  };

  const persistPopular = async (next: PopularPoojaCard[]) => {
    try {
      const res = await apiFetch("/api/content/popularPoojas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ data: next }),
      });
      if (!res.ok) throw new Error("Failed to save popular pujas");

      const body = await res.json();
      setPopularPoojas(body.data);
      window.dispatchEvent(new CustomEvent(CONTENT_EVENT_NAME, { detail: { key: "popularPoojas" } }));
      showToast("Popular pujas updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update popular pujas", "error");
    }
  };

  const addPopular = async () => {
    if (!newPopular.categoryId || !newPopular.poojaId) {
      showToast("Please select Category and Puja Type", "error");
      return;
    }
    const next: PopularPoojaCard[] = [
      ...popularPoojas,
      {
        id: makeId("popular"),
        categoryId: newPopular.categoryId,
        poojaId: newPopular.poojaId,
        title: newPopular.title?.trim() || "",
        description: newPopular.description?.trim() || "",
        price: newPopular.price?.trim() || "",
        icon: (newPopular.icon as string)?.trim() || "",
        image: newPopular.image?.trim() || "",
      },
    ];
    await persistPopular(next);
    setNewPopular({ title: "", description: "", price: "", icon: "", image: "", categoryId: "", poojaId: "" });
  };



  const deletePopular = async (id: string) => {
    const ok = window.confirm("Delete this popular puja?");
    if (!ok) return;
    await persistPopular(popularPoojas.filter((p) => p.id !== id));
  };

  const handleFileToDataUrl = (file: File, onDone: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (url.startsWith("data:")) onDone(url);
    };
    reader.readAsDataURL(file);
  };

  const persistGallery = async (next: AboutPoojaGalleryItem[]) => {
    try {
      const res = await apiFetch("/api/content/aboutGallery", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ data: next }),
      });
      if (!res.ok) throw new Error("Failed to save gallery");

      const body = await res.json();
      setAboutGallery(body.data);
      showToast("About gallery updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update about gallery", "error");
    }
  };

  const addGalleryItem = () => {
    if (!newGalleryItem.image.trim()) {
      showToast("Please add an image (url or upload)", "error");
      return;
    }
    const next: AboutPoojaGalleryItem[] = [
      ...aboutGallery,
      {
        id: makeId("gallery"),
        image: newGalleryItem.image.trim(),
        caption: newGalleryItem.caption?.trim() || "",
      },
    ];
    persistGallery(next);
    setNewGalleryItem({ image: "", caption: "" });
  };

  const updateGalleryItem = (id: string, patch: Partial<AboutPoojaGalleryItem>) => {
    const next = aboutGallery.map((g) => (g.id === id ? { ...g, ...patch } : g));
    persistGallery(next);
  };

  const deleteGalleryItem = (id: string) => {
    const ok = window.confirm("Delete this gallery item?");
    if (!ok) return;
    persistGallery(aboutGallery.filter((g) => g.id !== id));
  };

  const stats = {
    totalRevenue: bookings.filter(b => b.status === 'payment-completed' || b.status === 'completed' || b.status === 'pooja-performed')
      .reduce((sum, b) => sum + (Number(b.price) || 0), 0),
    activeBookings: bookings.filter(b => b.status !== 'completed' && b.status !== 'pooja-performed' && b.status !== 'cancelled').length,
    totalUsers: users.length,
    conversionRate: bookings.length > 0 
      ? ((bookings.filter(b => b.status === 'payment-completed' || b.status === 'completed' || b.status === 'pooja-performed').length / bookings.length) * 100).toFixed(1)
      : 0
  };

  const revenueData = bookings
    .filter(b => b.created_at && (b.status === 'payment-completed' || b.status === 'completed' || b.status === 'pooja-performed'))
    .reduce((acc: any[], b) => {
      const date = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find(d => d.name === date);
      if (existing) {
        existing.revenue += Number(b.price) || 0;
      } else {
        acc.push({ name: date, revenue: Number(b.price) || 0 });
      }
      return acc;
    }, [])
    .slice(-15);

  const volumeData = bookings
    .filter(b => b.created_at)
    .reduce((acc: any[], b) => {
      const date = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find(d => d.name === date);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ name: date, count: 1 });
      }
      return acc;
    }, [])
    .slice(-15);

  const statusDistData = [
    { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#fbbf24' },
    { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#f59e0b' },
    { name: 'Paid', value: bookings.filter(b => b.status === 'payment-completed').length, color: '#10b981' },
    { name: 'Performed', value: bookings.filter(b => b.status === 'pooja-performed').length, color: '#0d9488' },
    { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("adminStatRevenue", language), val: `₹${stats.totalRevenue.toLocaleString()}`, icon: <IndianRupee className="w-6 h-6" />, bg: "bg-emerald-50", text: "text-emerald-600" },
          { label: t("adminStatBookings", language), val: bookings.length, icon: <BarChart3 className="w-6 h-6" />, bg: "bg-saffron-50", text: "text-saffron-600" },
          { label: t("adminStatUsers", language), val: stats.totalUsers, icon: <Users className="w-6 h-6" />, bg: "bg-purple-50", text: "text-purple-600" },
          { label: t("adminStatConversion", language), val: `${stats.conversionRate}%`, icon: <TrendingUp className="w-6 h-6" />, bg: "bg-blue-50", text: "text-blue-600" },
        ].map((s, idx) => (
          <Card key={idx} className="border-gold-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.text} shadow-sm`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <h3 className="text-xl font-bold text-maroon-700">{s.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gold-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-gold-100 pb-3 px-5">
            <CardTitle className="text-xs font-bold text-maroon-700 flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {t("adminChartRevenueTrend", language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gold-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-gold-100 pb-3 px-5">
            <CardTitle className="text-xs font-bold text-maroon-700 flex items-center gap-2 uppercase tracking-wider">
              <PieChartIcon className="w-4 h-4 text-saffron-500" />
              {t("adminChartStatusDist", language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gold-100 shadow-sm overflow-hidden lg:col-span-2">
          <CardHeader className="bg-slate-50/50 border-b border-gold-100 pb-3 px-5">
            <CardTitle className="text-xs font-bold text-maroon-700 flex items-center gap-2 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              {t("adminChartBookingVolume", language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gold-100 shadow-sm">
        <CardHeader className="pb-3 border-b border-gold-100 px-5">
          <CardTitle className="text-xs font-bold text-maroon-700 uppercase tracking-wider">{t("adminRecentActivity", language)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gold-50">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    b.status === 'payment-completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-saffron-100 text-saffron-600'
                  }`}>
                    {b.status === 'payment-completed' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-maroon-700">{b.name} booked {b.pooja_type}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">{b.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (auth.user.role !== "admin") {
    return (
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 overflow-hidden">
            <div className="h-2 gradient-saffron" />
            <div className="p-8 sm:p-10">
              <h1 className="font-display text-2xl font-bold text-maroon-600">
                {t("adminForbiddenTitle", language)}
              </h1>
              <p className="font-body text-muted-foreground mt-2">
                {t("adminForbiddenText", language)}
              </p>
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="mt-6 btn-primary px-6 py-3 rounded-xl"
              >
                {t("adminBackToDashboard", language)}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-card-warm border border-gold-100 overflow-hidden">
          <div className="h-2 gradient-saffron" />
          <div className="p-8 sm:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl font-bold text-maroon-600">
                  {t("adminTitle", language)}
                </h1>
                <p className="font-body text-muted-foreground mt-1">
                  {t("adminSubtitle", language)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="px-5 py-2.5 rounded-full text-sm font-body font-semibold border border-gold-200/70 text-maroon-700 hover:bg-saffron-50 transition-all"
              >
                {t("adminBackToDashboard", language)}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {(
                [
                  { k: "overview", labelKey: "adminTabOverview", icon: <LayoutDashboard className="w-4 h-4" /> },
                  { k: "bookings", labelKey: "adminTabBookings", icon: <ClipboardEdit className="w-4 h-4" /> },
                  { k: "completed", label: "History", icon: <CheckCircle className="w-4 h-4" /> },
                  { k: "payments", label: "Payments", icon: <Wallet className="w-4 h-4" /> },
                  { k: "users", labelKey: "adminTabUsers", icon: <Users className="w-4 h-4" /> },
                  { k: "stories", labelKey: "adminTabStories", icon: <ScrollText className="w-4 h-4" /> },
                  { k: "popular", labelKey: "adminTabPopularPoojas", icon: <Sparkles className="w-4 h-4" /> },
                  { k: "aboutGallery", labelKey: "adminTabAboutGallery", icon: <Eye className="w-4 h-4" /> },
                  { k: "changePrice", label: "Change Price", icon: <IndianRupee className="w-4 h-4" /> },
                ] as Array<{ k: "overview"|"bookings"|"completed"|"users"|"stories"|"popular"|"aboutGallery"|"changePrice"; labelKey?: keyof typeof TRANSLATIONS; label?: string; icon: React.ReactNode }>
              ).map(({ k, labelKey, label, icon }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body font-semibold transition ${
                    tab === k
                      ? "bg-saffron-100 text-saffron-700 border border-saffron-200 shadow-sm"
                      : "bg-white text-maroon-700 border border-gold-100 hover:bg-saffron-50"
                  }`}
                  title={label || (labelKey ? t(labelKey, language) : "")}
                >
                  <span className={`p-1.5 rounded-lg ${
                    tab === k ? "bg-white/80 text-saffron-700" : "bg-gold-50 text-maroon-500"
                  }`}>
                    {icon}
                  </span>
                  <span className="hidden sm:inline">{label || (labelKey ? t(labelKey, language) : "")}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={load}
                className="ml-auto px-4 py-2 rounded-full text-sm font-body font-semibold bg-white border border-gold-100 text-maroon-700 hover:bg-saffron-50 transition"
                title={t("dashRefresh", language)}
              >
                <RefreshCw className="w-4 h-4 inline-block mr-2" />
                <span className="hidden sm:inline">{t("dashRefresh", language)}</span>
              </button>
            </div>

            {loading ? (
              <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">
                {t("dashLoading", language)}
              </div>
            ) : tab === "overview" ? (
              renderOverview()
            ) : (tab === "bookings" || tab === "completed") ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder={t("adminSearchBookingsPlaceholder", language)}
                    className="flex-1 rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                  />
                </div>
                {tab === "completed" ? (
                  <div className="bg-white border border-gold-100 rounded-2xl overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-saffron-50/50">
                          <TableHead className="font-bold text-maroon-700">User Details</TableHead>
                          <TableHead className="font-bold text-maroon-700">Pooja Type</TableHead>
                          <TableHead className="font-bold text-maroon-700">Status</TableHead>
                          <TableHead className="font-bold text-maroon-700">Price (INR)</TableHead>
                          <TableHead className="font-bold text-maroon-700">Pooja Date</TableHead>
                          <TableHead className="font-bold text-maroon-700 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings
                          .filter(b => b.status === "pooja-performed" || b.status === "completed")
                          .map((b) => (
                            <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell>
                                <div className="font-semibold text-maroon-700 text-sm">{b.name}</div>
                                <div className="text-[10px] text-muted-foreground">{b.phone} • {b.email}</div>
                                <div className="text-[10px] text-muted-foreground">{b.city}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium text-maroon-600">{b.pooja_type}</div>
                                <div className="text-[10px] text-saffron-600 font-medium">Category: {getCategoryName(b.pooja_type)}</div>
                                <div className="text-[10px] text-muted-foreground">Booked: {new Date(b.created_at).toLocaleDateString()}</div>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-saffron-50 text-maroon-700 border border-gold-100 uppercase">
                                  {b.status}
                                </span>
                              </TableCell>
                              <TableCell className="font-bold text-maroon-700 text-sm">
                                ₹{b.price || 0}
                              </TableCell>
                              <TableCell className="text-sm text-maroon-600">
                                {b.poojaDate ? new Date(b.poojaDate).toLocaleString() : "Not set"}
                              </TableCell>
                              <TableCell className="text-right">
                                <button
                                  type="button"
                                  onClick={() => generateReceipt(b, showToast)}
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-saffron-600 hover:text-saffron-700 bg-saffron-50 hover:bg-saffron-100 px-2 py-1 rounded-lg transition-colors border border-saffron-100"
                                  title="Download Receipt"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  RECEIPT
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings
                      .filter(b => b.status !== "pooja-performed" && b.status !== "completed")
                      .map((b) => (
                      <div
                        key={b.id}
                        className="bg-white border border-gold-100 rounded-2xl p-6 shadow-card-warm"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div>
                            <p className="font-display text-lg font-semibold text-maroon-600 flex flex-wrap items-center gap-2">
                              {b.pooja_type}
                              <span className="text-[10px] font-normal text-saffron-600 px-2 py-0.5 bg-saffron-50 rounded-full border border-saffron-100 uppercase">
                                {getCategoryName(b.pooja_type)}
                              </span>
                            </p>
                            <p className="font-body text-sm text-muted-foreground mt-1">
                              {b.name} • {b.phone} • {b.email}
                            </p>
                            <p className="font-body text-sm text-muted-foreground mt-1">
                              {b.city} • {new Date(b.created_at).toLocaleString()}
                            </p>
                            {b.message ? (
                              <p className="font-body text-sm text-maroon-700 mt-3">
                                {b.message}
                              </p>
                            ) : null}
                          </div>

                          <div className="w-full lg:w-[360px] bg-saffron-50 border border-saffron-100 rounded-2xl p-5">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <label className="block font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide mb-1">
                                  {t("adminStatusLabel", language)}
                                </label>
                                <select
                                  value={bookingDrafts[b.id]?.status ?? b.status}
                                  onChange={(e) =>
                                    setDraft(b.id, { status: e.target.value })
                                  }
                                  className="w-full rounded-xl border border-gold-100 bg-white px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                                >
                                  <option value="pending">Inquiry</option>
                                  <option value="consultation">Consultation</option>
                                  <option value="payment-pending">Payment</option>
                                  <option value="payment-completed">Confirmed</option>
                                  <option value="pooja-performed">Performed</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide mb-1">
                                  Price (INR)
                                </label>
                                <input
                                  type="number"
                                  value={bookingDrafts[b.id]?.price ?? (b.price || getSuggestedPrice(b.pooja_type))}
                                  onChange={(e) => setDraft(b.id, { price: e.target.value })}
                                  className="w-full rounded-xl border border-gold-100 bg-white px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide mb-1">
                                  Pooja Date
                                </label>
                                <input
                                  type="datetime-local"
                                  value={
                                    bookingDrafts[b.id]?.poojaDate ??
                                    (b.poojaDate ? new Date(b.poojaDate).toISOString().slice(0, 16) : "")
                                  }
                                  onChange={(e) => setDraft(b.id, { poojaDate: e.target.value })}
                                  className="w-full rounded-xl border border-gold-100 bg-white px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                                />
                              </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-body text-xs text-muted-foreground">
                                  {t("adminEditHint", language)}
                                </p>
                                <button
                                  type="button"
                                  disabled={!bookingDirty[b.id]}
                                  onClick={() => commitBooking(b.id)}
                                  className="px-4 py-2 rounded-full text-xs font-body font-semibold btn-primary disabled:opacity-60"
                                >
                                  {t("adminDone", language)}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {filteredBookings.filter(b => tab === "completed" ? (b.status === "pooja-performed" || b.status === "completed") : (b.status !== "pooja-performed" && b.status !== "completed")).length === 0 && (
                  <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">
                    {tab === "completed" ? "No history found." : "No active bookings found."}
                  </div>
                )}
              </div>
            ) : tab === "popular" ? (
              <div className="space-y-6">
                <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-maroon-700">
                        {t("adminTabPopularPoojas", language)}
                      </p>
                      <p className="font-body text-sm text-muted-foreground">
                        Add / edit / delete cards shown on the Home page.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary px-5 py-2.5 rounded-xl text-sm"
                      onClick={() => {
                        writeLocalJson(POPULAR_POOJAS_STORAGE_KEY, popularPoojas);
                        showToast("Popular pujas updated", "success");
                      }}
                    >
                      Save changes
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <select
                      value={newPopular.categoryId || ""}
                      onChange={(e) => {
                        const catId = e.target.value;
                        setNewPopular((p) => ({ ...p, categoryId: catId, poojaId: "" }));
                      }}
                      className="rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {t(`cat_${cat.id}_name` as any, language)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newPopular.poojaId || ""}
                      onChange={(e) => setNewPopular((p) => ({ ...p, poojaId: e.target.value }))}
                      disabled={!newPopular.categoryId}
                      className="rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300 disabled:opacity-50"
                    >
                      <option value="">Select Puja Type...</option>
                      {(categories.find((c) => c.id === newPopular.categoryId)?.pujas || []).map((poojaName) => {
                        const poojaId = poojaMapping[poojaName] || poojaName;
                        const detail = poojaDetails[poojaId];
                        if (!detail) return null;
                        const poojaTransKey = `pooja_${poojaId.replace(/-/g, "_")}_name`;
                        const label = optT(poojaTransKey as any, language) || detail.name;
                        return (
                          <option key={poojaId} value={poojaId}>{label}</option>
                        );
                      })}
                    </select>
                    <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <button
                        type="button"
                        className="btn-primary px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={addPopular}
                        disabled={!newPopular.categoryId || !newPopular.poojaId}
                      >
                        Add popular puja
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {popularPoojas.map((p) => {
                    const detail = p.poojaId ? poojaDetails[p.poojaId] : null;
                    const poojaTransBase = p.poojaId ? `pooja_${p.poojaId.replace(/-/g, "_")}` : "";
                    const displayTitle = detail ? (optT(`${poojaTransBase}_name` as any, language) || detail.name) : p.title;
                    const displayPrice = detail ? (poojaPrices[p.poojaId!] || optT(detail.price as any, language) || detail.price) : p.price;
                    const displayIcon = <IconRenderer icon={detail ? detail.icon : (p.icon || "🙏")} className="text-saffron-500" />;

                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-gold-100 rounded-2xl p-6 shadow-card-warm"
                      >
                        <div className="flex flex-col lg:flex-row gap-5">
                          <div className="w-full lg:w-48">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={displayTitle || ""}
                                className="w-full h-28 object-cover rounded-xl border border-gold-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-full h-28 rounded-xl border border-gold-100 bg-saffron-50 flex items-center justify-center text-5xl">
                                {displayIcon}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 grid md:grid-cols-2 gap-3 items-center">
                            <p className="font-display text-lg font-semibold text-maroon-700">{displayTitle}</p>
                            <p className="font-body text-sm text-gold-700 font-semibold">{displayPrice}</p>
                            <div className="md:col-span-2 flex flex-wrap gap-2 items-center mt-2">
                              <button
                                type="button"
                                onClick={() => deletePopular(p.id)}
                                className="px-3 py-2 rounded-xl text-xs font-body font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50 transition"
                              >
                                {t("adminDelete", language)}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!popularPoojas.length ? (
                    <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">
                      No popular pujas yet. Add one above to show it on the Home page.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : tab === "aboutGallery" ? (
              <div className="space-y-6">
                <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-maroon-700">
                        {t("adminTabAboutGallery", language)}
                      </p>
                      <p className="font-body text-sm text-muted-foreground">
                        Manage the swipe gallery shown on the About page.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary px-5 py-2.5 rounded-xl text-sm"
                      onClick={() => {
                        writeLocalJson(ABOUT_GALLERY_STORAGE_KEY, aboutGallery);
                        showToast("About gallery updated", "success");
                      }}
                    >
                      Save changes
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      value={newGalleryItem.image}
                      onChange={(e) => setNewGalleryItem((p) => ({ ...p, image: e.target.value }))}
                      placeholder="Image URL (or upload below)"
                      className="rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                    />
                    <input
                      value={newGalleryItem.caption || ""}
                      onChange={(e) => setNewGalleryItem((p) => ({ ...p, caption: e.target.value }))}
                      placeholder="Caption (optional)"
                      className="rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                    />
                    <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="font-body text-sm"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          handleFileToDataUrl(f, (url) =>
                            setNewGalleryItem((p) => ({ ...p, image: url })),
                          );
                        }}
                      />
                      <button
                        type="button"
                        className="btn-primary px-5 py-2.5 rounded-xl text-sm"
                        onClick={addGalleryItem}
                      >
                        Add gallery image
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {aboutGallery.map((g) => (
                    <div
                      key={g.id}
                      className="bg-white border border-gold-100 rounded-2xl p-6 shadow-card-warm"
                    >
                      <div className="flex flex-col lg:flex-row gap-5">
                        <div className="w-full lg:w-56">
                          <img
                            src={g.image}
                            alt={g.caption || "Puja"}
                            className="w-full h-32 object-cover rounded-xl border border-gold-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="flex-1 grid md:grid-cols-2 gap-3">
                          <input
                            value={g.image}
                            onChange={(e) =>
                              setAboutGallery((prev) =>
                                prev.map((x) => (x.id === g.id ? { ...x, image: e.target.value } : x)),
                              )
                            }
                            className="md:col-span-2 rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                          />
                          <input
                            value={g.caption || ""}
                            onChange={(e) =>
                              setAboutGallery((prev) =>
                                prev.map((x) => (x.id === g.id ? { ...x, caption: e.target.value } : x)),
                              )
                            }
                            placeholder="Caption (optional)"
                            className="md:col-span-2 rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                          />
                          <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
                            <input
                              type="file"
                              accept="image/*"
                              className="font-body text-sm"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                handleFileToDataUrl(f, (url) => updateGalleryItem(g.id, { image: url }));
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => deleteGalleryItem(g.id)}
                              className="px-3 py-2 rounded-xl text-xs font-body font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50 transition"
                            >
                              {t("adminDelete", language)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!aboutGallery.length ? (
                    <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">
                      No gallery images yet. Add one above to show it on the About page.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : tab === "users" ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={t("adminSearchUsersPlaceholder", language)}
                    className="flex-1 rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                  />
                </div>
                <div className="overflow-auto border border-gold-100 rounded-2xl">
                  <table className="min-w-full text-sm">
                    <thead className="bg-saffron-50">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-body font-semibold text-maroon-700">
                          {t("adminTableName", language)}
                        </th>
                        <th className="px-4 py-3 font-body font-semibold text-maroon-700">
                          {t("adminTableEmail", language)}
                        </th>
                        <th className="px-4 py-3 font-body font-semibold text-maroon-700">
                          {t("adminTablePhone", language)}
                        </th>
                        <th className="px-4 py-3 font-body font-semibold text-maroon-700">
                          {t("adminTableRole", language)}
                        </th>
                        <th className="px-4 py-3 font-body font-semibold text-maroon-700">
                          {t("adminTableStatus", language)}
                        </th>
                        <th className="px-4 py-3 font-body font-semibold text-maroon-700">
                          {t("adminTableActions", language)}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-t border-gold-100">
                          <td className="px-4 py-3 font-body text-maroon-700">
                            {u.fullName}
                          </td>
                          <td className="px-4 py-3 font-body text-maroon-700">
                            {u.email}
                          </td>
                          <td className="px-4 py-3 font-body text-maroon-700">
                            {u.phone}
                          </td>
                          <td className="px-4 py-3 font-body text-maroon-700">
                            {u.role}
                          </td>
                          <td className="px-4 py-3 font-body text-maroon-700">
                            {u.isBlocked ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-body font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                {t("adminBlocked", language)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-body font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {t("adminActive", language)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => toggleBlockUser(u.id, !u.isBlocked)}
                                className="px-3 py-1.5 rounded-full text-xs font-body font-semibold bg-white border border-gold-100 text-maroon-700 hover:bg-saffron-50 transition"
                              >
                                {u.isBlocked
                                  ? t("adminUnblock", language)
                                  : t("adminBlock", language)}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteUser(u.id)}
                                className="px-3 py-1.5 rounded-full text-xs font-body font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50 transition"
                              >
                                {t("adminDelete", language)}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : tab === "stories" ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={storySearch}
                    onChange={(e) => setStorySearch(e.target.value)}
                    placeholder={t("adminSearchStoriesPlaceholder", language)}
                    className="flex-1 rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                  />
                </div>
                <div className="space-y-4">
                  {filteredStories.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white border border-gold-100 rounded-2xl p-6 shadow-card-warm"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <p className="font-display text-lg font-semibold text-maroon-600">
                            {s.name} • {s.city}
                          </p>
                          <p className="font-body text-sm text-muted-foreground mt-1">
                            {s.email} • <HeartHandshake className="w-4 h-4 inline-block mr-1 text-saffron-500" /> {s.puja}
                          </p>
                          <div className="flex gap-0.5 mt-2">
                            {Array.from({ length: Number(s.rating ?? 5) }).map((_, i) => (
                              <Star key={`${s.id}-star-${i}`} fill="currentColor" className="w-3 h-3 text-yellow-500 inline-block" />
                            ))}
                          </div>
                          <p className="font-body text-sm text-maroon-700 mt-4 leading-relaxed">
                            {s.story}
                          </p>
                        </div>

                        <div className="w-full md:w-[260px] bg-saffron-50 border border-saffron-100 rounded-2xl p-5">
                          <p className="font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide">
                            {t("adminStatusLabel", language)}
                          </p>
                          <p className="mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-body font-semibold bg-white border border-gold-100 text-maroon-700">
                            {s.status}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {s.status !== "approved" ? (
                              <button
                                type="button"
                                onClick={() => approveStory(s.id)}
                                className="px-3 py-2 rounded-xl text-xs font-body font-semibold btn-primary"
                              >
                                {t("adminApprove", language)}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => deleteStory(s.id)}
                              className="px-3 py-2 rounded-xl text-xs font-body font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50 transition"
                            >
                              {t("adminDelete", language)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!filteredStories.length ? (
                    <div className="bg-saffron-50 border border-saffron-100 rounded-2xl p-6 font-body text-sm text-maroon-700">
                      {t("adminNoStoriesFound", language)}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : tab === "payments" ? (
              renderPayments()
            ) : tab === "changePrice" ? (
              renderChangePrice()
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder={t("adminSearchBookingsPlaceholder", language)}
                    className="flex-1 rounded-xl border border-gold-100 bg-white px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                  />
                </div>
                {filteredBookings
                  .filter(b => {
                    if (tab === "completed") return b.status === "pooja-performed" || b.status === "completed";
                    if (tab === "bookings") return b.status !== "pooja-performed" && b.status !== "completed";
                    return true;
                  })
                  .map((b) => (
                  <div
                    key={b.id}
                    className="bg-white border border-gold-100 rounded-2xl p-6 shadow-card-warm"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <p className="font-display text-lg font-semibold text-maroon-600">
                          {b.pooja_type}
                        </p>
                        <p className="font-body text-sm text-muted-foreground mt-1">
                          {b.name} • {b.phone} • {b.email}
                        </p>
                        <p className="font-body text-sm text-muted-foreground mt-1">
                          {b.city} • {new Date(b.created_at).toLocaleString()}
                        </p>
                        {b.message ? (
                          <p className="font-body text-sm text-maroon-700 mt-3">
                            {b.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="w-full lg:w-[360px] bg-saffron-50 border border-saffron-100 rounded-2xl p-5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide mb-1">
                              {t("adminStatusLabel", language)}
                            </label>
                            {tab === "completed" ? (
                              <p className="mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-body font-semibold bg-white border border-gold-100 text-maroon-700 uppercase">
                                {b.status}
                              </p>
                            ) : (
                              <select
                                value={bookingDrafts[b.id]?.status ?? b.status}
                                onChange={(e) =>
                                  setDraft(b.id, { status: e.target.value })
                                }
                                className="w-full rounded-xl border border-gold-100 bg-white px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                              >
                                <option value="pending">
                                  {t("bookingStatusPending", language)}
                                </option>
                                <option value="confirmed">
                                  {t("bookingStatusConfirmed", language)}
                                </option>
                                <option value="payment-pending">
                                  {t("bookingStatusPaymentPending", language)}
                                </option>
                                <option value="payment-completed">
                                  {t("bookingStatusPaymentCompleted", language)}
                                </option>
                                <option value="pooja-performed">
                                  {t("bookingStatusPoojaPerformed", language)}
                                </option>
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="block font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide mb-1">
                              {t("adminPriceInr", language)}
                            </label>
                            {tab === "completed" ? (
                              <p className="font-body text-sm text-maroon-700 font-bold">₹{b.price || 0}</p>
                            ) : (
                              <input
                                type="number"
                                value={
                                  bookingDrafts[b.id]?.price ?? 
                                  (b.price ?? (getSuggestedPrice(b.pooja_type) ?? ""))
                                }
                                onChange={(e) =>
                                  setDraft(b.id, {
                                    price: e.currentTarget.value,
                                  })
                                }
                                className="w-full rounded-xl border border-gold-100 bg-white px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                                placeholder="0"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block font-body text-xs font-semibold text-maroon-600 uppercase tracking-wide mb-1">
                              {t("adminPoojaDate", language)}
                            </label>
                            {tab === "completed" ? (
                              <p className="font-body text-sm text-maroon-700">
                                {b.poojaDate ? new Date(b.poojaDate).toLocaleString() : "Not set"}
                              </p>
                            ) : (
                              <input
                                type="datetime-local"
                                value={
                                  bookingDrafts[b.id]?.poojaDate ??
                                  (b.poojaDate
                                    ? new Date(b.poojaDate)
                                      .toISOString()
                                      .slice(0, 16)
                                    : "")
                                }
                                onChange={(e) =>
                                  setDraft(b.id, {
                                    poojaDate: e.currentTarget.value,
                                  })
                                }
                                className="w-full rounded-xl border border-gold-100 bg-white px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
                              />
                            )}
                          </div>
                        </div>
                        {tab !== "completed" && (
                          <div className="mt-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-body text-xs text-muted-foreground">
                                {t("adminEditHint", language)}
                              </p>
                              <button
                                type="button"
                                disabled={!bookingDirty[b.id]}
                                onClick={() => {
                                const raw = bookingDrafts[b.id] || {};
                                const patch: Record<string, unknown> = { ...raw };
                                
                                // Use suggested price if no price is set in the draft or the original booking
                                const currentPrice = patch.price ?? b.price;
                                if (currentPrice == null) {
                                  const suggested = getSuggestedPrice(b.pooja_type);
                                  if (suggested != null) {
                                    patch.price = suggested;
                                  }
                                } else if (patch.price !== undefined) {
                                  const v = patch.price;
                                  patch.price = v === "" || v == null ? null : Number(v);
                                }

                                if ("poojaDate" in patch) {
                                    const v = patch.poojaDate;
                                    patch.poojaDate =
                                      v ? new Date(String(v)).toISOString() : null;
                                  }
                                  setBookingDrafts((prev) => ({ ...prev, [b.id]: patch }));
                                  commitBooking(b.id);
                                }}
                                className="px-4 py-2 rounded-full text-xs font-body font-semibold btn-primary disabled:opacity-60"
                              >
                                {t("adminDone", language)}
                              </button>
                            </div>

                            {(b.status === "pending" || b.status === "confirmed") && (
                              <button
                                type="button"
                                onClick={() => {
                                  const draft = bookingDrafts[b.id] || {};
                                  let price = draft.price !== undefined ? draft.price : b.price;
                                  const date = draft.poojaDate !== undefined ? draft.poojaDate : b.poojaDate;

                                  // If no price is set, use the suggested price
                                  if (price == null) {
                                    price = getSuggestedPrice(b.pooja_type);
                                  }

                                  if (!price || Number(price) <= 0) {
                                    showToast("Please set a valid price first", "error");
                                    return;
                                  }
                                  if (!date) {
                                    showToast("Please set a pooja date first", "error");
                                    return;
                                  }

                                  const patch: Record<string, unknown> = {
                                    ...draft,
                                    status: "payment-pending",
                                    price: Number(price),
                                    poojaDate: new Date(String(date)).toISOString(),
                                  };

                                  setBookingDrafts((prev) => ({ ...prev, [b.id]: patch }));
                                  updateBooking(b.id, patch);
                                  // Clean up drafts/dirty state
                                  setBookingDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[b.id];
                                    return next;
                                  });
                                  setBookingDirty((prev) => ({ ...prev, [b.id]: false }));
                                }}
                                className="w-full py-2.5 rounded-xl text-xs font-body font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2"
                              >
                                < IndianRupee className="w-3.5 h-3.5" />
                                {t("adminConfirmAndRequestPayment", language)}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

const globalIconMap: Record<string, React.ReactNode> = {
  "🪐": <Globe className="w-5 h-5" />,
  "☀️": <Sun className="w-5 h-5" />,
  "🌙": <Moon className="w-5 h-5" />,
  "🔴": <Circle fill="#ef4444" className="w-5 h-5 text-red-500" />,
  "🟢": <Circle fill="#22c55e" className="w-5 h-5 text-green-500" />,
  "🟡": <Circle fill="#eab308" className="w-5 h-5 text-yellow-500" />,
  "💚": <Heart fill="#22c55e" className="w-5 h-5 text-green-500" />,
  "🟣": <Circle fill="#a855f7" className="w-5 h-5 text-purple-500" />,
  "⚫": <Circle fill="#000000" className="w-5 h-5 text-black" />,
  "⚪": <Circle fill="#ffffff" className="w-5 h-5 text-white" />,
  "🔱": <Flame className="w-5 h-5" />,
  "🔯": <Star className="w-5 h-5" />,
  "🐘": <Flower2 className="w-5 h-5" />,
  "🐵": <Shield className="w-5 h-5" />,
  "🦚": <Feather className="w-5 h-5" />,
  "✨": <Sparkles className="w-5 h-5" />,
  "🙏": <HeartHandshake className="w-5 h-5" />,
  "👑": <Crown className="w-5 h-5" />,
  "🐍": <Waves className="w-5 h-5" />,
  "🔥": <Flame className="w-5 h-5" />,
  "🌘": <Moon className="w-5 h-5" />,
  "🌑": <Moon className="w-5 h-5" />,
  "📜": <ScrollText className="w-5 h-5" />,
  "⭐": <Star className="w-5 h-5" />,
  "🏠": <Home className="w-5 h-5" />,
  "📖": <BookOpen className="w-5 h-5" />,
  "✅": <CheckCircle className="w-5 h-5" />,
  "🕉️": <Sparkles className="w-5 h-5" />,
  "💬": <MessageCircle className="w-5 h-5" />,
  "💰": <IndianRupee className="w-5 h-5" />,
  "👨‍👩‍👧‍👦": <Users className="w-5 h-5" />,
  "🏆": <Trophy className="w-5 h-5" />,
  "📿": <Target className="w-5 h-5" />,
  "🎯": <Target className="w-5 h-5" />,
  "👁️": <Eye className="w-5 h-5" />,
  "🕐": <Clock className="w-5 h-5" />,
  "📌": <MapPin className="w-5 h-5" />,
  "🔄": <RefreshCw className="w-5 h-5" />,
  "💡": <Lightbulb className="w-5 h-5" />,
  "📝": <ClipboardEdit className="w-5 h-5" />,
};

function IconRenderer({ icon, className }: { icon: string | React.ReactNode, className?: string }) {
  if (typeof icon === "string") {
    const cleanIcon = icon.replace(/[️]/g, "");
    const mapped = globalIconMap[cleanIcon] || globalIconMap[icon];
    if (mapped && React.isValidElement(mapped)) {
      return React.cloneElement(mapped as React.ReactElement<{ className?: string }>, {
        className: `${className || ""} ${(mapped.props as any).className || ""}`.trim()
      });
    }
    return <span className={className}>{icon}</span>;
  }
  return <>{icon}</>;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [currentPoojaKey, setCurrentPoojaKey] = useState<string>("");
  const [currentBlogId, setCurrentBlogId] = useState<number | null>(null);
  const [poojaToBook, setPoojaToBook] = useState<string>("");
  const [categoryToBook, setCategoryToBook] = useState<string>("");
  const [config, setConfig] = useState<Config>({ ...defaultConfig });
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [auth, setAuth] = useState<{ token: string; user: AuthUser } | null>(
    () => loadStoredAuth(),
  );
  const [language, setLanguage] = useState<Lang>(() => {
    const saved = localStorage.getItem("satkarmpooja.lang");
    if (saved === "en" || saved === "hi" || saved === "gu") return saved;
    return "en";
  });
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
  });
  const [poojaPrices, setPoojaPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await apiFetch("/api/content/poojaPrices");
        const body = await res.json();
        if (body?.data) setPoojaPrices(body.data);
      } catch (err) {
        console.error("Failed to fetch pooja prices", err);
      }
    };
    fetchPrices();
  }, []);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ message, type, visible: true });
      setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
    },
    [],
  );

  const triggerReceiptDownload = useCallback(async (id: string) => {
    try {
      showToast("Preparing your receipt...", "info");
      const res = await apiFetch(`/api/bookings/receipt/${id}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch receipt details");
      }
      const { data } = await res.json();
      
      // Call the helper to generate the PDF and trigger browser download
      await generateReceipt(data, showToast);
      
      // Clear URL parameter so it doesn't download again on page refresh
      const pathname = window.location.pathname;
      window.history.replaceState(null, "", pathname);
    } catch (err: any) {
      console.error("Receipt auto-download failed:", err);
      showToast(err.message || "Failed to download receipt", "error");
    }
  }, [showToast]);

  const handleUrlNavigation = useCallback((pathname: string, search: string) => {
    const cleanPath = pathname.replace(/^\//, "");
    if (!cleanPath) {
      setCurrentPage("home");
      return;
    }
    const [pathPart] = cleanPath.split("?");
    const parts = pathPart.split("/");
    const page = parts[0] as Page;
    const key = parts[1];

    // Check if we need to auto-download a receipt (e.g. ?downloadReceipt=xxxx)
    if (search) {
      const queryParams = new URLSearchParams(search);
      const downloadReceiptId = queryParams.get("downloadReceipt");
      if (downloadReceiptId) {
        triggerReceiptDownload(downloadReceiptId);
      }
    }

    const validPages: Page[] = [
      "home",
      "book",
      "categories",
      "pooja-detail",
      "success-stories",
      "about",
      "contact",
      "blog",
      "blog-detail",
      "login",
      "signup",
      "dashboard",
      "admin",
      "share-experience",
      "terms",
      "privacy"
    ];

    if (validPages.includes(page)) {
      setCurrentPage(page);
      if (page === "pooja-detail" && key) {
        setCurrentPoojaKey(key);
      } else if (page === "blog-detail" && key) {
        setCurrentBlogId(Number(key));
      }
    }
  }, [triggerReceiptDownload]);

  const navigateTo = useCallback((page: Page, poojaKey?: string | number) => {
    console.log("Navigating to:", page);
    let path = `/${page}`;
    if (poojaKey !== undefined) {
      path = `/${page}/${poojaKey}`;
    }
    window.history.pushState(null, "", path);
    window.scrollTo({ top: 0, behavior: "smooth" });
    handleUrlNavigation(window.location.pathname, window.location.search);
  }, [handleUrlNavigation]);

  const handleLoggedIn = useCallback((next: { token: string; user: AuthUser }) => {
    setAuth(next);
    storeAuth(next);
  }, []);

  const handleUpdateUser = useCallback((user: AuthUser) => {
    setAuth(prev => {
      if (!prev) return null;
      const next = { ...prev, user };
      storeAuth(next);
      return next;
    });
  }, []);

  const changeLanguage = useCallback((lang: Lang) => {
    setLanguage(lang);
    localStorage.setItem("satkarmpooja.lang", lang);
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    storeAuth(null);
    navigateTo("home");
    showToast(t("dashLoggedOut", language), "success");
  }, [navigateTo, showToast, language]);

  // Synchronize navigation state with URL path (enables browser Back/Forward)
  useEffect(() => {
    const parsePath = () => {
      handleUrlNavigation(window.location.pathname, window.location.search);
    };

    parsePath();
    window.addEventListener("popstate", parsePath);
    return () => window.removeEventListener("popstate", parsePath);
  }, [handleUrlNavigation]);

  // Dynamic SEO Metadata and Schema Injection
  useEffect(() => {
    let title = "SatkarmPuja - Online Puja Service";
    let desc = "Book authentic Vedic Pujas online with verified Pandits from Kashi, Prayagraj, and Chitrakoot. Online Puja service with transparent pricing.";
    let schemaData: Record<string, unknown> | null = null;

    const metaTitles: Record<string, Record<Lang, string>> = {
      home: {
        en: "Book Authentic Vedic Pujas with Verified Pandits | SatkarmPuja",
        hi: "प्रमाणित पंडितों के साथ प्रामाणिक वैदिक पूजाएँ बुक करें | SatkarmPuja",
        gu: "પ્રમાણિત પંડિતો સાથે સાચી વૈદિક પૂજા બુક કરો | SatkarmPuja",
      },
      categories: {
        en: "Puja Categories & Services | SatkarmPuja",
        hi: "पूजा श्रेणियाँ और सेवाएँ | SatkarmPuja",
        gu: "પૂજા કેટેગરીઝ અને સેવાઓ | SatkarmPuja",
      },
      "success-stories": {
        en: "Success Stories & Testimonials | SatkarmPuja",
        hi: "सफलता की कहानियाँ और अनुभव | SatkarmPuja",
        gu: "સફળતાની વાર્તાઓ અને અનુભવો | SatkarmPuja",
      },
      about: {
        en: "About Our Vedic Puja Organization | SatkarmPuja",
        hi: "हमारी वैदिक पूजा संस्था के बारे में | SatkarmPuja",
        gu: "અમારી વૈદિક પૂજા સંસ્થા વિશે | SatkarmPuja",
      },
      contact: {
        en: "Contact Us for Puja Booking | SatkarmPuja",
        hi: "पूजा बुकिंग के लिए संपर्क करें | SatkarmPuja",
        gu: "પૂજા બુકિંગ માટે અમારો સંપર્ક કરો | SatkarmPuja",
      },
      blog: {
        en: "Vedic Wisdom Blog & Articles | SatkarmPuja",
        hi: "वैदिक ज्ञान ब्लॉग और लेख | SatkarmPuja",
        gu: "વૈદિક જ્ઞાન બ્લોગ અને લેખો | SatkarmPuja",
      },
      book: {
        en: "Book Your Puja Online | SatkarmPuja",
        hi: "अपनी पूजा ऑनलाइन बुक करें | SatkarmPuja",
        gu: "તમારી પૂજા ઓનલાઇન બુક કરો | SatkarmPuja",
      },
      terms: {
        en: "Terms & Conditions | SatkarmPuja",
        hi: "नियम और शर्तें | SatkarmPuja",
        gu: "નિયમો અને શરતો | SatkarmPuja",
      },
      privacy: {
        en: "Privacy Policy | SatkarmPuja",
        hi: "गोपनीयता नीति | SatkarmPuja",
        gu: "ગોપનીયતા નીતિ | SatkarmPuja",
      },
    };

    const metaDescs: Record<string, Record<Lang, string>> = {
      home: {
        en: "Experience sacred rituals performed by learned Brahmins with personalized consultation and transparent pricing. Book your online puja today.",
        hi: "विद्वान ब्राह्मणों द्वारा कराए गए पवित्र अनुष्ठानों का अनुभव करें, व्यक्तिगत परामर्श और पारदर्शी शुल्क के साथ। आज ही अपनी पूजा बुक करें।",
        gu: "પંડિત બ્રાહ્મણો દ્વારા કરાયેલા પવિત્ર વિધિઓનો અનુભવ કરો, વ્યક્તિગત માર્ગદર્શન અને પારદર્શક કિંમતો સાથે. આજે જ તમારી પૂજા બુક કરો.",
      },
      categories: {
        en: "Explore our wide range of Vedic pujas including planetary peace, ancestral rituals, marriage ceremonies, and home warming pujas.",
        hi: "हमारे विभिन्न वैदिक पूजाओं को जानें, जिसमें ग्रह शांति, पितृ तर्पण, विवाह संस्कार और गृह प्रवेश पूजा शामिल हैं।",
        gu: "અમારા વિવિધ વૈદિક પૂજાઓ વિશે જાણો, જેમાં ગ્રહ શાંતિ, પિતૃ તર્પણ, લગ્ન વિધિ અને ગૃહ પ્રવેશ પૂજા સામેલ છે.",
      },
      about: {
        en: "Learn about SatkarmPuja, our mission to preserve Vedic traditions, and our team of pandits educated in Kashi, Prayagraj, and Ayodhya.",
        hi: "सत्कर्मपूजा के बारे में जानें, वैदिक परंपराओं को संरक्षित करने का हमारा मिशन, और काशी व अयोध्या से शिक्षित पंडितों की हमारी टीम।",
        gu: "સત્કર્મપૂજા વિશે જાણો, વૈદિક પરંપરાઓને જાળવવાનું અમારું મિશન અને કાશી તેમજ અયોધ્યાથી શિક્ષિત પંડિતોની અમારી ટીમ.",
      },
    };

    if (currentPage === "pooja-detail" && currentPoojaKey) {
      const detail = poojaDetails[currentPoojaKey];
      if (detail) {
        const nameKey = `pooja_${currentPoojaKey.replace(/-/g, "_")}_name`;
        const dispName = (TRANSLATIONS[nameKey as keyof typeof TRANSLATIONS] ? t(nameKey as any, language) : null) ?? detail.name;
        title = `${dispName} | SatkarmPuja`;

        const descKey = `pooja_${currentPoojaKey.replace(/-/g, "_")}_description`;
        const dispDesc = (TRANSLATIONS[descKey as keyof typeof TRANSLATIONS] ? t(descKey as any, language) : null) ?? detail.description;
        desc = dispDesc;

        // Service Schema for Puja Detail
        schemaData = {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": dispName,
          "description": dispDesc,
          "provider": {
            "@type": "LocalBusiness",
            "name": "SatkarmPuja",
            "image": "https://satkarmpuja.com/favicon.jpg",
            "telephone": "+919898044080",
            "url": "https://satkarmpuja.com"
          },
          "offers": {
            "@type": "Offer",
            "price": poojaPrices[currentPoojaKey] || detail.price.replace(/[^0-9]/g, ""),
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
          }
        };
      }
    } else if (currentPage === "blog-detail" && currentBlogId) {
      const post = blogPosts.find(p => p.id === currentBlogId);
      if (post) {
        const blogTitle = post.title[language] || post.title.en;
        title = `${blogTitle} | SatkarmPuja Blog`;
        
        // Use summary if exists, else first part of content
        const content = post.content[language] || post.content.en || "";
        desc = content.substring(0, 155) + "...";

        // BlogPosting Schema
        schemaData = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": blogTitle,
          "image": post.image,
          "datePublished": post.date,
          "author": {
            "@type": "Person",
            "name": post.author
          },
          "publisher": {
            "@type": "Organization",
            "name": "SatkarmPuja",
            "logo": {
              "@type": "ImageObject",
              "url": "https://satkarmpuja.com/favicon.jpg"
            }
          },
          "description": desc
        };
      }
    } else {
      if (metaTitles[currentPage]) {
        title = metaTitles[currentPage][language] || metaTitles[currentPage].en;
      }
      if (metaDescs[currentPage]) {
        desc = metaDescs[currentPage][language] || metaDescs[currentPage].en;
      }

      // LocalBusiness & FAQPage Schema for Home
      if (currentPage === "home") {
        const faqQuestions = faqItems.map((item) => ({
          "@type": "Question",
          "name": t(item.qKey, language),
          "acceptedAnswer": {
            "@type": "Answer",
            "text": t(item.aKey, language),
          },
        }));

        schemaData = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "LocalBusiness",
              "name": "SatkarmPuja",
              "image": "https://satkarmpuja.com/favicon.jpg",
              "telephone": "+919898044080",
              "url": "https://satkarmpuja.com",
              "priceRange": "$$",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Ahmedabad",
                "addressRegion": "Gujarat",
                "addressCountry": "IN",
              },
              "description": desc,
            },
            {
              "@type": "FAQPage",
              "mainEntity": faqQuestions,
            },
          ],
        };
      }
    }

    // Apply Title & Meta Description
    document.title = title;
    const metaDesc = document.getElementById("meta-description") || document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }

    // Apply Open Graph Meta Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);

    // Apply Canonical Link
    let canonicalUrl = "https://satkarmpuja.com";
    if (currentPage === "pooja-detail" && currentPoojaKey) {
      canonicalUrl = `https://satkarmpuja.com/pooja-detail/${currentPoojaKey}`;
    } else if (currentPage === "blog-detail" && currentBlogId) {
      canonicalUrl = `https://satkarmpuja.com/blog-detail/${currentBlogId}`;
    } else if (currentPage !== "home") {
      canonicalUrl = `https://satkarmpuja.com/${currentPage}`;
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // Schema Script Injection
    const existingScript = document.getElementById("structured-schema-ld");
    if (existingScript) {
      existingScript.remove();
    }

    if (schemaData) {
      const script = document.createElement("script");
      script.id = "structured-schema-ld";
      script.type = "application/ld+json";
      script.innerHTML = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }
  }, [currentPage, currentPoojaKey, currentBlogId, language, poojaPrices]);

  // Validate stored token on load
  useEffect(() => {
    const check = async () => {
      if (!auth?.token) return;
      try {
        const res = await apiFetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!res.ok) {
          setAuth(null);
          storeAuth(null);
        }
      } catch {
        // keep existing token; offline dev shouldn't log users out aggressively
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SDK init
  useEffect(() => {
    if (window.elementSdk) {
      window.elementSdk.init({
        defaultConfig,
        onConfigChange: (newConfig: Config) => {
          setConfig((prev) => ({ ...prev, ...newConfig }));
        },
        mapToCapabilities: (cfg: Config) => ({
          recolorables: [
            {
              get: () => cfg.background_color || defaultConfig.background_color,
              set: (v: string) => {
                cfg.background_color = v;
                window.elementSdk!.setConfig({ background_color: v });
              },
            },
            {
              get: () => cfg.surface_color || defaultConfig.surface_color,
              set: (v: string) => {
                cfg.surface_color = v;
                window.elementSdk!.setConfig({ surface_color: v });
              },
            },
            {
              get: () => cfg.text_color || defaultConfig.text_color,
              set: (v: string) => {
                cfg.text_color = v;
                window.elementSdk!.setConfig({ text_color: v });
              },
            },
            {
              get: () => cfg.primary_color || defaultConfig.primary_color,
              set: (v: string) => {
                cfg.primary_color = v;
                window.elementSdk!.setConfig({ primary_color: v });
              },
            },
            {
              get: () => cfg.secondary_color || defaultConfig.secondary_color,
              set: (v: string) => {
                cfg.secondary_color = v;
                window.elementSdk!.setConfig({ secondary_color: v });
              },
            },
          ],
          borderables: [],
          fontEditable: undefined,
          fontSizeable: undefined,
        }),
        mapToEditPanelValues: (cfg: Config) =>
          new Map([
            ["hero_title", cfg.hero_title || defaultConfig.hero_title],
            ["hero_subtitle", cfg.hero_subtitle || defaultConfig.hero_subtitle],
            ["contact_phone", cfg.contact_phone || defaultConfig.contact_phone],
            ["contact_email", cfg.contact_email || defaultConfig.contact_email],
          ]),
      });

      if (window.elementSdk.config) {
        setConfig((prev) => ({ ...prev, ...window.elementSdk!.config }));
      }
    }

    const initData = async () => {
      try {
        const res = await apiFetch("/api/bookings");
        if (res.ok) {
          const data = (await res.json()) as BookingData[];
          setBookings(data || []);
          return;
        }
      } catch {
        // Ignore and fall back to optional injected SDK.
      }

      if (window.dataSdk) {
        const result = await window.dataSdk.init({
          onDataChanged: (data) => setBookings(data || []),
        });
        if (!result.isOk) console.error("Failed to initialize data SDK");
      }
    };
    initData();
  }, []);





  return (
    <div className="min-h-screen bg-background">
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        loginTargetPage={auth ? "dashboard" : "login"}
        loginLabel={auth ? t("navDashboard", language) : t("navLogin", language)}
        language={language}
        onLanguageChange={changeLanguage}
      />

      <main className="pt-16 md:pt-20">
        <div key={currentPage} className="page-enter">
          {currentPage === "home" && (
            <HomePage
              config={config}
              onNavigate={navigateTo}
              language={language}
              poojaPrices={poojaPrices}
            />
          )}
          {currentPage === "categories" && (
            <CategoriesPage onNavigate={navigateTo} language={language} poojaPrices={poojaPrices} />
          )}
          {currentPage === "success-stories" && (
            <SuccessStoriesPage onNavigate={navigateTo} language={language} />
          )}
          {currentPage === "about" && <AboutPage onNavigate={navigateTo} language={language} />}
          {currentPage === "book" &&
            (auth ? (
              <BookPage
                preSelectedPooja={poojaToBook}
                preSelectedCategory={categoryToBook}
                bookings={bookings}
                onNavigate={navigateTo}
                auth={{ ...auth, loading: false }}
                language={language}
                showToast={showToast}
              />
            ) : (
              <LoginPage
                onNavigate={navigateTo}
                onLoggedIn={handleLoggedIn}
                showToast={showToast}
                language={language}
              />
            ))}
          {currentPage === "contact" && <ContactPage config={config} language={language} />}
          {currentPage === "blog" && <BlogPage onNavigate={navigateTo} language={language} />}
          {currentPage === "blog-detail" && <BlogDetailPage postId={currentBlogId} onNavigate={navigateTo} language={language} />}
          {currentPage === "pooja-detail" && (
            <PoojaDetailPage
              poojaKey={currentPoojaKey}
              onNavigate={navigateTo}
              onSelectPooja={(name, cat) => {
                setPoojaToBook(name);
                setCategoryToBook(cat || "");
              }}
              language={language}
              poojaPrices={poojaPrices}
            />
          )}
          {currentPage === "login" && (
            <LoginPage
              onNavigate={navigateTo}
              onLoggedIn={handleLoggedIn}
              showToast={showToast}
              language={language}
            />
          )}
          {currentPage === "signup" && (
            <SignupPage
              onNavigate={navigateTo}
              onLoggedIn={handleLoggedIn}
              showToast={showToast}
              language={language}
            />
          )}
          {currentPage === "dashboard" &&
            (auth ? (
              <DashboardPage
                auth={auth}
                onLogout={logout}
                onNavigate={navigateTo}
                onUpdateUser={handleUpdateUser}
                showToast={showToast}
                language={language}
              />
            ) : (
              <LoginPage
                onNavigate={navigateTo}
                onLoggedIn={handleLoggedIn}
                showToast={showToast}
                language={language}
              />
            ))}
          {currentPage === "admin" &&
            (auth ? (
              <AdminPanelPage
                auth={auth}
                onNavigate={navigateTo}
                showToast={showToast}
                language={language}
              />
            ) : (
              <LoginPage
                onNavigate={navigateTo}
                onLoggedIn={handleLoggedIn}
                showToast={showToast}
                language={language}
              />
            ))}
          {currentPage === "share-experience" &&
            (auth ? (
              <ShareExperiencePage
                auth={auth}
                onNavigate={navigateTo}
                showToast={showToast}
                language={language}
              />
            ) : (
              <LoginPage
                onNavigate={navigateTo}
                onLoggedIn={handleLoggedIn}
                showToast={showToast}
                language={language}
              />
            ))}
          {currentPage === "terms" && (
            <TermsPage language={language} onNavigate={navigateTo} />
          )}
          {currentPage === "privacy" && (
            <PrivacyPage language={language} onNavigate={navigateTo} />
          )}
        </div>
      </main>

      <Footer config={config} onNavigate={navigateTo} language={language} />

      <Toast toast={toast} />
    </div>
  );
}