// Kaarigar Track B Multilingual Voice & Image Conversational Engine

let session = null;
let currentStep = 1;
let currentListing = null;

// Voice Synthesis & Recognition Variables
let availableVoices = [];
let recognition = null;
let isSpeaking = false;
let isListening = false;

// Timer Variables
let questionTimerInterval = null;
let questionTimeRemaining = 60;

// Session Data Store
const formData = {
  productAnswer: '',
  quantity: '',
  descriptionAnswer: '',
  category: '',
  subcategory: '',
  confidence: 'high',
  clarificationQuestion: '',
  generatedEnglishDescription: '',
  generatedLocalDescription: '',
  pricing: {
    min: 0,
    max: 0,
    average: 0,
    suggestedPrice: 0,
    finalPrice: 0
  },
  photoFile: null,
  photoOriginalUrl: '',
  photoEnhancedUrl: ''
};

// DOM Elements
const pageTitle = document.getElementById('pageTitle');
const progressContainer = document.getElementById('progressContainer');
const stepIndicator = document.getElementById('stepIndicator');
const progressFill = document.getElementById('progressFill');

const conversationSection = document.getElementById('conversationSection');
const questionHeader = document.getElementById('questionHeader');
const questionText = document.getElementById('questionText');

const voiceStatusBanner = document.getElementById('voiceStatusBanner');
const speakerIcon = document.getElementById('speakerIcon');
const micIcon = document.getElementById('micIcon');
const voiceStatusText = document.getElementById('voiceStatusText');
const retryVoiceBtn = document.getElementById('retryVoiceBtn');

const recognizedAnswerBox = document.getElementById('recognizedAnswerBox');
const recognizedPrefixLabel = document.getElementById('recognizedPrefixLabel');
const recognizedTextDisplay = document.getElementById('recognizedTextDisplay');

const userInput = document.getElementById('userInput');
const inputContainer = document.getElementById('inputContainer');
const manualTextToggleBtn = document.getElementById('manualTextToggleBtn');

const priceSuggestionBox = document.getElementById('priceSuggestionBox');
const priceTitle = document.getElementById('priceTitle');
const rangeLabel = document.getElementById('rangeLabel');
const priceRangeText = document.getElementById('priceRangeText');
const suggestedLabel = document.getElementById('suggestedLabel');
const suggestedPriceText = document.getElementById('suggestedPriceText');

const photoUploadBox = document.getElementById('photoUploadBox');
const photoInput = document.getElementById('photoInput');
const choosePhotoBtn = document.getElementById('choosePhotoBtn');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const photoPreviewImg = document.getElementById('photoPreviewImg');

const warningBox = document.getElementById('warningBox');
const warningMessage = document.getElementById('warningMessage');
const loadingState = document.getElementById('loadingState');
const loadingMessage = document.getElementById('loadingMessage');
const errorBox = document.getElementById('errorBox');
const errorMessage = document.getElementById('errorMessage');
const continueBtn = document.getElementById('continueBtn');

// Preview DOM Elements
const previewSection = document.getElementById('previewSection');
const previewMainTitle = document.getElementById('previewMainTitle');
const previewSubtitle = document.getElementById('previewSubtitle');
const previewPhotoImg = document.getElementById('previewPhotoImg');
const previewOriginalPhotoImg = document.getElementById('previewOriginalPhotoImg');
const photoBadge = document.getElementById('photoBadge');
const previewProductName = document.getElementById('previewProductName');
const previewCategory = document.getElementById('previewCategory');
const previewSubcategory = document.getElementById('previewSubcategory');
const previewQuantity = document.getElementById('previewQuantity');
const previewDescription = document.getElementById('previewDescription');
const previewSuggestedPrice = document.getElementById('previewSuggestedPrice');
const previewPrice = document.getElementById('previewPrice');
const previewArtisanName = document.getElementById('previewArtisanName');
const previewArtisanCraft = document.getElementById('previewArtisanCraft');
const previewArtisanLocation = document.getElementById('previewArtisanLocation');
const previewVerifiedBadge = document.getElementById('previewVerifiedBadge');

const editListingBtn = document.getElementById('editListingBtn');
const publishListingBtn = document.getElementById('publishListingBtn');

