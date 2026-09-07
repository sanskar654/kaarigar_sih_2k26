// Listing Storage module for Kaarigar Track B & Track C
const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, 'listings.json');

let listings = [];

// Load existing listings from disk if present
try {
  if (fs.existsSync(STORAGE_FILE)) {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    listings = JSON.parse(raw);
  }
} catch (err) {
  console.warn('Could not read listings storage file, initializing empty listings array.', err.message);
  listings = [];
}

function saveToDisk() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(listings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save listings to disk:', err.message);
  }
}

function createListing(data) {
  const listingId = data.id || `LISTING_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  const newListing = {
    id: listingId,
    artisan: {
      id: data.artisan?.id || "ARTISAN_001",
      name: data.artisan?.name || "Ramesh",
      craft: data.artisan?.craft || "Pottery",
      location: data.artisan?.location || "Jaipur",
      verified: Boolean(data.artisan?.verified)
    },
    language: data.language || "hi",
    product: {
      name: data.product?.name || "",
      category: data.product?.category || "",
      subcategory: data.product?.subcategory || "",
      quantity: Number(data.product?.quantity) || 1
    },
    description: {
      original: data.description?.original || "",
      generatedEnglish: data.description?.generatedEnglish || "",
      generatedLocal: data.description?.generatedLocal || ""
    },
    pricing: {
      min: Number(data.pricing?.min) || 0,
      max: Number(data.pricing?.max) || 0,
      average: Number(data.pricing?.average) || 0,
      suggestedPrice: Number(data.pricing?.suggestedPrice) || 0,
      finalPrice: Number(data.pricing?.finalPrice) || 0
    },
    photo: {
      original: data.photo?.original || "",
      enhanced: data.photo?.enhanced || ""
    },
    status: data.status || "draft",
    createdAt: data.createdAt || new Date().toISOString()
  };

  const existingIndex = listings.findIndex(l => l.id === listingId);
  if (existingIndex >= 0) {
    listings[existingIndex] = newListing;
  } else {
    listings.push(newListing);
  }

  saveToDisk();
  return newListing;
}

function getListings(onlyPublished = true) {
  if (onlyPublished) {
    return listings.filter(l => l.status === 'published');
  }
  return listings;
}

function getListing(id) {
  return listings.find(l => l.id === id) || null;
}

function updateListing(id, updates) {
  const listing = getListing(id);
  if (!listing) return null;

  if (updates.product) {
    listing.product = { ...listing.product, ...updates.product };
  }
  if (updates.description) {
    listing.description = { ...listing.description, ...updates.description };
  }
  if (updates.pricing) {
    listing.pricing = { ...listing.pricing, ...updates.pricing };
  }
  if (updates.photo) {
    listing.photo = { ...listing.photo, ...updates.photo };
  }
  if (updates.status !== undefined) {
    listing.status = updates.status;
  }
  if (updates.language) {
    listing.language = updates.language;
  }
  
  listing.updatedAt = new Date().toISOString();
  saveToDisk();
  return listing;
}

module.exports = {
  createListing,
  getListings,
  getListing,
  updateListing
};
