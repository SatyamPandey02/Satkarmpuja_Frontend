import React from 'react';

export interface SeoSection {
  title: string;
  paragraphs: string[];
}

export interface PoojaSeoData {
  title: string;
  sections: SeoSection[];
}

// Simple translation helper inside the file for dynamic generation
const seoTranslations = {
  en: {
    significanceTitle: "Vedic Significance & Scriptural Context",
    astrologicalTitle: "Astrological Influence & Healing Benefits",
    ritualTitle: "Sacred Step-by-Step Ritual Procedure",
    prepTitle: "Devotee Preparation & Sacred Guidelines",
    faqTitle: "Frequently Asked Questions & Answers",
    faq1_q: "How many Pandits perform this Puja?",
    faq1_a: "Depending on the complexity and scale chosen, it is performed by 1 to 5 certified Vedic Pandits trained in sacred centers.",
    faq2_q: "What materials do I need to prepare?",
    faq2_a: "Our team provides all standard puja samagri (holy wood, ghee, herbs, flowers). You only need to arrange fresh fruits, sweets, and panchamrit.",
    faq3_q: "Can I perform this Puja online?",
    faq3_a: "Yes, we offer fully interactive online puja services where you participate via video call, take the Sankalpa, and receive blessings from home.",
    faq4_q: "Is fasting mandatory for this ritual?",
    faq4_a: "While complete fasting is ideal, a light satvik diet (fruits and milk) is allowed. The main Karta should maintain purity."
  },
  hi: {
    significanceTitle: "वैदिक महत्व और शास्त्रीय संदर्भ",
    astrologicalTitle: "ज्योतिषीय प्रभाव और उपचारात्मक लाभ",
    ritualTitle: "पवित्र चरण-दर-चरण अनुष्ठान प्रक्रिया",
    prepTitle: "भक्तों के लिए तैयारी और पवित्र नियम",
    faqTitle: "अक्सर पूछे जाने वाले प्रश्न और उत्तर",
    faq1_q: "यह पूजा कितने पंडित करते हैं?",
    faq1_a: "चयनित जटिलता और पैमाने के आधार पर, यह पवित्र केंद्रों से प्रशिक्षित 1 से 5 प्रमाणित वैदिक पंडितों द्वारा किया जाता है।",
    faq2_q: "मुझे क्या सामग्री तैयार करने की आवश्यकता है?",
    faq2_a: "हमारी टीम सभी मानक पूजा सामग्री (हवन की लकड़ी, घी, जड़ी-बूटियाँ, फूल) प्रदान करती है। आपको केवल ताजे फल, मिठाई और पंचामृत की व्यवस्था करनी होगी।",
    faq3_q: "क्या मैं यह पूजा ऑनलाइन कर सकता हूँ?",
    faq3_a: "हाँ, हम पूरी तरह से इंटरैक्टिव ऑनलाइन पूजा सेवाएँ प्रदान करते हैं जहाँ आप वीडियो कॉल के माध्यम से भाग लेते हैं, संकल्प लेते हैं और घर से आशीर्वाद प्राप्त करते हैं।",
    faq4_q: "क्या इस अनुष्ठान के लिए उपवास अनिवार्य है?",
    faq4_a: "हालांकि पूर्ण उपवास आदर्श है, लेकिन हल्के सात्विक भोजन (फल और दूध) की अनुमति है। मुख्य कर्ता को पवित्रता बनाए रखनी चाहिए।"
  },
  gu: {
    significanceTitle: "વૈદિક મહત્વ અને શાસ્ત્રીય સંદર્ભ",
    astrologicalTitle: "જ્યોતિષીય પ્રભાવ અને હીલિંગ લાભો",
    ritualTitle: "પવિત્ર તબક્કાવાર વિધિ પ્રક્રિયા",
    prepTitle: "ભક્તો માટે તૈયારી અને પવિત્ર નિયમો",
    faqTitle: "વારંવાર પૂછાતા પ્રશ્નો અને જવાબો",
    faq1_q: "આ પૂજા કેટલા પંડિતો કરે છે?",
    faq1_a: "પસંદ કરેલી પૂજાની શ્રેણી અને માપદંડના આધારે, તે પવિત્ર કેન્દ્રોથી શિક્ષિત ૧ થી ૫ પ્રમાણિત વૈદિક પંડિતો દ્વારા કરવામાં આવે છે.",
    faq2_q: "મારે કઈ સામગ्री તૈયાર કરવાની જરૂર છે?",
    faq2_a: "અમારી ટીમ બધી જ પ્રમાણભૂત પૂજા સામગ્રી (હવન કાષ્ટ, શુદ્ધ ઘી, જડીબુટ્ટીઓ, ફૂલો) પૂરી પાડે છે. તમારે માત્ર તાજા ફળો, મીઠાઈ અને પંચામૃત ગોઠવવાના રહેશે.",
    faq3_q: "શું હું આ પૂજા ઓનલાઇન કરી શકું?",
    faq3_a: "હા, અમે સંપૂર્ણ વિડિઓ કૉલ દ્વારા ઇન્ટરેક્ટિવ ઓનલાઇન પૂજા સેવાઓ પ્રદાન કરીએ છીએ જેમાં તમે ઘરે બેઠા સંકલ્પ લઈ શકો છો અને આશીર્વાદ મેળવી શકો છો.",
    faq4_q: "શું આ પૂજા માટે ઉપવાસ કરવો ફરજિયાત છે?",
    faq4_a: "સંપૂર્ણ ઉપવાસ રાખવો ઉત્તમ છે, પરંતુ ફળાહાર અને દૂધ જેવા હળવા સાત્વિક આહારની છૂટ છે. મુખ્ય પૂજા કરનારે પવિત्रતા જાળવવી જોઈએ।"
  }
};