// Edit Section Elements
const editSection = document.getElementById('editSection');
const editForm = document.getElementById('editForm');
const editProductName = document.getElementById('editProductName');
const editCategory = document.getElementById('editCategory');
const editSubcategory = document.getElementById('editSubcategory');
const editQuantity = document.getElementById('editQuantity');
const editDescription = document.getElementById('editDescription');
const editFinalPrice = document.getElementById('editFinalPrice');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Success Section
const successSection = document.getElementById('successSection');
const successTitle = document.getElementById('successTitle');
const successMarketplaceMsg = document.getElementById('successMarketplaceMsg');
const viewListingLink = document.getElementById('viewListingLink');

// 1. Voice Resolution & Helper Functions
function loadVoices() {
  if ('speechSynthesis' in window) {
    availableVoices = window.speechSynthesis.getVoices();
  }
}

if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

function getVoiceForLanguage(langCode) {
  loadVoices();
  const targetLocale = (session && session.prompts && session.prompts.voiceLocale) ? session.prompts.voiceLocale : 'en-IN';
  console.log(`[VOICE] Requested language: ${targetLocale} (langCode: ${langCode})`);
  console.log(`[VOICE] Available voices:`, availableVoices.map(v => `${v.name} (${v.lang})`));

  if (!availableVoices || availableVoices.length === 0) {
    console.log(`[VOICE] No voices available yet in window.speechSynthesis.`);
    return null;
  }

  // Priority 1: Exact locale match (e.g. mr-IN, hi-IN, bn-IN, en-IN)
  let voice = availableVoices.find(v => v.lang.toLowerCase().replace('_', '-') === targetLocale.toLowerCase());
  if (voice) {
    console.log(`[VOICE] Selected voice: ${voice.name} (${voice.lang}) [Exact Match]`);
    return voice;
  }

  // Priority 2: Language-prefix match (e.g. mr, hi, bn, en)
  const prefix = langCode.toLowerCase();
  voice = availableVoices.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (voice) {
    console.log(`[VOICE] Selected voice: ${voice.name} (${voice.lang}) [Prefix Match]`);
    return voice;
  }

  // Strict Guard: Non-English language with no matching voice must NOT silently fall back to English!
  if (langCode !== 'en') {
    console.warn(`[VOICE] No matching voice available for requested language: ${langCode}. Suppressing silent English fallback.`);
    return null;
  }

  // Fallback for English requests ONLY
  const defaultVoice = availableVoices[0];
  console.log(`[VOICE] Selected default English fallback voice: ${defaultVoice ? defaultVoice.name : 'None'}`);
  return defaultVoice;
}

// Speak Question Aloud
function speakQuestion(text, onEndCallback) {
  hideError();
  hideWarning();
  const lang = session ? session.language : 'mr';
  const p = session.prompts;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    const selectedVoice = getVoiceForLanguage(lang);

    // Guard: Non-English language with no matching voice
    if (lang !== 'en' && !selectedVoice) {
      console.warn(`[VOICE] Cannot speak aloud in ${lang} (Voice unavailable). Displaying localized prompt.`);
      speakerIcon.style.display = 'inline-block';
      micIcon.style.display = 'none';
      voiceStatusText.innerText = p.noVoiceNotice || p.speakingStatus;
      retryVoiceBtn.style.display = 'inline-block';
      if (onEndCallback) onEndCallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = p.voiceLocale || 'mr-IN';
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.95;

    isSpeaking = true;
    speakerIcon.style.display = 'inline-block';
    micIcon.style.display = 'none';
    voiceStatusText.innerText = p.speakingStatus;
    retryVoiceBtn.style.display = 'none';

    utterance.onend = () => {
      isSpeaking = false;
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn("[VOICE] SpeechSynthesis error:", e);
      isSpeaking = false;
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  } else {
    if (onEndCallback) onEndCallback();
  }
}

// Initialize Speech Recognition for Target Locale
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = (session && session.prompts && session.prompts.voiceLocale) ? session.prompts.voiceLocale : 'mr-IN';

    recognition.onstart = () => {
      isListening = true;
      speakerIcon.style.display = 'none';
      micIcon.style.display = 'inline-block';
      voiceStatusText.innerText = session.prompts.listeningStatus;
      retryVoiceBtn.style.display = 'none';
    };

    recognition.onresult = (event) => {
      isListening = false;
      const transcript = event.results[0][0].transcript.trim();
      console.log("[RECOGNITION] Voice Recognized:", transcript);
      handleVoiceAnswer(transcript);
    };

    recognition.onerror = (event) => {
      isListening = false;
      console.warn("[RECOGNITION] Speech Recognition error:", event.error);
      micIcon.style.display = 'none';
      speakerIcon.style.display = 'inline-block';
      voiceStatusText.innerText = session.prompts.retryVoiceBtn;
      retryVoiceBtn.style.display = 'inline-block';
    };

    recognition.onend = () => {
      isListening = false;
      // Restart listening if the timer is still running
      if (questionTimerInterval && questionTimeRemaining > 0 && !isSpeaking) {
        startListening();
      } else {
        micIcon.style.display = 'none';
        speakerIcon.style.display = 'inline-block';
        if (!isSpeaking) {
           voiceStatusText.innerText = session.prompts.retryVoiceBtn || "Speak / Click to retry";
           retryVoiceBtn.style.display = 'inline-block';
        }
      }
    };
  } else {
    console.warn("Web SpeechRecognition API not supported by browser. Using text fallback.");
  }
}

