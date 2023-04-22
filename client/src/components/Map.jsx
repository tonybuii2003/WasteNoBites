import AddIcon from '@mui/icons-material/Add';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  IconButton,
  Typography,
  Modal,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'; // Import Modal here
import Stack from '@mui/material/Stack';
import L, { Icon } from 'leaflet';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.js';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap, useMapEvent, } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';  
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';  
import * as turf from '@turf/turf';
import React, { useEffect, useRef, useState } from 'react';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import MapDrawer from './MapDrawer';
import "../css/Map.css"
import 'leaflet.polyline.snakeanim';

require('leaflet-routing-machine');


const myIcon = new Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const mockDailyData = {
  storageRemaining: 75, // %
  distances: [
    { partner: 'Location A', distance: 5 }, // km
    { partner: 'Location B', distance: 7 }, // km
    { partner: 'Location C', distance: 3 }, // km
  ],
  foodShipmentRequests: [1, 0, 1, 1, 0], // last 5 days (1 if request that day, 0 otherwise)
};

const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const bounds = L.latLngBounds(southWest, northEast);

var maps = null;
var routing = null;
var line = null;
const locations = [
  {lat: 33.7671923, lng: -84.40537119999999},
  {lat: 33.79994, lng: -84.42485099999999},
  {lat: 33.7749219, lng: -84.2929674},
  {lat: 33.627911, lng: -84.4715296},
  {lat: 33.78034239999999, lng: -84.410242},
  {lat: 33.7485041, lng: -84.3365784},
];

