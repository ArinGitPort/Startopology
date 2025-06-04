// Toggles node active/inactive state
function toggleNode(nodeId) {
  if (!nodeId || !nodeStatus.hasOwnProperty(nodeId)) {
    addLogEntry("Invalid node specified", "error");
    return;
  }
  
  nodeStatus[nodeId] = !nodeStatus[nodeId];
  const status = nodeStatus[nodeId] ? "active" : "inactive";
  addLogEntry(`Node ${nodeId.replace("node", "PC ")} is now <span class="${status}-connection">${status.toUpperCase()}</span>`, "info");
  updateVisuals();
}

// Toggles switch active/inactive state
function toggleHub() {
  hubActive = !hubActive;
  const hubButton = document.getElementById("toggleHub");
  if (hubButton) {
    hubButton.textContent = `Toggle Switch (${hubActive ? "ON" : "OFF"})`;
  }
  const status = hubActive ? "active" : "inactive";
  addLogEntry(`Switch is now <span class="${status}-connection">${status.toUpperCase()}</span>`, hubActive ? "info" : "error");
  updateVisuals();
}

// Resets all nodes and switch to active state
function resetAll() {
  hubActive = true;
  for (let id in nodeStatus) {
    if (data && data.nodes && data.nodes.get(id)) {
      nodeStatus[id] = true;
    }
  }
  
  const hubButton = document.getElementById("toggleHub");
  if (hubButton) {
    hubButton.textContent = "Toggle Switch (ON)";
  }
  addLogEntry("All nodes and switch have been reset to <span class=\"active-connection\">ACTIVE</span>", "info");
  updateVisuals();
}

// Generates IP address for new node
function generateIP(nodeIndex) {
  return `192.168.1.${100 + nodeIndex}`;
}

// Adds a new node to the network
function addNode() {
  try {
    if (isAnimatingPacket) {
      cleanupPacketElements();
      isAnimatingPacket = false;
    }
    
    nodeCount++;
    const newNodeId = `node${nodeCount}`;
    
    nodeStatus[newNodeId] = true;
    trafficData[newNodeId] = {
      packetsSent: 0,
      packetsReceived: 0,
      lastUpdate: Date.now()
    };
    
    if (!ipConfigurations[newNodeId]) {
      ipConfigurations[newNodeId] = generateIP(nodeCount);
    }
    
    createNetwork();
    addLogEntry(`Added new node: PC ${nodeCount} (${ipConfigurations[newNodeId]})`, "info");
  } catch (error) {
    console.error("Error adding node:", error);
    addLogEntry("Failed to add new node", "error");
    nodeCount--;
  }
}

// Removes the last added node from the network
function removeNode() {
  if (nodeCount <= 2) {
    addLogEntry("Cannot remove node: Minimum 2 nodes required", "error");
    return;
  }
  
  try {
    if (isAnimatingPacket) {
      cleanupPacketElements();
      isAnimatingPacket = false;
    }
    
    const removedNodeId = `node${nodeCount}`;
    const removedNodeIP = ipConfigurations[removedNodeId] || `(IP not found for PC ${nodeCount})`;
    addLogEntry(`Removed node: PC ${nodeCount} (${removedNodeIP})`, "info");
    
    delete nodeStatus[removedNodeId];
    delete trafficData[removedNodeId];
    
    nodeCount--;
    createNetwork();
  } catch (error) {
    console.error("Error removing node:", error);
    addLogEntry("Failed to remove node", "error");
  }
}

// Checks if packet transmission is possible between nodes
function canTransmit(source, target) {
  if (!hubActive) {
    addLogEntry("Cannot transmit: Switch is inactive", "error");
    return false;
  }
  
  if (!source || !nodeStatus[source]) {
    addLogEntry(`Cannot transmit: Source ${source ? source.replace("node", "PC ") : "undefined"} is inactive`, "error");
    return false;
  }
  
  if (target && !nodeStatus[target]) {
    addLogEntry(`Cannot transmit: Target ${target.replace("node", "PC ")} is inactive`, "error");
    return false;
  }
  
  return true;
}