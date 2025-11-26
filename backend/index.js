require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const User = require("./models/User");
const ScrapeJob = require("./models/ScrapeJob");
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
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['set-cookie']
}));




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
  const { query, mustHave = [], ratings = [] } = req.body;

  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    console.log(`🟦 Creating scrape job for query: "${query}"`);
    const job = await ScrapeJob.create({ query, mustHave, ratings, status: 'pending' });
    console.log(`🟩 Job created with ID: ${job._id}`);
    res.json({ jobId: job._id, status: 'pending' }); // immediate response

    // --- Start scraping asynchronously ---
    (async () => {
      try {
        console.log(`🟨 Starting scraping for job ${job._id}...`);
        const scrapedResults = await performScraping(query);
        console.log(`🟩 Scraping done for job ${job._id}, total results: ${scrapedResults.length}`);

        const filteredResults = applyFilters(scrapedResults, mustHave, ratings);
        console.log(`🟦 Filtered results for job ${job._id}: ${filteredResults.length}`);

        await ScrapeJob.findByIdAndUpdate(job._id, {
          status: 'done',
          result: filteredResults,
          updatedAt: new Date()
        });
        console.log(`✅ Job ${job._id} marked as done`);

      } catch (err) {
        console.error(`🔴 Job ${job._id} failed:`, err.message);
        await ScrapeJob.findByIdAndUpdate(job._id, {
          status: 'failed',
          error: err.message,
          updatedAt: new Date()
        });
      }
    })();

  } catch (err) {
    console.error("Failed to create scrape job:", err.message);
    res.status(500).json({ error: "Failed to create scrape job" });
  }
});

// --- Check job status ---
app.get("/scrape/status/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await ScrapeJob.findById(jobId);
    if (!job) {
      console.warn(`⚠️ Job ${jobId} not found`);
      return res.status(404).json({ error: "Job not found" });
    }

    console.log(`ℹ️ Job ${jobId} status check: ${job.status}`);
    if (job.status === 'pending') return res.json({ status: 'pending' });
    if (job.status === 'done') return res.json({ status: 'done', results: job.result });
    if (job.status === 'failed') return res.json({ status: 'failed', error: job.error });

  } catch (err) {
    console.error("Error fetching job:", err.message);
    res.status(500).json({ error: "Failed to fetch job status" });
  }
});

