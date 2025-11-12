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

// Session for passport google login
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        }
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