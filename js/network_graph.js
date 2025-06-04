/**
 * Network Graph Visualization Module
 * Handles creation and visual representation of the star topology network using vis.js
 */

/**
 * Creates the star network topology with central hub and peripheral nodes
 * Positions nodes in a circular pattern around the central switch
 */
function createNetwork() {
  // Define the central switch/hub node with visual properties
  const nodes = [
    {
      id: "hub",
      label: "Switch",
      shape: "image",
      image: "switch-hub.png",
      size: 50,
      font: { size: 16, color: "#ffffff" },
      fixed: true,
      x: 0,
      y: 0,
      borderWidth: 6,
      borderWidthSelected: 6,
      color: { border: HUB_ACTIVE, background: "rgba(255,255,255,0.9)" },
      shadow: true,
      shadowColor: "#1565C0",
      shadowSize: 28,
      shadowX: 0,
      shadowY: 0,
    },
  ];

  const edges = [];
  const radius = 300; // Distance of nodes from center

  // Create peripheral nodes in circular arrangement
  for (let i = 1; i <= nodeCount; i++) {
    const angle = (i - 1) * ((2 * Math.PI) / nodeCount);
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const nodeId = `node${i}`;
    
    // Initialize traffic statistics and node status
    if (!trafficData[nodeId]) {
      trafficData[nodeId] = {
        packetsSent: 0,
        packetsReceived: 0,
        lastUpdate: Date.now()
      };
    }
    
    if (nodeStatus[nodeId] === undefined) {
      nodeStatus[nodeId] = true;
    }
    
    // Assign IP address to node
    const nodeIP = ipConfigurations[nodeId] || generateIP(i);
    if (!ipConfigurations[nodeId]) {
      ipConfigurations[nodeId] = nodeIP;
    }

    // Create peripheral node with visual properties
    nodes.push({
      id: nodeId,
      label: `PC ${i}`,
      title: `IP: ${nodeIP}`,
      shape: "image",
      image: "desktop.png",
      size: 40,
      font: { size: 14, color: "#ffffff" },
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
      shadowColor: nodeStatus[nodeId] ? NODE_ACTIVE : NODE_INACTIVE,
      shadowSize: 20,
      shadowX: 0,
      shadowY: 0,
    });

    // Create connection from hub to each node
    edges.push({
      id: `edge${i}`,
      from: "hub",
      to: nodeId,
      color: { color: EDGE_ACTIVE },
      width: 2,
    });
  }

  // Clean up existing network if present
  if (network) {
    network.destroy();
    cleanupPacketElements();
  }

  // Create new network visualization with vis.js
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
    autoResize: false,
    height: "800px",
    width: "800px",
  });

  // Handle node click events (excluding hub)
  network.on("click", (params) => {
    if (params.nodes.length && params.nodes[0] !== "hub") {
      toggleNode(params.nodes[0]);
    }
  });
  
  updateNodeSelectors();
}

/**
 * Updates visual appearance of all network components based on current state
 * Handles node colors, edge styles, and connection status indicators
 */
function updateVisuals() {
  // Update hub visual representation based on active state
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

  // Update each peripheral node and its connection based on status
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    if (!data.nodes.get(nodeId)) continue;
    
    const edgeId = `edge${i}`;
    const active = nodeStatus[nodeId] && hubActive;

    // Update node appearance based on status
    const node = data.nodes.get(nodeId);
    node.borderWidth = 4;
    node.borderWidthSelected = 4;
    node.color = {
      border: nodeStatus[nodeId] ? NODE_ACTIVE : NODE_INACTIVE,
    };
    node.shadowColor = nodeStatus[nodeId] ? NODE_ACTIVE : NODE_INACTIVE;
    data.nodes.update(node);

    // Update edge appearance with traffic-based width visualization
    const trafficLevel = getTrafficLevel(nodeId);
    let edgeWidth = 2;
    if (trafficLevel === 'medium') edgeWidth = 3;
    if (trafficLevel === 'high') edgeWidth = 4;

    data.edges.update({
      id: edgeId,
      color: {
        color: active ? EDGE_ACTIVE : EDGE_INACTIVE,
        opacity: 1,
      },
      width: edgeWidth,
      dashes: !active,
      title: `Traffic: ${trafficData[nodeId] ? (trafficData[nodeId].packetsSent + trafficData[nodeId].packetsReceived) : 0} packets`
    });
  }

  updateStatusText();

  // Restart blinking animation for inactive edges
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInactiveEdges();
  }
}

/**
 * Animates inactive network connections with blinking effect
 * Provides visual feedback for non-functional connections
 */
function blinkInactiveEdges() {
  let toggle = false;
  clearInterval(blinkInterval);
  blinkInterval = setInterval(() => {
    for (let i = 1; i <= nodeCount; i++) {
      const nodeId = `node${i}`;
      const edgeId = `edge${i}`;
      
      if (!data.nodes.get(nodeId) || !data.edges.get(edgeId)) continue;
      
      const active = nodeStatus[nodeId] && hubActive;

      if (!active) {
        // Animate inactive connections with color and width changes
        data.edges.update({
          id: edgeId,
          color: { color: toggle ? EDGE_INACTIVE : "#FF0000" },
          dashes: true,
          width: toggle ? 2 : 3,
        });
      }
    }
    toggle = !toggle;
  }, 500);
}

/**
 * Calculates traffic intensity level for a node connection
 * Returns traffic level based on packets per second
 */
function getTrafficLevel(nodeId) {
  if (!trafficData[nodeId]) return 'low';
  
  const totalPackets = trafficData[nodeId].packetsSent + trafficData[nodeId].packetsReceived;
  const timeSinceStart = (Date.now() - trafficData[nodeId].lastUpdate) / 1000;
  
  // Reset traffic data if stale (older than 60 seconds)
  if (timeSinceStart > 60) {
    trafficData[nodeId].packetsSent = 0;
    trafficData[nodeId].packetsReceived = 0;
    trafficData[nodeId].lastUpdate = Date.now();
    return 'low';
  }
  
  // Calculate packets per second and determine traffic level
  const packetsPerSecond = totalPackets / Math.max(timeSinceStart, 1);
  
  if (packetsPerSecond > 0.5) return 'high';
  if (packetsPerSecond > 0.2) return 'medium';
  return 'low';
}