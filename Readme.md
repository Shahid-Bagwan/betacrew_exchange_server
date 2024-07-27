# BetaCrew Exchange Client

This Node.js client application interacts with the BetaCrew mock exchange server to request and receive stock ticker data. The goal of the client is to generate a JSON file as output, ensuring that no sequences are missing in the final output.

## Features

- Connects to the BetaCrew exchange server.
- Requests all available packets from the server.
- Identifies and requests any missing packets.
- Generates a JSON file containing all the received packets in sequence.

## Requirements

- Node.js (16.17.0 or higher)

## Setup

1. Clone the repository:

   ```sh
   git clone <repository-url>
   cd betacrew-exchange-client
   ```

2. Open Two Terminals:

   - First Terminal

   ```sh
       node main.js
   ```

   - Second Terminal

   ```sh
       node client.js
   ```

## Code Overview

### Client Code

The main client code is located in `client.js`. Below are key parts of the code:

#### Initial Connection and Packet Request

```javascript
const client = new net.Socket();

let packets = [];
let receivedSequences = new Set();
let bufferCollector = Buffer.alloc(0);
let maxSequence = 0;

client.connect(PORT, HOST, () => {
  console.log("Connected to the server");
  const requestPayload = Buffer.from([1, 0]);
  client.write(requestPayload);
});
```

#### Handling Received Data

```javascript
client.on("data", (data) => {
  console.log("Data received from server");
  bufferCollector = Buffer.concat([bufferCollector, data]);

  // Process packets if we have enough data
  while (bufferCollector.length >= 17) {
    const packetData = bufferCollector.slice(0, 17);
    bufferCollector = bufferCollector.slice(17);
    const packet = parsePacket(packetData);
    console.log(`Parsed packet: ${JSON.stringify(packet)}`);
    packets.push(packet);
    receivedSequences.add(packet.sequence);
    maxSequence = Math.max(maxSequence, packet.sequence);
  }
});
```

#### Requesting Missing Packets

```javascript
const handleResendPacket = (seq) => {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
      const requestPayload = Buffer.alloc(2);
      requestPayload.writeUInt8(2, 0);
      requestPayload.writeUInt8(seq, 1);

      client.write(requestPayload);
    });

    client.on("data", (data) => {
      console.log(`Received missing packet with sequence ${seq}`);
      const packet = parsePacket(data.slice(0, 17));
      packets.push(packet);
      receivedSequences.add(packet.sequence);
      client.end();
      resolve();
    });

    client.on("error", (err) => {
      console.error(`Connection error while requesting sequence ${seq}:`, err);
      client.end();
      reject(err);
    });

    client.on("end", () => {
      console.log(`Connection closed after receiving sequence ${seq}`);
    });
  });
};
```

### My Result

- check the packets.json file
