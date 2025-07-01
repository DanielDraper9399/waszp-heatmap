
import { useState, useEffect } from "react";
import { GoogleMap, HeatmapLayer, Marker, useJsApiLoader } from "@react-google-maps/api";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAh96J9HSNtelNMwSKZosoNZkrFFXraFUc",
  authDomain: "waszp-north-america-map.firebaseapp.com",
  projectId: "waszp-north-america-map",
  storageBucket: "waszp-north-america-map.firebasestorage.app",
  messagingSenderId: "123439489919",
  appId: "1:123439489919:web:87ee04d60d8efe503df04a",
  measurementId: "G-GF5E50J9CP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const containerStyle = { width: "100%", height: "80vh" };
const center = { lat: 39.8283, lng: -98.5795 };

export default function WaszpHeatmap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCcx7awy-0wFW3fgTO0z0U29HFjFs8Tdrw",
    libraries: ["visualization", "places"],
  });

  const [locations, setLocations] = useState([]);
  const [user, setUser] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const querySnapshot = await getDocs(collection(db, "waszpLocations"));
      const locs = querySnapshot.docs.map(doc => ({ lat: doc.data().lat, lng: doc.data().lng }));
      setLocations(locs);
    };
    fetchLocations();
    onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = () => signOut(auth);
  const handleMapClick = (e) => setMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  const handleConfirmLocation = async () => {
    if (marker) {
      await addDoc(collection(db, "waszpLocations"), marker);
      setLocations([...locations, marker]);
      setMarker(null);
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl mb-4">WASZP North America Heatmap</h1>
      {user ? (
        <div className="flex gap-4 mb-4">
          <span>Welcome, {user.displayName}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin} className="mb-4">Sign in with Google</button>
      )}
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={4} onClick={user ? handleMapClick : null}>
        {locations.length > 0 && <HeatmapLayer data={locations.map(loc => new window.google.maps.LatLng(loc.lat, loc.lng))} />}
        {marker && <Marker position={marker} />}
      </GoogleMap>
      {marker && user && (
        <div className="mt-4 border p-4 rounded bg-gray-100">
          <p>Confirm this location for your WASZP?</p>
          <div className="flex gap-4 mt-2">
            <button onClick={handleConfirmLocation}>Confirm</button>
            <button onClick={() => setMarker(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
