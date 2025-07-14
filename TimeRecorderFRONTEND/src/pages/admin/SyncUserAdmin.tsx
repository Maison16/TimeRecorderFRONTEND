import React, { useState } from "react";
import axios from "axios";
import { apiURL } from "../../config";
import { Button, Modal, Alert, Spinner } from "react-bootstrap";

const SyncUsersAdmin: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
      <Button
        variant="primary"
        onClick={() => setShowConfirm(true)}
        disabled={syncing}
      >
        Synchronize Users
      </Button>
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