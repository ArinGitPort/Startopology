/**
 * Main Application Entry Point
 * Initializes the Star Topology Simulator and sets up all event listeners
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize visual effects and UI components
  initFloatingParticles();
  initConfigControls(); 
  initCollapsibleSections();
  
  // Setup network visualization and initial state
  createNetwork();
  updateVisuals();
  blinkInactiveEdges();
  
  // Initialize logging system
  addLogEntry("Star Topology Simulator initialized. Welcome!", "info");
  updateLogCount();
  
  // User guide modal event handlers
  document.getElementById("showGuide").addEventListener("click", () => {
    document.getElementById("userGuide").style.display = "block";
  });
  document.getElementById("closeGuide").addEventListener("click", () => {
    document.getElementById("userGuide").style.display = "none";
  });
  
  // Demo sequence controls
  document.getElementById("startDemo").addEventListener("click", () => {
    if (isDemoRunning) {
      stopDemoSequence();
    } else {
      document.getElementById("userGuide").style.display = "none";
      runDemoSequence();
    }
  });

  // Log management
  document.getElementById("clearLogBtn").addEventListener("click", clearPacketLog);

  // Network topology controls
  document.getElementById("toggleHub").addEventListener("click", () => {
    toggleHub();
  });
  document.getElementById("resetAll").addEventListener("click", () => {
    resetAll();
  });
  document.getElementById("addNode").addEventListener("click", addNode);
  document.getElementById("removeNode").addEventListener("click", removeNode);
  document.getElementById("simulateCollisionBtn").addEventListener("click", simulateCollisionOnClick);

  // Packet transmission controls and validation
  document.getElementById("sendPacket").addEventListener("click", () => {
    const source = document.getElementById("sourceNode").value;
    const target = document.getElementById("targetNode").value;
    const packetMode = document.querySelector('input[name="packetMode"]:checked').value;

    // Validate transmission parameters
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

    // Execute packet transmission
    if (packetMode === "unicast") {
      sendPacketWithRetry(source, target);
    } else if (packetMode === "broadcast") {
      // Prevent broadcast spam
      const now = Date.now();
      if (now - lastBroadcastTime < 3000) {
        addLogEntry("Please wait before sending another broadcast.", "error");
        return;
      }
      lastBroadcastTime = now;
      broadcastPacket(source);
    }
  });
  
  // Auto simulation toggle
  document.getElementById("autoSimulate").addEventListener("click", autoSimulate);
});

/**
 * Creates animated background particles for visual enhancement
 */
function initFloatingParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 30;
  
  // Create initial particles
  for (let i = 0; i < particleCount; i++) {
    createParticle(particlesContainer, i);
  }
  
  // Maintain particle count with periodic creation
  setInterval(() => {
    if (particlesContainer.children.length < particleCount) {
      createParticle(particlesContainer, Math.random());
    }
  }, 2000);
}

/**
 * Creates individual animated particle element
 */
function createParticle(container, index) {
  const particle = document.createElement('div');
  particle.className = 'particle';
  
  // Randomize particle properties
  const size = Math.random() * 6 + 2;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.animationDelay = `${Math.random() * 20}s`;
  
  // Create occasional horizontal-moving particles
  if (Math.random() > 0.8) {
    particle.classList.add('horizontal');
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.left = '-100px';
  }
  
  container.appendChild(particle);
  
  // Auto-cleanup after animation
  setTimeout(() => {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  }, 35000);
}