/**
 * UI Handlers Module
 * Manages user interface interactions, controls, logging, and demo functionality
 */

/**
 * Updates the source and target node dropdown selectors in the UI
 * Maintains selected values when possible during updates
 */
function updateNodeSelectors() {
  const sourceSelect = document.getElementById("sourceNode");
  const targetSelect = document.getElementById("targetNode");
  
  // Enhanced null safety checks
  if (!sourceSelect) {
    console.error("Source node selector element not found in DOM");
    addLogEntry("Error: Source node selector not available", "error");
    return;
  }
  
  if (!targetSelect) {
    console.error("Target node selector element not found in DOM");
    addLogEntry("Error: Target node selector not available", "error");
    return;
  }
  
  // Store current values before clearing
  const sourceVal = sourceSelect.value;
  const targetVal = targetSelect.value;
  
  try {
    sourceSelect.innerHTML = '<option value="">Select Source Node</option>';
    targetSelect.innerHTML = '<option value="">Select Target Node</option>';
    
    // Populate dropdowns with current nodes
    for (let i = 1; i <= nodeCount; i++) {
      const nodeId = `node${i}`;
      try {
        // Create source option
        const sourceOpt = document.createElement('option');
        if (!sourceOpt) {
          throw new Error(`Failed to create source option for ${nodeId}`);
        }
        sourceOpt.value = nodeId;
        sourceOpt.textContent = `PC ${i}`;
        sourceSelect.appendChild(sourceOpt);
        
        // Create target option
        const targetOpt = document.createElement('option');
        if (!targetOpt) {
          throw new Error(`Failed to create target option for ${nodeId}`);
        }
        targetOpt.value = nodeId;
        targetOpt.textContent = `PC ${i}`;
        targetSelect.appendChild(targetOpt);
      } catch (error) {
        console.error(`Error creating option for node ${nodeId}:`, error);
        addLogEntry(`Failed to create selector option for PC ${i}`, "error");
      }
    }
    
    // Restore previous values if still valid
    try {
      if (sourceVal && data && data.nodes && data.nodes.get(sourceVal)) {
        sourceSelect.value = sourceVal;
      }
      if (targetVal && data && data.nodes && data.nodes.get(targetVal)) {
        targetSelect.value = targetVal;
      }
    } catch (error) {
      console.error("Error restoring selector values:", error);
      addLogEntry("Warning: Could not restore previous selector values", "error");
    }
  } catch (error) {
    console.error("Critical error in updateNodeSelectors:", error);
    addLogEntry("Critical error updating node selectors", "error");
  }
}

/**
 * Adds a log entry to the packet log display with timestamp and styling
 */
