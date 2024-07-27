const net = require("net");
const fs = require("fs").promises;

const HOST = "127.0.0.1";
const PORT = 3000;

function parsePacket(data) {
  let offset = 0;
  const symbol = data.slice(offset, offset + 4).toString("ascii");
  offset += 4;
  const buySell = data.slice(offset, offset + 1).toString("ascii");
  offset += 1;
  const quantity = data.readInt32BE(offset);
  offset += 4;
  const price = data.readInt32BE(offset);
  offset += 4;
  const sequence = data.readInt32BE(offset);
  offset += 4;

  return { symbol, buySell, quantity, price, sequence };
}

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

client.on("end", async () => {
  console.log("Connection closed by server");
  await requestMissingPackets();
});

client.on("error", (err) => {
  console.error("Connection error:", err);
});

async function requestMissingPackets() {
  const missingSequences = [];
  for (let i = 1; i <= maxSequence; i++) {
    if (!receivedSequences.has(i)) {
      missingSequences.push(i);
    }
  }

  if (missingSequences.length === 0) {
    console.log("No missing packets, writing to JSON");
    await writePacketsToJSON();
    return;
  }

  for (const seq of missingSequences) {
    try {
      await handleResendPacket(seq);
    } catch (err) {
      console.error(`Error requesting sequence ${seq}:`, err);
    }
  }

  console.log("All missing packets received, writing to JSON");
  await writePacketsToJSON();
}

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

async function writePacketsToJSON() {
  packets.sort((a, b) => a.sequence - b.sequence);
  await fs.writeFile("packets.json", JSON.stringify(packets, null, 2));
  console.log("Packets written to packets.json");
}
