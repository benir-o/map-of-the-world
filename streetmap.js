var map = L.map("map").setView([0, 0], 1);
L.tileLayer(
    "https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=MEP1WldFdmFBot0VTJce",
    {
        attribution:
            '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }
).addTo(map);

// Layer for restaurant results
var restaurantsLayer = L.layerGroup().addTo(map);

// Variables to store marker and circle
var currentMarker = null;
var currentCircle = null;

// 1. Listen for when a location is successfully found
map.on('locationfound', function (e) {
    console.log("Location found:", e.latlng, "Accuracy:", e.accuracy);

    // Remove old marker/circle if they exist
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    if (currentCircle) {
        map.removeLayer(currentCircle);
    }

    // Get the detected accuracy and location coordinates
    const radius = e.accuracy || 1000; // fallback if accuracy missing
    const latlng = e.latlng;

    // Add a marker for the current location
    currentMarker = L.marker(latlng).addTo(map)
        .bindPopup("You are within " + Math.round(radius) + " meters from this point").openPopup();

    // Add a circle to show the accuracy radius (in meters)
    currentCircle = L.circle(latlng, {
        color: "blue",
        fillColor: "#0099ff",
        fillOpacity: 0.2,
        radius: radius
    }).addTo(map);

    // Zoom the map to fit the accuracy circle boundaries (but not too close)
    if (currentCircle.getBounds().isValid()) {
        map.fitBounds(currentCircle.getBounds(), { maxZoom: 16 });
    }

    // Fetch nearby restaurants (1.5 km default)
    fetchNearbyRestaurants(latlng.lat, latlng.lng, 1500);
});

// 2. Listen for when location finding fails (e.g., user denies permission)
map.on('locationerror', function (e) {
    console.error("Location error:", e.message);
    alert(e.message + "\n\nLocation tracking failed. Please ensure:\n1. Page is served from localhost or HTTPS\n2. You granted location permission in the browser\n3. Your device has location services enabled");
});

// Helper: escape user content for popup
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
}

// Fetch nearby restaurants using Overpass API (OpenStreetMap)
function fetchNearbyRestaurants(lat, lon, radius) {
    restaurantsLayer.clearLayers();
    var overpassUrl = 'https://overpass-api.de/api/interpreter';
    var query = '[out:json][timeout:50];(node["amenity"="restaurant"](around:' + radius + ',' + lat + ',' + lon + ');way["amenity"="restaurant"](around:' + radius + ',' + lat + ',' + lon + ');relation["amenity"="restaurant"](around:' + radius + ',' + lat + ',' + lon + '););out center;';

    console.log('Querying Overpass for restaurants:', { lat: lat, lon: lon, radius: radius });

    fetch(overpassUrl, { method: 'POST', body: query })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (!data.elements || data.elements.length === 0) {
                console.log('No restaurants found within ' + radius + ' meters');
                return;
            }

            data.elements.forEach(function (el) {
                var elLat = el.lat || (el.center && el.center.lat);
                var elLon = el.lon || (el.center && el.center.lon);
                if (!elLat || !elLon) return;

                var name = (el.tags && (el.tags.name || el.tags['brand'])) || 'Restaurant';
                var popup = '<b>' + escapeHtml(name) + '</b>';
                if (el.tags) {
                    if (el.tags['addr:street']) popup += '<br/>' + escapeHtml(el.tags['addr:street']);
                    if (el.tags['addr:housenumber']) popup += ' ' + escapeHtml(el.tags['addr:housenumber']);
                    if (el.tags.opening_hours) popup += '<br/>Hours: ' + escapeHtml(el.tags.opening_hours);
                    if (el.tags.website) popup += '<br/><a href="' + escapeHtml(el.tags.website) + '" target="_blank">Website</a>';
                }

                L.marker([elLat, elLon]).addTo(restaurantsLayer).bindPopup(popup);
            });

            // Fit map to restaurants if any were added
            if (restaurantsLayer.getLayers().length) {
                try { map.fitBounds(restaurantsLayer.getBounds(), { maxZoom: 16 }); } catch (e) { console.warn(e); }
            }
        })
        .catch(function (err) {
            console.error('Overpass query failed', err);
            // don't spam the user, just log
        });
}

// 3. Start the location detection
console.log("Starting geolocation request...");
map.locate({
    setView: false,      // we already fit after finding restaurants/POIs
    maxZoom: 16,
    watch: false,
    enableHighAccuracy: true
});