/**
 * Creates the star network topology with a central hub and peripheral nodes.
 * The hub is placed at the center, with nodes distributed evenly in a circle around it.
 */
function createNetwork() {
  const nodes = [    {
      id: "hub",
      label: "Switch",
      shape: "image",
      image: "switch-hub.png",
      size: 50,
      font: { size: 16, color: "#ffffff" },  // White text for dark theme
      fixed: true,
      x: 0,
      y: 0,
      borderWidth: 6,
      borderWidthSelected: 6,
      color: { border: HUB_ACTIVE, background: "rgba(255,255,255,0.9)" },
      shadow: true,
      shadowColor: "#1565C0", // blue for switch
      shadowSize: 28,
      shadowX: 0,
      shadowY: 0,
    },
  ];

  const edges = [];
  const radius = 300;

  for (let i = 1; i <= nodeCount; i++) {
    const angle = (i - 1) * ((2 * Math.PI) / nodeCount);
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const nodeId = `node${i}`;
    
    // Initialize traffic data for this connection if it doesn't exist
    if (!trafficData[nodeId]) {
      trafficData[nodeId] = {
        packetsSent: 0,
        packetsReceived: 0,
        lastUpdate: Date.now()
      };
    }
    
    // Initialize node status if it doesn't exist
    if (nodeStatus[nodeId] === undefined) {
      nodeStatus[nodeId] = true;
    }
    
    // Get the IP (use existing or generate new)
    const nodeIP = ipConfigurations[nodeId] || generateIP(i);
    
    // Make sure IP is in configurations
    if (!ipConfigurations[nodeId]) {
      ipConfigurations[nodeId] = nodeIP;
    }
      nodes.push({
      id: nodeId,
      label: `PC ${i}`,
      title: `IP: ${nodeIP}`,
      shape: "image",
      image: "desktop.png",
      size: 40,
      font: { size: 14, color: "#ffffff" },  // White text for dark theme
      fixed: true,
      x,
      y,
      borderWidth: 4,
      borderWidthSelected: 4,
      color: { 
        border: nodeStatus[nodeId] ? NODE_ACTIVE : NODE_INACTIVE, 
        background: "rgba(255,255,255,0.7)" 
      },
      shadow: true,
      shadowColor: nodeStatus[nodeId] ? NODE_ACTIVE : NODE_INACTIVE, // green if active, red if inactive
      shadowSize: 20,
      shadowX: 0,
      shadowY: 0,
    });edges.push({
      id: `edge${i}`,
      from: "hub",
      to: nodeId,
      color: { color: EDGE_ACTIVE },
      width: 2,
    });
  }

  // If network already exists, destroy it first
  if (network) {
    network.destroy();
    // Clean up any packet elements
    cleanupPacketElements();
  }

  data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };

  network = new vis.Network(document.getElementById("network"), data, {
    physics: false,
    interaction: {
      dragNodes: false,
      dragView: false,
      zoomView: false,
    },
    autoResize: false, // Prevent auto-resizing
    height: "800px",
    width: "800px",
  });

  network.on("click", (params) => {
    if (params.nodes.length && params.nodes[0] !== "hub") {
      toggleNode(params.nodes[0]);
    }
  });
  
  // Update node selectors in UI
  updateNodeSelectors();
}

/**
 * Updates the visual appearance of nodes and edges based on their current status.
 */
function updateVisuals() {
  // Update hub visual state
  const hubNode = data.nodes.get("hub");
  if (hubActive) {
    hubNode.borderWidth = 4;
    hubNode.borderWidthSelected = 4;
    hubNode.color = { border: HUB_ACTIVE };
    hubNode.shadowColor = HUB_ACTIVE;
  } else {
    hubNode.borderWidth = 4;
    hubNode.borderWidthSelected = 4;
    hubNode.color = { border: HUB_INACTIVE };
    hubNode.shadowColor = HUB_INACTIVE;
  }
  data.nodes.update(hubNode);

  // Update each node's visual state
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    if (!data.nodes.get(nodeId)) continue; // Skip if node doesn't exist
    
    const edgeId = `edge${i}`;
    const active = nodeStatus[nodeId] && hubActive;

    // Update node appearance
    const node = data.nodes.get(nodeId);
    node.borderWidth = 4;
    node.borderWidthSelected = 4;
    node.color = {
      border: nodeStatus[nodeId] ? NODE_ACTIVE : NODE_INACTIVE,
    };
    node.shadowColor = nodeStatus[nodeId] ? NODE_ACTIVE : NODE_INACTIVE;
    data.nodes.update(node);

    // Update edge appearance and incorporate traffic data
    const trafficLevel = getTrafficLevel(nodeId);
    let edgeWidth = 2;
    
    // Adjust edge width based on traffic
    if (trafficLevel === 'medium') edgeWidth = 3;
    if (trafficLevel === 'high') edgeWidth = 4;    data.edges.update({
      id: edgeId,
      color: {
        color: active ? EDGE_ACTIVE : EDGE_INACTIVE,
        opacity: 1,
      },
      width: edgeWidth,
      dashes: !active, // dashes for inactive connections
      title: `Traffic: ${trafficData[nodeId] ? (trafficData[nodeId].packetsSent + trafficData[nodeId].packetsReceived) : 0} packets`
    });
  }

  updateStatusText();

  // Force blinking to restart after updating visuals
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInactiveEdges();
  }
}

/**
 * Makes inactive edges blink to visually indicate their status.
 */
function blinkInactiveEdges() {
  let toggle = false;
  clearInterval(blinkInterval);
  blinkInterval = setInterval(() => {
    for (let i = 1; i <= nodeCount; i++) {
      const nodeId = `node${i}`;
      const edgeId = `edge${i}`;
      
      // Skip if node or edge doesn't exist
      if (!data.nodes.get(nodeId) || !data.edges.get(edgeId)) continue;
      
      const active = nodeStatus[nodeId] && hubActive;

      if (!active) {        // For inactive connections, blink the edges
        data.edges.update({
          id: edgeId,
          color: { color: toggle ? EDGE_INACTIVE : "#FF0000" }, // Dark red to bright red blink
          dashes: true,
          width: toggle ? 2 : 3, // Slightly change width for more visible blinking
        });
      }
    }
    toggle = !toggle;
  }, 500);
}

/**
 * Get traffic level for a node connection
 * @param {string} nodeId 
 * @returns {string} 'low', 'medium', or 'high'
 */
function getTrafficLevel(nodeId) {
  if (!trafficData[nodeId]) return 'low';
  
  const totalPackets = trafficData[nodeId].packetsSent + trafficData[nodeId].packetsReceived;
  const timeSinceStart = (Date.now() - trafficData[nodeId].lastUpdate) / 1000;
  
  // Reset traffic if it's been a while
  if (timeSinceStart > 60) {
    trafficData[nodeId].packetsSent = 0;
    trafficData[nodeId].packetsReceived = 0;
    trafficData[nodeId].lastUpdate = Date.now();
    return 'low';
  }
  
  // Calculate packets per second
  const packetsPerSecond = totalPackets / Math.max(timeSinceStart, 1);
  
  if (packetsPerSecond > 0.5) return 'high';
  if (packetsPerSecond > 0.2) return 'medium';
  return 'low';
} 