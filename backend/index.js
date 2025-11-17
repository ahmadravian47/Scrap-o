require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const User = require("./models/User");
const SentEmail = require("./models/SentEmail");
const Settings = require("./models/Settings");
const Pending = require("./models/Pending");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet")
const rateLimit = require("express-rate-limit");
const MongoStore = require('connect-mongo');
const { chromium } = require("playwright");
const { body, param, validationResult } = require('express-validator');
const { ImapFlow } = require("imapflow");
const Imap = require("imap");
const { simpleParser } = require("mailparser");


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
const port = process.env.PORT || 5000;

// Start DB + server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(port, () => {
      console.log('Server running');
    });

  })
  .catch((err) => console.log(err));




app.get('/userprofile', auth, (req, res) => {
  res.status(200).json({
    email: req.user.email,
  });
});

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

app.post(
  '/signup',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input' });

    let { name, email, password } = req.body;
    email = email.trim().toLowerCase();

    try {
      // check if already registered
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: 'Signup failed. If an account exists, check your email.' });

      // check if already pending
      const existingPending = await Pending.findOne({ email });
      if (existingPending)
        return res.status(400).json({ message: 'A verification email was already sent. Please check your inbox.' });

      const hashedPassword = await bcrypt.hash(password, 12);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      await Pending.create({
        name,
        email,
        hashedPassword,
        verificationToken
      });

      const verificationLink = `${process.env.SERVER_URL}/verify?token=${verificationToken}`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
      });

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: email,
        subject: 'Verify your Scrap-o account',
        html: `
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: black; text-align: center; text-decoration: none; border-radius: 5px;">
             Verify Email
          </a>`
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: 'Verification email sent' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);
app.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Invalid token');

  try {
    const pending = await Pending.findOne({ verificationToken: token });
    if (!pending) return res.status(400).send('Invalid or expired token');

    const { name, email, hashedPassword } = pending;

    // double-check user doesn’t already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await Pending.deleteOne({ _id: pending._id });
      return res.status(400).send('User already exists');
    }

    // assign organizationNumber
    const lastUser = await User.findOne().sort({ organizationNumber: -1 });
    const newOrganizationNumber = lastUser ? lastUser.organizationNumber + 1 : 1;

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      organizationNumber: newOrganizationNumber
    });

    // cleanup
    await Pending.deleteOne({ _id: pending._id });

    // create auth cookie
    const authToken = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
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

    // --- extract filters from request ---
    // --- extract filters from request ---
    const { mustHave = [], ratings = [] } = req.body;

    // Map UI names → lead object keys
    const fieldMap = {
      "Phone": "phone",
      "Address": "address",
      "Website": "website"
    };

    // Must-have filter
    const passesMustHave = (lead) => {
      if (mustHave.length === 0) return true;

      return mustHave.every(field => {
        const key = fieldMap[field];
        if (!key) return true; // ignore unknown fields
        const val = lead[key];
        return val && val.toString().trim().length > 0;
      });
    };

    // Rating filter
    const passesRating = (lead) => {
      if (ratings.length === 0) return true;
      if (!lead.rating) return false;

      const rounded = Math.floor(Number(lead.rating)); // "4.3" → 4

      return ratings.some(r => {
        const num = Number(r.split(" ")[0]); // "4 stars" → 4
        return num === rounded;
      });
    };

    // Apply filters
    const filteredResults = results.filter(
      lead => passesMustHave(lead) && passesRating(lead)
    );

    res.json({
      total: filteredResults.length,
      results: filteredResults
    });



  } catch (error) {
    console.error("🔴 SCRAPER ERROR:", error);
    if (browser) await browser.close();
    res.status(500).json({ error: error.toString() });
  }
});

