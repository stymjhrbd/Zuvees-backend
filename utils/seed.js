import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Product from "../models/Product.js";
import ApprovedEmail from "../models/ApprovedEmail.js";

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      ApprovedEmail.deleteMany({}),
    ]);
    console.log("Cleared existing data");

    // Create approved emails
    const approvedEmails = [
      {
        email: "satyamjharbade785@gmail.com",
        role: "admin",
        notes: "Main administrator",
      },
      {
        email: "abhishek@zuvees.ae",
        role: "admin",
        notes: "Main administrator",
      },
      { email: "jharbadesatyam@gmail.com", role: "rider", notes: "Rider 1" },
      { email: "satyamjhrbd@gmail.com", role: "rider", notes: "Rider 2" },
      { email: "abhishek@zuvees.com", role: "rider", notes: "Rider 3" },
      {
        email: "abhi.daiya@gmail.com",
        role: "customer",
        notes: "Test customer 1",
      },
      {
        email: "customer3@gaming.com",
        role: "customer",
        notes: "Test customer 2",
      },
    ];

    await ApprovedEmail.insertMany(approvedEmails);
    console.log("Created approved emails");

    // Create users
    const users = [
      {
        email: "satyamjharbade785@gmail.com",
        name: "Admin User",
        role: "admin",
        phone: "+1234567890",
        address: {
          street: "123 Admin St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
        },
      },
      {
        email: "rider1@gaming.com",
        name: "John Rider",
        role: "rider",
        phone: "+1234567891",
        address: {
          street: "456 Delivery Ave",
          city: "New York",
          state: "NY",
          zipCode: "10002",
        },
      },
      {
        email: "rider2@gaming.com",
        name: "Jane Rider",
        role: "rider",
        phone: "+1234567892",
        address: {
          street: "789 Express Blvd",
          city: "New York",
          state: "NY",
          zipCode: "10003",
        },
      },
    ];

    await User.insertMany(users);
    console.log("Created users");

    // Create products
    const products = [
      {
        name: "PlayStation 5",
        description:
          "Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio, and an all-new generation of incredible PlayStation games.",
        category: "consoles",
        brand: "Sony",
        basePrice: 499.99,
        images: [
          "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800",
          "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800",
        ],
        features: [
          "Ultra-high speed SSD",
          "4K-TV gaming",
          "Up to 120fps with 120Hz output",
          "HDR technology",
          "8K output",
          "Tempest 3D AudioTech",
        ],
        specifications: {
          CPU: "8x Zen 2 Cores at 3.5GHz",
          GPU: "10.28 TFLOPs, 36 CUs at 2.23GHz",
          Memory: "16GB GDDR6",
          Storage: "825GB SSD",
          Dimensions: "390mm x 104mm x 260mm",
          Weight: "4.5kg",
        },
        variants: [
          {
            color: "Standard",
            size: "Disc Edition",
            price: 499.99,
            stock: 50,
            sku: "PS5-DISC-STD",
            colorCode: "#FFFFFF",
          },
          {
            color: "Standard",
            size: "Digital Edition",
            price: 399.99,
            stock: 30,
            sku: "PS5-DIGI-STD",
            colorCode: "#FFFFFF",
          },
        ],
        isFeatured: true,
        tags: ["playstation", "console", "gaming", "sony", "ps5"],
      },
      {
        name: "Xbox Series X",
        description:
          "The fastest, most powerful Xbox ever. Play thousands of titles from four generations of consoles—all games look and play best on Xbox Series X.",
        category: "consoles",
        brand: "Microsoft",
        basePrice: 499.99,
        images: [
          "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800",
          "https://images.unsplash.com/photo-1604586376807-f73185cf5867?w=800",
        ],
        features: [
          "12 Teraflops of power",
          "4K gaming at 60FPS",
          "Up to 120FPS",
          "Variable Rate Shading",
          "Ultra-Low Latency",
          "Smart Delivery",
        ],
        specifications: {
          CPU: "8x Cores @ 3.8 GHz",
          GPU: "12 TFLOPS, 52 CUs @1.825 GHz",
          Memory: "16GB GDDR6",
          Storage: "1TB NVMe SSD",
          Dimensions: "151mm x 151mm x 301mm",
          Weight: "4.45kg",
        },
        variants: [
          {
            color: "Black",
            size: "1TB",
            price: 499.99,
            stock: 40,
            sku: "XSX-1TB-BLK",
            colorCode: "#000000",
          },
          {
            color: "White",
            size: "1TB",
            price: 499.99,
            stock: 25,
            sku: "XSX-1TB-WHT",
            colorCode: "#FFFFFF",
          },
        ],
        isFeatured: true,
        tags: ["xbox", "console", "gaming", "microsoft", "series x"],
      },
      {
        name: "DualSense Wireless Controller",
        description:
          "Discover a deeper gaming experience with the innovative PS5 controller, featuring haptic feedback and adaptive triggers.",
        category: "controllers",
        brand: "Sony",
        basePrice: 69.99,
        images: [
          "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800",
          "https://images.unsplash.com/photo-1617096200347-cb04ae810b1d?w=800",
        ],
        features: [
          "Haptic feedback",
          "Adaptive triggers",
          "Built-in microphone",
          "Create button",
          "Motion sensor",
          "USB-C charging",
        ],
        specifications: {
          Connectivity: "Bluetooth 5.1",
          Battery: "1,560mAh",
          Charging: "USB Type-C",
          Weight: "280g",
          Dimensions: "160mm x 66mm x 106mm",
        },
        variants: [
          {
            color: "White",
            size: "Standard",
            price: 69.99,
            stock: 100,
            sku: "DS-CTR-WHT",
            colorCode: "#FFFFFF",
          },
          {
            color: "Midnight Black",
            size: "Standard",
            price: 69.99,
            stock: 80,
            sku: "DS-CTR-BLK",
            colorCode: "#000000",
          },
          {
            color: "Cosmic Red",
            size: "Standard",
            price: 74.99,
            stock: 60,
            sku: "DS-CTR-RED",
            colorCode: "#DC143C",
          },
          {
            color: "Nova Pink",
            size: "Standard",
            price: 74.99,
            stock: 50,
            sku: "DS-CTR-PNK",
            colorCode: "#FF69B4",
          },
        ],
        tags: ["controller", "dualsense", "ps5", "accessories"],
      },
      {
        name: "Pulse 3D Wireless Headset",
        description:
          "Fine-tuned for 3D Audio on PS5 consoles. Enjoy comfortable gaming with refined earpads and headband strap.",
        category: "headsets",
        brand: "Sony",
        basePrice: 99.99,
        images: [
          "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800",
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
        ],
        features: [
          "Fine-tuned for 3D Audio",
          "Dual noise-cancelling microphones",
          "USB-C charging",
          "Up to 12 hours wireless play",
          "Monitor sidetone",
          "Easy-access controls",
        ],
        specifications: {
          Connectivity: "Wireless USB, 3.5mm jack",
          "Battery Life": "Up to 12 hours",
          Charging: "USB Type-C",
          Range: "Up to 10 meters",
          "Frequency Response": "20Hz - 20kHz",
        },
        variants: [
          {
            color: "White",
            size: "Standard",
            price: 99.99,
            stock: 70,
            sku: "P3D-HS-WHT",
            colorCode: "#FFFFFF",
          },
          {
            color: "Midnight Black",
            size: "Standard",
            price: 99.99,
            stock: 65,
            sku: "P3D-HS-BLK",
            colorCode: "#000000",
          },
        ],
        tags: ["headset", "audio", "ps5", "accessories", "wireless"],
      },
      {
        name: "Nintendo Switch OLED",
        description:
          "Meet the newest member of the Nintendo Switch family. Play at home or on the go with a vibrant 7-inch OLED screen.",
        category: "consoles",
        brand: "Nintendo",
        basePrice: 349.99,
        images: [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
          "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800",
        ],
        features: [
          "7-inch OLED screen",
          "Wide adjustable stand",
          "64GB internal storage",
          "Enhanced audio",
          "Wired LAN port",
          "Play anytime, anywhere",
        ],
        specifications: {
          Screen: "7-inch OLED Multi-touch",
          Resolution: "1280 x 720",
          Storage: "64GB internal",
          Battery: "4.5 - 9 hours",
          Weight: "Approx. 420g with Joy-Con",
          Dimensions: "102mm x 242mm x 13.9mm",
        },
        variants: [
          {
            color: "White",
            size: "OLED Model",
            price: 349.99,
            stock: 45,
            sku: "NSW-OLED-WHT",
            colorCode: "#FFFFFF",
          },
          {
            color: "Neon Blue/Red",
            size: "OLED Model",
            price: 349.99,
            stock: 40,
            sku: "NSW-OLED-NEON",
            colorCode: "#0084FF",
          },
        ],
        isFeatured: true,
        tags: ["nintendo", "switch", "console", "portable", "oled"],
      },
      {
        name: "Xbox Wireless Controller",
        description:
          "Experience the modernized design of the Xbox Wireless Controller, featuring sculpted surfaces and refined geometry for enhanced comfort.",
        category: "controllers",
        brand: "Microsoft",
        basePrice: 59.99,
        images: [
          "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800",
          "https://images.unsplash.com/photo-1585195596590-5af79d976bf3?w=800",
        ],
        features: [
          "Textured grip",
          "Hybrid D-pad",
          "Share button",
          "Bluetooth technology",
          "USB-C port",
          "AA batteries",
        ],
        specifications: {
          Connectivity: "Xbox Wireless, Bluetooth",
          Battery: "2 AA batteries",
          Range: "Up to 40 feet",
          Weight: "287g with batteries",
          Compatibility: "Xbox Series X|S, Xbox One, PC, Mobile",
        },
        variants: [
          {
            color: "Carbon Black",
            size: "Standard",
            price: 59.99,
            stock: 90,
            sku: "XWC-STD-BLK",
            colorCode: "#000000",
          },
          {
            color: "Robot White",
            size: "Standard",
            price: 59.99,
            stock: 75,
            sku: "XWC-STD-WHT",
            colorCode: "#FFFFFF",
          },
          {
            color: "Shock Blue",
            size: "Standard",
            price: 64.99,
            stock: 55,
            sku: "XWC-STD-BLU",
            colorCode: "#0066CC",
          },
          {
            color: "Pulse Red",
            size: "Standard",
            price: 64.99,
            stock: 50,
            sku: "XWC-STD-RED",
            colorCode: "#CC0000",
          },
        ],
        tags: ["controller", "xbox", "wireless", "accessories"],
      },
      {
        name: "SteelSeries Arctis 7P Wireless",
        description:
          "Lossless 2.4 GHz wireless audio designed for PlayStation 5 with powerful drivers and award-winning sound.",
        category: "headsets",
        brand: "SteelSeries",
        basePrice: 149.99,
        images: [
          "https://images.unsplash.com/photo-1599669454699-248893623440?w=800",
          "https://images.unsplash.com/photo-1583305912184-9b5c2c18f2f8?w=800",
        ],
        features: [
          "Lossless 2.4 GHz wireless",
          "24-hour battery life",
          "USB-C charging",
          "Discord-certified ClearCast mic",
          "Steel-reinforced headband",
          "AirWeave ear cushions",
        ],
        specifications: {
          Connectivity: "2.4 GHz wireless, 3.5mm",
          "Battery Life": "24 hours",
          "Frequency Response": "20–20,000 Hz",
          Microphone: "Retractable, Bidirectional",
          Weight: "353g",
        },
        variants: [
          {
            color: "Black",
            size: "Standard",
            price: 149.99,
            stock: 35,
            sku: "SS-A7P-BLK",
            colorCode: "#000000",
          },
          {
            color: "White",
            size: "Standard",
            price: 149.99,
            stock: 30,
            sku: "SS-A7P-WHT",
            colorCode: "#FFFFFF",
          },
        ],
        tags: ["headset", "steelseries", "wireless", "gaming", "ps5"],
      },
      {
        name: "Razer DeathAdder V3 Pro",
        description:
          "Ultra-lightweight ergonomic esports mouse with 30K DPI sensor and 70-hour battery life.",
        category: "accessories",
        brand: "Razer",
        basePrice: 149.99,
        images: [
          "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800",
          "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800",
        ],
        features: [
          "Focus Pro 30K Optical Sensor",
          "63g ultra-lightweight",
          "90-hour battery life",
          "8K Hz polling rate",
          "Gen-3 optical switches",
          "Pro-level customization",
        ],
        specifications: {
          DPI: "Up to 30,000",
          "Polling Rate": "Up to 8000 Hz",
          Battery: "Up to 90 hours",
          Weight: "63g",
          Connectivity: "Razer HyperSpeed Wireless",
        },
        variants: [
          {
            color: "Black",
            size: "Standard",
            price: 149.99,
            stock: 40,
            sku: "RZ-DAV3-BLK",
            colorCode: "#000000",
          },
          {
            color: "White",
            size: "Standard",
            price: 149.99,
            stock: 35,
            sku: "RZ-DAV3-WHT",
            colorCode: "#FFFFFF",
          },
        ],
        tags: ["mouse", "razer", "gaming", "wireless", "esports"],
      },
      {
        name: "ASUS ROG Strix Go 2.4",
        description:
          "Wireless gaming headset with AI noise-cancelling microphone and Hi-Res Audio certification.",
        category: "headsets",
        brand: "ASUS",
        basePrice: 179.99,
        images: [
          "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800",
          "https://images.unsplash.com/photo-1599669454699-248893623440?w=800",
        ],
        features: [
          "AI noise-cancelling microphone",
          "Hi-Res Audio certified",
          "Low-latency 2.4GHz wireless",
          "25-hour battery life",
          "USB-C fast charging",
          "Foldable design",
        ],
        specifications: {
          Connectivity: "2.4GHz wireless, 3.5mm, USB-C",
          "Battery Life": "Up to 25 hours",
          Drivers: "40mm ASUS Essence",
          "Frequency Response": "20Hz–40kHz",
          Weight: "290g",
        },
        variants: [
          {
            color: "Black",
            size: "Standard",
            price: 179.99,
            stock: 25,
            sku: "ROG-STX-BLK",
            colorCode: "#000000",
          },
          {
            color: "Pink",
            size: "Standard",
            price: 184.99,
            stock: 20,
            sku: "ROG-STX-PNK",
            colorCode: "#FFC0CB",
          },
        ],
        tags: ["headset", "asus", "rog", "wireless", "gaming"],
      },
      {
        name: "Logitech G Pro X Superlight",
        description:
          "Ultra-lightweight wireless gaming mouse weighing just 63 grams with HERO 25K sensor.",
        category: "accessories",
        brand: "Logitech",
        basePrice: 159.99,
        images: [
          "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800",
          "https://images.unsplash.com/photo-1623820919239-0d0ff10797a1?w=800",
        ],
        features: [
          "HERO 25K sensor",
          "63g ultra-lightweight",
          "70-hour battery life",
          "LIGHTSPEED wireless",
          "Zero additive PTFE feet",
          "Pro-grade performance",
        ],
        specifications: {
          DPI: "Up to 25,600",
          "Report Rate": "1000Hz",
          Battery: "Up to 70 hours",
          Weight: "63g",
          Connectivity: "LIGHTSPEED Wireless",
        },
        variants: [
          {
            color: "Black",
            size: "Standard",
            price: 159.99,
            stock: 45,
            sku: "LG-GPXS-BLK",
            colorCode: "#000000",
          },
          {
            color: "White",
            size: "Standard",
            price: 159.99,
            stock: 40,
            sku: "LG-GPXS-WHT",
            colorCode: "#FFFFFF",
          },
          {
            color: "Pink",
            size: "Standard",
            price: 164.99,
            stock: 30,
            sku: "LG-GPXS-PNK",
            colorCode: "#FFB6C1",
          },
        ],
        tags: ["mouse", "logitech", "gaming", "wireless", "pro"],
      },
      {
        name: "Nintendo Pro Controller",
        description:
          "Take your game sessions up a notch with the Pro Controller for Nintendo Switch.",
        category: "controllers",
        brand: "Nintendo",
        basePrice: 69.99,
        images: [
          "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800",
          "https://images.unsplash.com/photo-1617096200347-cb04ae810b1d?w=800",
        ],
        features: [
          "Traditional button layout",
          "Motion controls",
          "HD rumble",
          "Amiibo functionality",
          "40-hour battery life",
          "USB-C charging",
        ],
        specifications: {
          Connectivity: "Bluetooth 3.0, NFC",
          Battery: "CTR-003, 40 hours",
          Charging: "USB Type-C",
          Weight: "246g",
          Compatibility: "Nintendo Switch",
        },
        variants: [
          {
            color: "Black",
            size: "Standard",
            price: 69.99,
            stock: 60,
            sku: "NIN-PRO-BLK",
            colorCode: "#000000",
          },
          {
            color: "Splatoon Edition",
            size: "Standard",
            price: 74.99,
            stock: 35,
            sku: "NIN-PRO-SPL",
            colorCode: "#FF1493",
          },
          {
            color: "Xenoblade Edition",
            size: "Standard",
            price: 74.99,
            stock: 25,
            sku: "NIN-PRO-XEN",
            colorCode: "#FF0000",
          },
        ],
        tags: ["controller", "nintendo", "switch", "pro", "accessories"],
      },
      {
        name: "Elgato HD60 X",
        description:
          "External capture card for streaming and recording gameplay in 1080p60 HDR10 or 4K30.",
        category: "accessories",
        brand: "Elgato",
        basePrice: 199.99,
        images: [
          "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800",
          "https://images.unsplash.com/photo-1593152167544-085d3b9c4938?w=800",
        ],
        features: [
          "4K30 or 1080p60 HDR10 capture",
          "VRR support",
          "USB 3.0 connectivity",
          "Zero-lag passthrough",
          "Compatible with all platforms",
          "Stream to any platform",
        ],
        specifications: {
          Input: "HDMI (unencrypted)",
          Output: "HDMI (lag-free passthrough)",
          "Capture Resolution": "Up to 2160p30, 1080p60",
          Interface: "USB 3.0",
          Dimensions: "112 x 75 x 19mm",
        },
        variants: [
          {
            color: "Black",
            size: "Standard",
            price: 199.99,
            stock: 30,
            sku: "ELG-HD60X-BLK",
            colorCode: "#000000",
          },
        ],
        tags: [
          "capture card",
          "elgato",
          "streaming",
          "accessories",
          "content creation",
        ],
      },
      {
        name: "Razer BlackWidow V3",
        description:
          "Mechanical gaming keyboard with Razer Green switches and Chroma RGB lighting.",
        category: "accessories",
        brand: "Razer",
        basePrice: 139.99,
        images: [
          "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800",
          "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800",
        ],
        features: [
          "Razer Green mechanical switches",
          "Chroma RGB lighting",
          "Doubleshot ABS keycaps",
          "Ergonomic wrist rest",
          "Multi-function digital dial",
          "USB passthrough",
        ],
        specifications: {
          "Switch Type": "Razer Green (Clicky)",
          "Key Layout": "Full size",
          Backlighting: "Per-key RGB",
          Connection: "USB-C to USB-A",
          Dimensions: "451 x 154 x 42mm",
        },
        variants: [
          {
            color: "Black",
            size: "Green Switch",
            price: 139.99,
            stock: 40,
            sku: "RZ-BW3-GRN",
            colorCode: "#000000",
          },
          {
            color: "Black",
            size: "Yellow Switch",
            price: 139.99,
            stock: 35,
            sku: "RZ-BW3-YLW",
            colorCode: "#000000",
          },
          {
            color: "Mercury White",
            size: "Green Switch",
            price: 149.99,
            stock: 25,
            sku: "RZ-BW3-WHT",
            colorCode: "#FFFFFF",
          },
        ],
        tags: ["keyboard", "razer", "mechanical", "gaming", "rgb"],
      },
      {
        name: "SCUF Instinct Pro",
        description:
          "Elite wireless controller for Xbox with four remappable paddles and adjustable triggers.",
        category: "controllers",
        brand: "SCUF",
        basePrice: 219.99,
        images: [
          "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800",
          "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800",
        ],
        features: [
          "Four remappable paddles",
          "Adjustable instant triggers",
          "High-performance grip",
          "Interchangeable thumbsticks",
          "Profile switching",
          "Built-in rechargeable battery",
        ],
        specifications: {
          Connectivity: "Xbox Wireless, Bluetooth, USB-C",
          Battery: "Built-in rechargeable, 30 hours",
          Paddles: "4 removable",
          Weight: "305g",
          Compatibility: "Xbox Series X|S, Xbox One, PC",
        },
        variants: [
          {
            color: "Black",
            size: "Standard",
            price: 219.99,
            stock: 20,
            sku: "SCUF-INS-BLK",
            colorCode: "#000000",
          },
          {
            color: "White",
            size: "Standard",
            price: 219.99,
            stock: 15,
            sku: "SCUF-INS-WHT",
            colorCode: "#FFFFFF",
          },
          {
            color: "Steel Gray",
            size: "Standard",
            price: 229.99,
            stock: 12,
            sku: "SCUF-INS-GRY",
            colorCode: "#71797E",
          },
        ],
        tags: ["controller", "scuf", "xbox", "elite", "pro"],
      },
      {
        name: "Blue Yeti X",
        description:
          "Professional USB microphone for gaming, streaming and podcasting with real-time LED metering.",
        category: "accessories",
        brand: "Blue",
        basePrice: 169.99,
        images: [
          "https://images.unsplash.com/photo-1590146758445-2f0b65d21b17?w=800",
          "https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?w=800",
        ],
        features: [
          "Four-capsule condenser array",
          "Real-time LED metering",
          "Multi-function smart knob",
          "Blue VO!CE effects",
          "Four pickup patterns",
          "USB connectivity",
        ],
        specifications: {
          Capsules: "14mm condenser (x4)",
          "Polar Patterns": "Cardioid, Omni, Bidirectional, Stereo",
          "Frequency Response": "20Hz - 20kHz",
          Connectivity: "USB Type-A",
          Dimensions: "110mm x 122mm x 289mm",
        },
        variants: [
          {
            color: "Blackout",
            size: "Standard",
            price: 169.99,
            stock: 35,
            sku: "BLU-YETIX-BLK",
            colorCode: "#000000",
          },
          {
            color: "Professional",
            size: "Standard",
            price: 174.99,
            stock: 25,
            sku: "BLU-YETIX-PRO",
            colorCode: "#C0C0C0",
          },
        ],
        tags: ["microphone", "blue", "streaming", "podcast", "accessories"],
      },
      {
        name: "Samsung Odyssey G9",
        description:
          "Curved gaming monitor with 49-inch display, 240Hz refresh rate and 1ms response time.",
        category: "accessories",
        brand: "Samsung",
        basePrice: 1299.99,
        images: [
          "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
          "https://images.unsplash.com/photo-1598057076865-c67fefd248d3?w=800",
        ],
        features: [
          '49" curved display',
          "240Hz refresh rate",
          "1ms response time",
          "QLED technology",
          "G-Sync & FreeSync Premium Pro",
          "HDR1000",
        ],
        specifications: {
          Size: "49 inches",
          Resolution: "5120 x 1440",
          "Refresh Rate": "240Hz",
          "Response Time": "1ms",
          "Panel Type": "VA QLED",
          Curve: "1000R",
        },
        variants: [
          {
            color: "Black",
            size: "49 inch",
            price: 1299.99,
            stock: 10,
            sku: "SAM-ODY-G9",
            colorCode: "#000000",
          },
          {
            color: "White",
            size: "49 inch",
            price: 1349.99,
            stock: 8,
            sku: "SAM-ODY-G9W",
            colorCode: "#FFFFFF",
          },
        ],
        isFeatured: true,
        tags: ["monitor", "samsung", "gaming", "curved", "ultrawide"],
      },
      {
        name: "Corsair K100 RGB",
        description:
          "The pinnacle of Corsair keyboards with AXON processing and optical-mechanical switches.",
        category: "accessories",
        brand: "Corsair",
        basePrice: 229.99,
        images: [
          "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800",
          "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800",
        ],
        features: [
          "AXON Hyper-Processing",
          "OPX optical-mechanical switches",
          "Per-key RGB lighting",
          "Elgato Stream Deck integration",
          "Magnetic detachable wrist rest",
          "iCUE control wheel",
        ],
        specifications: {
          "Switch Type": "Corsair OPX Optical",
          "Polling Rate": "4,000Hz",
          "Key Rollover": "Full N-Key",
          Backlighting: "44-zone RGB",
          Memory: "8MB onboard",
        },
        variants: [
          {
            color: "Black",
            size: "OPX Switch",
            price: 229.99,
            stock: 25,
            sku: "COR-K100-OPX",
            colorCode: "#000000",
          },
          {
            color: "Black",
            size: "Cherry MX Speed",
            price: 219.99,
            stock: 20,
            sku: "COR-K100-CHR",
            colorCode: "#000000",
          },
        ],
        tags: ["keyboard", "corsair", "mechanical", "gaming", "rgb", "premium"],
      },
    ];

    await Product.insertMany(products);
    console.log("Created products");

    console.log("Seed data created successfully!");
    console.log("\nTest accounts:");
    console.log(`Admin: ${users[0].email}`);
    console.log(`Riders: rider1@gaming.com, rider2@gaming.com`);
    console.log(`Customers: customer1@gaming.com, customer2@gaming.com`);
    console.log(
      "\nUse Google Sign-In with these emails to access the platform."
    );

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
