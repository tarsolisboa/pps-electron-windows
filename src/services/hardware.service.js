import { exec } from 'child_process';
import { promisify } from 'util';

const si = eval('require')('systeminformation');
const execAsync = promisify(exec);

const HardwareService = {
    async getDetailedHardwareInfo() {
        try {
            const [cpu, mem, baseboard, bios, osInfo, audio, network, graphics] = await Promise.all([
                si.cpu(),
                si.mem(),
                si.baseboard(),
                si.bios(),
                si.osInfo(),
                si.audio(),
                si.networkInterfaces(),
                si.graphics()
            ]);

            let gpus = [];
            let memorySticks = [];
            let storageGroups = [];
            let opticalDrives = [];
            let directxVersion = '12';

            try {
                // 1. GPU: Leitura avançada com Chipset, DAC e Display Settings
                const gpuCmd = `powershell -NoProfile -Command "$gpus = Get-CimInstance Win32_VideoController; $res = foreach ($g in $gpus) { $vram = [int64]$g.AdapterRAM; $driverVer = $g.DriverVersion; if ($g.PNPDeviceID) { $path1 = 'HKLM:\\SYSTEM\\ControlSet001\\Enum\\' + $g.PNPDeviceID; $drv = (Get-ItemProperty -LiteralPath $path1 -Name 'Driver' -EA 0).Driver; if ($drv) { $path2 = 'HKLM:\\SYSTEM\\ControlSet001\\Control\\Class\\' + $drv; $reg = Get-ItemProperty -LiteralPath $path2 -EA 0; if ($null -ne $reg.DriverVersion) { $driverVer = $reg.DriverVersion } if ($null -ne $reg.'HardwareInformation.qwMemorySize') { $vram = [int64]$reg.'HardwareInformation.qwMemorySize' } elseif ($null -ne $reg.'HardwareInformation.MemorySize') { $mem = $reg.'HardwareInformation.MemorySize'; if ($mem -is [byte[]]) { if ($mem.Length -ge 8) { $vram = [System.BitConverter]::ToInt64($mem, 0) } elseif ($mem.Length -ge 4) { $vram = [System.BitConverter]::ToUInt32($mem, 0) } } else { $vram = [int64]$mem } } } }; [PSCustomObject]@{ Name=$g.Name; DriverVersion=$driverVer; RAM=$vram; Chipset=$g.VideoProcessor; DACType=$g.AdapterDACType; ResX=$g.CurrentHorizontalResolution; ResY=$g.CurrentVerticalResolution; Refresh=$g.CurrentRefreshRate } }; $res | ConvertTo-Json -Compress"`;
                
                const { stdout: gpuStdout } = await execAsync(gpuCmd, { shell: 'cmd.exe', encoding: 'utf-8', timeout: 5000 });
                if (gpuStdout.trim()) {
                    const parsed = JSON.parse(gpuStdout);
                    const list = Array.isArray(parsed) ? parsed : [parsed];
                    gpus = list.filter(g => g.Name).map(g => ({
                        model: g.Name || null,
                        driverVersion: g.DriverVersion || null,
                        vramBytes: g.RAM && g.RAM > 0 ? g.RAM : 0,
                        chipset: g.Chipset || null,
                        dacType: g.DACType || null,
                        resolution: g.ResX && g.ResY ? `${g.ResX} x ${g.ResY}` : null,
                        refreshRate: g.Refresh ? `${g.Refresh} Hz` : null
                    }));
                }
            } catch (e) {}

            if (gpus.length === 0 && graphics && graphics.controllers) {
                gpus = graphics.controllers.map(gpu => ({
                    model: gpu.model || gpu.name || null,
                    driverVersion: gpu.driverVersion || null,
                    vramBytes: gpu.vram ? gpu.vram * 1024 * 1024 : (gpu.memoryTotal ? gpu.memoryTotal * 1024 * 1024 : 0),
                    chipset: null,
                    dacType: null,
                    resolution: null,
                    refreshRate: null
                }));
            }

            try {
                // 2. Pentes de RAM
                const ramCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity, Manufacturer, SerialNumber, Speed | ConvertTo-Json -Compress"`;
                const { stdout: ramStdout } = await execAsync(ramCmd, { shell: 'cmd.exe', encoding: 'utf-8', timeout: 5000 });
                if (ramStdout.trim()) {
                    const parsed = JSON.parse(ramStdout);
                    const list = Array.isArray(parsed) ? parsed : [parsed];
                    memorySticks = list.map(stick => ({
                        sizeBytes: parseInt(stick.Capacity, 10) || 0,
                        clockSpeed: stick.Speed || 0,
                        manufacturer: stick.Manufacturer?.trim() || null,
                        serialNum: stick.SerialNumber?.trim() && stick.SerialNumber.trim() !== '00000000' ? stick.SerialNumber.trim() : null
                    }));
                }
            } catch (e) {}

            try {
                // 3. Armazenamento
                const diskCmd = `powershell -NoProfile -Command "$disks = Get-Disk; $partitions = Get-Partition; $volumes = Get-Volume; $res = foreach ($d in $disks) { $parts = $partitions | Where-Object { $_.DiskNumber -eq $d.Number -and $_.DriveLetter }; $vols = foreach ($p in $parts) { $volumes | Where-Object { $_.DriveLetter -eq $p.DriveLetter } }; [PSCustomObject]@{ Model = $d.Model; Manufacturer = $d.Manufacturer; SerialNumber = $d.SerialNumber; Size = [int64]$d.Size; BusType = $d.BusType; Partitions = $vols | Select-Object DriveLetter, FileSystem, @{N='Size';E={[int64]$_.Size}}, @{N='FreeSpace';E={[int64]$_.SizeRemaining}} } }; $res | ConvertTo-Json -Depth 4 -Compress"`;
                
                const { stdout: diskStdout } = await execAsync(diskCmd, { shell: 'cmd.exe', encoding: 'utf-8', timeout: 8000 });
                if (diskStdout.trim()) {
                    const parsed = JSON.parse(diskStdout);
                    const list = Array.isArray(parsed) ? parsed : [parsed];

                    storageGroups = list.map(item => {
                        let type = item.BusType || 'SATA';
                        if (type.toUpperCase() === 'NVME') type = 'NVMe';

                        let rawParts = [];
                        if (item.Partitions) {
                            rawParts = Array.isArray(item.Partitions) ? item.Partitions : [item.Partitions];
                        }

                        const partitions = rawParts.filter(p => p && p.DriveLetter).map(p => {
                            const total = p.Size || 0;
                            const free = p.FreeSpace || 0;
                            const used = total - free;
                            return {
                                mount: `${p.DriveLetter}:`,
                                fileSystem: p.FileSystem || 'NTFS',
                                totalBytes: total,
                                usedBytes: used,
                                availableBytes: free,
                                usePercent: total > 0 ? Math.round((used / total) * 100) : 0
                            };
                        });

                        return {
                            name: item.Model || 'Disco Local',
                            vendor: item.Manufacturer?.trim() || null,
                            serialNum: item.SerialNumber?.trim() || null,
                            sizeBytes: item.Size || 0,
                            interfaceType: type,
                            partitions: partitions
                        };
                    });
                }
            } catch (e) {}

            if (storageGroups.length === 0) {
                try {
                    const logicalList = await si.fsSize();
                    const diskList = await si.diskLayout();
                    storageGroups = diskList.map(disk => ({
                        name: disk.name || disk.model || 'Armazenamento',
                        vendor: disk.vendor || null,
                        serialNum: disk.serialNum || null,
                        sizeBytes: disk.size || 0,
                        interfaceType: disk.interfaceType || disk.type || 'SATA',
                        partitions: logicalList.map(l => ({
                            mount: l.mount,
                            fileSystem: l.type || 'NTFS',
                            totalBytes: l.size,
                            usedBytes: l.used,
                            availableBytes: l.available,
                            usePercent: l.use || 0
                        }))
                    }));
                } catch (e) {}
            }

            try {
                // 4. CD/DVD
                const cdCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_CDROMDrive | Select-Object Name, Drive, SerialNumber | ConvertTo-Json -Compress"`;
                const { stdout: cdStdout } = await execAsync(cdCmd, { shell: 'cmd.exe', encoding: 'utf-8', timeout: 4000 });
                if (cdStdout.trim()) {
                    const parsed = JSON.parse(cdStdout);
                    const list = Array.isArray(parsed) ? parsed : [parsed];
                    opticalDrives = list.map(c => ({
                        mount: c.Drive || null,
                        name: c.Name || 'Unidade de CD/DVD',
                        serialNum: c.SerialNumber?.trim() || null
                    }));
                }
            } catch (e) {}

            try {
                // 5. Versão do DirectX
                const dxCmd = `powershell -NoProfile -Command "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\DirectX').Version"`;
                const { stdout: dxStdout } = await execAsync(dxCmd, { shell: 'cmd.exe', encoding: 'utf-8', timeout: 3000 });
                if (dxStdout.trim()) {
                    directxVersion = dxStdout.trim();
                }
            } catch (e) {}

            const cpuInfo = {
                manufacturer: cpu.manufacturer || null,
                brand: cpu.brand || null,
                family: cpu.family || null,
                model: cpu.model || null,
                speedGHz: cpu.speed || 0,
                cores: cpu.physicalCores || cpu.cores || 0,
                threads: cpu.cores || cpu.processors || 0
            };

            const audioDevices = (audio || []).map(aud => ({
                name: aud.name || null,
                manufacturer: aud.manufacturer || null,
                driver: aud.driver || null
            }));

            // Filtra adaptadores de rede, removendo loopbacks (127.0.0.1) e virtuais desconectados
            const networkCards = (network || [])
                .filter(net => net.ip4 && net.ip4 !== '127.0.0.1' && net.mac && net.mac !== '00:00:00:00:00:00')
                .map(net => ({
                    name: net.ifaceName || net.iface || 'Adaptador de Rede',
                    ip4: net.ip4 || null,
                    mac: net.mac || null,
                    type: net.type || 'Ethernet/Wi-Fi',
                    speed: net.speed ? `${net.speed} Mbps` : null
                }));

            return {
                cpu: cpuInfo,
                memory: {
                    totalBytes: mem.total || 0,
                    freeBytes: mem.free || 0,
                    usedBytes: mem.used || 0,
                    sticks: memorySticks
                },
                motherboard: {
                    manufacturer: baseboard.manufacturer || null,
                    model: baseboard.model || null,
                    version: baseboard.version || null,
                    serial: baseboard.serial || null
                },
                bios: {
                    vendor: bios.vendor || null,
                    version: bios.version || null,
                    releaseDate: bios.releaseDate || null,
                    serial: bios.serial || null
                },
                os: {
                    platform: osInfo.platform || 'Windows',
                    release: osInfo.release || null,
                    build: osInfo.build || null,
                    directx: directxVersion
                },
                gpus,
                storageGroups,
                opticalDrives,
                audioDevices,
                networkCards
            };
        } catch (error) {
            console.error('[HardwareService] Erro:', error);
            return null;
        }
    }
};

export default HardwareService;