// Timer Functions
function startQuestionTimer() {
  stopQuestionTimer();
  questionTimeRemaining = 60;
  
  const timerBox = document.getElementById('questionTimerBox');
  const timerText = document.getElementById('questionTimerText');
  
  if (timerBox && timerText) {
    timerBox.style.display = 'block';
    
    const lang = session ? session.language : 'en';
    let prefix = "Time remaining: ";
    if (lang === 'mr') prefix = "तुमच्या उत्तरासाठी वेळ शिल्लक: ";
    else if (lang === 'hi') prefix = "उत्तर देने के लिए समय शेष: ";
    else if (lang === 'bn') prefix = "আপনার উত্তরের জন্য সময় বাকি: ";
    
    timerText.innerText = `${prefix}${questionTimeRemaining}s`;

    questionTimerInterval = setInterval(() => {
      questionTimeRemaining--;
      timerText.innerText = `${prefix}${questionTimeRemaining}s`;
      
      if (questionTimeRemaining <= 0) {
        stopQuestionTimer();
        if (recognition) recognition.stop();
        // Time expired, move to next step by submitting current value or empty
        handleVoiceAnswer(userInput.value.trim() || ' ');
      }
    }, 1000);
  }
}

function stopQuestionTimer() {
  if (questionTimerInterval) clearInterval(questionTimerInterval);
  questionTimerInterval = null;
  const timerBox = document.getElementById('questionTimerBox');
  if (timerBox) timerBox.style.display = 'none';
}

// Automatically Start Microphone Listening
function startListening() {
  if (recognition && !isListening && !isSpeaking) {
    try {
      recognition.lang = (session && session.prompts && session.prompts.voiceLocale) ? session.prompts.voiceLocale : 'mr-IN';
      recognition.start();
    } catch (e) {
      console.warn("Mic start exception:", e);
    }
  }
}

// Page Load Initialization
document.addEventListener('DOMContentLoaded', async () => {
  const artisanId = localStorage.getItem('artisanId');
  const lang = localStorage.getItem('artisanLanguage') || 'hi';

  if (!artisanId) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const query = new URLSearchParams({ artisanId, lang });
    const res = await fetch(`/api/seller/session?${query.toString()}`);
    if (!res.ok) {
      if (res.status === 401 || res.status === 404) {
        localStorage.removeItem('artisanId');
        window.location.href = 'login.html';
        return;
      }
      throw new Error('Failed to load session');
    }
    session = await res.json();
    if (session && session.artisan) {
      if (previewArtisanName) previewArtisanName.innerText = session.artisan.name || '';
      if (previewArtisanCraft) previewArtisanCraft.innerText = session.artisan.craft_type || session.artisan.craft || 'Artisan';
      if (previewArtisanLocation) previewArtisanLocation.innerText = session.artisan.village || session.artisan.location || 'India';
      if (previewVerifiedBadge) previewVerifiedBadge.style.display = session.artisan.verified ? 'inline-block' : 'none';
    }

    setupLanguageUI();
    initSpeechRecognition();
    renderStep(1);
  } catch (err) {
    showError('Could not initialize session: ' + err.message);
  }
});

