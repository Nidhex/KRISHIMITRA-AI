/* ==========================================================================
   KrishiMitra AI — Mobile Mandi Database Bundle
   Local verified mandi records, MSP standards, moisture rules, & APMC rates.
   ========================================================================== */

import { MandiItem } from '../types/info.types';

export const MANDI_DATABASE: MandiItem[] = [
  {
    id: "mandi-laxmipur-apmc",
    category: "mandi",
    title: "Laxmipur APMC",
    title_hi: "लक्ष्मीपुर सरकारी एपीएमसी मंडी",
    description: "Government APMC mandi located 12km from Kishanpur. Known for high paddy and tomato prices.",
    description_hi: "किशनपुर से 12 किमी दूर सरकारी एपीएमसी मंडी। धान एवं टमाटर की ऊंची दरों के लिए प्रसिद्ध।",
    metadata: {
      distance: "12km",
      type: "Government APMC",
      cropPrices: {
        paddy: { price: 2350, trend: "up", unit: "₹/Qtl" },
        wheat: { price: 2150, trend: "down", unit: "₹/Qtl" },
        tomato: { price: 1650, trend: "up", unit: "₹/Qtl" },
        potato: { price: 1350, trend: "stable", unit: "₹/Qtl" },
        mustard: { price: 5300, trend: "stable", unit: "₹/Qtl" }
      },
      highlightedFor: ["paddy", "tomato", "potato"],
      isLivePrice: false,
      updatedAt: new Date().toISOString().substring(0, 10),
    }
  },
  {
    id: "mandi-gorakhpur-sadar",
    category: "mandi",
    title: "Gorakhpur Sadar Mandi",
    title_hi: "गोरखपुर सदर मुख्य मंडी",
    description: "Gorakhpur district mandi located 18km from Kishanpur. Highest prices for wheat and mustard.",
    description_hi: "किशनपुर से 18 किमी दूर जिला मंडी। गेहूं एवं सरसों की सबसे ऊंची दरें।",
    metadata: {
      distance: "18km",
      type: "Government APMC",
      cropPrices: {
        paddy: { price: 2210, trend: "up", unit: "₹/Qtl" },
        wheat: { price: 2275, trend: "up", unit: "₹/Qtl" },
        tomato: { price: 1400, trend: "down", unit: "₹/Qtl" },
        potato: { price: 1280, trend: "up", unit: "₹/Qtl" },
        mustard: { price: 5450, trend: "up", unit: "₹/Qtl" }
      },
      highlightedFor: ["wheat", "mustard"],
      isLivePrice: false,
      updatedAt: new Date().toISOString().substring(0, 10),
    }
  },
  {
    id: "mandi-kishanpur-local",
    category: "mandi",
    title: "Kishanpur Mandi",
    title_hi: "किशनपुर स्थानीय मंडी",
    description: "Nearest local mandi at 4km. Best for tomatoes today due to low supply.",
    description_hi: "4 किमी पर निकटतम स्थानीय मंडी। आज कम आवक के कारण टमाटर की प्रीमियम दरें।",
    metadata: {
      distance: "4km",
      type: "Local Mandi",
      cropPrices: {
        paddy: { price: 2050, trend: "down", unit: "₹/Qtl" },
        wheat: { price: 2200, trend: "stable", unit: "₹/Qtl" },
        tomato: { price: 1800, trend: "up", unit: "₹/Qtl" },
        potato: { price: 1100, trend: "down", unit: "₹/Qtl" },
        mustard: { price: 5100, trend: "down", unit: "₹/Qtl" }
      },
      highlightedFor: ["tomato"],
      note: "Kishanpur Mandi is paying premium Rs.1800/Qtl today for tomatoes due to low supply.",
      isLivePrice: false,
      updatedAt: new Date().toISOString().substring(0, 10),
    }
  },
  {
    id: "mandi-msp-minimum-support-price",
    category: "mandi",
    title: "Minimum Support Price (MSP) Advisory",
    title_hi: "न्यूनतम समर्थन मूल्य (MSP) एवं क्रय केंद्र सलाह",
    description: "Government guaranteed benchmark price for agricultural crops (Wheat, Paddy, Mustard).",
    description_hi: "सरकारी न्यूनतम समर्थन मूल्य (MSP) की जानकारी। यदि व्यापारी MSP से कम रेट दें, तो सरकारी क्रय केंद्र पर फसल बेचें।",
    metadata: {
      concept: "MSP (Minimum Support Price)",
      advisory: "Compare private mandi quotes with official MSP rates (Wheat ₹2275/Qtl, Paddy ₹2300/Qtl).",
      advisory_hi: "प्राइवेट व्यापारी के भाव की तुलना सरकारी MSP (गेहूं ₹2275, धान ₹2300) से करें।",
      isLivePrice: false,
    }
  },
  {
    id: "mandi-moisture-deduction-rules",
    category: "mandi",
    title: "Mandi Moisture Cut & Quality Grading",
    title_hi: "मंडी में नमी कटौती और गुणवत्ता मानक",
    description: "Understanding standard moisture limits (12-14%) to avoid trader price deductions.",
    description_hi: "फसल में 12-14% से अधिक नमी होने पर व्यापारी भाव काटते हैं। धूप में सुखाकर ही मंडी ले जाएं।",
    metadata: {
      concept: "Moisture Content Standard",
      advisory: "Ensure grain moisture is below 12% for Wheat and 14% for Paddy before bringing produce to APMC mandi.",
      advisory_hi: "गेहूं में 12% और धान में 14% से कम नमी रखें ताकि कटौती न हो।",
      isLivePrice: false,
    }
  },
  {
    id: "mandi-transportation-economics",
    category: "mandi",
    title: "Mandi Transport Cost vs Profit Comparison",
    title_hi: "मंडी चुनाव एवं भाड़ा खर्च का हिसाब",
    description: "Calculate net profit considering transport cost between local and distant APMCs.",
    description_hi: "दूर की मंडी में ऊंचे भाव मिलने पर भी भाड़ा घटाकर ही शुद्ध लाभ का हिसाब लगाएं।",
    metadata: {
      concept: "Transport Economics",
      advisory: "Calculate Net Profit = (Price per Qtl * Quintals) - (Trolley Transport + Labor charges).",
      advisory_hi: "शुद्ध लाभ = (कुल भाव) - (ट्रैक्टर भाड़ा + हम्माली मजदूरी)।",
      isLivePrice: false,
    }
  },
  {
    id: "mandi-azamgarh-apmc",
    category: "mandi",
    title: "Azamgarh Main APMC Mandi",
    title_hi: "आजमगढ़ मुख्य मंडी समिति",
    description: "Major eastern UP mandi for vegetables, mustard, and pulses trading.",
    description_hi: "सब्जियों, सरसों और दलहन व्यापार हेतु पूर्वी उत्तर प्रदेश की बड़ी मंडी।",
    metadata: {
      type: "Government APMC",
      distance: "45km",
      cropPrices: {
        mustard: { price: 5400, trend: "up", unit: "₹/Qtl" },
        potato: { price: 1300, trend: "stable", unit: "₹/Qtl" }
      },
      highlightedFor: ["mustard", "chilli", "potato"],
      isLivePrice: false,
      updatedAt: new Date().toISOString().substring(0, 10),
    }
  },
  {
    id: "mandi-varanasi-pindra",
    category: "mandi",
    title: "Varanasi Pindra APMC Mandi",
    title_hi: "वाराणसी पिंडरा मंडी समिति",
    description: "Hub for tomato, green chilli, and paddy auctions in Purvanchal.",
    description_hi: "टमाटर, हरी मिर्च और धान के लिए पूर्वांचल की प्रमुख मंडी।",
    metadata: {
      type: "Government APMC",
      distance: "85km",
      cropPrices: {
        tomato: { price: 1750, trend: "up", unit: "₹/Qtl" },
        paddy: { price: 2320, trend: "up", unit: "₹/Qtl" }
      },
      highlightedFor: ["tomato", "paddy"],
      isLivePrice: false,
      updatedAt: new Date().toISOString().substring(0, 10),
    }
  },
  {
    id: "mandi-kanpur-chakeri",
    category: "mandi",
    title: "Kanpur Chakeri Grain & Oilseed Mandi",
    title_hi: "कानपुर चकेरी गल्ला व तिलहन मंडी",
    description: "Major central UP trading hub for wheat, pulses, and mustard oilseeds.",
    description_hi: "गेहूं, चना, सरसों और तिलहन व्यापार की सबसे बड़ी मध्य उत्तर प्रदेश मंडी।",
    metadata: {
      type: "Government APMC",
      distance: "160km",
      cropPrices: {
        wheat: { price: 2310, trend: "up", unit: "₹/Qtl" },
        mustard: { price: 5500, trend: "up", unit: "₹/Qtl" }
      },
      highlightedFor: ["wheat", "mustard"],
      isLivePrice: false,
      updatedAt: new Date().toISOString().substring(0, 10),
    }
  },
  {
    id: "mandi-offline-disclaimer",
    category: "mandi",
    title: "Offline Mandi Rates & Historical Benchmark Guide",
    title_hi: "ऑफलाइन मंडी भाव संबंधी दिशा-निर्देश",
    description: "Guidance on offline vs online mandi price updates in KrishiMitra.",
    description_hi: "ऑफलाइन मोड में हाल के रुझान और औसत भाव दिखाए जाते हैं। ताज़ा आज के लाइव भाव के लिए इंटरनेट से कनेक्ट करें।",
    metadata: {
      concept: "Offline Mandi Policy",
      advisory: "Offline database presents historical APMC benchmarks and trends. Connect online for live daily e-NAM prices.",
      advisory_hi: "ऑफलाइन ज्ञानकोष बेंचमार्क दरें दिखाता है। ताज़ा लाइव भाव हेतु इंटरनेट कनेक्ट करें।",
      isLivePrice: false,
    }
  }
];
