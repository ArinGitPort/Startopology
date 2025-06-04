// Initiates or stops the automatic simulation of packet transmissions
function autoSimulate() {
  try {
    const button = document.getElementById("autoSimulate");
    if (!button) {
      console.error("Auto simulate button not found");
      return;
    }
    
    if (autoSimulateInterval) {
      clearInterval(autoSimulateInterval);
      autoSimulateInterval = null;
      button.textContent = "Auto Simulate";
      addLogEntry("Auto simulation stopped", "info");
    } else {
      button.textContent = "Stop Auto Simulate";
      addLogEntry("Auto simulation started", "info");
      runOneSimulation(); // Run first simulation immediately
      autoSimulateInterval = setInterval(runOneSimulation, PACKET_SPEED * 3 + currentLatency * 2);
    }
  } catch (error) {
    console.error("Error in auto simulation:", error);
    if (autoSimulateInterval) {
      clearInterval(autoSimulateInterval);
      autoSimulateInterval = null;
    }
  }
}

// Runs a single step of the auto simulation with random packets
function runOneSimulation() {
  try {
    if (isAnimatingPacket) return;

    const activeNodes = [];
    for (let i = 1; i <= nodeCount; i++) {
      const nodeId = `node${i}`;
      if (nodeStatus[nodeId] && hubActive && data && data.nodes && data.nodes.get(nodeId)) {
        activeNodes.push(nodeId);
      }
    }

    if (activeNodes.length < 2) {
      addLogEntry("Auto Sim: Need at least 2 active nodes.", "error");
      return;
    }

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
  } catch (error) {
    console.error("Error in simulation step:", error);
  }
}

// Runs a load test by sending multiple packets
function runLoadTest() {
  try {
    if (isAnimatingPacket) {
      addLogEntry("Cannot start load test: Animation in progress.", "error");
      return;
    }

    const loadTestElement = document.getElementById('loadTestPackets');
    if (!loadTestElement) {
      console.error("Load test packets element not found");
      return;
    }
    
    const numPackets = parseInt(loadTestElement.value) || 10;
    const activeNodes = [];
    
    for (let i = 1; i <= nodeCount; i++) {
      const nodeId = `node${i}`;
      if (nodeStatus[nodeId] && hubActive && data && data.nodes && data.nodes.get(nodeId)) {
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
    
    const resultsElement = document.getElementById('loadTestResults');
    if (resultsElement) {
      resultsElement.style.display = 'block';
    }
    
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
        creationTime: Date.now() + (i * (50 + currentLatency/2))
      };
      
      packetQueue.push(packetData);
      loadTestMetrics.packetsSent++;
    }
    
    updateLoadTestMetrics();
    addLogEntry(`Load test started: ${numPackets} packets queued.`, "info");
    processPacketQueue();
  } catch (error) {
    console.error("Error running load test:", error);
    addLogEntry("Load test failed to start.", "error");
  }
}