
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.GEOAPIFY_API_KEY;

// Keep these keys matching your existing HTML category buttons.
const categoryNames = {
  restaurant: "Restaurants",
  shopping_mall: "Shopping Malls",
  shopping: "Shopping",
  school: "Schools",
  university: "Colleges and Universities",
  adventure: "Tourist Attractions",
  cafe: "Cafes",
  movie_theater: "Movie Theaters",
  hospital: "Hospitals"
};

const geoCategories = {
  restaurant: "catering.restaurant",
  shopping_mall: "commercial",
  shopping: "commercial",
  school: "education.school",
  university: "education.university",
  adventure: "tourism",
  cafe: "catering.cafe",
  movie_theater: "entertainment.cinema",
  hospital: "healthcare.hospital"
};

app.get("/api/places", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: "GEOAPIFY_API_KEY is missing from .env"
      });
    }

    const city = String(req.query.city || "").trim();
    const category = String(req.query.category || "restaurant");

    if (!city || !geoCategories[category]) {
      return res.status(400).json({
        error: "Enter a city and select a valid category."
      });
    }

    // 1. Find the entered city, town, or village in India.
    
    // 1. Find the entered city, town, or village in India.
    const geocodeUrl = new URL(
      "https://api.geoapify.com/v1/geocode/search"
    );

    geocodeUrl.searchParams.set("text", city);
    geocodeUrl.searchParams.set("filter", "countrycode:in");
    geocodeUrl.searchParams.set("format", "json");
    geocodeUrl.searchParams.set("limit", "5");
    geocodeUrl.searchParams.set("lang", "en");
    geocodeUrl.searchParams.set("apiKey", API_KEY);

    const geoResponse = await fetch(geocodeUrl);
    const geoData = await geoResponse.json();

    if (!geoResponse.ok) {
      console.error("Geoapify geocoding error:", geoData);
      return res.status(geoResponse.status).json({
        error: geoData.message || "Could not find this location."
      });
    }

    const locations = geoData.results || [];

    if (locations.length === 0) {
      return res.status(404).json({
        error: `Location "${city}" was not found in India. Please check the spelling.`
      });
    }

    // Prefer an exact name match; otherwise use Geoapify's top suggestion.
    const normalize = (value) =>
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const enteredCity = normalize(city);

    const location =
      locations.find((item) =>
        [
          item.city,
          item.town,
          item.village,
          item.county,
          item.name
        ].some((name) => normalize(name) === enteredCity)
      ) || locations[0];

    const correctedCity =
      location.city ||
      location.town ||
      location.village ||
      location.name ||
      city;

    const lat = Number(location.lat);
    const lon = Number(location.lon);
    // 2. Search for the selected category near that location.
    const placesUrl = new URL(
      "https://api.geoapify.com/v2/places"
    );

    placesUrl.searchParams.set(
      "categories",
      geoCategories[category]
    );

    // Search within 15 km and prioritize nearer results.
    placesUrl.searchParams.set(
      "filter",
      `circle:${lon},${lat},15000`
    );
    placesUrl.searchParams.set(
      "bias",
      `proximity:${lon},${lat}`
    );
    placesUrl.searchParams.set("limit", "20");
    placesUrl.searchParams.set("lang", "en");
    placesUrl.searchParams.set("apiKey", API_KEY);

    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (!placesResponse.ok) {
      console.error("Geoapify places error:", placesData);
      return res.status(placesResponse.status).json({
        error: placesData.message || "Places search failed."
      });
    }

    // 3. Convert Geoapify results to the format script.js expects.
    const results = (placesData.features || []).map((feature, index) => {
      const p = feature.properties || {};
      const coordinates = feature.geometry?.coordinates || [];

      return {
        id: p.place_id || `${p.name || "place"}-${index}`,
        name: p.name || p.address_line1 || categoryNames[category],
        address: p.formatted || p.address_line2 || p.address_line1 || "",
        rating: null,
        userRatingCount: 0,
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${p.name || ""} ${p.formatted || city}`
        )}`,
        location: {
          longitude: coordinates[0] ?? lon,
          latitude: coordinates[1] ?? lat
        },
        primaryType: (p.categories || []).join(", "),
        photoUrl: ""
      };
    });

    res.json({
  city: correctedCity,
  searchedCity: city,
  category,
  places: results,
  locationFound: location.formatted || correctedCity
});
  } catch (error) {
    console.error("Places API error:", error);
    res.status(500).json({
      error: "Unable to retrieve places. Check the server terminal."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ExploreEase running at http://localhost:${PORT}`);
});