import subprocess
import os
from pydub import AudioSegment
from pathlib import Path
from config import settings

class AudioProcessor:
    @staticmethod
    def enhance_audio(input_path: str, output_path: str) -> bool:
        try:
            # Convert input to wav if it's not already
            audio = AudioSegment.from_file(input_path)
            temp_wav = input_path + '.wav'
            audio.export(temp_wav, format='wav')
            
            # Get full model path
            model_path = Path(settings.models_dir) / settings.rnnoise_model_path
            
            # Apply RNNoise enhancement
            command = [
                'ffmpeg', '-y',
                '-i', temp_wav,
                '-af', f"arnndn=m='{model_path}'",
                '-ar', '16000',  # Required sample rate for Whisper
                output_path
            ]
            
            subprocess.run(command, check=True, capture_output=True)
            
            # Clean up temporary file
            if os.path.exists(temp_wav):
                os.remove(temp_wav)
                
            return True
        except Exception as e:
            print(f"Error enhancing audio: {str(e)}")
            return False
