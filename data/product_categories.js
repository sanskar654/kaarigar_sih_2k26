// Kaarigar Prototype Product Category & Pricing Dataset (12 categories, 58 subcategories)

const productCategories = {
  "Pottery & Ceramics": {
    "Diyas": { min: 20, max: 500, average: 100 },
    "Decorative Pots": { min: 150, max: 2500, average: 750 },
    "Planters": { min: 150, max: 2000, average: 600 },
    "Terracotta Figurines": { min: 100, max: 2000, average: 600 },
    "Clay Utensils": { min: 100, max: 1500, average: 400 },
    "Ceramic Cups": { min: 150, max: 800, average: 350 }
  },

  "Textiles & Weaving": {
    "Handwoven Sarees": { min: 800, max: 15000, average: 5000 },
    "Handloom Dupattas": { min: 300, max: 4000, average: 1500 },
    "Stoles": { min: 250, max: 3000, average: 1200 },
    "Shawls": { min: 500, max: 8000, average: 3000 },
    "Handwoven Scarves": { min: 200, max: 2000, average: 800 }
  },

  "Embroidery & Needlework": {
    "Embroidered Bags": { min: 250, max: 2500, average: 900 },
    "Embroidered Wall Hangings": { min: 300, max: 3000, average: 1200 },
    "Cushion Covers": { min: 200, max: 1500, average: 600 },
    "Embroidered Sarees": { min: 1000, max: 15000, average: 5000 },
    "Table Runners": { min: 250, max: 2000, average: 800 }
  },

  "Wood Craft": {
    "Wooden Toys": { min: 150, max: 2000, average: 500 },
    "Wooden Utensils": { min: 150, max: 1500, average: 500 },
    "Wooden Sculptures": { min: 500, max: 8000, average: 2500 },
    "Wooden Boxes": { min: 300, max: 3000, average: 1000 },
    "Wall Decor": { min: 300, max: 5000, average: 1500 }
  },

  "Bamboo & Cane": {
    "Baskets": { min: 150, max: 2000, average: 600 },
    "Trays": { min: 200, max: 1500, average: 600 },
    "Lampshades": { min: 400, max: 3000, average: 1200 },
    "Storage Boxes": { min: 300, max: 2500, average: 900 },
    "Furniture": { min: 1500, max: 15000, average: 5000 }
  },

  "Metal Craft": {
    "Brass Diyas": { min: 200, max: 2500, average: 700 },
    "Brass Idols": { min: 500, max: 10000, average: 3000 },
    "Metal Wall Decor": { min: 400, max: 5000, average: 1800 },
    "Metal Utensils": { min: 300, max: 3000, average: 1000 },
    "Decorative Figurines": { min: 300, max: 5000, average: 1500 }
  },

  "Jewellery": {
    "Beaded Jewellery": { min: 100, max: 1500, average: 500 },
    "Terracotta Jewellery": { min: 150, max: 2000, average: 700 },
    "Handcrafted Earrings": { min: 150, max: 2500, average: 700 },
    "Necklaces": { min: 300, max: 4000, average: 1200 },
    "Bangles": { min: 150, max: 2000, average: 600 }
  },

  "Leather Craft": {
    "Leather Bags": { min: 500, max: 5000, average: 1800 },
    "Wallets": { min: 300, max: 2500, average: 900 },
    "Belts": { min: 300, max: 2000, average: 800 },
    "Leather Footwear": { min: 500, max: 4000, average: 1600 },
    "Pouches": { min: 200, max: 1500, average: 600 }
  },

  "Paintings & Art": {
    "Madhubani Paintings": { min: 500, max: 15000, average: 3500 },
    "Warli Paintings": { min: 300, max: 8000, average: 2000 },
    "Gond Paintings": { min: 500, max: 12000, average: 3500 },
    "Miniature Paintings": { min: 500, max: 20000, average: 5000 },
    "Folk Art": { min: 300, max: 10000, average: 2500 }
  },

  "Stone Craft": {
    "Stone Sculptures": { min: 500, max: 20000, average: 5000 },
    "Stone Idols": { min: 500, max: 15000, average: 4000 },
    "Decorative Stone Items": { min: 300, max: 5000, average: 1500 },
    "Stone Jewellery": { min: 200, max: 3000, average: 900 }
  },

  "Toys & Dolls": {
    "Cloth Dolls": { min: 150, max: 1500, average: 500 },
    "Wooden Dolls": { min: 200, max: 2000, average: 600 },
    "Traditional Toys": { min: 150, max: 2000, average: 600 },
    "Puppets": { min: 200, max: 2500, average: 800 }
  },

  "Home & Decorative Crafts": {
    "Wall Hangings": { min: 200, max: 3000, average: 900 },
    "Handmade Lamps": { min: 300, max: 4000, average: 1200 },
    "Candles": { min: 100, max: 1000, average: 350 },
    "Decorative Boxes": { min: 200, max: 2500, average: 800 },
    "Festive Decorations": { min: 100, max: 2000, average: 500 }
  }
};

module.exports = productCategories;
