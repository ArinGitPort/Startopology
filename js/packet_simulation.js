/**
 * Creates a visual packet DOM element, optionally adjusting size based on packetSize.
 * @param {number} [packetSize=64] - The size of the packet in bytes.
 * @returns {HTMLElement} The created packet element.
 */
function createPacketElement(packetSize = 64) {
  const packet = document.createElement('div');
  packet.className = 'packet';
  
  // Adjust visual size based on packet data size
  const sizeMultiplier = 0.7 + (packetSize / 1500) * 0.8; // Range: 0.7x to 1.5x
  const baseSize = 18; // Base visual size in pixels
  const visualSize = Math.round(baseSize * sizeMultiplier);
  
  packet.style.width = `${visualSize}px`;
  packet.style.height = `${visualSize}px`;
  
  const networkDiv = document.querySelector('#network');
  if (networkDiv) {
    networkDiv.appendChild(packet);
  }
  return packet;
}

/**
 * Creates a visual packet trail DOM element.
 * @param {number} [packetSize=64] - The size of the packet in bytes (affects trail visual).
 * @returns {HTMLElement} The created trail element.
 */
function createTrailElement(packetSize = 64) {
  const trail = document.createElement('div');
  trail.className = 'packet-trail';
  
  const sizeMultiplier = 0.7 + (packetSize / 1500) * 0.8;
  const baseSize = 8;
  const visualSize = Math.round(baseSize * sizeMultiplier);

  trail.style.width = `${visualSize}px`;
  trail.style.height = `${visualSize}px`;
  
  const networkDiv = document.querySelector('#network');
  if (networkDiv) {
    networkDiv.appendChild(trail);
  }
  return trail;
}

/**
 * Removes all visual packet and trail elements from the DOM.
 */