function addLogEntry(message, type = "info") {
  const logContainer = document.getElementById("packetLog");
  
  if (!logContainer) {
    console.error("Log container not found");
    return;
  }
  
  try {
    const time = new Date().toLocaleTimeString();
    
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    
    const timeSpan = document.createElement("div");
    timeSpan.className = "log-time";
    timeSpan.textContent = time;
    
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = message; // Allow styled spans in messages
    
    entry.appendChild(timeSpan);
    entry.appendChild(messageDiv);
  
    // Add animation for new entries
    entry.style.opacity = '0';
    entry.style.transform = 'translateY(10px)';
    
    packetLogEntries.push(entry);
    if (packetLogEntries.length > 50) {
      packetLogEntries.shift(); // Remove the oldest entry
    }
    
    logContainer.innerHTML = ""; // Clear existing logs
    packetLogEntries.forEach((item, index) => {
      logContainer.appendChild(item); // Add entries back
      
      // Animate only the newest entry
      if (index === packetLogEntries.length - 1) {
        setTimeout(() => {
          item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, 10);
      }
    });
    
    updateLogCount();
    logContainer.scrollTop = logContainer.scrollHeight; // Scroll to the bottom
  } catch (error) {
    console.error("Error in addLogEntry:", error);
    console.log(`Log Entry [${type}]: ${message}`);
  }
}

/**
 * Updates the log entry count display
 */
function updateLogCount() {
  const logCountElement = document.getElementById("logCount");
  if (logCountElement) {
    const count = packetLogEntries.length;
    logCountElement.textContent = `${count} ${count === 1 ? 'entry' : 'entries'}`;
  }
}

/**
 * Clears all packet log entries
 */
function clearPacketLog() {
  packetLogEntries = [];
  const logContainer = document.getElementById("packetLog");
  if (logContainer) {
    logContainer.innerHTML = "";
  }
  updateLogCount();
  addLogEntry("Packet log cleared", "info");
}

/**
 * Updates the main status text display based on network state
 */
function updateStatusText() {
  const statusEl = document.getElementById("status");
  if (!hubActive) {
    statusEl.innerHTML = 'Switch is <span class="inactive-connection">OFF</span> - All connections inactive';
    return;
  }
  
  // Count active nodes
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
 * Initializes the functionality for collapsible sections in the UI
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
 * Initializes configuration controls with error handling
 */
function initConfigControls() {
  try {
    // Latency slider
    const latencySlider = document.getElementById('latencySlider');
    const latencyValue = document.getElementById('latencyValue');
    
    if (latencySlider && latencyValue) {
      latencySlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (isNaN(value) || value < 0) {
          currentLatency = 0;
          latencyValue.textContent = "0";
          this.value = "0";
        } else {
          currentLatency = value;
          latencyValue.textContent = value.toString();
        }
      });
    }
    
    // Packet size slider
    const packetSizeSlider = document.getElementById('packetSizeSlider');
    const packetSizeValue = document.getElementById('packetSizeValue');
    
    if (packetSizeSlider && packetSizeValue) {
      packetSizeSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (isNaN(value) || value < 1) {
          currentPacketSize = 64;
          packetSizeValue.textContent = "64";
          this.value = "64";
        } else {
          currentPacketSize = value;
          packetSizeValue.textContent = value.toString();
        }
      });
    }
    
    // Load test controls
    const loadTestPacketsSlider = document.getElementById('loadTestPackets');
    const loadTestPacketsValue = document.getElementById('loadTestPacketsValue');
    
    if (loadTestPacketsSlider && loadTestPacketsValue) {
      loadTestPacketsSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (isNaN(value) || value < 1) {
          loadTestPacketsValue.textContent = "1";
          this.value = "1";
        } else {
          loadTestPacketsValue.textContent = value.toString();
        }
      });
    }
    
    const runLoadTestBtn = document.getElementById('runLoadTest');
    if (runLoadTestBtn) {
      runLoadTestBtn.addEventListener('click', () => runLoadTest());
    }
    
    // Collision detection toggle
    const enableCollisionsCheckbox = document.getElementById('enableCollisions');
    if (enableCollisionsCheckbox) {
      enableCollisionsCheckbox.addEventListener('change', function() {
        enableCollisions = this.checked;
      });
    }

  } catch (error) {
    console.error("Error initializing configuration controls:", error);
    addLogEntry("Error initializing configuration controls", "error");
    
    // Set safe defaults
    currentLatency = 0;
    currentPacketSize = 64;
    enableCollisions = true;
  }
}

/**
 * Updates load test metrics display
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
 * Placeholder for queue visualization (removed but kept for compatibility)
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
  console.log("stopDemoSequence called, isDemoRunning:", isDemoRunning);
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
 * Executes demo actions with error handling and recovery
 */
function safeExecuteAction(actionFn, actionName, onError = null) {
  try {
    actionFn();
    return true;
  } catch (error) {
    console.error(`Error in demo action "${actionName}":`, error);
    addLogEntry(`Demo error in ${actionName}: ${error.message}`, "error");
    
    if (onError && typeof onError === 'function') {
      try {
        onError(error);
      } catch (recoveryError) {
        console.error(`Error in recovery function for "${actionName}":`, recoveryError);
      }
    }
    
    return false;
  }
}

/**
 * Runs comprehensive demo sequence showcasing all network features
 */
