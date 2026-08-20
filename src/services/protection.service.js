//import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Função auxiliar para rodar comandos do PowerShell
async function runPowerShell(command) {
    try {
        const { stdout } = await execAsync(`Powershell -NoProfile -Command "${command}"`, { encoding: 'utf8' });
        return stdout.trim();
    } catch (error) {
        console.error("Erro no PowerShell:", error);
        return null;
    }
}

async function getSecurityStatus() {
    try {
        // 1. Versão e Build do Windows
        const build = await runPowerShell("(Get-CimInstance Win32_OperatingSystem).BuildNumber");
        const caption = await runPowerShell("(Get-CimInstance Win32_OperatingSystem).Caption");
        // 2. Data da última atualização instalada
        const lastUpdate = await runPowerShell("(Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 1).InstalledOn");
        // 3. Antivírus registrados no Windows Security Center
        const avQuery = `Get-CimInstance -Namespace root\\SecurityCenter2 -ClassName AntivirusProduct | Select-Object displayName, productState`;
        const avOutput = await runPowerShell(`ConvertTo-Json @(${avQuery})`);
        
        let antivirusList = [];
        if (avOutput) {
            try {
                const parsedAv = JSON.parse(avOutput);
                const avArray = Array.isArray(parsedAv) ? parsedAv : [parsedAv];
                antivirusList = avArray.map(av => ({
                    name: av.displayName || '-',
                    enabled: true // Se listado no SecurityCenter2, está ativo/registrado
                }));
            } catch (e) {
                console.error("Erro ao parsear antivírus:", e);
            }
        }

        // 4. Status do Firewall do Windows
        const fwOutput = await runPowerShell(`ConvertTo-Json (Get-NetFirewallProfile | Select-Object Name, Enabled)`);
        let firewallStatus = [];
        if (fwOutput) {
            try {
                const parsedFw = JSON.parse(fwOutput);
                firewallStatus = Array.isArray(parsedFw) ? parsedFw : [parsedFw];
            } catch (e) {
                console.error("Erro ao parsear firewall:", e);
            }
        }

        return {
            success: true,
            os: {
                name: caption || 'Windows',
                build: build || '-',
                lastUpdate: lastUpdate || '-'
            },
            antivirus: antivirusList,
            firewall: firewallStatus
        };

    } catch (error) {
        console.error("Erro no serviço de segurança:", error);
        return { success: false, os: null, antivirus: [], firewall: [] };
    }
}

const ProtectionService = {
    getSecurityStatus
}

export default ProtectionService;   