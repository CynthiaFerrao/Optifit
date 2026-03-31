import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

export default function DashboardScreen({ navigation, setIsLoggedIn }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepLogged, setSleepLogged] = useState(false);

  const loadDashboard = async () => {
    try {
      const storedWater = await AsyncStorage.getItem("water");
      const waterConsumed = storedWater ? parseInt(storedWater, 10) : 0;

      const storedSleep = await AsyncStorage.getItem("sleepHours");
      const storedSleepDate = await AsyncStorage.getItem("sleepDate");

      const today = new Date().toDateString();

      let sleepValue = 0;
      let isSleepLoggedToday = false;

      if (storedSleep && storedSleepDate === today) {
        sleepValue = parseFloat(storedSleep);
        isSleepLoggedToday = true;
      }

      setData((prev) => ({
        calories: prev?.calories || {
          target: 2000,
          consumed: 1200,
          remaining: 800,
        },
        protein: prev?.protein || {
          target: 120,
          consumed: 60,
        },
        water: { consumed: waterConsumed },
        steps: prev?.steps || { steps: 0 },
        sleep: { sleepHours: sleepValue },
        recovery: prev?.recovery || { score: 75 },
      }));

      setSleepLogged(isSleepLoggedToday);
    } catch (error) {
      console.log(error?.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const submitSleep = async () => {
    if (!sleepHours) return;

    const enteredSleep = parseFloat(sleepHours);
    if (isNaN(enteredSleep)) return;

    const today = new Date().toDateString();
    const todayKey = new Date().toISOString().split("T")[0];

    try {
      await AsyncStorage.setItem("sleepHours", enteredSleep.toString());
      await AsyncStorage.setItem("sleepDate", today);

      const existingHistory = await AsyncStorage.getItem("sleepHistory");
      const parsedHistory = existingHistory ? JSON.parse(existingHistory) : {};

      parsedHistory[todayKey] = enteredSleep;

      await AsyncStorage.setItem("sleepHistory", JSON.stringify(parsedHistory));

      setData((prev) => ({
        ...prev,
        sleep: { sleepHours: enteredSleep },
      }));

      setSleepLogged(true);
      setSleepModalVisible(false);
      setSleepHours("");
    } catch (error) {
      console.log("Error saving sleep:", error);
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );
  }

  const calorieTarget = data?.calories?.target || 0;
  const calorieConsumed = data?.calories?.consumed || 0;
  const calorieRemaining = data?.calories?.remaining || 0;

  const proteinTarget = data?.protein?.target || 0;
  const proteinConsumed = data?.protein?.consumed || 0;

  const sleepHoursValue = data?.sleep?.sleepHours || 0;
  const sleepDebt = Math.max(8 - sleepHoursValue, 0);

  const fillPercentage =
    calorieTarget > 0
      ? Math.min((calorieConsumed / calorieTarget) * 100, 100)
      : 0;

  const proteinFill =
    proteinTarget > 0
      ? Math.min((proteinConsumed / proteinTarget) * 100, 100)
      : 0;

  const calorieColor = calorieRemaining < 0 ? "#ef4444" : "#00E676";

  const sleepHoursColor =
    sleepHoursValue <= 3
      ? "#ef4444"
      : sleepHoursValue <= 6
      ? "#facc15"
      : "#00E676";

  const sleepDebtColor =
    sleepDebt === 0 ? "#00E676" : sleepDebt <= 2 ? "#facc15" : "#ef4444";

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good Afternoon";
    } else if (hour >= 17 && hour < 20) {
      return "Good Evening";
    } else {
      return "Good Night";
    }
  };

  const greeting = getGreeting();

  return (
    <>
      <Modal visible={sleepModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              How many hours did you sleep today?
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter hours (e.g. 7.5)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={sleepHours}
              onChangeText={setSleepHours}
            />

            <TouchableOpacity style={styles.modalButton} onPress={submitSleep}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SafeAreaView style={{ flex: 1, backgroundColor: "#0B1220" }}>
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={calorieColor}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.header}>
              <View>
                <Text style={styles.logo}>OPTIFIT</Text>
                <Text style={styles.greeting}>{greeting}</Text>
              </View>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </View>

            <Text style={styles.sectionTitle}>Today</Text>

            <View style={styles.hero}>
              <AnimatedCircularProgress
                size={220}
                width={12}
                fill={fillPercentage}
                tintColor={calorieColor}
                backgroundColor="#1E293B"
                lineCap="round"
              >
                {() => (
                  <>
                    <Text style={styles.remaining}>{calorieRemaining}</Text>
                    <Text style={styles.subText}>Calories Remaining</Text>
                  </>
                )}
              </AnimatedCircularProgress>

              <Text style={styles.meta}>
                {calorieConsumed} consumed • Goal {calorieTarget}
              </Text>
            </View>

            <View style={styles.hero}>
              <AnimatedCircularProgress
                size={160}
                width={10}
                fill={proteinFill}
                tintColor="#38bdf8"
                backgroundColor="#1E293B"
                lineCap="round"
              >
                {() => (
                  <>
                    <Text style={styles.remainingSmall}>
                      {proteinConsumed}/{proteinTarget}
                    </Text>
                    <Text style={styles.subText}>Protein (g)</Text>
                  </>
                )}
              </AnimatedCircularProgress>
            </View>

            <Text style={styles.overviewTitle}>Quick Actions</Text>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => navigation.navigate("FoodScanner")}
              >
                <Ionicons name="restaurant" size={22} color="#fff" />
                <Text style={styles.quickText}>Log Food</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => navigation.navigate("Water")}
              >
                <Ionicons name="water" size={22} color="#fff" />
                <Text style={styles.quickText}>Water</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickBtn}>
                <Ionicons name="walk" size={22} color="#fff" />
                <Text style={styles.quickText}>Steps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => {
                  if (!sleepLogged) {
                    setSleepModalVisible(true);
                  }
                }}
              >
                <Ionicons name="moon" size={22} color="#fff" />
                <Text style={styles.quickText}>
                  {sleepLogged ? "Logged" : "Sleep"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.overviewTitle}>Health Overview</Text>

            <View style={styles.overviewContainer}>
              <View style={styles.overviewCard}>
                <Ionicons name="moon" size={28} color={sleepHoursColor} />
                <Text
                  style={[styles.overviewValue, { color: sleepHoursColor }]}
                >
                  {sleepHoursValue} hrs
                </Text>
                <Text style={styles.overviewLabel}>Sleep</Text>
              </View>

              <View style={styles.overviewCard}>
                <Ionicons name="water" size={28} color="#06b6d4" />
                <Text style={styles.overviewValue}>
                  {data?.water?.consumed || 0} ml
                </Text>
                <Text style={styles.overviewLabel}>Water</Text>
              </View>

              <View style={styles.overviewCard}>
                <Ionicons name="walk" size={28} color="#facc15" />
                <Text style={styles.overviewValue}>
                  {data?.steps?.steps || 0}
                </Text>
                <Text style={styles.overviewLabel}>Steps</Text>
              </View>

              <TouchableOpacity
                style={styles.overviewCard}
                onPress={() => navigation.navigate("SleepDebt")}
              >
                <Ionicons
                  name="trending-down"
                  size={28}
                  color={sleepDebtColor}
                />
                <Text
                  style={[styles.overviewValue, { color: sleepDebtColor }]}
                >
                  {sleepDebt.toFixed(1)} hrs
                </Text>
                <Text style={styles.overviewLabel}>Sleep Debt</Text>
                <Text style={styles.sleepDebtHint}>Tap to view history</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recoveryCard}>
              <Text style={styles.recoveryTitle}>Recovery Score</Text>
              <Text style={styles.recoveryValue}>
                {data?.recovery?.score || 75}%
              </Text>
              <Text style={styles.recoverySub}>
                Based on sleep, protein & activity
              </Text>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("FoodScanner")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    padding: 20,
  },

  loader: {
    flex: 1,
    backgroundColor: "#0B1220",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    color: "#00E676",
    fontSize: 22,
    fontWeight: "bold",
  },

  greeting: {
    color: "#94A3B8",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 20,
  },

  hero: {
    alignItems: "center",
    marginBottom: 35,
  },

  remaining: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },

  remainingSmall: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  subText: {
    color: "#94A3B8",
    marginTop: 5,
  },

  meta: {
    color: "#64748B",
    marginTop: 8,
  },

  overviewTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  quickBtn: {
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    width: "22%",
  },

  quickText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
  },

  overviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  overviewCard: {
    backgroundColor: "#1E293B",
    width: "48%",
    paddingVertical: 25,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },

  overviewValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  overviewLabel: {
    color: "#94A3B8",
    marginTop: 4,
    fontSize: 13,
  },

  sleepDebtHint: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 4,
  },

  recoveryCard: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: "center",
  },

  recoveryTitle: {
    color: "#94A3B8",
  },

  recoveryValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00E676",
    marginVertical: 5,
  },

  recoverySub: {
    color: "#64748B",
    fontSize: 12,
  },

  logoutBtn: {
    backgroundColor: "#1E293B",
    marginBottom: 110,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "#00E676",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    backgroundColor: "#1E293B",
    padding: 25,
    borderRadius: 20,
    width: "85%",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  modalInput: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    marginBottom: 15,
  },

  modalButton: {
    backgroundColor: "#00E676",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalButtonText: {
    fontWeight: "bold",
    color: "#0F172A",
  },
});