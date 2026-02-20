import os
import sys
import datetime
import traceback
import json
import shutil
import tempfile
import pyodbc 
import io
import time
import threading
import logging
import hashlib
from dotenv import load_dotenv

# --- LIBRARIES CHECK ---
try:
    import win32com.client
    import pythoncom
    HAS_DAO = True
except ImportError:
    HAS_DAO = False

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    HAS_GOOGLE = True
except ImportError:
    HAS_GOOGLE = False

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    from google.api_core import exceptions as google_exceptions
    HAS_FIREBASE = True
except ImportError:
    HAS_FIREBASE = False

# --- LOGGING SETUP ---
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bridge.log')

# Reset log if larger than 5MB
if os.path.exists(log_file) and os.path.getsize(log_file) > 5 * 1024 * 1024:
    try: os.remove(log_file)
    except: pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

class BridgeLogic:
    def __init__(self):
        logging.info("Initializing Bridge Logic...")
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Load Env
        env_path = os.path.join(self.project_root, '.env')
        load_dotenv(env_path if os.path.exists(env_path) else None)
        
        # Paths
        self.db_path = os.getenv('ACCESS_DB_PATH')
        self.creds_path = os.path.abspath(os.path.join(os.path.dirname(__file__), os.getenv('GOOGLE_CLIENT_SECRET', 'credentials.json')))
        self.token_path = os.path.join(os.path.dirname(self.creds_path), 'token.json')
        self.state_file = os.path.join(os.path.dirname(__file__), 'sync_state.json')
        
        # Config
        self.target_table = "DATA AGENDA SURAT MASUK 2025"
        self.target_year = 2025
        self.drive_folder_id = os.getenv('GOOGLE_DRIVE_FOLDER_ID')
        
        # Init Services
        self.drive_service = self._init_drive() if HAS_GOOGLE else None
        self.firestore_db = self._init_firestore() if HAS_FIREBASE else None
        
        self.processed_state = self._load_state()
        
        # Validation
        if not self.firestore_db:
            logging.error("Firestore DB not initialized. Check serviceAccountKey.json")
        if not self.drive_service:
            logging.error("Google Drive API not initialized. Check credentials.json")
            
        # Initial Status
        self.update_bridge_status("healthy")

    def _init_firestore(self):
        try:
            if firebase_admin._apps: return firestore.client()
            key_path = os.getenv('FIREBASE_SERVICE_ACCOUNT', 'serviceAccountKey.json')
            if not os.path.isabs(key_path):
                key_path = os.path.abspath(os.path.join(os.path.dirname(__file__), key_path))
            
            if not os.path.exists(key_path):
                logging.error(f"Firebase Key Missing: {key_path}")
                return None

            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
            return firestore.client()
        except Exception as e:
            logging.error(f"Firestore Auth Failed: {e}")
            return None

    def _init_drive(self):
        try:
            SCOPES = ['https://www.googleapis.com/auth/drive']
            creds = None
            if os.path.exists(self.token_path):
                creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
            
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not os.path.exists(self.creds_path):
                        logging.error(f"Google Credentials Missing: {self.creds_path}")
                        return None
                    flow = InstalledAppFlow.from_client_secrets_file(self.creds_path, SCOPES)
                    creds = flow.run_local_server(port=0)
                with open(self.token_path, 'w') as token:
                    token.write(creds.to_json())

            return build('drive', 'v3', credentials=creds)
        except Exception as e:
            logging.error(f"Drive Auth Failed: {e}")
            return None

    def _load_state(self):
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f: return json.load(f)
            except: return {}
        return {}

    def _save_state(self):
        try:
            with open(self.state_file, 'w') as f: json.dump(self.processed_state, f, indent=2)
        except: pass

    def update_bridge_status(self, status, error=None):
        """Update Firestore heartbeat with resilience."""
        if not self.firestore_db: return
        try:
            doc_ref = self.firestore_db.collection('config').document('system')
            data = {
                'syncStatus': status,
                'lastActive': firestore.SERVER_TIMESTAMP,
            }
            if error: data['lastError'] = str(error)
            elif status == "healthy": data['lastError'] = None
            
            # Use set with merge to ensure doc exists
            doc_ref.set(data, merge=True)
            logging.info(f"Heartbeat: {status.upper()}")
            
            if error:
                self.log_event(f"System Error: {error}", "error")
        except google_exceptions.PermissionDenied:
            logging.error("Firestore Permission Denied! Check Security Rules.")
        except Exception as e:
            logging.warning(f"Heartbeat Failed: {e}")

    def log_event(self, message, level="info"):
        """Log event to local file and Firestore audit_logs."""
        logging.info(f"[{level.upper()}] {message}")
        if not self.firestore_db: return
        try:
            self.firestore_db.collection('audit_logs').add({
                'message': message,
                'level': level,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'userName': 'BRIDGE_ENGINE'
            })
        except Exception as e:
            logging.warning(f"Failed to write audit log to Firestore: {e}")

    def sync_config(self):
        """Read configuration from Firestore."""
        if not self.firestore_db: return
        try:
            logging.info("  [FS] Fetching system config...")
            doc_ref = self.firestore_db.collection('config').document('system')
            # Add timeout to avoid hanging threads
            doc = doc_ref.get(timeout=15)
            data = doc.to_dict()
            if data:
                self.db_path = data.get('accessDbPath', self.db_path)
                self.drive_folder_id = data.get('driveFolderId', self.drive_folder_id)
                self.target_year = int(data.get('targetYear', self.target_year))
                logging.info(f"  [FS] Config sync: OK. DB Path: {self.db_path}")
            else:
                logging.warning("  [FS] Config document not found.")
        except Exception as e:
            logging.warning(f"  [FS] Config sync failed: {e}")

    def _calculate_hash(self, data_dict):
        """Create a digital fingerprint of the record to detect changes."""
        # Clean data for consistent hashing (exclude volatile fields)
        d = {k: v for k, v in data_dict.items() if k not in ['lastSyncAt', 'ts']}
        d_str = json.dumps(d, sort_keys=True, default=str)
        return hashlib.md5(d_str.encode('utf-8')).hexdigest()

    def perform_sync(self):
        """Core sync logic."""
        sync_start = time.time()
        logging.info("--- Sync Cycle Started ---")
        
        # Initialize COM for this thread
        if HAS_DAO:
            logging.info("Initializing COM (CoInitialize)...")
            pythoncom.CoInitialize()
            logging.info("COM Initialized.")
            
        try:
            # Note: self.sync_config() is handled by main thread loop
            
            if not self.db_path or not os.path.exists(self.db_path):
                logging.error(f"Database not found: {self.db_path}")
                self.update_bridge_status("healthy", error=f"Missing DB: {self.db_path}")
                return

            # Copy Database to temp to avoid locks
            temp_db = os.path.join(tempfile.gettempdir(), f"MTP_Sync_{int(time.time())}.accdb")
            logging.info(f"Copying DB to: {temp_db}")
            try:
                shutil.copy2(self.db_path, temp_db)
                logging.info("DB Copying Successful.")
            except Exception as e:
                logging.error(f"DB Copy Failed: {e}")
                self.update_bridge_status("healthy", error=f"Copy Error: {e}")
                return

            try:
                logging.info("Initializing DB Engines (DAO/ODBC)...")
                self._process_database(temp_db)
                self.log_event(f"Sync Cycle Completed successfully in {time.time() - sync_start:.2f}s", "info")
            except Exception as e:
                logging.error(f"Processing Error: {e}")
                traceback.print_exc()
                self.update_bridge_status("healthy", error=f"Process Error: {e}")
            finally:
                if HAS_DAO:
                    pythoncom.CoUninitialize()
                if os.path.exists(temp_db):
                    try: os.remove(temp_db)
                    except: pass
        except Exception as e:
            logging.critical(f"Fatal Sync Error: {e}")

    def _process_database(self, db_path):
        """Internal processing logic."""
        conn = None
        dao_db = None
        all_records = []
        
        # Init DAO
        if HAS_DAO:
            try:
                try: dao_engine = win32com.client.Dispatch("DAO.DBEngine.160")
                except: dao_engine = win32com.client.Dispatch("DAO.DBEngine.120")
                dao_db = dao_engine.OpenDatabase(db_path)
            except Exception as e:
                logging.warning(f"DAO Init Failed: {e}")

        # Init ODBC
        try:
            conn_str = r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=" + db_path + ";ReadOnly=1;"
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
        except Exception as e:
            logging.error(f"ODBC Connect Failed: {e}")
            raise

        # Fetch Table
        try:
            self.log_event(f"Scanning table: [{self.target_table}]", "info")
            cursor.execute(f"SELECT * FROM [{self.target_table}]")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
        except Exception as e:
            logging.error(f"Table Read Failed: {self.target_table}")
            raise

        stats = {"added": 0, "updated": 0, "skipped": 0}
        
        for row in rows:
            data = {}
            for i, col in enumerate(columns):
                val = row[i]
                if isinstance(val, (datetime.date, datetime.datetime)): val = val.isoformat()
                if isinstance(val, (bytes, bytearray)): val = "[BINARY]"
                data[col] = val
            
            no_urut = data.get('NO URUT')
            if no_urut is None: continue
            
            doc_id = f"{no_urut}-{self.target_year}"
            data['id'] = doc_id
            data['year'] = self.target_year
            
            # 1. Check existing state for hashing
            cached = self.processed_state.get(doc_id, {})
            current_hash = self._calculate_hash(data)
            
            # Attachments Management
            attachments = []
            if cached.get('uploaded') and 'attachments' in cached:
                attachments = cached['attachments']
            elif dao_db:
                try:
                    attachments = self._extract_attachments(dao_db, no_urut)
                except Exception as e:
                    logging.warning(f"Attachments Error [Rec {no_urut}]: {e}")
            
            data['attachments'] = attachments
            data['attachment_link'] = ", ".join([a.get('driveViewLink', '') for a in attachments])

            # ALWAYS add to all_records for JSON backup (Fail-safe)
            all_records.append(data)

            # 2. Smart Sync: Only write if hash changed OR never uploaded
            if cached.get('hash') != current_hash or not cached.get('uploaded'):
                if self.firestore_db:
                    try:
                        self.firestore_db.collection('surat_masuk').document(doc_id).set(data, merge=True)
                        action = "updated" if cached.get('uploaded') else "added"
                        stats[action] += 1
                    except Exception as e:
                        logging.warning(f"Firestore Write Failed [Rec {no_urut}]: {e}")
                        continue
                
                # Update Local State
                self.processed_state[doc_id] = {
                    'uploaded': True,
                    'hash': current_hash,
                    'attachments': attachments,
                    'ts': str(datetime.datetime.now())
                }
            else:
                stats["skipped"] += 1
            
            if (stats["added"] + stats["updated"] + stats["skipped"]) % 100 == 0:
                total = stats["added"] + stats["updated"] + stats["skipped"]
                logging.info(f"Progress: {total} records scanned...")

        self._save_state()
        logging.info(f"Sync Results: {stats['added']} added, {stats['updated']} updated, {stats['skipped']} skipped (unchanged).")

        # Backup JSON (Always update as it's a single file write)
        json_path = os.path.join(os.path.dirname(__file__), 'latest_data.json')
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(all_records, f, ensure_ascii=False, indent=2)
            dl_link, dl_id = self._upload_simple_file(json_path, f"latest_data_{self.target_year}.json")
            
            if self.firestore_db:
                self.firestore_db.collection('config').document('system').update({
                    'backup_json_url': dl_link,
                    'backup_json_id': dl_id,
                    'syncStatus': 'healthy',
                    'lastSyncAt': firestore.SERVER_TIMESTAMP,
                    'lastActive': firestore.SERVER_TIMESTAMP,
                    'lastError': None
                })
        except Exception as e:
            logging.error(f"Backup Upload Failed: {e}")

        if conn: conn.close()
        if dao_db: dao_db.Close()

    def _extract_attachments(self, dao_db, no_urut):
        results = []
        try:
            query = f"SELECT [LAMPIRAN SURAT] FROM [{self.target_table}] WHERE [NO URUT] = '{no_urut}'"
            rs = dao_db.OpenRecordset(query)
            if not rs.EOF:
                child_rs = rs.Fields("LAMPIRAN SURAT").Value
                while not child_rs.EOF:
                    fname = child_rs.Fields("FileName").Value
                    smart_name = f"{self.target_year}_{no_urut}_{fname}"
                    
                    # Check Cache/Existing
                    existing = self._check_drive_file(smart_name)
                    if existing:
                        results.append({
                            'fileName': fname,
                            'driveViewLink': f"https://drive.google.com/uc?export=download&id={existing['id']}",
                            'driveFileId': existing['id']
                        })
                    else:
                        temp_dir = os.path.join(os.path.dirname(__file__), 'temp_att')
                        if not os.path.exists(temp_dir): os.makedirs(temp_dir)
                        path = os.path.join(temp_dir, smart_name)
                        child_rs.Fields("FileData").SaveToFile(path)
                        
                        if os.path.exists(path):
                            res = self._upload_to_drive(path, smart_name)
                            if res:
                                results.append({
                                    'fileName': fname,
                                    'driveViewLink': res['link'],
                                    'driveFileId': res['id']
                                })
                            try: os.remove(path)
                            except: pass
                    child_rs.MoveNext()
            rs.Close()
        except: pass
        return results

    def _check_drive_file(self, name):
        if not self.drive_service: return None
        try:
            q = f"name = '{name}' and trashed = false"
            if self.drive_folder_id: q += f" and '{self.drive_folder_id}' in parents"
            res = self.drive_service.files().list(q=q, fields="files(id)").execute()
            files = res.get('files', [])
            return files[0] if files else None
        except: return None

    def _upload_to_drive(self, path, name):
        if not self.drive_service: return None
        try:
            meta = {'name': name}
            if self.drive_folder_id: meta['parents'] = [self.drive_folder_id]
            media = MediaFileUpload(path, resumable=True)
            f = self.drive_service.files().create(body=meta, media_body=media, fields='id').execute()
            fid = f.get('id')
            self.drive_service.permissions().create(fileId=fid, body={'type': 'anyone', 'role': 'reader'}).execute()
            return {'id': fid, 'link': f"https://drive.google.com/uc?export=download&id={fid}"}
        except: return None

    def _upload_simple_file(self, path, name):
        if not self.drive_service: return None, None
        try:
            # HARDCODE FIX: Force use of specific ID from ENV to keep link stable & secure
            # This ID must be set in .env as GOOGLE_BACKUP_FILE_ID
            target_id = os.environ.get('GOOGLE_BACKUP_FILE_ID')
            
            existing = None
            if "latest_data" in name and target_id:
                existing = {'id': target_id} 
            else:
                existing = self._check_drive_file(name)

            media = MediaFileUpload(path, resumable=True)
            if existing:
                try:
                    self.drive_service.files().update(fileId=existing['id'], media_body=media).execute()
                    fid = existing['id']
                except Exception as update_err:
                    logging.warning(f"Update failed for hardcoded ID, falling back to create: {update_err}")
                    # Fallback if update fails (e.g. permission lost)
                    meta = {'name': name}
                    if self.drive_folder_id: meta['parents'] = [self.drive_folder_id]
                    f = self.drive_service.files().create(body=meta, media_body=media, fields='id').execute()
                    fid = f.get('id')
            else:
                meta = {'name': name}
                if self.drive_folder_id: meta['parents'] = [self.drive_folder_id]
                f = self.drive_service.files().create(body=meta, media_body=media, fields='id').execute()
                fid = f.get('id')
            
            try: self.drive_service.permissions().create(fileId=fid, body={'type': 'anyone', 'role': 'reader'}).execute()
            except: pass
            
            logging.info(f"Backup JSON uploaded. ID: {fid}")
            return f"https://drive.google.com/uc?export=download&id={fid}", fid
        except Exception as e:
            logging.error(f"Backup Upload Fail: {e}")
            return None, None

    def check_for_signal_file(self):
        if not self.drive_service: return None
        try:
            q = "name = 'sync_signal.txt' and trashed = false"
            if self.drive_folder_id: q += f" and '{self.drive_folder_id}' in parents"
            res = self.drive_service.files().list(q=q, fields="files(id)").execute()
            files = res.get('files', [])
            return files[0]['id'] if files else None
        except: return None

    def delete_drive_file(self, fid):
        try: self.drive_service.files().delete(fileId=fid).execute()
        except: pass

if __name__ == '__main__':
    # Test Run
    b = BridgeLogic()
    b.perform_sync()