// --- Perform scraping ---
async function performScraping(query) {
  let browser;
  try {
    console.log("🟦 Launching Chromium...");
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext();
    context.setDefaultTimeout(30000);
    context.setDefaultNavigationTimeout(30000);
    await context.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    });

    const page = await context.newPage();
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    console.log(`🟨 Navigating to ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    console.log("🟦 Waiting for search results...");
    try {
      await page.waitForFunction(() => {
        return document.querySelector('a[href*="/place/"]') ||
          document.querySelector('[role="feed"]') ||
          document.querySelector('.hfpxzc') ||
          document.querySelector('.Nv2PK');
      }, { timeout: 15000 });
      console.log("✅ Results appeared on page");
    } catch {
      const hasContent = await page.evaluate(() => document.body.textContent.length > 100);
      if (!hasContent) throw new Error('Page failed to load content');
      console.warn("⚠️ Navigation timed out, but content detected");
    }

    console.log("🟨 Starting deep scroll...");
    await page.evaluate(async () => {
      function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
      const findScrollable = () => {
        const selectors = ['div[role="feed"]', '.m6QErb', 'div[style*="overflow"]'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.scrollHeight > el.clientHeight) return el;
        }
        return document.body;
      };
      const scrollable = findScrollable();
      console.log("🟦 Scrollable element found", scrollable);
      let previousHeight = 0, stableCount = 0;

      while (stableCount < 8) {
        scrollable.scrollTop = scrollable.scrollHeight;
        await wait(2500);
        const newHeight = scrollable.scrollHeight;
        if (newHeight === previousHeight) stableCount++;
        else { stableCount = 0; previousHeight = newHeight; }
        scrollable.scrollTop -= 300; await wait(1000);
        scrollable.scrollTop = scrollable.scrollHeight; await wait(1500);
      }
    });
    console.log("✅ Scrolling finished");

    console.log("🟦 Extracting business URLs...");
    let businessLinks = await page.$$eval('a[href*="/place/"]', els =>
      els.map(el => {
        try {
          const href = el.getAttribute('href');
          if (!href) return null;
          const fullUrl = href.startsWith('http') ? href : `https://www.google.com${href}`;
          const name = el.getAttribute('aria-label') ||
            el.querySelector('.qBF1Pd')?.textContent?.trim() ||
            el.closest('.Nv2PK')?.querySelector('.qBF1Pd')?.textContent?.trim() ||
            'Business';
          if (fullUrl.includes('/place/') && fullUrl.includes('google.com/maps')) return { name, url: fullUrl };
          return null;
        } catch { return null; }
      }).filter(x => x !== null)
    );
    console.log(`✅ Found ${businessLinks.length} businesses`);

    await page.close();

    if (!businessLinks.length) {
      await context.close();
      await browser.close();
      return [];
    }

    console.log("🟨 Scraping individual business pages concurrently...");
    async function scrapeWithConcurrency(links, context, concurrency = 5) {
      const results = [];
      let index = 0;

      async function worker() {
        while (index < links.length) {
          const currentIndex = index++;
          const business = links[currentIndex];
          try {
            console.log(`   ↪ Scraping ${business.name} (${currentIndex + 1}/${links.length})`);
            const data = await scrapeBusinessPage(context, business.name, business.url);
            if (data) {
              results.push(data);
              console.log(`      ✅ Scraped ${business.name}`);
            }
          } catch (err) {
            console.warn(`      ⚠️ Failed to scrape ${business.name}: ${err.message}`);
          }
        }
      }

      const workers = [];
      for (let i = 0; i < concurrency; i++) workers.push(worker());
      await Promise.all(workers);
      return results;
    }

    const scrapedResults = await scrapeWithConcurrency(businessLinks, context, 5);

    await context.close();
    await browser.close();

    console.log("🟩 Scraping finished");
    return scrapedResults;

  } catch (err) {
    if (browser) await browser.close();
    console.error("🔴 Scraping error:", err.message);
    throw err;
  }
}


async function scrapeBusinessPage(context, name, url) {
  const page = await context.newPage();
  try {
    const cleanUrl = url.split('&')[0] + '?hl=en';
    await page.goto(cleanUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

    const data = await page.evaluate(() => {
      const getText = selector => document.querySelector(selector)?.textContent?.trim() || '';
      const name = getText('.DUwDvf.fontHeadlineLarge') || getText('h1') || document.title.replace(' - Google Maps', '');
      const address = getText('[data-item-id="address"] .Io6YTe') || '';
      const rating = getText('.F7nice > span > span') || '';
      let phone = '';
      const phoneLink = document.querySelector('a[href^="tel:"]');
      if (phoneLink) phone = phoneLink.getAttribute('href').replace('tel:', '').replace(/[^\d+]/g, '');
      let website = '';
      const websiteLinks = Array.from(document.querySelectorAll('a[href*="://"]'));
      for (const link of websiteLinks) {
        if (link.href && !link.href.includes('google') && !link.href.includes('facebook.com')) {
          website = link.href; break;
        }
      }
      return { name, address, rating, phone, website };
    });

   
    data.url = url;
    return data;

  } catch (err) {
    console.warn(`⚠️ Business scrape failed: ${name}: ${err.message}`);
    throw new Error(`Page scrape failed: ${err.message}`);
  } finally {
    await page.close();
  }
}



function applyFilters(results, mustHave, ratings) {
  const fieldMap = { "Phone": "phone", "Address": "address", "Website": "website" };

  const passesMustHave = (lead) => {
    if (!mustHave.length) return true;
    return mustHave.every(field => {
      const key = fieldMap[field];
      if (!key) return true;
      return lead[key] && lead[key].toString().trim().length > 0;
    });
  };

  const passesRating = (lead) => {
    if (!ratings.length) return true;
    if (!lead.rating) return false;
    const numRating = parseFloat(lead.rating);
    return ratings.some(r => {
      const targetRating = parseInt(r.split(" ")[0]);
      return Math.floor(numRating) === targetRating;
    });
  };

  return results.filter(lead => lead && passesMustHave(lead) && passesRating(lead));
}


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
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/send-email", auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    console.log('sending email to ',to);

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





app.listen(port, () => {
  console.log('Server running and this is version5');
});

