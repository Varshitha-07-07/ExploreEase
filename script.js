
const API_BASE = "http://localhost:3000/api";

const names = {
  restaurant: "Restaurants",
  shopping_mall: "Malls",
  shopping: "Shopping",
  school: "Schools",
  university: "Colleges",
  adventure: "Adventure",
  cafe: "Cafes",
  movie_theater: "Theaters",
  hospital: "Hospitals"
};

let city = "Vijayawada";
let category = "restaurant";
let places = [];
let currentTrip = null;

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number(n) || 0);

function safe(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function go(page) {
  ["home", "places", "planner", "saved"].forEach(p => {
    $(`${p}Page`).classList.toggle("hidden", p !== page);
  });

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  if (page === "saved") renderSaved();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-page]");
  if (!nav) return;
  event.preventDefault();
  go(nav.dataset.page);
});

setTimeout(() => {
  $("splash").classList.add("hidden");
  $("app").classList.remove("hidden");
}, 4000);

$("searchForm").addEventListener("submit", event => {
  event.preventDefault();

  city = $("city").value.trim();

  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  $("placesCity").value = city;
  searchPlaces();
  go("places");
});

$("placesSearchForm").addEventListener("submit", event => {
  event.preventDefault();

  city = $("placesCity").value.trim();

  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  $("city").value = city;
  searchPlaces();
});


document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    category = button.dataset.category;

    city = $("city").value.trim() ||
           $("placesCity").value.trim() ||
           city;

    if (!city) {
      alert("Please enter a city name first.");
      $("city").focus();
      return;
    }

    $("placesCity").value = city;

    searchPlaces();
    go("places");
  });
});
async function searchPlaces() {
  $("placesHeading").textContent = `${names[category]} in ${city}`;
  $("resultsTitle").textContent = `Top ${names[category]}`;
  $("status").textContent = `Searching ${city}...`;
  $("placesGrid").innerHTML = "";
  $("resultsCount").textContent = "";
    const enteredCity = city.trim();

  if (!enteredCity) {
    alert("Please enter a city name.");
    return;
  }

  try {
   const response = await fetch(
  `${API_BASE}/places?city=${encodeURIComponent(enteredCity)}&category=${encodeURIComponent(category)}`
);

    if (!response.ok) throw new Error("API unavailable");

    
const data = await response.json();

// Use the corrected city returned by server.js
if (data.city) {
  city = data.city;
  $("placesCity").value = data.city;

  const cityInput = $("city");
  if (cityInput) {
    cityInput.value = data.city;
  }
}

places = data.places || [];
renderPlaces();

    $("status").textContent = places.length
  ? `Showing ${places.length} results in ${data.locationFound || city}.`
  : "No results found. Try another category or city.";
    $("resultsCount").textContent = `${places.length} results`;
  } catch (error) {
    places = [];
    $("status").textContent =
      "Places API is not connected yet. Start the backend and check your Google API configuration.";
  }
}

function renderPlaces() {
  $("placesGrid").innerHTML = places.map((p, i) => {
    const query = encodeURIComponent(`${p.name} ${p.address || ""} ${city}`);
    const map = p.googleMapsUri ||
      `https://www.google.com/maps/search/?api=1&query=${query}`;
    const directions = p.location
      ? `https://www.google.com/maps/dir/?api=1&destination=${p.location.latitude},${p.location.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${query}`;

    return `
      <article class="place-card">
        <img class="place-photo" src="${safe(p.photoUrl || "")}"
             alt="${safe(p.name)}" loading="lazy"
             onerror="this.style.display='none'">
        <div class="place-body">
          <span class="place-type">${safe(names[category])}</span>
          <h3>${safe(p.name)}</h3>
          <p class="rating">${p.rating != null ? `★ ${safe(p.rating)}${p.userRatingCount ? ` (${safe(p.userRatingCount)})` : ""}` : "Rating unavailable"}</p>
          <p class="place-address">${safe(p.address || "Address unavailable")}</p>
          <div class="place-actions">
            <a href="${safe(map)}" target="_blank" rel="noopener">View Map ↗</a>
            <a href="${safe(directions)}" target="_blank" rel="noopener">Directions ↗</a>
            <button type="button" data-add="${i}">Add to trip +</button>
          </div>
        </div>
      </article>`;
  }).join("");

  $("placesGrid").querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => {
      const selected = JSON.parse(sessionStorage.getItem("eeSelected") || "[]");
      const place = places[Number(button.dataset.add)];
      if (!selected.some(p => p.id === place.id)) selected.push(place);
      sessionStorage.setItem("eeSelected", JSON.stringify(selected));
      $("tripCity").value = city;
      go("planner");
    });
  });
}

