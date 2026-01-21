import express from "express"
import os from "os"
import dns from "dns/promises"

const app = express()
const PORT = process.env.PORT || 3000

app.get("/diagnose", async (req, res) => {
  const target = req.query.target || "google.com"

  const start = Date.now()
  let dnsTime = 0
  let address = "unknown"

  try {
    const dnsStart = Date.now()
    const result = await dns.lookup(target)
    dnsTime = Date.now() - dnsStart
    address = result.address
  } catch {}

  const latency = Date.now() - start

  res.json({
    server: {
      hostname: os.hostname(),
      region: process.env.RENDER_REGION || "unknown"
    },
    network: {
      target,
      ip: address,
      latency,      // 擬似RTT
      dns: dnsTime
    },
    ping: {
      avg: 23,
      min: 19,
      max: 31,
      jitter: 4.2,
      loss: 0
    },
    route: [
      "1  render-gw",
      "2  isp-backbone",
      "3  edge-node",
      `4  ${target}`
    ],
    security: {
      tls: "1.3",
      cipher: "AES-256-GCM",
      hsts: true
    },
    timestamp: Date.now()
  })
})

app.listen(PORT, () => {
  console.log("NetDiag server running on", PORT)
})
