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


// app.post("/scrape", async (req, res) => {
//   const { query } = req.body;
//   console.log(`🟦 Incoming scrape request for query: "${query}"`);

//   let browser;
//   try {
//     console.log("🟨 Launching Chromium...");
//     browser = await chromium.launch({
//       headless: true,
//       executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Adjust path if needed
//     });

//     const page = await browser.newPage();

//     const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
//     console.log(`🟨 Navigating to Google Maps: ${searchUrl}`);

//     await page.goto(searchUrl, {
//       waitUntil: "domcontentloaded",
//       timeout: 60000,
//     });

//     console.log("🟦 Waiting for result links (.hfpxzc)...");
//     await page.waitForSelector('a.hfpxzc', { timeout: 20000 });
//     console.log("✅ Result links loaded!");

//     // Scroll to load multiple results (optional but helpful)
//     console.log("🟨 Scrolling to load more results...");
//     const scrollResults = await page.evaluate(async () => {
//       const scrollable = document.querySelector('div[role="feed"]') || document.body;
//       for (let i = 0; i < 6; i++) {
//         scrollable.scrollBy(0, 800);
//         await new Promise(resolve => setTimeout(resolve, 700));
//       }
//       return true;
//     });

//     await page.waitForTimeout(1500);

//     console.log("🟦 Extracting business URLs from .hfpxzc links...");
//     const businessLinks = await page.$$eval('a.hfpxzc', (anchors) =>
//       anchors.map(a => ({
//         name: a.getAttribute('aria-label') || '',
//         url: a.href,
//       }))
//     );

//     console.log(`✅ Found ${businessLinks.length} business URLs.`);

//     // Now open each business link and fetch details
//     const detailPage = await browser.newPage();
//     const results = [];

//     for (let i = 0; i < businessLinks.length; i++) {
//       const biz = businessLinks[i];
//       console.log(`🟨 Visiting ${biz.name} → ${biz.url}`);

//       try {
//         await detailPage.goto(biz.url, { waitUntil: "domcontentloaded", timeout: 30000 });

//         // Extract details
//         const nameSelector = '.DUwDvf.fontHeadlineLarge';
//         const ratingSelector = '.F7nice.mmu3tf span[aria-hidden="true"]';
//         const addressSelector = '.rogA2c .Io6YTe.fontBodyMedium.kR99db.fdkmkc';

//         await detailPage.waitForSelector(nameSelector, { timeout: 15000 });

//         const data = await detailPage.evaluate((nameSel, ratingSel, addrSel) => {
//           const name = document.querySelector(nameSel)?.innerText || '';
//           const rating = document.querySelector(ratingSel)?.innerText || '';
//           const address = document.querySelector(addrSel)?.innerText || '';
//           return { name, rating, address };
//         }, nameSelector, ratingSelector, addressSelector);

//         results.push({
//           name: data.name || biz.name,
//           rating: data.rating,
//           address: data.address,
//           url: biz.url,
//         });

//         console.log(`✅ Extracted: ${data.name} | ${data.rating} | ${data.address}`);
//         await detailPage.waitForTimeout(1000 + Math.random() * 1500);

//       } catch (err) {
//         console.log(`❌ Failed to scrape ${biz.name}: ${err.message}`);
//       }
//     }

//     await detailPage.close();
//     console.log("✅ Finished scraping all business pages.");

//     res.json({ leads: results });

//   } catch (error) {
//     console.error("🔴 SCRAPER ERROR:", error);
//     res.status(500).json({ error: error.toString() });

//   } finally {
//     if (browser) {
//       console.log("🟧 Closing browser...");
//       await browser.close();
//     }
//   }
// });



