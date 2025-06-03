/**
 * Updates the source and target node dropdown selectors in the UI.
 */
function updateNodeSelectors() {
  const sourceSelect = document.getElementById("sourceNode");
  const targetSelect = document.getElementById("targetNode");
  
  const sourceVal = sourceSelect.value;
  const targetVal = targetSelect.value;
  
  sourceSelect.innerHTML = '<option value="">Select Source Node</option>';
  targetSelect.innerHTML = '<option value="">Select Target Node</option>';
  
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    const sourceOpt = document.createElement('option');
    sourceOpt.value = nodeId;
    sourceOpt.textContent = `PC ${i}`;
    sourceSelect.appendChild(sourceOpt);
    
    const targetOpt = document.createElement('option');
    targetOpt.value = nodeId;
    targetOpt.textContent = `PC ${i}`;
    targetSelect.appendChild(targetOpt);
  }
  
  if (sourceVal && data.nodes.get(sourceVal)) sourceSelect.value = sourceVal;
  if (targetVal && data.nodes.get(targetVal)) targetSelect.value = targetVal;
}

/**
 * Adds a log entry to the packet log display.
 * @param {string} message - The log message (can contain HTML).
 * @param {string} [type="info"] - The type of log entry (e.g., "info", "error", "source", "target").
 */
function addLogEntry(message, type = "info") {
  const logContainer = document.getElementById("packetLog");
  const time = new Date().toLocaleTimeString();
  
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  
  const timeSpan = document.createElement("div");
  timeSpan.className = "log-time";
  timeSpan.textContent = time;
  
  const messageDiv = document.createElement("div");
  messageDiv.innerHTML = message; // Use innerHTML to allow for styled spans in messages
  
  entry.appendChild(timeSpan);
  entry.appendChild(messageDiv);
  
  packetLogEntries.push(entry);
  if (packetLogEntries.length > 50) {
    packetLogEntries.shift(); // Remove the oldest entry
  }
  
  logContainer.innerHTML = ""; // Clear existing logs
  packetLogEntries.forEach(item => {
    logContainer.appendChild(item); // Add entries back
  });
  
  logContainer.scrollTop = logContainer.scrollHeight; // Scroll to the bottom
}

/**
 * Updates the main status text display based on network state.
 */
function updateStatusText() {
  const statusEl = document.getElementById("status");
  if (!hubActive) {
    statusEl.innerHTML = 'Switch is <span class="inactive-connection">OFF</span> - All connections inactive';
    return;
  }

  const activeNodes = Object.keys(nodeStatus).filter(id => data.nodes.get(id) && nodeStatus[id]).length;
  
  if (activeNodes === nodeCount) {
    statusEl.innerHTML = 'All connections <span class="active-connection">ACTIVE</span>';
  } else if (activeNodes === 0) {
    statusEl.innerHTML = 'All nodes <span class="inactive-connection">INACTIVE</span>';
  } else {
    statusEl.innerHTML = `<span class="active-connection">${activeNodes}</span> active, <span class="inactive-connection">${nodeCount - activeNodes}</span> inactive`;
  }
}

/**
 * Initializes the functionality for collapsible sections in the UI.
 */
function initCollapsibleSections() {
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      this.classList.toggle('expanded');
      const icon = this.querySelector('.toggle-icon');
      icon.textContent = this.classList.contains('expanded') ? '▼' : '▶';
      const content = this.nextElementSibling;
      content.style.display = (content.style.display === 'none' || !content.style.display) ? 'block' : 'none';
    });
  });
}

/**
 * Initializes the control event listeners for configuration sliders (latency, packet size, etc.).
 */
function initConfigControls() {
  const latencySlider = document.getElementById('latencySlider');
  const latencyValue = document.getElementById('latencyValue');
  latencySlider.addEventListener('input', function() {
    currentLatency = parseInt(this.value);
    latencyValue.textContent = currentLatency;
  });
  
  const packetSizeSlider = document.getElementById('packetSizeSlider');
  const packetSizeValue = document.getElementById('packetSizeValue');
  packetSizeSlider.addEventListener('input', function() {
    currentPacketSize = parseInt(this.value);
    packetSizeValue.textContent = currentPacketSize;
  });
  
  const loadTestPacketsSlider = document.getElementById('loadTestPackets');
  const loadTestPacketsValue = document.getElementById('loadTestPacketsValue');
  loadTestPacketsSlider.addEventListener('input', function() {
    loadTestPacketsValue.textContent = this.value;
  });
  
  document.getElementById('runLoadTest').addEventListener('click', runLoadTest);
  
  const enableCollisionsCheckbox = document.getElementById('enableCollisions');
  enableCollisionsCheckbox.addEventListener('change', function() {
    enableCollisions = this.checked;
  });
}

