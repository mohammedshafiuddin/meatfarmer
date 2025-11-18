import React, { useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { BackHandler, Platform } from 'react-native';
import { ConfirmationDialog } from 'common-ui';
import { trpc } from '../src/trpc-client';

// Emulator detection utility
const isEmulator = (): boolean => {
  try {
    // Check for common emulator indicators
    const brand = (Platform.constants as any)?.Brand?.toLowerCase();
    const model = (Platform.constants as any)?.Model?.toLowerCase();
    const manufacturer = (Platform.constants as any)?.Manufacturer?.toLowerCase();

    // Android emulator detection
    if (Platform.OS === 'android') {
      return (
        brand?.includes('generic') ||
        brand?.includes('unknown') ||
        model?.includes('emulator') ||
        model?.includes('sdk') ||
        model?.includes('android sdk') ||
        manufacturer?.includes('genymotion') ||
        manufacturer?.includes('unknown')
      );
    }

    // iOS simulator detection
    if (Platform.OS === 'ios') {
      return (
        (Platform.constants as any)?.systemName?.includes('Simulator') ||
        !(Platform.constants as any)?.isDevice || // iOS simulator
        false
      );
    }

    return false;
  } catch (error) {
    // If detection fails, assume it's a real device to be safe
    console.warn('Emulator detection failed:', error);
    return false;
  }
};

interface LocationTestWrapperProps {
  children: ReactNode;
}

const LocationTestWrapper: React.FC<LocationTestWrapperProps> = ({ children }) => {
  // Skip location checks entirely for emulators
  if (isEmulator()) {
    return <>{children}</>;
  }

  // Enable location functionality for real devices
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