export function getPoojaSeoContent(poojaKey: string, lang: 'en' | 'hi' | 'gu', poojaName: string, description: string, benefits: string[], process: string[], categoryId?: string): PoojaSeoData {
  const t = seoTranslations[lang];
  const name = poojaName || "Sacred Vedic Puja";
  const desc = description || "";
  const cat = categoryId || "dev";

  // Category specific words for variations
  const categoryTexts = {
    en: {
      intro: cat === 'graha' ? `planetary alignment and celestial peace. In Vedic astrology, the celestial bodies dictate the flow of cosmic energies in our lives.` : 
             cat === 'dosh' ? `spiritual purification and pacification of negative energetic blockages (doshas). In Vedic philosophy, structural and karmic misalignments create blockages.` :
             cat === 'nakshatra' ? `lunar mansion (Nakshatra) purification. The Nakshatra under which a soul is born shapes their temperament, mental tendencies, and health.` :
             `invoking divine blessings and spiritual elevation. Deity worship represents one of the most sublime methods in Sanatan Dharma to directly connect with the supreme consciousness.`,
      astrological: cat === 'graha' ? `planetary positions, rectifying weak transits, and pacifying planetary deities (Navagrahas).` :
                    cat === 'dosh' ? `karmic patterns, removing ancestral or birth-chart blockages, and balancing elemental flows.` :
                    cat === 'nakshatra' ? `birth star alignment, harmonizing personal elements, and pacifying the ruling deity of the star.` :
                    `spiritual evolution, mental tranquility, and invoking the specific attributes and qualities of the primary deity.`,
      ritualDesc: cat === 'dosh' ? `homam (fire rituals) to burn away negative actions, accompanied by specific cleansing materials.` :
                  cat === 'graha' ? `mantra japas for planetary deities, specific offerings of colors, and charity rules.` :
                  cat === 'nakshatra' ? `nakshatra devata stotrams, herb-infused water purification, and star-specific charity.` :
                  `detailed dynamic shodashopachara puja, panchamrit snan, and stotra recitations.`
    },
    hi: {
      intro: cat === 'graha' ? `ग्रह शांति और ब्रह्मांडीय शांति के लिए अनुष्ठान। वैदिक ज्योतिष में, नवग्रह हमारे जीवन में लौकिक ऊर्जा के प्रवाह को नियंत्रित करते हैं।` : 
             cat === 'dosh' ? `आध्यात्मिक शुद्धि और नकारात्मक दोषों के निवारण के लिए अनुष्ठान। वैदिक दर्शन में, कर्म दोष जीवन में कई बाधाएं उत्पन्न करते हैं।` :
             cat === 'nakshatra' ? `नक्षत्र शुद्धि और जन्म नक्षत्र के देव का आह्वान। जिस नक्षत्र में आत्मा जन्म लेती है, वह उसका स्वभाव, मानसिक प्रवृत्ति और स्वास्थ्य तय करता है।` :
             `दिव्य आशीर्वाद और आध्यात्मिक उन्नति प्राप्त करने के लिए देव आराधना। सनातन धर्म में देव पूजा परमात्मा से जुड़ने का सबसे सरल और उत्तम साधन है।`,
      astrological: cat === 'graha' ? `ग्रहों की स्थिति को अनुकूल बनाने, कमजोर गोचर को सुधारने और नवग्रहों को शांत करने के लिए किया जाता है।` :
                    cat === 'dosh' ? `कर्म दोषों को दूर करने, जन्म कुंडली के पितृ दोष या कालसर्प दोष जैसी बाधाओं को समाप्त करने के लिए उपयोगी है।` :
                    cat === 'nakshatra' ? `जन्म नक्षत्र को जागृत करने, व्यक्ति के मूल तत्वों को संतुलित करने और नक्षत्र के स्वामी देव को प्रसन्न करने के लिए उपयोगी है।` :
                    `आध्यात्मिक उन्नति, मानसिक शांति और आराध्य देव के दिव्य गुणों को आत्मसात करने के लिए अत्यंत महत्वपूर्ण माना गया है।`,
      ritualDesc: cat === 'dosh' ? `अग्नि वेदी (हवन) अनुष्ठान शामिल है, जिसमें नकारात्मक ऊर्जा को भस्म करने के लिए विशिष्ट समिधा का उपयोग किया जाता है।` :
                  cat === 'graha' ? `विशिष्ट ग्रहों के मंत्रों का जाप, रंगों का दान और नवग्रह अरणी पूजन मुख्य रूप से किया जाता है।` :
                  cat === 'nakshatra' ? `नक्षत्र देवता के स्तोत्रों का पाठ, पवित्र जड़ी-बूटियों से युक्त जल से स्नान और दान किया जाता है।` :
                  `षोडशोपचार पूजन विधि, पंचामृत स्नान, और दिव्य स्तोत्रों का पाठ शामिल होता है।`
    },
    gu: {
      intro: cat === 'graha' ? `ગ્રહ શાંતિ અને બ્રહ્માંડિય શાંતિ માટેનું પવિત્ર વિધિ. વૈદિક જ્યોતિષમાં, નવગ્રહો આપણા જીવનમાં ઉર્જાના પ્રવાહને નિયંત્રિત કરે છે.` : 
             cat === 'dosh' ? `આધ્યાત્મિક શુદ્ધિ અને નકારાત્મક દોષોના નિવારણ માટેનું વિધિ. વૈદિક ફિલસૂફીમાં, દોષો જીવનમાં અનેક અવરોધો ઊભા કરે છે.` :
             cat === 'nakshatra' ? `નક્ષત્ર શુદ્ધિ અને જન્મ નક્ષત્રના દેવનું આહ્વાન. જે નક્ષત્રમાં જીવ જન્મ લે છે, તે તેનો સ્વભાવ, માનસિક શાંતિ અને આયુષ્ય નક્કી કરે છે.` :
             `દૈવી આશીર્વાદ અને આધ્યાત્મિક ઉન્નતિ મેળવવા માટે દેવ આરાધના. સનાતન ધર્મમાં દેવ પૂજા પરમાત્મા સાથે જોડાવાનું શ્રેષ્ઠ સાધન છે.`,
      astrological: cat === 'graha' ? `ગ્રહોની સ્થિતિને અનુકૂળ બનાવવા, નબળા ગોચરને સુધારવા અને નવગ્રહોને શાંત કરવા માટે કરવામાં આવે છે.` :
                    cat === 'dosh' ? `કર્મ દોષોને દૂર કરવા, જન્મ કુંડળીના પિતૃ દોષ અથવા કાલસર્પ દોષ જેવા વિઘ્નોને નાબૂદ કરવા માટે ખૂબ જ ઉપયોગી છે.` :
                    cat === 'nakshatra' ? `જન્મ નક્ષત્રને જાગૃત કરવા, વ્યક્તિના તત્વોને સંતુલિત કરવા અને નક્ષત્રના સ્વામી દેવને પ્રસન્ન કરવા માટે ખૂબ જ ઉપયોગી છે.` :
                    `આધ્યાત્મિક ઉન્નતિ, માનસિક શાંતિ અને આરાધ્ય દેવના દૈવી ગુણો મેળવવા માટે અત્યંત મહત્વપૂર્ણ માનવામાં આવે છે.`,
      ritualDesc: cat === 'dosh' ? `અગ્નિ હોત્ર (હવન) વિધિ સામેલ છે, જેમાં નકારાત્મક ઊર્જાને ભસ્મ કરવા માટે ચોક્કસ જડીબુટ્ટીઓનો ઉપયોગ થાય છે.` :
                  cat === 'graha' ? `ચોક્કસ ગ્રહોના મંત્રોનો જાપ, ધાન્યનું દાન અને નવગ્રહ પૂજન મુખ્ય રીતે કરવામાં આવે છે.` :
                  cat === 'nakshatra' ? `નક્ષત્ર દેવતાના સ્તોત્રોનો પાઠ, પવિત્ર ઔષધિ યુક્ત જળથી સ્નાન અને દાન કરવામાં આવે છે.` :
                  `ષોડશોપચાર પૂજન વિધિ, પંચામૃત સ્નાન, અને દૈવી સ્તોત્રોના પાઠ સામેલ હોય છે.`
    }
  }[lang];

  // Detailed paragraphs dynamically compiled to exceed 1200-1500 words
  const data: PoojaSeoData = {
    title: lang === 'en' ? `Complete Guide to ${name}` : lang === 'hi' ? `${name} की संपूर्ण मार्गदर्शिका` : `${name} ની સંપૂર્ણ માર્ગદર્શિકા`,
    sections: [
      {
        title: t.significanceTitle,
        paragraphs: lang === 'en' ? [
          `${name} is a sacred Vedic ceremony of profound importance in the Hindu spiritual tradition, aimed at ${categoryTexts.intro} The performance of this ritual has been described in detail in the ancient Shastras, Upanishads, and Granthas. By creating a physical space dedicated to prayers, mantras, and Vedic chanting, we invite positive micro-vibrations into the surrounding environment. This helps clear mental blockages and establishes a deep sense of internal peace, letting the individual connect with their deeper spiritual self.`,
          `According to the ancient Vedic Rishis, every individual is a micro-cosmos representing the larger macro-cosmos. The patterns of our lives, our challenges, and our achievements are intrinsically tied to universal cosmic laws. Performing the ${name} helps align our inner frequency with these cosmic laws. It cleanses the subtle energy channels (nadis) and builds a defensive shield of positive spiritual vibrations around the family. Devotees perform this puja to express gratitude to the Divine, request protection from professional and personal difficulties, and invite spiritual prosperity.`,
          `The spiritual impact of ${name} is multi-fold. While the physical offering of items like wood, ghee, flowers, and sweets purifies the physical space through the fire altar (Havan), the sound vibration generated from chanting specialized Sanskrit mantras works on the mental and intellectual layer. Sanskrit is a sound-centric language where every syllable has a specific frequency and resonance. When chanted correctly by qualified pandits, these mantras stimulate the brain's endocrine system, lowering stress, elevating concentration, and purifying the spiritual aura.`
        ] : lang === 'hi' ? [
          `${name} हिंदू आध्यात्मिक परंपरा में अत्यंत महत्वपूर्ण और पवित्र वैदिक अनुष्ठान है, जिसका उद्देश्य ${categoryTexts.intro} इस पूजा की महिमा और विधि का वर्णन प्राचीन वेदों, उपनिषदों और पुराणों में विस्तार से मिलता है। इस अनुष्ठान के आयोजन से घर में दिव्य सकारात्मक ऊर्जा का संचार होता है, जिससे मानसिक अशांति दूर होती है और वातावरण में शांति व पवित्रता का वास होता है।`,
          `हमारे प्राचीन ऋषियों के अनुसार, प्रत्येक मनुष्य इस विराट ब्रह्मांड का एक सूक्ष्म अंश है। हमारे जीवन के सुख-दुख, सफलता और बाधाएं सीधे तौर पर ब्रह्मांडीय नियमों से जुड़ी हैं। ${name} के माध्यम से हम ब्रह्मांडीय शक्तियों के साथ अपने जीवन का सामंजस्य स्थापित करते हैं। यह हमारे शरीर के चक्रों और ऊर्जा वाहिनियों (नाड़ियों) को शुद्ध करता है और परिवार के चारों ओर सकारात्मक ऊर्जा का सुरक्षा कवच निर्मित करता है।`,
          `इस पूजा का प्रभाव बहुआयामी है। हवन कुंड की पवित्र अग्नि में अर्पित की जाने वाली सामग्री और मंत्रोच्चार से निकलने वाली ध्वनि तरंगें सीधे हमारे मन और आत्मा पर काम करती हैं। जब योग्य ब्राह्मणों द्वारा शास्त्रीय विधि से संस्कृत के मंत्रों का उच्चारण किया जाता है, तो उससे उत्पन्न कंपन मस्तिष्क को शांत करता है, तनाव हार्मोन को कम करता है और आंतरिक चेतना को जागृत करता है।`
        ] : [
          `${name} એ હિન્દુ આધ્યાત્મિક પરંપરામાં અત્યંત મહત્વપૂર્ણ અને પવિત્ર વૈદિક વિધિ છે, જેનો મુખ્ય હેતુ ${categoryTexts.intro} આ પૂજાનો મહિમા અને પદ્ધતિ આપણા પ્રાચીન વેદો અને પુરાણોમાં સવિસ્તાર વર્ણવેલી છે. આ પૂજાના આયોજનથી ઘરમાં સકારાત્મક ઉર્જાનો સંચાર થાય છે, જેનાથી માનસિક શાંતિ મળે છે અને વાતાવરણ શુદ્ધ બને છે.`,
          `આપણા પ્રાચીન ઋષિ-મુનિઓના મતે, દરેક મનુષ્ય આ અનંત બ્રહ્માંડનો એક સૂક્ષ્મ અંશ છે. આપણા જીવનના પ્રત્યેક પાસાંઓ અને પ્રગતિ બ્રહ્માંડના નિયમો સાથે જોડાયેલા છે. ${name} દ્વારા આપણે બ્રહ્માંડિય શક્તિઓ સાથે આપણા જીવનનું સંતુલન સાધીએ છીએ. આ વિધિ કરવાથી વ્યક્તિની આસપાસ સકારાત્મક ઉર્જાનું રક્ષણ કવચ બને છે અને પ્રગતિના દ્વાર ખુલે છે.`,
          `આ પૂજાનો પ્રભાવ ખૂબ જ વ્યાપક છે. હવન કુંડમાં સમર્પિત થતા દ્રવ્યો અને મંત્રોચ્ચારથી ઉત્પન્ન થતી ધ્વનિ તરંગો સીધી આપણા મન અને વાતાવરણ પર અસર કરે છે. જ્યારે કાશી અને અન્ય પવિત્ર તીર્થોથી શિક્ષિત વિદ્વાન બ્રાહ્મણો દ્વારા વેદોક્ત મંત્રોનો જાપ કરવામાં આવે છે, ત્યારે તે માનસिक શાંતિ પ્રદાન કરે છે અને પરિવારમાં સુખ-શાંતિ લાવે છે.`
        ]
      },
      {
        title: t.astrologicalTitle,
        paragraphs: lang === 'en' ? [
          `Astrologically, ${name} is highly recommended for ${categoryTexts.astrological} In the birth chart (Kundli), the placement and strength of planets govern our physical health, career prospects, financial stability, and relationship harmony. Unfavorable planetary transits (Gochara) or chronic astrological doshas (such as Pitru Dosha, Shani Mahadasha, Rahu-Ketu transit, or Grahan Yoga) can cause unexpected losses, chronic health issues, relationship strain, and mental anxiety.`,
          `By performing the ${name}, we request the pacification of malefic planetary configurations and strengthen the benefic planetary energy in our chart. For instance, if you are experiencing blocks due to: ${benefits.join(', ')}. Each benefit is realized as the energy of the ruling deity is channeled to heal specific areas of life. It acts as an astrological remedy (Upaya) that helps ease obstacles, allowing your hard work to yield positive results.`,
          `Moreover, this puja helps reduce the intensity of past karmic blockages. In Vedic philosophy, some challenges are manifestations of past karmas that must be worked through. Vedic rituals serve as spiritual mitigations that reduce the harshness of these experiences, much like an umbrella reduces the impact of heavy rain. The astrological benefits extend to providing financial stability, career promotion, educational success for children, and domestic peace and harmony.`
        ] : lang === 'hi' ? [
          `ज्योतिषीय दृष्टिकोण से, ${name} ${categoryTexts.astrological} हमारी जन्म कुंडली में ग्रहों की स्थिति हमारे करियर, स्वास्थ्य, धन और पारिवारिक संबंधों को निर्धारित करती है। जब कोई ग्रह प्रतिकूल गोचर में होता है या कुंडली में कोई गंभीर दोष होता है, तो व्यक्ति को अनावश्यक बाधाएं, आर्थिक हानि, मानसिक तनाव और स्वास्थ्य संबंधी समस्याओं का सामना करना पड़ता है।`,
          `इस अनुष्ठान के माध्यम से हम ग्रहों की नकारात्मकता को कम करते हैं और उनके शुभ प्रभाव को बढ़ाते हैं। उदाहरण के लिए, यदि आप निम्नलिखित समस्याओं से गुजर रहे हैं: ${benefits.join(', ')}। तो यह पूजा उन नकारात्मक प्रभावों को दूर कर जीवन में तरक्की का मार्ग प्रशस्त करती है। यह एक अचूक ज्योतिषीय उपाय (उपाय) है जो ग्रहों की प्रतिकूलता को अनुकूलता में बदलता है।`,
          `वैदिक दर्शन के अनुसार, जीवन की कई चुनौतियाँ पूर्व संचित कर्मों का परिणाम होती हैं। वैदिक यज्ञ और पूजन उन कर्मों के प्रभाव को कम करने का कार्य करते हैं, ठीक उसी तरह जैसे छाता भारी बारिश के प्रभाव से बचाता है। इस पूजा से घर में सुख-समृद्धि, व्यापार में उन्नति, बच्चों की शिक्षा में सफलता और मानसिक शांति प्राप्त होती है।`
        ] : [
          `જ્યોતિષીય દ્રષ્ટિએ, ${name} ${categoryTexts.astrological} આપણી જન્મકુંડળીમાં ગ્રહોની દશા આપણા સ્વાસ્થ્ય, કારકિર્દી અને સંબંધો પર ઊંડી અસર કરે છે. જ્યારે કોઈ ગ્રહ નબળો હોય કે કુંડળીમાં દોષ હોય, ત્યારે વ્યક્તિને વારંવાર મુશ્કેલીઓ, નાણાકીય નુકસાન અને માનસિક અશાંતિનો સામનો કરવો પડે છે.`,
          `આ અનુષ્ઠાન દ્વારા આપણે નકારાत्मक અસરોને શાંત કરીએ છીએ અને શુભ ગ્રહોના બળમાં વધારો કરીએ છીએ. જો તમે આ વિઘ્નોનો સામનો કરી રહ્યા છો: ${benefits.join(', ')}। તો આ પૂજા તે તમામ પ્રતિકૂળતાઓને દૂર કરી જીવનમાં સુમેળ અને પ્રગતિ લાવે છે. તે એક ઉત્તમ જ્યોતિષીય ઉપાય છે.`,
          `વૈદિક જ્ઞાન અનુસાર, જીવનની મુશ્કેलीઓ ઘણીવાર ભૂતકાળના કર્મોના કારણે હોય છે. વૈદિક પૂજા અને હવન તે કર્મોની તીવ્રતાને ઘટાડે છે, જેમ છત્રી આપણને ધોધમાર વરસાદથી બચાવે છે. આ વિધિથી નાણાકીય સુધારો થાય છે, નોકરી-ધંધામાં પ્રગતિ થાય છે અને પરિવારમાં ખુશીઓ આવે છે.`
        ]
      },
      {
        title: t.ritualTitle,
        paragraphs: lang === 'en' ? [
          `The performance of ${name} is a highly structured process, guided strictly by the Vedic scriptures (Shastras). The process begins with the purification of the space using Gangajal and panchamrit, followed by the setup of the sacred altar (Vedi) and kalash installation. The main steps performed during this ceremony include: ${process.join(', ')}. Each step holds a symbolic and spiritual meaning, representing the surrender of the ego and invocation of divine qualities.`,
          `A central feature of this ritual is the ${categoryTexts.ritualDesc} The fire in the Havan Kund is considered the mouth of the supreme deity (Agni Dev), who carries the offerings directly to the celestial realm. High-quality dry wood (samidha) from sacred trees, cow ghee, sesame seeds, barley, and specialized ayurvedic herbs (havan samagri) are offered into the holy fire. The smoke arising from the Havan is loaded with negative-ion generating properties, which cleanses the air of physical and subtle impurities.`,
          `During the main chanting phase, the pandits recite the powerful Sanskrit mantras multiple times (ranging from 108 to 11,000 repetitions depending on the scale). The alignment of the pandit's vocal frequency, the sacred fire, and the client's internal intent (Sankalpa) creates a powerful energy field. The ritual concludes with the Purnahuti (final offering), Aarti, prayers for global peace (Shanti Path), and distribution of the sanctified Prasad among the devotees.`
        ] : lang === 'hi' ? [
          `${name} की शास्त्रीय पूजन विधि वेदों में वर्णित नियमों के अनुसार अत्यंत व्यवस्थित होती है। इसकी शुरुआत गंगाजल से पूजन स्थल की शुद्धि, वेदी निर्माण और कलश स्थापना से होती है। इस पूजा के प्रमुख चरण इस प्रकार हैं: ${process.join(', ')}। प्रत्येक चरण का अपना एक गहरा आध्यात्मिक अर्थ है, जो समर्पण और दैवीय कृपा का प्रतीक है।`,
          `इस अनुष्ठान का मुख्य अंग ${categoryTexts.ritualDesc} हवन कुंड की पवित्र अग्नि को साक्षात अग्नि देव (ईश्वर का मुख) माना जाता है, जो हमारे द्वारा अर्पित की गई आहुतियों को देव लोक तक पहुंचाते हैं। आम या पलाश की पवित्र लकड़ी (समिधा), शुद्ध गाय का घी, तिल, जव और आयुर्वेदिक जड़ी-बूटियों (हवन सामग्री) को मंत्रोच्चार के साथ अग्नि में समर्पित किया जाता है। इससे निकलने वाला धुआं वायुमंडल को रोगाणुमुक्त और पवित्र बनाता है।`,
          `मंत्र जाप के दौरान, पंडितों द्वारा पवित्र वैदिक मंत्रों का सामूहिक उच्चारण किया जाता है। मंत्रों की संख्या और जाप का समय पूजा के संकल्प के अनुसार निर्धारित होता है। पूजा की पूर्णाहुति के बाद, आरती की जाती है और विश्व शांति के लिए 'शांति पाठ' किया जाता है। अंत में सभी भक्तों को पवित्र प्रसाद और आशीर्वाद दिया जाता है।`
        ] : [
          `${name} ની શાસ્ત્રોક્ત વિધિ વૈદિક નિયમો અનુસાર અત્યંત ચોક્કસ રીતે કરવામાં આવે છે. પૂજાની શરૂઆત ગંગાજળથી પૂજા સ્થાનને પવિત્ર કરવા, કળશ સ્થાપન અને ગણપતિ પૂજનથી થાય છે. આ વિધિના મુખ્ય તબક્કાઓ નીચે મુજબ છે: ${process.join(', ')}. દરેક તબક્કાનો ઊંડો આધ્યાત્મિક અર્થ છે જે દેવ પ્રત્યે સમર્પણ દર્શાવે છે.`,
          `આ વિધિનું મુખ્ય અંગ ${categoryTexts.ritualDesc} હવન કુંડની પવિત્ર અગ્નિને અગ્નિદેવ (પરમાત્માનું મુખ) માનવામાં આવે છે, જે આપણી આહુતિઓને સીધા દેવો સુધી પહોંચાડે છે. હવનમાં શુદ્ધ સમિધ કાષ્ટ, ગાયનું ઘી, તલ, જવ અને પવિત્ર ઔષધિઓ મંત્રોચ્ચાર સાથે હોમવામાં આવે है. આ હવનથી આસપાસનું વાતાવરણ અત્યંત શુદ્ધ અને ઊર્જાસભર બને છે.`,
          `મંત્ર જાપના તબક્કામાં, પંડિતો દ્વારા શુદ્ધ સંસ્કૃત ઉચ્ચાર સાથે મંત્રોનો જાપ થાય છે. જાપની સંખ્યા સંકલ્પ અનુસાર નક્કી થાય છે. વિધિના અંતે પૂર્ણાહુતિ, મહાઆરતી, શાંતિ પાઠ અને પ્રસાદ વિતરણ કરવામાં આવે છે.`
        ]
      },
      {
        title: t.prepTitle,
        paragraphs: lang === 'en' ? [
          `To gain the maximum spiritual benefits of ${name}, proper preparation is highly recommended for the host (Yajaman). On the day of the puja, the host should wake up early, take a bath, and wear clean traditional attire (preferably yellow, white, or light colors). It is recommended to maintain a calm, meditative mindset and keep a fast or consume a light, satvik diet consisting of milk and fruits before the start of the ceremony.`,
          `Purity of both mind and body is essential. Avoid negative thoughts, anger, and gossip on the day of the puja. If the puja is being performed at your home, ensure the puja room is clean, free of clutter, and well-ventilated. Arrange clean seating (asanas) for the pandits and the family members. Keep all personal offerings like dry fruits, sweets, coconut, and flowers washed and ready. It is important to participate in the entire ceremony with absolute faith and focus.`,
          `We ensure a completely hassle-free experience for you. Our verified Vedic pandits bring all essential, certified materials with them, so you do not have to worry about missing any details. During the puja, the pandits will guide you through the Sankalpa (solemn vow) where they state your name, family gotra, and specific wishes, aligning the cosmic energies directly with your personal goals.`
        ] : lang === 'hi' ? [
          `${name} का पूर्ण फल प्राप्त करने के लिए यजमान (पूजा कराने वाले) को शारीरिक और मानसिक पवित्रता का विशेष ध्यान रखना चाहिए। पूजा के दिन सुबह जल्दी उठकर स्नान करें और स्वच्छ पारंपरिक वस्त्र (पीले, सफेद या हल्के रंग) धारण करें। पूजा शुरू होने से पहले मन को शांत रखें और संभव हो तो उपवास रखें या केवल फलाहार करें।`,
          `मन और शरीर की शुद्धता अत्यंत आवश्यक है। पूजा के दिन क्रोध, नकारात्मक विचार और विवादों से दूर रहें। यदि पूजा घर पर हो रही है, तो मंदिर स्थल को साफ और सुगंधित रखें। पंडितों और परिवार के सदस्यों के बैठने के लिए साफ आसन बिछाएं। पूजा के लिए फल, मिठाई, नारियल आदि को धोकर एक साफ थाल में सजाएं। पूरी श्रद्धा के साथ पूजा में बैठें।`,
          `हम आपके लिए पूजा का अनुभव पूरी तरह से तनावमुक्त बनाते हैं। हमारे प्रमाणित वैदिक पंडित सभी आवश्यक सामग्री अपने साथ लाते हैं। पूजा के दौरान, पंडित जी आपका नाम, गोत्र और मनोकामना बोलकर आपका 'संकल्प' कराएंगे, जिससे ब्रह्मांडीय ऊर्जाएं सीधे आपकी इच्छाओं की पूर्ति में सहायक हो सकें।`
        ] : [
          `${name} નું સંપૂર્ણ ફળ મેળવવા માટે યજમાન (પૂજા કરાવનાર) એ શારીરિક અને માનસિક પવિત્રતાનું વિશેષ ધ્યાન રાખવું જોઈએ. પૂજાના દિવસે વહેલા ઉઠી, સ્નાન કરી પવિત્ર પરંપરાગત વસ્ત્રો (પીળા, સફેદ કે આછા રંગના) ધારણ કરો. પૂજા પહેલાં મનને શાંત અને પ્રસન્ન રાખો અને ફળાહાર અથવા ઉપવાસ કરો તો ઉત્તમ છે.`,
          `મન અને વચનની શુદ્ધતા અત્યંત જરૂરી છે. પૂજાના દિવસે ક્રોધ, નકારાત્મક ચિંતન અને વાદ-વિવાદથી દૂર રહો. જો પૂજા ઘરે થતી હોય તો પૂજા સ્થાનને સાફ-સુથરું રાખો. પંડિતો અને પરિવારના સભ્યો માટે આસનની વ્યવસ્થા કરો. પૂજા માટેના ફળો, મીઠાઈ વગેरे ધોઈને સ્વચ્છ થાળીમાં તૈયાર રાખો. શ્રદ્ધાપૂર્વક પૂજામાં બેસો.`,
          `અમે તમારા પૂજાના અનુભવને ખૂબ જ સરળ અને સુખદ બનાવીએ છીએ. અમારા પ્રમાણિત પંડિતો બધી જ પૂજા સામગ્રી સાથે લાવે છે. પૂજા દરમિયાન પંડિતો તમારું નામ અને ગોત્ર બોલાવીને સંકલ્પ કરાવશે, જેથી પૂજાનું દૈવી ફળ સીધું તમારા પરિવારને મળે.`
        ]
      },
      {
        title: t.faqTitle,
        paragraphs: lang === 'en' ? [
          `**Q: ${t.faq1_q}**\n*A: ${t.faq1_a}*`,
          `**Q: ${t.faq2_q}**\n*A: ${t.faq2_a}*`,
          `**Q: ${t.faq3_q}**\n*A: ${t.faq3_a}*`,
          `**Q: ${t.faq4_q}**\n*A: ${t.faq4_a}*`
        ] : lang === 'hi' ? [
          `**प्रश्न: ${t.faq1_q}**\n*उत्तर: ${t.faq1_a}*`,
          `**प्रश्न: ${t.faq2_q}**\n*उत्तर: ${t.faq2_a}*`,
          `**प्रश्न: ${t.faq3_q}**\n*उत्तर: ${t.faq3_a}*`,
          `**प्रश्न: ${t.faq4_q}**\n*उत्तर: ${t.faq4_a}*`
        ] : [
          `**પ્રશ્ન: ${t.faq1_q}**\n*જવાબ: ${t.faq1_a}*`,
          `**પ્રશ્ન: ${t.faq2_q}**\n*જવાબ: ${t.faq2_a}*`,
          `**પ્રશ્ન: ${t.faq3_q}**\n*જવાબ: ${t.faq3_a}*`,
          `**પ્રશ્ન: ${t.faq4_q}**\n*જવાબ: ${t.faq4_a}*`
        ]
      }
    ]
  };

  return data;
}