/* Trip planner */
function getTrip() {
  return {
    name: $("tripName").value.trim() || "My Trip",
    city: $("tripCity").value.trim(),
    date: $("tripDate").value,
    days: Math.max(1, Math.min(30, Number($("days").value) || 1)),
    people: Math.max(1, Number($("people").value) || 1),
    budget: Math.min(7000, Math.max(0, Number($("budget").value) || 0)),
    start: $("startLocation").value.trim() || "Starting point",
    interest: $("interest").value,
    hotel: Math.max(0, Number($("hotelCost").value) || 0),
    transport: Math.max(0, Number($("transportCost").value) || 0),
    meals: Math.max(0, Number($("mealCost").value) || 0),
    tickets: Math.max(0, Number($("ticketCost").value) || 0),
    shopping: Math.max(0, Number($("shoppingCost").value) || 0)
  };
}


function getBudget(t) {
  const nights = Math.max(0, t.days - 1);
  const rooms = Math.ceil(t.people / 2);

  const accommodation = rooms * t.hotel * nights;
  const transport = t.transport * t.people * t.days;
  const meals = t.meals * t.people * t.days;
  const tickets = t.tickets * t.people;
  const shopping = t.shopping * t.people;

  const total =
    accommodation + transport + meals + tickets + shopping;

  const allowed = t.budget * t.people;
  const remaining = allowed - total;

  const suggestions = [];

  if (remaining < 0) {
    if (accommodation > 0) {
      suggestions.push("Choose a lower-cost hotel or reduce the number of nights.");
    }
    if (transport > 0) {
      suggestions.push("Compare public transport with private transport.");
    }
    if (shopping > 0) {
      suggestions.push("Reduce the shopping budget.");
    }
    if (tickets > 0) {
      suggestions.push("Check free or lower-cost attractions.");
    }
    if (meals > 0) {
      suggestions.push("Choose affordable local food options.");
    }
  }

  return {
    accommodation,
    transport,
    meals,
    tickets,
    shopping,
    total,
    allowed,
    remaining,
    perPerson: total / t.people,
    suggestions
  };
}

function makeItinerary(t) {
  let selected = JSON.parse(
    sessionStorage.getItem("eeSelected") || "[]"
  );

  // Match the selected interest with the place category.
  if (t.interest !== "all") {
    selected = selected.filter(p =>
      (p.primaryType || "").toLowerCase()
        .includes(t.interest.toLowerCase())
    );
  }

  // Remove duplicate places.
  const uniquePlaces = [];
  const seen = new Set();

  [...selected, ...places].forEach(p => {
    const key = p.id || `${p.name}-${p.address}`;

    if (p.name && !seen.has(key)) {
      seen.add(key);
      uniquePlaces.push(p);
    }
  });

  const start = t.date
    ? new Date(`${t.date}T12:00:00`)
    : new Date();

  return Array.from({ length: t.days }, (_, day) => {
    const date = new Date(start);
    date.setDate(date.getDate() + day);

    const first = uniquePlaces[day * 3];
    const second = uniquePlaces[day * 3 + 1];
    const third = uniquePlaces[day * 3 + 2];

    const stops = [
      { time: "9:00 AM", title: "Start your day", detail: t.start }
    ];

    if (first) {
      stops.push({ time: "10:00 AM", place: first });
    }

    stops.push({
      time: "1:00 PM",
      title: "Lunch break",
      detail: "Choose a restaurant that suits your budget."
    });

    if (second) {
      stops.push({ time: "3:00 PM", place: second });
    }

    if (third) {
      stops.push({ time: "5:00 PM", place: third });
    }

    if (!first && !second && !third) {
      stops.push({
        time: "10:00 AM",
        title: "Discover local attractions",
        detail: `Search for more places in ${t.city} to complete your plan.`
      });
    }

    return {
      date: date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
      stops
    };
  });
}

$("tripForm").addEventListener("submit", event => {
  event.preventDefault();
  const t = getTrip();
  if (!t.city) return;

  currentTrip = { ...t, costs: getBudget(t), itinerary: makeItinerary(t) };
  renderTrip(currentTrip);
});

