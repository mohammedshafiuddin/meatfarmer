import { useFocusEffect, useNavigation } from "expo-router";
import React from "react";


function useHideDrawerHeader() {

  const navigation = useNavigation();
  useFocusEffect(() => {
    let drawerNav = navigation.getParent();
    const drawerNavList:any = [];
    // Collect all parent navigators
    while (drawerNav) {
      drawerNavList.push(drawerNav);
      drawerNav = drawerNav.getParent();
    }

    drawerNavList.at(-3)?.setOptions({ headerShown: false });

    return () => {
        drawerNavList.at(-3)?.setOptions({ headerShown: true });
    };
  });
  return null;
}

export default useHideDrawerHeader;
