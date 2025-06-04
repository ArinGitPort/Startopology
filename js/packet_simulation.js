/**
 * Packet Simulation Module
 * Handles visual packet animation, collision detection, transmission logic, and retransmission
 */

/**
 * Creates a visual packet DOM element with enhanced styling
 */
function createPacketElement(packetSize = 64) {
  const packet = document.createElement('div');
  packet.className = 'packet';
  
  const baseSize = 32;
  const visualSize = baseSize;
  
  packet.style.width = `${visualSize}px`;
  packet.style.height = `${visualSize}px`;
  packet.style.backgroundColor = '#00ff88';
  packet.style.border = '2px solid #ffffff';
  packet.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.3)';
  packet.style.zIndex = '9999';
  
  const networkDiv = document.querySelector('#network');
  if (networkDiv) {
    networkDiv.appendChild(packet);
  }
  return packet;
}

/**
 * Creates a visual trail element that follows packets for enhanced animation
 */
function createTrailElement(packetSize = 64) {
  const trail = document.createElement('div');
  trail.className = 'packet-trail';
  
  const sizeMultiplier = 0.7 + (packetSize / 1500) * 0.3;
  const baseSize = 12;
  const visualSize = Math.round(baseSize * sizeMultiplier);

  trail.style.width = `${visualSize}px`;
  trail.style.height = `${visualSize}px`;
  trail.style.backgroundColor = '#00ff88';
  trail.style.borderRadius = '50%';
  trail.style.position = 'absolute';
  trail.style.opacity = '0.7';
  trail.style.boxShadow = '0 0 10px rgba(0, 255, 136, 0.5)';
  trail.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  trail.style.pointerEvents = 'none';
  trail.style.zIndex = '9998';
  trail.style.transform = 'translate(-50%, -50%)';
  
  const networkDiv = document.querySelector('#network');
  if (networkDiv) {
    networkDiv.appendChild(trail);
  }
  return trail;
}

/**
 * Comprehensive cleanup of all packet visual elements with error handling
 */
function cleanupPacketElements() {
  try {
    if (!Array.isArray(packetElements)) {
      packetElements = [];
      return;
    }

    const elementsToRemove = [...packetElements];
    let removedCount = 0;

    elementsToRemove.forEach((element, index) => {
      try {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
          removedCount++;
        }
      } catch (error) {
        console.error(`Error removing packet element at index ${index}:`, error);
      }
    });

    packetElements.length = 0;
    isAnimatingPacket = false;
    
    if (Array.isArray(activePackets)) {
      activePackets.length = 0;
    } else {
      activePackets = [];
    }

  } catch (error) {
    console.error("Critical error in cleanupPacketElements:", error);
    packetElements = [];
    activePackets = [];
    isAnimatingPacket = false;
  }
}