function cleanupPacketElements() {
  packetElements.forEach(element => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
  packetElements = [];
}

/**
 * Creates a pulse effect at a specified node's position.
 * @param {string} nodeId - The ID of the node to apply the pulse effect to.
 */
function pulseEffect(nodeId) {
  const positions = network.getPositions([nodeId]);
  if (!positions || !positions[nodeId]) {
    console.error("Node position not found for pulse effect:", nodeId);
    return;
  }
  
  const nodePosition = positions[nodeId];
  const networkDiv = document.getElementById('network');
  if (!networkDiv) return;
  
  const rect = networkDiv.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const x = centerX + nodePosition.x;
  const y = centerY + nodePosition.y;

  const pulse = document.createElement('div');
  pulse.className = 'packet pulse-effect'; // Uses packet styles for consistency
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  networkDiv.appendChild(pulse);
  packetElements.push(pulse); // Manage with other packet elements

  setTimeout(() => {
    if (pulse && pulse.parentNode) pulse.parentNode.removeChild(pulse);
    const index = packetElements.indexOf(pulse);
    if (index !== -1) packetElements.splice(index, 1);
  }, 500); // Duration of pulse animation
}

/**
 * Animates a packet along a path between two points with latency considerations.
 * @param {number} x1 - Starting X coordinate.
 * @param {number} y1 - Starting Y coordinate.
 * @param {number} x2 - Ending X coordinate.
 * @param {number} y2 - Ending Y coordinate.
 * @param {number} centerX - Center X of the network canvas for coordinate adjustments.
 * @param {number} centerY - Center Y of the network canvas.
 * @param {string} packetId - The unique ID of the packet being animated.
 * @param {number} packetSize - The size of the packet in bytes.
 * @param {number} duration - The calculated duration for the animation segment.
 * @param {function} onComplete - Callback function to execute upon animation completion.
 */
function animatePacketAlongPathWithLatency(x1, y1, x2, y2, centerX, centerY, packetId, packetSize, duration, onComplete) {
  const networkDiv = document.getElementById('network');
  if (!networkDiv) {
    console.error("Network div not found for animation.");
    if (onComplete) onComplete();
    return;
  }
  
  const packet = createPacketElement(packetSize);
  packetElements.push(packet);

  const startX = (networkDiv.clientWidth / 2) + x1;
  const startY = (networkDiv.clientHeight / 2) + y1;
  const endX = (networkDiv.clientWidth / 2) + x2;
  const endY = (networkDiv.clientHeight / 2) + y2;
  
  const startTime = performance.now();
  const trailInterval = Math.max(50, 120 - packetSize / 20); 
  let lastTrailTime = 0;
  
  function animate(currentTime) {
    if (!packet.parentNode) { // Packet removed (e.g., due to collision)
      if (onComplete) onComplete();
      return;
    }
    
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    const currentX = startX + (endX - startX) * easedProgress;
    const currentY = startY + (endY - startY) * easedProgress;
    
    packet.style.left = `${currentX}px`;
    packet.style.top = `${currentY}px`;
    
    const packetIndex = activePackets.findIndex(p => p.id === packetId);
    if (packetIndex !== -1) {
      activePackets[packetIndex].currentPosition = { x: currentX, y: currentY }; // For collision detection
    }
    
    if (enableCollisions) {
      const hasCollision = checkCollisions(packetId, { x: currentX, y: currentY });
      if (hasCollision) {
        if (packet.parentNode) packet.parentNode.removeChild(packet);
        const visualPacketIndex = packetElements.indexOf(packet);
        if (visualPacketIndex !== -1) packetElements.splice(visualPacketIndex, 1);
        
        if (packetIndex !== -1) activePackets.splice(packetIndex, 1);
        isAnimatingPacket = false;
        if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
        // onComplete is not called here as the packet did not reach its destination
        return; 
      }
    }
    
    if (currentTime - lastTrailTime > trailInterval && progress > 0.1 && progress < 0.9) {
      lastTrailTime = currentTime;
      const trail = createTrailElement(packetSize);
      trail.style.left = `${currentX}px`;
      trail.style.top = `${currentY}px`;
      packetElements.push(trail);
      
      setTimeout(() => {
        if (trail.parentNode) {
          trail.style.opacity = '0';
          setTimeout(() => {
            if (trail.parentNode) trail.parentNode.removeChild(trail);
            const trailIdx = packetElements.indexOf(trail);
            if (trailIdx !== -1) packetElements.splice(trailIdx, 1);
          }, 300);
        }
      }, 200);
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setTimeout(() => {
        if (packet.parentNode) packet.parentNode.removeChild(packet);
        const visualPacketIndex = packetElements.indexOf(packet);
        if (visualPacketIndex !== -1) packetElements.splice(visualPacketIndex, 1);
        if (onComplete) onComplete();
      }, 100);
    }
  }
  requestAnimationFrame(animate);
}

/**
 * Animates a packet from source to target, considering packet size and latency.
 * This involves a two-step animation: source -> hub, then hub -> target.
 * @param {string} source - Source node ID.
 * @param {string} target - Target node ID.
 * @param {string} packetId - Unique ID for the packet.
 * @param {number} packetSize - Size of the packet in bytes.
 */
function animatePacketWithParams(source, target, packetId, packetSize) {
  const positions = network.getPositions([source, "hub", target]);
  if (!positions[source] || !positions["hub"] || !positions[target]) {
    addLogEntry(`Animation failed: Node position not found for ${source}, hub, or ${target}`, "error");
    isAnimatingPacket = false;
    const packetIndex = activePackets.findIndex(p => p.id === packetId);
    if (packetIndex !== -1) activePackets.splice(packetIndex, 1);
    if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
    return;
  }
  const sourcePos = positions[source];
  const hubPos = positions["hub"];
  const targetPos = positions[target];
  
  const canvas = document.querySelector('#network canvas');
  if (!canvas) {
      addLogEntry("Animation failed: Canvas not found", "error");
      isAnimatingPacket = false;
      // Similar cleanup as above
      return;
  }
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + (rect.width / 2);
  const centerY = rect.top + (rect.height / 2);
  
  const sizeSpeedFactor = 1 + ((packetSize - 64) / 1436); // Larger packets are slower
  const adjustedSpeed = PACKET_SPEED * sizeSpeedFactor;
  
  addLogEntry(`Packet traveling from ${source.replace("node", "PC ")} to hub`, "info");
  const packetIndex = activePackets.findIndex(p => p.id === packetId);
  if (packetIndex !== -1) activePackets[packetIndex].currentSegment = 0; // source -> hub

  animatePacketAlongPathWithLatency(sourcePos.x, sourcePos.y, hubPos.x, hubPos.y, centerX, centerY, packetId, packetSize, adjustedSpeed, () => {
    if (packetIndex !== -1) activePackets[packetIndex].currentSegment = 1; // hub -> target
    pulseEffect("hub");
    addLogEntry(`Packet arrived at hub, processing routing (latency: ${currentLatency}ms)`, "info");
    
    setTimeout(() => {
      addLogEntry(`Packet traveling from hub to ${target.replace("node", "PC ")}`, "info");
      animatePacketAlongPathWithLatency(hubPos.x, hubPos.y, targetPos.x, targetPos.y, centerX, centerY, packetId, packetSize, adjustedSpeed, () => {
        pulseEffect(target);
        document.getElementById("packetStatus").innerHTML = 
          `<span class="active-connection">Packet delivered: ${source.replace("node", "PC ")} to ${target.replace("node", "PC ")}</span>`;
        addLogEntry(`Packet delivered to ${target.replace("node", "PC ")} (${ipConfigurations[target] || generateIP(parseInt(target.replace("node", "")))})`, "target");
        
        const pData = activePackets.find(p => p.id === packetId);
        if (pData) {
            const deliveryTime = Date.now() - pData.creationTime;
            loadTestMetrics.deliveryTimes.push(deliveryTime);
            loadTestMetrics.packetsDelivered++;
            updateLoadTestMetrics();
        }
        
        if (packetIndex !== -1) activePackets.splice(packetIndex, 1);
        isAnimatingPacket = false;
        blinkInactiveEdges();
        updateVisuals();
        if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
      });
    }, currentLatency);
  });
}

/**
 * Initiates sending a packet from a source to a target node.
 * @param {string} source - Source node ID.
 * @param {string} target - Target node ID.
 * @param {number} [packetSize=currentPacketSize] - Size of the packet.
 */
function sendPacketBetweenNodes(source, target, packetSize = currentPacketSize) {
  const packetStatusEl = document.getElementById("packetStatus");
  const packetData = {
    id: 'packet-' + Date.now() + Math.random().toString(36).substr(2, 5),
    source: source,
    target: target,
    size: packetSize,
    creationTime: Date.now()
  };
  
  addLogEntry(`Sending packet from ${source.replace("node", "PC ")} to ${target.replace("node", "PC ")}`, "source");
  packetStatusEl.innerHTML = `<span class="active-connection">Sending: ${source.replace("node", "PC ")} to ${target.replace("node", "PC ")}</span>`;
  
  if (!trafficData[source]) trafficData[source] = { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() }; 
  if (!trafficData[target]) trafficData[target] = { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() }; 
  trafficData[source].packetsSent++;
  trafficData[target].packetsReceived++; // Note: This implies reception by the hub for the target.
  
  isAnimatingPacket = true;
  clearInterval(blinkInterval);
  cleanupPacketElements();
  pulseEffect(source);
  
  activePackets.push({
    id: packetData.id,
    source: source,
    target: target,
    creationTime: packetData.creationTime,
    size: packetSize,
    path: [source, 'hub', target],
    currentSegment: 0 
  });
  
  setTimeout(() => {
    animatePacketWithParams(source, target, packetData.id, packetSize);
  }, 300); // Short delay before animation starts
}

/**
 * Initiates packet sending with retry logic.
 * @param {string} source - Source node ID.
 * @param {string} target - Target node ID.
 * @param {number} [attempts=3] - Number of retry attempts remaining.
 */
function sendPacketWithRetry(source, target, attempts = 3) {
  if (!canTransmit(source, target)) {
    if (attempts > 0) {
      addLogEntry(`Transmission failed, retrying ${target.replace("node", "PC ")}... (${attempts} left)`, "error");
      setTimeout(() => sendPacketWithRetry(source, target, attempts - 1), 1000);
    } else {
      addLogEntry(`Delivery to ${target.replace("node", "PC ")} failed after multiple attempts`, "error");
      document.getElementById("packetStatus").innerHTML = 
        `<span class="inactive-connection">DELIVERY FAILED to ${target.replace("node", "PC ")}</span>`;
      isAnimatingPacket = false; // Ensure state is reset if all retries fail
       if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
    }
    return;
  }
  sendPacketBetweenNodes(source, target);
}

/**
 * Initiates a broadcast packet from the source node to all other active nodes.
 * @param {string} source - Source node ID.
 */
function broadcastPacket(source) {
  if (!source) {
    addLogEntry("Please select a source node for broadcast", "error");
    return;
  }
  if (isAnimatingPacket) {
    addLogEntry("Cannot broadcast: Animation in progress", "error");
    return;
  }
  if (!hubActive) {
    addLogEntry("Cannot broadcast: Hub is inactive", "error");
    return;
  }
  if (!nodeStatus[source]) {
    addLogEntry(`Cannot broadcast: Source ${source.replace("node", "PC ")} is inactive`, "error");
    return;
  }

  const targets = [];
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    if (nodeId !== source && nodeStatus[nodeId]) {
      targets.push(nodeId);
    }
  }

  if (targets.length === 0) {
    addLogEntry("No active target nodes for broadcast", "error");
    return;
  }

  const packetStatusEl = document.getElementById("packetStatus");
  packetStatusEl.innerHTML = `<span class="active-connection">Broadcasting from ${source.replace("node", "PC ")}</span>`;
  addLogEntry(`Broadcasting from ${source.replace("node", "PC ")} to all active nodes`, "source");
  
  const broadcastId = 'broadcast-' + Date.now() + Math.random().toString(36).substr(2, 5);
  isAnimatingPacket = true;
  clearInterval(blinkInterval);
  cleanupPacketElements();
  // Pulse effect at source happens in animateBroadcastWithParams
  animateBroadcastWithParams(source, targets, broadcastId, currentPacketSize);
}

