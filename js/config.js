/**
 * Configuration file for Star Topology Network Simulator
 * Contains all global constants, state variables, and configuration settings
 */

// Visual color constants for network components
const HUB_ACTIVE = "#1565C0";
const HUB_INACTIVE = "#E53935";
const NODE_ACTIVE = "#4CAF50";
const NODE_INACTIVE = "#E53935";
const EDGE_ACTIVE = "#00ff88";
const EDGE_INACTIVE = "#ff6b6b";
const PACKET_COLOR = "#FFEB3B";
const PACKET_SPEED = 750;

// IP address assignments for network components
const ipConfigurations = {
  hub: "192.168.1.1",
  node1: "192.168.1.2",
  node2: "192.168.1.3",
  node3: "192.168.1.4",
  node4: "192.168.1.5",
  node5: "192.168.1.6",
  node6: "192.168.1.7",
};

// Core network state tracking
let data;                          // vis.js dataset for network visualization
let network;                       // vis.js network instance
let hubActive = true;              // Central switch state
let nodeStatus = {};               // Individual node active/inactive states
let blinkInterval;                 // Timer for visual edge blinking effect
let isAnimatingPacket = false;     // Prevents concurrent packet animations
let autoSimulateInterval = null;   // Timer for automatic packet generation
let packetElements = [];           // Visual packet DOM elements
let packetLogEntries = [];         // Log entries for packet history
let nodeCount = 6;                 // Current number of nodes in topology
let trafficData = {};              // Traffic statistics per node
let lastBroadcastTime = 0;         // Prevents broadcast spam

// Advanced simulation features
let packetQueue = [];              // Queue for processing multiple packets
let currentLatency = 0;            // Simulated network latency (ms)
let currentPacketSize = 64;        // Packet size for simulations (bytes)
let enableCollisions = true;       // Collision detection toggle
let activePackets = [];            // Currently transmitting packets
let collisionCount = 0;            // Total collision counter

// Performance testing metrics
let loadTestMetrics = {
  packetsSent: 0,
  packetsDelivered: 0,
  collisions: 0,
  deliveryTimes: [],
  startTime: 0
};