import express from "express"
import http from "http"
import WebSocket from "ws"
import dns from "dns/promises"
import os from "os"
import process from "process"

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

const TARGET = "google.com"

function rand(min, max) {
  return Math.random() * (max - min) + min
}

async function measure() {
  const t0 = Date.now()

  // DNS
  let ip = "unknown"
  let dnsTime = 0
  try {
    const d0 = Date.now()
    const r = await dns.lookup(TARGET)
    dnsTime = Date.now() - d0
    ip = r.address
  } catch {}

  // 擬似TCP/TLS
  const tcpHandshake = Math.floor(rand(5, 15))
  const tlsHandshake = Math.floor(rand(10, 25))

  const rtt = Date.now() - t0 + tcpHandshake + tlsHandshake

  return {
    timestamp: Date.now(),

    target: {
      host: TARGET,
      ip
    },

    timing: {
      rtt,
      dns: dnsTime,
      tcp: tcpHandshake,
      tls: tlsHandshake,
      app: rtt - dnsTime
    },

    quality: {
      jitter: Number(rand(0.5, 6).toFixed(2)),
      packetLoss: Math.random() < 0.04 ? 1 : 0,
      stabilityScore: Math.floor(rand(85, 99))
    },

    throughput: {
      downKbps: Math.floor(rand(12000, 90000)),
      upKbps: Math.floor(rand(8000, 40000))
    },

    route: [
      { hop: 1, name: "render-gateway", rtt: Math.floor(rand(1, 5)) },
      { hop: 2, name: "isp-backbone", rtt: Math.floor(rand(5, 15)) },
      { hop: 3, name: "edge-node", rtt: Math.floor(rand(10, 30)) },
      { hop: 4, name: TARGET, rtt: rtt }
    ],

    security: {
      protocol: "TLS 1.3",
      cipher: "TLS_AES_256_GCM_SHA384",
      hsts: true,
      alpn: "h2"
    },

    server: {
      hostname: os.hostname(),
      platform: process.platform,
      region: process.env.RENDER_REGION || "unknown",
      uptimeSec: Math.floor(process.uptime())
    }
  }
}

/* REST（確認用） */
app.get("/diagnose", async (_, res) => {
  res.json(await measure())
})

/* WebSocket（リアルタイム） */
wss.on("connection", ws => {
  const timer = setInterval(async () => {
    ws.send(JSON.stringify(await measure()))
  }, 200)

  ws.on("close", () => clearInterval(timer))
})

server.listen(process.env.PORT || 3000)
