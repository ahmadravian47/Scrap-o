require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const MongoStore = require('connect-mongo');
const { chromium } = require("playwright");

require("./passport");

const authRoutes = require("./routes/auth");

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);



app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const auth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


const loginSignupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login/signup attempts. Try again later."
});

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // higher limit for OAuth redirects
  message: "Too many OAuth requests. Try again later."
});

// Apply per route
app.use("/login", loginSignupLimiter);
app.use("/signup", loginSignupLimiter);
app.use("/auth/google", oauthLimiter);
app.use("/auth/google/callback", oauthLimiter);


// Routes
app.use("/auth", authRoutes);

// Start DB + server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));




app.get('/userprofile', auth, (req, res) => {
  res.status(200).json({
    email: req.user.email,
  });
});

// LOGIN (email + password)
app.post("/login", async (req, res) => {
  const { emailOrPhone, password } = req.body;
  try {
    const user = await User.findOne({ email: emailOrPhone });

    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.json({ success: true, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// SIGNUP (email + password)
app.post("/signup", async (req, res) => {
  const { name, emailOrPhone, password } = req.body;
  try {
    const userExists = await User.findOne({ email: emailOrPhone });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const lastUser = await User.findOne().sort({ organizationNumber: -1 });
    const newOrganizationNumber = lastUser ? lastUser.organizationNumber + 1 : 1;

    const newUser = new User({
      name,
      email: emailOrPhone,
      password: hashedPassword,
      organizationNumber: newOrganizationNumber,
    });
    await newUser.save();
    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, { expiresIn: "7d" });


    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({ success: true, message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/scrape", async (req, res) => {
  const { query } = req.body;
  console.log(`🟦 Incoming scrape request for query: "${query}"`);

  let browser;
  try {
    console.log("🟨 Launching Chromium...");
    browser = await chromium.launch({
      headless: true,
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // using installed Chrome
    });

    const page = await browser.newPage();

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    console.log(`🟨 Navigating to Google Maps: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log("🟦 Waiting for sidebar results panel...");
    const scrollableSelector = 'div[role="feed"][aria-label^="Results for"]';
    await page.waitForSelector(scrollableSelector, { timeout: 20000 });
    console.log("✅ Sidebar loaded!");

    // Scroll to load multiple results
    console.log("🟨 Starting scroll to load results...");
    const scrollResults = await page.evaluate(async (selector) => {
      const scrollable = document.querySelector(selector);
      if (!scrollable) return false;
      for (let i = 0; i < 6; i++) {
        scrollable.scrollBy(0, 500);
        await new Promise(resolve => setTimeout(resolve, 700));
      }
      return true;
    }, scrollableSelector);

    if (!scrollResults) {
      console.log("❌ Scrollable panel not found — Google Maps may have changed UI.");
    } else {
      console.log("✅ Finished scrolling, waiting a bit for results...");
      await page.waitForTimeout(1500);
    }

    console.log("🟦 Extracting business cards...");
    const cardSelector = '.Nv2PK.THOPZb.CpccDe';
    const results = await page.$$eval('.Nv2PK.THOPZb.CpccDe', (cards) =>
      cards.map(el => {
        // Name
        const name = el.querySelector('.qBF1Pd.fontHeadlineSmall')?.innerText || '';

        // Rating
        const rating = el.querySelector('.MW4etd')?.innerText || '';

        // Address
        const addressEl = Array.from(el.querySelectorAll('.W4Efsd span'))
          .find(span => /\d{1,5}\s+\w+/.test(span.innerText)); // crude check for street number
        const address = addressEl?.innerText || '';

        // Phone number
        const phoneEl = Array.from(el.querySelectorAll('.W4Efsd span'))
          .find(span => /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(span.innerText));
        const phone = phoneEl?.innerText || '';

        // Google Maps URL
        const url = el.querySelector('a[href*="maps.google.com"]')?.href || '';

        return { name, rating, address, phone, url };
      })
    );


    console.log(`✅ Extracted ${results.length} leads.`);
    res.json({ leads: results });

  } catch (error) {
    console.error("🔴 SCRAPER ERROR:", error);
    res.status(500).json({ error: error.toString() });

  } finally {
    if (browser) {
      console.log("🟧 Closing browser...");
      await browser.close();
    }
  }
});