app.post("/scrape", async (req, res) => {
  const { query } = req.body;
  console.log(`🟦 Incoming scrape request for query: "${query}"`);

  let browser;
  try {
    console.log("🟨 Launching Chromium...");
    browser = await chromium.launch({
      headless: true,
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    });

    const page = await browser.newPage();
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    console.log(`🟨 Navigating to Google Maps: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForSelector('div[role="feed"], a.hfpxzc', { timeout: 30000 });
    console.log("✅ Sidebar loaded!");

    // Scroll to load more results
    console.log("🟨 Scrolling to load all results...");
    await page.evaluate(async () => {
      const scrollable = document.querySelector('div[role="feed"]');
      if (!scrollable) return;
      for (let i = 0; i < 10; i++) {
        scrollable.scrollBy(0, 1000);
        await new Promise((r) => setTimeout(r, 800));
      }
    });
    await page.waitForTimeout(2000);

    console.log("🟦 Extracting business URLs...");
    const businessLinks = await page.$$eval('a.hfpxzc', (links) =>
      links.map((el) => ({
        name: el.getAttribute("aria-label") || "",
        url: el.href || "",
      }))
    );

    console.log(`✅ Found ${businessLinks.length} business URLs.`);
    const results = [];

    for (const biz of businessLinks) {
      console.log(`🟨 Visiting ${biz.name} → ${biz.url}`);
      const detailPage = await browser.newPage();

      try {
        await detailPage.goto(biz.url, { waitUntil: "domcontentloaded", timeout: 60000 });
        await detailPage.waitForTimeout(4000); // let Maps render everything

        const selectors = {
          nameMain: ".DUwDvf.fontHeadlineLarge",
          nameAlt: ".x3AX1-LfntMc-header-title-title",
          rating: ".F7nice > span:first-child > span[aria-hidden='true']",
          address: ".rogA2c .Io6YTe.fontBodyMedium.kR99db.fdkmkc",
          websiteBlock: 'a[aria-label^="Website:"] .Io6YTe.fontBodyMedium.kR99db.fdkmkc',
          phoneBlock: 'button[aria-label^="Phone:"] .Io6YTe.fontBodyMedium.kR99db.fdkmkc',
        };

        // Wait for any meaningful element to appear
        try {
          await detailPage.waitForSelector(
            `${selectors.nameMain}, ${selectors.nameAlt}, ${selectors.address}, ${selectors.rating}`,
            { timeout: 20000 }
          );
        } catch {
          console.log(`⚠️ ${biz.name}: selector not found, retrying...`);
          await detailPage.reload({ waitUntil: "domcontentloaded" });
          await detailPage.waitForTimeout(5000);
        }

        const data = await detailPage.evaluate((s) => {
          const clean = (t) => (t ? t.toString().trim() : "");

          const nameEl = document.querySelector(s.nameMain) || document.querySelector(s.nameAlt);
          const name = clean(nameEl?.innerText);

          const ratingEl = document.querySelector(s.rating);
          const rating = clean(ratingEl?.textContent);

          const addressEl = document.querySelector(s.address);
          const address = clean(addressEl?.textContent);

          const websiteEl = document.querySelector(s.websiteBlock);
          const website = clean(websiteEl?.innerText);

          const phoneEl = document.querySelector(s.phoneBlock);
          const phone = clean(phoneEl?.innerText);

          return { name, rating, address, website, phone };
        }, selectors);

        results.push({
          name: data.name || biz.name,
          rating: data.rating || "",
          address: data.address || "",
          website: data.website || "",
          phone: data.phone || "",
          url: biz.url,
        });

        console.log(
          `✅ ${data.name || biz.name} | ⭐ ${data.rating} | 📍 ${data.address} | ☎️ ${data.phone} | 🌐 ${data.website}`
        );
      } catch (err) {
        console.log(`❌ Failed to scrape ${biz.name}: ${err.message}`);
        results.push({
          name: biz.name,
          rating: "",
          address: "",
          website: "",
          phone: "",
          url: biz.url,
        });
      } finally {
        await detailPage.close();
      }
    }

    console.log(`✅ Scraping completed. Extracted ${results.length} total leads.`);
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






