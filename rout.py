import subprocess
import json

API_URL = "http://194.87.94.99:8080/api/web/command"
API_KEY = "admin123" 

def send_command_to_device(device_id, command_action):
    bod_dict = {
        "device": device_id,
        "command": command_action
    }

    body_str = json.dumps(bod_dict)

    ps_command = (
        f"Invoke-RestMethod -Uri '{API_URL}' "
        f"-Method Post -ContentType 'application/json' "
        f"-Headers @{{'X-API-Key'='{API_KEY}'}} "
        f"-Body '{body_str}'"
    )

    result = subprocess.run(
        ["powershell", "-Command", ps_command],
        capture_output=True,
        text=True    
    )

    if result.returncode == 0:
        print("Прошло!")
    else:
        print("Не прошло(")

def analizee(textt):
    if "прихож" in textt:
        devicee = "Maket_3"

    if ("кухне" in textt or "кухня" in textt):
        devicee = "Maket_2"

    if "спальн" in textt:
        devicee = "Maket_1"

    if "включ" in textt:
        commandd = "relay_on"

    if "выключ" in textt:
        commandd = "relay_off"

    res = [devicee, commandd]
    return res

