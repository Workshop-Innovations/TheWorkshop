import io
import modal
from fastapi import Request, Response, HTTPException

# 1. Define the environment and dependencies
# Real-ESRGAN requires some system libraries for OpenCV and PyTorch
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("libgl1", "libglib2.0-0", "wget")
    .pip_install(
        "torch", 
        "torchvision", 
        "torchaudio", 
        "opencv-python-headless",
        "Pillow",
        "realesrgan",
        "basicsr",
        "facexlib",
        "gfpgan"
    )
    .run_commands(
        # Download the pre-trained model weights into the container image
        "wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth -O /root/RealESRGAN_x4plus.pth"
    )
)

app = modal.App("theworkshop-image-upscaler")

# 2. Define the upscaler class to load the model once per container
@app.cls(image=image, gpu="T4", container_idle_timeout=300)
class Upscaler:
    @modal.enter()
    def load_model(self):
        import torch
        from basicsr.archs.rrdbnet_arch import RRDBNet
        from realesrgan import RealESRGANer

        # Initialize the model architecture
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        
        # Load the pre-downloaded weights
        model_path = "/root/RealESRGAN_x4plus.pth"
        
        # Initialize the upscaler
        self.upsampler = RealESRGANer(
            scale=4,
            model_path=model_path,
            dni_weight=None,
            model=model,
            tile=0,
            tile_pad=10,
            pre_pad=0,
            half=True, # Use FP16 for speed on T4
            gpu_id=0
        )
        print("Model loaded successfully!")

    @modal.method()
    def process_image(self, image_bytes: bytes) -> bytes:
        import cv2
        import numpy as np
        
        # 1. Convert incoming bytes to OpenCV image (numpy array)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image bytes")

        # 2. Run the upscaler
        # out scale is 4x by default. We can set outscale=2 to avoid making it excessively large
        output, _ = self.upsampler.enhance(img, outscale=2)

        # 3. Convert back to bytes (PNG to preserve quality)
        success, encoded_image = cv2.imencode('.png', output)
        if not success:
            raise ValueError("Failed to encode upscaled image")
            
        return encoded_image.tobytes()

# 3. Define the Webhook endpoint for FastAPI to call
@app.function(image=image)
@modal.web_endpoint(method="POST")
async def upscale_endpoint(request: Request):
    """
    Accepts raw image bytes via POST and returns the upscaled image bytes.
    """
    try:
        body = await request.body()
        if not body:
            raise HTTPException(status_code=400, detail="No image bytes provided in request body")
            
        print(f"Received image of size {len(body)} bytes. Upscaling...")
        
        # Call the GPU class method
        upscaler = Upscaler()
        upscaled_bytes = upscaler.process_image.remote(body)
        
        print(f"Upscaling complete. Returning {len(upscaled_bytes)} bytes.")
        return Response(content=upscaled_bytes, media_type="image/png")
        
    except Exception as e:
        print(f"Upscale error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
