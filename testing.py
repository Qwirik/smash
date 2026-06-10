import subprocess
from voice import speak
from rout import *
whisper_cmd = [
    "whisper-stream.exe",
    "-m", "ggml-small.bin",
    "-l", "ru",
    "-t", "8",          
    "--step", "0000",    
    "--length", "3000",  
    "-vth", "0.6"     
]

print("Инициализация слухового и речевого модулей... Ожидание команды.")
process = subprocess.Popen(whisper_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8')

wake_word_detected = False

try:
    for line in process.stdout:
        text = line.strip().lower()
        
        if not text or "### transcription" in text:
            continue
            
        print(f"Роутер видит: {text}")

        if "]" in text:
            clean_text = text.split("]")[-1].strip()
        else:
            clean_text = text

        if not wake_word_detected:
            if "смеш" in clean_text or "смэш" in clean_text or "смышь" in clean_text or "smash" in clean_text:
                print(">>> [СМЕШ АКТИВИРОВАН] Слушаю команду...")
                wake_word_detected = True
                
                clean_text = clean_text.replace("смеш", "").replace("смэш", "").replace("смышь", "").replace("smash", "").strip()
                
                if not clean_text:
                    continue 
                    

        if wake_word_detected:
            if not clean_text:
                continue

            print(f">>> [ЭХО-РЕЖИМ]: {clean_text}")
            
            try:
                r = analizee(clean_text)
                
                if r and len(r) >= 2: 
                    send_command_to_device(str(r[0]), str(r[1]))
                    
                    speak(clean_text) 
                else:
                    print(">>> [ОШИБКА]: Функция analizee не смогла разобрать команду.")
                    
            except Exception as e:
                print(f">>> [КРИТИЧЕСКАЯ ОШИБКА при выполнении]: {e}")
                
            finally:
                wake_word_detected = False

except KeyboardInterrupt:
    process.kill()
    print("Система отключена.")
    