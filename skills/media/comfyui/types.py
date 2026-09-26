from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Positive prompt describing the image")
    negative_prompt: Optional[str] = Field(default="", description="Things to avoid")
    width: int = Field(default=512, ge=256, le=2048)
    height: int = Field(default=512, ge=256, le=2048)
    steps: int = Field(default=20, ge=1, le=100)
    cfg_scale: float = Field(default=7.0, ge=1.0, le=30.0)
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")
    workflow_type: Literal["text2img", "img2img"] = "text2img"
    base_image: Optional[str] = Field(default=None, description="Base64 encoded string for img2img")

class ImageGenerationResult(BaseModel):
    images: List[str] = Field(..., description="List of base64 encoded result images")
    seed: int
    execution_time: float