/**
 * Creates a pulse effect at a node's position to indicate packet activity
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
  
  const networkRect = networkDiv.getBoundingClientRect();
  const centerX = networkRect.width / 2;
  const centerY = networkRect.height / 2;
  
  const pulseSize = 32;
  const offset = pulseSize / 2;
  
  // Calculate positioning adjustments for proper centering
  const xAdjustmentRatio = 17 / networkRect.width;
  const yAdjustmentRatio = 68 / networkRect.height;
  const xAdjustment = networkRect.width * xAdjustmentRatio;
  const yAdjustment = networkRect.height * yAdjustmentRatio;
  
  const x = centerX + nodePosition.x - offset + xAdjustment;
  const y = centerY + nodePosition.y - offset + yAdjustment;

  const pulse = document.createElement('div');
  pulse.className = 'packet pulse-effect';
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  networkDiv.appendChild(pulse);
  packetElements.push(pulse);

  setTimeout(() => {
    if (pulse && pulse.parentNode) pulse.parentNode.removeChild(pulse);
    const index = packetElements.indexOf(pulse);
    if (index !== -1) packetElements.splice(index, 1);
  }, 500);
}

/**
 * Animates a packet along a path between two points with latency and collision detection
 * @param {number} x1 - Starting X coordinate
 * @param {number} y1 - Starting Y coordinate  
 * @param {number} x2 - Ending X coordinate
 * @param {number} y2 - Ending Y coordinate
 /**
 * Animates packet along a path with latency and visual effects
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate  
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @param {number} centerX - Center X of the network canvas
 * @param {number} centerY - Center Y of the network canvas
 * @param {string} packetId - Unique ID of the packet being animated
 * @param {number} packetSize - Size of the packet in bytes
 * @param {number} duration - Animation duration in milliseconds
 * @param {function} onComplete - Callback function for animation completion
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
  
  const networkRect = networkDiv.getBoundingClientRect();
  const networkCenterX = networkRect.width / 2;
  const networkCenterY = networkRect.height / 2;
  
  // Calculate positioning with centering offset
  const currentPacketSize = 32;
  const offset = currentPacketSize / 2;
  
  const xAdjustmentRatio = 17 / networkRect.width;
  const yAdjustmentRatio = 68 / networkRect.height;
  const xAdjustment = networkRect.width * xAdjustmentRatio;
  const yAdjustment = networkRect.height * yAdjustmentRatio;
  
  const startX = networkCenterX + x1 - offset + xAdjustment;
  const startY = networkCenterY + y1 - offset + yAdjustment;
  const endX = networkCenterX + x2 - offset + xAdjustment;
  const endY = networkCenterY + y2 - offset + yAdjustment;
  
  const startTime = performance.now();
  const trails = [];
  let lastTrailTime = 0;
  const trailInterval = 50;

  function animate(currentTime) {
    if (!packet.parentNode) {
      // Clean up trails if packet was removed
      trails.forEach(trail => {
        if (trail && trail.parentNode) trail.parentNode.removeChild(trail);
      });
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
    
    // Create animated trail effect
    if (currentTime - lastTrailTime > trailInterval) {
      const trail = createTrailElement(packetSize);
      trail.style.left = `${currentX}px`;
      trail.style.top = `${currentY}px`;
      trails.push(trail);
      lastTrailTime = currentTime;
      
      // Remove trail with fade effect
      setTimeout(() => {
        if (trail && trail.parentNode) {
          trail.style.opacity = '0';
          trail.style.transform = 'scale(0.5)';
          setTimeout(() => {
            if (trail && trail.parentNode) trail.parentNode.removeChild(trail);
            const index = trails.indexOf(trail);
            if (index !== -1) trails.splice(index, 1);
          }, 200);
        }
      }, 800);
    }
    
    // Update packet position for collision detection
    const packetIndex = activePackets.findIndex(p => p.id === packetId);
    if (packetIndex !== -1) {
      activePackets[packetIndex].currentPosition = { x: currentX, y: currentY };
    }
    
    // Check for collisions with other packets
    if (enableCollisions) {
      const hasCollision = checkCollisions(packetId, { x: currentX, y: currentY });
      if (hasCollision) {
        if (packet.parentNode) packet.parentNode.removeChild(packet);
        const visualPacketIndex = packetElements.indexOf(packet);
        if (visualPacketIndex !== -1) packetElements.splice(visualPacketIndex, 1);
        
        if (packetIndex !== -1) activePackets.splice(packetIndex, 1);
        isAnimatingPacket = false;
        if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
        return; 
      }
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation completed successfully
      setTimeout(() => {
        if (packet.parentNode) packet.parentNode.removeChild(packet);
        const visualPacketIndex = packetElements.indexOf(packet);
        if (visualPacketIndex !== -1) packetElements.splice(visualPacketIndex, 1);
        
        // Clean up remaining trails
        trails.forEach(trail => {
          if (trail && trail.parentNode) {
            trail.style.opacity = '0';
            setTimeout(() => {
              if (trail && trail.parentNode) trail.parentNode.removeChild(trail);
            }, 200);
          }
        });
        
        if (onComplete) onComplete();
      }, 100);
    }
  }
  requestAnimationFrame(animate);
}

/**
 * Animates a packet from source to target through the hub
 */
