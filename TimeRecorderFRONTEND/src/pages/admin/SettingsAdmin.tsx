import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiURL } from "../../config";
import { Button, Modal, Alert, Spinner } from "react-bootstrap";
import { Settings } from "../../interfaces/types";
import { SyncFrequency } from "../../enums/SuncFrequency";
import { SyncDayOfWeek } from "../../enums/SyncDayOfWeek";

const SyncUsersAdmin: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const res = await axios.get(`${apiURL}/api/Settings`, { withCredentials: true });
        setSettings(res.data);
      } catch {
        setSettings(null);
      }
      setSettingsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSettingsChange = (field: keyof Settings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSettingsSave = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      await axios.put(`${apiURL}/api/Settings`, settings, { withCredentials: true });
      alert("Settings saved!");
    } catch {
      alert("Error saving settings!");
    }
    setSettingsSaving(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await axios.post(`${apiURL}/api/User/sync`, {}, { withCredentials: true });
      setResult(res.data);
    } catch (err: any) {
      setResult("Error during synchronization.");
    } finally {
      setSyncing(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="container pt-5" style={{ maxWidth: 600 }}>
      <h2 className="mb-4 text-center">Synchronize Users</h2>
      <div className="d-flex justify-content-center mb-3 gap-2">
        <Button
          variant="primary"
          onClick={() => setShowConfirm(true)}
          disabled={syncing}
        >
          Synchronize Users
        </Button>
        <Button
          variant="warning"
          onClick={async () => {
            try {
              const res = await axios.post(
                `${apiURL}/api/WorkLog/auto-close-breaks`,
                {},
                {
                  params: { maxBreakMinutes: settings?.maxBreakTime ?? 30 },
                  withCredentials: true,
                }
              );
              alert(res.data);
            } catch {
              alert("Error auto-closing breaks!");
            }
          }}
          disabled={settingsLoading || settingsSaving}
        >
          Close Breaks After Max Time
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            try {
              const res = await axios.post(
                `${apiURL}/api/WorkLog/auto-mark-unfinished`,
                {},
                {
                  params: { maxWorkHours: settings?.maxWorkHoursDuringOneDay ?? 10 },
                  withCredentials: true,
                }
              );
              alert(res.data);
            } catch {
              alert("Error auto-marking unfinished work logs!");
            }
          }}
          disabled={settingsLoading || settingsSaving}
        >
          Mark WorkLogs After Max Hours
        </Button>
      </div>
      {/* --- PANEL USTAWIEŃ --- */}
      <div className="card p-3 mb-4">
        <h4>Synchronization Settings</h4>
        {settingsLoading ? (
          <Spinner animation="border" size="sm" />
        ) : settings ? (
          <>
            <div className="mb-2">
              <label>Sync Frequency</label>
              <select
                className="form-select"
                value={settings.syncUsersFrequency}
                onChange={e => handleSettingsChange("syncUsersFrequency", Number(e.target.value))}
              >
                <option value={SyncFrequency.Daily}>Daily</option>
                <option value={SyncFrequency.Weekly}>Weekly</option>
              </select>
            </div>
            <div className="mb-2">
              <label>Sync Hour (0-23)</label>
              <input
                type="number"
                min={0}
                max={23}
                className="form-control"
                value={settings.syncUsersHour}
                onChange={e => {
                  const val = Math.max(0, Math.min(23, Number(e.target.value)));
                  handleSettingsChange("syncUsersHour", val);
                }}
              />
            </div>
            {settings.syncUsersFrequency === SyncFrequency.Weekly && (
              <div className="mb-2">
                <label>Sync Days (choose one or more)</label>
                <div className="d-flex flex-wrap gap-2">
                  {Object.values(SyncDayOfWeek)
                    .filter(v => typeof v === "number")
                    .map((day) => (
                      <label key={day} className="form-check-label me-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={settings.syncUsersDays.includes(day as SyncDayOfWeek)}
                          onChange={e => {
                            const checked = e.target.checked;
                            handleSettingsChange(
                              "syncUsersDays",
                              checked
                                ? [...settings.syncUsersDays, day as SyncDayOfWeek]
                                : settings.syncUsersDays.filter(d => d !== day)
                            );
                          }}
                        />
                        {SyncDayOfWeek[day as SyncDayOfWeek]}
                      </label>
                    ))}
                </div>
              </div>
            )}
            <div className="mb-2">
              <label>Max Break Time (minutes, max 120)</label>
              <input
                type="number"
                min={1}
                max={120}
                className="form-control"
                value={settings.maxBreakTime}
                onChange={e => {
                  const val = Math.max(1, Math.min(120, Number(e.target.value)));
                  handleSettingsChange("maxBreakTime", val);
                }}
              />
            </div>
            <div className="mb-2">
              <label>Max Work Hours During One Day (max 20)</label>
              <input
                type="number"
                min={1}
                max={20}
                className="form-control"
                value={settings.maxWorkHoursDuringOneDay}
                onChange={e => {
                  const val = Math.max(1, Math.min(20, Number(e.target.value)));
                  handleSettingsChange("maxWorkHoursDuringOneDay", val);
                }}
              />
            </div>
            <div className="mb-2">
              <label>Latest Start Moment (hour, 0-23)</label>
              <input
                type="number"
                min={0}
                max={23}
                className="form-control"
                value={settings.latestStartMoment}
                onChange={e => {
                  const val = Math.max(0, Math.min(23, Number(e.target.value)));
                  handleSettingsChange("latestStartMoment", val);
                }}
              />
            </div>
            <Button variant="success" onClick={handleSettingsSave} disabled={settingsSaving}>
              {settingsSaving ? <Spinner animation="border" size="sm" /> : "Save Settings"}
            </Button>
          </>
        ) : (
          <Alert variant="danger">Could not load settings.</Alert>
        )}
      </div>
      {/* --- KONIEC PANELU USTAWIEŃ --- */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Synchronization</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to synchronize users from Microsoft Graph?
            <br />
            <strong>This operation may take several seconds.</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSync} disabled={syncing}>
            {syncing ? <Spinner animation="border" size="sm" /> : "Synchronize"}
          </Button>
        </Modal.Footer>
      </Modal>
      {result && (
        <Alert variant={result.startsWith("Error") ? "danger" : "success"} className="mt-4">
          {result}
        </Alert>
      )}
    </div>
  );
};

export default SyncUsersAdmin;