app.post("/logout", (req, res) => {
  try {
    // Destroy the session (if using express-session)
    req.session?.destroy(() => { });

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



app.get("/settings", auth, async (req, res) => {
  try {
    const userEmail = req.query.email;

    if (!userEmail)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    const orgNumber = user.organizationNumber;

    const settings = await Settings.findOne({ organizationNumber: orgNumber });

    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.json(settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/settings", auth, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get logged-in user
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    const orgNumber = user.organizationNumber;

    // Extract fields
    const {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,

      imapHost,
      imapPort,
      imapSecure,
      imapUser,
      imapPass,
    } = req.body;

    // Build update object
    const updateData = {
      organizationNumber: orgNumber,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      imapHost,
      imapPort,
      imapSecure,
      imapUser,
    };

    if (smtpPass) updateData.smtpPass = smtpPass;
    if (imapPass) updateData.imapPass = imapPass;

    // Update OR create
    const settings = await Settings.findOneAndUpdate(
      { organizationNumber: orgNumber },
      { $set: updateData },
      { upsert: true, new: true }
    );

    res.json({ message: "Settings saved", settings });
  } catch (err) {
    console.error("Error saving settings:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/settings/test-smtp", auth, async (req, res) => {
  const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify connection (NO email sent yet)
    await transporter.verify();

    // Optional: send a test email
    await transporter.sendMail({
      from: smtpUser,
      to: smtpUser,
      subject: "SMTP Test Successful",
      text: "If you received this, SMTP is working!",
    });

    return res.json({ success: true, message: "SMTP connection successful" });
  } catch (err) {
    console.log("SMTP Test Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "SMTP Test Failed",
    });
  }
});

app.post("/settings/test-imap", auth, async (req, res) => {
  const { imapHost, imapPort, imapSecure, imapUser, imapPass } = req.body;

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: imapSecure,
    auth: {
      user: imapUser,
      pass: imapPass,
    },
  });

  try {
    await client.connect();

    // Try to open inbox
    await client.mailboxOpen("INBOX");

    await client.logout();

    return res.json({
      success: true,
      message: "IMAP connection successful",
    });
  } catch (err) {
    console.log("IMAP Test Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "IMAP Test Failed",
    });
  }
});






async function fetchInboxMessages(orgNumber, limit = 10) {
  // Get settings for the organization
  const settings = await Settings.findOne({ organizationNumber: orgNumber });
  if (!settings) throw new Error("Settings not found for this organization");

  const imapConfig = {
    user: settings.imapUser,
    password: settings.imapPass,
    host: settings.imapHost,
    port: settings.imapPort,
    tls: settings.imapSecure,
    tlsOptions: { rejectUnauthorized: false },
  };

  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    function openInbox() {
      return new Promise((res, rej) => {
        imap.openBox("INBOX", true, (err, box) => {
          if (err) return rej(err);
          res(box);
        });
      });
    }

    imap.once("ready", async () => {
      try {
        await openInbox();

        // Search for all messages
        imap.search(["ALL"], (err, results) => {
          if (err) throw err;

          if (!results || results.length === 0) {
            imap.end();
            return resolve([]);
          }

          // Get last N UIDs
          const uidsToFetch = results.slice(-limit);

          const fetcher = imap.fetch(uidsToFetch, { bodies: "", struct: true });
          const messagePromises = [];

          fetcher.on("message", (msg) => {
            let emailBuffer = "";
            const messagePromise = new Promise((res) => {
              msg.on("body", (stream) => {
                stream.on("data", (chunk) => (emailBuffer += chunk.toString("utf8")));
              });

              msg.once("end", async () => {
                try {
                  const parsed = await simpleParser(emailBuffer);
                  res({
                    subject: parsed.subject,
                    from: parsed.from?.text,
                    to: parsed.to?.text,
                    date: parsed.date,
                    text: parsed.text,
                    html: parsed.html,
                  });
                } catch (parseErr) {
                  res(null); // skip parsing errors
                }
              });
            });

            messagePromises.push(messagePromise);
          });

          fetcher.once("end", async () => {
            const messages = (await Promise.all(messagePromises)).filter(Boolean);
            imap.end();
            resolve(messages.reverse()); // newest first
          });

          fetcher.once("error", (err) => reject(err));
        });
      } catch (error) {
        imap.end();
        reject(error);
      }
    });

    imap.once("error", (err) => reject(err));
    imap.connect();
  });
}

async function sendEmail(orgNumber, to, subject, body) {
  const settings = await Settings.findOne({ organizationNumber: orgNumber });
  if (!settings) throw new Error("Settings not found");

  const trackingId = new mongoose.Types.ObjectId();
  const pixelURL = `${process.env.SERVER_URL}/email-open/${trackingId}`;

  // Save email before sending
  await SentEmail.create({
    _id: trackingId,
    organizationNumber: orgNumber,
    to,
    subject,
    body,
    openCount: 0,
    openedAt: null,
    sentAt: new Date()
  });

  // SAFE tracking (pixel only — no CID, no font-face, no background hack)
  const trackingHTML = `<img src="${pixelURL}" width="1" height="1" style="visibility:hidden;display:block;" />`;


  const htmlContent = `
    <div>
      ${body}
      <br><br>
      ${trackingHTML}
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass
    },
  });

  const info = await transporter.sendMail({
    from: settings.smtpUser,
    to,
    subject,
    html: htmlContent
  });

  return info;
}

app.get("/email-open/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const email = await SentEmail.findById(id);
    if (!email) return res.status(404).send("Not found");

    const ua = (req.headers["user-agent"] || "").toLowerCase();

    // BOT FILTER LIST
    const botUA = ["curl", "python", "java"]; // only filter real bots

    const isBotUA = botUA.some(token => ua.includes(token));

    if (isBotUA) {
      console.log("BOT FILTERED UA:", ua);
      return res.end(); // do not track
    }

    // PREMATURE REQUEST FILTER (antivirus/spam filters)
    const sentTime = email.sentAt.getTime();
    const now = Date.now();

    if (now - sentTime < 4500) {
      console.log("IGNORED FAST REQUEST:", ua);
      return res.end();
    }

    // UPDATE REAL HUMAN OPEN
    email.openCount += 1;
    if (!email.openedAt) email.openedAt = new Date();
    await email.save();

    console.log(`REAL OPEN DETECTED for ${id}`);

    // 1x1 GIF pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    );

    res.set("Content-Type", "image/gif");
    res.send(pixel);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

app.get("/get-sent-emails", auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const orgNumber = user.organizationNumber;

    const emails = await SentEmail.find({ organizationNumber: orgNumber })
      .sort({ sentAt: -1 });

    res.json(emails);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/send-email", auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: "Recipient, subject, and body are required" });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const orgNumber = user.organizationNumber;
    if (!orgNumber) return res.status(400).json({ message: "Organization number not set for user" });

    const info = await sendEmail(orgNumber, to, subject, body);

    res.json({ message: "Email sent successfully", info });

  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});








