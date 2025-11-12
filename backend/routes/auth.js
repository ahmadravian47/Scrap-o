const router = require("express").Router();
const passport = require("passport");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
router.get(
	"/google/callback",
	passport.authenticate("google", { failureRedirect: "/login/failed" }),
	async (req, res) => {
		if (!req.user) {
			return res.status(403).json({ error: true, message: "Not Authorized" });
		}
		try {
			let existingUser = await User.findOne({ email: req.user.email });

			// if user/technican not already present act for signup as an owner
			if (!existingUser) {
				const lastUser = await User.findOne().sort({ organizationNumber: -1 });
				const newOrganizationNumber = lastUser ? lastUser.organizationNumber + 1 : 1;
				existingUser = new User({
					email: req.user.email,
					googleId: req.user.id,
					organizationNumber: newOrganizationNumber,
				});
				await existingUser.save()

				const token = jwt.sign({ email: existingUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
				res.cookie('token', token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
					maxAge: 7 * 24 * 60 * 60 * 1000
				});


				return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
			}
			else //user exists, so act for login
			{
				if (existingUser) {
					const token = jwt.sign({ email: existingUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
					res.cookie('token', token, {
						httpOnly: true,
						secure: process.env.NODE_ENV === 'production',
						sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
						maxAge: 7 * 24 * 60 * 60 * 1000
					});


					return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
				}


			}
		} catch (error) {
			console.error("Error in Google Auth Callback:", error);
			res.redirect("/login/failed");
		}
	}
);

router.get(
	"/google",
	(req, res, next) => {
		// Store signup intent in session
		req.session.signup = req.query.signup === "true";
		next();
	},
	passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/login/success", (req, res) => {
	if (req.user) {
		res.status(200).json({
			error: false,
			message: "Successfully Logged In",
			user: req.user,
		});
	} else {
		res.status(403).json({ error: true, message: "Not Authorized" });
	}
});

router.get("/login/failed", (req, res) => {
	res.status(401).json({
		error: true,
		message: "Login failed",
	});
});

router.get("/logout", (req, res) => {
	req.logout();
	res.redirect(`${process.env.CLIENT_URL}`);
});




module.exports = router;