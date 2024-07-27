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

## My Output

<img src="./shahidnotes.gif" />
