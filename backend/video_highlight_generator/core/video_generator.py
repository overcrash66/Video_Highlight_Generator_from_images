from moviepy import ImageClip, concatenate_videoclips, AudioFileClip, concatenate_audioclips, vfx
# from moviepy.audio.fx.all import audio_loop # Removed in v2?
# Try to import audio_loop from where it might be, or use method
try:
    from moviepy.audio.fx.audio_loop import audio_loop
except ImportError:
    try:
        from moviepy.audio.fx.loop import loop as audio_loop
    except ImportError:
        # Fallback or maybe it's a method now
        audio_loop = None
import os
import random
from PIL import Image, ImageDraw, ImageFont
import numpy as np

import proglog

class CallbackLogger(proglog.ProgressBarLogger):
    def __init__(self, callback=None):
        super().__init__()
        self.progress_func = callback

    def bars_callback(self, bar, attr, value, old_value=None):
        if self.progress_func:
            # bar is usually 't' for time
            percentage = (value / self.bars[bar]['total']) * 100
            self.progress_func(percentage)

    def log(self, message):
        pass # Optional: log messages

from datetime import datetime
from PIL import Image, ImageDraw, ImageFont, ExifTags
import time

def get_image_date(image_path):
    try:
        image = Image.open(image_path)
        exif = image._getexif()
        if exif:
            for tag, value in exif.items():
                decoded = ExifTags.TAGS.get(tag, tag)
                if decoded == 'DateTimeOriginal' or decoded == 'DateTime':
                    return datetime.strptime(value, '%Y:%m:%d %H:%M:%S')
    except Exception as e:
        pass
        
    # Fallback to file modification time
    timestamp = os.path.getmtime(image_path)
    return datetime.fromtimestamp(timestamp)

class VideoGenerator:
    def __init__(self):
        pass

    def generate_video(self, image_paths, audio_path, output_path, resolution=(1920, 1080), audio_start=0.0, audio_end=None, image_duration=3.0, title_text="", progress_callback=None):
        try:
            clips = []
            
            # Prepare font for title if needed
            title_font = None
            date_font = None
            
            try:
                # Try to load a default font
                font_paths = [
                    "C:/Windows/Fonts/arial.ttf", # Windows
                    "C:/Windows/Fonts/seguiemj.ttf", # Windows
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", # Linux
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", # Linux
                    "/System/Library/Fonts/Helvetica.ttc", # macOS
                ]
                
                font_path = None
                for path in font_paths:
                    if os.path.exists(path):
                        font_path = path
                        break
                
                if font_path:
                    print(f"Loading font from: {font_path}")
                    title_font = ImageFont.truetype(font_path, 100)
                    date_font = ImageFont.truetype(font_path, 70)
                else:
                    print("Warning: Custom fonts not found, using default (tiny) font.")
                    title_font = ImageFont.load_default()
                    date_font = ImageFont.load_default()
            except Exception as e:
                print(f"Error loading font: {e}")
                title_font = ImageFont.load_default()
                date_font = ImageFont.load_default()

            for i, img_path in enumerate(image_paths):
                # Create clip, resize to fit resolution (maintaining aspect ratio), and center on black background
                # Use custom duration
                duration_per_image = float(image_duration)
                
                # Get date string
                img_date = get_image_date(img_path)
                date_str = img_date.strftime("%B %d, %Y")
                
                # Open and resize image first to ensure consistent text size
                pil_img = Image.open(img_path).convert("RGBA")
                w, h = pil_img.size
                target_w, target_h = resolution
                
                # Scale to fit
                scale = min(target_w / w, target_h / h)
                new_w = int(w * scale)
                new_h = int(h * scale)
                
                pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
                # Create text layer
                txt_img = Image.new("RGBA", pil_img.size, (255, 255, 255, 0))
                d = ImageDraw.Draw(txt_img)
                
                # Update dimensions
                w, h = pil_img.size
                
                # Draw Title (only on first image)
                if i == 0:
                    print(f"Processing first image. Title text: '{title_text}'")
                    if title_text:
                        print(f"Drawing title: {title_text}")
                        bbox = d.textbbox((0, 0), title_text, font=title_font)
                        text_w = bbox[2] - bbox[0]
                        text_h = bbox[3] - bbox[1]
                        
                        x = (w - text_w) / 2
                        y = h - text_h - 100 # 100px padding from bottom
                        
                        # Draw shadow
                        d.text((x+2, y+2), title_text, font=title_font, fill=(0, 0, 0, 200))
                        # Draw text
                        d.text((x, y), title_text, font=title_font, fill=(255, 255, 255, 255))
                
                # Draw Date (on all images)
                bbox = d.textbbox((0, 0), date_str, font=date_font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
                
                x = w - text_w - 30
                y = h - text_h - 30
                
                # Draw shadow
                d.text((x+2, y+2), date_str, font=date_font, fill=(0, 0, 0, 200))
                # Draw text
                d.text((x, y), date_str, font=date_font, fill=(255, 255, 255, 255))
                
                out = Image.alpha_composite(pil_img, txt_img)
                clip = ImageClip(np.array(out.convert("RGB"))).with_duration(duration_per_image)
                
                # Center (MoviePy handles positioning if clip is smaller than screen, 
                # but we usually want to fill or fit. Here we fit.)
                clip = clip.with_position("center")
                
                # Apply fade in/out for smooth transitions
                clip = clip.with_effects([vfx.FadeIn(0.5), vfx.FadeOut(0.5)])
                
                clips.append(clip)

            # Concatenate clips
            # method="compose" is safer for different sizes
            final_clip = concatenate_videoclips(clips, method="compose")
            
            # Add audio
            if audio_path and os.path.exists(audio_path):
                audio = AudioFileClip(audio_path)
                
                # Handle Trimming
                if audio_start > 0 or (audio_end is not None and audio_end > 0):
                    start = audio_start
                    end = audio_end if audio_end is not None and audio_end > 0 else audio.duration
                    # Ensure end is within bounds
                    end = min(end, audio.duration)
                    if start < end:
                        audio = audio.subclipped(start, end)
                
                # Loop audio if shorter than video
                if audio.duration < final_clip.duration:
                    # Manual loop
                    n_loops = int(final_clip.duration / audio.duration) + 1
                    audio = concatenate_audioclips([audio] * n_loops).subclipped(0, final_clip.duration)
                else:
                    audio = audio.subclipped(0, final_clip.duration)
                final_clip = final_clip.with_audio(audio)

            # Write file
            logger = None
            if progress_callback:
                logger = CallbackLogger(progress_callback)
            
            final_clip.write_videofile(output_path, fps=24, codec='libx264', audio_codec='aac', logger=logger or 'bar')
            return True
        except Exception as e:
            print(f"Error generating video: {e}")
            return False
