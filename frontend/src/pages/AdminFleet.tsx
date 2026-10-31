import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, Smartphone, Wifi, WifiOff, BatteryCharging, AlertTriangle, 
  CheckCircle2, RefreshCw, Volume2, Search, 
  ChevronRight, Radio, BellRing
} from 'lucide-react';
import { TaraLogo } from '../components/common/TaraLogo';

interface FleetDevice {
  id: string;
  model_label: string;
  firmware_version: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'PROVISIONING';
  owner_merchant_id?: string | null;
  battery_pct: number;
  signal_dbm: number;
  last_heartbeat: number;
  freshness: string;
  age_seconds: number;
  volume_level?: number;
  audit_trail?: Array<{ time: number; action: string; actor: string; payload?: unknown }>;
  last_announcement?: {
    id: string;
    amount: number;
    status: string;
    ack_latency_ms?: number;
    time?: number;
    reason?: string;
  };
}

interface FleetSummary {
  total: number;
  online: number;
  offline: number;
  degraded: number;
  as_of: string;
}

export const AdminFleet: React.FC = () => {
  const [summary, setSummary] = useState<FleetSummary>({
    total: 2,
    online: 1,
    offline: 1,
    degraded: 0,
    as_of: 'just now'
  });
  const [devices, setDevices] = useState<FleetDevice[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<FleetDevice | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  const fetchFleet = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/devices/fleet');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setDevices(data.devices);
        if (selectedDevice) {
          const updated = data.devices.find((d: FleetDevice) => d.id === selectedDevice.id);
          if (updated) setSelectedDevice(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedDevice]);

  // Polling for live telemetry every 4s
  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 4000);
    return () => clearInterval(interval);
  }, [fetchFleet]);

  const executeCommand = async (deviceId: string, command: string, payload: Record<string, unknown> = {}) => {
    try {
      setCommandFeedback(`Executing ${command} on ${deviceId}...`);
      const res = await fetch(`/api/devices/${deviceId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, payload })
      });
      if (res.ok) {
        setCommandFeedback(`Success: ${command.toUpperCase()} executed on ${deviceId}`);
        fetchFleet();
      } else {
        setCommandFeedback(`Failed: Error executing command`);
      }
    } catch {
      setCommandFeedback(`Network error executing command`);
    } finally {
      setTimeout(() => setCommandFeedback(null), 4000);
    }
  };

  const executeBulkPing = async () => {
    try {
      setCommandFeedback('Broadcasting PING across fleet...');
      await fetch('/api/devices/bulk-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'ping' })
      });
      setCommandFeedback('Bulk PING complete');
      fetchFleet();
    } catch {
      setCommandFeedback('Bulk command failed');
    } finally {
      setTimeout(() => setCommandFeedback(null), 4000);
    }
  };

  const filteredDevices = devices.filter(d => {
    const matchesStatus = filterStatus === 'ALL' || d.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (d.owner_merchant_id && d.owner_merchant_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full text-[#151615] space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-soft-border shadow-xs">
        <div className="flex items-center gap-3">
          <TaraLogo size="md" showSubtitle={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Ops & Fleet Control Plane</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                Rule 35: Demo soundbox (simulated)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time telemetry, WebSocket gateway connection tracking & device state machine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {commandFeedback && (
            <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse font-medium">
              {commandFeedback}
            </div>
          )}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              demoMode 
                ? 'bg-amber-500/10 text-amber-700 border-amber-300' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {demoMode ? '⚡ Demo Mode Active' : 'Normal Ops'}
          </button>
          <button
            onClick={fetchFleet}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-paytm-blue text-white rounded-lg text-xs font-semibold hover:bg-paytm-navy transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Fleet Soundboxes</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">as of {summary.as_of}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Online & Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.online}</div>
          <div className="text-[11px] text-emerald-600/70 mt-1">Heartbeat within SLA (5s)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>Degraded (Weak / Low Batt)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{summary.degraded}</div>
          <div className="text-[11px] text-amber-600/70 mt-1">Battery &lt;20% or &lt;-100dBm</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Offline (Silent)</span>
            <WifiOff className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{summary.offline}</div>
          <div className="text-[11px] text-rose-600/70 mt-1">Timeout &gt;12s without ack</div>
        </div>
      </div>

      {/* Demo Controls Bar */}
      {demoMode && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="text-xs font-bold text-amber-900">Judge / Demo Quick Triggers:</span>
            <span className="text-xs text-amber-700">Simulate physical field conditions instantly across the fleet</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={executeBulkPing}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-xs"
            >
              Broadcast Fleet Ping
            </button>
            <button
              onClick={() => executeCommand('SB-DEMO-7701', 'force_offline')}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold shadow-xs"
            >
              Force SB-DEMO-7701 Offline
            </button>
            <button
              onClick={() => executeCommand('SB-DEMO-7701', 'toggle_battery', { battery_pct: 14 })}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold shadow-xs"
            >
              Simulate 14% Battery (Degraded)
            </button>
            <button
              onClick={() => executeCommand('SB-DEMO-7701', 'test_announcement', { amount: 500 })}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold shadow-xs"
            >
              Send ₹500 Announcement
            </button>
          </div>
        </div>
      )}

      {/* Main Table and Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Table Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Table Filters */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Device or Merchant ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-paytm-blue"
              />
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto">
              {(['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    filterStatus === st 
                      ? 'bg-paytm-blue text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Device ID / Model</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Battery (Simulated)</th>
                  <th className="px-4 py-3">Signal (Simulated)</th>
                  <th className="px-4 py-3">Freshness</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map(dev => {
                  const isSelected = selectedDevice?.id === dev.id;
                  return (
                    <tr 
                      key={dev.id}
                      onClick={() => setSelectedDevice(dev)}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 border-l-4 border-l-paytm-blue' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{dev.id}</div>
                        <div className="text-[10px] text-slate-400">{dev.model_label}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          dev.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' :
                          dev.status === 'DEGRADED' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            dev.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' :
                            dev.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {dev.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {dev.owner_merchant_id || <span className="text-slate-400 italic">Unclaimed</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <BatteryCharging className={`w-3.5 h-3.5 ${
                            dev.battery_pct < 20 ? 'text-rose-500' : 'text-emerald-500'
                          }`} />
                          <span className="font-semibold">{dev.battery_pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Wifi className={`w-3.5 h-3.5 ${
                            dev.signal_dbm < -95 ? 'text-rose-500' : 'text-blue-500'
                          }`} />
                          <span>{dev.signal_dbm} dBm</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {dev.age_seconds > 60 ? (
                          <span className="text-rose-600 font-medium">Stale ({Math.round(dev.age_seconds)}s ago)</span>
                        ) : (
                          dev.freshness
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedDevice(dev);
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Device Detail & Command Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col space-y-5">
          {selectedDevice ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-paytm-blue" />
                    <h2 className="font-bold text-slate-900 text-base">{selectedDevice.id}</h2>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedDevice.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' :
                    selectedDevice.status === 'DEGRADED' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedDevice.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedDevice.model_label}</p>
                <p className="text-[11px] text-slate-400">Firmware: {selectedDevice.firmware_version}</p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Device Commands</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => executeCommand(selectedDevice.id, 'ping')}
                    className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-blue-500" />
                    Ping Unit
                  </button>
                  <button
                    onClick={() => executeCommand(selectedDevice.id, 'test_announcement', { amount: 150 })}
                    className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                    Test Sound (₹150)
                  </button>
                  <button
                    onClick={() => executeCommand(selectedDevice.id, 'restart_request')}
                    className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                    Restart Request
                  </button>
                  <button
                    onClick={() => executeCommand(selectedDevice.id, 'force_offline')}
                    className="flex items-center justify-center gap-1.5 p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-medium text-rose-700 transition-colors"
                  >
                    <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                    Force Offline
                  </button>
                </div>
              </div>

              {/* Announcement Pipeline Status */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Last Announcement Status</span>
                  <BellRing className="w-3.5 h-3.5 text-paytm-blue" />
                </div>
                {selectedDevice.last_announcement ? (
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <span className="font-bold text-slate-900">₹{selectedDevice.last_announcement.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Outcome:</span>
                      <span className={`font-semibold ${
                        selectedDevice.last_announcement.status === 'Announced' 
                          ? 'text-emerald-600' 
                          : 'text-rose-600'
                      }`}>
                        {selectedDevice.last_announcement.status}
                      </span>
                    </div>
                    {selectedDevice.last_announcement.ack_latency_ms && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">ACK Latency:</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {selectedDevice.last_announcement.ack_latency_ms} ms
                        </span>
                      </div>
                    )}
                    {selectedDevice.last_announcement.reason && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Failure Reason:</span>
                        <span className="font-mono text-rose-600">
                          {selectedDevice.last_announcement.reason}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No announcements recorded yet</div>
                )}
              </div>

              {/* Audit Log Trail */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-48">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Device Audit Log</h3>
                <div className="space-y-1.5 text-[11px]">
                  {selectedDevice.audit_trail?.slice(-5).reverse().map((entry, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">{entry.action}</span>
                        <div className="text-slate-400 text-[10px]">Actor: {entry.actor}</div>
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(entry.time * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Smartphone className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs">Select any soundbox from the fleet table to inspect telemetry and issue commands.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
