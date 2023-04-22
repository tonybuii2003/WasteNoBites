import AddIcon from '@mui/icons-material/Add';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import MenuIcon from '@mui/icons-material/Menu';
import RemoveIcon from '@mui/icons-material/Remove';
import { IconButton, Typography, Modal } from '@mui/material'; // Import Modal here
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
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import MapDrawer from './MapDrawer';


const myIcon = new Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const bounds = L.latLngBounds(southWest, northEast);

function handleClick() {
    console.log("pressed")
}

let maps = null;
export default function Map() {
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
        {lat: 33.7671923, lng: -84.40537119999999},
        {lat: 33.79994, lng: -84.42485099999999},
        {lat: 33.7749219, lng: -84.2929674},
        {lat: 33.627911, lng: -84.4715296},
        {lat: 33.78034239999999, lng: -84.410242},
        {lat: 33.7485041, lng: -84.3365784},
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
       calculateDistances();
      
   }, []);

    
      useEffect(() => {
        console.log("useeffect");
        locations.forEach((loc) => {
          const marker = L.marker([loc.lat, loc.lng], { icon: myIcon }).addTo(map);
          marker.bindPopup("Hello World!").openPopup();
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
    return (
        <div>
          <Modal open={isModalOpen} onClose={handleCloseModal}>
          <div style={{ padding: '20px', backgroundColor: 'white' }}>
            <h2>Location</h2>
            <p>{selectedLocation}</p>
            <button onClick={handleCloseModal}>Close</button>
          </div>
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
                    <IconButton onClick={() => console.log('GPS clicked')}
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
