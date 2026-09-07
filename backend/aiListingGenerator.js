// AI Listing Generator & Classifier for Kaarigar Track B
const productCategories = require('../data/product_categories');

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_openai_api_key_here") {
    return null;
  }
  try {
    const { OpenAI } = require('openai');
    return new OpenAI({ apiKey });
  } catch (err) {
    return null;
  }
}

// Subcategory keyword map for smart fallback classification
const keywordMap = [
  { keywords: ['diya', 'diyas', 'दीप', 'दीया', 'दीये', 'दीवा', 'প্রদীপ'], category: 'Pottery & Ceramics', subcategory: 'Diyas' },
  { keywords: ['pot', 'pots', 'मटका', 'घड़ा', 'मातीचे भांडे'], category: 'Pottery & Ceramics', subcategory: 'Decorative Pots' },
  { keywords: ['planter', 'planters', 'गमला'], category: 'Pottery & Ceramics', subcategory: 'Planters' },
  { keywords: ['terracotta', 'figurine', 'मूर्ति', 'मूर्ती'], category: 'Pottery & Ceramics', subcategory: 'Terracotta Figurines' },
  { keywords: ['saree', 'sari', 'साड़ी', 'साडी', 'শাড়ি'], category: 'Textiles & Weaving', subcategory: 'Handwoven Sarees' },
  { keywords: ['dupatta', 'चुनरी', 'ओढ़नी'], category: 'Textiles & Weaving', subcategory: 'Handloom Dupattas' },
  { keywords: ['stole', 'stoles'], category: 'Textiles & Weaving', subcategory: 'Stoles' },
  { keywords: ['shawl', 'shawls', 'शॉल'], category: 'Textiles & Weaving', subcategory: 'Shawls' },
  { keywords: ['scarf', 'scarves', 'स्कार्फ'], category: 'Textiles & Weaving', subcategory: 'Handwoven Scarves' },
  { keywords: ['bag', 'bags', 'थैला', 'झोला', 'ব্যাগ'], category: 'Embroidery & Needlework', subcategory: 'Embroidered Bags' },
  { keywords: ['cushion', 'cushions', 'तकिया'], category: 'Embroidery & Needlework', subcategory: 'Cushion Covers' },
  { keywords: ['toy', 'toys', 'खिलौना', 'खेळणी', 'খেলনা'], category: 'Wood Craft', subcategory: 'Wooden Toys' },
  { keywords: ['box', 'boxes', 'डिब्बा', 'खोका'], category: 'Wood Craft', subcategory: 'Wooden Boxes' },
  { keywords: ['basket', 'baskets', 'टोकरी', 'टोपली', 'ঝুড়ি'], category: 'Bamboo & Cane', subcategory: 'Baskets' },
  { keywords: ['tray', 'trays', 'ट्रे'], category: 'Bamboo & Cane', subcategory: 'Trays' },
  { keywords: ['lampshade', 'lamp', 'दीपक', 'दिवा', 'বাতি'], category: 'Bamboo & Cane', subcategory: 'Lampshades' },
  { keywords: ['brass', 'पीतल', 'पितळ', 'পিতল'], category: 'Metal Craft', subcategory: 'Brass Diyas' },
  { keywords: ['earring', 'earrings', 'झुमका', 'बाली', 'দুল'], category: 'Jewellery', subcategory: 'Handcrafted Earrings' },
  { keywords: ['necklace', 'necklaces', 'हार', 'माला'], category: 'Jewellery', subcategory: 'Necklaces' },
  { keywords: ['bangle', 'bangles', 'चूड़ी', 'बांगडी', 'চুড়ি'], category: 'Jewellery', subcategory: 'Bangles' },
  { keywords: ['wallet', 'wallets', 'पर्स', 'पाकिट'], category: 'Leather Craft', subcategory: 'Wallets' },
  { keywords: ['belt', 'belts', 'बेल्ट'], category: 'Leather Craft', subcategory: 'Belts' },
  { keywords: ['madhubani', 'मधुबनी'], category: 'Paintings & Art', subcategory: 'Madhubani Paintings' },
  { keywords: ['warli', 'वारली'], category: 'Paintings & Art', subcategory: 'Warli Paintings' },
  { keywords: ['gond', 'गोंड'], category: 'Paintings & Art', subcategory: 'Gond Paintings' },
  { keywords: ['doll', 'dolls', 'गुड़िया', 'बाहुली', 'পুতুল'], category: 'Toys & Dolls', subcategory: 'Cloth Dolls' },
  { keywords: ['puppet', 'puppets', 'कठपुतली'], category: 'Toys & Dolls', subcategory: 'Puppets' },
  { keywords: ['candle', 'candles', 'मोमबत्ती'], category: 'Home & Decorative Crafts', subcategory: 'Candles' }
];

