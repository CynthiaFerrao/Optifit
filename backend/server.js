require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/app");

const PORT = 5000;

//connectDB();

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend Connected Successfully 🚀" });
});

app.use("/api/auth", require("./src/routes/authRoutes"));

app.post("/api/food/analyze-image", (req, res) => {
  res.json({
    foodName: "Paneer Butter Masala",
    calories: 320,
    protein: 12,
    carbs: 18,
    fats: 22,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});