/**
 * Updates the display of load test metrics.
 */
function updateLoadTestMetrics() {
  document.getElementById('metricSent').textContent = loadTestMetrics.packetsSent;
  document.getElementById('metricDelivered').textContent = loadTestMetrics.packetsDelivered;
  document.getElementById('metricCollisions').textContent = loadTestMetrics.collisions;
  
  let avgTime = 0;
  if (loadTestMetrics.deliveryTimes.length > 0) {
    avgTime = loadTestMetrics.deliveryTimes.reduce((sum, time) => sum + time, 0) / 
              loadTestMetrics.deliveryTimes.length;
  }
  document.getElementById('metricTime').textContent = `${Math.round(avgTime)} ms`;
}

/**
 * No-op function since the queue visualization has been removed 
 * but we keep it for backward compatibility with existing code
 */
function updateQueueVisualization() {
    return;
}

// Global variable to track demo state
let isDemoRunning = false;
let demoTimeoutId = null;

/**
 * Stops the currently running demo sequence.
 */
function stopDemoSequence() {
  isDemoRunning = false;
  if (demoTimeoutId) {
    clearTimeout(demoTimeoutId);
    demoTimeoutId = null;
  }
  
  // Reset button text and styling
  const demoButton = document.getElementById("startDemo");
  if (demoButton) {
    demoButton.textContent = "Run Demo Sequence";
    demoButton.classList.remove("stop-mode");
    demoButton.onclick = () => {
      document.getElementById("userGuide").style.display = "none";
      runDemoSequence();
    };
  }
  
  // Reset network state to normal
  resetNetworkToActiveState();
  
  addLogEntry("Demo sequence stopped by user. Network reset to normal state.", "info");
}

/**
 * Resets all network components to their active state.
 */
function resetNetworkToActiveState() {
  // Ensure the switch/hub is active
  if (!hubActive) {
    hubActive = true;
    const hubButton = document.getElementById("toggleHub");
    if (hubButton) {
      hubButton.textContent = "Toggle Switch (ON)";
    }
    addLogEntry("Switch restored to active state.", "info");
  }
  
  // Activate all nodes
  let nodesRestored = 0;
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    if (data.nodes.get(nodeId) && !nodeStatus[nodeId]) {
      nodeStatus[nodeId] = true;
      nodesRestored++;
    }
  }
  
  if (nodesRestored > 0) {
    addLogEntry(`Restored ${nodesRestored} inactive node(s) to active state.`, "info");
  }
  
  // Update the visual representation
  updateVisuals();
  updateStatusText();
  
  // Reset configuration to default values
  const latencySlider = document.getElementById("latencySlider");
  const packetSizeSlider = document.getElementById("packetSizeSlider");
  const latencyValue = document.getElementById("latencyValue");
  const packetSizeValue = document.getElementById("packetSizeValue");
  
  if (latencySlider && latencyValue) {
    latencySlider.value = 0;
    latencyValue.textContent = "0";
    currentLatency = 0;
  }
  
  if (packetSizeSlider && packetSizeValue) {
    packetSizeSlider.value = 64;
    packetSizeValue.textContent = "64";
    currentPacketSize = 64;
  }
  
  addLogEntry("Network configuration reset to default values.", "info");
}

/**
 * Runs a demonstration sequence showcasing the simulator's features.
 */
