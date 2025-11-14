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
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    });

    const page = await browser.newPage();
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    console.log(`🟨 Navigating to Google Maps: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("🟦 Waiting for sidebar results panel...");
    const scrollableSelector = 'div[role="feed"][aria-label^="Results for"]';
    await page.waitForSelector(scrollableSelector, { timeout: 20000 });
    console.log("✅ Sidebar loaded!");

    // 🌍 Scroll to load all results
    console.log("🟨 Scrolling until all results are loaded...");
    await page.evaluate(async (selector) => {
      const scrollable = document.querySelector(selector);
      if (!scrollable) return false;

      let previousHeight = 0;
      let sameCount = 0;

      for (let i = 0; i < 50; i++) {
        scrollable.scrollBy(0, 1000);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const currentHeight = scrollable.scrollHeight;
        if (currentHeight === previousHeight) {
          sameCount++;
          if (sameCount >= 3) break;
        } else {
          sameCount = 0;
          previousHeight = currentHeight;
        }
      }

      return true;
    }, scrollableSelector);
    console.log("✅ Finished scrolling — all results loaded!");

    // 🟦 Extract business URLs from sidebar
    console.log("🟦 Extracting business URLs...");
    const businessLinks = await page.$$eval("a.hfpxzc", (links) =>
      links.map(link => ({
        name: link.getAttribute("aria-label") || "",
        url: link.href
      }))
    );
    console.log(`✅ Found ${businessLinks.length} business URLs.`);

    const results = [];

    // 🟦 Visit each business URL individually
    for (const { name, url } of businessLinks) {
      console.log(`🟨 Visiting ${name || "(unknown)"} → ${url}`);
      const bizPage = await browser.newPage();

      try {
        await bizPage.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

        // Wait until title (name) appears or timeout
        await bizPage.waitForSelector(
          '.DUwDvf, .x3AX1-LfntMc-header-title-title, h1.section-hero-header-title-title',
          { timeout: 20000 }
        );

        // Wait an extra 2.5 seconds for slow rendering
        await bizPage.waitForTimeout(2500);

        // inside your per-business loop, after navigation and waits
        const data = await bizPage.evaluate(() => {
          const clean = (v) => (v ? v.toString().trim() : "");

          // helper: find phone-like string by regex in a text blob
          const findPhoneInText = (text) => {
            if (!text) return "";
            // common international-ish phone regex (US-friendly)
            const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d{1,4})?/g;
            const matches = text.match(phoneRegex);
            if (!matches) return "";
            // pick the longest match that contains at least 7 digits
            const sane = matches
              .map(m => m.replace(/[^\d+]/g, ""))
              .filter(m => (m.replace(/\D/g, "").length >= 7));
            if (!sane.length) return "";
            // return the original longest match (not the digits-only)
            let best = matches.reduce((a, b) => (a.length > b.length ? a : b));
            return best.trim();
          };
           const text = (sel) => document.querySelector(sel)?.textContent?.trim() || "";

          const name =
            text(".DUwDvf.fontHeadlineLarge") ||
            text(".x3AX1-LfntMc-header-title-title") ||
            text("h1.section-hero-header-title-title") ||
            text('h1.DUwDvf') ||
            "";

          // --- ADDRESS (fallbacks) ---
          const address =
            document.querySelector(".rogA2c .Io6YTe.fontBodyMedium.kR99db.fdkmkc")?.textContent?.trim() ||
            document.querySelector("[data-item-id='address'] .Io6YTe")?.textContent?.trim() ||
            "";

          // --- RATING ---
          const rating =
            document.querySelector(".F7nice > span:first-child > span[aria-hidden='true']")?.textContent?.trim() ||
            document.querySelector(".F7nice span[aria-hidden='true']")?.textContent?.trim() ||
            "";

          // --- WEBSITE ---
          let website = "";
          const websiteBlock = Array.from(document.querySelectorAll(".RcCsl"))
            .find(el => el.innerText && /website/i.test(el.innerText));
          if (websiteBlock) {
            website = websiteBlock.querySelector(".Io6YTe")?.textContent?.trim() || "";
            // sometimes the website is an <a> link instead of text
            if (!website) {
              const a = websiteBlock.querySelector("a[href^='http']");
              website = a?.href || "";
            }
          }
          if (!website) {
            // fallback: try to find any top-level external link
            const anySite = Array.from(document.querySelectorAll("a[href^='http']"))
              .map(a => a.href)
              .find(h => !/google\.(com|usercontent)/i.test(h));
            website = anySite || website;
          }

          // --- PHONE: robust multi-step detection ---

          // 1) button with aria-label "Phone: +1 ..." (best)
          let phone = "";
          const phoneBtn = document.querySelector("button[aria-label^='Phone:'], a[aria-label^='Phone:']");
          if (phoneBtn) {
            // aria-label often contains "Phone: +1 123-456-7890 "
            phone = phoneBtn.getAttribute("aria-label") || phoneBtn.textContent || "";
            phone = phone.replace(/^Phone:\s*/i, "").trim();
          }

          // 2) tel: links
          if (!phone) {
            const tel = document.querySelector("a[href^='tel:']");
            if (tel) phone = (tel.getAttribute("href") || "").replace(/^tel:/i, "").trim();
          }

          // 3) .RcCsl blocks that mention "Phone"
          if (!phone) {
            const phoneBlock = Array.from(document.querySelectorAll(".RcCsl"))
              .find(el => el.innerText && /phone/i.test(el.innerText));
            if (phoneBlock) {
              phone = phoneBlock.querySelector(".Io6YTe")?.textContent?.trim() || "";
            }
          }

          // 4) fallback: search entire page text for phone-like pattern
          if (!phone) {
            const pageText = document.body.innerText || "";
            phone = findPhoneInText(pageText);
          }

          // Normalize: remove extraneous words like "Call" or "Phone:"
          if (phone) {
            phone = phone.replace(/^(phone|call)[:\s-]*/i, "").trim();
          }

          // Final trim & return
          return {
            name: clean(name),
            address: clean(address),
            rating: clean(rating),
            phone: clean(phone),
            website: clean(website),
          };
        });


        data.url = url;
        results.push(data);

        console.log(`✅ Scraped: ${data.name || "Unnamed"} (${data.address || "No address"})`);

      } catch (err) {
        console.log(`❌ Failed to scrape ${name || "unknown"}: ${err.message}`);
      }

      await bizPage.close();
    }


    await browser.close();
    console.log("🟩 Scraping complete!");
    res.json({ total: results.length, results });

  } catch (error) {
    console.error("🔴 SCRAPER ERROR:", error);
    if (browser) await browser.close();
    res.status(500).json({ error: error.toString() });
  }
});

app.post("/logout", (req, res) => {
  try {
    // Destroy the session (if using express-session)
    req.session?.destroy(() => {});

    // Clear the JWT cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Logout failed" });
  }
});








