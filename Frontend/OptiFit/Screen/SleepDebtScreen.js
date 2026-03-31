import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const DAILY_TARGET = 8;

const getDateKey = (date) => date.toISOString().split("T")[0];

const getPastDates = (days) => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(getDateKey(d));
  }

  return dates.reverse();
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const getWeekLabel = (weekIndex) => `Week ${weekIndex + 1}`;

function AnimatedWeekCard({
  week,
  index,
  expandedWeek,
  setExpandedWeek,
  getDebtColor,
  renderDayRow,
}) {
  const isOpen = expandedWeek === index;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View
      style={[styles.weekCard, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => setExpandedWeek(isOpen ? -1 : index)}
        style={styles.weekHeader}
      >
        <View>
          <Text style={styles.weekTitle}>{week.title}</Text>
          <Text style={styles.weekSub}>
            Avg sleep {week.avgSleep.toFixed(1)} hrs
          </Text>
        </View>

        <View style={styles.weekRight}>
          <Text
            style={[styles.weekDebt, { color: getDebtColor(week.totalDebt) }]}
          >
            {week.totalDebt.toFixed(1)}h
          </Text>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="#94A3B8"
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.weekDays}>
          {week.days.map((day, i) => renderDayRow(day, i, true))}
        </View>
      )}
    </Animated.View>
  );
}