function setupLanguageUI() {
  const p = session.prompts;
  pageTitle.innerText = p.title;
  continueBtn.innerText = p.continue;
  choosePhotoBtn.innerText = p.choosePhoto;
  previewSubtitle.innerText = p.previewSubtitle;
  editListingBtn.innerText = p.edit;
  publishListingBtn.innerText = p.publish;
  successTitle.innerText = p.success;
  successMarketplaceMsg.innerText = p.marketplace;
  viewListingLink.innerText = p.viewListing;
  priceTitle.innerText = p.priceSuggestionHeading;
  rangeLabel.innerText = p.typicalRange;
  suggestedLabel.innerText = p.suggestedPriceLabel;
  previewVerifiedBadge.innerText = p.verifiedBadge;
  recognizedPrefixLabel.innerText = p.recognizedPrefix;
  retryVoiceBtn.innerText = p.retryVoiceBtn;
  manualTextToggleBtn.innerText = p.manualTextToggle;
}

function updateProgress(step) {
  currentStep = step;
  const p = session.prompts;
  stepIndicator.innerText = p.stepLabel.replace('{step}', step);
  progressFill.style.width = `${(step / 5) * 100}%`;
}

// Render Step
function renderStep(step) {
  hideError();
  hideWarning();
  hideLoading();
  stopQuestionTimer();
  updateProgress(step);

  const p = session.prompts;

  if (step === 1) { // ASK_PRODUCT
    questionHeader.innerText = p.createHeader;
    questionText.innerText = p.product;
    priceSuggestionBox.style.display = 'none';
    photoUploadBox.style.display = 'none';

    speakQuestion(p.product, () => {
      startQuestionTimer();
      startListening();
    });
  } else if (step === 2) { // ASK_QUANTITY
    questionText.innerText = p.quantity;
    priceSuggestionBox.style.display = 'none';
    photoUploadBox.style.display = 'none';

    speakQuestion(p.quantity, () => {
      startQuestionTimer();
      startListening();
    });
  } else if (step === 3) { // ASK_DESCRIPTION
    questionText.innerText = p.description;
    priceSuggestionBox.style.display = 'none';
    photoUploadBox.style.display = 'none';

    speakQuestion(p.description, () => {
      startQuestionTimer();
      startListening();
    });
  } else if (step === 4) { // SHOW_PRICE & ASK_FINAL_PRICE
    const pricePrompt = p.priceQuestion
      .replace('{suggested}', formData.pricing.suggestedPrice)
      .replace('{min}', formData.pricing.min)
      .replace('{max}', formData.pricing.max);

    questionText.innerText = pricePrompt;
    priceRangeText.innerText = `₹${formData.pricing.min} - ₹${formData.pricing.max}`;
    suggestedPriceText.innerText = `₹${formData.pricing.suggestedPrice}`;
    priceSuggestionBox.style.display = 'block';
    photoUploadBox.style.display = 'none';

    speakQuestion(pricePrompt, () => {
      startQuestionTimer();
      startListening();
    });
  } else if (step === 5) { // UPLOAD_PHOTO
    questionText.innerText = p.photo;
    priceSuggestionBox.style.display = 'none';
    photoUploadBox.style.display = 'flex';
    inputContainer.style.display = 'none';

    speakQuestion(p.photo, () => {
      speakerIcon.style.display = 'inline-block';
      micIcon.style.display = 'none';
      voiceStatusText.innerText = p.photo;
    });
  }

  // Refocus input if it's currently visible
  if (inputContainer.style.display !== 'none' && step < 5) {
    userInput.focus();
  }
}

