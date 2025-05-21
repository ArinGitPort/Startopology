# Star Topology Network Simulator

A comprehensive web-based simulator that demonstrates the principles of star network topology, including data transmission, packet routing, and network resilience.

## Features

### Core Network Functionality
- **Star Topology Implementation**: Accurately models a star network with a central hub and peripheral nodes
- **Packet Transmission**: Simulates both unicast (node-to-node) and broadcast (node-to-all) communication
- **Link Failures**: Test network resilience by toggling nodes and hub activation
- **Packet Animation**: Visualize data movement through the network with animated packets
- **Retry Logic**: Implements packet retry mechanism for failed transmissions

### Advanced Network Features
- **Collision Detection**: Simulates packet collisions in the network
- **Latency Simulation**: Configurable network latency to simulate real-world conditions
- **Variable Packet Sizes**: Adjust packet sizes to test network performance
- **Traffic Monitoring**: Tracks and visualizes network traffic on each connection
- **Packet Queue**: Visualizes packet queuing at the hub level
- **IP Addressing**: Realistic IP address configuration for all network devices

### User Interface
- **Interactive Network Diagram**: Click nodes to toggle their state
- **Detailed Logging**: Complete packet transmission logging
- **Network Controls**: Add and remove nodes dynamically
- **Load Testing**: Test network performance under various loads
- **Dark/Light Theme**: Toggle between visual themes for better visibility
- **Responsive Design**: Works on various screen sizes

## Technical Implementation

### Architecture
- Pure client-side implementation using HTML, CSS, and JavaScript
- Modular code structure with clear separation of concerns
- Efficient network visualization using the vis.js library
- Animation framework using requestAnimationFrame for smooth visuals

### Key Components
1. **Network Graph**: Manages the visual representation of the topology
2. **Packet Transmission System**: Handles the core packet routing logic
3. **Animation Engine**: Creates smooth visual representation of data flow
4. **Event System**: Manages network events and user interactions
5. **Configuration Panel**: Allows dynamic adjustment of network parameters

## Installation and Setup

1. Clone this repository
2. Open `index.html` in any modern web browser
3. No server or special setup required - runs completely in the browser

## Usage Guide

### Basic Operations
- Click on nodes to toggle their active state
- Use the "Toggle Hub" button to simulate hub failure
- Select source and target nodes from the dropdown menus
- Choose between unicast or broadcast modes
- Click "Send Packet" to transmit data

### Advanced Features
- Adjust latency using the slider to simulate network delay
- Change packet size to test different data transmission scenarios
- Enable/disable collision detection to observe its effects
- Run load tests to evaluate network performance
- View detailed packet logs for analysis

## Educational Value

This simulator helps demonstrate key networking concepts including:
- The role of a central hub in star topology
- How network failures affect connectivity
- Packet routing principles in star networks
- The impact of latency on network performance
- The advantages and limitations of star topology
- Basic understanding of collision detection in networks

## Future Enhancements

Potential areas for future development:
- Additional protocol simulations (TCP/IP, ARP, etc.)
- Advanced network metrics and analytics
- Multiple simultaneous packet transmissions
- Network security simulation (firewalls, packet inspection)
- Comparison with other network topologies

## Credits

- Network visualization powered by [vis.js](https://visjs.org/)
- Icons and graphics from various open source libraries 