 var map = L.map("map").setView([0, 0], 1);
      L.tileLayer(
        "https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=MEP1WldFdmFBot0VTJce",
        {
          attribution:
            '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        }
      ).addTo(map);
      var marker = L.marker([-1.28303, 36.8172313]).addTo(map);
      //Creating a circle

      var circle = L.circle([-1.31101, 36.8172313], {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.5,
        radius: 500,
      }).addTo(map);

      marker.bindPopup(
        "<b>Benir's Rendering<b> <br> This is my first map rendering"
      );