// Handle Spoken Answer
async function handleVoiceAnswer(spokenText) {
  if (!spokenText || spokenText.trim() === '') return;
  stopQuestionTimer();
  recognizedTextDisplay.innerText = spokenText;
  recognizedAnswerBox.style.display = 'block';
  userInput.value = '';

  const p = session.prompts;

  if (currentStep === 1) { // Product
    formData.productAnswer = spokenText;
    renderStep(2);
  } else if (currentStep === 2) { // Quantity
    let qty = parseInt(spokenText, 10);
    if (isNaN(qty)) {
      try {
        const normRes = await fetch('/api/normalize-number', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: spokenText })
        });
        const normData = await normRes.json();
        if (normData.numberVal) qty = normData.numberVal;
      } catch (e) {}
    }
    if (!qty || isNaN(qty)) qty = 10;
    formData.quantity = qty;
    renderStep(3);
  } else if (currentStep === 3) { // Description
    formData.descriptionAnswer = spokenText;

    showLoading(p.loadingUnderstanding);
    try {
      const classRes = await fetch('/api/classify-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productAnswer: formData.productAnswer })
      });
      const classData = await classRes.json();
      if (!classRes.ok) throw new Error(classData.error || 'Classification failed');

      formData.category = classData.category;
      formData.subcategory = classData.subcategory;
      if (classData.productName) {
        formData.productName = classData.productName;
      }
      formData.confidence = classData.confidence;
      formData.pricing = classData.pricing;
      formData.pricing.suggestedPrice = classData.pricing.average;
      formData.pricing.finalPrice = classData.pricing.average;

      showLoading(p.loadingDescription);
      const descRes = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName || formData.productAnswer,
          category: formData.category,
          subcategory: formData.subcategory,
          quantity: formData.quantity,
          originalDescription: formData.descriptionAnswer,
          craft: session.artisan.craft,
          location: session.artisan.location,
          language: session.language
        })
      });
      const descData = await descRes.json();
      if (descRes.ok) {
        formData.generatedEnglishDescription = descData.generatedEnglish;
        formData.generatedLocalDescription = descData.generatedLocal;
      }

      hideLoading();
      renderStep(4);
    } catch (err) {
      hideLoading();
      showError(err.message);
    }
  } else if (currentStep === 4) { // Final Price
    let priceVal = parseFloat(spokenText);
    if (isNaN(priceVal)) {
      try {
        const normRes = await fetch('/api/normalize-number', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: spokenText })
        });
        const normData = await normRes.json();
        if (normData.numberVal) priceVal = normData.numberVal;
      } catch (e) {}
    }
    if (!priceVal || isNaN(priceVal)) priceVal = 150;

    if (priceVal < formData.pricing.min || priceVal > formData.pricing.max) {
      const msg = p.priceWarning.replace('{price}', priceVal);
      warningMessage.innerText = msg;
      warningBox.style.display = 'block';
    }

    formData.pricing.finalPrice = priceVal;
    renderStep(5);
  }
}

// Manual Controls & Photo Upload Handler
manualTextToggleBtn.addEventListener('click', () => {
  inputContainer.style.display = (inputContainer.style.display === 'none') ? 'block' : 'none';
  if (inputContainer.style.display === 'block') {
    userInput.focus();
  }
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    continueBtn.click();
  }
});

retryVoiceBtn.addEventListener('click', () => {
  startListening();
});

