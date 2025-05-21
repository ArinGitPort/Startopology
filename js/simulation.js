/**
 * Initiates or stops the automatic simulation of packet transmissions.
 */
function autoSimulate() {
  const button = document.getElementById("autoSimulate");
  if (autoSimulateInterval) {
    clearInterval(autoSimulateInterval);
    autoSimulateInterval = null;
    button.textContent = "Auto Simulate";
    addLogEntry("Auto simulation stopped", "info");
  } else {
    button.textContent = "Stop Auto Simulate";
    addLogEntry("Auto simulation started", "info");
    runOneSimulation(); // Run first simulation immediately
    autoSimulateInterval = setInterval(runOneSimulation, PACKET_SPEED * 3 + currentLatency * 2); // Adjust interval based on speed and latency
  }
}

/**
 * Runs a single step of the automatic simulation, sending a random packet.
 */
function runOneSimulation() {
  if (isAnimatingPacket) return;

  const activeNodes = [];
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    if (nodeStatus[nodeId] && hubActive && data.nodes.get(nodeId)) { // Ensure node exists in graph
      activeNodes.push(nodeId);
    }
  }

  if (activeNodes.length < 2) {
    addLogEntry("Auto Sim: Need at least 2 active nodes.", "error");
    // Optionally stop autoSimulate if conditions are not met
    // if (autoSimulateInterval) { autoSimulate(); } 
    return;
  }

  const shouldBroadcast = Math.random() < 0.3; // 30% chance of broadcast
  const source = activeNodes[Math.floor(Math.random() * activeNodes.length)];

  if (shouldBroadcast) {
    broadcastPacket(source);
  } else {
    let target;
    do {
      target = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    } while (source === target);
    sendPacketWithRetry(source, target); // Use retry for robustness in auto-sim
  }
}

/**
 * Runs a load test by sending a specified number of packets.
 */
function runLoadTest() {
  if (isAnimatingPacket) {
    addLogEntry("Cannot start load test: Animation in progress.", "error");
    return;
  }

  const numPackets = parseInt(document.getElementById('loadTestPackets').value);
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
    startTime: Date.now() // Record start time of the test
  };
  document.getElementById('loadTestResults').style.display = 'block';
  updateLoadTestMetrics();

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
      creationTime: Date.now() + (i * (50 + currentLatency/2)) // Stagger packet creation slightly, considering latency
    };
    
    packetQueue.push(packetData);
    loadTestMetrics.packetsSent++;
  }
  updateLoadTestMetrics(); // Update sent count
  addLogEntry(`Load test started: ${numPackets} packets queued.`, "info");
  processPacketQueue(); // Start processing the queued packets
} 