function renderTrip(t) {
  $("itinerary").classList.remove("hidden");
  $("itineraryTitle").textContent = `${t.name} — ${t.city}`;

  const b = t.costs;
  const items = [
    ["Accommodation", b.accommodation],
    ["Transport", b.transport],
    ["Meals", b.meals],
    ["Tickets", b.tickets],
    ["Shopping", b.shopping],
    ["Total estimate", b.total],
    ["Per person", b.perPerson],
    ["Group budget", b.allowed]
  ];

  $("budgetSummary").innerHTML = items.map(([label, amount]) => `
    <div class="budget-item"><p>${label}</p><strong>${money(amount)}</strong></div>
  `).join("");

  
$("budgetAdvice").classList.toggle("over", b.remaining < 0);

$("budgetAdvice").textContent = b.remaining >= 0
  ? `Great! Your estimated trip cost is ${money(b.total)}. You have ${money(b.remaining)} left from your group budget of ${money(b.allowed)}. Keep some money aside for unexpected expenses.`
  : `Your estimated trip cost exceeds your group budget by ${money(-b.remaining)}. ${b.suggestions.join(" ")}`;
  $("itineraryDays").innerHTML = t.itinerary.map((day, i) => `
    <article class="itinerary-day">
      <h3>Day ${i + 1} — ${safe(day.date)}</h3>
      ${day.stops.map(stop => {
        const p = stop.place;
        if (!p) return `<div class="itinerary-stop"><span class="stop-time">${stop.time}</span><div><b>${safe(stop.title)}</b><p>${safe(stop.detail)}</p></div></div>`;

        const q = encodeURIComponent(`${p.name} ${p.address || ""} ${t.city}`);
        return `<div class="itinerary-stop"><span class="stop-time">${stop.time}</span><div><b>${safe(p.name)}</b><p>${safe(p.address || "")}</p><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${q}">Find on Maps ↗</a></div></div>`;
      }).join("")}
    </article>
  `).join("");

  $("itinerary").scrollIntoView({ behavior: "smooth" });
}

$("saveTrip").addEventListener("click", () => {
  if (!currentTrip) return;
  const saved = JSON.parse(localStorage.getItem("eeTrips") || "[]");
  saved.unshift(currentTrip);
  localStorage.setItem("eeTrips", JSON.stringify(saved.slice(0, 30)));
  $("saveTrip").textContent = "✓ Saved";
  renderSaved();
});

function renderSaved() {
  const saved = JSON.parse(localStorage.getItem("eeTrips") || "[]");
  $("emptySaved").classList.toggle("hidden", saved.length > 0);

  $("savedGrid").innerHTML = saved.map((t, i) => `
    <article class="saved-card">
      <span class="place-type">${t.days} day${t.days === 1 ? "" : "s"}</span>
      <h3>${safe(t.name)}</h3>
      <p>📍 ${safe(t.city)}<br>📅 ${safe(t.date || "Date not selected")}<br>👥 ${t.people} people</p>
      <p>Estimated total: <b>${money(t.costs.total)}</b></p>
      <button class="search-button" data-view-trip="${i}">View itinerary</button>
      <button class="search-button" data-delete-trip="${i}">Delete</button>
    </article>
  `).join("");

  $("savedGrid").querySelectorAll("[data-view-trip]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentTrip = saved[Number(btn.dataset.viewTrip)];
      fillForm(currentTrip);
      renderTrip(currentTrip);
      go("planner");
    });
  });

  $("savedGrid").querySelectorAll("[data-delete-trip]").forEach(btn => {
    btn.addEventListener("click", () => {
      saved.splice(Number(btn.dataset.deleteTrip), 1);
      localStorage.setItem("eeTrips", JSON.stringify(saved));
      renderSaved();
    });
  });
}

function fillForm(t) {
  $("tripName").value = t.name;
  $("tripCity").value = t.city;
  $("tripDate").value = t.date;
  $("days").value = t.days;
  $("people").value = t.people;
  $("budget").value = t.budget;
  $("startLocation").value = t.start;
  $("interest").value = t.interest;
  $("hotelCost").value = t.hotel;
  $("transportCost").value = t.transport;
  $("mealCost").value = t.meals;
  $("ticketCost").value = t.tickets;
  $("shoppingCost").value = t.shopping;
}

const today = new Date();
const dateValue = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString().slice(0, 10);

$("tripDate").value = dateValue;
$("tripDate").min = dateValue;
$("placesCity").value = city;
$("tripCity").value = city;

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    const splash = document.getElementById("splash");
    const app = document.getElementById("app");

    if (splash) {
      splash.style.display = "none";
    }

    if (app) {
      app.classList.remove("hidden");
    }
  }, 4000);
});
