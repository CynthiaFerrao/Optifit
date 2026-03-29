import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FoodScannerScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [adding, setAdding] = useState(false);

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow gallery access to pick an image."
        );
        return;
      }

      let res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!res.canceled) {
        setImage(res.assets[0].uri);
        setResult(null);
      }
    } catch (error) {
      console.log("Gallery error:", error);
      Alert.alert("Error", "Could not open gallery");
    }
  };

  const openCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow camera access to capture a meal image."
        );
        return;
      }

      let res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!res.canceled) {
        setImage(res.assets[0].uri);
        setResult(null);
      }
    } catch (error) {
      console.log("Camera error:", error);
      Alert.alert("Error", "Could not open camera");
    }
  };

  const analyzeFood = async () => {
    if (!image) {
      Alert.alert("Error", "Please select or capture an image first");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://192.168.0.103:5000/api/food/analyze-image",
        {
          method: "POST",
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.log("Analyze error:", error);
      Alert.alert("Error", "Food analysis failed");
    } finally {
      setLoading(false);
    }
  };

  
  const addToDailyIntake = async () => {
    if (!result) return;

    try {
      setAdding(true);

      // later you can replace this with backend/API call
      setTimeout(() => {
        setAdding(false);
        Alert.alert(
          "Added",
          "Meal has been added sucessfully to your daily intake"
        );
      }, 800);
    } catch (error) {
      console.log("Add intake error:", error);
      setAdding(false);
      Alert.alert("Error", "Could not add to daily intake");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Food Scanner</Text>
        <Text style={styles.subtitle}>
          Capture or upload your meal and get estimated nutrition instantly
        </Text>

        <View style={styles.uploadCard}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="image-outline" size={48} color="#64748B" />
              <Text style={styles.placeholderText}>No image selected</Text>
              <Text style={styles.placeholderSubText}>
                Use camera or gallery to continue
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={openCamera}>
            <Ionicons name="camera-outline" size={20} color="#fff" />
            <Text style={styles.secondaryButtonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={20} color="#0B1220" />
            <Text style={styles.primaryButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <TouchableOpacity style={styles.analyzeButton} onPress={analyzeFood}>
            <Ionicons name="scan-outline" size={20} color="#fff" />
            <Text style={styles.analyzeButtonText}>Analyze Food</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#00E676" />
            <Text style={styles.loaderText}>Analyzing your meal...</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Meal detected</Text>
            <Text style={styles.resultSubtitle}>From image analysis</Text>
            <View style={styles.macroGrid}>
              <View style={styles.macroCard}>
                <Ionicons name="flame-outline" size={22} color="#f97316" />
                <Text style={styles.macroValue}>{result.calories}</Text>
                <Text style={styles.macroLabel}>Calories</Text>
              </View>

              <View style={styles.macroCard}>
                <Ionicons name="barbell-outline" size={22} color="#38bdf8" />
                <Text style={styles.macroValue}>{result.protein} g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>

              <View style={styles.macroCard}>
                <Ionicons name="leaf-outline" size={22} color="#facc15" />
                <Text style={styles.macroValue}>{result.carbs} g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>

              <View style={styles.macroCard}>
                <Ionicons name="water-outline" size={22} color="#a855f7" />
                <Text style={styles.macroValue}>{result.fats} g</Text>
                <Text style={styles.macroLabel}>Fats</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={addToDailyIntake}
              disabled={adding}
            >
              <Ionicons name="add-circle-outline" size={20} color="#0B1220" />
              <Text style={styles.addButtonText}>
                {adding ? "Adding..." : "Add to Daily Intake"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.note}>
              Values shown are estimated and may vary based on portion size.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#0B1220",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
    backgroundColor: "#0B1220",
  },

  title: {
    fontSize: 28,
    color: "#00E676",
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 28,
    paddingHorizontal: 10,
    lineHeight: 20,
  },

  uploadCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 20,
  },

  image: {
    width: "100%",
    height: 240,
    borderRadius: 18,
  },

  placeholderBox: {
    height: 240,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderStyle: "dashed",
  },

  placeholderText: {
    color: "#CBD5E1",
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
  },

  placeholderSubText: {
    color: "#64748B",
    marginTop: 6,
    fontSize: 13,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  secondaryButton: {
    width: "48%",
    backgroundColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },

  secondaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },

  primaryButton: {
    width: "48%",
    backgroundColor: "#00E676",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
  },

  primaryButtonText: {
    color: "#0B1220",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },

  analyzeButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 20,
  },

  analyzeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  loaderBox: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },

  loaderText: {
    color: "#94A3B8",
    marginTop: 10,
    fontSize: 14,
  },

  resultCard: {
    marginTop: 18,
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  resultTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  resultSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },

  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  macroCard: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },

  macroValue: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 10,
  },

  macroLabel: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 5,
  },

  addButton: {
    marginTop: 8,
    backgroundColor: "#00E676",
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    color: "#0B1220",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  note: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
});