function runDemoSequence() {
  // Clear any existing animations and reset states
  cleanupPacketElements();
  isAnimatingPacket = false;
  if (autoSimulateInterval) {
    clearInterval(autoSimulateInterval);
    autoSimulateInterval = null;
    document.getElementById("autoSimulate").textContent = "Auto Simulate";
  }
  
  // Set demo running state
  isDemoRunning = true;
    // Update button to stop demo
  const demoButton = document.getElementById("startDemo");
  if (demoButton) {
    demoButton.textContent = "Stop Demo";
    demoButton.classList.add("stop-mode");
    demoButton.onclick = stopDemoSequence;
  }
  
  addLogEntry("Starting demonstration sequence... (User Guide will close)", "info");
  let delay = 2000; // Increased base delay for better observation
  let actionIndex = 0;

  const sequence = [
    // Basic Unicast - Fixed to directly use the core functions without UI handlers
    () => {
      addLogEntry("Demo: Resetting network state.", "info");
      resetAll();
      
      // Update UI selectors to reflect what we're doing
      setTimeout(() => {
        // Make sure dropdowns exist and have options
        if (document.getElementById("sourceNode") && document.getElementById("targetNode")) {
          document.getElementById("sourceNode").value = "node1";
          document.getElementById("targetNode").value = "node3";
          
          if (document.querySelector('input[name="packetMode"]')) {
            document.querySelector('input[name="packetMode"][value="unicast"]').checked = true;
          }
          
          addLogEntry("Demo: Sending a unicast packet from PC 1 to PC 3.", "info");
          
          // Create packet directly instead of using sendPacket() UI handler
          // This avoids dependency on UI elements that might be causing errors
          setTimeout(() => {
            if (canTransmit("node1", "node3")) { // Check if transmission is possible
              const packetData = {
                id: 'demo-' + Date.now(),
                source: "node1",
                target: "node3",
                size: currentPacketSize,
                creationTime: Date.now()
              };
              sendPacketWithData(packetData);
            } else {
              addLogEntry("Demo: Cannot send packet. Check if nodes are active.", "error");
            }
          }, 500);
        } else {
          addLogEntry("Demo: Error accessing UI elements.", "error");
        }
      }, 500);
    },
    // Node failure and send attempt - Simplified and made more robust
    () => {
      if (!nodeStatus["node4"]) {
        addLogEntry("Demo: PC 4 already inactive, activating it first.", "info");
        toggleNode("node4"); // Make it active first
        setTimeout(() => toggleNode("node4"), 300); // Then toggle it back off
      } else {
        addLogEntry("Demo: Simulating node failure (PC 4).", "info");
        toggleNode("node4");
      }
    },
    // More robust approach to sending to inactive node
    () => {
      addLogEntry("Demo: Attempting to send to inactive node (PC 4).", "info");
      // Update UI to reflect what we're simulating
      if (document.getElementById("sourceNode") && document.getElementById("targetNode")) {
        document.getElementById("sourceNode").value = "node2";
        document.getElementById("targetNode").value = "node4";
      }
      
      // Direct call the function without relying on UI handler
      sendPacketWithRetry("node2", "node4", 2); // Use the retry version with 2 attempts
    },
    // Restore node and successful send
    () => {
      addLogEntry("Demo: Restoring PC 4.", "info");
      toggleNode("node4");
      // Wait for node status to update
      setTimeout(() => {
        updateVisuals();
      }, 300);
    },
    () => {
      addLogEntry("Demo: Sending to now active PC 4.", "info");
      // Update UI to reflect what we're demonstrating
      if (document.getElementById("sourceNode") && document.getElementById("targetNode")) {
        document.getElementById("sourceNode").value = "node2";
        document.getElementById("targetNode").value = "node4";
      }
      
      // Direct function call for more reliability
      sendPacketWithData({
        id: 'demo-' + Date.now(),
        source: "node2",
        target: "node4",
        size: currentPacketSize,
        creationTime: Date.now()
      });
    },
    // Broadcast - Simplified to avoid UI dependency
    () => {
      addLogEntry("Demo: Broadcasting from PC 5.", "info");
      // Update UI to reflect what we're doing
      if (document.getElementById("sourceNode")) {
        document.getElementById("sourceNode").value = "node5";
      }
      if (document.querySelector('input[name="packetMode"]')) {
        document.querySelector('input[name="packetMode"][value="broadcast"]').checked = true;
      }
      
      // Direct broadcast call rather than using UI event handler
      setTimeout(() => {
        broadcastPacket("node5");
      }, 500);
    },
    // Hub failure and send attempt - More robust
    () => {
      addLogEntry("Demo: Simulating switch failure.", "info");
      
      // Direct toggle call
      if (hubActive) {
        toggleHub();
        setTimeout(() => {
          updateVisuals();
        }, 300);
      } else {
        addLogEntry("Demo: Switch already inactive, toggling back on first.", "info");
        toggleHub(); // Turn it on
        setTimeout(() => {
          toggleHub(); // Then off again
          updateVisuals();
        }, 500);
      }
    },
    // More robust approach to sending with inactive hub
    () => {
      addLogEntry("Demo: Attempting transmission with inactive switch.", "info");
      // Update UI to reflect what we're demonstrating
      if (document.getElementById("sourceNode") && document.getElementById("targetNode")) {
        document.getElementById("sourceNode").value = "node1";
        document.getElementById("targetNode").value = "node2";
      }
      if (document.querySelector('input[name="packetMode"]')) {
        document.querySelector('input[name="packetMode"][value="unicast"]').checked = true;
      }
      
      // Direct call rather than UI handler
      sendPacketWithRetry("node1", "node2", 1); // Should fail with inactive hub
    },
    // Restore hub and demonstrate latency/packet size
    () => {
      addLogEntry("Demo: Restoring switch.", "info");
      if (!hubActive) {
        toggleHub(); // Turn hub back on if it's off
        setTimeout(() => {
          updateVisuals();
        }, 300);
      } else {
        addLogEntry("Demo: Switch is already active.", "info");
      }
    },
    // More reliable latency and packet size change
    () => {
      try {
        addLogEntry("Demo: Increasing latency (500ms) and packet size (512B).", "info");
        
        // Directly update values without relying on slider UI
        currentLatency = 500;
        currentPacketSize = 512;
        
        // Update UI to match, but don't rely on it for functionality
        const latencySlider = document.getElementById('latencySlider');
        const latencyValue = document.getElementById('latencyValue');
        if (latencySlider && latencyValue) {
          latencySlider.value = "500";
          latencyValue.textContent = "500";
        }
        
        const packetSizeSlider = document.getElementById('packetSizeSlider');
        const packetSizeValue = document.getElementById('packetSizeValue');
        if (packetSizeSlider && packetSizeValue) {
          packetSizeSlider.value = "512";
          packetSizeValue.textContent = "512";
        }
      } catch (e) {
        console.error("Error changing latency/packet size:", e);
        addLogEntry("Demo: Error setting latency/packet size, using defaults.", "error");
      }
    },
    // Send with increased values
    () => {
      addLogEntry("Demo: Sending a larger packet with added latency (PC 1 to PC 6).", "info");
      
      // Update UI to reflect what we're demonstrating
      if (document.getElementById("sourceNode") && document.getElementById("targetNode")) {
        document.getElementById("sourceNode").value = "node1";
        document.getElementById("targetNode").value = "node6";
      }
      
      // Ensure settings were applied
      addLogEntry(`Demo: Packet size: ${currentPacketSize}B, Latency: ${currentLatency}ms`, "info");
      
      // Direct function call for more reliability
      setTimeout(() => {
        if (canTransmit("node1", "node6")) {
          sendPacketWithData({
            id: 'demo-latency-' + Date.now(),
            source: "node1",
            target: "node6",
            size: currentPacketSize,
            creationTime: Date.now()
          });
        } else {
          addLogEntry("Demo: Cannot send packet. Check if nodes are active.", "error");
        }
      }, 500);
    },
    // Reset latency and packet size more reliably
    () => {
      try {
        addLogEntry("Demo: Resetting latency and packet size.", "info");
        
        // Directly update values without relying on slider UI
        currentLatency = 0;
        currentPacketSize = 64;
        
        // Update UI to match
        const latencySlider = document.getElementById('latencySlider');
        const latencyValue = document.getElementById('latencyValue');
        if (latencySlider && latencyValue) {
          latencySlider.value = "0";
          latencyValue.textContent = "0";
        }
        
        const packetSizeSlider = document.getElementById('packetSizeSlider');
        const packetSizeValue = document.getElementById('packetSizeValue');
        if (packetSizeSlider && packetSizeValue) {
          packetSizeSlider.value = "64";
          packetSizeValue.textContent = "64";
        }
      } catch (e) {
        console.error("Error resetting latency/packet size:", e);
        addLogEntry("Demo: Error resetting latency/packet size.", "error");
      }
    },
    // Simulate Collision with improved error handling
    () => {
      try {
        addLogEntry("Demo: Enabling collision detection (if not already).", "info");
        enableCollisions = true;
        
        // Update UI checkbox but don't rely on it
        const collisionsCheckbox = document.getElementById('enableCollisions');
        if (collisionsCheckbox) {
          collisionsCheckbox.checked = true;
        }
        
        addLogEntry("Demo: Ensuring active nodes for collision simulation.", "info");
        // Ensure nodes are active
        resetAll();
        setTimeout(() => {
          addLogEntry("Demo: Attempting to simulate a collision.", "info");
          // Directly call the function
          simulateCollisionOnClick();
        }, 500);
      } catch (e) {
        console.error("Error in collision simulation:", e);
        addLogEntry("Demo: Error simulating collision.", "error");
      }
    },
    // Load Test with better error handling
    () => {
      try {
        addLogEntry("Demo: Running a small network load test (5 packets).", "info");
        
        // Update UI but don't rely on it
        const loadTestInput = document.getElementById('loadTestPackets');
        const loadTestValue = document.getElementById('loadTestPacketsValue');
        if (loadTestInput && loadTestValue) {
          loadTestInput.value = "5";
          loadTestValue.textContent = "5";
        }
        
        // Ensure we have enough active nodes
        let activeNodeCount = 0;
        for (let i = 1; i <= nodeCount; i++) {
          if (nodeStatus[`node${i}`] && hubActive) activeNodeCount++;
        }
        
        if (activeNodeCount < 2) {
          addLogEntry("Demo: Not enough active nodes for load test, activating nodes.", "info");
          resetAll();
          setTimeout(() => runLoadTest(), 500);
        } else {
          runLoadTest();
        }
      } catch (e) {
        console.error("Error running load test:", e);
        addLogEntry("Demo: Error running load test.", "error");
      }
    },
    // Auto Simulation with better error handling 
    () => {
      try {
        addLogEntry("Demo: Starting auto simulation for a few seconds.", "info");
        if (!autoSimulateInterval) {
          // Call directly rather than clicking button
          autoSimulate();
        } else {
          addLogEntry("Demo: Auto simulation was already running.", "info");
        }
      } catch (e) {
        console.error("Error starting auto simulation:", e);
        addLogEntry("Demo: Error starting auto simulation.", "error");
      }
    },
    () => {
      try {
        setTimeout(() => {
          addLogEntry("Demo: Stopping auto simulation.", "info");
          if (autoSimulateInterval) {
            // Call directly rather than clicking button
            autoSimulate();
          } else {
            addLogEntry("Demo: Auto simulation was not running.", "info");
          }
        }, 3000); // Let it run for 3 seconds
      } catch (e) {
        console.error("Error stopping auto simulation:", e);
        addLogEntry("Demo: Error stopping auto simulation.", "error");
      }
    },
    () => {
      addLogEntry("Demo sequence completed. Explore further!", "info");
    }
  ];
  function runNextAction() {
    // Check if demo has been stopped
    if (!isDemoRunning) {
      return;
    }
    
    if (actionIndex < sequence.length) {
      // If an animation is in progress, wait until it completes
      if (isAnimatingPacket && actionIndex > 0 && actionIndex < sequence.length - 1) {
        demoTimeoutId = setTimeout(() => runNextAction(), 1000); // Check again in 1 second
        return;
      }
      
      try {
        sequence[actionIndex]();
        actionIndex++;
        
        // Determine appropriate delay based on action type
        let currentActionDelay = delay;
        const prevAction = String(sequence[actionIndex-1]);
        
        if (prevAction.includes("sendPacket") || 
            prevAction.includes("simulateCollision") ||
            prevAction.includes("broadcastPacket") ||
            prevAction.includes("runLoadTest")) {
          currentActionDelay = delay * 3; // Much longer delay for packet animations
        }
        
        if (prevAction.includes("autoSimulate") && autoSimulateInterval) {
          currentActionDelay = delay * 4; // Let auto-sim run even longer
        }

        demoTimeoutId = setTimeout(runNextAction, currentActionDelay);
      } catch (e) {
        console.error("Error in demo sequence:", e);
        addLogEntry("Demo sequence encountered an error. Continuing to next step.", "error");
        // Try to continue with next action
        actionIndex++;
        demoTimeoutId = setTimeout(runNextAction, delay);
      }    } else {
      // Demo completed - reset state
      isDemoRunning = false;
      demoTimeoutId = null;
      
      // Reset button text and styling
      const demoButton = document.getElementById("startDemo");
      if (demoButton) {
        demoButton.textContent = "Run Demo Sequence";
        demoButton.classList.remove("stop-mode");
        demoButton.onclick = () => {
          document.getElementById("userGuide").style.display = "none";
          runDemoSequence();
        };
      }
      
      // Reset network state to normal after demo completion
      resetNetworkToActiveState();
    }
  }
  // Start the sequence after a brief initial delay
  demoTimeoutId = setTimeout(runNextAction, 1000);
} 