continueBtn.addEventListener('click', async () => {
  hideError();
  const val = userInput.value.trim();
  const p = session.prompts;

  if (currentStep === 5) {
    if (!formData.photoFile) return showError('Please upload a clear photo of your product.');

    showLoading(p.improvingPhoto || p.processingPhoto);
    const progressTimer = setTimeout(() => {
      showLoading(p.creatingBackground || p.loadingPhoto);
    }, 4000);

    try {
      const formPayload = new FormData();
      formPayload.append('photo', formData.photoFile);
      formPayload.append('productName', formData.productAnswer || '');
      formPayload.append('category', formData.category || '');
      formPayload.append('description', formData.descriptionAnswer || '');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formPayload
      });
      clearTimeout(progressTimer);
      showLoading(p.photoReady || "Your product photo is ready!");
      
      const uploadData = await uploadRes.json();
      
      console.log('[FRONTEND] Upload response:', uploadData);
      console.log('[FRONTEND] processed:', uploadData.processed);
      console.log('[FRONTEND] enhancedImage:', uploadData.enhancedImage);

      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      formData.photoOriginalUrl = uploadData.originalImage || uploadData.originalPath;
      formData.photoEnhancedUrl = uploadData.enhancedImage || uploadData.enhancedPath;

      const enhancementUnavailableBox = document.getElementById('enhancementUnavailableBox');
      const previewPhotoImg = document.getElementById('previewPhotoImg');
      const photoBadge = document.getElementById('photoBadge');

      previewPhotoImg.onload = () => {
          console.log('[FRONTEND] Enhanced image loaded successfully:', previewPhotoImg.src);
      };
      previewPhotoImg.onerror = () => {
          console.error('[FRONTEND] Enhanced image failed to load:', previewPhotoImg.src);
      };

      if (uploadData.processed === true && uploadData.enhancedImage) {
        const enhancedUrl = new URL(uploadData.enhancedImage, window.location.origin).href;
        console.log('[FRONTEND] Enhanced image URL:', enhancedUrl);
        
        previewPhotoImg.src = enhancedUrl;
        previewPhotoImg.style.display = 'block';
        if (photoBadge) photoBadge.style.display = 'inline-block';
        if (enhancementUnavailableBox) enhancementUnavailableBox.style.display = 'none';
      } else {
        previewPhotoImg.style.display = 'none';
        if (photoBadge) photoBadge.style.display = 'none';
        if (enhancementUnavailableBox) enhancementUnavailableBox.style.display = 'block';
      }

      showLoading(p.loadingListing);
      const listingPayload = {
        artisan: session.artisan,
        language: session.language,
        product: {
          name: formData.productName || formData.productAnswer,
          category: formData.category,
          subcategory: formData.subcategory,
          quantity: formData.quantity
        },
        description: {
          original: formData.descriptionAnswer,
          generatedEnglish: formData.generatedEnglishDescription,
          generatedLocal: formData.generatedLocalDescription
        },
        pricing: {
          min: formData.pricing.min,
          max: formData.pricing.max,
          average: formData.pricing.average,
          suggestedPrice: formData.pricing.suggestedPrice,
          finalPrice: formData.pricing.finalPrice
        },
        photo: {
          original: formData.photoOriginalUrl,
          enhanced: formData.photoEnhancedUrl || null
        },
        status: 'draft'
      };

      const listingRes = await fetch('/api/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingPayload)
      });
      const listingData = await listingRes.json();
      if (!listingRes.ok) throw new Error(listingData.error || 'Listing creation failed');

      currentListing = listingData.listing;
      hideLoading();
      showPreview();
    } catch (err) {
      hideLoading();
      showError(err.message);
    }
  } else {
    if (val) handleVoiceAnswer(val);
  }
});

