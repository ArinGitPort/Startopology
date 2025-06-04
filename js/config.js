// Network configuration and visual constants
const HUB_ACTIVE = "#1565C0";
const HUB_INACTIVE = "#E53935";
const NODE_ACTIVE = "#4CAF50";
const NODE_INACTIVE = "#E53935";
const PACKET_COLOR = "#FFEB3B";
const PACKET_SPEED = 750;

// Default IP configuration for network nodes
const ipConfigurations = {
  hub: "192.168.1.1",
  node1: "192.168.1.2",
  node2: "192.168.1.3",
  node3: "192.168.1.4",
  node4: "192.168.1.5",
  node5: "192.168.1.6",
  node6: "192.168.1.7",
};

// Core network state management
let data;
let network;
let hubActive = true;
let nodeStatus = {};
let blinkInterval;
let isAnimatingPacket = false;
let autoSimulateInterval = null;
let packetElements = [];
let packetLogEntries = [];
let nodeCount = 6;
let trafficData = {};
let lastBroadcastTime = 0;

// Advanced features state
let packetQueue = [];
let currentLatency = 0;
let currentPacketSize = 64;
let enableCollisions = true;
let activePackets = [];
let collisionCount = 0;

// Load testing metrics
let loadTestMetrics = {
  packetsSent: 0,
  packetsDelivered: 0,
  collisions: 0,
  deliveryTimes: [],
  startTime: 0
};