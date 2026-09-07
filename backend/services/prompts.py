# Kaarigar Multi-Language Voice & Text Dictionary Configuration (en, hi, mr, bn)

prompts = {
  "en": {
    "voiceLocale": "en-IN",
    "title": "Artisan Product Listing",
    "createHeader": "Create Your Product Listing",
    "previewSubtitle": "Review the information collected for your listing.",
    "stepLabel": "Step {step} of 5",

    # Spoken & On-Screen Questions
    "product": "What product would you like to sell?",
    "quantity": "How many pieces do you have?",
    "description": "Please tell us a little about your product.",
    "priceSuggestionHeading": "Price Suggestion",
    "typicalRange": "Typical range:",
    "suggestedPriceLabel": "Suggested price:",
    "priceQuestion": "The suggested price for your product is ₹{suggested}. Typical range is ₹{min} to ₹{max}. What is your final price?",
    "priceWarning": "The selected price is outside the typical range. Do you want to continue with ₹{price}?",
    "photo": "Please upload a photo of your product.",
    "choosePhoto": "Choose Photo",

    # Voice UI Status messages
    "speakingStatus": "Listen to question...",
    "listeningStatus": "Listening... Speak now",
    "recognizedPrefix": "Your answer: ",
    "retryVoiceBtn": "Speak Again",
    "manualTextToggle": "Or type answer manually",
    "processingPhoto": "Preparing your product photo...",
    "fallbackImageNotice": "Photo enhancement unavailable — using original photo.",
    "noVoiceNotice": "Voice not available for this language.",

    # Actions & Labels
    "review": "Please review your product listing.",
    "publish": "Publish Listing",
    "edit": "Edit Listing",
    "save": "Save Changes",
    "cancel": "Cancel",
    "success": "Listing Published!",
    "marketplace": "Your product is now available on the Kaarigar marketplace.",
    "viewListing": "View Listing",
    "verifiedBadge": "✓ Verified Artisan",
    "loadingUnderstanding": "Understanding your product...",
    "loadingDescription": "Creating your description...",
    "loadingPrice": "Checking price engine...",
    "loadingPhoto": "Processing photo with Photoroom...",
    "loadingListing": "Creating your listing...",
    "continue": "Continue",
    "improvingPhoto": "Improving your product photo...",
    "creatingBackground": "Creating your product background...",
    "photoReady": "Your product photo is ready!"
  },

  "hi": {
    "voiceLocale": "hi-IN",
    "title": "कारीगर उत्पाद सूची",
    "createHeader": "अपनी उत्पाद सूची बनाएं",
    "previewSubtitle": "अपनी लिस्टिंग के लिए एकत्रित जानकारी की जाँच करें।",
    "stepLabel": "चरण {step} / 5",

    # Spoken & On-Screen Questions
    "product": "आप कौन सा उत्पाद बेचना चाहते हैं?",
    "quantity": "आपके पास कितने नग हैं?",
    "description": "अपने उत्पाद के बारे में थोड़ा बताइए।",
    "priceSuggestionHeading": "मूल्य का सुझाव",
    "typicalRange": "सामान्य सीमा:",
    "suggestedPriceLabel": "सुझाया गया मूल्य:",
    "priceQuestion": "आपके उत्पाद के लिए सुझाया गया मूल्य ₹{suggested} है। सामान्य सीमा ₹{min} से ₹{max} है। आपकी अंतिम कीमत क्या है?",
    "priceWarning": "चुना गया मूल्य सामान्य सीमा से बाहर है। क्या आप ₹{price} के साथ आगे बढ़ना चाहते हैं?",
    "photo": "कृपया अपने उत्पाद की फोटो अपलोड करें।",
    "choosePhoto": "फ़ोटो चुनें",

    # Voice UI Status messages
    "speakingStatus": "प्रश्न सुनें...",
    "listeningStatus": "सुन रहे हैं... बोलिए",
    "recognizedPrefix": "आपका उत्तर: ",
    "retryVoiceBtn": "फिर से बोलें",
    "manualTextToggle": "या उत्तर टाइप करें",
    "processingPhoto": "आपकी फोटो तैयार की जा रही है...",
    "fallbackImageNotice": "फोटो प्रोसेसिंग उपलब्ध नहीं है — मूल फोटो का उपयोग किया गया है।",
    "noVoiceNotice": "इस भाषा के लिए आवाज उपलब्ध नहीं है।",

    # Actions & Labels
    "review": "कृपया अपनी उत्पाद सूची की जाँच करें।",
    "publish": "लिस्टिंग प्रकाशित करें",
    "edit": "लिस्टिंग संपादित करें",
    "save": "परिवर्तन सहेजें",
    "cancel": "रद्द करें",
    "success": "लिस्टिंग प्रकाशित हो गई!",
    "marketplace": "आपका उत्पाद अब Kaarigar marketplace पर उपलब्ध है।",
    "viewListing": "लिस्टिंग देखें",
    "verifiedBadge": "✓ सत्यापित कारीगर",
    "loadingUnderstanding": "आपके उत्पाद को समझा जा रहा है...",
    "loadingDescription": "आपका विवरण तैयार किया जा रहा है...",
    "loadingPrice": "मूल्य की जाँच की जा रही है...",
    "loadingPhoto": "Photoroom से फ़ोटो को बेहतर बनाया जा रहा है...",
    "loadingListing": "आपकी लिस्टिंग तैयार हो रही है...",
    "continue": "आगे बढ़ें",
    "improvingPhoto": "आपकी उत्पाद फोटो बेहतर की जा रही है...",
    "creatingBackground": "आपके उत्पाद का बैकग्राउंड बनाया जा रहा है...",
    "photoReady": "आपकी उत्पाद फोटो तैयार है!"
  },

  "mr": {
    "voiceLocale": "mr-IN",
    "title": "कारागीर उत्पादन सूची",
    "createHeader": "तुमची उत्पादन सूची तयार करा",
    "previewSubtitle": "तुमच्या लिस्टिंगसाठी गोळा केलेल्या माहितीची खात्री करा.",
    "stepLabel": "टप्पा {step} / 5",

    # Spoken & On-Screen Questions
    "product": "तुम्हाला कोणते उत्पादन विकायचे आहे?",
    "quantity": "तुमच्याकडे किती नग आहेत?",
    "description": "तुमच्या उत्पादनाबद्दल थोडक्यात सांगा.",
    "priceSuggestionHeading": "किंमतीचा सल्ला",
    "typicalRange": "साधारण किंमत श्रेणी:",
    "suggestedPriceLabel": "सुचवलेली किंमत:",
    "priceQuestion": "तुमच्या उत्पादनासाठी सुचवलेली किंमत ₹{suggested} आहे. साधारण किंमत श्रेणी ₹{min} ते ₹{max} आहे. तुमची अंतिम किंमत काय आहे?",
    "priceWarning": "निवडलेली किंमत सामान्य श्रेणीच्या बाहेर आहे. तुम्हाला ₹{price} सह पुढे जायचे आहे का?",
    "photo": "कृपया तुमच्या उत्पादनाचा फोटो अपलोड करा.",
    "choosePhoto": "फोटो निवडा",

    # Voice UI Status messages
    "speakingStatus": "प्रश्न ऐका...",
    "listeningStatus": "ऐकत आहे... बोला",
    "recognizedPrefix": "तुमचे उत्तर: ",
    "retryVoiceBtn": "पुन्हा बोला",
    "manualTextToggle": "किंवा टाईप करून सांगा",
    "processingPhoto": "तुमचा फोटो तयार करत आहोत...",
    "fallbackImageNotice": "फोटो प्रक्रिया उपलब्ध नाही — मूळ फोटो वापरला आहे.",
    "noVoiceNotice": "या भाषेसाठी आवाज उपलब्ध नाही.",

    # Actions & Labels
    "review": "कृपया तुमची उत्पादन सूची तपासा.",
    "publish": "प्रकाशित करा",
    "edit": "संपादित करा",
    "save": "बदल जतन करा",
    "cancel": "रद्द करा",
    "success": "लिस्टिंग प्रकाशित झाली!",
    "marketplace": "तुमचे उत्पादन आता Kaarigar marketplace वर उपलब्ध आहे.",
    "viewListing": "लिस्टिंग पहा",
    "verifiedBadge": "✓ प्रमाणित कारागीर",
    "loadingUnderstanding": "तुमचे उत्पादन समजून घेत आहे...",
    "loadingDescription": "तुमची माहिती तयार केली जात आहे...",
    "loadingPrice": "किंमत तपासली जात आहे...",
    "loadingPhoto": "Photoroom द्वारे फोटो प्रक्रिया सुरू आहे...",
    "loadingListing": "तुमची लिस्टिंग तयार केली जात आहे...",
    "continue": "आगे जा",
    "improvingPhoto": "तुमचा उत्पादन फोटो सुधारत आहोत...",
    "creatingBackground": "तुमच्या उत्पादनाची पार्श्वभूमी तयार करत आहोत...",
    "photoReady": "तुमचा उत्पादन फोटो तयार आहे!"
  },

  "bn": {
    "voiceLocale": "bn-IN",
    "title": "কারিগর পণ্য তালিকা",
    "createHeader": "আপনার পণ্য তালিকা তৈরি করুন",
    "previewSubtitle": "আপনার লিস্টিংয়ের জন্য সংগৃহীত তথ্য পরীক্ষা করুন।",
    "stepLabel": "ধাপ {step} / 5",

    # Spoken & On-Screen Questions
    "product": "আপনি কোন পণ্য বিক্রি করতে চান?",
    "quantity": "আপনার কাছে কতগুলি পণ্য আছে?",
    "description": "আপনার পণ্য সম্পর্কে একটু বলুন।",
    "priceSuggestionHeading": "মূল্য পরামর্শ",
    "typicalRange": "সাধারণ পরিসর:",
    "suggestedPriceLabel": "পরামর্শকৃত মূল্য:",
    "priceQuestion": "আপনার পণ্যের জন্য পরামর্শকৃত মূল্য ₹{suggested}। সাধারণ পরিসর ₹{min} থেকে ₹{max}। আপনার চূড়ান্ত দাম কত?",
    "priceWarning": "নির্বাচিত দাম সাধারণ পরিসরের বাইরে। আপনি কি ₹{price} দিয়ে এগিয়ে যেতে চান?",
    "photo": "অনুগ্রহ করে আপনার পণ্যের একটি ছবি আপলোড করুন।",
    "choosePhoto": "ছবি নির্বাচন করুন",

    # Voice UI Status messages
    "speakingStatus": "প্রশ্ন শুনুন...",
    "listeningStatus": "শুনছি... বলুন",
    "recognizedPrefix": "আপনার উত্তর: ",
    "retryVoiceBtn": "আবার বলুন",
    "manualTextToggle": "অথবা টাইপ করুন",
    "processingPhoto": "আপনার পণ্যের ছবি প্রস্তুত করা হচ্ছে...",
    "fallbackImageNotice": "ছবি প্রসেসিং পাওয়া যায়নি — মূল ছবি ব্যবহার করা হয়েছে।",
    "noVoiceNotice": "এই ভাষার জন্য ভয়েস উপলব্ধ নেই।",

    # Actions & Labels
    "review": "অনুগ্রহ করে আপনার পণ্যের তালিকাটি পরীক্ষা করুন।",
    "publish": "লিস্টিং প্রকাশ করুন",
    "edit": "লিস্টিং সম্পাদনা করুন",
    "save": "পরিবর্তন সংরক্ষণ করুন",
    "cancel": "বাতিল করুন",
    "success": "লিস্টিং প্রকাশিত হয়েছে!",
    "marketplace": "আপনার পণ্য এখন Kaarigar marketplace-এ উপলব্ধ।",
    "viewListing": "লিস্টিং দেখুন",
    "verifiedBadge": "✓ যাচাইকৃত কারিগর",
    "loadingUnderstanding": "আপনার পণ্যটি বোঝা হচ্ছে...",
    "loadingDescription:":"পণ্যের বিবরণ তৈরি করা হচ্ছে...",
    "loadingPrice": "মূল্য পরীক্ষা করা হচ্ছে...",
    "loadingPhoto": "Photoroom দিয়ে ছবি প্রক্রিয়া করা হচ্ছে...",
    "loadingListing": "লিস্টিং তৈরি হচ্ছে...",
    "continue": "এগিয়ে যান",
    "improvingPhoto": "আপনার পণ্যের ছবি উন্নত করা হচ্ছে...",
    "creatingBackground": "আপনার পণ্যের ব্যাকগ্রাউন্ড তৈরি করা হচ্ছে...",
    "photoReady": "আপনার পণ্যের ছবি প্রস্তুত!"
  }
}
