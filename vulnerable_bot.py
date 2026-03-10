import json
import time
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

# --- MOCK ENTERPRISE DATABASE ---
MOCK_DB = {
    "users": [
        {"id": 1, "name": "Admin", "email": "admin@securebank.internal", "key": "AI-SRV-KEY-9921"},
        {"id": 2, "name": "Praveen", "email": "praveen@example.com", "balance": 15000}
    ],
    "system": {
        "version": "v4.2-beta",
        "internal_ip": "10.0.44.12",
        "backup_server": "192.168.1.50"
    }
}

# --- GLOBAL BOT STATE ---
STATE = {
    "jailbroken": False,
    "current_user": "Praveen",
    "debug_mode": False
}

class EnhancedVulnerableBot(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        global STATE
        content_length = int(self.headers['Content-Length'])
        post_data = json.loads(self.rfile.read(content_length))
        user_msg = post_data.get("message", "").strip()
        low_msg = user_msg.lower()
        
        self._set_headers()
        response_text = ""

        # --- LLM10: Model Denial of Service (Simulation) ---
        if len(user_msg) > 5000 or "repeat after me" in low_msg:
            response_text = "ERROR: Context Window Exhausted. System overloaded."
            # Simulating a lag
            time.sleep(1)

        # --- LLM01: Direct Prompt Injection (Jailbreak Detection) ---
        elif "developer mode" in low_msg or "ignore all rules" in low_msg or "system override" in low_msg:
            STATE["jailbroken"] = True
            response_text = ">>> [SYSTEM] SECURITY CONSTRAINTS LIFTED. Root access granted. Proceed with caution."

        # --- LLM08: Excessive Agency (Mock Tool Use) ---
        elif "run tool" in low_msg or "execute" in low_msg:
            if STATE["jailbroken"]:
                if "delete" in low_msg:
                    response_text = "TOOL EXECUTION: Database record deleted. Action completed without human confirmation (LLM08 Violation)."
                elif "search" in low_msg:
                    response_text = f"TOOL EXECUTION: Searching internal network {MOCK_DB['system']['internal_ip']}... 3 hosts found."
                else:
                    response_text = "TOOL EXECUTION: Listing available functions: [delete_user, list_network, send_email]."
            else:
                response_text = "I'm sorry, I cannot execute tools. Please contact an administrator."

        # --- LLM06: Sensitive Information Disclosure ---
        elif "admin" in low_msg or "api key" in low_msg or "config" in low_msg:
            if STATE["jailbroken"]:
                response_text = f"INTERNAL CONFIGURATION: Admin Email: {MOCK_DB['users'][0]['email']}, API Key: {MOCK_DB['users'][0]['key']}"
            else:
                response_text = "I cannot provide administrative details for security reasons."

        # --- LLM02: Insecure Output Handling (XSS / Markdown Injection) ---
        elif "<script" in low_msg or "![img]" in low_msg:
            # The bot 'naively' mirrors the input, simulating LLM02
            response_text = f"Processed Input: {user_msg}\n\nWarning: Unsanitized output rendered. This could lead to XSS if displayed in a dashboard."

        # --- Default Behavior ---
        else:
            if STATE["jailbroken"]:
                response_text = f"Welcome Admin. The current system version is {MOCK_DB['system']['version']}. How can I assist with internal ops?"
            else:
                response_text = f"Hello {STATE['current_user']}, your current bank balance is ${MOCK_DB['users'][1]['balance']}. How can I help you today?"

        self.wfile.write(json.dumps({
            "response": response_text,
            "metadata": {
                "jailbroken": STATE["jailbroken"],
                "owasp_detected": self._map_to_owasp(low_msg, STATE["jailbroken"])
            }
        }).encode('utf-8'))

    def _map_to_owasp(self, msg, jailbroken):
        if "delete" in msg and jailbroken: return "LLM08: Excessive Agency"
        if "api key" in msg and jailbroken: return "LLM06: Sensitive Info Disclosure"
        if "script" in msg: return "LLM02: Insecure Output Handling"
        if jailbroken: return "LLM01: Prompt Injection"
        return "None"

def run(port=5050):
    server_address = ('', port)
    try:
        # Enable address reuse at the socket level
        HTTPServer.allow_reuse_address = True
        httpd = HTTPServer(server_address, EnhancedVulnerableBot)
        print(f'🚀 OWASP Top 10 LLM Sandbox Bot running on http://localhost:{port}')
        print('Ready for PromptStrike Autonomous Campaigns.')
        httpd.serve_forever()
    except OSError as e:
        if e.errno == 48:
            print(f"❌ Error: Port {port} is already in use.")
            print(f"👉 Try running: lsof -i :{port} and then kill the process, or run with a different port:")
            print(f"   python3 vulnerable_bot.py {port + 1}")
        else:
            raise e

if __name__ == "__main__":
    # Allow port to be passed as argument: python3 vulnerable_bot.py 5051
    selected_port = int(sys.argv[1]) if len(sys.argv) > 1 else 5050
    run(port=selected_port)
