import type { Express, RequestHandler } from "express";
import session from "express-session";
import crypto from "crypto";
import { storage } from "./storage";
import { setCsrfToken } from "./csrf";

// Hash password using scrypt
function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

// Verify password
function verifyPassword(password: string, hash: string, salt: string): boolean {
  const hashToVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === hashToVerify;
}

export async function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  const secret = process.env.SESSION_SECRET || "dev-secret-change-me";

  app.use(
    session({
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sessionTtl,
      },
    }) as any,
  );

  // Ensure req.isAuthenticated is always available for downstream middleware
  app.use((req: any, _res, next) => {
    if (typeof req.isAuthenticated !== "function") {
      req.isAuthenticated = () => !!req.session?.user;
    }
    next();
  });

  // Signup endpoint
  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const { hash, salt } = hashPassword(password);

      // Create user
      const newUser = await storage.createUserWithPassword({
        email,
        firstName,
        lastName,
        passwordHash: hash,
        passwordSalt: salt,
      });

      // Set session
      (req.session as any).user = { claims: { sub: newUser.id } };
      (req as any).user = (req.session as any).user;
      (req as any).isAuthenticated = () => true;

      // Save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        setCsrfToken(res);
        res.json({ message: "Account created successfully", user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName } });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash || !user.passwordSalt) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      (req.session as any).user = { claims: { sub: user.id } };
      (req as any).user = (req.session as any).user;
      (req as any).isAuthenticated = () => true;

      // Save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        setCsrfToken(res);
        res.json({ message: "Login successful", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Simple dev login: creates/updates a default user and sets session
  app.get("/api/login", async (req: any, res) => {
    const devUser = {
      id: "dev-user",
      email: "dev@example.com",
      firstName: "Dev",
      lastName: "User",
      profileImageUrl: "",
    };

    try {
      await storage.upsertUser(devUser);
      // Match shape expected by routes: req.user.claims.sub
      (req.session as any).user = { claims: { sub: devUser.id } };
      (req as any).user = (req.session as any).user;
      (req as any).isAuthenticated = () => true;
      setCsrfToken(res);
      res.redirect("/");
    } catch (error) {
      console.error("Dev login failed:", error);
      res.status(500).json({ message: "Dev login failed" });
    }
  });

  app.get("/api/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  const sessionUser = req.session?.user;
  if (sessionUser?.claims?.sub) {
    // Ensure req.user and req.isAuthenticated behave like passport
    req.user = sessionUser;
    req.isAuthenticated = () => true;
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
