import React, { useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { BackHandler } from 'react-native';
import { ConfirmationDialog } from 'common-ui';
import { trpc } from '../src/trpc-client';

interface LocationTestWrapperProps {
  children: ReactNode;
}

const LocationTestWrapper: React.FC<LocationTestWrapperProps> = ({ children }) => {

  return <>{children}</>
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationErrorDialogOpen, setLocationErrorDialogOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  const { data: locationCheck } = trpc.common.checkLocationInPolygon.useQuery(
    { lat: userLocation?.coords.latitude || 0, lng: userLocation?.coords.longitude || 0 },
    { enabled: !!userLocation }
  );

  useEffect(() => {
    if (locationCheck && !locationCheck.isInside) {
      setLocationErrorDialogOpen(true);
    }
  }, [locationCheck]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        console.log('User location:', location.coords);
        setUserLocation(location);
      } else {
        setLocationDialogOpen(true);
      }
    })();
  }, []);


  return (
    <>
      {children}
      <ConfirmationDialog
        open={locationDialogOpen}
        title="Location Permission Disabled"
        message="Your location may not be supported. We currently operate only in Mahabubnagar town."
        confirmText="Yes, Proceed"
        cancelText="Exit"
        positiveAction={() => setLocationDialogOpen(false)}
        negativeAction={() => BackHandler.exitApp()}
      />
      <ConfirmationDialog
        open={locationErrorDialogOpen}
        title="Location Outside Service Area"
        message="Your current location is outside our supported area. We currently operate only in Mahabubnagar town. You can still proceed to browse our services."
        confirmText="Proceed Anyway"
        cancelText="Exit"
        positiveAction={() => setLocationErrorDialogOpen(false)}
        negativeAction={() => BackHandler.exitApp()}
      />
    </>
  );
};

export default LocationTestWrapper;