// Photo Selection Controls
choosePhotoBtn.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    formData.photoFile = file;
    fileNameDisplay.innerText = file.name;
    const reader = new FileReader();
    reader.onload = (evt) => {
      photoPreviewImg.src = evt.target.result;
      imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// Render Preview
function showPreview() {
  progressContainer.style.display = 'none';
  conversationSection.style.display = 'none';
  editSection.style.display = 'none';
  previewSection.style.display = 'block';

  const originalPhotoImg = document.getElementById('previewOriginalPhotoImg');
  const previewPhotoImg = document.getElementById('previewPhotoImg');
  const photoBadge = document.getElementById('photoBadge');
  const enhancementUnavailableBox = document.getElementById('enhancementUnavailableBox');

  const origPhoto = currentListing?.photo?.original || currentListing?.image_url || formData.photoOriginalUrl || '';
  const enhPhoto = currentListing?.photo?.enhanced || currentListing?.image_url || formData.photoEnhancedUrl || null;

  if (originalPhotoImg && origPhoto) {
    originalPhotoImg.src = origPhoto;
  }
  
  if (enhPhoto) {
    const enhancedUrl = enhPhoto.startsWith('http') ? enhPhoto : new URL(enhPhoto, window.location.origin).href;
    previewPhotoImg.src = enhancedUrl;
    previewPhotoImg.style.display = 'block';
    if (photoBadge) photoBadge.style.display = 'inline-block';
    if (enhancementUnavailableBox) enhancementUnavailableBox.style.display = 'none';
  } else {
    previewPhotoImg.style.display = 'none';
    if (photoBadge) photoBadge.style.display = 'none';
    if (enhancementUnavailableBox) enhancementUnavailableBox.style.display = 'block';
  }

  const prodName = currentListing?.product?.name || currentListing?.title || formData.productName || formData.productAnswer || '';
  const prodCat = currentListing?.product?.category || currentListing?.category || formData.category || 'Handicraft';
  const prodSubcat = currentListing?.product?.subcategory || formData.subcategory || '';
  const prodQty = currentListing?.product?.quantity || currentListing?.quantity || formData.quantity || 1;
  const prodDesc = currentListing?.description?.generatedLocal || currentListing?.description?.generatedEnglish || currentListing?.description?.original || currentListing?.description_local || currentListing?.description || formData.generatedLocalDescription || formData.descriptionAnswer || '';
  const sugPrice = currentListing?.pricing?.suggestedPrice || formData.pricing?.suggestedPrice || currentListing?.price || 0;
  const finPrice = currentListing?.pricing?.finalPrice || formData.pricing?.finalPrice || currentListing?.price || 0;

  if (previewProductName) previewProductName.value = prodName;
  if (previewCategory) {
    let matched = false;
    for (let opt of previewCategory.options) {
      if (opt.value.toLowerCase() === prodCat.toLowerCase()) {
        opt.selected = true;
        matched = true;
        break;
      }
    }
    if (!matched && prodCat) {
      previewCategory.add(new Option(prodCat, prodCat, true, true));
    }
  }
  if (previewSubcategory) previewSubcategory.value = prodSubcat;
  if (previewQuantity) previewQuantity.value = prodQty;
  if (previewDescription) previewDescription.value = prodDesc;
  if (previewSuggestedPrice) previewSuggestedPrice.innerText = `₹${sugPrice}`;
  if (previewPrice) previewPrice.value = finPrice;

  const artName = currentListing?.artisan?.name || currentListing?.artisan_name || session?.artisan?.name || 'Artisan';
  const artCraft = currentListing?.artisan?.craft || currentListing?.artisan_craft || session?.artisan?.craft_type || session?.artisan?.craft || 'Handicraft';
  const artLoc = currentListing?.artisan?.location || currentListing?.artisan_village || session?.artisan?.village || session?.artisan?.location || 'India';
  const isVer = currentListing?.artisan?.verified ?? currentListing?.artisan_verified ?? session?.artisan?.verified ?? true;

  if (previewArtisanName) previewArtisanName.innerText = artName;
  if (previewArtisanCraft) previewArtisanCraft.innerText = artCraft;
  if (previewArtisanLocation) previewArtisanLocation.innerText = artLoc;

  if (previewVerifiedBadge) {
    previewVerifiedBadge.style.display = isVer ? 'inline-block' : 'none';
  }
}

// Real-time market benchmark update when category changes
async function updateSuggestedBenchmark() {
  const cat = previewCategory ? previewCategory.value : 'Handicraft';
  const subcat = previewSubcategory ? previewSubcategory.value.trim() : '';
  try {
    const res = await fetch('/api/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, subcategory: subcat })
    });
    if (res.ok) {
      const data = await res.json();
      if (previewSuggestedPrice) {
        previewSuggestedPrice.innerText = `₹${data.average}`;
      }
    }
  } catch (e) {
    console.warn('Could not update benchmark price:', e);
  }
}

if (previewCategory) previewCategory.addEventListener('change', updateSuggestedBenchmark);
if (previewSubcategory) previewSubcategory.addEventListener('change', updateSuggestedBenchmark);

// AI Polish Description Handler
const aiPolishDescBtn = document.getElementById('aiPolishDescBtn');
if (aiPolishDescBtn) {
  aiPolishDescBtn.addEventListener('click', async () => {
    const origText = aiPolishDescBtn.innerHTML;
    aiPolishDescBtn.disabled = true;
    aiPolishDescBtn.innerHTML = '⏳ Polishing...';
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: (previewProductName ? previewProductName.value.trim() : '') || formData.productName || formData.productAnswer || 'Handicraft',
          category: (previewCategory ? previewCategory.value : '') || formData.category || 'Handicraft',
          subcategory: (previewSubcategory ? previewSubcategory.value.trim() : '') || formData.subcategory || '',
          quantity: previewQuantity ? previewQuantity.value : 1,
          originalDescription: (previewDescription ? previewDescription.value.trim() : '') || formData.descriptionAnswer || '',
          craft: session?.artisan?.craft || session?.artisan?.craft_type || '',
          location: session?.artisan?.location || session?.artisan?.village || '',
          language: session?.language || 'hi'
        })
      });
      if (res.ok) {
        const data = await res.json();
        const polished = data.generatedLocal || data.generatedEnglish;
        if (polished && previewDescription) {
          previewDescription.value = polished;
        }
      }
    } catch (e) {
      console.warn('AI Polish error:', e);
    } finally {
      aiPolishDescBtn.disabled = false;
      aiPolishDescBtn.innerHTML = origText;
    }
  });
}

