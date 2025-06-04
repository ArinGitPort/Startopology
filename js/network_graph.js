// Creates star network topology with central hub
function createNetwork() {
  try {
    const nodes = [
      {
        id: "hub",
        label: "Switch",
        shape: "image",
        image: "switch-hub.png",
        size: 50,
        font: { size: 16, color: "#FFFFFF" },
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
    const radius = 300;

    for (let i = 1; i <= nodeCount; i++) {
      const angle = (i - 1) * ((2 * Math.PI) / nodeCount);
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const nodeId = `node${i}`;
      
      // Initialize data structures for new nodes
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
      
      const nodeIP = ipConfigurations[nodeId] || generateIP(i);
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
        font: { size: 14, color: "#FFFFFF" },
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

      edges.push({
        id: `edge${i}`,
        from: "hub",
        to: nodeId,
        color: { color: "#FF9933" },
        width: 2,
      });
    }

    // Clean up existing network
    if (network) {
      network.destroy();
      cleanupPacketElements();
    }

    data = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges),
    };

    const networkElement = document.getElementById("network");
    if (!networkElement) {
      throw new Error("Network container element not found");
    }

    network = new vis.Network(networkElement, data, {
      physics: false,
      interaction: {
        dragNodes: false,
        dragView: false,
        zoomView: false,
      },
      autoResize: false,
      height: "800px",
      width: "800px",
      background: {
        color: 'rgba(0,0,0,0)'
      }
    });

    network.on("click", (params) => {
      if (params.nodes.length && params.nodes[0] !== "hub") {
        toggleNode(params.nodes[0]);
      }
    });
    
    updateNodeSelectors();  } catch (error) {
    console.error("Error creating network:", error);
    addLogEntry("Failed to create network topology", "error");
  }
}

// Updates visual appearance of nodes and edges based on current status
function updateVisuals() {
  try {
    if (!data || !data.nodes || !data.edges) {
      console.error("Network data not initialized");
      return;
    }

    // Update hub visual state
    const hubNode = data.nodes.get("hub");
    if (!hubNode) {
      console.error("Hub node not found");
      return;
    }

    hubNode.borderWidth = 4;
    hubNode.borderWidthSelected = 4;
    hubNode.color = { border: hubActive ? HUB_ACTIVE : HUB_INACTIVE };
    hubNode.shadowColor = hubActive ? HUB_ACTIVE : HUB_INACTIVE;
    data.nodes.update(hubNode);

    // Update each node's visual state
    for (let i = 1; i <= nodeCount; i++) {
      const nodeId = `node${i}`;
      if (!data.nodes.get(nodeId)) continue;
      
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

      // Update edge appearance with traffic data
      const trafficLevel = getTrafficLevel(nodeId);
      let edgeWidth = 2;
      
      if (trafficLevel === 'medium') edgeWidth = 3;
      if (trafficLevel === 'high') edgeWidth = 4;

      data.edges.update({
        id: edgeId,
        color: {
          color: active ? "#FF9933" : "#E53935",
          opacity: 1,
        },
        width: edgeWidth,
        dashes: !active,
        title: `Traffic: ${trafficData[nodeId] ? (trafficData[nodeId].packetsSent + trafficData[nodeId].packetsReceived) : 0} packets`
      });
    }

    updateStatusText();

    // Restart blinking for inactive edges
    if (blinkInterval) {
      clearInterval(blinkInterval);
      blinkInactiveEdges();
    }
  } catch (error) {
    console.error("Error updating visuals:", error);
  }
}

// Makes inactive edges blink to indicate status
function blinkInactiveEdges() {
  let toggle = false;
  clearInterval(blinkInterval);
  blinkInterval = setInterval(() => {
    try {
      for (let i = 1; i <= nodeCount; i++) {
        const nodeId = `node${i}`;
        const edgeId = `edge${i}`;
        
        if (!data.nodes.get(nodeId) || !data.edges.get(edgeId)) continue;
        
        const active = nodeStatus[nodeId] && hubActive;

        if (!active) {
          data.edges.update({
            id: edgeId,
            color: { color: toggle ? "#E53935" : "#FF0000" },
            dashes: true,
            width: toggle ? 2 : 3,
          });
        }
      }
      toggle = !toggle;
    } catch (error) {
      console.error("Error in blink animation:", error);
      clearInterval(blinkInterval);
    }
  }, 500);
}

// Get traffic level for node connection
function getTrafficLevel(nodeId) {
  if (!trafficData[nodeId]) return 'low';
  
  const totalPackets = trafficData[nodeId].packetsSent + trafficData[nodeId].packetsReceived;
  const timeSinceStart = (Date.now() - trafficData[nodeId].lastUpdate) / 1000;
  
  // Reset traffic if stale
  if (timeSinceStart > 60) {
    trafficData[nodeId].packetsSent = 0;
    trafficData[nodeId].packetsReceived = 0;
    trafficData[nodeId].lastUpdate = Date.now();
    return 'low';
  }
  
  const packetsPerSecond = totalPackets / Math.max(timeSinceStart, 1);
  
  if (packetsPerSecond > 0.5) return 'high';
  if (packetsPerSecond > 0.2) return 'medium';
  return 'low';
}