/**
 * Updates the text of the theme toggle button based on the current theme.
 */
function updateThemeToggleText() {
  const button = document.getElementById("themeToggle");
  if (document.body.classList.contains("dark-theme")) {
    button.textContent = "☀️ Light Theme";
  } else {
    button.textContent = "🌙 Dracula Theme";
  }
}

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
    statusEl.innerHTML = 'Hub is <span class="inactive-connection">OFF</span> - All connections inactive';
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

/**
 * Runs a demonstration sequence showcasing the simulator's features.
 */
function runDemoSequence() {
  addLogEntry("Starting demonstration sequence...", "info");
  let delay = 1000;

  const sequence = [
    () => {
      document.getElementById("sourceNode").value = "node1";
      document.getElementById("targetNode").value = "node3";
      addLogEntry("Demo: Sending a packet from PC 1 to PC 3", "info");
      sendPacket(); // Assumes sendPacket uses selected values
    },
    () => {
      addLogEntry("Demo: Simulating a node failure (PC 4)", "info");
      toggleNode("node4");
    },
    () => {
      document.getElementById("sourceNode").value = "node2";
      document.getElementById("targetNode").value = "node4";
      addLogEntry("Demo: Attempting to send to an inactive node (PC 4)", "info");
      sendPacket();
    },
    () => {
      addLogEntry("Demo: Restoring PC 4", "info");
      toggleNode("node4"); // Restore PC4
    },
    () => {
      document.getElementById("sourceNode").value = "node5";
      document.querySelector('input[name="packetMode"][value="broadcast"]').checked = true;
      addLogEntry("Demo: Demonstrating broadcast capability from PC 5", "info");
      sendPacket();
    },
    () => {
      addLogEntry("Demo: Simulating hub failure", "info");
      toggleHub();
    },
    () => {
      document.getElementById("sourceNode").value = "node1";
      document.getElementById("targetNode").value = "node2";
      document.querySelector('input[name="packetMode"][value="unicast"]').checked = true;
      addLogEntry("Demo: Attempting transmission with inactive hub", "info");
      sendPacket();
    },
    () => {
      addLogEntry("Demo: Restoring network to normal operation", "info");
      resetAll();
    },
    () => {
      addLogEntry("Demo: Running network load test (10 packets)", "info");
      document.getElementById('loadTestPackets').value = 10;
      document.getElementById('loadTestPacketsValue').textContent = 10;
      runLoadTest();
    },
    () => {
      addLogEntry("Demo sequence completed. Explore further!", "info");
    }
  ];

  sequence.forEach((action, index) => {
    setTimeout(action, delay * (index + 1) * (index > 4 ? 1.5 : 1) ); // Increase delay for later actions
  });
} 