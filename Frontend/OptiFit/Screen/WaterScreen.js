import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";

export default function WaterScreen() {
  const [currentWater, setCurrentWater] = useState(0);
  const [goal] = useState(2500);
  const [history, setHistory] = useState([]);
  const [selectedReminder, setSelectedReminder] = useState("1 hr");
  const [lastAdded, setLastAdded] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadWater = async () => {
      try {
        const stored = await AsyncStorage.getItem("water");
        const current = stored ? parseInt(stored, 10) : 0;
        setCurrentWater(current);
      } catch (error) {
        console.log("Load water error:", error);
      }
    };

    loadWater();
  }, []);

  const remaining = Math.max(goal - currentWater, 0);
  const progress = Math.min((currentWater / goal) * 100, 100);

  const addWater = async (amount) => {
    try {
      const stored = await AsyncStorage.getItem("water");
      let current = stored ? parseInt(stored, 10) : 0;

      const updated = current + amount;

      await AsyncStorage.setItem("water", updated.toString());

      setCurrentWater(updated);
      setLastAdded(amount);

      const newEntry = {
        id: Date.now().toString(),
        amount,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setHistory((prev) => [newEntry, ...prev]);

      scaleAnim.setValue(0.9);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }).start();

      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      dropAnim.setValue(0);
      Animated.sequence([
        Animated.timing(dropAnim, {
          toValue: -12,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.log("Water error:", error);
    }
  };

  const reminderText = useMemo(() => {
    return `Reminder set: ${selectedReminder}`;
  }, [selectedReminder]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Intake Goal</Text>

      <Animated.View
        style={[
          styles.topCard,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: dropAnim }] }}>
          <Ionicons name="water" size={34} color="#38bdf8" />
        </Animated.View>

        <AnimatedCircularProgress
          size={210}
          width={14}
          fill={progress}
          tintColor="#38bdf8"
          backgroundColor="#223047"
          lineCap="round"
          rotation={220}
          arcSweepAngle={280}
          style={styles.circle}
        >
          {() => (
            <View style={styles.centerBox}>
              <Text style={styles.mainAmount}>{currentWater} ml</Text>
              <Text style={styles.goalText}>Goal: {goal} ml</Text>
              <Text style={styles.remainingText}>
                Remaining: {remaining} ml
              </Text>
            </View>
          )}
        </AnimatedCircularProgress>

        <Text style={styles.progressText}>{Math.round(progress)}% completed</Text>
      </Animated.View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addWater(100)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.addButtonText}> Add 100 ml</Text>
      </TouchableOpacity>

      <Animated.Text style={[styles.toastText, { opacity: fadeAnim }]}>
        {lastAdded ? `You drank ${lastAdded} ml` : "Tap to log water"}
      </Animated.Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminder</Text>

        <View style={styles.reminderRow}>
          <TouchableOpacity
            style={[
              styles.reminderBtn,
              selectedReminder === "30 min" && styles.activeReminder,
            ]}
            onPress={() => setSelectedReminder("30 min")}
          >
            <Text style={styles.reminderBtnText}>30 min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reminderBtn,
              selectedReminder === "1 hr" && styles.activeReminder,
            ]}
            onPress={() => setSelectedReminder("1 hr")}
          >
            <Text style={styles.reminderBtnText}>1 hr</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reminderBtn,
              selectedReminder === "2 hr" && styles.activeReminder,
            ]}
            onPress={() => setSelectedReminder("2 hr")}
          >
            <Text style={styles.reminderBtnText}>2 hr</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.reminderInfo}>{reminderText}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>History</Text>

        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="time-outline" size={22} color="#94a3b8" />
            <Text style={styles.emptyText}>No water logged yet</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <Ionicons name="water-outline" size={18} color="#2e88b1" />
                  <Text style={styles.historyAmount}>Drank {item.amount} ml</Text>
                </View>
                <Text style={styles.historyTime}>{item.time}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 18,
  },
  topCard: {
    backgroundColor: "#0B1220",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 18,
  },
  circle: {
    marginTop: 12,
    marginBottom: 10,
  },
  centerBox: {
    alignItems: "center",
  },
  mainAmount: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  goalText: {
    color: "#cbd5e1",
    fontSize: 14,
    marginTop: 6,
  },
  remainingText: {
    color: "#7dd3fc",
    fontSize: 15,
    marginTop: 6,
    fontWeight: "600",
  },
  progressText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#4e7bdc",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  toastText: {
    color: "#7dd3fc",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    marginTop: 10,
    flex: 1,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  reminderBtn: {
    backgroundColor: "#1E293B",
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: "30%",
    alignItems: "center",
  },
  activeReminder: {
    backgroundColor: "#0ea5e9",
  },
  reminderBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  reminderInfo: {
    color: "#cbd5e1",
    fontSize: 14,
  },
  emptyBox: {
    backgroundColor: "#172033",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: "#172033",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyAmount: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  historyTime: {
    color: "#94a3b8",
    fontSize: 14,
  },
});