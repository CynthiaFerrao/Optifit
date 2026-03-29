import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    alert("Permission not granted");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("water-reminders", {
      name: "Water Reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function scheduleWaterReminder(minutes) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Drink Water 💧",
      body: "Time to hydrate yourself!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      repeats: true,
    },
  });

  console.log("Scheduled notification id:", id);
}