function animatePacketWithParams(source, target, packetId, packetSize) {
  const positions = network.getPositions([source, "hub", target]);
  if (!positions[source] || !positions["hub"] || !positions[target]) {
    addLogEntry(`Animation failed: Node position not found for ${source}, switch, or ${target}`, "error");
    isAnimatingPacket = false;
    const packetIndex = activePackets.findIndex(p => p.id === packetId);
    if (packetIndex !== -1) activePackets.splice(packetIndex, 1);
    if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
    return;
  }
  const sourcePos = positions[source];
  const hubPos = positions["hub"];
  const targetPos = positions[target];
    // Use network div instead of canvas for positioning
  const networkDiv = document.getElementById('network');
  if (!networkDiv) {
      addLogEntry("Animation failed: Network div not found", "error");
      isAnimatingPacket = false;
      // Similar cleanup as above
      return;
  }
  const rect = networkDiv.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const sizeSpeedFactor = 1 + ((packetSize - 64) / 1436); // Larger packets are slower
  const adjustedSpeed = PACKET_SPEED * sizeSpeedFactor;
  
  addLogEntry(`Packet traveling from ${source.replace("node", "PC ")} to switch`, "info");
  const packetIndex = activePackets.findIndex(p => p.id === packetId);
  if (packetIndex !== -1) activePackets[packetIndex].currentSegment = 0; // source -> switch

  animatePacketAlongPathWithLatency(sourcePos.x, sourcePos.y, hubPos.x, hubPos.y, centerX, centerY, packetId, packetSize, adjustedSpeed, () => {
    if (packetIndex !== -1) activePackets[packetIndex].currentSegment = 1; // switch -> target
    pulseEffect("hub");
    addLogEntry(`Packet arrived at switch, processing routing (latency: ${currentLatency}ms)`, "info");
    
    setTimeout(() => {
      addLogEntry(`Packet traveling from switch to ${target.replace("node", "PC ")}`, "info");
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
 /**
 * Sends packet with retry mechanism for failed transmissions
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
      isAnimatingPacket = false;
       if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
    }
    return;
  }
  sendPacketBetweenNodes(source, target);
}

/**
 * Broadcasts packet from source to all active nodes via hub
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
    addLogEntry("Cannot broadcast: Switch is inactive", "error");
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
  animateBroadcastWithParams(source, targets, broadcastId, currentPacketSize);
}

/**
 * Animates broadcast packet from source to hub, then hub to all targets
 */
function animateBroadcastWithParams(source, targets, basePacketId, packetSize) {
  const nodeIds = [source, "hub", ...targets];
  const positions = network.getPositions(nodeIds);

  if (!positions[source] || !positions["hub"]) {
      addLogEntry(`Broadcast animation failed: Node position not found for ${source} or hub`, "error");
      isAnimatingPacket = false;
      if (packetQueue.length > 0) setTimeout(processPacketQueue, 100);
      return;
  }
  targets.forEach(target => {
      if (!positions[target]) {
          addLogEntry(`Broadcast animation failed: Node position not found for target ${target}`, "error");
      }
  });
  
  if (!trafficData[source]) trafficData[source] = { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() };
  trafficData[source].packetsSent += targets.length;
  targets.forEach(target => {
    if (!trafficData[target]) trafficData[target] = { packetsSent: 0, packetsReceived: 0, lastUpdate: Date.now() };
    trafficData[target].packetsReceived++;
  });
  
  const networkDiv = document.getElementById('network');
  if (!networkDiv) {
    addLogEntry("Broadcast animation failed: Network div not found", "error");
    isAnimatingPacket = false;
    return;
  }
  const rect = networkDiv.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const sizeSpeedFactor = 1 + ((packetSize - 64) / 1436);
  const adjustedSpeed = PACKET_SPEED * sizeSpeedFactor;

  pulseEffect(source);
  addLogEntry(`Broadcast: ${source.replace("node", "PC ")} to Switch`, "info");

  // Register source-to-hub packet for collision detection
  const sourceToHubPacketId = basePacketId + '-source-hub';
  activePackets.push({
      id: sourceToHubPacketId,
      source: source,
      target: 'hub',
      creationTime: Date.now(),
      size: packetSize,
      path: [source, 'hub'],
      currentSegment: 0
  });

  animatePacketAlongPathWithLatency(positions[source].x, positions[source].y, positions["hub"].x, positions["hub"].y, centerX, centerY, sourceToHubPacketId, packetSize, adjustedSpeed, () => {
    const sourceToHubIndex = activePackets.findIndex(p => p.id === sourceToHubPacketId);
    if (sourceToHubIndex !== -1) activePackets.splice(sourceToHubIndex, 1);

    pulseEffect("hub");
    addLogEntry(`Broadcast: Arrived at Switch (latency: ${currentLatency}ms), fanning out...`, "info");
    
    setTimeout(() => {
      let animationsCompleted = 0;
      targets.forEach((target, index) => {
        if (!positions[target]) return;
        
        const hubToTargetPacketId = `${basePacketId}-hub-target-${index}`;
        activePackets.push({
            id: hubToTargetPacketId,
            source: 'hub',
            target: target,
            creationTime: Date.now(),
            size: packetSize,
            path: ['hub', target],
            currentSegment: 0
        });

        setTimeout(() => {
            addLogEntry(`Broadcast: Switch to ${target.replace("node", "PC ")}`, "info");
            animatePacketAlongPathWithLatency(positions["hub"].x, positions["hub"].y, positions[target].x, positions[target].y, centerX, centerY, hubToTargetPacketId, packetSize, adjustedSpeed, () => {
                pulseEffect(target);
                addLogEntry(`Broadcast: Delivered to ${target.replace("node", "PC ")} (${ipConfigurations[target] || generateIP(parseInt(target.replace("node", "")))})`, "target");
                
                const pData = activePackets.find(p => p.id === hubToTargetPacketId);
                if (pData) {
                    const deliveryTime = Date.now() - pData.creationTime;
                    loadTestMetrics.deliveryTimes.push(deliveryTime);
                    loadTestMetrics.packetsDelivered++;
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
        }, index * 50);
      });
    }, currentLatency);
  });
}

/**
 * Checks for packet collisions in network segments
 */
function checkCollisions(packetId, position) {
  if (!enableCollisions) return false;
  
  const currentPacket = activePackets.find(p => p.id === packetId);
  if (!currentPacket) return false;
  
  for (const otherPacket of activePackets) {
    if (otherPacket.id === packetId) continue;
    if (!otherPacket.currentPosition || !otherPacket.path || !currentPacket.path || 
        currentPacket.currentSegment === undefined || otherPacket.currentSegment === undefined ||
        currentPacket.currentSegment >= currentPacket.path.length -1 || 
        otherPacket.currentSegment >= otherPacket.path.length - 1) {
            continue;
        }

    const dx = position.x - otherPacket.currentPosition.x;
    const dy = position.y - otherPacket.currentPosition.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    let onPotentiallyCollidingSegment = false;

    // Determine the origin and destination for the current leg of each packet
    const currentSegmentOrigin = currentPacket.path[currentPacket.currentSegment];
    const currentSegmentDestination = currentPacket.path[currentPacket.currentSegment + 1];
    
    const otherSegmentOrigin = otherPacket.path[otherPacket.currentSegment];
    const otherSegmentDestination = otherPacket.path[otherPacket.currentSegment + 1];

    // Case 1: Both packets are heading TO the hub (from different or same source nodes)
    if (currentSegmentDestination === 'hub' && otherSegmentDestination === 'hub') {
      onPotentiallyCollidingSegment = true;
    }
    // Case 2: Both packets are originating FROM the hub AND heading to the SAME target node
    else if (currentSegmentOrigin === 'hub' && otherSegmentOrigin === 'hub' && currentSegmentDestination === otherSegmentDestination) {
      onPotentiallyCollidingSegment = true;
    }
    // Case 3: Generic case - if they share the exact same origin and destination for their current segment
    else if (currentSegmentOrigin === otherSegmentOrigin && currentSegmentDestination === otherSegmentDestination) {
        onPotentiallyCollidingSegment = true;
    }

    if (distance < 20 && onPotentiallyCollidingSegment) { // Threshold for collision
      createCollisionEffect(position.x, position.y);
      loadTestMetrics.collisions++;
      collisionCount++; 
      updateLoadTestMetrics();
      addLogEntry(`Collision detected involving packets from ${currentPacket.source.replace("node", "PC ")} and ${otherPacket.source.replace("node", "PC ")}`, "error");
      
      // Store packet details for retransmission
      const packetsToRetry = [];
      
      // Capture current packet for retransmission
      if(currentPacket && currentPacket.source && currentPacket.target){
        packetsToRetry.push({
          source: currentPacket.source,
          target: currentPacket.target,
          size: currentPacket.size || currentPacketSize
        });
        
        const currentPIndex = activePackets.findIndex(p => p.id === currentPacket.id);
        if(currentPIndex !== -1) activePackets.splice(currentPIndex, 1);
      }
      
      // Capture other packet for retransmission
      if(otherPacket && otherPacket.source && otherPacket.target){
        packetsToRetry.push({
          source: otherPacket.source,
          target: otherPacket.target,
          size: otherPacket.size || currentPacketSize
        });
        
        const otherPIndex = activePackets.findIndex(p => p.id === otherPacket.id);
        if(otherPIndex !== -1) activePackets.splice(otherPIndex, 1);
      }
      // Schedule retransmission after exponential backoff
    addLogEntry("Collision resolution: Packets will be retransmitted after a random backoff time.", "info");
    
    // For each packet that collided, schedule retransmission with random backoff
    packetsToRetry.forEach((packet, index) => {
      const baseBackoff = 500; // Base backoff in milliseconds
      const randomMultiplier = 1 + Math.random() * 4; // Random multiplier between 1-5
      const backoffTime = baseBackoff * randomMultiplier;
      
      setTimeout(() => {
        // Only retransmit if the nodes and hub are still active
        if (hubActive && nodeStatus[packet.source] && nodeStatus[packet.target]) {
          addLogEntry(`Automatically retransmitting packet from ${packet.source.replace("node", "PC ")} to ${packet.target.replace("node", "PC ")} after ${Math.round(backoffTime)}ms backoff`, "info");
          
          // Create a new packet with the same source/target but different ID
          const newPacketData = {
            id: 'retry-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            source: packet.source,
            target: packet.target,
            size: packet.size,
            creationTime: Date.now(),
            retryCount: (packet.retryCount || 0) + 1
          };
          
          // Add to queue or send directly based on current system state
          if (isAnimatingPacket) {
            packetQueue.push(newPacketData);
            updateQueueVisualization();
            addLogEntry(`Queued retransmission for ${packet.source.replace("node", "PC ")} to ${packet.target.replace("node", "PC ")}`, "info");
          } else {
            sendPacketWithData(newPacketData);
          }
        } else {
          addLogEntry(`Canceled retransmission for ${packet.source.replace("node", "PC ")} to ${packet.target.replace("node", "PC ")}: nodes or hub inactive`, "error");
        }
      }, backoffTime + (index * 200)); // Stagger retransmissions slightly
    });
    
    isAnimatingPacket = activePackets.length > 0;
    if (packetQueue.length > 0 && !isAnimatingPacket) setTimeout(processPacketQueue, 100);

    return true;
    }
  }
  return false;
}

/**
 * Creates visual collision effect at specified coordinates
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
  }, 600);
}

// Packet queue management with race condition protection
let isProcessingQueue = false;

/**
 * Processes queued packets with race condition protection
 */
function processPacketQueue() {
  // Prevent race conditions with mutex-like flag
  if (isProcessingQueue) {
    return;
  }

  if (isAnimatingPacket) {
    setTimeout(() => processPacketQueue(), 100);
    return;
  }

  if (packetQueue.length === 0) {
    return;
  }

  try {
    isProcessingQueue = true;
    
    const nextPacket = packetQueue.shift();
    if (!nextPacket) {
      console.warn("Retrieved null packet from queue");
      return;
    }

    // Validate packet data
    if (!nextPacket.source || !nextPacket.target) {
      console.error("Invalid packet data in queue:", nextPacket);
      addLogEntry("Skipping invalid packet in queue", "error");
      if (packetQueue.length > 0) {
        setTimeout(() => processPacketQueue(), 50);
      }
      return;
    }

    // Check if nodes are still valid and active
    if (!hubActive || !nodeStatus[nextPacket.source] || !nodeStatus[nextPacket.target] ||
        !data.nodes.get(nextPacket.source) || !data.nodes.get(nextPacket.target)) {
      
      addLogEntry(`Skipping queued packet from ${nextPacket.source.replace("node", "PC ")} to ${nextPacket.target.replace("node", "PC ")}: Node/Hub inactive or removed.`, "error");
      
      // Update metrics if this is a load test packet
      if (loadTestMetrics && typeof loadTestMetrics.collisions === 'number') {
        loadTestMetrics.collisions++;
        updateLoadTestMetrics();
      }
      
      setTimeout(() => processPacketQueue(), 50);
      return;
    }

    sendPacketWithData(nextPacket);
    
    if (packetQueue.length > 0) {
      setTimeout(() => processPacketQueue(), 100);
    }

  } catch (error) {
    console.error("Error processing packet queue:", error);
    addLogEntry("Error processing packet queue", "error");
    
    if (packetQueue.length > 0) {
      setTimeout(() => processPacketQueue(), 200);
    }
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * Sends packet with specified data and handles animation
 */
function sendPacketWithData(packetData) {
  const { source, target, size: packetSize, creationTime, id: packetId } = packetData;

  // Validate state
  if (!source || !target || source === target || !hubActive || !nodeStatus[source] || !nodeStatus[target] || 
      !data.nodes.get(source) || !data.nodes.get(target)) {
    addLogEntry(`Failed to send packet ${packetId ? packetId.substring(0,10) : ''}: Invalid state (nodes/hub inactive or removed).`, "error");
    isAnimatingPacket = false;
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

/**
 * Simulates collision by sending two packets simultaneously
 */
function simulateCollisionOnClick() {
  if (isAnimatingPacket) {
    addLogEntry("Cannot simulate collision: Animation in progress.", "error");
    return;
  }
  if (!enableCollisions) {
    addLogEntry("Collision simulation requires 'Enable Collision Detection' to be checked.", "warning");
  }

  const activeNodes = [];
  for (let i = 1; i <= nodeCount; i++) {
    const nodeId = `node${i}`;
    if (nodeStatus[nodeId] && hubActive && data.nodes.get(nodeId)) {
      activeNodes.push(nodeId);
    }
  }

  if (activeNodes.length < 2) {
    addLogEntry("Simulate Collision: Requires at least 2 active nodes.", "error");
    return;
  }

  addLogEntry("Attempting to simulate a collision...", "info");

  // Two nodes send to a third distinct node (if available)
  if (activeNodes.length >= 3) {
    let source1 = activeNodes[0];
    let source2 = activeNodes[1];
    let targetNode = activeNodes[2];

    addLogEntry(`Simulating collision: ${source1} -> ${targetNode} and ${source2} -> ${targetNode}`, "info");
    
    sendPacketWithData({
      id: 'collision-sim-1-' + Date.now(),
      source: source1,
      target: targetNode,
      size: currentPacketSize,
      creationTime: Date.now()
    });

    // Send second packet shortly after
    setTimeout(() => {
       if (isAnimatingPacket && activePackets.length > 0) {
         sendPacketWithData({
            id: 'collision-sim-2-' + Date.now(),
            source: source2,
            target: targetNode,
            size: currentPacketSize,
            creationTime: Date.now()
          });
       } else {
         addLogEntry("Collision simulation second packet not sent: first packet finished too quickly or was blocked.", "warning");
       }
    }, 50);

  } else { // activeNodes.length === 2
    let source1 = activeNodes[0];
    let source2 = activeNodes[1];
    
    addLogEntry(`Simulating collision: ${source1} -> ${source2} and ${source2} -> ${source1}`, "info");
    sendPacketWithData({
      id: 'collision-sim-1-' + Date.now(),
      source: source1,
      target: source2,
      size: currentPacketSize,
      creationTime: Date.now()
    });
    setTimeout(() => {
      if (isAnimatingPacket && activePackets.length > 0) {
        sendPacketWithData({
          id: 'collision-sim-2-' + Date.now(),
          source: source2,
          target: source1,
          size: currentPacketSize,
          creationTime: Date.now()
        });
      } else {
         addLogEntry("Collision simulation second packet not sent: first packet finished too quickly or was blocked.", "warning");
      }
    }, 50);
  }
}