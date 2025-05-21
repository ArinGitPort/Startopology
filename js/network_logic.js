/**
 * Toggles the active/inactive state of a specified node.
 * @param {string} nodeId - The ID of the node to toggle.
 */
function toggleNode(nodeId) {
  nodeStatus[nodeId] = !nodeStatus[nodeId];
  const status = nodeStatus[nodeId] ? "active" : "inactive";
  addLogEntry(`Node ${nodeId.replace("node", "PC ")} is now <span class="${status}-connection">${status.toUpperCase()}</span>`, "info");
  updateVisuals();
}

/**
 * Toggles the active/inactive state of the hub.
 */
function toggleHub() {
  hubActive = !hubActive;
  document.getElementById("toggleHub").textContent = `Toggle Hub (${hubActive ? "ON" : "OFF"})`;
  const status = hubActive ? "active" : "inactive";
  addLogEntry(`Hub is now <span class="${status}-connection">${status.toUpperCase()}</span>`, hubActive ? "info" : "error");
  updateVisuals();
}

/**
 * Resets all nodes and the hub to their active state.
 */
function resetAll() {
  hubActive = true;
  for (let id in nodeStatus) {
    if (data.nodes.get(id)) { // Ensure node exists before setting status
        nodeStatus[id] = true;
    }
  }
  document.getElementById("toggleHub").textContent = `Toggle Hub (ON)`;
  addLogEntry("All nodes and hub have been reset to <span class=\"active-connection\">ACTIVE</span>", "info");
  updateVisuals();
}

/**
 * Generates an IP address for a new node based on its index.
 * @param {number} nodeIndex - The index of the new node.
 * @returns {string} The generated IP address.
 */
function generateIP(nodeIndex) {
  return `192.168.1.${100 + nodeIndex}`; // Start from .101 to avoid conflicts with initial IPs
}

/**
 * Adds a new node to the network.
 */
function addNode() {
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
  
  createNetwork(); // This will also call updateNodeSelectors and updateVisuals
  addLogEntry(`Added new node: PC ${nodeCount} (${ipConfigurations[newNodeId]})`, "info");
}

/**
 * Removes the last added node from the network.
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
  
  delete nodeStatus[removedNodeId];
  delete trafficData[removedNodeId];
  // Optionally, remove from ipConfigurations if IPs are dynamically managed and can be reused
  // delete ipConfigurations[removedNodeId]; 
  
  nodeCount--;
  createNetwork(); // This will also call updateNodeSelectors and updateVisuals
}

/**
 * Checks if packet transmission is possible between nodes.
 * In a star topology, both nodes and the hub must be active.
 * @param {string} source - Source node ID
 * @param {string} target - Target node ID
 * @returns {boolean} - Whether transmission is possible
 */
function canTransmit(source, target) {
  if (!hubActive) {
    addLogEntry("Cannot transmit: Hub is inactive", "error");
    return false;
  }
  
  if (!nodeStatus[source]) {
    addLogEntry(`Cannot transmit: Source ${source.replace("node", "PC ")} is inactive`, "error");
    return false;
  }
  
  // For broadcast, target might be undefined, or an array of targets. 
  // This function is primarily for unicast or a single target check.
  if (target && !nodeStatus[target]) {
    addLogEntry(`Cannot transmit: Target ${target.replace("node", "PC ")} is inactive`, "error");
    return false;
  }
  
  return true;
} 