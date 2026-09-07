// Price Engine module for Kaarigar Track B
const productCategories = require('../data/product_categories');

function getProductPricing(category, subcategory) {
  if (productCategories[category] && productCategories[category][subcategory]) {
    const data = productCategories[category][subcategory];
    return {
      min: data.min,
      max: data.max,
      average: data.average
    };
  }
  
  // Default prototype fallback if exact subcategory mismatch
  return {
    min: 100,
    max: 2000,
    average: 500
  };
}

function getSuggestedPrice(category, subcategory) {
  const pricing = getProductPricing(category, subcategory);
  return {
    min: pricing.min,
    max: pricing.max,
    average: pricing.average,
    suggestedPrice: pricing.average
  };
}

module.exports = {
  getProductPricing,
  getSuggestedPrice
};
