import json
import os
import random
from typing import Optional

class WorkflowManager:
    def __init__(self, defaults_dir: str):
        self.defaults_dir = defaults_dir
        self.workflows = {}
        self._load_defaults()

    def _load_defaults(self):
        for filename in os.listdir(self.defaults_dir):
            if filename.endswith(".json"):
                name = filename[:-5]
                with open(os.path.join(self.defaults_dir, filename), 'r') as f:
                    self.workflows[name] = json.load(f)

    def get_workflow(self, name: str) -> dict:
        if name not in self.workflows:
             raise ValueError(f"Workflow '{name}' not found")
        return self.workflows[name].copy()

    def prepare_text2img(self, prompt: str, negative_prompt: str = "", seed: Optional[int] = None, steps: int = 20, cfg: float = 7.0):
        workflow = self.get_workflow("text2img")
        
        # Simple heuristic to find nodes - in a real app, use IDs or better markers
        # Assumes standard ComfyUI default workflow structure or similar
        
        # Inject Seed
        if seed is None:
            seed = random.randint(1, 1000000000000)
            
        for node_id, node in workflow.items():
            class_type = node.get("class_type", "")
            
            # KSampler
            if class_type == "KSampler":
                node["inputs"]["seed"] = seed
                node["inputs"]["steps"] = steps
                node["inputs"]["cfg"] = cfg
            
            # CLIP Text Encode (Positive)
            # This logic is fragile without fixed IDs; in production, use fixed IDs from template
            if class_type == "CLIPTextEncode" and node_id == "6": 
                node["inputs"]["text"] = prompt

            # CLIP Text Encode (Negative)
            if class_type == "CLIPTextEncode" and node_id == "7":
                node["inputs"]["text"] = negative_prompt

            # Empty Latent Image
            if class_type == "EmptyLatentImage":
                node["inputs"]["width"] = 512 # Parametrize access needed
                node["inputs"]["height"] = 512

        return workflow, seed
