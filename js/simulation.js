/**
 * Simulation Control Module
 * Handles automatic packet simulation and load testing functionality
 */

/**
 * Initiates or stops the automatic simulation of packet transmissions
 * Toggles between manual and automatic packet generation modes
 */
function autoSimulate() {
  const button = document.getElementById("autoSimulate");
  if (autoSimulateInterval) {
    // Stop auto simulation
    clearInterval(autoSimulateInterval);
    autoSimulateInterval = null;
    button.textContent = "Auto Simulate";
    addLogEntry("Auto simulation stopped", "info");
  } else {
    // Start auto simulation
    button.textContent = "Stop Auto Simulate";
    addLogEntry("Auto simulation started", "info");
    runOneSimulation(); // Run first simulation immediately
    autoSimulateInterval = setInterval(runOneSimulation, PACKET_SPEED * 3 + currentLatency * 2);
  }
}

/**
 * Runs a single step of the automatic simulation
 * Randomly selects source/target nodes and packet type (unicast/broadcast)
 */
function runOneSimulation() {
  if (isAnimatingPacket) return;

  // Get list of active nodes for simulation
  const activeNodes = [];
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    if (nodeStatus[nodeId] && hubActive && data.nodes.get(nodeId)) {
      activeNodes.push(nodeId);
    }
  }

  if (activeNodes.length < 2) {
    addLogEntry("Auto Sim: Need at least 2 active nodes.", "error");
    return;
  }

  // Randomly choose between unicast and broadcast (30% chance of broadcast)
  const shouldBroadcast = Math.random() < 0.3;
  const source = activeNodes[Math.floor(Math.random() * activeNodes.length)];

  if (shouldBroadcast) {
    broadcastPacket(source);
  } else {
    let target;
    do {
      target = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    } while (source === target);
    sendPacketWithRetry(source, target);
  }
}

/**
 * Runs a comprehensive load test by sending multiple packets
 * Tests network performance under high traffic conditions
 */
function runLoadTest() {
  if (isAnimatingPacket) {
    addLogEntry("Cannot start load test: Animation in progress.", "error");
    return;
  }

  const numPackets = parseInt(document.getElementById('loadTestPackets').value);
  
  // Validate active nodes for load testing
  const activeNodes = [];
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    if (nodeStatus[nodeId] && hubActive && data.nodes.get(nodeId)) {
      activeNodes.push(nodeId);
    }
  }

  if (activeNodes.length < 2) {
    addLogEntry("Load Test: Requires at least 2 active nodes.", "error");
    return;
  }

  // Reset metrics for the new test
  loadTestMetrics = {
    packetsSent: 0,
    packetsDelivered: 0,
    collisions: 0,
    deliveryTimes: [],
    startTime: Date.now()
  };
  document.getElementById('loadTestResults').style.display = 'block';
  updateLoadTestMetrics();

  // Generate and queue packets for load test
  for (let i = 0; i < numPackets; i++) {
    let source, target;
    do {
      source = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      target = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    } while (source === target);
    
    const packetData = {
      id: 'loadtest-' + Date.now() + '-' + i + Math.random().toString(36).substr(2, 5),
      source: source,
      target: target,
      size: currentPacketSize,
      creationTime: Date.now() + (i * (50 + currentLatency/2)) // Stagger packet creation
    };
    
    packetQueue.push(packetData);
    loadTestMetrics.packetsSent++;
  }
  
  updateLoadTestMetrics();
  addLogEntry(`Load test started: ${numPackets} packets queued.`, "info");
  processPacketQueue(); // Start processing the queued packets
}