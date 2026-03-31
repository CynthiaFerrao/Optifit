import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import {
  registerForNotifications,
  scheduleWaterReminder,
} from "../utils/notifications";

const STORAGE_KEYS = {
  WATER: "water",
  WATER_DATE: "waterDate",
  WATER_HISTORY: "waterHistory",
  EXTRA_GOALS: "waterExtraGoals",
};

export default function WaterScreen() {
  const [currentWater, setCurrentWater] = useState(0);
  const [goal] = useState(2500);
  const [historyByDate, setHistoryByDate] = useState({});
  const [selectedReminder, setSelectedReminder] = useState("1 hr");
  const [lastAdded, setLastAdded] = useState(0);
  const [extraGoals, setExtraGoals] = useState([]);
  const [showExtraGoalModal, setShowExtraGoalModal] = useState(false);
  const [extraGoalInput, setExtraGoalInput] = useState("");
  const [historyView, setHistoryView] = useState("today");

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dropAnim = useRef(new Animated.Value(0)).current;

  const getTodayKey = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const formatDisplayDate = (dateKey) => {
    const date = new Date(dateKey);
    return date.toLocaleDateString([], {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadWaterData = async () => {
    try {
      const todayKey = getTodayKey();

      const storedDate = await AsyncStorage.getItem(STORAGE_KEYS.WATER_DATE);
      const storedWater = await AsyncStorage.getItem(STORAGE_KEYS.WATER);
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.WATER_HISTORY);
      const storedExtraGoals = await AsyncStorage.getItem(STORAGE_KEYS.EXTRA_GOALS);

      const parsedHistory = storedHistory ? JSON.parse(storedHistory) : {};
      const parsedExtraGoals = storedExtraGoals ? JSON.parse(storedExtraGoals) : [];

      if (storedDate !== todayKey) {
        await AsyncStorage.setItem(STORAGE_KEYS.WATER_DATE, todayKey);
        await AsyncStorage.setItem(STORAGE_KEYS.WATER, "0");
        await AsyncStorage.setItem(STORAGE_KEYS.EXTRA_GOALS, JSON.stringify([]));
        setCurrentWater(0);
        setExtraGoals([]);
      } else {
        setCurrentWater(storedWater ? parseInt(storedWater, 10) : 0);
        setExtraGoals(Array.isArray(parsedExtraGoals) ? parsedExtraGoals : []);
      }

      setHistoryByDate(parsedHistory);
    } catch (error) {
      console.log("Load water data error:", error);
    }
  };

  useEffect(() => {
    registerForNotifications();
    loadWaterData();
  }, []);

  const totalTarget = useMemo(() => {
    return goal + extraGoals.reduce((sum, value) => sum + value, 0);
  }, [goal, extraGoals]);

  const remaining = Math.max(totalTarget - currentWater, 0);
  const mainProgress = Math.min((currentWater / goal) * 100, 100);

  const ringData = useMemo(() => {
    const rings = [];
    let consumedRemaining = currentWater;

    rings.push({
      id: "main-goal",
      label: "Daily Goal",
      target: goal,
      consumed: Math.min(consumedRemaining, goal),
      fill: Math.min((consumedRemaining / goal) * 100, 100),
      completed: consumedRemaining >= goal,
      isMain: true,
    });

    consumedRemaining = Math.max(consumedRemaining - goal, 0);

    extraGoals.forEach((extraGoal, index) => {
      const consumedForThisRing = Math.min(consumedRemaining, extraGoal);

      rings.push({
        id: `extra-${index}`,
        label: `Extra Goal ${index + 1}`,
        target: extraGoal,
        consumed: consumedForThisRing,
        fill: Math.min((consumedForThisRing / extraGoal) * 100, 100),
        completed: consumedRemaining >= extraGoal,
        isMain: false,
      });

      consumedRemaining = Math.max(consumedRemaining - extraGoal, 0);
    });

    return rings;
  }, [currentWater, goal, extraGoals]);

  const todayKey = getTodayKey();

  const todayData = historyByDate[todayKey] || {
    total: 0,
    entries: [],
    baseGoal: goal,
    extraGoals: [],
  };

  const weeklyHistory = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const tempDate = new Date();
      tempDate.setDate(tempDate.getDate() - i);

      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, "0");
      const date = String(tempDate.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${date}`;

      const dayData = historyByDate[key] || null;
      const baseGoal = dayData?.baseGoal || goal;
      const extraGoalTotal = dayData?.extraGoals
        ? dayData.extraGoals.reduce((sum, item) => sum + item, 0)
        : 0;
      const target = baseGoal + extraGoalTotal;
      const total = dayData?.total || 0;

      days.push({
        key,
        label: formatDisplayDate(key),
        total,
        target,
        achieved: total >= baseGoal,
      });
    }

    return days.reverse();
  }, [historyByDate, goal]);

  const animateWater = (amount) => {
    setLastAdded(amount);

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
  };

  const saveWaterState = async (updatedWater, updatedExtraGoals, amount) => {
    const dateKey = getTodayKey();

    const existingHistoryRaw = await AsyncStorage.getItem(STORAGE_KEYS.WATER_HISTORY);
    const existingHistory = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : {};

    const previousDayData = existingHistory[dateKey] || {
      total: 0,
      baseGoal: goal,
      extraGoals: [],
      entries: [],
    };

    const newEntry = {
      id: Date.now().toString(),
      amount,
      time: getCurrentTime(),
    };

    const updatedDayData = {
      ...previousDayData,
      total: updatedWater,
      baseGoal: goal,
      extraGoals: updatedExtraGoals,
      entries: [newEntry, ...(previousDayData.entries || [])],
    };

    const updatedHistoryByDate = {
      ...existingHistory,
      [dateKey]: updatedDayData,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.WATER, updatedWater.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.WATER_DATE, dateKey);
    await AsyncStorage.setItem(
      STORAGE_KEYS.EXTRA_GOALS,
      JSON.stringify(updatedExtraGoals)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.WATER_HISTORY,
      JSON.stringify(updatedHistoryByDate)
    );

    setCurrentWater(updatedWater);
    setExtraGoals(updatedExtraGoals);
    setHistoryByDate(updatedHistoryByDate);
  };

  const askForExtraGoal = () => {
    Alert.alert("Goal Achieved", "Do you want to track more water?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: () => setShowExtraGoalModal(true),
      },
    ]);
  };

  const addWater = async (amount) => {
    try {
      const current = currentWater;
      const updatedWater = current + amount;

      await saveWaterState(updatedWater, extraGoals, amount);
      animateWater(amount);

      const oldTarget = totalTarget;
      const newTarget = goal + extraGoals.reduce((sum, item) => sum + item, 0);

      if (current < oldTarget && updatedWater >= newTarget) {
        setTimeout(() => {
          askForExtraGoal();
        }, 250);
      }
    } catch (error) {
      console.log("Water error:", error);
    }
  };

  const createExtraGoal = async (value) => {
    const parsedValue = parseInt(value, 10);

    if (!parsedValue || parsedValue <= 0) {
      Alert.alert("Invalid input", "Please enter a valid ml amount.");
      return;
    }

    try {
      const updatedExtraGoals = [...extraGoals, parsedValue];

      await AsyncStorage.setItem(
        STORAGE_KEYS.EXTRA_GOALS,
        JSON.stringify(updatedExtraGoals)
      );

      const updatedHistory = {
        ...historyByDate,
        [todayKey]: {
          ...(historyByDate[todayKey] || {
            total: currentWater,
            baseGoal: goal,
            entries: [],
          }),
          total: currentWater,
          baseGoal: goal,
          extraGoals: updatedExtraGoals,
          entries: historyByDate[todayKey]?.entries || [],
        },
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.WATER_HISTORY,
        JSON.stringify(updatedHistory)
      );

      setExtraGoals(updatedExtraGoals);
      setHistoryByDate(updatedHistory);
      setExtraGoalInput("");
      setShowExtraGoalModal(false);
    } catch (error) {
      console.log("Extra goal error:", error);
    }
  };

  const reminderText = useMemo(() => {
    return `Reminder set: ${selectedReminder}`;
  }, [selectedReminder]);

  const extraTrackedTotal = extraGoals.reduce((sum, item) => sum + item, 0);

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
          fill={mainProgress}
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
              <Text style={styles.goalText}>Base Goal: {goal} ml</Text>
              <Text style={styles.remainingText}>
                Remaining Target: {remaining} ml
              </Text>
            </View>
          )}
        </AnimatedCircularProgress>

        <Text style={styles.progressText}>
          {Math.round(mainProgress)}% of daily goal completed
        </Text>

        {extraGoals.length > 0 && (
          <View style={styles.extraSummaryBox}>
            <Text style={styles.extraSummaryTitle}>Extra Tracking Active</Text>
            <Text style={styles.extraSummaryText}>
              Extra Goal Total: {extraTrackedTotal} ml
            </Text>
            <Text style={styles.extraSummaryText}>
              Total Planned Today: {totalTarget} ml
            </Text>
          </View>
        )}
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity style={styles.addButton} onPress={() => addWater(100)}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addButtonText}> Add 100 ml</Text>
        </TouchableOpacity>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => addWater(250)}
          >
            <Text style={styles.quickAddText}>+250 ml</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => addWater(500)}
          >
            <Text style={styles.quickAddText}>+500 ml</Text>
          </TouchableOpacity>
        </View>

        <Animated.Text style={[styles.toastText, { opacity: fadeAnim }]}>
          {lastAdded ? `You drank ${lastAdded} ml` : "Tap to log water"}
        </Animated.Text>

        {ringData.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Rings</Text>

            {ringData.map((ring) => (
              <View key={ring.id} style={styles.ringCard}>
                <View style={styles.ringLeft}>
                  <AnimatedCircularProgress
                    size={80}
                    width={8}
                    fill={ring.fill}
                    tintColor={ring.isMain ? "#38bdf8" : "#22c55e"}
                    backgroundColor="#223047"
                    rotation={0}
                    lineCap="round"
                  >
                    {() => (
                      <Text style={styles.smallRingText}>
                        {Math.round(ring.fill)}%
                      </Text>
                    )}
                  </AnimatedCircularProgress>
                </View>

                <View style={styles.ringRight}>
                  <Text style={styles.ringTitle}>{ring.label}</Text>
                  <Text style={styles.ringSubText}>
                    {ring.consumed} / {ring.target} ml
                  </Text>
                  <Text
                    style={[
                      styles.ringStatus,
                      ring.completed && styles.ringStatusDone,
                    ]}
                  >
                    {ring.completed ? "Completed" : "In progress"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder</Text>

          <View style={styles.reminderRow}>
            <TouchableOpacity
              style={[
                styles.reminderBtn,
                selectedReminder === "15 min" && styles.activeReminder,
              ]}
              onPress={async () => {
                setSelectedReminder("15 min");
                await scheduleWaterReminder(15);
              }}
            >
              <Text style={styles.reminderBtnText}>15 min</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reminderBtn,
                selectedReminder === "30 min" && styles.activeReminder,
              ]}
              onPress={async () => {
                setSelectedReminder("30 min");
                await scheduleWaterReminder(30);
              }}
            >
              <Text style={styles.reminderBtnText}>30 min</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reminderBtn,
                selectedReminder === "1 hr" && styles.activeReminder,
              ]}
              onPress={async () => {
                setSelectedReminder("1 hr");
                await scheduleWaterReminder(60);
              }}
            >
              <Text style={styles.reminderBtnText}>1 hr</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.reminderInfo}>{reminderText}</Text>
        </View>

        <View style={[styles.section, styles.historySection]}>
          <Text style={styles.sectionTitle}>History</Text>

          <View style={styles.historyTabs}>
            <TouchableOpacity
              style={[
                styles.historyTab,
                historyView === "today" && styles.activeHistoryTab,
              ]}
              onPress={() => setHistoryView("today")}
            >
              <Text
                style={[
                  styles.historyTabText,
                  historyView === "today" && styles.activeHistoryTabText,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.historyTab,
                historyView === "week" && styles.activeHistoryTab,
              ]}
              onPress={() => setHistoryView("week")}
            >
              <Text
                style={[
                  styles.historyTabText,
                  historyView === "week" && styles.activeHistoryTabText,
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
          </View>

          {historyView === "today" ? (
            todayData.entries.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="time-outline" size={22} color="#94a3b8" />
                <Text style={styles.emptyText}>No water logged yet</Text>
              </View>
            ) : (
              <View>
                <View style={styles.todaySummaryCard}>
                  <Text style={styles.todaySummaryTitle}>Today Summary</Text>
                  <Text style={styles.todaySummaryText}>
                    Total Drank: {todayData.total || 0} ml
                  </Text>
                  <Text style={styles.todaySummaryText}>
                    Goal Achieved: {todayData.total >= goal ? "Yes" : "No"}
                  </Text>
                </View>

                {todayData.entries.map((item) => (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.historyLeft}>
                      <Ionicons
                        name="water-outline"
                        size={18}
                        color="#2e88b1"
                      />
                      <Text style={styles.historyAmount}>
                        Drank {item.amount} ml
                      </Text>
                    </View>
                    <Text style={styles.historyTime}>{item.time}</Text>
                  </View>
                ))}
              </View>
            )
          ) : (
            <View>
              {weeklyHistory.map((day) => (
                <View key={day.key} style={styles.weekCard}>
                  <View>
                    <Text style={styles.weekDate}>{day.label}</Text>
                    <Text style={styles.weekTarget}>Target: {day.target} ml</Text>
                  </View>

                  <View style={styles.weekRight}>
                    <Text style={styles.weekAmount}>{day.total} ml</Text>
                    <Text
                      style={[
                        styles.weekStatus,
                        day.achieved
                          ? styles.weekStatusDone
                          : styles.weekStatusMiss,
                      ]}
                    >
                      {day.achieved ? "Achieved" : "Not met"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showExtraGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExtraGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Track More Water</Text>
            <Text style={styles.modalSubtitle}>
              Enter how much extra water you want to track.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter ml"
              placeholderTextColor="#94a3b8"
              value={extraGoalInput}
              onChangeText={setExtraGoalInput}
              keyboardType="numeric"
            />

            <View style={styles.quickGoalRow}>
              {[250, 500, 750, 1000].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.quickGoalChip}
                  onPress={() => setExtraGoalInput(String(item))}
                >
                  <Text style={styles.quickGoalChipText}>{item} ml</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowExtraGoalModal(false);
                  setExtraGoalInput("");
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={() => createExtraGoal(extraGoalInput)}
              >
                <Text style={styles.saveBtnText}>Start Ring</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    paddingHorizontal: 20,
    paddingTop: 60,
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
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 30,
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
  extraSummaryBox: {
    marginTop: 14,
    backgroundColor: "#172033",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    width: "100%",
  },
  extraSummaryTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  extraSummaryText: {
    color: "#cbd5e1",
    fontSize: 14,
    marginTop: 2,
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
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: "#172033",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  quickAddText: {
    color: "#7dd3fc",
    fontSize: 15,
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
  },
  historySection: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  ringCard: {
    backgroundColor: "#172033",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  ringLeft: {
    marginRight: 14,
  },
  ringRight: {
    flex: 1,
  },
  ringTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  ringSubText: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 4,
  },
  ringStatus: {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "600",
  },
  ringStatusDone: {
    color: "#22c55e",
  },
  smallRingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
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
  historyTabs: {
    flexDirection: "row",
    backgroundColor: "#172033",
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  historyTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  activeHistoryTab: {
    backgroundColor: "#0ea5e9",
  },
  historyTabText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "700",
  },
  activeHistoryTabText: {
    color: "#fff",
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
  todaySummaryCard: {
    backgroundColor: "#172033",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  todaySummaryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  todaySummaryText: {
    color: "#cbd5e1",
    fontSize: 14,
    marginTop: 2,
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
    flex: 1,
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
    marginLeft: 10,
  },
  weekCard: {
    backgroundColor: "#172033",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekDate: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  weekTarget: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
  },
  weekRight: {
    alignItems: "flex-end",
  },
  weekAmount: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  weekStatus: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  weekStatusDone: {
    color: "#22c55e",
  },
  weekStatusMiss: {
    color: "#f59e0b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#1E293B",
    color: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 14,
  },
  quickGoalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  quickGoalChip: {
    backgroundColor: "#172033",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
  quickGoalChipText: {
    color: "#7dd3fc",
    fontWeight: "700",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#1E293B",
  },
  saveBtn: {
    backgroundColor: "#0ea5e9",
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});