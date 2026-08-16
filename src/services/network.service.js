import os from 'os';
import { exec } from 'child_process';
import dns from 'dns';
import { promisify } from 'util';

const execAsync = promisify(exec);
const { Resolver } = dns;

// Monitoramento de tráfego na sessão
let lastNetworkBytes = { rx: 0, tx: 0, timestamp: 0 };

const NetworkService = {
  // 1. Obtém as interfaces de rede locais (IP v4, MAC, Tipo)
  async getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const results = [];

    for (const [name, netInterface] of Object.entries(interfaces)) {
      for (const info of netInterface) {
        if (!info.internal && info.family === 'IPv4') {
          results.push({
            name: name, // Será tratado pelo i18n ou exibido como adaptador técnico
            ip: info.address,
            netmask: info.netmask,
            mac: info.mac,
            cidr: info.cidr
          });
        }
      }
    }

    return results;
  },

  // 2. Medidor de velocidade em tempo real (Retorna puramente Bytes/s)
  async getNetworkSpeed() {
    let currentRx = 0;
    let currentTx = 0;

    try {
      // Leitura via netstat -e exclusiva do Windows
      const { stdout } = await execAsync('netstat -e', { windowsHide: true, timeout: 4000 });
      const lines = stdout.split(/\r?\n/);
      
      for (const line of lines) {
        const match = line.trim().match(/^Bytes\s+(\d+)\s+(\d+)$/i);
        if (match) {
          currentRx = parseInt(match[1], 10);
          currentTx = parseInt(match[2], 10);
          break;
        }
      }
    } catch (e) {
      // Falha silenciosa para evitar travamento de UI
    }

    const now = Date.now();
    let rxSpeed = 0;
    let txSpeed = 0;

    if (lastNetworkBytes.timestamp > 0) {
      const timeDiff = (now - lastNetworkBytes.timestamp) / 1000;
      if (timeDiff > 0) {
        rxSpeed = Math.max(0, (currentRx - lastNetworkBytes.rx) / timeDiff);
        txSpeed = Math.max(0, (currentTx - lastNetworkBytes.tx) / timeDiff);
      }
    }

    lastNetworkBytes = { rx: currentRx, tx: currentTx, timestamp: now };

    return {
      downloadBytesPerSec: rxSpeed,
      uploadBytesPerSec: txSpeed
    };
  },

  // 3. Lista conexões de rede ativas (Exclusivo Windows)
  async getActiveConnections() {
    const connections = [];

    try {
      // Windows: netstat -ano para capturar portas e PID
      const { stdout } = await execAsync('netstat -ano -p tcp', { windowsHide: true, timeout: 5000 });
      const lines = stdout.split(/\r?\n/);

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && (parts[0] === 'TCP' || parts[0] === 'UDP')) {
          const state = parts[3];

          if (state === 'ESTABLISHED' || state === 'LISTENING') {
            connections.push({
              protocol: parts[0],
              localAddress: parts[1],
              remoteAddress: parts[2],
              state: state,
              pid: parseInt(parts[4], 10) || null // Retorna int limpo ou nulo
            });
          }
        }
      }
    } catch (e) {
        // Falha silenciosa
    }

    // Retorna as 25 conexões mais relevantes para não sobrecarregar a UI
    return connections.slice(0, 25);
  },

  async _testSingleDns(ip, id) {
    const resolver = new Resolver();
    resolver.setServers([ip]);
    const start = Date.now();
    
    try {
      await new Promise((resolve, reject) => {
        resolver.resolve4('google.com', (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      return { id, ip, latency: Date.now() - start };
    } catch (err) {
      return { id, ip, latency: null }; // Latency null indica erro para a UI tratar
    }
  },

  async runDnsBenchmark() {
    // Chaves de tradução (id) ao invés de nomes visuais hardcoded
    const dnsServers = [
      { id: 'cloudflare', ip: '1.1.1.1' },
      { id: 'google', ip: '8.8.8.8' },
      { id: 'quad9', ip: '9.9.9.9' },
      { id: 'opendns', ip: '208.67.222.222' },
      { id: 'adguard', ip: '94.140.14.14' }
    ];
    
    const results = await Promise.all(dnsServers.map(s => this._testSingleDns(s.ip, s.id)));
    
    return results.sort((a, b) => {
      if (a.latency === null) return 1;
      if (b.latency === null) return -1;
      return a.latency - b.latency;
    });
  },

  async flushDnsCache() {
    try {
      // Exclusivo Windows
      await execAsync('ipconfig /flushdns', { windowsHide: true, timeout: 4000 });
      return true;
    } catch (e) {
      return false;
    }
  }
};

export default NetworkService;