function runDemoSequence() {
  // Cleanup and reset states
  try {
    cleanupPacketElements();
    isAnimatingPacket = false;
    
    if (autoSimulateInterval) {
      clearInterval(autoSimulateInterval);
      autoSimulateInterval = null;
      const autoBtn = document.getElementById("autoSimulate");
      if (autoBtn) {
        autoBtn.textContent = "Auto Simulate";
      }
    }
  } catch (error) {
    console.error("Error during demo initialization cleanup:", error);
    addLogEntry("Warning: Could not fully cleanup before demo", "error");
  }

  isDemoRunning = true;
  
  // Update button state
  try {
    const demoButton = document.getElementById("startDemo");
    if (demoButton) {
      demoButton.textContent = "Stop Demo";
      demoButton.classList.add("stop-mode");
    }
  } catch (error) {
    console.error("Error updating demo button:", error);
  }
  
  addLogEntry("Starting demonstration sequence...", "info");
  let delay = 2000;
  let actionIndex = 0;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;  // Demo action sequence
  const sequence = [
    {
      name: "Reset Network",
      action: () => {
        resetAll();
        setTimeout(() => {
          if (document.getElementById("sourceNode") && document.getElementById("targetNode")) {
            document.getElementById("sourceNode").value = "node1";
            document.getElementById("targetNode").value = "node3";
          }
        }, 500);
      },
      recovery: () => {
        try {
          resetAll();
        } catch (e) {
          console.error("Recovery failed for network reset:", e);
        }
      }
    },
    {
      name: "Send Unicast Packet", 
      action: () => {
        addLogEntry("Demo: Sending unicast packet from PC 1 to PC 3.", "info");
        setTimeout(() => {
          if (canTransmit("node1", "node3")) {
            sendPacketWithData({
              id: 'demo-unicast-' + Date.now(),
              source: "node1",
              target: "node3", 
              size: currentPacketSize,
              creationTime: Date.now()
            });
          } else {
            addLogEntry("Demo: Cannot send packet - nodes inactive", "error");
          }
        }, 500);
      },
      recovery: () => {
        addLogEntry("Recovery: Skipping unicast packet", "info");
      }
    },
    {
      name: "Node Failure Simulation",
      action: () => {
        addLogEntry("Demo: Simulating node failure (PC 4).", "info");
        if (nodeStatus["node4"]) {
          toggleNode("node4");
        }
      },
      recovery: () => {
        addLogEntry("Recovery: Ensuring PC 4 is inactive", "info");
        if (nodeStatus["node4"]) {
          try {
            toggleNode("node4");
          } catch (e) {
            console.error("Recovery toggle failed:", e);
          }
        }
      }
    },
    {
      name: "Send to Inactive Node",
      action: () => {
        addLogEntry("Demo: Attempting to send to inactive PC 4.", "info");
        sendPacketWithRetry("node2", "node4", 1);
      },
      recovery: () => {
        addLogEntry("Recovery: Skipped send to inactive node", "info");
      }
    },
    {
      name: "Restore Node",
      action: () => {
        addLogEntry("Demo: Restoring PC 4.", "info");
        if (!nodeStatus["node4"]) {
          toggleNode("node4");
        }
        setTimeout(() => updateVisuals(), 300);
      },
      recovery: () => {
        addLogEntry("Recovery: Ensuring PC 4 is active", "info");
        if (!nodeStatus["node4"]) {
          try {
            toggleNode("node4");
            updateVisuals();
          } catch (e) {
            console.error("Recovery restore failed:", e);
          }
        }
      }
    },
    {
      name: "Broadcast Demo",
      action: () => {
        addLogEntry("Demo: Broadcasting from PC 5.", "info");
        if (document.getElementById("sourceNode")) {
          document.getElementById("sourceNode").value = "node5";
        }
        if (document.querySelector('input[name="packetMode"]')) {
          document.querySelector('input[name="packetMode"][value="broadcast"]').checked = true;
        }
        
        setTimeout(() => {
          broadcastPacket("node5");
        }, 500);
      },
      recovery: () => {
        addLogEntry("Recovery: Skipped broadcast demo", "info");
      }
    },
    {
      name: "Switch Failure",
      action: () => {
        addLogEntry("Demo: Simulating switch failure.", "info");
        
        if (hubActive) {
          toggleHub();
          setTimeout(() => {
            updateVisuals();
          }, 300);
        } else {
          toggleHub();
          setTimeout(() => {
            toggleHub();
            updateVisuals();
          }, 500);
        }
      },
      recovery: () => {
        addLogEntry("Recovery: Switch state handled", "info");
      }
    },
    {
      name: "Send with Inactive Switch",
      action: () => {
        addLogEntry("Demo: Attempting transmission with inactive switch.", "info");
        if (document.getElementById("sourceNode") && document.getElementById("targetNode")) {
          document.getElementById("sourceNode").value = "node1";
          document.getElementById("targetNode").value = "node2";
        }
        if (document.querySelector('input[name="packetMode"]')) {
          document.querySelector('input[name="packetMode"][value="unicast"]').checked = true;
        }
        
        sendPacketWithRetry("node1", "node2", 1);
      },
      recovery: () => {
        addLogEntry("Recovery: Skipped inactive switch demo", "info");
      }
    },
    {
      name: "Restore Switch",
      action: () => {
        addLogEntry("Demo: Restoring switch.", "info");
        if (!hubActive) {
          toggleHub();
          setTimeout(() => {
            updateVisuals();
          }, 300);
        }
      },
      recovery: () => {
        if (!hubActive) {
          try {
            toggleHub();
            updateVisuals();
          } catch (e) {
            console.error("Recovery restore switch failed:", e);
          }
        }
      }
    },
    {
      name: "Configure Latency",
      action: () => {
        addLogEntry("Demo: Increasing latency (500ms) and packet size (512B).", "info");
        
        currentLatency = 500;
        currentPacketSize = 512;
        
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
      },
      recovery: () => {
        addLogEntry("Recovery: Using default latency/packet size", "info");
        currentLatency = 0;
        currentPacketSize = 64;
      }
    },
    {
      name: "Send Large Packet",
      action: () => {
        addLogEntry("Demo: Sending a larger packet with added latency (PC 1 to PC 6).", "info");
        
        if (document.getElementById("sourceNode") && document.getElementById("targetNode")) {
          document.getElementById("sourceNode").value = "node1";
          document.getElementById("targetNode").value = "node6";
        }
        
        addLogEntry(`Demo: Packet size: ${currentPacketSize}B, Latency: ${currentLatency}ms`, "info");
        
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
      recovery: () => {
        addLogEntry("Recovery: Skipped large packet demo", "info");
      }
    },
    {
      name: "Reset Configuration",
      action: () => {
        addLogEntry("Demo: Resetting latency and packet size.", "info");
        
        currentLatency = 0;
        currentPacketSize = 64;
        
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
      },
      recovery: () => {
        currentLatency = 0;
        currentPacketSize = 64;
      }
    },
    {
      name: "Collision Simulation",
      action: () => {
        addLogEntry("Demo: Enabling collision detection.", "info");
        enableCollisions = true;
        
        const collisionsCheckbox = document.getElementById('enableCollisions');
        if (collisionsCheckbox) {
          collisionsCheckbox.checked = true;
        }
        
        addLogEntry("Demo: Ensuring active nodes for collision simulation.", "info");
        resetAll();
        setTimeout(() => {
          addLogEntry("Demo: Attempting to simulate a collision.", "info");
          simulateCollisionOnClick();
        }, 500);
      },
      recovery: () => {
        addLogEntry("Recovery: Skipped collision simulation", "info");
      }
    },
    {
      name: "Load Test",
      action: () => {
        addLogEntry("Demo: Running a small network load test (5 packets).", "info");
        
        const loadTestInput = document.getElementById('loadTestPackets');
        const loadTestValue = document.getElementById('loadTestPacketsValue');
        if (loadTestInput && loadTestValue) {
          loadTestInput.value = "5";
          loadTestValue.textContent = "5";
        }
        
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
      },
      recovery: () => {
        addLogEntry("Recovery: Skipped load test", "info");
      }
    },
    {
      name: "Auto Simulation Start",
      action: () => {
        addLogEntry("Demo: Starting auto simulation for a few seconds.", "info");
        if (!autoSimulateInterval) {
          autoSimulate();
        }
      },
      recovery: () => {
        addLogEntry("Recovery: Skipped auto simulation start", "info");
      }
    },
    {
      name: "Auto Simulation Stop",
      action: () => {
        setTimeout(() => {
          addLogEntry("Demo: Stopping auto simulation.", "info");
          if (autoSimulateInterval) {
            autoSimulate();
          }
        }, 3000);
      },
      recovery: () => {
        if (autoSimulateInterval) {
          try {
            autoSimulate();
          } catch (e) {
            console.error("Recovery auto simulation stop failed:", e);
          }
        }
      }
    },
    {
      name: "Demo Complete",
      action: () => {
        addLogEntry("Demo sequence completed. Explore further!", "info");
      },
      recovery: () => {
        addLogEntry("Demo completed with errors", "info");
      }
    }
  ];
  function runNextAction() {
    // Check if demo has been stopped
    if (!isDemoRunning) {
      return;
    }
    
    if (actionIndex < sequence.length) {
      // Check for too many consecutive errors
      if (consecutiveErrors >= maxConsecutiveErrors) {
        addLogEntry(`Demo stopped: too many consecutive errors (${consecutiveErrors})`, "error");
        stopDemoSequence();
        return;
      }

      // Wait for animations to complete
      if (isAnimatingPacket && actionIndex > 0 && actionIndex < sequence.length - 1) {
        demoTimeoutId = setTimeout(() => runNextAction(), 1000);
        return;
      }
      
      const currentStep = sequence[actionIndex];
      const success = safeExecuteAction(
        currentStep.action, 
        currentStep.name, 
        currentStep.recovery
      );
      
      if (success) {
        consecutiveErrors = 0; // Reset error counter on success
      } else {
        consecutiveErrors++;
      }
      
      actionIndex++;
      
      // Determine delay based on action type
      let currentActionDelay = delay;
      if (currentStep.name.includes("Packet") || currentStep.name.includes("Collision")) {
        currentActionDelay = delay * 2;
      }

      demoTimeoutId = setTimeout(runNextAction, currentActionDelay);
      
    } else {
      // Demo completed - reset state
      isDemoRunning = false;
      demoTimeoutId = null;
      consecutiveErrors = 0;
      
      try {
        const demoButton = document.getElementById("startDemo");
        if (demoButton) {
          demoButton.textContent = "Run Demo Sequence";
          demoButton.classList.remove("stop-mode");
        }
        
        resetNetworkToActiveState();
      } catch (error) {
        console.error("Error in demo completion cleanup:", error);
      }
    }
  }
  
  // Start the sequence
  demoTimeoutId = setTimeout(runNextAction, 1000);
}