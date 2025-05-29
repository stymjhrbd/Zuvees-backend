// Save this as backend/test-setup.js and run with: node test-setup.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import ApprovedEmail from "./models/ApprovedEmail.js";

dotenv.config();

console.log("🔍 Testing your setup...\n");

// Test 1: Environment Variables
console.log("1. Environment Variables:");
console.log("   PORT:", process.env.PORT || "❌ Not set");
console.log(
  "   MONGODB_URI:",
  process.env.MONGODB_URI ? "✅ Set" : "❌ Not set"
);
console.log("   JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ Not set");
console.log(
  "   GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID || "❌ Not set"
);

if (process.env.GOOGLE_CLIENT_ID) {
  console.log(
    "   Client ID format:",
    process.env.GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com")
      ? "✅ Valid"
      : "❌ Invalid format"
  );
}

// Test 2: MongoDB Connection
console.log("\n2. MongoDB Connection:");
try {
  await mongoose.connect(process.env.MONGODB_URI + "/gaming-ecommerce");
  console.log("   ✅ Connected successfully");

  // Test 3: Check approved emails
  console.log("\n3. Approved Emails:");
  const emails = await ApprovedEmail.find();
  if (emails.length > 0) {
    console.log("   ✅ Found", emails.length, "approved emails:");
    emails.forEach((email) => {
      console.log(`      - ${email.email} (${email.role})`);
    });
  } else {
    console.log("   ❌ No approved emails found. Run: npm run seed");
  }

  await mongoose.disconnect();
} catch (error) {
  console.log("   ❌ Connection failed:", error.message);
}

// Test 4: Instructions
console.log("\n4. Next Steps:");
console.log("   1. If any environment variables are missing, add them to .env");
console.log("   2. If no approved emails, run: npm run seed");
console.log(
  "   3. Make sure your Google Client ID matches in both backend and frontend"
);
console.log("   4. Check Google Console for proper OAuth setup");

console.log("\n✨ Setup test complete!");
console.log(
  "   If everything looks good, you can start your server with: npm run dev"
);
