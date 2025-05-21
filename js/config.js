// Network Configuration Constants
const HUB_ACTIVE = "#1565C0";
const HUB_INACTIVE = "#E53935";
const NODE_ACTIVE = "#4CAF50";
const NODE_INACTIVE = "#E53935";
const PACKET_COLOR = "#FFEB3B";
const PACKET_SPEED = 750; // Base animation speed

// IP Configuration
const ipConfigurations = {
  hub: "192.168.1.1",
  node1: "192.168.1.2",
  node2: "192.168.1.3",
  node3: "192.168.1.4",
  node4: "192.168.1.5",
  node5: "192.168.1.6",
  node6: "192.168.1.7",
};

// Global State Variables
let data; // vis.js DataSet
let network; // vis.js Network instance
let hubActive = true;
let nodeStatus = {}; // e.g., { node1: true, node2: false }
let blinkInterval;
let isAnimatingPacket = false;
let autoSimulateInterval = null;
let packetElements = []; // For visual packet DOM elements
let packetLogEntries = []; // For log display
let nodeCount = 6; // Initial node count
let trafficData = {}; // e.g., { nodeId: { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() } }
let lastBroadcastTime = 0;

// Advanced Feature State Variables
let packetQueue = []; // For processing packets sequentially
let currentLatency = 0; // in ms
let currentPacketSize = 64; // in bytes
let enableCollisions = true;
let activePackets = []; // Packets currently in transit for collision detection
let collisionCount = 0; // Overall collision count

// Load Test Metrics
let loadTestMetrics = {
  packetsSent: 0,
  packetsDelivered: 0,
  collisions: 0,
  deliveryTimes: [],
  startTime: 0
}; 