import os
import sys
import threading
import time
import ctypes
import logging
import datetime
from PIL import Image, ImageDraw

# --- PRE-INIT LOGGING ---
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bridge.log')
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (TRAY) %(message)s",
    handlers=[logging.FileHandler(log_file, encoding='utf-8'), logging.StreamHandler(sys.stdout)]
)

# --- DEPENDENCIES CHECK ---
try:
    import pystray
    from bridge_logic import BridgeLogic
except ImportError as e:
    logging.critical(f"Missing Dependencies: {e}")
    sys.exit(1)

# --- SINGLE INSTANCE LOCK ---
def is_already_running():
    kernel32 = ctypes.WinDLL('kernel32')
    mutex = kernel32.CreateMutexW(None, False, "MailTrackerPro_Bridge_Mutex_Global")
    if kernel32.GetLastError() == 183: # ERROR_ALREADY_EXISTS
        return True
    return False

# --- TRAY APP ---
class BridgeTrayApp:
    def __init__(self, bridge=None):
        self.bridge = bridge
        self.running = True
        self.icon = None
        self.last_sync = "Never"
        logging.info(f"Tray Process Started. PID: {os.getpid()}")

    def _create_icon_image(self, status='ok'):
        width, height = 64, 64
        image = Image.new('RGB', (width, height), (255, 255, 255))
        dc = ImageDraw.Draw(image)
        # Gradient background
        color = (0, 102, 204) if status == 'ok' else (255, 102, 0)
        dc.rectangle([0, 0, 64, 64], fill=color)
        # Mail Symbol
        dc.polygon([(10, 20), (54, 20), (32, 40)], fill=(255, 255, 255))
        dc.rectangle([10, 20, 54, 45], outline=(255, 255, 255), width=2)
        return image

    def run_bridge_loop(self):
        """Heartbeat and Signal Listener Loop."""
        logging.info("Bridge loop thread started.")
        
        # Immediate startup sync (background)
        threading.Thread(target=self.safe_sync, daemon=True).start()

        sync_counter = 0

        while self.running:
            try:
                if not self.bridge:
                    try: 
                        self.bridge = BridgeLogic()
                        logging.info("Bridge logic re-initialized.")
                    except: 
                        time.sleep(30)
                        continue

                # 1. Sync Config from Firestore (Remote control)
                self.bridge.sync_config()

                # 2. Heartbeat (Status report)
                self.bridge.update_bridge_status("healthy")
                
                # 3. Check Signal (Triggered from Web)
                sig_id = self.bridge.check_for_signal_file()
                if sig_id:
                    logging.info(f"Sync Signal Received: {sig_id}")
                    self.bridge.delete_drive_file(sig_id)
                    threading.Thread(target=self.safe_sync, daemon=True).start()
                    sync_counter = 0 # Reset counter if signaled

                # 4. Periodic Sync (Every 10 minutes / 10 cycles)
                sync_counter += 1
                if sync_counter >= 10:
                    logging.info("Periodic sync triggered (10m interval).")
                    threading.Thread(target=self.safe_sync, daemon=True).start()
                    sync_counter = 0

                # Sleep 60s but check running flag
                for _ in range(60):
                    if not self.running: break
                    time.sleep(1)
            except Exception as e:
                logging.error(f"Loop Error: {e}")
                time.sleep(10)

    def safe_sync(self):
        try:
            if self.bridge:
                self.bridge.perform_sync()
                self.last_sync = datetime.datetime.now().strftime("%H:%M:%S")
                if self.icon:
                    self.icon.title = f"MailTrackerPro (Last Sync: {self.last_sync})"
        except Exception as e:
            logging.error(f"Sync Thread Error: {e}")

    def on_sync_now(self, icon, item):
        logging.info("Manual sync triggered from tray.")
        threading.Thread(target=self.safe_sync, daemon=True).start()
        icon.notify("Sync process started in background.", "MailTrackerPro")

    def on_view_logs(self, icon, item):
        if os.path.exists(log_file):
            os.system(f'start powershell -NoExit -Command "Get-Content \'{log_file}\' -Wait -Tail 50"')
        else:
            icon.notify("Log file not found.", "MailTrackerPro")

    def on_quit(self, icon, item):
        logging.info("Shutting down...")
        self.running = False
        if self.bridge:
            try: self.bridge.update_bridge_status("offline")
            except: pass
        if self.icon:
            self.icon.stop()
        os._exit(0)

    def start(self):
        image = self._create_icon_image('ok' if self.bridge else 'warn')
        menu = pystray.Menu(
            pystray.MenuItem("Sync Now", self.on_sync_now),
            pystray.MenuItem("View Live Logs", self.on_view_logs),
            pystray.MenuItem("Quit Bridge", self.on_quit)
        )
        self.icon = pystray.Icon("MailTrackerPro", image, "MailTrackerPro Bridge", menu)
        
        # Start Thread
        t = threading.Thread(target=self.run_bridge_loop, daemon=True)
        t.start()
        
        logging.info("Tray icon starting...")
        try:
            self.icon.run()
        except Exception as e:
            logging.critical(f"Tray Icon Crash: {e}")
            self.on_quit(None, None)

if __name__ == "__main__":
    if is_already_running():
        logging.warning("MailTrackerPro Bridge is already running! (Mutex Locked)")
        # Show alert if possible or just exit
        sys.exit(0)

    # Pre-init bridge
    bridge_obj = None
    try:
        bridge_obj = BridgeLogic()
    except Exception as e:
        logging.error(f"Initial Bridge Init Failed: {e}")

    app = BridgeTrayApp(bridge_obj)
    app.start()
