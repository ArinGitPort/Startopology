/**
 * Main entry point for the Star Topology Simulator.
 * This function is called when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI elements and themes
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.className = savedTheme;
  }
  updateThemeToggleText(); // Ensure button text is correct on load
  
  // Initialize control event listeners
  initConfigControls(); 
  initCollapsibleSections();

  // Create the initial network
  createNetwork(); // This also calls updateVisuals indirectly via updateNodeSelectors
  updateVisuals(); // Explicit call to ensure visuals are up-to-date
  blinkInactiveEdges();
  addLogEntry("Star Topology Simulator initialized. Welcome!", "info");

  // Setup main event listeners for buttons and controls
  document.getElementById("themeToggle").addEventListener("click", function() {
    const bodyClass = document.body.classList;
    if (bodyClass.contains("light-theme")) {
      bodyClass.remove("light-theme");
      bodyClass.add("dark-theme");
      localStorage.setItem('theme', 'dark-theme');
    } else {
      bodyClass.remove("dark-theme");
      bodyClass.add("light-theme");
      localStorage.setItem('theme', 'light-theme');
    }
    updateThemeToggleText();
    updateVisuals(); // Re-render visuals if theme affects network elements
  });

  // User Guide Listeners
  document.getElementById("showGuide").addEventListener("click", () => {
    document.getElementById("userGuide").style.display = "block";
  });
  document.getElementById("closeGuide").addEventListener("click", () => {
    document.getElementById("userGuide").style.display = "none";
  });
  document.getElementById("startDemo").addEventListener("click", runDemoSequence);

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