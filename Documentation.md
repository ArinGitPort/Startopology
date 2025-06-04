# Star Topology Simulator Documentation

This document provides an overview of the JavaScript modules that power the Star Topology Simulator, a web-based tool for visualizing and understanding star network topologies.

## Core Files Overview

### config.js
- **Purpose**: Contains global configuration values and state variables
- **Key Features**:
  - Network color constants for visual elements (HUB_ACTIVE, NODE_ACTIVE, etc.)
  - IP configuration for network nodes
  - Core state management variables
  - Advanced features configuration
  - Load testing metrics storage

### network_graph.js
- **Purpose**: Handles the visualization of the network topology
- **Key Features**:
  - Creates the star network topology with central hub
  - Updates node and edge visuals based on current state
  - Manages blinking effects for inactive connections
  - Tracks and displays traffic levels

### network_logic.js
- **Purpose**: Contains core network operations logic
- **Key Features**:
  - Manages node and switch state toggles
  - Handles adding and removing nodes
  - Implements network reset functionality
  - Validates packet transmission possibility
  - Generates IP addresses for new nodes

### packet_simulation.js
- **Purpose**: Simulates packet transmission in the network
- **Key Features**:
  - Animates packets traveling through the network
  - Implements collision detection and resolution
  - Creates visual effects for packets, pulses, and collisions
  - Manages packet queuing and sequential processing
  - Handles broadcast packet transmission to all nodes

### simulation.js
- **Purpose**: Provides automated simulation capabilities
- **Key Features**:
  - Auto-simulation of packet transmissions
  - Load testing with performance metrics
  - Randomized packet generation for simulations
  - Timing and metrics collection

### ui_handlers.js
- **Purpose**: Manages user interface interactions
- **Key Features**:
  - Updates dropdown selectors for nodes
  - Maintains the packet log display
  - Updates status text and metrics
  - Manages collapsible sections
  - Initializes configuration controls
  - Implements the demo sequence

### main.js
- **Purpose**: Entry point that initializes the application
- **Key Features**:
  - Sets up initial event listeners
  - Initializes the network visualization
  - Connects UI elements to their handlers
  - Configures user guide interactions

## Key Concepts

### Star Topology
The simulator demonstrates a star network topology where all nodes connect to a central switch/hub. In this topology, all data must pass through the central hub to reach destination nodes.

### Packet Transmission
Packets are visualized as they travel from source to hub and then to destination. The simulator shows:
- Unicast (one-to-one) transmission
- Broadcast (one-to-all) transmission

### Network Status
Nodes and the hub can be toggled between active and inactive states:
- Active components are highlighted in green
- Inactive components are highlighted in red
- Connection lines blink when inactive

### Advanced Features
- **Collision Detection**: Simulates what happens when packets collide
- **Latency Configuration**: Adjusts packet processing time at the hub
- **Packet Size**: Changes the size of transmitted packets
- **Load Testing**: Tests network performance under various loads

## Error Handling
The application implements robust error handling throughout:
- DOM element validation before operations
- Network state validation before packet transmission
- Try/catch blocks for critical operations
- Graceful degradation when components fail
- Console error logging for debugging

## Performance Considerations
- Animation is optimized using requestAnimationFrame
- Packet queue management prevents overwhelming the visualization
- Traffic data is managed with automatic timeouts
- Visualization updates are batched where possible
