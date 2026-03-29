import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import DashboardScreen from "../Screen/DashboardScreen";
import FoodScreen from "../Screen/FoodScreen";
import ProfileScreen from "../Screen/ProfileScreen";
import WorkoutScreen from "../Screen/WorkoutScreen";
const Tab = createBottomTabNavigator();

export default function TabNavigator({ setIsLoggedIn }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: "#111",
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: "#00C853",
        tabBarInactiveTintColor: "#888",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Food") {
            iconName = focused ? "restaurant" : "restaurant-outline";
          } else if (route.name === "Workout") {
            iconName = focused ? "barbell" : "barbell-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard">
        {(props) => (
          <DashboardScreen {...props} setIsLoggedIn={setIsLoggedIn} />
        )}
      </Tab.Screen>

      <Tab.Screen name="Food" component={FoodScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />

      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
