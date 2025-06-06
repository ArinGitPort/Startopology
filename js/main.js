/**
 * Main entry point for the Star Topology Simulator.
 * This function is called when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize control event listeners
  initConfigControls(); 
  initCollapsibleSections();
  // Create the initial network
  createNetwork(); // This also calls updateVisuals indirectly via updateNodeSelectors
  updateVisuals(); // Explicit call to ensure visuals are up-to-date
  blinkInactiveEdges();
  addLogEntry("Star Topology Simulator initialized. Welcome!", "info");
  
  // Initialize log count display
  updateLogCount();
  // Setup main event listeners for buttons and controls
  // User Guide Listeners
  document.getElementById("showGuide").addEventListener("click", () => {
    document.getElementById("userGuide").style.display = "block";
  });
  document.getElementById("closeGuide").addEventListener("click", () => {
    document.getElementById("userGuide").style.display = "none";
  });  document.getElementById("startDemo").addEventListener("click", () => {
    console.log("Demo button clicked. isDemoRunning:", isDemoRunning);
    if (isDemoRunning) {
      console.log("Stopping demo sequence");
      stopDemoSequence();
    } else {
      console.log("Starting demo sequence");
      document.getElementById("userGuide").style.display = "none"; // Close the guide
      runDemoSequence();
    }
  });

  // Packet Log Control Listeners
  document.getElementById("clearLogBtn").addEventListener("click", clearPacketLog);

  // Network Control Listeners
  document.getElementById("toggleHub").addEventListener("click", () => {
    toggleHub();
    // blinkInactiveEdges(); // toggleHub calls updateVisuals, which handles blinking
  });
  document.getElementById("resetAll").addEventListener("click", () => {
    resetAll();
    // blinkInactiveEdges(); // resetAll calls updateVisuals
  });
  document.getElementById("addNode").addEventListener("click", addNode);
  document.getElementById("removeNode").addEventListener("click", removeNode);
  document.getElementById("simulateCollisionBtn").addEventListener("click", simulateCollisionOnClick);

  // Packet Control Listeners
  document.getElementById("sendPacket").addEventListener("click", () => {
    const source = document.getElementById("sourceNode").value;
    const target = document.getElementById("targetNode").value;
    const packetMode = document.querySelector('input[name="packetMode"]:checked').value;

    if (isAnimatingPacket) {
      addLogEntry("Cannot send: Animation in progress.", "error");
      return;
    }
    if (!source) {
      addLogEntry("Please select a source node.", "error");
      return;
    }
    if (packetMode === "unicast" && !target) {
      addLogEntry("Please select a target node for unicast.", "error");
      return;
    }
    if (source === target && packetMode === "unicast") {
      addLogEntry("Source and target cannot be the same for unicast.", "error");
      return;
    }

    if (packetMode === "unicast") {
      sendPacketWithRetry(source, target);
    } else if (packetMode === "broadcast") {
      const now = Date.now();
      if (now - lastBroadcastTime < 3000) { // Broadcast spam protection
        addLogEntry("Please wait before sending another broadcast.", "error");
        return;
      }
      lastBroadcastTime = now;
      broadcastPacket(source);
    }
  });
  
  document.getElementById("autoSimulate").addEventListener("click", autoSimulate);
}); 