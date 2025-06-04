/**
 * Network Logic Module
 * Handles business logic for network operations, state management, and node control
 */

/**
 * Toggles the active/inactive state of a specified node
 * Updates visualization and logs the state change
 */
function toggleNode(nodeId) {
  nodeStatus[nodeId] = !nodeStatus[nodeId];
  const status = nodeStatus[nodeId] ? "active" : "inactive";
  addLogEntry(`Node ${nodeId.replace("node", "PC ")} is now <span class="${status}-connection">${status.toUpperCase()}</span>`, "info");
  updateVisuals();
}

/**
 * Toggles the active/inactive state of the central switch
 * Updates button text and logs the state change
 */
function toggleHub() {
  hubActive = !hubActive;
  document.getElementById("toggleHub").textContent = `Toggle Switch (${hubActive ? "ON" : "OFF"})`;
  const status = hubActive ? "active" : "inactive";
  addLogEntry(`Switch is now <span class="${status}-connection">${status.toUpperCase()}</span>`, hubActive ? "info" : "error");
  updateVisuals();
}

/**
 * Resets all network components to their active state
 * Restores normal operation across the entire network
 */
function resetAll() {
  hubActive = true;
  for (let id in nodeStatus) {
    if (data.nodes.get(id)) {
        nodeStatus[id] = true;
    }
  }
  document.getElementById("toggleHub").textContent = `Toggle Switch (ON)`;
  addLogEntry("All nodes and switch have been reset to <span class=\"active-connection\">ACTIVE</span>", "info");
  updateVisuals();
}

/**
 * Generates a unique IP address for a new node in the 192.168.1.x subnet
 */
function generateIP(nodeIndex) {
  return `192.168.1.${100 + nodeIndex}`;
}

/**
 * Adds a new node to the network topology
 * Handles cleanup, state initialization, and network recreation
 */
function addNode() {
  if (isAnimatingPacket) {
    cleanupPacketElements();
    isAnimatingPacket = false;
  }
  
  nodeCount++;
  const newNodeId = `node${nodeCount}`;
  
  // Initialize new node state and traffic data
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
}

/**
 * Removes the most recently added node from the network
 * Enforces minimum node count and handles state cleanup
 */
function removeNode() {
  if (nodeCount <= 2) {
    addLogEntry("Cannot remove node: Minimum 2 nodes required", "error");
    return;
  }
  
  if (isAnimatingPacket) {
    cleanupPacketElements();
    isAnimatingPacket = false;
  }
  
  const removedNodeId = `node${nodeCount}`;
  const removedNodeIP = ipConfigurations[removedNodeId] || `(IP not found for PC ${nodeCount})`;
  addLogEntry(`Removed node: PC ${nodeCount} (${removedNodeIP})`, "info");
  
  // Clean up node state data
  delete nodeStatus[removedNodeId];
  delete trafficData[removedNodeId];
  
  nodeCount--;
  createNetwork();
}

/**
 * Validates if packet transmission is possible between nodes
 * In star topology, both source/target nodes and central switch must be active
 */
function canTransmit(source, target) {
  if (!hubActive) {
    addLogEntry("Cannot transmit: Switch is inactive", "error");
    return false;
  }
  
  if (!nodeStatus[source]) {
    addLogEntry(`Cannot transmit: Source ${source.replace("node", "PC ")} is inactive`, "error");
    return false;
  }
  
  if (target && !nodeStatus[target]) {
    addLogEntry(`Cannot transmit: Target ${target.replace("node", "PC ")} is inactive`, "error");
    return false;
  }
  
  return true;
}