async function classifyProduct(userText) {
  const openai = getOpenAIClient();
  const text = (userText || '').toLowerCase();

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert Indian handicraft product classifier. Map the artisan input to ONE category and ONE subcategory from this exact schema: ${JSON.stringify(productCategories)}.
Return valid JSON strictly matching:
{
  "category": "Category Name",
  "subcategory": "Subcategory Name",
  "confidence": "high" | "low",
  "clarificationQuestion": "If confidence is low, ask a respectful clarification question asking if the product is option A or option B, else empty string."
}`
          },
          {
            role: "user",
            content: userText
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      if (parsed.category && parsed.subcategory) {
        return {
          category: parsed.category,
          subcategory: parsed.subcategory,
          confidence: parsed.confidence || "high",
          clarificationQuestion: parsed.clarificationQuestion || "",
          provider: "openai"
        };
      }
    } catch (err) {
      console.warn("OpenAI classification failed, falling back to local classifier:", err.message);
    }
  }

  // Local Keyword Fallback Classifier
  for (const item of keywordMap) {
    if (item.keywords.some(kw => text.includes(kw))) {
      return {
        category: item.category,
        subcategory: item.subcategory,
        confidence: "high",
        clarificationQuestion: "",
        provider: "fallback"
      };
    }
  }

  // Default fallback if no keyword matches
  return {
    category: "Pottery & Ceramics",
    subcategory: "Diyas",
    confidence: "high",
    clarificationQuestion: "",
    provider: "fallback"
  };
}

async function generateDescription({ productName, category, subcategory, quantity, originalDescription, craft, location, language }) {
  const openai = getOpenAIClient();

  if (openai) {
    try {
      const prompt = `Artisan Details: Craft=${craft}, Location=${location}
Product Details: Name=${productName}, Category=${category}, Subcategory=${subcategory}, Quantity=${quantity}
Original Description: ${originalDescription}
Target Language Code: ${language}

Generate a concise, truthful marketplace description.
CRITICAL RULE: DO NOT INVENT ANY UNSUPPORTED FACTS (no fake certifications, awards, materials, or historical claims).

Return JSON strictly formatted as:
{
  "generatedEnglish": "Polished English marketplace description",
  "generatedLocal": "Polished marketplace description in target language (${language})"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an authentic Indian craft copywriter." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        generatedEnglish: result.generatedEnglish || originalDescription,
        generatedLocal: result.generatedLocal || originalDescription,
        provider: "openai"
      };
    } catch (err) {
      console.warn("OpenAI description generation failed, falling back to template description:", err.message);
    }
  }

  // Local Template Fallback Description
  const engDesc = `Authentic handmade ${subcategory.toLowerCase()} carefully crafted by ${craft || 'artisan'} from ${location || 'India'}. ${originalDescription}`;
  
  let localDesc = engDesc;
  if (language === 'hi') {
    localDesc = `हस्तनिर्मित सुंदर ${subcategory.toLowerCase()}। ${location || 'जयपुर'} के कुशल कारीगर द्वारा तैयार किया गया। ${originalDescription}`;
  } else if (language === 'mr') {
    localDesc = `हस्तनिर्मित सुंदर ${subcategory.toLowerCase()}। ${location || 'महाराष्ट्र'} मधील कुशल कारागिराने बनवलेले. ${originalDescription}`;
  } else if (language === 'bn') {
    localDesc = `হস্তনির্মিত চমৎকার ${subcategory.toLowerCase()}। ${location || 'ভারত'}-এর দক্ষ কারিগর দ্বারা নির্মিত। ${originalDescription}`;
  }

  return {
    generatedEnglish: engDesc,
    generatedLocal: localDesc,
    provider: "fallback"
  };
}

module.exports = {
  classifyProduct,
  generateDescription
};
