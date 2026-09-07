// Spoken Number Normalizer for Indic languages (Marathi, Hindi, Bengali, English)

const spokenNumberMap = {
  // Marathi
  'एक': 1, 'दोन': 2, 'तीन': 3, 'चार': 4, 'पाच': 5, 'सहा': 6, 'सात': 7, 'आठ': 8, 'नऊ': 9, 'दहा': 10,
  'अकरा': 11, 'बारा': 12, 'पंधरा': 15, 'वीस': 20, 'तीस': 30, 'चाळीस': 40, 'पन्नास': 50,
  'शंभर': 100, 'दीडशे': 150, 'दोनशे': 200, 'पाचशे': 500, 'हजार': 1000,

  // Hindi
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'पंद्रह': 15, 'बीस': 20, 'तीस': 30, 'चालिस': 40, 'पचास': 50,
  'सौ': 100, 'एक सौ': 100, 'डेढ़ सौ': 150, 'दो सौ': 200, 'पांच सौ': 500, 'हजार': 1000,

  // Bengali
  'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
  'এগারো': 11, 'বারো': 12, 'পনেরো': 15, 'কুড়ি': 20, 'ত্রিশ': 30, 'চল্লিশ': 40, 'পঞ্চাশ': 50,
  'একশ': 100, 'দেড়শ': 150, 'দ্বিশত': 200, 'পাঁচশ': 500, 'হাজার': 1000,

  // English
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'hundred': 100, 'one hundred': 100, 'one hundred fifty': 150, 'two hundred': 200, 'five hundred': 500, 'thousand': 1000
};

function parseSpokenNumber(text) {
  if (!text) return null;
  const str = String(text).trim().toLowerCase();

  // Direct digits check
  const digitsMatch = str.match(/\d+(\.\d+)?/);
  if (digitsMatch) {
    return parseFloat(digitsMatch[0]);
  }

  // Exact word lookup
  if (spokenNumberMap[str] !== undefined) {
    return spokenNumberMap[str];
  }

  // Word token lookup
  for (const [key, val] of Object.entries(spokenNumberMap)) {
    if (str.includes(key)) {
      return val;
    }
  }

  return null;
}

module.exports = { parseSpokenNumber };