export default function Map() {
    const [check, setCheck] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleOpenModal = (location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

    function MapC() {
      const map = useMap();
      maps = map;
      maps.flyTo([33.753746,-84.386330], 12)
      map.removeControl(map.zoomControl);
      map.attributionControl.setPrefix('');
      var markers = [];

      const locations = [
        {
          name: '466 Northside Dr NW, Atlanta, GA 30318',
          lat: 33.7671923,
          lng: -84.40537119999999,
          dailyData: mockDailyData,
        },
        {
          name: '1122A Old Chattahoochee Ave NW # A, Atlanta, GA 30318',
          lat: 33.79994,
          lng: -84.42485099999999,
          dailyData: mockDailyData,
        },
        {
          name: '246 Sycamore St, Decatur, GA 30030',
          lat: 33.7749219,
          lng: -84.2929674,
          dailyData: mockDailyData,
        },
        {
          name: '2514 W Point Ave, Atlanta, GA 30337',
          lat: 33.627911,
          lng: -84.4715296,
          dailyData: mockDailyData,
        },
        {
          name: '921 Howell Mill Rd NW, Atlanta, GA 30318',
          lat: 33.78034239999999,
          lng: -84.410242,
          dailyData: mockDailyData,
        },
        {
          name: '1560 Memorial Dr SE, Atlanta, GA 30317',
          lat: 33.7485041,
          lng: -84.3365784,
          dailyData: mockDailyData,
        },
      ];

       //has all of the distances from point a to all other points. Each row is a unique location, and its column is the endpoint.
   const [distanceMatrix, setDistanceMatrix] = useState([]);


   const calculateDistances = async () => {
       const matrix = [];
       const controls = {};
    
       const removeControl = (origin, destination) => {
           const key = `${origin.lat},${origin.lng}_${destination.lat},${destination.lng}`;
           const control = controls[key];
           if (control) {
             control.remove();
             delete controls[key];
           }
         };
    
       for (const origin of locations) {
         const row = [];
         for (const destination of locations) {
           if (origin === destination) {
             row.push(0);
             continue;
           }
    
           const key = `${origin.lat},${origin.lng}_${destination.lat},${destination.lng}`;
           const control = L.Routing.control({
               waypoints: [
                 L.latLng(origin.lat, origin.lng),
                 L.latLng(destination.lat, destination.lng),
               ],
               lineOptions: {
                 styles: [{ color: 'transparent' }],
               },
               createMarker: () => null,
               addWaypoints: false,
               routeWhileDragging: false,
               showAlternatives: false,
               fitSelectedRoutes: false,
             }).addTo(map);
            
             controls[key] = control;
            
             const promise = new Promise((resolve) => {
               control.on('routesfound', (e) => {
                 const distance = e.routes[0].summary.totalDistance;
                 resolve(distance);
               });
             });
            
             const distance = await promise;
           row.push(distance);
           removeControl(origin, destination);
         }
         matrix.push(row);
       }
       setDistanceMatrix(matrix);
     };
    

    
      useEffect(() => {
        console.log("useeffect");
        calculateDistances();
        locations.forEach((loc) => {
          const marker = L.marker([loc.lat, loc.lng], { icon: myIcon }).addTo(map);
          //marker.bindPopup("Hello World!").openPopup();
          // Attach click event handler for marker to open modal
          marker.on('click', () => handleOpenModal(loc));
          markers.push(marker);
        });

        map.pm.addControls({
          position: 'topright',
          drawPolygon: true,
          drawText : false,
          drawCircle: false,
          drawCircleMarker: false,
          drawMarker: false,
          drawPolyline: false,
          drawRectangle: false,
          editMode: false,
          dragMode: false,
          cutPolygon: false,
          removalMode: false,
          rotateMode: false,
          merge: false,
          delete : false
        });

      });

      map.on('pm:create', (e) => {
        const layer = e.layer;
        markers.forEach(mark => {
          if (!(mark instanceof L.Marker)) 
            return;
          const latlng = mark.getLatLng();
          const point = turf.point([latlng.lng, latlng.lat]);
          const isInside = turf.booleanPointInPolygon(point, layer.toGeoJSON());
          if (!isInside) {
            map.removeLayer(mark);
          }
        });
        map.removeLayer(layer);
      });


      return null;
    }
    
    
    function handleZoomIn() {
      console.log("Zoom in pressed");
      maps.zoomIn();
    }

    function handleZoomOut() {
      console.log("Zoom out pressed")
      maps.zoomOut();
    }

    function handleDraw() {
      if(!check)
      {
        if(routing === null) { 
          console.log("Drawing routes");
          routing = L.Routing.control({
            createMarker: function() { return null; } ,
            
            //showAlternatives: false,
    
            //Snap waypoints to nearest road and will not include walk up route
            //waypointMode: 'snap',
            useZoomParameter: false,
            show:false,
            routeWhileDragging: true,
            lineOptions: {
              styles: [{className: 'hide'}] // Adding animate class
            },
          }).addTo(maps);
          routing.on('routeselected', function(e) {
            line = L.polyline(e.route.coordinates, {snakingSpeed: 200});
            line.addTo(maps).snakeIn();
            line.setStyle({opacity: 1});
            
            // line.on('mouseover', function () {
            //   this.setText('  ►  ', {repeat: true, attributes: {fill: 'red'}});
            // });
            // line.on('mouseout', function () {
            //   this.setText(null);
            // });
          });
          routing ._container.style.display = "none" // <--- remove control
          routing.setWaypoints(locations);
        }
        else {
          line.setStyle({opacity: 1});
        }
      }
      else {
        console.log("Removing Routes")
        line.setStyle({opacity: 0});
      }
      setCheck(!check);
    }
    return (
        <div>
          <Modal open={isModalOpen} onClose={handleCloseModal}>
        {selectedLocation ? (
          <div style={{ padding: '20px', backgroundColor: 'white' }}>
            <List>
              <h2>{selectedLocation.name}</h2>
              <ListItem>
                <ListItemText primary={`Storage Remaining: ${selectedLocation.dailyData.storageRemaining}%`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Distances to Other Partners:" />
                <List>
                  {selectedLocation.dailyData.distances.map((distance, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={`${distance.partner}: ${distance.distance} km`} />
                    </ListItem>
                  ))}
                </List>
              </ListItem>
              <ListItem>
                <ListItemText primary="Food Shipment Requests (Last 5 Days):" />
                <List>
                  {selectedLocation.dailyData.foodShipmentRequests.map((request, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={request ? 'Requested' : 'Not Requested'} />
                    </ListItem>
                  ))}
                </List>
              </ListItem>
            </List>
            <button onClick={handleCloseModal}>Close</button>
          </div>
        ) : (
          <div></div> // Fallback empty element
        )}
      </Modal>
            <div style={{ display: 'flex', justifyContent: 'start' }}>
                <Typography style={{ position: 'absolute', zIndex: '1000', fontSize: '40px', color: 'Red', marginTop: '1.25%'  }}>
                    <Link to='/'
                          style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        Name
                    </Link>
                </Typography>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center'}}>
                <div style={{ position: 'absolute', zIndex: '1000', marginTop: '2.5%' }}>
                    <SearchBar/>
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'end' }}>
              <div style = {{position: 'absolute', zIndex: '1000' }}> 
                <MapDrawer/>
              </div>
            </div>
            <MapContainer
                style={{ height: '100vh', width: '100wh', position: 'relative' }}
                center={[0, 0]}
                zoom={3}
                maxBounds={bounds}
            >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                />
                <MapC/>
                
            </MapContainer>
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: '1000' }}>
                <Stack spacing={2}>
                    <IconButton onClick={() => handleDraw()}
                                sx={{ backgroundColor: 'white', borderRadius: 3 }}>
                        <GpsFixedIcon/>
                    </IconButton>
                    <IconButton onClick={() => handleZoomIn()}
                                sx={{ backgroundColor: 'white', borderRadius: 3 }}>
                        <AddIcon/>
                    </IconButton>
                    <IconButton onClick={() => handleZoomOut()}
                                sx={{ backgroundColor: 'white', borderRadius: 3 }}>
                        <RemoveIcon/>
                    </IconButton>
                </Stack>
            </div>
        </div>
    );
}