export default function SleepDebtScreen() {
  const [selectedTab, setSelectedTab] = useState("week");
  const [history, setHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDebt, setTotalDebt] = useState(0);
  const [avgSleep, setAvgSleep] = useState(0);
  const [overallAvgSleep, setOverallAvgSleep] = useState(0);
  const [overallTotalDebt, setOverallTotalDebt] = useState(0);
  const [overallDaysLogged, setOverallDaysLogged] = useState(0);
  const [expandedWeek, setExpandedWeek] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(16)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadSleepHistory = async () => {
    try {
      setLoading(true);

      const stored = await AsyncStorage.getItem("sleepHistory");
      const parsed = stored ? JSON.parse(stored) : {};

      const allEntries = Object.keys(parsed)
        .sort()
        .map((dateKey) => {
          const sleepHours = Number(parsed[dateKey] || 0);
          const debt = Math.max(0, DAILY_TARGET - sleepHours);
          return { date: dateKey, sleepHours, debt };
        });

      setAllHistory(allEntries);

      const totalOverallSleep = allEntries.reduce(
        (sum, item) => sum + item.sleepHours,
        0
      );
      const totalOverallDebt = allEntries.reduce(
        (sum, item) => sum + item.debt,
        0
      );

      setOverallAvgSleep(
        allEntries.length ? totalOverallSleep / allEntries.length : 0
      );
      setOverallTotalDebt(totalOverallDebt);
      setOverallDaysLogged(allEntries.length);

      const days = selectedTab === "week" ? 7 : 28;
      const dateList = getPastDates(days);

      const prepared = dateList.map((dateKey) => {
        const sleepHours = Number(parsed[dateKey] || 0);
        const debt = Math.max(0, DAILY_TARGET - sleepHours);
        return { date: dateKey, sleepHours, debt };
      });

      const totalSleep = prepared.reduce((sum, item) => sum + item.sleepHours, 0);
      const debtSum = prepared.reduce((sum, item) => sum + item.debt, 0);

      setHistory(prepared);
      setTotalDebt(debtSum);
      setAvgSleep(prepared.length ? totalSleep / prepared.length : 0);
    } catch (error) {
      console.log("Error loading sleep history:", error);
    } finally {
      setLoading(false);
      fadeAnim.setValue(0);
      translateAnim.setValue(16);
      animateIn();
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSleepHistory();
    }, [selectedTab])
  );

  const getSleepColor = (hours) => {
    if (hours >= 7) return "#00E676";
    if (hours >= 5) return "#FACC15";
    return "#EF4444";
  };

  const getDebtColor = (debt) => {
    if (debt === 0) return "#00E676";
    if (debt <= 2) return "#FACC15";
    return "#EF4444";
  };

  const getInsightText = () => {
    if (overallDaysLogged === 0) {
      return "No sleep history yet. Start logging daily sleep to build a proper trend.";
    }
    if (overallAvgSleep >= 7 && overallTotalDebt <= 5) {
      return "Your sleep pattern looks balanced overall. Keep maintaining this consistency.";
    }
    if (overallAvgSleep >= 6) {
      return "Your sleep is fairly decent, but a few shorter nights are adding to your sleep debt.";
    }
    return "Your average sleep is a bit low right now, so sleep debt is building up over time.";
  };

  const weekGroups = useMemo(() => {
    if (selectedTab !== "month") return [];

    const groups = [];
    for (let i = 0; i < history.length; i += 7) {
      const chunk = history.slice(i, i + 7);
      const weekSleep = chunk.reduce((sum, item) => sum + item.sleepHours, 0);
      const weekDebt = chunk.reduce((sum, item) => sum + item.debt, 0);
      const avgWeekSleep = chunk.length ? weekSleep / chunk.length : 0;

      groups.push({
        title: getWeekLabel(groups.length),
        days: chunk,
        totalDebt: weekDebt,
        avgSleep: avgWeekSleep,
      });
    }
    return groups;
  }, [history, selectedTab]);

  const renderDayRow = (item, index, compact = false) => (
    <View
      key={`${item.date}-${index}`}
      style={[styles.dayRow, compact && styles.dayRowCompact]}
    >
      <View style={styles.dayLeft}>
        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        <Text
          style={[styles.sleepText, { color: getSleepColor(item.sleepHours) }]}
        >
          {item.sleepHours} hrs slept
        </Text>
      </View>

      <Text style={[styles.debtText, { color: getDebtColor(item.debt) }]}>
        {item.debt.toFixed(1)}h debt
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <View style={styles.fixedTop}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Sleep Debt</Text>
              <Text style={styles.subtitle}>
                Track your weekly, monthly and overall sleep history
              </Text>
            </View>

            <View style={styles.iconBox}>
              <Ionicons name="moon-outline" size={22} color="#00E676" />
            </View>
          </View>

          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                selectedTab === "week" && styles.activeToggleBtn,
              ]}
              onPress={() => setSelectedTab("week")}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.toggleText,
                  selectedTab === "week" && styles.activeToggleText,
                ]}
              >
                1 Week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                selectedTab === "month" && styles.activeToggleBtn,
              ]}
              onPress={() => setSelectedTab("month")}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.toggleText,
                  selectedTab === "month" && styles.activeToggleText,
                ]}
              >
                1 Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#00E676" />
          </View>
        ) : (
          <Animated.View
            style={[
              styles.scrollWrap,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.insightCard}>
                <View style={styles.insightTop}>
                  <Ionicons
                    name="sparkles-outline"
                    size={18}
                    color="#00E676"
                  />
                  <Text style={styles.insightTitle}>Your Sleep Reading</Text>
                </View>
                <Text style={styles.insightText}>{getInsightText()}</Text>
              </View>

              <View style={styles.overallCard}>
                <Text style={styles.sectionTitle}>Overall History</Text>

                <View style={styles.overallRow}>
                  <View style={styles.overallItem}>
                    <Text style={styles.overallLabel}>Days Logged</Text>
                    <Text style={styles.overallValue}>{overallDaysLogged}</Text>
                  </View>

                  <View style={styles.overallItem}>
                    <Text style={styles.overallLabel}>Avg Sleep</Text>
                    <Text
                      style={[
                        styles.overallValue,
                        { color: getSleepColor(overallAvgSleep) },
                      ]}
                    >
                      {overallAvgSleep.toFixed(1)} hrs
                    </Text>
                  </View>

                  <View style={styles.overallItem}>
                    <Text style={styles.overallLabel}>Total Debt</Text>
                    <Text
                      style={[
                        styles.overallValue,
                        { color: getDebtColor(overallTotalDebt) },
                      ]}
                    >
                      {overallTotalDebt.toFixed(1)} hrs
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Selected Debt</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: getDebtColor(totalDebt) },
                    ]}
                  >
                    {totalDebt.toFixed(1)} hrs
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Selected Avg Sleep</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: getSleepColor(avgSleep) },
                    ]}
                  >
                    {avgSleep.toFixed(1)} hrs
                  </Text>
                </View>
              </View>

              {selectedTab === "week" ? (
                <View style={styles.historySection}>
                  <Text style={styles.sectionTitle}>Last 7 Days</Text>
                  {history.map((item, index) => renderDayRow(item, index))}
                </View>
              ) : (
                <View style={styles.historySection}>
                  <Text style={styles.sectionTitle}>Last 4 Weeks</Text>

                  {weekGroups.map((week, index) => (
                    <AnimatedWeekCard
                      key={week.title}
                      week={week}
                      index={index}
                      expandedWeek={expandedWeek}
                      setExpandedWeek={setExpandedWeek}
                      getDebtColor={getDebtColor}
                      renderDayRow={renderDayRow}
                    />
                  ))}
                </View>
              )}

              {allHistory.length > 0 && (
                <View style={styles.allHistorySection}>
                  <Text style={styles.sectionTitle}>Recent Logged History</Text>
                  {allHistory
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .map((item, index) => (
                      <View
                        key={`${item.date}-all-${index}`}
                        style={styles.allHistoryRow}
                      >
                        <Text style={styles.allHistoryDate}>
                          {formatDate(item.date)}
                        </Text>
                        <Text style={styles.allHistorySleep}>
                          {item.sleepHours} hrs
                        </Text>
                      </View>
                    ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },

  screen: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },

  fixedTop: {
    marginBottom: 14,
  },

  scrollWrap: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 250,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 4,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  activeToggleBtn: {
    backgroundColor: "#00E676",
  },

  toggleText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },

  activeToggleText: {
    color: "#0B1220",
    fontWeight: "700",
  },

  insightCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
  },

  insightTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  insightTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },

  insightText: {
    color: "#94A3B8",
    fontSize: 13.5,
    lineHeight: 20,
  },

  overallCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },

  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  overallItem: {
    flex: 1,
    alignItems: "center",
  },

  overallLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 6,
    textAlign: "center",
  },

  overallValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  summaryCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  divider: {
    width: 1,
    height: 42,
    backgroundColor: "#334155",
    marginHorizontal: 10,
  },

  summaryLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 6,
    textAlign: "center",
  },

  summaryValue: {
    fontSize: 21,
    fontWeight: "bold",
  },

  historySection: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 18,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },

  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
  },

  dayRowCompact: {
    backgroundColor: "#111827",
    marginBottom: 8,
  },

  dayLeft: {
    flex: 1,
  },

  dateText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },

  sleepText: {
    fontSize: 13,
    fontWeight: "500",
  },

  debtText: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 10,
  },

  weekCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  weekHeader: {
    paddingVertical: 15,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  weekTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  weekSub: {
    color: "#94A3B8",
    fontSize: 12.5,
  },

  weekRight: {
    alignItems: "flex-end",
  },

  weekDebt: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  weekDays: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  allHistorySection: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },

  allHistoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#273244",
  },

  allHistoryDate: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  allHistorySleep: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
});