/**
 * Animates a broadcast packet from source to hub, then hub to all targets.
 * @param {string} source - Source node ID.
 * @param {Array<string>} targets - Array of target node IDs.
 * @param {string} basePacketId - Base ID for the broadcast packets.
 * @param {number} packetSize - Size of the packet.
 */
function animateBroadcastWithParams(source, targets, basePacketId, packetSize) {
  const nodeIds = [source, "hub", ...targets];
  const positions = network.getPositions(nodeIds);

  if (!positions[source] || !positions["hub"]) {
      addLogEntry(`Broadcast animation failed: Node position not found for ${source} or hub`, "error");
      isAnimatingPacket = false;
      // No activePackets to clean up yet for the source->hub part if it fails here.
      if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
      return;
  }
  targets.forEach(target => {
      if (!positions[target]) {
          addLogEntry(`Broadcast animation failed: Node position not found for target ${target}`, "error");
          // Potentially skip this target or halt all, for now, log and continue hoping other targets are fine.
      }
  });
  
  if (!trafficData[source]) trafficData[source] = { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() };
  trafficData[source].packetsSent += targets.length;
  targets.forEach(target => {
    if (!trafficData[target]) trafficData[target] = { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() };
    trafficData[target].packetsReceived++;
  });
  
  const canvas = document.querySelector('#network canvas');
  if (!canvas) {
    addLogEntry("Broadcast animation failed: Canvas not found", "error");
    isAnimatingPacket = false;
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + (rect.width / 2);
  const centerY = rect.top + (rect.height / 2);
  const sizeSpeedFactor = 1 + ((packetSize - 64) / 1436);
  const adjustedSpeed = PACKET_SPEED * sizeSpeedFactor;

  pulseEffect(source); // Pulse source at the beginning of broadcast
  addLogEntry(`Broadcast: ${source.replace("node", "PC ")} to Hub`, "info");

  // Register source-to-hub packet for collision detection and tracking
  const sourceToHubPacketId = basePacketId + '-source-hub';
  activePackets.push({
      id: sourceToHubPacketId,
      source: source,
      target: 'hub', // Target is hub for this segment
      creationTime: Date.now(),
      size: packetSize,
      path: [source, 'hub'],
      currentSegment: 0
  });

  animatePacketAlongPathWithLatency(positions[source].x, positions[source].y, positions["hub"].x, positions["hub"].y, centerX, centerY, sourceToHubPacketId, packetSize, adjustedSpeed, () => {
    const sourceToHubIndex = activePackets.findIndex(p => p.id === sourceToHubPacketId);
    if (sourceToHubIndex !== -1) activePackets.splice(sourceToHubIndex, 1); // Remove after segment completion

    pulseEffect("hub");
    addLogEntry(`Broadcast: Arrived at Hub (latency: ${currentLatency}ms), fanning out...`, "info");
    
    setTimeout(() => {
      let animationsCompleted = 0;
      targets.forEach((target, index) => {
        if (!positions[target]) return; // Skip if target position was not found earlier
        
        const hubToTargetPacketId = `${basePacketId}-hub-target-${index}`;
        activePackets.push({
            id: hubToTargetPacketId,
            source: 'hub',
            target: target,
            creationTime: Date.now(), // Staggering might be complex with collision detection
            size: packetSize,
            path: ['hub', target],
            currentSegment: 0 // Represents hub -> target segment for this packet
        });

        // Stagger animation start slightly for visual effect (optional)
        setTimeout(() => {
            addLogEntry(`Broadcast: Hub to ${target.replace("node", "PC ")}`, "info");
            animatePacketAlongPathWithLatency(positions["hub"].x, positions["hub"].y, positions[target].x, positions[target].y, centerX, centerY, hubToTargetPacketId, packetSize, adjustedSpeed, () => {
                pulseEffect(target);
                addLogEntry(`Broadcast: Delivered to ${target.replace("node", "PC ")} (${ipConfigurations[target] || generateIP(parseInt(target.replace("node", "")))})`, "target");
                
                const pData = activePackets.find(p => p.id === hubToTargetPacketId);
                if (pData) {
                    const deliveryTime = Date.now() - pData.creationTime;
                    loadTestMetrics.deliveryTimes.push(deliveryTime);
                    loadTestMetrics.packetsDelivered++; // Count each leg of broadcast as delivered
                    updateLoadTestMetrics();
                }
                const packetIndex = activePackets.findIndex(p => p.id === hubToTargetPacketId);
                if (packetIndex !== -1) activePackets.splice(packetIndex, 1);

                animationsCompleted++;
                if (animationsCompleted === targets.length) {
                  document.getElementById("packetStatus").innerHTML = 
                    `<span class="active-connection">Broadcast from ${source.replace("node", "PC ")} delivered to ${targets.length} nodes</span>`;
                  isAnimatingPacket = false;
                  blinkInactiveEdges();
                  updateVisuals();
                  if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
                }
            });
        }, index * 50); // Slight stagger for fanning out effect
      });
    }, currentLatency);
  });
}

/**
 * Checks for collisions between the current packet and other active packets.
 * @param {string} packetId - The ID of the current packet.
 * @param {{x: number, y: number}} position - The current position of the packet.
 * @returns {boolean} True if a collision occurred, false otherwise.
 */
function checkCollisions(packetId, position) {
  if (!enableCollisions) return false;
  
  const currentPacket = activePackets.find(p => p.id === packetId);
  if (!currentPacket) return false;
  
  for (const otherPacket of activePackets) {
    if (otherPacket.id === packetId) continue;
    if (!otherPacket.currentPosition || !otherPacket.path || !currentPacket.path) continue;
    if (otherPacket.currentSegment === undefined || currentPacket.currentSegment === undefined) continue;
    if (otherPacket.currentSegment >= otherPacket.path.length || currentPacket.currentSegment >= currentPacket.path.length) continue;

    // Simple distance check
    const dx = position.x - otherPacket.currentPosition.x;
    const dy = position.y - otherPacket.currentPosition.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // Collision if close and on the same path segment (e.g. both going to/from hub, or same target)
    // A more refined check might be needed for hub: if one is source->hub and other is hub->target, it's not a collision *at the hub* unless simultaneous arrival on same port (not simulated)
    // For simplicity, consider collision if on the same logical segment. The hub is a single point of contention.
    let onSameSegment = false;
    if (currentPacket.path[currentPacket.currentSegment] === 'hub' && otherPacket.path[otherPacket.currentSegment] === 'hub') {
        // Both packets are either heading to the hub or leaving the hub.
        // If one is source->hub and other is also source->hub (different sources), it's a collision at hub input.
        // If one is hub->target and other is also hub->target (different targets), it's a collision at hub output (less likely physically if switched, but for simulation).
        // If one is source->hub and other is hub->target, they are on different 'sides' of the hub logic, less of a direct collision unless very bad timing.
        onSameSegment = true; // Simplified: any activity involving the hub segment is contention
    } else if (currentPacket.path[currentPacket.currentSegment] === otherPacket.path[otherPacket.currentSegment]){
        // This covers node-to-hub or hub-to-node where target/source nodes are the same (unlikely for different packets unless it's a loopback test).
        onSameSegment = true;
    }

    if (distance < 20 && onSameSegment) { // Threshold for collision
      createCollisionEffect(position.x, position.y);
      loadTestMetrics.collisions++;
      collisionCount++; // This might be redundant with loadTestMetrics.collisions
      updateLoadTestMetrics();
      addLogEntry(`Collision detected involving packet ${packetId.substring(0,10)} and ${otherPacket.id.substring(0,10)}`, "error");
      return true;
    }
  }
  return false;
}

/**
 * Creates a visual effect for a collision at a given position.
 * @param {number} x - X coordinate of the collision.
 * @param {number} y - Y coordinate of the collision.
 */
function createCollisionEffect(x, y) {
  const networkDiv = document.getElementById('network');
  if (!networkDiv) return;
  
  const collision = document.createElement('div');
  collision.className = 'packet collision-effect';
  collision.style.left = `${x}px`;
  collision.style.top = `${y}px`;
  networkDiv.appendChild(collision);
  packetElements.push(collision); 
  
  setTimeout(() => {
    if (collision.parentNode) collision.parentNode.removeChild(collision);
    const index = packetElements.indexOf(collision);
    if (index !== -1) packetElements.splice(index, 1);
  }, 600); // Duration of collision effect
}

/**
 * Processes the next packet in the global packetQueue.
 */
function processPacketQueue() {
  if (packetQueue.length === 0 || !hubActive) {
    if (packetQueue.length === 0 && isAnimatingPacket === false) {
        // If queue is empty and no animation, load test might be complete
        if(loadTestMetrics.packetsSent > 0 && loadTestMetrics.packetsDelivered + loadTestMetrics.collisions >= loadTestMetrics.packetsSent){
            addLogEntry("Load test processing complete.", "info");
        }
    }
    return;
  }
  
  if (!isAnimatingPacket) {
    const nextPacket = packetQueue.shift();
    updateQueueVisualization(); // Though visual is removed, call keeps structure
    
    // Check if source/target nodes for this queued packet still exist and are active
    if (data.nodes.get(nextPacket.source) && data.nodes.get(nextPacket.target) && 
        nodeStatus[nextPacket.source] && nodeStatus[nextPacket.target] && hubActive) {
      sendPacketWithData(nextPacket); // Use sendPacketWithData for queued packets
    } else {
      addLogEntry(`Skipping queued packet from ${nextPacket.source.replace("node", "PC ")} to ${nextPacket.target.replace("node", "PC ")}: Node/Hub inactive or removed.`, "error");
      loadTestMetrics.collisions++; // Or a new metric like 'dropped_due_to_inactive_node'
      updateLoadTestMetrics();
      setTimeout(processPacketQueue, 50); // Try next packet quickly
    }
  }
  else {
    setTimeout(processPacketQueue, 100); // Check again later if busy
  }
}

/**
 * Main function to send a packet based on packetData from queue or load test.
 * @param {object} packetData - Object containing packet details (id, source, target, size, creationTime).
 */
function sendPacketWithData(packetData) {
  const { source, target, size: packetSize, creationTime, id: packetId } = packetData;

  // Validate again, as state might have changed since queuing
  if (!source || !target || source === target || !hubActive || !nodeStatus[source] || !nodeStatus[target] || 
      !data.nodes.get(source) || !data.nodes.get(target)) {
    addLogEntry(`Failed to send packet ${packetId ? packetId.substring(0,10) : ''}: Invalid state (nodes/hub inactive or removed).`, "error");
    isAnimatingPacket = false; // Ensure this is reset
    if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
    return;
  }
  
  const packetStatusEl = document.getElementById("packetStatus");
  packetStatusEl.innerHTML = `<span class="active-connection">Sending ${packetSize}B: ${source.replace("node", "PC ")} to ${target.replace("node", "PC ")}</span>`;
  addLogEntry(`Sending ${packetSize}B packet ${packetId ? packetId.substring(0,10) : ''} from ${source.replace("node", "PC ")} to ${target.replace("node", "PC ")}`, "source");
  
  if (!trafficData[source]) trafficData[source] = { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() }; 
  if (!trafficData[target]) trafficData[target] = { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() }; 
  trafficData[source].packetsSent++;
  trafficData[target].packetsReceived++;
  
  isAnimatingPacket = true;
  clearInterval(blinkInterval);
  cleanupPacketElements(); 
  pulseEffect(source);
  
  const currentActivePacketId = packetId || 'packet-' + Date.now() + Math.random().toString(36).substr(2, 5);
  activePackets.push({
    id: currentActivePacketId,
    source: source,
    target: target,
    creationTime: creationTime || Date.now(),
    size: packetSize,
    path: [source, 'hub', target],
    currentSegment: 0
  });
  
  setTimeout(() => {
    animatePacketWithParams(source, target, currentActivePacketId, packetSize);
  }, 300);
} 