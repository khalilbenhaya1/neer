from .types import ImageGenerationRequest, ImageGenerationResult
from .adapter import ComfyUIAdapter
from .workflows import WorkflowManager
import os
import base64
import time

# Assuming a hypothetical base class for Neer Skills
class BaseSkill:
    pass

class ComfyUISkill(BaseSkill):
    name = "comfyui_image_generation"
    description = "Generate images using local Stable Diffusion via ComfyUI"
    
    def __init__(self):
        self.adapter = ComfyUIAdapter()
        current_dir = os.path.dirname(os.path.abspath(__file__))
        defaults_dir = os.path.join(current_dir, "defaults")
        self.workflow_manager = WorkflowManager(defaults_dir)

    def generate_image(self, request: ImageGenerationRequest) -> ImageGenerationResult:
        """
        Generates an image based on the prompt.
        """
        start_time = time.time()
        
        # select workflow
        if request.workflow_type == "text2img":
            workflow, used_seed = self.workflow_manager.prepare_text2img(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                seed=request.seed,
                steps=request.steps,
                cfg=request.cfg_scale
            )
        else:
             raise NotImplementedError("Only text2img supported in this demo")

        # execute
        image_data_list = self.adapter.generate(workflow)
        
        # convert to base64 strings
        b64_images = [base64.b64encode(img).decode('utf-8') for img in image_data_list]
        
        execution_time = time.time() - start_time
        
        return ImageGenerationResult(
            images=b64_images,
            seed=used_seed,
            execution_time=execution_time
        )