// Edit & Publish Handlers
if (editListingBtn) {
  editListingBtn.addEventListener('click', () => {
    previewSection.style.display = 'none';
    editSection.style.display = 'block';

    editProductName.value = previewProductName ? previewProductName.value : '';
    editQuantity.value = previewQuantity ? previewQuantity.value : 1;
    editDescription.value = previewDescription ? previewDescription.value : '';
    editFinalPrice.value = previewPrice ? previewPrice.value : 0;

    const catVal = previewCategory ? previewCategory.value : 'Handicraft';
    const subcatVal = previewSubcategory ? previewSubcategory.value : '';
    editCategory.innerHTML = `<option value="${catVal}">${catVal}</option>`;
    editSubcategory.innerHTML = `<option value="${subcatVal}">${subcatVal}</option>`;
  });
}

cancelEditBtn.addEventListener('click', () => {
  editSection.style.display = 'none';
  previewSection.style.display = 'block';
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const updatedPayload = {
    product: {
      name: editProductName.value,
      category: editCategory.value || (currentListing.product ? currentListing.product.category : 'Handicraft'),
      subcategory: editSubcategory.value || (currentListing.product ? currentListing.product.subcategory : ''),
      quantity: parseInt(editQuantity.value, 10) || 1
    },
    description: {
      generatedLocal: editDescription.value,
      generatedEnglish: editDescription.value
    },
    pricing: {
      finalPrice: parseFloat(editFinalPrice.value) || 0
    }
  };

  try {
    const res = await fetch(`/api/listing/${currentListing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update listing');

    currentListing = data.listing;
    editSection.style.display = 'none';
    showPreview();
  } catch (err) {
    alert('Edit failed: ' + err.message);
  }
});

publishListingBtn.addEventListener('click', async () => {
  publishListingBtn.disabled = true;
  const originalText = publishListingBtn.innerText;
  publishListingBtn.innerText = 'Publishing...';

  const updatedPayload = {
    product: {
      name: previewProductName ? previewProductName.value.trim() : (currentListing?.product?.name || 'Untitled'),
      category: previewCategory ? previewCategory.value : (currentListing?.product?.category || 'Handicraft'),
      subcategory: previewSubcategory ? previewSubcategory.value.trim() : (currentListing?.product?.subcategory || ''),
      quantity: previewQuantity ? (parseInt(previewQuantity.value, 10) || 1) : 1
    },
    description: {
      generatedLocal: previewDescription ? previewDescription.value.trim() : '',
      generatedEnglish: previewDescription ? previewDescription.value.trim() : ''
    },
    pricing: {
      finalPrice: previewPrice ? (parseFloat(previewPrice.value) || 0) : 0
    },
    status: 'published'
  };

  try {
    const res = await fetch(`/api/listing/${currentListing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Publish failed');

    previewSection.style.display = 'none';
    successSection.style.display = 'block';
    if (viewListingLink) {
      viewListingLink.href = `/buyer/marketplace.html`;
    }
  } catch (err) {
    alert('Publish failed: ' + err.message);
    publishListingBtn.disabled = false;
    publishListingBtn.innerText = originalText;
  }
});

function showLoading(msg) {
  loadingMessage.innerText = msg;
  loadingState.style.display = 'flex';
  continueBtn.disabled = true;
}

function hideLoading() {
  loadingState.style.display = 'none';
  continueBtn.disabled = false;
}

function showError(msg) {
  errorMessage.innerText = msg;
  errorBox.style.display = 'block';
}

function hideError() {
  errorBox.style.display = 'none';
}

function hideWarning() {
  warningBox.style.display = 'none';
}
