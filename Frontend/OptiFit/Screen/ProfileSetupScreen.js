import api from "../services/api";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileSetupScreen({ navigation, route }) {
  const { email, password } = route.params;

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");

  const handleContinue = async () => {
    if (!name || !age || !height || !weight || !goal || !gender) {
      alert("Please fill all fields");
      return;
    }

    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email,
        password,
        age: parseInt(age),
        height: parseInt(height),
        weight: parseInt(weight),
        gender,
        goal,
        activityLevel: "moderate",
      });

      await AsyncStorage.setItem(
        "userProfile",
        JSON.stringify({
          name: name.trim(),
          age,
          height,
          weight,
          gender,
          goal,
        })
      );

      alert("User Registered Successfully ✅");
      navigation.replace("Login");

    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  return (
    <LinearGradient
      colors={["#020617", "#0f172a", "#1e3a8a"]}
      style={styles.container}
    >
      <View style={styles.glassCard}>
        <Text style={styles.title}>Tell us about yourself</Text>

        <ScrollView showsVerticalScrollIndicator={false}>

          <TextInput
            placeholder="Name"
            placeholderTextColor="#cbd5f5"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            placeholder="Age"
            placeholderTextColor="#cbd5f5"
            keyboardType="numeric"
            style={styles.input}
            value={age}
            onChangeText={setAge}
          />

          <TextInput
            placeholder="Height (cm)"
            placeholderTextColor="#cbd5f5"
            keyboardType="numeric"
            style={styles.input}
            value={height}
            onChangeText={setHeight}
          />

          <TextInput
            placeholder="Weight (kg)"
            placeholderTextColor="#cbd5f5"
            keyboardType="numeric"
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
          />

          {/* Gender Selection */}
          <Text style={styles.sectionLabel}>Gender</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                gender === "male" && styles.selectedOption
              ]}
              onPress={() => setGender("male")}
            >
              <Text style={styles.optionText}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                gender === "female" && styles.selectedOption
              ]}
              onPress={() => setGender("female")}
            >
              <Text style={styles.optionText}>Female</Text>
            </TouchableOpacity>
          </View>

          {/* Goal Selection */}
<Text style={styles.sectionLabel}>Goal</Text>
<View style={styles.goalContainer}>

  <TouchableOpacity
    style={[
      styles.goalButton,
      goal === "muscle_build" && styles.selectedOption
    ]}
    onPress={() => setGoal("muscle_build")}
  >
    <Text style={styles.optionText}>Muscle Build</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.goalButton,
      goal === "weight_loss" && styles.selectedOption
    ]}
    onPress={() => setGoal("weight_loss")}
  >
    <Text style={styles.optionText}>Weight Loss</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.goalButton,
      goal === "maintenance" && styles.selectedOption
    ]}
    onPress={() => setGoal("maintenance")}
  >
    <Text style={styles.optionText}>Maintain Weight</Text>
  </TouchableOpacity>

</View>

          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  glassCard: {
    width: "90%",
    padding: 30,
    borderRadius: 30,
    backgroundColor: "rgba(147,197,253,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    elevation: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#93c5fd",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    color: "white",
  },

  sectionLabel: {
    color: "#cbd5f5",
    marginTop: 10,
    marginBottom: 8,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 5,
    alignItems: "center",
  },

  selectedOption: {
    backgroundColor: "#38bdf8",
  },

  optionText: {
    color: "white",
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#38bdf8",
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
  },

  buttonText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#020617",
  },

  goalContainer: {
  marginBottom: 15,
},

goalButton: {
  padding: 12,
  borderRadius: 12,
  backgroundColor: "rgba(255,255,255,0.15)",
  marginBottom: 10,
  alignItems: "center",
},
});